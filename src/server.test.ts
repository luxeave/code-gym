import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "./server";
import { isPracticePath } from "./practice";

let root: string;
let server: ReturnType<typeof createServer>;
const paths = ["generics", "typescript/generics", "languages/typescript/advanced/generics"];

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "code-gym-"));
  for (const path of paths) {
    await mkdir(join(root, path), { recursive: true });
    await Bun.write(join(root, path, "solution.json"), JSON.stringify({ slug: "generics", title: "Generics", language: "ts", todos: [] }));
    await Bun.write(join(root, path, "soal.md"), "Task");
    await Bun.write(join(root, path, "scaffold.ts"), "// TODO-01: answer\n");
  }
  await Bun.write(join(root, paths[1], "attempts/practice-generics-01.json"), JSON.stringify({ slug: "generics", attemptNo: 1 }));
  server = createServer(root, 0);
});

afterAll(async () => {
  await server?.stop(true);
  if (root) await rm(root, { recursive: true, force: true });
});

const request = (path: string, init?: RequestInit) => fetch(new URL(path, server.url), init);

test("discovers practice bundles at any depth, excluding grouping folders", async () => {
  const items = await (await request("/api/practices")).json();
  expect(items.map((item: { slug: string }) => item.slug)).toEqual([...paths].sort());
  expect(items.find((item: { slug: string }) => item.slug === paths[1]).attemptCount).toBe(1);
});

test("loads flat and nested practices and serves their browser routes", async () => {
  for (const path of paths) {
    const practice = await (await request(`/api/practices/${path}`)).json();
    expect(practice.scaffold).toBe("// TODO-01: answer\n");
    const page = await request(`/p/${path}`);
    expect(page.status).toBe(200);
    expect(page.headers.get("content-type")).toContain("text/html");
  }
});

test("continues moved attempts in their own folder without affecting same-name practices", async () => {
  const response = await request(`/api/practices/${paths[1]}/attempts`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code: "// TODO-01: answer\n42", todos: [{ id: "TODO-01" }] }),
  });
  expect(response.status).toBe(201);
  const attempt = await response.json();
  expect(attempt.attemptNo).toBe(2);
  expect(attempt.slug).toBe(paths[1]);
  expect(await Bun.file(join(root, paths[1], "attempts/practice-generics-02.json")).json()).toEqual(attempt);
  expect(await (await request(`/api/practices/${paths[1]}/attempts`)).json()).toHaveLength(2);
  expect(await (await request("/api/practices/generics/attempts")).json()).toEqual([]);
});

test("rejects unsafe paths and does not create attempts for nonexistent practices", async () => {
  for (const path of ["", "../generics", "/generics", "ts//generics", "ts/../generics", "ts\\generics", "ts/%2e%2e/generics", "generics/"]) {
    expect(isPracticePath(path)).toBe(false);
  }
  expect((await request("/api/practices/ts//generics")).status).toBe(400);
  expect((await request("/api/practices/missing/attempts", {
    method: "POST", body: JSON.stringify({ code: "", todos: [] }),
  })).status).toBe(404);
});
