# Code Gym: practice app

Status: ready-for-agent

Terms per `GLOSSARY.md`. Decisions from grilling session 2026-11-03.

## Goal

Local single-user app. A Note in `notes/` is turned into a Practice by the `generate-practice` skill (run manually in Claude Code). The app renders the Practice in three panes, lets the user fill the Scaffold, and saves each submit as an Attempt.

## Out of scope

- No Claude API in the app, no "generate" button, no staleness detection.
- No grading, no test running, no submit validation.
- No autosave of unsubmitted edits.
- No auth, no DB.

## Data on disk

```
notes/<slug>.md                               skill input only, app never reads
practices/<slug>/soal.md
practices/<slug>/scaffold.<ext>
practices/<slug>/solution.json                { slug, title, language, todos: [{ id, title, hint, solution }] }
practices/<slug>/attempts/practice-<slug>-NN.json
```

Attempt file:

```json
{
  "slug": "generics",
  "attemptNo": 1,
  "submittedAt": "2026-11-03T14:00:00.000Z",
  "code": "<full editor contents>",
  "todos": [{ "id": "TODO-01", "answer": "<text between this marker and the next>", "hintUsed": true, "revealUsed": false }]
}
```

All of it is committed to git.

## Marker rules

- Marker = any line whose comment contains `TODO-(\d\d)`. Title = text after `TODO-NN:` trimmed.
- Todo region = lines after its marker up to the next marker or end of file.
- Full solution = Scaffold with each region replaced by that Todo's `solution`. Derived at runtime, never stored.
- Active Todo = nearest marker at or above the cursor line; TODO-01 if cursor is above the first marker.

## Stack

- Bun 1.3 single process (ADR-0001): `Bun.serve({ routes })`, HTML import for the client, HMR in dev.
- React 18, `@uiw/react-codemirror`, `@codemirror/lang-javascript` (TS), `@codemirror/merge` for the diff.
- Layout at repo root: `package.json`, `src/server.ts`, `src/practice.ts` (pure: parse markers, extract regions, splice solution; `bun test`), `src/client/` (React), `src/client/index.html`.

## API

| Route | Does |
|---|---|
| `GET /api/practices` | `[{ slug, title, language, attemptCount }]` from each `practices/*/solution.json` |
| `GET /api/practices/:slug` | `{ soal, scaffold, solution }` (soal/scaffold as strings) |
| `GET /api/practices/:slug/attempts` | list of attempt files parsed |
| `POST /api/practices/:slug/attempts` | body `{ code, todos: [{ id, hintUsed, revealUsed }] }`; server computes `answer` per Todo, `attemptNo` = max existing + 1, writes file, returns the Attempt |

Slug validated `^[a-z0-9-]+$` on every route; 400 otherwise. Missing practice or malformed `solution.json`: 404 / 500 with message, client shows it.

## UI

- `/` home: list of Practices, title + attempt count, click opens `/p/:slug`.
- `/p/:slug` three panes matching `resources/codegym.png`:
  - Left: Soal rendered as markdown.
  - Middle: CodeMirror editor prefilled with Scaffold, language from `solution.language`; "submit" button bottom right.
  - Right: active Todo id + title, "hint" and "reveal" buttons; clicking shows that text/code below the buttons. Usage recorded in memory per Todo until submit.
- After submit: middle pane becomes a merge view, your code vs full solution; right pane shows "Attempt NN saved" and a "new attempt" button that resets editor to Scaffold and clears usage.

## Acceptance

1. `bun run dev` starts one process; home lists `generics` once `practices/generics/` exists.
2. Opening it shows Soal, Scaffold, TODO-01 active; moving cursor under TODO-03 marker switches sidebar.
3. hint/reveal show text; submit writes `practices/generics/attempts/practice-generics-01.json` with correct `answer` slices and usage flags; second submit writes `-02`.
4. Diff view shows user code vs spliced full solution.
5. `bun test` passes for `src/practice.ts`: marker parse, region extraction, splice, active-Todo lookup.
6. Running `generate-practice` on `notes/generics.md` yields a valid `practices/generics/` (first real fixture).
