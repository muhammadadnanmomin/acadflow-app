"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { signIn } from "@/lib/auth/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = createClient();

  const redirect = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      router.push(redirect ?? "/dashboard");
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 px-4"
      suppressHydrationWarning
    >
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-lg sm:p-8 transition hover:shadow-xl">
        {/* Brand header */}
        <div className="mb-2 text-center">
          <span className="text-lg font-semibold text-indigo-600 tracking-wide">
            Confairo
          </span>
        </div>

        {/* Title */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Sign in to continue to Confairo.
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
              autoFocus
              onChange={(e) => setEmail(e.target.value)}
              className="focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Submit */}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {/* Social login divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">or continue with</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Footer */}
        <div className="text-center space-y-2 text-sm text-gray-500">
          <div>
            Don&apos;t have an account?{" "}
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