/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlanType } from '../../contexts/PlanContext';
import { TenantSummaryResponse } from '../../api/tenantAdminApi';
import { planFromBackend, marketFromBackend } from '../../api/mappers';
import { MatterCategory, MatterSet } from '../../api/referenceApi';

export interface Tenant {
  id: string;
  name: string;
  plan: PlanType;
  marketClassification: 'SME' | 'Main Market' | 'ACE Market';
  status: 'Active' | 'Suspended';
  createdDate: string;
  contactPerson: string;
  contactEmail: string;
}

export function toTenant(t: TenantSummaryResponse): Tenant {
  return {
    id: t.id,
    name: t.name,
    plan: planFromBackend(t.subscriptionPlan),
    marketClassification: marketFromBackend(t.marketClassification),
    status: t.active ? 'Active' : 'Suspended',
    createdDate: t.createdAt.slice(0, 10),
    contactPerson: t.primaryContactName ?? '—',
    contactEmail: t.primaryContactEmail ?? '—',
  };
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  tenantName: string;
  eventType: 'Signup' | 'Upgrade' | 'Cancellation' | 'Sync Success' | 'Support Request';
  eventDescription: string;
  badgeColor: string;
}

export interface MatterFormState {
  id: string;
  name: string;
  category: MatterCategory;
  description: string;
  matterSet: MatterSet;
}

export type ToastType = 'success' | 'info' | 'warning';
export type ShowToast = (message: string, type?: ToastType) => void;
