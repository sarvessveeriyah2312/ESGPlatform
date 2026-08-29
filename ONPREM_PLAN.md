# On-Premise Edition — Plan & R&D

**Status:** Phases 1–4 implemented (see below). Phase 5 not started. Phase 0 (a real prospective customer) still hasn't happened — this was built ahead of that on explicit instruction; treat it as unvalidated until a real customer exercises it.
**Prepared:** 29 Aug 2026

## Context

On-premise means a customer — most plausibly a bank, GLC, or Main Market issuer with a data-residency or regulatory mandate that a shared SaaS can't satisfy — runs a dedicated instance of EsgEasy inside infrastructure they control (their own VPC or physical datacenter), instead of connecting to `esgeasy.my`. This is the natural ceiling above the existing `issuer-ready` tier: the customers who'd ask for it are exactly the ones already paying for the most compliance-heavy tier.

This document assesses what the current codebase actually supports, what has to change, and a phased path — grounded in the real architecture, same approach as [`WHITELABEL_PLAN.md`](WHITELABEL_PLAN.md).

## Current architecture — what's already there, what's missing

**Working in favor of this:**
- The backend is already a self-contained Spring Boot app + Postgres, already Dockerized (`backend/Dockerfile`, `backend/docker-compose.yml`) — this is most of the shape of an installable on-prem package already.
- **No cloud-storage dependency.** `ProfileAvatarService` and `IndicatorEvidenceService` both write to local disk under `esgeasy.uploads.dir` — explicitly "no S3/cloud dependency" per their own doc comments. Nothing to swap out.
- **SMTP is already externally configurable** (`SMTP_HOST`/`PORT`/`USERNAME`/`PASSWORD` in `application.yml`) — an on-prem deploy points this at the customer's own mail relay with zero code change.
- **Flyway manages schema migrations** — deterministic and versioned, runs identically against any Postgres instance the customer controls.
- **Multi-tenancy doesn't need to be removed.** `Company` + the Hibernate `companyFilter` is the tenant boundary; a single-customer on-prem box just ends up with one `Company` row (or a handful, for subsidiaries). No architectural conflict, no rip-out required.
- **Frontend is a plain static SPA** (`HashRouter`, Vite build) — no SSR, no dependency on a specific hosting layer. Trivially served by nginx behind whatever reverse proxy the customer already runs.
- **No third-party telemetry found.** No Sentry/PostHog/Segment/analytics SDK calling out from the backend — nothing today silently phones home, which matters a lot for an air-gapped customer.

**What's missing, confirmed by reading the actual code:**
- **Billing is Stripe-only and assumes self-serve SaaS.** `StripeClient` calls `api.stripe.com` directly; `CompanyBillingService`/`SubscriptionPlan` assume the customer enters a card and Stripe webhooks drive plan state. An on-prem customer is on an annual contract, not a card — there's currently no path to mark a company entitled to a plan without going through Stripe.
- **No licensing/entitlement mechanism independent of Stripe.** Nothing today time-bombs, seat-limits, or feature-gates a deployment on its own — plan status lives entirely in Stripe's subscription state.
- **`SubscriptionPlan` is a closed enum** (`STARTER`, `GROWTH`, `ISSUER_READY`), same constraint the white-label plan flagged. On-prem being confirmed as its own distinct plan (not a variant of `issuer-ready`, not an off-ladder custom contract) means this enum has to grow a fourth value regardless — accept that cost now rather than working around it.
- **AI features call public internet APIs directly.** `GeminiClient` → `generativelanguage.googleapis.com`, plus `OpenAiClient`/`AnthropicClient` (dispatched via `AiProviderClientFactory`, keys encrypted at rest per-tenant via `SecretCryptoService`). **Confirmed non-issue**: the target on-prem deployment is internet-connected (customer-controlled infra, outbound HTTPS allowed), not air-gapped — these keep working unchanged, customer supplies their own provider API key same as today's tenants do.
- **Frontend still carries the original AI-Studio scaffold's `@google/genai` dependency and `GEMINI_API_KEY` env var** (`frontend/.env.example`), even though real AI calls appear to route through the backend's provider factory, not the frontend directly. Worth confirming it's dead weight and stripping it — one less thing to explain or secure inside a customer's network.
- **No versioned release artifact.** Deployment today is `git pull` + `docker compose up` against `main`. An on-prem customer needs pinned, upgradeable image tags and a documented migration-compatibility guarantee, not a moving branch.
- **The superadmin/platform-admin panel (`/admin`) is shaped for EsgEasy staff administering the whole multi-tenant platform.** In a single-customer on-prem box, "platform admin" and "the customer's own IT admin" collapse into the same person, and most of what that panel shows (cross-tenant company lists, platform-wide settings) stops making sense.
- **No backup/restore or upgrade tooling.** Postgres data lives in a Docker volume; nothing documents or automates backup, restore, or a safe migration rollout for a customer-operated instance.

