import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

/**
 * Returns an array of conference IDs that the given user has access to
 * as either the original owner (organizer_id) or a co-organizer
 * (via conference_organizers table).
 *
 * Optionally also includes conferences belonging to the user's organization.
 */
export async function getMyConferenceIds(
  userId: string,
  organizationId?: string | null
): Promise<string[]> {
  // 1. Conferences where user is the original owner or belongs to the org
  const ownerFilter = organizationId
    ? `organizer_id.eq.${userId},organization_id.eq.${organizationId}`
    : `organizer_id.eq.${userId}`;

  const { data: ownedConfs } = await supabase
    .from("conferences")
    .select("id")
    .or(ownerFilter);

  // 2. Conferences where user is a co-organizer
  const { data: coOrgRows } = await supabase
    .from("conference_organizers")
    .select("conference_id")
    .eq("user_id", userId);

  // Merge and deduplicate
  const idSet = new Set<string>();

  ownedConfs?.forEach((c) => idSet.add(c.id));
  coOrgRows?.forEach((r) => idSet.add(r.conference_id));

  return Array.from(idSet);
}

/**
 * Checks whether a specific user has organizer-level access to a conference.
 * Returns the user's role ('owner' | 'organizer') or null if no access.
 */
export async function getConferenceRole(
  userId: string,
  conferenceId: string
): Promise<"owner" | "organizer" | null> {
  // Check if user is the original owner
  const { data: conf } = await supabase
    .from("conferences")
    .select("organizer_id")
    .eq("id", conferenceId)
    .single();

  if (conf?.organizer_id === userId) return "owner";

  // Check conference_organizers
  const { data: row } = await supabase
    .from("conference_organizers")
    .select("role")
    .eq("conference_id", conferenceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (row) return row.role as "owner" | "organizer";

  return null;
}
