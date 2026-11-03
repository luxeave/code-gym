---
name: generate-practice
description: Turn one annotated markdown Note in notes/ into a Practice bundle (soal.md, scaffold.<ext>, solution.json) under practices/<slug>/. Use when the user says "generate practice", "make a drill from this note", or passes a notes/*.md path.
---

# generate-practice

Input: a path to one Note, e.g. `notes/generics.md`. Read `GLOSSARY.md` first for the terms used here.

## Output

Write three files to `practices/<slug>/`, where `<slug>` is the Note's basename without `.md` (must match `^[a-z0-9-]+$`). Overwrite existing artifacts. Never touch `practices/<slug>/attempts/`.

### `soal.md`

Markdown. One heading with the title, then the Soal: what the finished Scaffold must achieve, stated as a task for the reader. Include expected usage or expected output so the reader can self-check. No solution code.

### `scaffold.<ext>`

`<ext>` = the language of the Note's fenced blocks (`ts`, `py`, `go`, ...). One file of incomplete code. Rules:

- Keep imports, usage lines, and any code the Note already shows that is not the concept being drilled.
- Replace each piece the reader must write with a Todo marker followed by three empty lines. Marker format: a single-line comment in the file's language containing `TODO-NN: <title>`, NN zero-padded from `01`.

  ```ts
  // TODO-01: declare a generic function `first` that returns the first element


  ```

- 3 to 6 Todos. Order them so each builds on the one before. Each Todo is one coherent chunk (a type, a function, a method), never a single token.
- No other `TODO-` text anywhere in the file.

### `solution.json`

```json
{
  "slug": "generics",
  "title": "Generics in TypeScript",
  "language": "ts",
  "todos": [
    {
      "id": "TODO-01",
      "title": "declare a generic function `first` that returns the first element",
      "hint": "A nudge that names the concept, not the code.",
      "solution": "function first<T>(items: T[]): T | undefined {\n  return items[0];\n}"
    }
  ]
}
```

- `todos` in the same order and with the same `id` and `title` as the markers in the Scaffold.
- `solution` is exactly the code that belongs under that marker, nothing else. Splicing every `solution` under its marker must produce a complete, compiling file.
- `hint` never contains the solution code.

## Check before finishing

1. Marker count in Scaffold equals `todos.length`, ids match in order.
2. Splice solutions into the Scaffold and confirm it is complete code (for `ts`, run `bun x tsc --noEmit` on a temp copy if available).
3. `soal.md` contains no solution code.
