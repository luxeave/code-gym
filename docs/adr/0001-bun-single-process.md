---
status: accepted
---

# Bun serves API and bundles the React client in one process

The app is a single-user local tool. Instead of Vite dev server + separate API process, `Bun.serve({ routes })` serves the API routes and an HTML import that Bun bundles (React, HMR) itself. One `bun run dev`, one port, no proxy config. Trade-off: Bun's bundler is younger than Vite; if it bites (missing plugin, broken HMR), fall back to Vite with a proxy to the same route handlers. Requires Bun 1.2+.
