/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

/** Unauthenticated reads for the public marketing site — no JWT required (see backend SecurityConfig's permitAll for /api/v1/public/**). */
export const publicApi = {
  planPricing: () => apiClient.get<PublicPlanPricing[]>('/api/v1/public/plan-pricing'),
  features: () => apiClient.get<PublicFeatureFlag[]>('/api/v1/public/features'),
};
