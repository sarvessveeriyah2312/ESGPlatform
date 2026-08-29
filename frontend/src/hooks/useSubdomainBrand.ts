/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { publicApi, PublicBrand } from '../api/publicApi';

const ESGEASY_DEFAULT: PublicBrand = { brandName: 'EsgEasy', logoUrl: null, primaryColor: null };

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

/** Pre-login brand for whichever partner's subdomain this page is being visited on, or EsgEasy's own if none. Used by LoginPage/RegisterPage — see WHITELABEL_PLAN.md Phase 3. */
export function useSubdomainBrand(): PublicBrand {
  const [brand, setBrand] = useState<PublicBrand>(ESGEASY_DEFAULT);

  useEffect(() => {
    const slug = resolveSubdomainSlug(window.location.hostname);
    if (!slug) {
      return;
    }
    publicApi.brand(slug).then(setBrand).catch(() => {
      // Network/API hiccup on a public page with no auth to retry with — silently keep the
      // EsgEasy default rather than leaving the login page broken.
    });
  }, []);

  return brand;
}
