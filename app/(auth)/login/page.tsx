"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import { signIn } from "@/lib/auth/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = createClient();

  const redirect = searchParams.get("redirect");


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    // Wait until session is available
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      if (redirect) {
        router.push(redirect);
      } else {
        router.push("/dashboard");
      }

      router.refresh(); // force reload auth state
    }

    setLoading(false);
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
            Welcome back
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Log in to continue to AcadFlow
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">

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

          {/* Password */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>

            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "Logging in..." : "Log In"}
          </Button>

        </form>

        {/* Footer */}
        <div className="mt-6 text-center space-y-2 text-sm text-gray-500">

          <div>
            Don’t have an account?{" "}
            <button
              onClick={() => router.push("/signup")}
              className="font-medium text-indigo-600 hover:underline"
            >
              Sign up
            </button>
          </div>

          <div>
            <button
              onClick={() => router.push("/forgot-password")}
              className="text-indigo-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
