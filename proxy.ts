import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  /* =====================================================
     🔐 INVITE PROTECTION (existing)
  ===================================================== */
  if (path.startsWith("/invites") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set(
      "redirect",
      request.nextUrl.pathname + request.nextUrl.search
    );
    return NextResponse.redirect(url);
  }

  /* =====================================================
     🔐 DASHBOARD AUTH PROTECTION
  ===================================================== */
  if (path.startsWith("/dashboard")) {
    // Not logged in → go login
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", path);
      return NextResponse.redirect(url);
    }

    // Get user profile role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role ?? "participant";

    /* ================= ADMIN ================= */
    if (path.startsWith("/dashboard/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    /* ================= ORGANIZER ================= */
    if (path.startsWith("/dashboard/organizer") && role !== "organizer") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    /* ================= REVIEWER ================= */
    if (path.startsWith("/dashboard/reviewer")) {
      const { data: reviewer } = await supabase
        .from("conference_registrations")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", "reviewer")
        .limit(1);

      if (!reviewer || reviewer.length === 0) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
