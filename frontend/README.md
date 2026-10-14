# EsgEasy — Frontend

React 19 + TypeScript + Vite web app for EsgEasy. It talks to the Spring Boot API in
[`../backend`](../backend); see the [root README](../README.md) for the full feature list and
domain logic.

## Run locally

Prerequisites: Node.js, and the backend running on `http://localhost:8080`.

```bash
npm install
cp .env.example .env.local     # set VITE_API_BASE_URL if the backend runs elsewhere
npm run dev                    # http://localhost:3000
```

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run lint` | TypeScript type-check (`tsc --noEmit`) |
| `npm run clean` | Remove `dist/` |

## Layout

- `src/contexts/` — `PlanContext` (tier gating), `AuthContext` (JWT session), toasts
- `src/api/` — one typed client per backend module
- `src/components/` — feature views; `ui/` holds shared primitives, `admin/` and `partner/` the
  operator and partner consoles
