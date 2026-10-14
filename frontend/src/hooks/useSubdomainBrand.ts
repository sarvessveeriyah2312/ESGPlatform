import { useEffect, useState } from 'react';
import { publicApi, PublicBrand } from '../api/publicApi';
import { resolveSubdomainSlug } from '../api/subdomain';

export { resolveSubdomainSlug };

const ESGEASY_DEFAULT: PublicBrand = { brandName: 'EsgEasy', logoUrl: null, primaryColor: null };

/** Pre-login brand for whichever partner's subdomain this page is being visited on, or EsgEasy's own if none. Used by LoginPage/RegisterPage. */
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
