import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  console.log("🚀 accept-reviewer-invite invoked");

  try {
    /* -------------------------------
       1️⃣ Validate auth header
    -------------------------------- */
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      console.error("❌ Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    /* -------------------------------
       2️⃣ Create Supabase clients
    -------------------------------- */

    // Client WITH user context (for auth)
    const supabaseAuth = createClient(
      Deno.env.get("NEXT_PUBLIC_SUPABASE_URL")!,
      Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Client WITH service role (for DB writes)
    const supabaseAdmin = createClient(
      Deno.env.get("NEXT_PUBLIC_SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    /* -------------------------------
       3️⃣ Get authenticated user
    -------------------------------- */
    const {
      data: { user },
      error: userErr,
    } = await supabaseAuth.auth.getUser();

    if (userErr || !user) {
      console.error("❌ Auth failed", userErr);
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 401 }
      );
    }

    console.log("👤 User:", user.id, user.email);

    /* -------------------------------
       4️⃣ Parse request body
    -------------------------------- */
    const { inviteId } = await req.json();

    if (!inviteId) {
      return new Response(
        JSON.stringify({ error: "inviteId is required" }),
        { status: 400 }
      );
    }

    console.log("📨 Invite ID:", inviteId);

    /* -------------------------------
       5️⃣ Fetch invite
    -------------------------------- */
    const { data: invite, error: inviteErr } =
      await supabaseAdmin
        .from("reviewer_invites")
        .select("*")
        .eq("id", inviteId)
        .single();

    if (inviteErr || !invite) {
      console.error("❌ Invite not found");
      return new Response(
        JSON.stringify({ error: "Invite not found" }),
        { status: 404 }
      );
    }

    if (invite.status === "accepted") {
      return new Response(
        JSON.stringify({ error: "Invite already accepted" }),
        { status: 409 }
      );
    }

    if (invite.email !== user.email) {
      return new Response(
        JSON.stringify({ error: "Email mismatch" }),
        { status: 403 }
      );
    }

    /* -------------------------------
       6️⃣ Register reviewer in conference_staff
    -------------------------------- */
    const { error: regErr } = await supabaseAdmin
      .from("conference_staff")
      .insert({
        user_id: user.id,
        conference_id: invite.conference_id,
        role: "reviewer",
      });

    if (regErr && regErr.code !== "23505") {
      console.error("❌ Registration failed", regErr);
      return new Response(
        JSON.stringify({ error: regErr.message }),
        { status: 500 }
      );
    }

    /* -------------------------------
       7️⃣ Mark invite accepted
    -------------------------------- */
    await supabaseAdmin
      .from("reviewer_invites")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", inviteId);

    console.log("✅ Invite accepted successfully");

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );

  } catch (err) {
    console.error("🔥 Unexpected error", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
});
