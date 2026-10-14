# On-Premise Runbook

Operational runbook for on-prem deployments. Assumes Docker and Docker Compose are installed on the target host.

## Install

```bash
cd onprem
cp .env.example .env
# edit .env — APP_BASE_URL, JWT_SECRET, DB_PASSWORD are required; see comments in the file
docker compose -f docker-compose.onprem.yml up -d --build
```

This builds the backend (`../backend`), frontend (`../frontend`), and starts Postgres. Flyway runs migrations automatically on backend startup — no manual schema step.

### First login and account setup

1. A seed migration ships a bootstrap platform admin: `platform.admin@esgeasy.my` / `PlatformAdmin#2026` (see `backend/src/main/resources/db/migration/V14__seed_platform_admin.sql`). **Log in and change this password immediately** — it's identical across every deployment of this codebase, including the SaaS one.
2. Register the customer's own company through the normal onboarding flow (`/register`) — pick whichever market classification (SME / ACE Market / Main Market) best matches the customer, since it drives which indicator/matter sets they see. This assigns a default plan (starter/growth/issuer-ready); the next step corrects that.
3. As the platform admin, go to `/admin` → Tenants → the new company → **Modify Tenant Subscription Plan** → select **On-Premise**. This calls the existing `PATCH /api/v1/tenants/{id}/plan` endpoint (`TenantAdminController`/`CompanyService.adminUpdatePlan`) — no new endpoint was needed for this, it's the same mechanism used to change any tenant's plan.
4. Still as platform admin, mark the company's trial converted (`PATCH /api/v1/tenants/{id}/trial`, `{"converted": true}`) so `TrialAccessFilter` never blocks it — on-prem companies are on a contract, not a trial clock.
5. Change the seeded platform admin's own password (step 1) if you haven't yet, and consider whether the customer's own IT admin should hold `PLATFORM_ADMIN` on this instance or whether your team retains it.

There's no separate on-prem provisioning API — steps 2–4 reuse the same admin tooling that manages every other tenant, just pointed at a single-customer database.

## Backup / restore

Two things need backing up: the Postgres volume (`esgeasy_onprem_db`) and the uploads volume (`esgeasy_onprem_uploads` — avatars, indicator evidence documents).

**Backup:**
```bash
docker compose -f docker-compose.onprem.yml exec db pg_dump -U esgeasy esgeasy_esg > backup-$(date +%F).sql
docker run --rm -v onprem_esgeasy_onprem_uploads:/data -v "$PWD":/backup alpine \
  tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

**Restore:**
```bash
docker compose -f docker-compose.onprem.yml exec -T db psql -U esgeasy esgeasy_esg < backup-YYYY-MM-DD.sql
docker run --rm -v onprem_esgeasy_onprem_uploads:/data -v "$PWD":/backup alpine \
  sh -c "cd /data && tar xzf /backup/uploads-YYYY-MM-DD.tar.gz"
```

Volume names are prefixed with the compose project name (`onprem_` by default, since this file lives in `onprem/`) — run `docker volume ls` to confirm the exact names on your host before scripting this.

## Upgrade

```bash
git pull
docker compose -f docker-compose.onprem.yml up -d --build
```

Flyway migrations run automatically and are additive-only by policy — no destructive schema change ships without a major version bump (this policy isn't enforced by tooling yet; it's a release discipline to hold to until it is). Take a backup (above) before every upgrade regardless.

## Network requirements

The instance is internet-connected, not air-gapped. Outbound HTTPS (443) must reach:

- The customer's own SMTP relay (`SMTP_HOST` in `.env`), if outbound email is enabled.
- Whichever AI provider a company configures under Settings → AI (Gemini: `generativelanguage.googleapis.com`, OpenAI, or Anthropic) — only needed if that company turns on AI-assisted features, and only the one provider they actually pick.

No other outbound access is required. Nothing in this deployment calls Stripe, EsgEasy's own SaaS, or any analytics/telemetry endpoint.

## Open items not covered here

This runbook assumes contract-only entitlement (no signed license file) and Docker Compose (not Kubernetes). Revisit this document if either of those decisions changes.
