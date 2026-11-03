import { describe, expect, test } from "bun:test";
import { activeTodo, extractRegions, parseMarkers, spliceSolution } from "./practice";

const scaffold = `import x from "y";
// TODO-01: declare first


const a = 1;
# TODO-02: second one
/* TODO-03: third */

`;

describe("parseMarkers", () => {
  test("finds markers in any comment syntax", () => {
    expect(parseMarkers(scaffold)).toEqual([
      { id: "TODO-01", title: "declare first", line: 1 },
      { id: "TODO-02", title: "second one", line: 5 },
      { id: "TODO-03", title: "third", line: 6 },
    ]);
  });
});

describe("extractRegions", () => {
  test("slices between markers and trims", () => {
    const filled = scaffold.replace("// TODO-01: declare first\n", "// TODO-01: declare first\nfunction f() {}\n");
    expect(extractRegions(filled)).toEqual({
      "TODO-01": "function f() {}\n\n\nconst a = 1;",
      "TODO-02": "",
      "TODO-03": "",
    });
  });
});

describe("spliceSolution", () => {
  test("replaces each region with its solution and keeps the rest", () => {
    const todos = [
      { id: "TODO-01", title: "", hint: "", solution: "const one = 1;" },
      { id: "TODO-02", title: "", hint: "", solution: "const two = 2;" },
      { id: "TODO-03", title: "", hint: "", solution: "const three = 3;" },
    ];
    expect(spliceSolution(scaffold, todos)).toBe(
      `import x from "y";\n// TODO-01: declare first\nconst one = 1;\n\n# TODO-02: second one\nconst two = 2;\n\n/* TODO-03: third */\nconst three = 3;\n`,
    );
  });
});

describe("activeTodo", () => {
  const markers = parseMarkers(scaffold);
  test("cursor above first marker gives TODO-01", () => expect(activeTodo(markers, 0)?.id).toBe("TODO-01"));
  test("cursor under a marker gives that marker", () => expect(activeTodo(markers, 4)?.id).toBe("TODO-01"));
  test("cursor on a marker line gives that marker", () => expect(activeTodo(markers, 5)?.id).toBe("TODO-02"));
  test("cursor at end gives last marker", () => expect(activeTodo(markers, 99)?.id).toBe("TODO-03"));
});
