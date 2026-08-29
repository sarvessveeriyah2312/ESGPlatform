# White-Label — Implementation Plan

**Status:** Phases 1–5 implemented (see below), Phase 5 scaffolded rather than fully validated (see its own section). Phase 0 (a real prospective partner) still hasn't happened — this was built ahead of that on explicit instruction; treat it as unvalidated until a real partner exercises it.
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

### Phase 1 — Data model & tenant-partner linkage ✅ done
- `V80__partner_table.sql`: `partner` table + `company.partner_id` nullable FK (`ON DELETE SET NULL`). **Not built**: `platform_settings.partner_id` — that's brand-*resolution* machinery, which is really Phase 2's concern (this plan's own "Proposed data model additions" section frames it that way even though the Phase 1 bullet list above originally also listed it); skipping it here keeps Phase 1 to data-model-and-linkage only, as the phase name says.
- Backend: `Partner` entity, `PartnerRepository`, `PartnerService`, `PartnerController` (`/api/v1/admin/partners`, full CRUD) — gated to `PLATFORM_ADMIN`/`SUPERADMIN` via `@PreAuthorize` on the controller, no partner self-service, exactly as scoped.
- `CompanyService.adminUpdatePartner` + `PATCH /api/v1/admin/tenants/{id}/partner` links/unlinks a company to a partner. `TenantSummaryResponse` now carries `partnerId`/`partnerBrandName`.
- Frontend: a "Partners" section in the platform-admin sidebar (list, create, edit, delete, with a live brand preview in the form), and a partner-assignment dropdown on each tenant's detail page.
- No change to `SubscriptionPlan`, no change to the JWT/security principal — confirmed in practice, not just planned: a company was linked to a partner while staying on its existing `STARTER` plan with no other effect, verified against the database directly.

### Phase 2 — Branding plumbing (frontend + emails + PDFs) ✅ done
- `Company` gained three derived getters — `getEffectiveBrandName()`, `getEffectiveLogoUrl()`, `getEffectivePrimaryColor()` (partner's values if linked, else `"EsgEasy"`/`null`/`null`) — a single resolution point every other change below reuses, rather than each duplicating the same partner-or-default fallback.
- `MeResponse` extended with `brandName`/`logoUrl`/`primaryColor`, populated in `AuthService.toMeResponse()`. Frontend `UserProfile`/`toUserProfile` carry the same fields.
- **No separate `BrandContext`** — deviated from the plan here. `AuthContext`'s `user` object already carries the resolved brand fields from `/auth/me`, so `App.tsx` just reads `user?.brandName`/`user?.logoUrl`/`user?.primaryColor` directly (sidebar logo/name, `usePageTitle`'s document-title prefix). A whole extra context for three fields already sitting on `user` would have been unnecessary indirection.
- `EmailService.java`'s three lifecycle emails (invite, verification, password reset) resolve the sending company's brand per-send and use it in both subject and body, replacing the hardcoded "EsgEasy" and "— EsgEasy Reporting Platform" sign-off. **Not parameterized**: the SMTP test-send emails (`sendTestEmail`) — internal admin-facing debug utility, one has no unambiguous company context (used by both Platform Settings' and a company's own SMTP test), left generic.
- `MfaService.java`'s TOTP `ISSUER` (baked into every 2FA QR code) now resolves per the enrolling user's company; a platform-role user (no company) falls back to the default.
- All 5 PDF export templates (materiality, governance, IFRS S1, IFRS S2, integrated) had their hardcoded "EsgEasy" replaced with `${company.effectiveBrandName}` — the `Company` object was already passed into every report's Thymeleaf context, so no Java changes were needed in the 4 report services, only the templates. Verified live: generated a real governance report PDF for a partner-linked company — `GET .../governance/report.pdf` returned 200, confirming the Thymeleaf syntax (including a `th:inline="text"` CSS-content trick for the page-footer running header) actually renders, not just compiles. The other 4 templates share the identical structural pattern but weren't individually re-verified this pass.
- **Scope decision — resolved**: went with the plan's own recommendation. Branding is post-login only; the public marketing site, `/login`, and `/register` stay EsgEasy-branded (no `user` context exists there yet to brand with anyway). Confirmed live — the browser tab read "EsgEasy - Log In" right up until authentication succeeded, then flipped to the partner's brand name.

### Phase 3 — Routing (subdomain-based MVP) ✅ done
- **Not backend Host-header resolution as originally written** — deviated deliberately. The frontend and API are commonly different origins/ports (true in this repo's own local dev: :3000 vs :8080), so the backend's own request Host header often isn't the browser's actual visited hostname at all. Instead: `GET /api/v1/public/brand?subdomain={slug}` (new, unauthenticated) takes an explicit slug, and the frontend resolves that slug itself from `window.location.hostname` (`resolveSubdomainSlug` in the new `useSubdomainBrand` hook) before calling it. Same outcome, works regardless of topology; a same-origin deployment (e.g. the on-prem nginx bundle) could still derive the slug from the Host header upstream if ever wanted.
- `LoginPage.tsx` and `RegisterPage.tsx` call `useSubdomainBrand()` for their own logo/name (distinct from `App.tsx`'s post-login `user.brandName` — pre-login there's no authenticated user yet to read a brand from). `usePageTitle` also checks it as a fallback behind the post-login brand, so the browser tab title is branded pre-login too.
- **Real gap found and fixed while building this, not just a local testing convenience**: CORS was configured with `setAllowedOrigins` (exact string match only) — this would have silently blocked every partner subdomain in production too, not merely blocked local testing. Fixed to `setAllowedOriginPatterns`, which supports a wildcard entry (e.g. `https://*.esgeasy.my`) while still matching plain origins exactly when no `*` is present — existing configs are unaffected.
- Verified live end-to-end in local dev using the `.localhost` TLD, which every modern browser/OS resolves to loopback with no DNS setup (RFC 6761) — genuinely equivalent proof to a real wildcard subdomain, not a mocked stand-in. Visited `http://nusantara.localhost:3000/#/login` cold (no login, no prior session) and got "Nusantara ESG Hub" branding — logo, name, and tab title — purely from the hostname. Visiting bare `localhost:3000` with a clean session correctly fell back to plain "EsgEasy".
- Full custom-domain support (partner-owned DNS + TLS, e.g. `esg.partnerbrand.com`) still deferred, per the original plan — unchanged, still meaningfully more infrastructure work than this phase needed.

### Phase 4 — Partner console ✅ done, then expanded from read-only MVP to self-service
Originally shipped read-only (companies list only, see below). Expanded at the user's explicit request ("can we have partner console something like platform admin") — chose "sidebar shell + real new sections" over a cosmetic-only sidebar wrap when asked. Now:

- **Sidebar shell** (`PartnerConsoleLayout.tsx`) mirroring `AuthenticatedLayout`'s platform-admin `<aside>` — same collapsible width toggle, same nav-item markup — but kept as its own component rather than a third branch inside `AuthenticatedLayout`, since `AuthTopBar` assumes company context (company switcher, links into `/settings`/`/support`) never verified for a partner-scoped user. Real routes now (`/partner`, `/partner/branding`, `/partner/revenue`, `/partner/users`), each rendering `PartnerConsole.tsx` as a URL-driven tab switcher — same pattern as `AdminPanel.tsx`.
- **Branding tab** — self-service edit of `brandName`/`logoAsset`/`primaryColor`/`supportEmail`/`emailFromAddress` only (`PUT /api/v1/partner/branding`) — deliberately excludes internal name, subdomain slug, billing model, and revenue share %, which stay platform-admin-only. Saving pushes the new brand into `AuthContext` via `updateUser` so the sidebar reflects it immediately.
- **Revenue tab** — shows the admin-set revenue share % (read-only) plus live Stripe Connect status; a partner can now self-serve their own onboarding (`POST /api/v1/partner/stripe-connect/link`) and, once connected, open their real Stripe Express dashboard via a login link (`POST /api/v1/partner/stripe-connect/dashboard-link`, new `StripeClient.createLoginLink`) rather than this platform ever mirroring payout data itself.
- **Users tab** — a partner can now see their own team, invite a teammate (temp-password pattern, reuses `PartnerService.createPartnerAdminUser` via a self-scoped `inviteMyTeammate`), and deactivate/reactivate one — mirrors `CompanyService.setUserActive`'s guards exactly (can't deactivate yourself, can't drop the last active login for the partner).
- Fixed a real bug found while generalizing `startStripeConnectOnboarding` for reuse: its refresh/return URLs were `"/#/admin?tab=partners&connect=..."`, a query-param tab scheme this app doesn't use (admin sections are real paths). Would have sent Stripe's post-onboarding redirect to a route that doesn't exist. Now takes a `returnBasePath` so both the admin and partner-console callers get a URL that actually resolves.
- Every partner-console endpoint resolves the caller's own partner via `CurrentUserProvider.requirePartnerId()` — there is no `partnerId` path variable anywhere in `PartnerConsoleController`, unlike the platform-admin `PartnerController`, so a partner can never reach another partner's data by editing an id in the URL.
- **Verified live**: logged in as a partner-admin test login, clicked through all 4 tabs — companies list (unchanged from original MVP), branding form pre-populated with real data, revenue tab correctly showing "Not set" + a real Stripe Connect onboarding attempt (same HTTP 400 as the admin-side test, confirming the self-service path hits the same code), and the users tab — invited a teammate end-to-end (temp password shown once), then deactivated them and confirmed the self-row's deactivate button is disabled with a tooltip explaining why.

Original read-only MVP notes, still accurate for what's unchanged:
- **Went with a new `Role.PARTNER_ADMIN`**, not a scoping dimension on `PLATFORM_ADMIN` — a partner and a platform operator are genuinely different things, and reusing the platform-admin auth path risked a partner accidentally inheriting some platform-wide capability by omission. `AppUser` gained a nullable `partner` FK (mirrors how `company` was already nullable — `PLATFORM_ADMIN`/`SUPERADMIN` already had no company, so this wasn't a novel structural change to the user model).
- `EsgEasyPrincipal` gained `partnerId`, populated by `JwtAuthenticationFilter` from `user.getPartner()` — **no JWT claim needed**: the filter already derives `companyId` from the freshly-loaded `AppUser` entity each request, not from the token, so `partnerId` was a straightforward parallel addition, not a token-format change.
- `GET /api/v1/partner/companies` (new, `PARTNER_ADMIN`-only) returns `PartnerCompanySummaryResponse` — deliberately a *smaller* DTO than `TenantSummaryResponse`, not the full platform-admin shape. What a partner should additionally see or do (billing, inviting users into their companies, changing plans) is still explicitly undecided (see open decisions) — this doesn't reach for any of it speculatively, and there are no write endpoints at all yet.
- No partner self-service signup — a platform admin creates a partner's login from the Partners tab (`POST /api/v1/admin/partners/{id}/users`, mirrors `CompanyService.createTenantUser`'s temp-password pattern exactly), same posture as Phase 1.
- Brand resolution (Phase 2's `MeResponse` fields) now checks `user.getPartner()` first, before falling back to `company.getEffectiveBrandName()` — a partner-admin sees their own brand when they log in, not "EsgEasy".
- Frontend: a standalone `/partner` page (its own guard, not wrapped in `AuthenticatedLayout`'s sidebar shell — that page is a full layout already, self-contained, own header/branding).
- **Verified live, not just built**: created a real partner login through the admin UI, logged in as it, and got a read-only table showing *exactly* the 2 of 8 total companies linked to that partner — correct scoping, not a leak. Also verified the negative case: that same login hitting `/admin/tenants` and `/dashboard` directly both correctly show "You don't have access to this page" (the latter because it's gated to `TENANT_ROLES`, which `PARTNER_ADMIN` was never added to — the security boundary held without needing any change there).
- **Known cosmetic gap, not a security one**: if a partner-admin navigates outside `/partner` (e.g. a stale bookmark), `AuthenticatedLayout`'s sidebar still shows tenant nav items instead of nothing — the sidebar's platform/tenant branch is a binary ternary that doesn't know about `PARTNER_ADMIN`. Every one of those stray links still correctly 403s when clicked (verified above), so nothing leaks — it's just a rougher error experience than it should be. Deferred rather than fixed, since a real partner-admin's own UI never links there in the first place.

### Phase 5 — Billing / revenue share — ✅ scaffolded (not validated)
Built at the user's explicit request ("scaffold full Stripe Connect now"), fully aware it can't be verified end-to-end without a real onboarded Connect account. What exists:

- `Partner.stripeAccountId` / `Partner.revenueSharePercent` (nullable, migration V82) — a platform admin sets an explicit % per partner; no default percentage is ever invented in code.
- `StripeClient`: `createConnectedAccount`, `createAccountLink`, `retrieveAccount` — same no-SDK, form-urlencoded pattern as the rest of the class.
- `PartnerService.startStripeConnectOnboarding` / `getStripeConnectStatus`, exposed via `PartnerController` (`POST /{id}/stripe-connect/link`, `GET /{id}/stripe-connect/status`), backed by the platform's own Stripe secret key (`PlatformStripeSecretProvider`, extracted from `CompanyBillingService` so both share it).
- `CompanyBillingService.createCheckoutSession` now loads the paying company's `Partner` and, only if both `stripeAccountId` and `revenueSharePercent` are set, adds `subscription_data[application_fee_percent]` / `subscription_data[transfer_data][destination]` as a destination charge.
- Admin UI: Revenue Share % field and a Stripe Connect status/onboarding panel in the partner edit modal (`AdminPartnersTab.tsx`).

**Verified live:** the full round trip — set 15% revenue share on the "Nusantara ESG Hub" partner via the admin UI, confirmed it persisted through a reload; clicked "Start Stripe Connect Onboarding," which hit the real Stripe API in test mode and got back a genuine `HTTP 400` (surfaced correctly to the user as a toast, no key leaked in the error). That confirms the plumbing works end-to-end — request shape, auth, error handling — but **not** that account creation actually succeeds; this platform's current Stripe test account rejected the `/v1/accounts` call (Stripe Connect most likely isn't enabled on it yet, or the request needs adjusting once that's confirmed in the Stripe Dashboard).

**Not verified, and can't be without further setup:**
- A connected account actually reaching `charges_enabled`/`payouts_enabled` (needs Express onboarding fully completed by a real or Stripe-provided test identity).
- A destination charge actually splitting a real payment (needs a company linked to a partner with both fields set, and a completed Checkout).
- Whether 15% (used above only as a UI smoke-test value) is anywhere close to a real number — see "Open decisions" below, still unresolved.

## Rough effort shape

| Phase | Scope | Relative size |
|---|---|---|
| 0 | Validate demand | Days, not engineering |
| 1 | Data model & linkage | Small — **done** |
| 2 | Branding plumbing | Medium-large (high file count, low individual risk) — **done** |
| 3 | Subdomain routing | Medium — **done** |
| 4 | Partner console | Medium — **done**, then expanded to self-service (branding, revenue, users) |
| 5 | Billing / revenue share | Medium-large (Stripe Connect integration is the long pole) — **scaffolded, not validated** |

Given the solo/bootstrapped constraint the BRD already states for this product, Phases 1–3 alone represent a multi-week effort, and Phases 4–5 are their own project — not something to schedule until Phase 0 actually produces a paying partner.

## Open decisions only you can make

- ~~What a partner should be able to do beyond read-only visibility into their own companies~~ — resolved: invite/manage their own team and edit their own branding are now built (Phase 4 expansion above). Still undecided: whether a partner should see/change *their companies'* plans or billing (not their own revenue share, which is now visible) — no endpoint reaches for that yet.
- Revenue share percentage / flat-fee structure with partners.
- Whether the white-labeled experience is *only* post-login (dashboard/reports/emails) or extends to a partner-branded public marketing surface too.
- Whether an existing `CONSULTANT`-role user base is a realistic first pilot partner, or whether this targets a different kind of partner entirely (e.g. a bank embedding EsgEasy into its own SME banking portal).
- Whether "white-label" should even be sold as a distinct plan tier at all, versus a custom enterprise arrangement negotiated outside the normal Starter/Growth/Issuer-Ready ladder (which avoids touching the `SubscriptionPlan` enum indefinitely).
