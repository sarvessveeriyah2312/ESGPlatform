# White-Label — Implementation Plan

**Status:** Planning only. No code has been written against this plan.
**Prepared:** 29 Aug 2026

## Context

White-labeling would let a partner — a sustainability consultancy, an accounting firm, a bank offering it to SME clients — offer EsgEasy under their own brand to their own end customers, who may never know EsgEasy exists underneath. The BRD already identifies a "Consultant" persona managing multiple client accounts; white-labeling is the natural next step beyond that, but it's a distinct capability, not an extension of the existing `CONSULTANT` role.

This document assesses what the current codebase actually supports, what has to change, and a phased path — grounded in the real architecture, not a generic SaaS-white-label checklist.

## Current architecture — what's already there, what's missing

**Working in favor of this:**
- Real multi-tenancy already exists: `Company` is the tenant boundary, enforced at the data-access layer via a Hibernate `@Filter` (`companyFilter`), not just in application code.
- A `CONSULTANT` role already exists for managing multiple client tenants from one login — architecturally adjacent, though it's the *consultant using EsgEasy's own UI*, not *EsgEasy running under someone else's brand*.

**What's missing, confirmed by reading the actual code:**
- **Branding is a single global singleton, not per-tenant.** `PlatformSettings` is fetched via `repository.findFirstByOrderByCreatedAtAsc()` — literally "the first row in the table." There is exactly one brand configuration for the entire platform today.
- **"EsgEasy" is hardcoded in code, not data**, in at least these places (verified directly this session):
  - `MfaService.java`: `private static final String ISSUER = "EsgEasy";` — baked into every TOTP QR code
  - `EmailService.java`: every transactional email (invite, verification, password reset) ends with a literal `"— EsgEasy Reporting Platform"` sign-off
  - `App.tsx`: sidebar logo/name, and `PAGE_TITLES` (browser tab titles) are hardcoded per-route strings
  - PDF export templates (Thymeleaf, under `backend/src/main/resources/templates/pdf/`) — not read line-by-line this session, but given the pattern above, should be assumed to hardcode the brand name too until confirmed otherwise during implementation
- **No domain/subdomain routing.** The frontend is `HashRouter` on a single domain (`/#/path`). There's no mechanism today to resolve "which brand am I" from a hostname.
- **Billing has no partner concept.** Stripe is wired directly from `Company` to `CompanyBillingService`; there's no entity that would own multiple companies and receive a revenue share or referral fee for them.
- **`SubscriptionPlan` is a closed enum** (`STARTER`, `GROWTH`, `ISSUER_READY`) threaded through onboarding, feature gating, and billing. Adding "white-label" as a fourth value here would touch dozens of call sites — this plan deliberately avoids that (see Phase 1).

## Proposed data model additions

