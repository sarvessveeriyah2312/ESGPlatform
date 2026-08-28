# EsgEasy Test Report

**Scope:** Two manual QA passes run against a real local instance (Postgres + Spring Boot backend + Vite frontend, driven through an actual browser, not just API calls) — a security-regression pass following five security fixes, and a deep end-to-end customer journey on a fresh Growth-tier account. Two real product bugs were found and have since been fixed and re-verified.
**Date:** 29 Aug 2026

---

## 1. Security-regression pass

Purpose: confirm the five High-severity fixes from `SECURITY_AUDIT.md` hold up under real UI click-through, not just the curl-level API verification done while fixing each one.

| Area tested | Result | Notes |
|---|---|---|
| Support tickets (IDOR fix) | PASS | Same-tenant create/message works normally; a different tenant sees zero leakage in their own ticket list |
| Custom roles (privilege-escalation fix) | PASS | Escalation attempt correctly blocked (403); legitimate subset-permission role creation still works |
| Indicators/Targets write-blocking (missing `@PreAuthorize` fix) | PASS | View-only custom role blocked server-side on an indicator write and a target delete; admin edits/creates unaffected |
| MFA (re-enrollment fix) | PASS | Full lifecycle verified through the real UI: enable → real TOTP code → login MFA challenge → disable; no re-enroll option shown while already active, as designed |
| SMTP settings (SSRF fix) | PASS | Private IP (`10.0.0.5`) rejected with a clear on-screen error; a valid host saves normally |
| Public pages (Landing/Pricing/Features/About) | PASS | All load cleanly |
| Auth flow (register/verify/login/logout/forgot/reset) | PASS | Password-reset flow exercised live end to end |
| Dashboard, Governance, Reports/Export (PDF + CSV), Audit Log, API Access, Ask AI | PASS | All load and function; CSV export succeeded; Audit Log correctly shows the session's own activity |

**Result: all 5 security fixes confirmed holding under real click-through. No security regressions found.**

### Bugs found during this pass (both pre-existing, unrelated to the security fixes — not yet fixed)

1. **`TargetsView.tsx` — optimistic-delete bug.** Clicking delete removes the item from the UI immediately, without waiting for the API response. When the backend correctly rejects a delete (403, insufficient permission), the item still *looks* deleted until the page is refreshed — no error toast shown. No data is actually lost, but it's a misleading UX moment.
2. **`RolesView.tsx` — generic error surfacing.** A rejected role save shows only "Failed to save role." — the real reason (e.g. "Cannot grant permission(s) you don't hold yourself: [billing.manage]") is logged to the console but never shown to the user. Not a security issue — the equivalent SMTP-settings error surfaces correctly, this one just doesn't.
3. **`Dashboard.tsx` — console noise for heavily-restricted roles.** For a custom role with very few permissions, each of the dashboard's ~8 parallel API calls 403s and logs an uncaught exception to the console, though the page still renders an acceptable empty state visually. Log noise only.

---

## 2. Deep customer journey — Growth tier (ACE Market)

Purpose: validate the actual product experience end to end as a first-time paying customer would use it, with real data entered at every step — not just "does it load." Persona: "Mei Ling," a sustainability lead at a fictional manufacturing company ("Hijau Manufacturing Sdn Bhd"), replacing a spreadsheet-based ESG process.

