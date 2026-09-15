import Link from "next/link";
import Image from "next/image";
import { Mail, Phone } from "lucide-react";

const navigation = {
  product: [
    { name: "Features", href: "/#features" },
    { name: "How It Works", href: "/#how-it-works" },
    { name: "Plans", href: "/#pricing" },
    { name: "Conferences", href: "/conferences" },
  ],

  resources: [
    { name: "Blog", href: "/blog" },
    { name: "User Guide", href: "/user-guide" },
    { name: "FAQs", href: "/faq" },
    { name: "System Status", href: "/status" },
  ],

  company: [
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms & Conditions", href: "/terms" },
  ],

  account: [
    { name: "Log In", href: "/login" },
    { name: "Get Started", href: "/signup" },
    { name: "Dashboard", href: "/dashboard" },
  ],
};

export function Footer() {
  return (
    <footer
      id="footer"
      className="border-t px-4 py-10 sm:px-6 lg:px-8"
      style={{
        borderColor: "var(--lp-border)",
        backgroundColor: "var(--lp-surface-subtle)",
      }}
    >
      <div className="mx-auto max-w-7xl">

        {/* Top Section */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6">

          {/* Brand — spans 2 cols */}
          <div className="lg:col-span-2">

            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="Confairo"
                width={28}
                height={28}
                priority
              />
              <span className="text-base font-semibold text-[var(--lp-ink)]">
                Confairo
              </span>
            </Link>

            <p className="mt-2.5 max-w-xs text-sm leading-relaxed text-[var(--lp-ink-tertiary)]">
              Academic conference management platform for universities
              and research communities.
            </p>

            {/* Contact */}
            <div className="mt-3 space-y-1 text-sm text-[var(--lp-ink-tertiary)]">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-[var(--lp-accent)]" />
                Confairo.platform@gmail.com
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-[var(--lp-accent)]" />
                +91-7796453687
              </div>
            </div>

          </div>

          {/* Product */}
          <FooterColumn title="Product" items={navigation.product} />

          {/* Resources */}
          <FooterColumn title="Resources" items={navigation.resources} />

          {/* Company */}
          <FooterColumn title="Company" items={navigation.company} />

          {/* Account */}
          <FooterColumn title="Account" items={navigation.account} />

        </div>

        {/* Bottom Bar */}
        <div
          className="mt-8 flex flex-col items-center justify-between gap-2 border-t pt-5 sm:flex-row"
          style={{ borderColor: "var(--lp-border)" }}
        >
          <p className="text-xs text-[var(--lp-ink-tertiary)]">
            © {new Date().getFullYear()} Confairo. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}

/* Footer Column */
function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: { name: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--lp-ink)]">
        {title}
      </h3>
      <ul className="mt-2.5 space-y-1.5">
        {items.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              className="text-sm text-[var(--lp-ink-tertiary)] transition-colors duration-200 hover:text-[var(--lp-accent)]"
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}