import Link from "next/link";
import Image from "next/image";
import { Mail, Phone } from "lucide-react";

const navigation = {
  product: [
    { name: "Features", href: "/#features" },
    { name: "How It Works", href: "/#how-it-works" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Why AcadFlow", href: "/#comparison" },
    { name: "Dashboard", href: "/dashboard" },
  ],

  resources: [
    { name: "Blog", href: "/blog" },
    { name: "User Guide", href: "user-guide" },
    { name: "Support", href: "/contact" },
    { name: "FAQs", href: "/faq" },
    { name: "System Status", href: "status" },
  ],

  company: [
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms & Conditions", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <footer
      id="footer"
      className="border-t border-gray-200 bg-slate-50 px-4 py-14 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">

        {/* Top Section */}
        <div className="grid gap-10 lg:grid-cols-5">

          {/* Brand */}
          <div className="lg:col-span-2">

            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="AcadFlow"
                width={36}
                height={36}
                priority
              />

              <span className="text-xl font-semibold text-gray-900">
                AcadFlow
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-600">
              AcadFlow is a conference management platform for universities
              and research communities. Automate submissions, reviews,
              scheduling, and certificates from one dashboard.
            </p>

            {/* Contact */}
            <div className="mt-5 space-y-2 text-sm text-gray-600">

              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-indigo-600" />
                acadflow.platform@gmail.com
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-indigo-600" />
                +91-7796453687
              </div>

            </div>

            {/* Trust Note */}
            <p className="mt-4 text-xs text-gray-500">
              Secure platform • Role-based access • Built for academia
            </p>

          </div>

          {/* Product */}
          <FooterColumn title="Product" items={navigation.product} />

          {/* Resources */}
          <FooterColumn title="Resources" items={navigation.resources} />

          {/* Company */}
          <FooterColumn title="Company" items={navigation.company} />

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-6 sm:flex-row">

          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} AcadFlow. All rights reserved.
          </p>

          {/* <p className="text-sm text-gray-500">
            Built with ❤️ in India for academia
          </p> */}

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
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>

      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              className="text-sm text-gray-600 transition hover:text-indigo-600"
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}