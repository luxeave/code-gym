import { useEffect, useMemo, useRef, useState } from "react";
import CodeMirror, { EditorView, type ViewUpdate } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { MergeView } from "@codemirror/merge";
import { EditorState, type Extension } from "@codemirror/state";
import { marked } from "marked";
import { activeTodo, isPracticePath, parseMarkers, spliceSolution, type Solution } from "../practice";

type Practice = { soal: string; scaffold: string; solution: Solution };
type Usage = Record<string, { hintUsed: boolean; revealUsed: boolean }>;
type Listing = { slug: string; title: string; attemptCount: number; error?: string };

// shortcut: only JS/TS highlighting, add a @codemirror/lang-* entry here when a Note in another language shows up
const langs: Record<string, () => Extension> = {
  ts: () => javascript({ typescript: true }),
  tsx: () => javascript({ typescript: true, jsx: true }),
  js: () => javascript(),
  jsx: () => javascript({ jsx: true }),
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? res.statusText);
  return body as T;
}

export function App() {
  const path = location.pathname.startsWith("/p/") ? location.pathname.slice(3) : "";
  return isPracticePath(path) ? <PracticeView slug={path} /> : <Home />;
}

function Home() {
  const [items, setItems] = useState<Listing[]>();
  const [err, setErr] = useState<string>();
  useEffect(() => {
    api<Listing[]>("/api/practices").then(setItems, (e) => setErr(e.message));
  }, []);
  if (err) return <pre className="err">{err}</pre>;
  return (
    <div className="home">
      <h1>Code Gym</h1>
      {!items ? (
        "loading…"
      ) : items.length === 0 ? (
        <p>No practices yet. Run the generate-practice skill on a note.</p>
      ) : (
        <ul>
          {items.map((p) => (
            <li key={p.slug}>
              <a href={`/p/${p.slug}`}>{p.title}</a> · {p.attemptCount} attempt{p.attemptCount === 1 ? "" : "s"}
              {p.error && <span className="err"> {p.error}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PracticeView({ slug }: { slug: string }) {
  const [p, setP] = useState<Practice>();
  const [err, setErr] = useState<string>();
  const [code, setCode] = useState("");
  const [cursorLine, setCursorLine] = useState(0);
  const [usage, setUsage] = useState<Usage>({});
  const [shown, setShown] = useState({ hint: false, reveal: false });
  const [attemptNo, setAttemptNo] = useState<number>();

  useEffect(() => {
    api<Practice>(`/api/practices/${slug}`).then(
      (x) => {
        setP(x);
        setCode(x.scaffold);
      },
      (e) => setErr(e.message),
    );
  }, [slug]);

  const markers = useMemo(() => parseMarkers(code), [code]);
  const active = activeTodo(markers, cursorLine);
  const todo = p?.solution.todos.find((t) => t.id === active?.id);
  const extensions = useMemo(() => (p && langs[p.solution.language] ? [langs[p.solution.language]()] : []), [p]);

  useEffect(() => setShown({ hint: false, reveal: false }), [active?.id]);

  if (err) return <pre className="err">{err}</pre>;
  if (!p) return <div className="home">loading…</div>;

  const use = (kind: "hint" | "reveal") => {
    if (!todo) return;
    setShown((s) => ({ ...s, [kind]: !s[kind] }));
    setUsage((u) => ({
      ...u,
      [todo.id]: {
        hintUsed: !!u[todo.id]?.hintUsed || kind === "hint",
        revealUsed: !!u[todo.id]?.revealUsed || kind === "reveal",
      },
    }));
  };

  const submit = async () => {
    const todos = p.solution.todos.map((t) => ({
      id: t.id,
      hintUsed: !!usage[t.id]?.hintUsed,
      revealUsed: !!usage[t.id]?.revealUsed,
    }));
    try {
      const a = await api<{ attemptNo: number }>(`/api/practices/${slug}/attempts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, todos }),
      });
      setAttemptNo(a.attemptNo);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const reset = () => {
    setCode(p.scaffold);
    setUsage({});
    setAttemptNo(undefined);
    setCursorLine(0);
  };

  const onUpdate = (vu: ViewUpdate) => {
    if (vu.selectionSet || vu.docChanged) {
      setCursorLine(vu.state.doc.lineAt(vu.state.selection.main.head).number - 1);
    }
  };

  return (
    <div className="gym">
      <section className="pane" dangerouslySetInnerHTML={{ __html: marked.parse(p.soal) as string }} />
      <section className="pane">
        {attemptNo === undefined ? (
          <>
            <div className="editor">
              <CodeMirror value={code} onChange={setCode} onUpdate={onUpdate} theme="dark" extensions={extensions} height="100%" />
            </div>
            <div className="toolbar">
              <button onClick={submit}>submit</button>
            </div>
          </>
        ) : (
          <>
            <Diff a={code} b={spliceSolution(p.scaffold, p.solution.todos)} extensions={extensions} />
            <div className="toolbar">
              <a href="/">home</a>
              <button onClick={reset}>new attempt</button>
            </div>
          </>
        )}
      </section>
      <aside className="pane">
        {attemptNo !== undefined ? (
          <h3>Attempt {String(attemptNo).padStart(2, "0")} saved</h3>
        ) : todo ? (
          <>
            <div className="todo-id">{todo.id}</div>
            <p className="todo-title">{todo.title}</p>
            <div className="pair">
              <button className={usage[todo.id]?.hintUsed ? "used" : ""} onClick={() => use("hint")}>
                hint
              </button>
              <button className={usage[todo.id]?.revealUsed ? "used" : ""} onClick={() => use("reveal")}>
                reveal
              </button>
            </div>
            {shown.hint && <p className="hint">{todo.hint}</p>}
            {shown.reveal && <pre className="reveal">{todo.solution}</pre>}
          </>
        ) : (
          <p className="err">No TODO markers found in editor.</p>
        )}
      </aside>
    </div>
  );
}

function Diff({ a, b, extensions }: { a: string; b: string; extensions: Extension[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const ro = [EditorState.readOnly.of(true), EditorView.editable.of(false), EditorView.theme({}, { dark: true }), ...extensions];
    const view = new MergeView({
      a: { doc: a, extensions: ro },
      b: { doc: b, extensions: ro },
      parent: ref.current,
      highlightChanges: true,
      gutter: true,
    });
    return () => view.destroy();
  }, [a, b, extensions]);
  return <div className="merge" ref={ref} />;
}