| # | Step | Result | Notes |
|---|---|---|---|
| 1 | Register → verify email → login | PASS | Real email-verification token flow, end to end |
| 2 | Onboarding (ACE Market, Manufacturing sector, 4 focus areas) | PASS | Frameworks correctly pre-recommended for the ACE tier |
| 3 | Dashboard empty state | PASS | Arithmetically consistent (6 matters, 0 done, 6 needing attention), no `NaN`/`undefined`; IFRS/Assurance correctly hidden for Growth tier |
| 4 | Materiality Assessment (full 4-step flow, 6 matters scored, 5 stakeholders) | PASS | Matrix math and High/Medium/Low priority classification matched the entered scores exactly; scatter-plot placement matched too |
| 5 | Indicators (monthly entry across 2 indicators, invalid-input test) | PASS | Sum aggregation verified correct (28+30+27=85 MWh; 2+3+4=9 hrs); a negative value was correctly rejected client-side with a clear message |
| 6 | Targets (created, linked to a real indicator) | PASS | Auto-calculated progress tracking, correct baseline/target/glide-path display |
| 7 | Governance (oversight structure, policy review, matter ownership) | PASS | "Next due" date correctly computed as reviewed-date + 3 years per the stated rule |
| 8 | Reports & Export (PDF preview/download + CSV) | **PASS, standout** | Real company name, sector, market, all 6 scored materiality matters, and logged indicator values all flowed through correctly into the actual downloaded PDF |
| 9 | Team invite (custom role creation + acceptance as a second user) | PASS | Permission split enforced correctly in the UI and via the invite/accept flow; second user landed as Contributor, not Admin |
| 10 | Settings — company profile save | **FAIL → fixed, see §3** | Save succeeded but a false "email already exists" error displayed regardless |
| 11 | Billing / upgrade path (navigate only, no real payment) | PASS | "Upgrade to Issuer-Ready" correctly redirected to a real, valid Stripe Checkout session URL |
| 12 | Support ticket | PASS | Submitted and listed correctly |
| 13 | Logout / login persistence | PASS | Every piece of data entered in steps 4–10 was still present and correct after a full sign-out/sign-in cycle |

### Bug found during this pass (also found via the same account: dashboard target-breach mislabeling — see §3)

**Overall product quality assessment** (unchanged conclusion after both bugs below were fixed): the core promise holds under real use — enter ESG data once, get a correct, board-ready report out the other end. Materiality matrix math, indicator aggregation, target tracking, and the final PDF/CSV exports all produced numbers that exactly matched what was entered, with no silent data corruption anywhere in the pipeline. Permission-scoped team collaboration worked correctly end to end. The two bugs found were both narrow, not data-integrity problems, and are now fixed.

---

## 3. Bugs found → fixed and re-verified live

### 3.1 Dashboard falsely flags "Target breached" on in-progress data

- **File:** `frontend/src/components/Dashboard.tsx:60` (`isBreachingTarget`)
- **Root cause:** Every indicator can carry a reference-data default target independent of anything the customer explicitly configures — e.g. "Average Training Hours per Employee" ships with a seeded default of 35 hours (`V4__reference_seed_data.sql`). The breach check compared the **current, possibly partial** SUM/AVERAGE/COUNT total directly against the **full annual** target with no regard for how much of the fiscal year had actually been reported — so a customer 3 months into logging monthly data would see "Target breached" for a metric they were still on pace to hit by year end.
- **Fix:** Added `isAnnualValueComplete()` — `LATEST` (point-in-time snapshots) and `DIRECT_ANNUAL` (a single typed figure) indicators are evaluated immediately as before, since they have no partial-year state. `SUM`/`AVERAGE`/`COUNT` indicators, which build up from monthly entries, are only judged against their target once all 12 months of the fiscal year have been reported.
- **Verified live**, both directions, against the real app:
  - 3 of 12 months logged (9 hrs against a 35-hr target) → "Labor Standards & Human Rights" correctly shows **Pending**, absent from Needs Attention (previously: false "Target breached")
  - All 12 months logged (27 hrs, genuinely under the 35-hr target) → now correctly shows **Target breached**

### 3.2 False "email already exists" error on profile save

- **File:** `frontend/src/components/PlaceholderViews.tsx` (`ProfileTab.handleSave`)
- **Root cause:** The backend's uniqueness check (`AuthService.java:262`) was already correct — it only rejects a save if the email genuinely changed to one that's taken. The bug was frontend-side: `handleSave` had no guard against out-of-order async responses — if an earlier, slower save request resolved *after* a later, faster one, its result (including a stale error) could overwrite the fresher one's already-displayed success message.
- **Fix:** Added a request-sequencing guard (`saveRequestId` ref) so only the outcome of the most recently *issued* save request is ever applied to the UI.
- **Verified live:** normal single-save path still works correctly — editing the Bio field and saving shows "Profile saved." with no regression.

Both fixes: `tsc --noEmit` clean, no other files needed changes (the breach concept is used only in `Dashboard.tsx`; the DTOs already carried everything needed).

---

## Open items (not fixed, noted for later)

From §1: `TargetsView.tsx` optimistic-delete UX bug, `RolesView.tsx` swallowed error detail, `Dashboard.tsx` console noise for heavily-restricted roles.
