import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PracticeList } from "./App";

test("groups practices under folder headings and preserves links, counts, and errors", () => {
  const html = renderToStaticMarkup(<PracticeList items={[
    { slug: "generics", title: "Root practice", attemptCount: 0 },
    { slug: "typescript/generics", title: "Generics", attemptCount: 1 },
    { slug: "typescript/functions", title: "Functions", attemptCount: 2, error: "Missing scaffold" },
    { slug: "typescript/advanced/types", title: "Types", attemptCount: 0 },
  ]} />);
  expect(html.match(/<h2>.*?<\/h2>/g)).toEqual([
    "<h2>General</h2>", "<h2>typescript</h2>", "<h2>typescript / advanced</h2>",
  ]);
  expect(html).toContain('href="/p/typescript/generics">Generics</a> · 1 attempt');
  expect(html).toContain('href="/p/typescript/functions">Functions</a> · 2 attempts');
  expect(html).toContain("Missing scaffold");
  expect(html).toContain('href="/p/generics"');
  expect(renderToStaticMarkup(<PracticeList items={[]} />)).toBe("");
});
