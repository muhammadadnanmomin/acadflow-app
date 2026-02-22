import { createClient } from "@/lib/supabase/client";

export async function getOrCreateOrganization(userId: string, name: string) {
  const supabase = createClient();

  // check if organization exists
  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("created_by", userId)
    .maybeSingle();

  if (existing) return existing.id;

  // create organization
  const { data: org, error } = await supabase
    .from("organizations")
    .insert({
      name,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;

  // add owner membership
  await supabase.from("organization_members").insert({
    organization_id: org.id,
    user_id: userId,
    role: "owner",
  });

  return org.id;
}