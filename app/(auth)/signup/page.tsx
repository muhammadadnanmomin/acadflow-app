"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { signUp } from "@/lib/auth/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const redirect = searchParams.get("redirect");

  // reviewer invites still supported
  const selectedRole = searchParams.get("role");
  const isReviewerInvite = selectedRole === "reviewer";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const usernameRegex = /^[a-z0-9-]{3,30}$/;

    if (!usernameRegex.test(username)) {
      toast({
        variant: "destructive",
        title: "Invalid Username",
        description:
          "Username must be 3-30 characters (lowercase letters, numbers, hyphen only).",
      });
      setLoading(false);
      return;
    }

    // reviewer invite keeps reviewer role
    const role = isReviewerInvite ? "reviewer" : "participant";

    const { error } = await signUp(
      email,
      password,
      username,
      role
    );

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
      title: "Account Created",
      description: isReviewerInvite
        ? "Reviewer account created. Please verify your email."
        : "Check your email to verify your account.",
    });

    setTimeout(() => {
      if (redirect) {
        router.push(`/login?redirect=${redirect}`);
      } else {
        router.push("/login");
      }
    }, 1500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-lg sm:p-8">

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {isReviewerInvite ? "Reviewer Registration" : "Create Account"}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {isReviewerInvite
              ? "You have been invited to review a conference."
              : "Start using AcadFlow"}
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
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase())
              }
              placeholder="muhammad-adnan"
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
              required
              value={email}
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
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Reviewer Notice */}
          {isReviewerInvite && (
            <div className="rounded-md bg-indigo-50 p-3 text-sm text-indigo-700">
              You are registering as a <strong>Reviewer</strong>.
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? "Creating..." : "Sign Up"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-indigo-600 hover:underline"
          >
            Login
          </button>
        </div>

      </div>
    </div>
  );
}