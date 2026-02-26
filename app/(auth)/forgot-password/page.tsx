"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 px-4"
      suppressHydrationWarning
    >
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-lg sm:p-8">

        {/* Title */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Reset Password
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            We’ll send you a reset link
          </p>
        </div>

        {/* Success */}
        {success ? (
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 text-center">
            ✅ Reset link sent. Check your email.
          </div>
        ) : (

          <form onSubmit={handleReset} className="space-y-4">

            {/* Email */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Email
              </label>

              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>

          </form>
        )}

        {/* Back */}
        <div className="mt-6 text-center text-sm text-gray-500">

          <button
            onClick={() => history.back()}
            className="text-indigo-600 hover:underline"
          >
            ← Back to login
          </button>

        </div>

      </div>
    </div>
  );
}
