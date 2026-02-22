import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

/* =========================
   SIGN UP
========================= */
export async function signUp(
  email: string,
  password: string,
  username: string,
  role: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        role, // will be used by DB trigger
      },
    },
  });

  if (error) {
    return { error };
  }

  // Profile is automatically created by DB trigger
  return { error: null };
}

/* =========================
   SIGN IN
========================= */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

/* =========================
   SIGN OUT
========================= */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/* =========================
   RESET PASSWORD
========================= */
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset`,
  });

  return { data, error };
}

/* =========================
   GET CURRENT USER
========================= */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { user, error };
}
