# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**EsgEasy** — an ESG (Environmental, Social & Governance) reporting SaaS for Bursa Malaysia compliance. React frontend backed by a real Spring Boot service in `backend/` (Java, `pom.xml`, Docker) with REST controllers for auth, billing/Stripe, MFA, indicators, materiality, governance, IFRS S1/S2 & emissions, assurance, exports, support tickets, tenant/platform admin, and more.

## Commands

Run from `frontend/`:

```bash
npm install          # install dependencies
npm run dev          # dev server at http://localhost:3000
npm run build        # production build
npm run lint         # TypeScript type-check (tsc --noEmit) — no separate ESLint config
npm run clean        # remove dist/
```

Copy `frontend/.env.example` to `frontend/.env.local` and set `VITE_API_BASE_URL` if the backend isn't on `http://localhost:8080`.

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

`AuthContext.tsx` holds no `localStorage` calls — it drives auth entirely through `authApi` (JWT via `tokenStore`) against the real backend. The onboarding market selection determines the initial plan tier (SME → starter, ACE Market → growth, Main Market → issuer-ready). Default sandbox user is `sarvesh@esgeasy.my`.

### Route structure

- `/` `/pricing` `/about` — public pages (no auth required)
- `/login` `/register` `/onboarding` — auth flow
- `/admin` — superadmin panel, standalone (no sidebar)
- All other routes — wrapped in `AuthenticatedLayout`, which enforces auth and onboarding completion before rendering. Gated routes also wrap their view in `<UpgradeGate>`.

### Component layout

`AuthenticatedLayout` in `App.tsx` renders the collapsible sidebar + `AuthTopBar` + scrollable main content. It reads `usePlan()` and `useAuth()` directly to control which nav items appear.

Reusable primitives are in `src/components/ui/`. Feature views are flat in `src/components/`, each backed by a real API client in `src/api/`. `PlaceholderViews.tsx` — despite the filename — now only holds two real, API-wired views: `BillingView` (Stripe checkout/plan-change/invoices) and `SettingsView` (tabs container, including the inline `ProfileTab`/`SmtpSettingsTab`).
