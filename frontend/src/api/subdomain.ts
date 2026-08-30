/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Extracts a partner's subdomain slug from the browser's own hostname, if this page is being
 * visited on one. Recognizes two shapes:
 *   - "{slug}.localhost" (any port) — local dev; the ".localhost" TLD resolves to loopback in
 *     every modern browser/OS with no /etc/hosts edit needed (RFC 6761), so this is directly
 *     testable by just navigating to e.g. http://nusantara.localhost:3000.
 *   - "{slug}.esgeasy.my" — the real production wildcard domain (WHITELABEL_PLAN.md Phase 3),
 *     excluding "www" since that's the apex marketing site, not a partner.
 * Returns null for the bare app domain (esgeasy.my, localhost, an IP, etc.) — no subdomain, no
 * partner to resolve, caller should just use EsgEasy's own branding without an API call.
 *
 * Lives in api/ (not hooks/) so client.ts can depend on it without a hooks -> api -> client
 * import cycle (useSubdomainBrand pulls in publicApi, which pulls in client.ts itself).
 */
export function resolveSubdomainSlug(hostname: string): string | null {
  const labels = hostname.split('.');

  if (labels.length === 2 && labels[1] === 'localhost') {
    return labels[0];
  }
  if (labels.length === 3 && labels[1] === 'esgeasy' && labels[2] === 'my' && labels[0] !== 'www') {
    return labels[0];
  }
  return null;
}
