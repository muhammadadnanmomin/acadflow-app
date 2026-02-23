"use client";

import { useState } from "react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // 🔹 Replace with email service later (Resend, Formspree, Supabase, etc.)
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1200);
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* Header */}
      <Header />

      <section className="mx-auto max-w-6xl px-4 py-16">

        {/* Title */}
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold">
            Contact Us
          </h1>

          <p className="mt-4 text-lg text-gray-600">
            Have questions, partnership inquiries, or need support?
            We’re here to help.
          </p>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-2">

          {/* Contact Info */}
          <div className="space-y-8">

            <div className="flex items-start gap-4">
              <Mail className="h-6 w-6 text-indigo-600" />
              <div>
                <p className="font-semibold">Email</p>
                <p className="text-gray-600">
                  acadflow.platform@gmail.com
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Phone className="h-6 w-6 text-indigo-600" />
              <div>
                <p className="font-semibold">Phone</p>
                <p className="text-gray-600">
                  +91-7796453687
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <MapPin className="h-6 w-6 text-indigo-600" />
              <div>
                <p className="font-semibold">Location</p>
                <p className="text-gray-600">
                  Maharashtra, India
                </p>
              </div>
            </div>

            <div className="rounded-xl border bg-slate-50 p-6">
              <p className="font-semibold">
                For Institutions & Universities
              </p>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Contact us for custom deployments, institutional pricing,
                onboarding support, and academic integrations.
              </p>
            </div>

          </div>

          {/* Contact Form */}
          <div className="rounded-xl border bg-white p-8 shadow-sm">

            {sent ? (
              <div className="text-center py-10">
                <p className="text-lg font-semibold text-indigo-600">
                  Message Sent ✓
                </p>
                <p className="mt-2 text-gray-600">
                  We’ll get back to you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">

                <div>
                  <label className="text-sm font-medium">
                    Name
                  </label>
                  <Input required placeholder="Your name" />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Email
                  </label>
                  <Input required type="email" placeholder="you@email.com" />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Message
                  </label>
                  <Textarea
                    required
                    rows={5}
                    placeholder="How can we help you?"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Sending..." : "Send Message"}
                </Button>

              </form>
            )}

          </div>

        </div>

      </section>

      {/* Footer */}
      <Footer />

    </main>
  );
}