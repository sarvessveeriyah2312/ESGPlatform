# EsgEasy — ESG Reporting Platform

A multi-tenant ESG (Environmental, Social & Governance) reporting SaaS built for **Bursa Malaysia**
compliance — the Simplified ESG Disclosure Guide (SEDG), Bursa Main/ACE Market listing
requirements, and IFRS S1/S2 climate disclosures. Companies onboard by market classification and
plan tier, log sustainability data with an approval trail, run materiality assessments, track
governance/compliance obligations, and generate board-ready disclosure reports.

The project is a monorepo: a React frontend and a Spring Boot backend, developed together and
fully wired to each other (no mocked data in the frontend).

```
ESG/
├── frontend/   React 19 + TypeScript + Vite — the web app
└── backend/    Java 21 + Spring Boot 3 + PostgreSQL — the REST API
```

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4, React Router 7 (`HashRouter`), Lucide icons |
| Backend | Java 21, Spring Boot 3.3.5, Spring Security (stateless JWT), Spring Data JPA / Hibernate, PostgreSQL, Flyway |
| Reporting | Thymeleaf + OpenHTMLtoPDF (server-rendered PDF reports), Apache Commons CSV |
| Email | Spring Mail — per-company "bring your own SMTP" with a platform-wide fallback |
| Docs | springdoc-openapi (Swagger UI) |

## Features

- **Auth & tenancy** — JWT-based auth, one company per tenant, five roles (`COMPANY_ADMIN`,
  `COMPANY_CONTRIBUTOR`, `CONSULTANT`, `PLATFORM_ADMIN`, `SUPERADMIN`), tenant isolation enforced
  at the data-access layer via a Hibernate filter (not just the UI).
- **Subscription tiers** — `starter` → `growth` → `issuer-ready`, each unlocking more indicators,
  modules, and export formats. Plan is re-checked from the DB on every gated request, so a
  downgrade takes effect immediately.
- **ESG indicators** — per-company values with target tracking, an append-only audit trail
  (who/when/source), and a management sign-off/approval workflow.
- **Materiality assessment** — Identify → Prioritise → Validate, versioned snapshots (never
  mutated after creation), stakeholder engagement tracking.
- **Governance & compliance** — three-tier oversight structure, per-matter ownership, statutory
  policy tracking (Section 17A MACC Act, whistleblowing, board gender diversity) with due-date
  status.
- **IFRS S1/S2 climate module** — business segments, climate risk/opportunity register, Scope 1/2/3
  GHG ledger, governance/strategy/risk-management narrative (issuer-tier only).
  Scope 3 transition relief is computed server-side, not stored as an editable flag.
- **Assurance workspace** — fiscal-year sign-off gated on 100% indicator completion, with its own
  audit trail.
  
- **Reports & export** — three server-rendered PDF reports (Integrated ESG Disclosure, Materiality
  Assessment, Governance & Compliance), a raw indicator CSV ledger, and a Bursa CSI-compatible CSV
  (readiness aid, not a real submission channel).
- **Team management** — invite teammates by email with a secure, expiring, one-time invite link;
  pending-invite tracking with resend/revoke; role assignment.
- **Settings** — full profile (with photo upload), and per-company SMTP configuration with a
  "send test email" button so invites and notifications can be sent from your own domain.
- **Admin console** — a separate operator surface for `PLATFORM_ADMIN`/`SUPERADMIN` to manage
  tenants, plans, and platform-wide reference data.

## Domain logic — where to look

Most of what makes this a Bursa compliance tool (rather than a generic CRUD dashboard) lives in
the backend. Paths are relative to `backend/src/main/java/com/esgeasy/esg/`.