## Proposed shape

- **Packaging**: a pinned Docker Compose bundle building on the existing `backend/docker-compose.yml` — versioned backend image, Postgres, and an nginx container serving the built frontend and reverse-proxying `/api` to the backend. One `docker compose up` for a customer's ops team.
- **Plan tier**: add `SubscriptionPlan.ON_PREM` as a fourth value alongside `STARTER`/`GROWTH`/`ISSUER_READY`. It gets its own `FEATURE_REGISTRY` entries (`PlanContext.tsx`) rather than inheriting `issuer-ready`'s feature set as-is — pricing/packaging is a business decision outside this doc, but architecturally it's a normal new enum value, not a special case threaded through every call site.
- **Billing**: bypass `CompanyBillingService`/Stripe entirely for `ON_PREM` companies rather than trying to make Stripe optional inside the existing billing code paths — provisioned directly onto the `ON_PREM` plan at setup, billing UI hidden.
- **Licensing enforcement**: still open (see below) — the plan-tier decision above answers *what* the customer is entitled to, not *how* that entitlement is technically enforced (or whether it needs to be, beyond the contract).
- **AI features**: confirmed internet-connected, so no change needed — customer supplies their own provider API key, same mechanism as today's tenants (`SecretCryptoService`-encrypted, per-company).
- **Releases**: versioned backend/frontend image tags, a documented no-destructive-migration-without-major-bump policy, and a written upgrade runbook (pull tag → `docker compose up`).

### Where this lives in the repo

Not a fork. `backend/` and `frontend/` stay the single source for every edition — `ON_PREM` is a plan tier like `STARTER`/`GROWTH`/`ISSUER_READY`, gated the same way, not a separate codebase that could drift from SaaS. A second full copy of the app would double the maintenance burden for a solo/bootstrapped team for no real benefit.

What *is* new is a top-level `onprem/` folder holding deployment packaging only — nothing that duplicates app code. Actual layout, as built:

```
ESG/
  backend/                      # unchanged structurally — gained SubscriptionPlan.ON_PREM + billing bypass guards
  frontend/
    Dockerfile                  # new — multi-stage: vite build → nginx:alpine serving dist/
    nginx.conf                  # new — SPA static serving + /api reverse proxy to the backend container
    src/...                     # unchanged structurally — gained 'on-prem' PlanType + UI handling
  onprem/                       # new, Phase 1 — packaging/deployment artifacts only, no app code
    docker-compose.onprem.yml   # db + backend (build ../backend) + frontend (build ../frontend)
    .env.example
    RUNBOOK.md                  # install / first-login / backup / restore / upgrade / network reqs
```

