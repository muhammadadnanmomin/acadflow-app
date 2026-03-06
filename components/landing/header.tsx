"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Menu, X, GraduationCap } from "lucide-react";
import Image from "next/image";

import { useProfile } from "@/lib/auth/useProfile";
import { createClient } from "@/lib/supabase/client";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { profile, loading } = useProfile();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur">

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">

          <Image
            src="/logo.png"
            alt="AcadFlow logo"
            width={36}
            height={36}
            priority
          />

          <span className="text-xl font-semibold text-gray-900">
            AcadFlow
          </span>

        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">

          <Link
            href="#features"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Features
          </Link>

          <Link
            href="#how-it-works"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            How it Works
          </Link>

          <Link
            href="#benefits"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Benefits
          </Link>

          <Link
            href="#pricing"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Plans & Access
          </Link>

        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">

          {!loading && !profile && (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>

              <Link href="/signup">
                <Button size="sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}

          {!loading && profile && (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>

              <Button
                variant="outline"
                size="sm"
                onClick={logout}
              >
                Logout
              </Button>
            </>
          )}

        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-900" />
          ) : (
            <Menu className="h-6 w-6 text-gray-900" />
          )}
        </button>

      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t bg-white md:hidden">

          <nav className="flex flex-col gap-4 px-4 py-6">

            <Link
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-gray-600"
            >
              Features
            </Link>

            <Link
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-gray-600"
            >
              How it Works
            </Link>

            <Link
              href="#benefits"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-gray-600"
            >
              Benefits
            </Link>

            <Link
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-gray-600"
            >
              Pricing
            </Link>

            <div className="flex flex-col gap-2 pt-4">

              {!loading && !profile && (
                <>
                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="w-full"
                    >
                      Log in
                    </Button>
                  </Link>

                  <Link href="/signup">
                    <Button className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}

              {!loading && profile && (
                <>
                  <Link href="/dashboard">
                    <Button
                      variant="outline"
                      className="w-full"
                    >
                      Dashboard
                    </Button>
                  </Link>

                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={logout}
                  >
                    Logout
                  </Button>
                </>
              )}

            </div>

          </nav>

        </div>
      )}

    </header>
  );
}