| Rule | Where | What it does |
|---|---|---|
| Disclosure framework resolution | `reference/MatterSetResolverService.java`, `reference/MatterSet.java` | Picks the applicable matter set from plan × market classification — SEDG for SMEs, Bursa Main Market or ACE Market sets for Issuer-Ready listed companies — plus the opt-in sector module (Growth and up). Every indicator, report and forecast is scoped through this. |
| Scope 3 transition relief | `reference/TransitionReliefRule.java` | Bursa's climate-first relief period (2 years Main Market, 3 years ACE Market) is seeded reference data and computed server-side, never a user-editable flag. |
| Monthly → annual aggregation | `reference/AggregationRule.java` | Each indicator declares how its disclosure figure is derived: `SUM`/`COUNT` for flows and events, `LATEST` for point-in-time snapshots, `AVERAGE` for rates, `DIRECT_ANNUAL` where monthly data makes no sense. |
| Live plan gating | `reference/PlanGateService.java`, `reference/FeatureFlag.java` | Feature access is re-read from the company row on every request, not trusted from the JWT, so a downgrade takes effect immediately. |
| Tenant isolation | `common/TenantOwnedEntity.java` | A Hibernate `@Filter` on `company_id` scopes every tenant-owned query at the data layer. |
| GHG ledger | `climate/EmissionActivityService.java`, `climate/EmissionFactor.java`, `climate/Scope3Category.java` | Activity quantity × factor from a global emission-factor library → tCO2e per entry, with Scope 3 broken out by category for IFRS S2. |
| IFRS S1/S2 | `climate/IfrsService.java`, `export/IfrsReportService.java` | Risk/opportunity register, business segments and governance/strategy/risk narratives rendered into standalone IFRS S1 and S2 disclosure PDFs. |
| Assurance sign-off | `assurance/AssuranceService.java` | Fiscal-year sign-off is refused until 100% of the company's applicable indicators have values, with a separate sign-off audit trail. |
| Bursa CSI export | `export/ExportService.java` | Produces a CSV that lines up with Bursa's Centralised Sustainability Intelligence (CSI) manual portal, marking each row ready or pending. |
| Trend forecasting | `forecasting/ForecastingService.java`, `forecasting/LinearTrend.java` | Least-squares projection of recorded annual values against linked performance targets, classified ON_TRACK / AT_RISK / OFF_TRACK. The math is deterministic; AI is only used for the optional narrative. |

Schema history is in `backend/src/main/resources/db/migration` (Flyway, applied on startup).

## Getting started

### Prerequisites

- Node.js (for the frontend)
- Java 21 (Temurin recommended) + Maven 3.9+ (for the backend)
- PostgreSQL 15+ running locally (Docker is optional, not required for local dev)

### 1. Backend

```bash
createdb esgeasy_esg          # one-time

cd backend
mvn spring-boot:run           # http://localhost:8080, 'dev' profile by default
```

Flyway migrations run automatically on startup — nothing to seed manually. Swagger UI is at
`http://localhost:8080/swagger-ui.html` once running (authenticate with a JWT from
`POST /api/v1/auth/login`).

Key environment variables (all optional locally — sane dev defaults are baked in):

| Variable | Purpose |
|---|---|
| `DB_USERNAME` / `DB_PASSWORD` | Override if your local Postgres isn't peer-auth as your OS user |
| `JWT_SECRET` | HMAC signing key for auth tokens — override before deploying anywhere non-local |
| `CORS_ALLOWED_ORIGINS` | Comma-separated origins allowed to call the API (defaults to the frontend dev server) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USERNAME` / `SMTP_PASSWORD` / `MAIL_FROM` | Platform-wide default outbound email — companies can also configure their own SMTP in-app under Settings |
| `APP_BASE_URL` | Used to build shareable links (e.g. team invite URLs) |
| `UPLOADS_DIR` | Local disk path for uploaded files (indicator evidence, profile photos) |

See [`backend/README.md`](backend/README.md) for the full module-by-module architecture breakdown.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local     # then set VITE_API_BASE_URL if not using the default
npm run dev                    # http://localhost:3000
```

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build |
| `npm run lint` | TypeScript type-check (`tsc --noEmit`) — there's no separate ESLint config |
| `npm run clean` | Remove `dist/` |

`VITE_API_BASE_URL` (defaults to `http://localhost:8080`) is the only frontend variable; it points
the app at the backend above.

### Try it out

The login page ships with one-click sandbox accounts for the two ends of the plan spectrum: an
SME/`starter`-plan user and a Main Market/`issuer-ready` user with IFRS S1/S2 access.

## Documentation

- [`backend/README.md`](backend/README.md) — backend architecture, package layout, known
  simplifications
- [`CLAUDE.md`](CLAUDE.md) — codebase guidance for AI coding agents working in this repo

## License

Proprietary — all rights reserved. See [`LICENSE`](LICENSE).