`frontend/Dockerfile` and `nginx.conf` live next to the app they build (matching `backend/Dockerfile`'s existing placement), not inside `onprem/` — only the compose bundle, env template, and runbook are on-prem-specific enough to warrant their own folder.

## Phased plan

### Phase 0 — Validate demand (no code)
Line up a real prospective on-prem customer before writing Phase 1. On-prem sales cycles and ongoing support burden are heavier than SaaS — this matters more here than it did for white-labeling. **Recommended starting point regardless of the rest of this plan.**

### Phase 1 — Deployment packaging ✅ done
- `onprem/docker-compose.onprem.yml` — Postgres + backend (built from `../backend`, unchanged) + a new `frontend/Dockerfile` + `frontend/nginx.conf` (nginx serves the built SPA and reverse-proxies `/api` to the backend on the same origin, so `VITE_API_BASE_URL` stays empty at build time — no per-customer rebuild needed).
- `onprem/.env.example` — every secret externalized (JWT secret, DB creds, SMTP, `APP_BASE_URL`); required values fail loudly (`${VAR:?message}`) rather than silently defaulting.
- `onprem/RUNBOOK.md` — install, first-login/provisioning steps, backup/restore, upgrade, and outbound network requirements.
- Not done: actual versioned image tags / release process — the bundle currently builds from source (`git pull` + `--build`), same moving-branch model as today. Revisit once there's a real customer and a cadence to version against.

### Phase 2 — `ON_PREM` plan tier & licensing ✅ done (enforcement piece deferred)
- Added `SubscriptionPlan.ON_PREM(4)` (backend) and `'on-prem'` to `PlanType` (frontend) — no `FEATURE_REGISTRY` entries were needed: gating is level-based (`atLeast`/`PLAN_LEVELS`), and level 4 automatically clears every existing `minPlan` gate, so on-prem gets every feature by construction.
- `Company.subscriptionPlan` assignment is decoupled from Stripe via the **existing** `PATCH /api/v1/tenants/{id}/plan` platform-admin endpoint (`TenantAdminController` → `CompanyService.adminUpdatePlan`) — no new endpoint was needed. A 4th radio option ("On-Premise Plan") was added to `AdminTenantsTab.tsx`'s existing plan-change modal so a platform admin can actually select it.
- Licensing enforcement itself: not built — see "Open decisions" below, still genuinely open. Provisioning today is the contract-only path (admin sets the plan, no expiry/seat check).

### Phase 3 — Billing bypass ✅ done
- `CompanyBillingService.createCheckoutSession` and `.changeSubscriptionPlan` both reject `targetPlan == ON_PREM` up front with a clear error; `CompanyService.updatePlan` (the self-service `PATCH /company/plan` endpoint) rejects a company assigning itself `ON_PREM` — only the platform-admin path (Phase 2) can grant it.
- `BillingView` (`PlaceholderViews.tsx`) shows a "managed under a direct contract" message instead of the upgrade/downgrade grid when `plan === 'on-prem'`, and admin tenant views (`AdminTenantsTab`, `AdminTenantDetailView`) show "Contract" instead of a `$/mo` figure for on-prem tenants.
- Not touched: `StripeWebhookService` — on-prem companies never acquire a `stripeSubscriptionId`, so the existing cancellation-webhook path simply never matches them; no explicit guard was needed there.

### Phase 4 — AI provider ✅ done (docs only, as expected)
- `onprem/RUNBOOK.md`'s "Network requirements" section documents exactly which hosts need outbound HTTPS (the customer's SMTP relay, and whichever single AI provider a company opts into). No code change, as anticipated.

### Phase 5 — Admin experience for single-tenant deploys — not started
- `/admin` still shows the full multi-tenant platform-admin surface unchanged. Deliberately deferred — genuinely needs a UX decision (collapse platform-admin/company-admin, or strip `/admin` from the bundle) that shouldn't be made speculatively without a real on-prem customer's admin actually using it.

## Rough effort shape

| Phase | Scope | Relative size |
|---|---|---|
| 0 | Validate demand | Days, not engineering |
| 1 | Deployment packaging | Medium |
| 2 | `ON_PREM` plan tier & licensing | Small–Medium (small if contract-only, larger if signed-license enforcement) |
| 3 | Billing bypass | Small |
| 4 | AI provider — docs only | Trivial |
| 5 | Admin experience | Small–Medium |

Given the solo/bootstrapped posture, Phases 1–3 alone are a multi-week effort once a real customer exists to build against — building any of this speculatively, with no customer requirements to react to, is the main risk here.

## Decided

- **Deployment target: internet-connected on-prem**, not air-gapped. Customer controls the infrastructure, but outbound HTTPS is allowed — AI provider calls and (if built) license checks can both reach the internet. Resolved 29 Aug 2026.
- **On-prem is its own distinct plan tier** (`SubscriptionPlan.ON_PREM`), not a variant of `issuer-ready` and not a custom off-ladder contract. Resolved 29 Aug 2026 — exact feature set / pricing is a separate business decision, not blocking the engineering shape above.

## Open decisions only you can make

- **License enforcement: technical (signed license file) vs contract-only trust.** Contract-only is far cheaper to build and matches the existing bootstrapped constraint; only worth automating once you have more than one on-prem customer to manage by hand. This is the main thing still gating Phase 2's actual scope.
- **Packaging target: Docker Compose vs Kubernetes/Helm.** Compose matches what exists today and is simplest to hand to a customer's ops team; only build a Helm chart if a specific target customer's infra team mandates k8s.
- **Support model: who patches/upgrades the running instance** — your team via remote access (VPN/bastion) vs the customer's own ops team following a runbook. This changes how much of Phase 1's documentation and tooling is actually load-bearing.
- **`ON_PREM` plan's exact feature set and price** — a pricing/packaging call, not an engineering one, but needed before Phase 2's `FEATURE_REGISTRY` entries can be written.
