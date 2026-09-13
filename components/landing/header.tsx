"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Image from "next/image";

import { useProfile } from "@/lib/auth/useProfile";
import { createClient } from "@/lib/supabase/client";
import { BookDemoButton } from "@/components/demo/BookDemoButton";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { profile, loading } = useProfile();
  const router = useRouter();
  const pathname = usePathname();

  const isBlogActive = pathname === "/blog" || pathname.startsWith("/blog/");
  const isConferencesActive = pathname === "/conferences" || pathname.startsWith("/conferences/");

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const navLinkClass = (active: boolean) =>
    `text-[13px] font-medium transition-colors duration-200 ${
      active
        ? "text-[var(--lp-accent)] border-b-2 border-current pb-0.5"
        : "lp-link"
    }`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--lp-border)] bg-white">

      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Confairo logo"
            width={28}
            height={28}
            priority
          />
          <span className="text-base font-semibold text-[var(--lp-ink)]">
            Confairo
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          <Link href="/#features" className={navLinkClass(false)}>
            Features
          </Link>
          <Link href="/#how-it-works" className={navLinkClass(false)}>
            How It Works
          </Link>
          <Link href="/#pricing" className={navLinkClass(false)}>
            Plans
          </Link>
          <Link href="/blog" className={navLinkClass(isBlogActive)}>
            Blog
          </Link>
          <Link href="/conferences" className={navLinkClass(isConferencesActive)}>
            Conferences
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 md:flex">

          <BookDemoButton variant="ghost" />

          {!loading && !profile && (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-[13px]">
                  Log in
                </Button>
              </Link>

              <Link href="/signup">
                <Button
                  size="sm"
                  className="text-[13px] bg-[var(--lp-accent)] text-white hover:bg-[var(--lp-accent-hover)]"
                >
                  Get Started
                </Button>
              </Link>
            </>
          )}

          {!loading && profile && (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-[13px]">
                  Dashboard
                </Button>
              </Link>

              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="text-[13px] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors duration-200"
              >
                Logout
              </Button>
            </>
          )}

        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-1.5 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5 text-[var(--lp-ink)]" />
          ) : (
            <Menu className="h-5 w-5 text-[var(--lp-ink)]" />
          )}
        </button>

      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-[var(--lp-border)] bg-white md:hidden">

          <nav className="flex flex-col gap-1 px-4 py-4" aria-label="Mobile navigation">

            <Link
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-[var(--lp-ink-secondary)] hover:bg-[var(--lp-surface-subtle)]"
            >
              Features
            </Link>

            <Link
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-[var(--lp-ink-secondary)] hover:bg-[var(--lp-surface-subtle)]"
            >
              How It Works
            </Link>

            <Link
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-[var(--lp-ink-secondary)] hover:bg-[var(--lp-surface-subtle)]"
            >
              Plans
            </Link>

            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                isBlogActive
                  ? "text-[var(--lp-accent)] bg-[var(--lp-accent-light)]"
                  : "text-[var(--lp-ink-secondary)] hover:bg-[var(--lp-surface-subtle)]"
              }`}
            >
              Blog
            </Link>

            <Link
              href="/conferences"
              onClick={() => setMobileMenuOpen(false)}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                isConferencesActive
                  ? "text-[var(--lp-accent)] bg-[var(--lp-accent-light)]"
                  : "text-[var(--lp-ink-secondary)] hover:bg-[var(--lp-surface-subtle)]"
              }`}
            >
              Conferences
            </Link>

            <div className="mt-3 flex flex-col gap-2 border-t border-[var(--lp-border)] pt-4">

              <BookDemoButton
                variant="secondary"
                onBeforeOpen={() => setMobileMenuOpen(false)}
                className="w-full justify-center"
              />

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
                    <Button className="w-full bg-[var(--lp-accent)] text-white hover:bg-[var(--lp-accent-hover)]">
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
