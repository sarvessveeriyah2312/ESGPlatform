/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Mirrors backend/.../user/Role.java. */
export type Role = 'COMPANY_ADMIN' | 'COMPANY_CONTRIBUTOR' | 'CONSULTANT' | 'PLATFORM_ADMIN' | 'SUPERADMIN';

/** Roles that belong to a tenant company and see tenant data views (dashboard, materiality, etc). */
export const TENANT_ROLES: Role[] = ['COMPANY_ADMIN', 'COMPANY_CONTRIBUTOR', 'CONSULTANT'];

/** Roles allowed to manage the workspace itself: people, subscription, settings. */
export const MANAGEMENT_ROLES: Role[] = ['COMPANY_ADMIN'];

/** Roles allowed into the platform operator console. SUPERADMIN supersedes PLATFORM_ADMIN. */
export const PLATFORM_ROLES: Role[] = ['PLATFORM_ADMIN', 'SUPERADMIN'];

/** `allowed` of `undefined` means "any authenticated role" — the common case for data views. */
export function canAccess(userRole: Role | undefined, allowed?: Role[]): boolean {
  if (!allowed) return true;
  if (!userRole) return false;
  return allowed.includes(userRole);
}

/**
 * Where to send a user right after login/registration. Platform-level roles have no company
 * and skip onboarding entirely (there's nothing for them to onboard) — they go straight to the
 * operator console.
 */
export function postLoginPath(role: Role | undefined, onboardingCompleted: boolean): string {
  if (canAccess(role, PLATFORM_ROLES)) return '/admin';
  if (!onboardingCompleted) return '/onboarding';
  return '/dashboard';
}
