# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**EsgEasy** — a frontend-only ESG (Environmental, Social & Governance) reporting SaaS for Bursa Malaysia compliance. Scaffolded from Google AI Studio. The `backend/` directory is currently empty; all logic lives in `frontend/`.

## Commands

Run from `frontend/`:

```bash
npm install          # install dependencies
npm run dev          # dev server at http://localhost:3000
npm run build        # production build
npm run lint         # TypeScript type-check (tsc --noEmit) — no separate ESLint config
npm run clean        # remove dist/ and server.js
```

Set `GEMINI_API_KEY` in `frontend/.env.local` before running (copy from `.env.example`).

## Architecture

### Provider nesting order

`App.tsx` wraps everything in this order:

```
PlanProvider
  └── AuthProvider (receives plan + setPlan as props)
        └── HashRouter
              └── AppContent (routes)
```

`HashRouter` is intentional — all routes use `/#/path`. Do not swap to `BrowserRouter`.

### Subscription tiers

`PlanContext.tsx` owns the tier system. Three tiers in ascending order: `starter` → `growth` → `issuer-ready`. `FEATURE_REGISTRY` maps each feature key to its minimum required plan. Two gating functions:

- `hasFeature(key)` — returns false if the user's plan is below the feature's threshold (used by `UpgradeGate`)
- `isFeatureVisible(key)` — issuer-only features (`ifrs-s1-s2`, `climate-module`, `assurance-workspace`, `csi-export`) are hidden from sidebar entirely for lower tiers; all other features are visible but may be locked

### Auth

`AuthContext.tsx` is entirely localStorage-based (no real backend). Login accepts any email; the onboarding market selection determines the initial plan tier (SME → starter, ACE Market → growth, Main Market → issuer-ready). Default sandbox user is `sarvesh@esgeasy.my`.

### Route structure

- `/` `/pricing` `/about` — public pages (no auth required)
- `/login` `/register` `/onboarding` — auth flow
- `/admin` — superadmin panel, standalone (no sidebar)
- All other routes — wrapped in `AuthenticatedLayout`, which enforces auth and onboarding completion before rendering. Gated routes also wrap their view in `<UpgradeGate>`.

### Component layout

`AuthenticatedLayout` in `App.tsx` renders the collapsible sidebar + `AuthTopBar` + scrollable main content. It reads `usePlan()` and `useAuth()` directly to control which nav items appear.

Reusable primitives are in `src/components/ui/`. Feature views are flat in `src/components/`. Placeholder views that share a file live in `PlaceholderViews.tsx` (`TargetsView`, `ClimateModuleView`, `CsiExportView`, `TeamView`, `BillingView`, `SettingsView`).
