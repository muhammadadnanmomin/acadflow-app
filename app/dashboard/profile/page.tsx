import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProfileViewPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Profile</h1>

        <Link
          href="/dashboard/profile/edit"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          Edit Profile
        </Link>
      </div>

      <div className="bg-white p-6 rounded-xl border space-y-4">
        <div>
          <p className="text-gray-400 text-sm">Username</p>
          <p className="font-medium">{profile.username}</p>
        </div>

        <div>
          <p className="text-gray-400 text-sm">Bio</p>
          <p>{profile.bio || "No bio added yet."}</p>
        </div>

        <div>
          <p className="text-gray-400 text-sm">Research Interests</p>
          <p>
            {profile.research_interests?.join(", ") ||
              "Not specified"}
          </p>
        </div>
      </div>
    </div>
  );
}
