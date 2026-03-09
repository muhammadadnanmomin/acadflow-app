"use client";

import { Suspense, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signUp } from "@/lib/auth/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupInner />
    </Suspense>
  );
}

/* ── Password strength helper ─────────────────────────────── */
function getPasswordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;

  if (score <= 1) return { label: "Weak", color: "bg-red-500", width: "w-1/3" };
  if (score <= 2) return { label: "Medium", color: "bg-yellow-500", width: "w-2/3" };
  return { label: "Strong", color: "bg-green-500", width: "w-full" };
}

function SignupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const redirect = searchParams.get("redirect");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const usernameRegex = /^[a-z0-9-]{3,30}$/;

    if (!usernameRegex.test(username)) {
      toast({
        variant: "destructive",
        title: "Invalid Username",
        description:
          "Username must be 3–30 characters (lowercase letters, numbers, hyphen only).",
      });
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, username);

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message,
      });
      return;
    }

    toast({
      title: "Verify your email 📩",
      description: `We sent a confirmation link to ${email}. Please verify your account to continue.`,
    });

    setTimeout(() => {
      router.push(redirect ? `/login?redirect=${redirect}` : "/login");
    }, 2500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-lg sm:p-8 transition hover:shadow-xl">
        {/* Brand header */}
        <div className="mb-2 text-center">
          <span className="text-lg font-semibold text-indigo-600 tracking-wide">
            AcadFlow
          </span>
        </div>

        {/* Title */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Create your AcadFlow account
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage conferences, submissions, and peer reviews in one place.
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Username */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Username
            </label>
            <Input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase())
              }
              placeholder="your-username"
              className="focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500">
              3–30 characters. Lowercase letters, numbers, hyphen only.
            </p>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Email
            </label>
            <Input
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500">
              We&apos;ll send a confirmation email after signup.
            </p>
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
                required
                value={password}
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

            {/* Password strength indicator */}
            {password.length > 0 && (
              <div className="mt-1.5">
                <div className="h-1.5 w-full rounded-full bg-gray-200">
                  <div
                    className={`h-1.5 rounded-full transition-all ${strength.color} ${strength.width}`}
                  />
                </div>
                <p className={`text-xs mt-0.5 ${strength.label === "Weak"
                  ? "text-red-500"
                  : strength.label === "Medium"
                    ? "text-yellow-600"
                    : "text-green-600"
                  }`}>
                  {strength.label}
                </p>
              </div>
            )}

            <p className="text-xs text-gray-500">
              8–64 characters. Use letters, numbers, and symbols for a stronger password.
            </p>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account…
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        {/* Terms notice */}
        <p className="mt-3 text-center text-xs text-gray-400">
          By creating an account you agree to our{" "}
          <a href="/terms" className="underline hover:text-indigo-600">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline hover:text-indigo-600">
            Privacy Policy
          </a>
          .
        </p>

        {/* Social login divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">or continue with</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="font-medium text-indigo-600 hover:underline"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}