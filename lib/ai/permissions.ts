/**
 * Confairo AI Permission Helpers
 *
 * Centralized role-based access control for AI features.
 * Uses organization_members as the single source of truth for organizer roles.
 *
 * Role hierarchy in organization_members: owner > admin > staff
 * All three are treated as "organizer" for AI feature access.
 */

/** Organization roles that grant full AI access */
const ORGANIZER_ROLES = new Set(["owner", "admin", "staff"]);

/**
 * Check if an organization_members role qualifies as an organizer.
 */
export function isOrganizerRole(orgRole: string | null | undefined): boolean {
  if (!orgRole) return false;
  return ORGANIZER_ROLES.has(orgRole);
}

/**
 * Check if a user can use AI analysis features (review, plagiarism).
 * - Organization members (owner/admin/staff): always allowed
 * - Assigned reviewers: allowed
 */
export function canUseAI({
  orgRole,
  isAssigned,
}: {
  orgRole: string | null | undefined;
  isAssigned: boolean;
}): boolean {
  if (isOrganizerRole(orgRole)) return true;
  if (isAssigned) return true;
  return false;
}

/**
 * Check if a user can assign reviewers (Smart Assign).
 * Only organization members (owner/admin/staff) can do this.
 */
export function canAssignReviewers({
  orgRole,
}: {
  orgRole: string | null | undefined;
}): boolean {
  return isOrganizerRole(orgRole);
}
