/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Mirrors backend/.../user/Role.java. */
export type Role = 'COMPANY_ADMIN' | 'COMPANY_CONTRIBUTOR' | 'CONSULTANT' | 'PLATFORM_ADMIN' | 'SUPERADMIN' | 'PARTNER_ADMIN';

/** Roles that belong to a tenant company and see tenant data views (dashboard, materiality, etc). */
export const TENANT_ROLES: Role[] = ['COMPANY_ADMIN', 'COMPANY_CONTRIBUTOR', 'CONSULTANT'];

/** Roles allowed to manage the workspace itself: people, subscription, settings. */
export const MANAGEMENT_ROLES: Role[] = ['COMPANY_ADMIN'];

/** Roles allowed into the platform operator console. SUPERADMIN supersedes PLATFORM_ADMIN. */
export const PLATFORM_ROLES: Role[] = ['PLATFORM_ADMIN', 'SUPERADMIN'];

/** A white-label partner's own login — sees only its own companies (WHITELABEL_PLAN.md Phase 4). No company of its own, same as PLATFORM_ROLES. */
export const PARTNER_ROLES: Role[] = ['PARTNER_ADMIN'];

/** `allowed` of `undefined` means "any authenticated role" — the common case for data views. */
export function canAccess(userRole: Role | undefined, allowed?: Role[]): boolean {
  if (!allowed) return true;
  if (!userRole) return false;
  return allowed.includes(userRole);
}

/**
 * Custom per-company RBAC check (module.action keys, e.g. 'team.manage') — the fine-grained
 * complement to canAccess()'s coarse role-group checks. COMPANY_ADMIN always passes (the fixed
 * "owner" role — see backend PermissionGateService); PLATFORM_ROLES are out of scope for this
 * axis entirely and never pass. Everyone else needs the key in their assigned custom role's
 * granted permission set, fetched once at login onto UserProfile.permissions.
 */
export function hasPermission(userRole: Role | undefined, permissions: Set<string> | undefined, key: string): boolean {
  if (!userRole) return false;
  if (userRole === 'COMPANY_ADMIN') return true;
  if (canAccess(userRole, PLATFORM_ROLES) || canAccess(userRole, PARTNER_ROLES)) return false;
  return permissions?.has(key) ?? false;
}

/**
 * Where to send a user right after login/registration. Platform-level and partner roles have no
 * company and skip onboarding entirely (there's nothing for them to onboard) — they go straight
 * to their own console.
 */
export function postLoginPath(role: Role | undefined, onboardingCompleted: boolean): string {
  if (canAccess(role, PLATFORM_ROLES)) return '/admin';
  if (canAccess(role, PARTNER_ROLES)) return '/partner';
  if (!onboardingCompleted) return '/onboarding';
  return '/dashboard';
}
