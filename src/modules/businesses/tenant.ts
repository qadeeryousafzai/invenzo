export type TenantMembershipLike = { businessId: string };

/** Select only among memberships already loaded for the authenticated user. */
export function selectAuthorizedMembership<T extends TenantMembershipLike>(memberships: T[], requestedBusinessId?: string | null) {
  return memberships.find((membership) => membership.businessId === requestedBusinessId) ?? memberships[0];
}
