import { apiClient } from './client';
import { BackendSubscriptionPlan } from './mappers';

export interface PublicPlanPricing {
  plan: BackendSubscriptionPlan;
  monthlyPrice: number;
  annualMonthlyPrice: number;
}

export interface PublicFeatureFlag {
  featureKey: string;
  minPlan: BackendSubscriptionPlan;
  visibleOnlyAtMinPlan: boolean;
}

/** Pre-login brand for a partner's subdomain — always resolves to something (EsgEasy's own defaults if no partner matches), never 404s. See WHITELABEL_PLAN.md Phase 3. */
export interface PublicBrand {
  brandName: string;
  logoUrl: string | null;
  primaryColor: string | null;
}

/** Unauthenticated reads for the public marketing site — no JWT required (see backend SecurityConfig's permitAll for /api/v1/public/**). */
export const publicApi = {
  planPricing: () => apiClient.get<PublicPlanPricing[]>('/api/v1/public/plan-pricing'),
  features: () => apiClient.get<PublicFeatureFlag[]>('/api/v1/public/features'),
  brand: (subdomain: string) => apiClient.get<PublicBrand>('/api/v1/public/brand', { subdomain }),
};
