import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{
    username: string;
  }>;
}

export default async function PublicProfile({ params }: Props) {
  const { username } = await params;

  const supabase = await createServerSupabaseClient();

  // Fetch profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !profile) {
    notFound();
  }

  // Fetch education
  const { data: educationList } = await supabase
    .from("education")
    .select("*")
    .eq("profile_id", profile.id)
    .order("start_year", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-2xl p-8">

        {/* HEADER */}
        <div className="flex flex-col items-center text-center">

          <div className="h-24 w-24 rounded-full overflow-hidden bg-indigo-100">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-indigo-600">
                {profile.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <h1 className="mt-4 text-2xl font-bold">
            @{profile.username}
          </h1>

          <p className="text-sm text-gray-500 mt-1 capitalize mb-6">
            {profile.role}
          </p>
        </div>

        <div className="my-8 border-t" />

        {/* ABOUT */}
        {profile.bio && (
          <div className="mb-8 mt-6">
            <h2 className="text-lg font-semibold mb-2">
              About
            </h2>
            <p className="text-gray-700 whitespace-pre-line">
              {profile.bio}
            </p>
          </div>
        )}

        {/* RESEARCH INTERESTS */}
        {profile.research_interests?.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2">
              Research Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.research_interests.map(
                (interest: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-full"
                  >
                    {interest}
                  </span>
                )
              )}
            </div>
          </div>
        )}

        {/* EDUCATION */}
        {educationList && educationList.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 mt-6">
              Education
            </h2>

            <div className="space-y-6">
              {educationList.map((edu) => (
                <div key={edu.id} className="relative pl-6 border-l-2 border-indigo-200">

                  <div className="absolute -left-[9px] top-1.5 h-4 w-4 bg-indigo-500 rounded-full" />

                  <p className="font-semibold text-gray-900">
                    {edu.institution}
                  </p>

                  <p className="text-sm text-gray-700">
                    {edu.degree}
                    {edu.field_of_study && ` • ${edu.field_of_study}`}
                  </p>

                  <p className="text-sm text-gray-500">
                    {edu.start_year}
                    {edu.end_year
                      ? ` - ${edu.end_year}`
                      : " - Present"}
                  </p>

                  {edu.description && (
                    <p className="text-sm text-gray-600 mt-2">
                      {edu.description}
                    </p>
                  )}

                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
