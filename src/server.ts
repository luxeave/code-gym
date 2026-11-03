import { readdir, mkdir } from "node:fs/promises";
import { join } from "node:path";
import index from "./client/index.html";
import { assertSolution, extractRegions, isSlug, type Solution } from "./practice";

const ROOT = join(import.meta.dir, "..", "practices");

const json = (data: unknown, status = 200) => Response.json(data, { status });
const fail = (message: string, status: number) => json({ error: message }, status);

async function loadSolution(slug: string): Promise<Solution> {
  return assertSolution(await Bun.file(join(ROOT, slug, "solution.json")).json());
}

async function listAttempts(slug: string) {
  const dir = join(ROOT, slug, "attempts");
  const names = (await readdir(dir).catch(() => [] as string[])).filter((n) => n.endsWith(".json")).sort();
  return Promise.all(names.map((n) => Bun.file(join(dir, n)).json()));
}

async function withSlug(req: Bun.BunRequest<`/api/practices/:slug${string}`>, fn: (slug: string) => Promise<Response>) {
  const { slug } = req.params;
  if (!isSlug(slug)) return fail("bad slug", 400);
  try {
    return await fn(slug);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return fail(msg, /ENOENT/.test(msg) ? 404 : 500);
  }
}

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  development: process.env.NODE_ENV !== "production",
  routes: {
    "/": index,
    "/p/:slug": index,

    "/api/practices": async () => {
      const slugs = (await readdir(ROOT, { withFileTypes: true }).catch(() => [])).filter((d) => d.isDirectory()).map((d) => d.name);
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

    "/api/practices/:slug": (req) =>
      withSlug(req, async (slug) => {
        const solution = await loadSolution(slug);
        const soal = await Bun.file(join(ROOT, slug, "soal.md")).text();
        const scaffold = await Bun.file(join(ROOT, slug, `scaffold.${solution.language}`)).text();
        return json({ soal, scaffold, solution });
      }),

    "/api/practices/:slug/attempts": {
      GET: (req) => withSlug(req, async (slug) => json(await listAttempts(slug))),
      POST: (req) =>
        withSlug(req, async (slug) => {
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
          const dir = join(ROOT, slug, "attempts");
          await mkdir(dir, { recursive: true });
          await Bun.write(join(dir, `practice-${slug}-${String(attemptNo).padStart(2, "0")}.json`), JSON.stringify(attempt, null, 2) + "\n");
          return json(attempt, 201);
        }),
    },
  },
});

console.log(`code-gym on ${server.url}`);
