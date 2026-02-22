import { supabaseServerClient } from "@/lib/supabase/server-client";
import RegisterButtons from "@/components/conferences/RegisterButtons";
import PayButton from "@/components/payment/PayButton";

import {
  Calendar,
  MapPin,
  Globe,
  Phone,
  Mail,
  Users,
  CreditCard,
  Clock,
} from "lucide-react";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ConferenceDetail({ params }: Props) {
  // 👇 Await params
  const { id } = await params;

  const { data: conf, error } = await supabaseServerClient
    .from("conferences")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error(error);
  }

  if (!conf) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold">
          Conference not available
        </h2>

        <p className="text-gray-500 mt-2">
          This conference may be unpublished or removed.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">

      {/* Header */}
      <div className="space-y-3">

        <h1 className="text-3xl font-bold text-gray-900">
          {conf.title}
        </h1>

        <p className="text-gray-600">
          {conf.description}
        </p>

        <div className="flex flex-wrap gap-4 text-sm text-gray-500">

          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {conf.start_date} → {conf.end_date}
          </span>

          {conf.venue && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {conf.venue}
            </span>
          )}

          {conf.mode && (
            <span className="capitalize">
              ({conf.mode})
            </span>
          )}

        </div>

      </div>

      {/* Main Grid */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* Left Content */}
        <div className="md:col-span-2 space-y-6">

          {/* Important Dates */}
          <div className="border rounded-xl p-5 space-y-2">

            <h3 className="font-semibold text-lg">
              Important Dates
            </h3>

            {conf.submission_deadline && (
              <p className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                Submission Deadline: {conf.submission_deadline}
              </p>
            )}

            {conf.max_participants && (
              <p className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                Max Participants: {conf.max_participants}
              </p>
            )}

          </div>

          {/* Fees */}
          <div className="border rounded-xl p-5 space-y-2">

            <h3 className="font-semibold text-lg">
              Registration Fees
            </h3>

            <div className="grid sm:grid-cols-2 gap-2 text-sm">

              {conf.participant_fee && (
                <p>Participant: ₹{conf.participant_fee}</p>
              )}

              {conf.paper_fee && (
                <p>Paper Presentation: ₹{conf.paper_fee}</p>
              )}

              {conf.publication_fee && (
                <p>Publication: ₹{conf.publication_fee}</p>
              )}

              {conf.abstract_fee && (
                <p>Abstract: ₹{conf.abstract_fee}</p>
              )}

            </div>

          </div>

          {/* Contact */}
          <div className="border rounded-xl p-5 space-y-2">

            <h3 className="font-semibold text-lg">
              Contact Information
            </h3>

            {conf.contact_email && (
              <p className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4" />
                {conf.contact_email}
              </p>
            )}

            {conf.contact_phone && (
              <p className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4" />
                {conf.contact_phone}
              </p>
            )}

            {conf.website_link && (
              <a
                href={conf.website_link}
                target="_blank"
                className="flex items-center gap-2 text-sm text-indigo-600 hover:underline"
              >
                <Globe className="h-4 w-4" />
                Official Website
              </a>
            )}

          </div>

        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">

          {/* Action Card */}
          <div className="border rounded-xl p-5 space-y-4 sticky top-24 bg-white">

            <h3 className="font-semibold text-lg">
              Participate
            </h3>

            <p className="text-sm text-gray-500">
              Register, submit your paper, or attend this conference.
            </p>

            {/* Registration / Payment / Submission */}
            <RegisterButtons conferenceId={id} />

            <div className="flex items-center gap-2 text-xs text-gray-400 pt-2">
              <CreditCard className="h-4 w-4" />
              Secure Payment via Platform
            </div>

          </div>

        </div>


      </div>

    </div>
  );
}
