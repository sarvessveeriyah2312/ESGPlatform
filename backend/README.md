# Lestari ESG Backend

Java 21 + Spring Boot 3 + PostgreSQL backend for the Lestari ESG reporting platform. Implements the
multi-tenant data model, JWT auth, and REST API described in the project's BRD/PRD/SRS documents,
covering all three subscription tiers (`STARTER`, `GROWTH`, `ISSUER_READY`).

This is a standalone backend — the React frontend in `../frontend/` is not yet wired to call it
(all frontend data is still mocked in localStorage). That integration is a separate future task.

## Requirements

- Java 21 (Temurin recommended)
- Maven 3.9+
- PostgreSQL 15+ (a local Homebrew install works fine — Docker is not required for local dev)

## Local setup

```bash
createdb lestari_esg          # one-time
createdb lestari_esg_test     # only needed if you add Testcontainers-free integration tests

cd backend
mvn spring-boot:run           # runs with the 'dev' profile by default, http://localhost:8080
```

Override `DB_USERNAME` / `DB_PASSWORD` / `JWT_SECRET` / `CORS_ALLOWED_ORIGINS` as environment
variables if your local Postgres isn't peer-auth with your OS user, or before deploying anywhere
that isn't localhost. `application-dev.yml` defaults to connecting as the current OS user with no
password, matching a typical Homebrew Postgres install.

Flyway migrations run automatically on startup (`src/main/resources/db/migration`). Nothing needs
to be seeded manually — reference data (sustainability matters, indicator definitions, feature
flags) ships in `V4__reference_seed_data.sql`.

## API docs

Once running: Swagger UI at `http://localhost:8080/swagger-ui.html`, raw OpenAPI JSON at
`/v3/api-docs`. Authenticate with the "Authorize" button using a JWT from `POST /api/v1/auth/login`.

## Docker (optional, for later deployment)

```bash
docker compose up --build
```

Runs Postgres + the backend together via `docker-compose.yml` / `Dockerfile`. Not required or
exercised for local development — this machine doesn't have Docker installed, so these files are
unverified; sanity-check them before relying on them in production.

## Architecture

Package root `com.lestari.esg`. See the plan/design notes for the full rationale; the short version:

- **`common`** — `BaseEntity` (UUID PK + audit timestamps), `TenantOwnedEntity` (adds `companyId`
  + a Hibernate `@Filter` enabled per-request as a tenant-isolation safety net), exceptions, global
  error handling.
- **`security`** / **`auth`** — stateless JWT (HMAC, `io.jsonwebtoken`), `tokenVersion` column for
  cheap session invalidation, BCrypt passwords. Plan is never embedded in the JWT — every
  plan-gated endpoint re-reads `Company.subscriptionPlan` fresh from the DB via `PlanGateService`
  (`@PreAuthorize("@planGate.check('feature-key')")`), so a downgrade takes effect immediately.
- **`tenant`** / **`user`** — `Company` (the tenant), `AppUser`, `Sector`.
- **`reference`** — `SustainabilityMatter`, `IndicatorDefinition`, `FeatureFlag`, `MatterSetRule`,
  `TransitionReliefRule` — all seeded, configurable data (not hard-coded logic), so SEDG/Bursa
  framework changes don't require a redeploy. Also home to `MatterSetResolverService`, which
  decides which matter set (SEDG / BURSA_MAIN / BURSA_ACE / SECTOR) applies to a given company
  from its plan + market classification.
- **`indicators`** — per-company indicator values, target overrides, and an append-only audit
  trail (who/when/source per FR-5.5).
- **`materiality`** — versioned assessment snapshots (never mutated after creation) plus a
  separately-editable stakeholder list.
- **`governance`** — the 3 fixed oversight levels + per-matter ownership assignment.
- **`targets`** — standalone strategic targets, distinct from per-indicator targets.
- **`climate`** — IFRS S1 (business segments + risk/opportunity register) and IFRS S2 (governance/
  strategy/risk-management/metrics narrative + Scope 1/2/3 GHG ledger). Scope 3 transition-relief
  status is computed server-side from a seeded rule table + the company's market classification,
  never stored as an editable flag (SRS FR-6.3/6.4).
- **`assurance`** — fiscal-year sign-off workflow gated on 100% indicator completion, with its own
  audit trail mirroring the indicators module's pattern.
- **`export`** — raw indicator CSV and a CSI-compatible CSV (readiness aid only, never a real
  submission to Bursa's CSI platform), plus an export history log.

## Known simplifications (documented, not accidental)

- No refresh tokens — a bumped `tokenVersion` invalidates all of a user's existing tokens instead.
- No PDF/Word export generation — only CSV, which covers the one exact-schema requirement
  (CSI-compatible export). PDF templating was deferred as disproportionate effort for this pass.
- Consultant multi-tenant access is not built — one `AppUser` belongs to exactly one `Company`.
- No Testcontainers — dev/manual testing runs against a real local Postgres; the `test` Spring
  profile uses H2 in PostgreSQL-compatibility mode for any future slice tests.
