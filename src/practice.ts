// Pure helpers shared by server and client. Terms per GLOSSARY.md.

export type Todo = { id: string; title: string; hint: string; solution: string };
export type Solution = { slug: string; title: string; language: string; todos: Todo[] };

export type Marker = { id: string; title: string; line: number };

const MARKER = /TODO-(\d\d)\s*:?\s*(.*?)\s*(?:\*\/|-->)?\s*$/;

/** Every marker line in code, in file order. Line numbers are 0-based. */
export function parseMarkers(code: string): Marker[] {
  const out: Marker[] = [];
  code.split("\n").forEach((text, line) => {
    const m = MARKER.exec(text);
    if (m) out.push({ id: `TODO-${m[1]}`, title: m[2], line });
  });
  return out;
}

/** Text between each marker and the next (or end of file), keyed by Todo id. */
export function extractRegions(code: string): Record<string, string> {
  const lines = code.split("\n");
  const markers = parseMarkers(code);
  const out: Record<string, string> = {};
  markers.forEach((m, i) => {
    const end = i + 1 < markers.length ? markers[i + 1].line : lines.length;
    out[m.id] = lines.slice(m.line + 1, end).join("\n").trim();
  });
  return out;
}

/** Scaffold with each Todo region replaced by its Solution. */
export function spliceSolution(scaffold: string, todos: Todo[]): string {
  const lines = scaffold.split("\n");
  const markers = parseMarkers(scaffold);
  const byId = new Map(todos.map((t) => [t.id, t.solution]));
  const out: string[] = [];
  let cursor = 0;
  markers.forEach((m, i) => {
    const end = i + 1 < markers.length ? markers[i + 1].line : lines.length;
    out.push(...lines.slice(cursor, m.line + 1), byId.get(m.id) ?? "", "");
    cursor = end;
  });
  out.push(...lines.slice(cursor));
  return out.join("\n");
}

/** Nearest marker at or above the cursor line; first marker when cursor is above all of them. */
export function activeTodo(markers: Marker[], cursorLine: number): Marker | undefined {
  let found = markers[0];
  for (const m of markers) if (m.line <= cursorLine) found = m;
  return found;
}

export function isSlug(s: string): boolean {
  return /^[a-z0-9-]+$/.test(s);
}

export function assertSolution(x: unknown): Solution {
  const s = x as Solution;
  const ok =
    s && typeof s.slug === "string" && typeof s.title === "string" && typeof s.language === "string" &&
    Array.isArray(s.todos) &&
    s.todos.every((t) => t && ["id", "title", "hint", "solution"].every((k) => typeof (t as any)[k] === "string"));
  if (!ok) throw new Error("solution.json: expected { slug, title, language, todos: [{ id, title, hint, solution }] }");
  return s;
}
