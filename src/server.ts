import { readdir, mkdir } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import index from "./client/index.html";
import { assertSolution, extractRegions, isPracticePath, type Solution } from "./practice";

const ROOT = join(import.meta.dir, "..", "practices");

const json = (data: unknown, status = 200) => Response.json(data, { status });
const fail = (message: string, status: number) => json({ error: message }, status);

export function createServer(root = ROOT, port = Number(process.env.PORT ?? 3000)) {
  async function loadSolution(slug: string): Promise<Solution> {
    return assertSolution(await Bun.file(join(root, slug, "solution.json")).json());
  }

  async function listAttempts(slug: string) {
    const dir = join(root, slug, "attempts");
    const names = (await readdir(dir).catch(() => [] as string[])).filter((n) => n.endsWith(".json")).sort();
    return Promise.all(names.map((n) => Bun.file(join(dir, n)).json()));
  }

  async function withSlug(slug: string, fn: (slug: string) => Promise<Response>) {
    if (!isPracticePath(slug)) return fail("bad practice path", 400);
    try {
      return await fn(slug);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return fail(msg, /ENOENT/.test(msg) ? 404 : 500);
    }
  }

  return Bun.serve({
    port,
    development: process.env.NODE_ENV !== "production",
    routes: {
      "/": index,
      "/p/*": index,

      "/api/practices": async () => {
        const files = await Array.fromAsync(new Bun.Glob("**/solution.json").scan({ cwd: root }));
        const slugs = files.map(dirname).filter(isPracticePath).sort();
        const items = await Promise.all(
          slugs.map(async (slug) => {
            try {
              const { title, language } = await loadSolution(slug);
              return { slug, title, language, attemptCount: (await listAttempts(slug)).length };
            } catch (e) {
              return { slug, title: slug, language: "", attemptCount: 0, error: e instanceof Error ? e.message : String(e) };
            }
          }),
        );
        return json(items);
      },

      "/api/practices/*": (req) => {
        const path = new URL(req.url).pathname.slice("/api/practices/".length);
        const attempts = path.endsWith("/attempts");
        const slug = attempts ? path.slice(0, -"/attempts".length) : path;
        return withSlug(slug, async (slug) => {
          if (req.method !== "GET" && !(attempts && req.method === "POST")) return fail("method not allowed", 405);
          const solution = await loadSolution(slug);
          if (!attempts) {
            const soal = await Bun.file(join(root, slug, "soal.md")).text();
            const scaffold = await Bun.file(join(root, slug, `scaffold.${solution.language}`)).text();
            return json({ soal, scaffold, solution });
          }
          if (req.method === "GET") return json(await listAttempts(slug));
          const body = (await req.json()) as { code: string; todos: { id: string; hintUsed: boolean; revealUsed: boolean }[] };
          if (typeof body?.code !== "string" || !Array.isArray(body.todos)) return fail("expected { code, todos }", 400);
          const regions = extractRegions(body.code);
          const attemptNo = Math.max(0, ...(await listAttempts(slug)).map((a) => Number(a.attemptNo) || 0)) + 1;
          const attempt = {
            slug,
            attemptNo,
            submittedAt: new Date().toISOString(),
            code: body.code,
            todos: body.todos.map((t) => ({ id: t.id, answer: regions[t.id] ?? "", hintUsed: !!t.hintUsed, revealUsed: !!t.revealUsed })),
          };
          const dir = join(root, slug, "attempts");
          await mkdir(dir, { recursive: true });
          await Bun.write(join(dir, `practice-${basename(slug)}-${String(attemptNo).padStart(2, "0")}.json`), JSON.stringify(attempt, null, 2) + "\n");
          return json(attempt, 201);
        });
      },
    },
  });
}

if (import.meta.main) {
  const server = createServer();
  console.log(`code-gym on ${server.url}`);
}
