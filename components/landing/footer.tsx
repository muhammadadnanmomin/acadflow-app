import Link from "next/link";
import { GraduationCap, Mail, Phone } from "lucide-react";

const navigation = {
  product: [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
    { name: "Dashboard", href: "/dashboard" },
  ],

  resources: [
    { name: "User Guide", href: "#" },
    { name: "Support", href: "/contact" },
    { name: "FAQs", href: "#" },
    { name: "System Status", href: "#" },
  ],

  company: [
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <footer
      id="footer"
      className="border-t border-gray-200 bg-slate-50 px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">

        {/* Top Section */}
        <div className="grid gap-8 lg:grid-cols-5">

          {/* Brand */}
          <div className="lg:col-span-2">

            <Link
              href="/"
              className="flex items-center gap-2"
            >

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>

              <span className="text-xl font-semibold text-gray-900">
                AcadFlow
              </span>

            </Link>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-600">

              AcadFlow is a modern platform for managing academic conferences,
              submissions, reviews, and certifications — built for Indian
              colleges and universities.

            </p>

            {/* Contact */}
            <div className="mt-4 space-y-2 text-sm text-gray-600">

              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                support@acadflow.in
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                +91-XXXXXXXXXX
              </div>

            </div>

          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Product
            </h3>

            <ul className="mt-4 space-y-3">

              {navigation.product.map((item) => (
                <li key={item.name}>

                  <Link
                    href={item.href}
                    className="text-sm text-gray-600 hover:text-indigo-600 transition"
                  >
                    {item.name}
                  </Link>

                </li>
              ))}

            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Resources
            </h3>

            <ul className="mt-4 space-y-3">

              {navigation.resources.map((item) => (
                <li key={item.name}>

                  <Link
                    href={item.href}
                    className="text-sm text-gray-600 hover:text-indigo-600 transition"
                  >
                    {item.name}
                  </Link>

                </li>
              ))}

            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Company
            </h3>

            <ul className="mt-4 space-y-3">

              {navigation.company.map((item) => (
                <li key={item.name}>

                  <Link
                    href={item.href}
                    className="text-sm text-gray-600 hover:text-indigo-600 transition"
                  >
                    {item.name}
                  </Link>

                </li>
              ))}

            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 sm:flex-row">

          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} AcadFlow. All rights reserved.
          </p>

          <p className="text-sm text-gray-500">
            Made in India 🇮🇳 for Academia
          </p>

        </div>

      </div>
    </footer>
  );
}