- **New `Partner` entity**: `id`, `name` (internal), `brand_name` (customer-facing), `logo_asset`, `primary_color`, `support_email`, `email_from_address`, `subdomain_slug`, `billing_model` (e.g. `revenue_share_pct` or `flat_referral_fee`), `created_at`.
- **`Company.partner_id`** — nullable FK. `null` means "direct EsgEasy customer" (today's entire customer base); a non-null value means the company was provisioned under that partner's brand.
- **Brand resolution becomes partner-scoped instead of global**: the existing `PlatformSettings` singleton either grows a nullable `partner_id` (so a row with `partner_id = null` is today's global default, and a row with a real `partner_id` overrides it for that partner's companies), or is duplicated into a new `PartnerBrandSettings` table that falls back to the existing global one. The former is less invasive — recommended.

## Phased plan

### Phase 0 — Validate demand (no code)
Line up at least one real prospective partner (a consultancy or bank already asking for this) before writing Phase 1. This is exactly what the "Contact Sales" placeholder we discussed earlier is for — a cheap way to find out if anyone actually wants this before committing engineering time. **Recommended starting point regardless of the rest of this plan.**

### Phase 1 — Data model & tenant-partner linkage
- Migration: `partner` table, `company.partner_id` nullable FK, `platform_settings.partner_id` nullable FK (or the separate-table variant above).
- Backend: `PartnerRepository`, `PartnerService`, basic CRUD gated to `PLATFORM_ADMIN`/`SUPERADMIN` only (no partner self-service yet).
- No change to `SubscriptionPlan`, no change to the JWT/security principal — a partner is a data attribute of a company, not a new auth concept, at this phase.

### Phase 2 — Branding plumbing (frontend + emails + PDFs)
- Extend `MeResponse` (the `/auth/me` payload) with the resolved brand: `brandName`, `logoUrl`, `primaryColor` — defaulting to EsgEasy's own values for `partner_id = null` companies, so this is a no-op for every existing customer.
- Introduce a `BrandContext` on the frontend, populated once at login, and replace the hardcoded sidebar logo/name and `PAGE_TITLES` strings in `App.tsx` with values read from it.
- Parameterize `EmailService.java`'s sign-off line and `MfaService.java`'s TOTP `ISSUER` per the sending company's partner.
- Parameterize the PDF export templates the same way — confirm exact hardcoded strings during implementation, per the note above.
- **Explicit scope decision needed**: does the public marketing site (`/`, `/pricing`, `/features`, `/about`) ever render under a partner's brand, or does a white-labeled company only ever see the branded experience *after* login (dashboard, reports, emails)? The latter is significantly less work and is the recommended MVP scope — the marketing site staying EsgEasy-branded is normal even for white-label products (the partner does their own marketing).

### Phase 3 — Routing (subdomain-based MVP)
- Wildcard subdomain (e.g. `*.esgeasy.my`) with the backend resolving the partner from the `Host` header on login and public-facing routes.
- Defer full custom-domain support (partner-owned DNS + TLS cert provisioning, e.g. `esg.partnerbrand.com`) to a later phase — meaningfully more infrastructure work (cert automation, DNS verification flow) for a benefit that mainly matters once you have several partners, not the first one.

### Phase 4 — Partner console
- A scoped admin view: a partner can manage *only the companies under their own `partner_id`*, not the full platform.
- Likely a new role (`PARTNER_ADMIN`) or a scoping dimension added to the existing `PLATFORM_ADMIN` authorization path — needs its own design pass once Phase 1–3 are real, not designed speculatively here.

### Phase 5 — Billing / revenue share
- Extend `CompanyBillingService` (or add a parallel `PartnerBillingService`) to apply the partner's `billing_model` on top of the existing Stripe integration.
- **Stripe Connect (destination charges)** is the standard mechanism for automated partner revenue share and is the likely fit here — flagged for further investigation when this phase is actually scheduled, not decided in this document.

## Rough effort shape

| Phase | Scope | Relative size |
|---|---|---|
| 0 | Validate demand | Days, not engineering |
| 1 | Data model & linkage | Small |
| 2 | Branding plumbing | Medium-large (high file count, low individual risk) |
| 3 | Subdomain routing | Medium |
| 4 | Partner console | Medium |
| 5 | Billing / revenue share | Medium-large (Stripe Connect integration is the long pole) |

Given the solo/bootstrapped constraint the BRD already states for this product, Phases 1–3 alone represent a multi-week effort, and Phases 4–5 are their own project — not something to schedule until Phase 0 actually produces a paying partner.

## Open decisions only you can make

- Subdomain-only vs. full custom-domain support for v1.
- Revenue share percentage / flat-fee structure with partners.
- Whether the white-labeled experience is *only* post-login (dashboard/reports/emails) or extends to a partner-branded public marketing surface too.
- Whether an existing `CONSULTANT`-role user base is a realistic first pilot partner, or whether this targets a different kind of partner entirely (e.g. a bank embedding EsgEasy into its own SME banking portal).
- Whether "white-label" should even be sold as a distinct plan tier at all, versus a custom enterprise arrangement negotiated outside the normal Starter/Growth/Issuer-Ready ladder (which avoids touching the `SubscriptionPlan` enum indefinitely).
