import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { supabaseServerClient } from "@/lib/supabase/server-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
    Globe,
    Linkedin,
    MapPin,
    Calendar,
    CalendarClock,
    ArrowRight,
    Building2,
    Users,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { slug } = await params;

    const { data: org } = await supabaseServerClient
        .from("organizations")
        .select("name, description")
        .eq("slug", slug)
        .maybeSingle();

    if (!org) {
        return { title: "Organization Not Found | AcadFlow" };
    }

    return {
        title: `${org.name} | AcadFlow`,
        description:
            org.description ||
            `View conferences and research events hosted by ${org.name}.`,
    };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function OrganizationProfilePage({
    params,
}: PageProps) {
    const { slug } = await params;

    /* --- Fetch organization --- */
    const { data: org } = await supabaseServerClient
        .from("organizations")
        .select(
            "id, name, description, logo_url, website, linkedin_url, country, created_at"
        )
        .eq("slug", slug)
        .maybeSingle();

    if (!org) return notFound();

    /* --- Fetch hosted conferences --- */
    const { data: conferences } = await supabaseServerClient
        .from("conferences")
        .select(
            "id, title, start_date, submission_deadline, venue, mode, is_published"
        )
        .eq("organization_id", org.id)
        .eq("is_published", true)
        .order("start_date", { ascending: false });

    const today = new Date().toISOString().split("T")[0];

    return (
        <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
            {/* ───── Organization Profile Card ───── */}
            <Card className="overflow-hidden">
                {/* Accent strip */}
                <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400" />

                <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Logo / Avatar */}
                        {org.logo_url ? (
                            <img
                                src={org.logo_url}
                                alt={org.name}
                                className="h-24 w-24 rounded-xl object-cover border shrink-0"
                            />
                        ) : (
                            <div className="h-24 w-24 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                <span className="text-4xl font-bold text-indigo-600">
                                    {org.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 space-y-3">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                                    {org.name}
                                </h1>

                                {org.country && (
                                    <div className="flex items-center gap-1.5 mt-1 text-gray-500 text-sm">
                                        <MapPin className="h-4 w-4" />
                                        {org.country}
                                    </div>
                                )}
                            </div>

                            {org.description && (
                                <p className="text-gray-600 leading-relaxed max-w-2xl">
                                    {org.description}
                                </p>
                            )}

                            {/* Links */}
                            <div className="flex flex-wrap gap-3 pt-1">
                                {org.website && (
                                    <Button variant="outline" size="sm" asChild>
                                        <a
                                            href={org.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Globe className="h-4 w-4" />
                                            Visit Website
                                        </a>
                                    </Button>
                                )}

                                {org.linkedin_url && (
                                    <Button variant="outline" size="sm" asChild>
                                        <a
                                            href={org.linkedin_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Linkedin className="h-4 w-4" />
                                            LinkedIn
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex md:flex-col gap-4 md:gap-3 md:items-end md:text-right shrink-0">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Building2 className="h-4 w-4" />
                                <span>
                                    Since{" "}
                                    {new Date(org.created_at).toLocaleDateString("en-IN", {
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Users className="h-4 w-4" />
                                <span>
                                    {conferences?.length || 0} conference
                                    {(conferences?.length || 0) !== 1 && "s"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* ───── Hosted Conferences ───── */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">
                    Hosted Conferences
                </h2>

                {/* Empty State */}
                {(!conferences || conferences.length === 0) && (
                    <Card className="p-12 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                            <Calendar className="h-7 w-7 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700">
                            No conferences hosted yet
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                            This organization hasn&apos;t published any conferences yet.
                            Check back later for upcoming events.
                        </p>
                    </Card>
                )}

                {/* Conference Grid */}
                {conferences && conferences.length > 0 && (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {conferences.map((c) => {
                            const submissionsOpen =
                                c.submission_deadline && c.submission_deadline >= today;

                            return (
                                <Link
                                    key={c.id}
                                    href={`/conferences/${c.id}`}
                                    className="group rounded-xl border bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col overflow-hidden"
                                >
                                    <div className="p-5 flex flex-col flex-1">
                                        {/* Badges */}
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {formatDate(c.start_date)}
                                            </span>

                                            {submissionsOpen && (
                                                <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                                                    Submissions Open
                                                </Badge>
                                            )}

                                            {c.mode && (
                                                <Badge variant="secondary" className="text-xs capitalize">
                                                    {c.mode}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition leading-snug">
                                            {c.title}
                                        </h3>

                                        {/* Details */}
                                        <div className="mt-2 space-y-1 text-sm text-gray-500">
                                            {c.venue && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    <span className="truncate">{c.venue}</span>
                                                </div>
                                            )}

                                            {c.submission_deadline && (
                                                <div className="flex items-center gap-2">
                                                    <CalendarClock className="h-3.5 w-3.5" />
                                                    <span>
                                                        Submission deadline:{" "}
                                                        {formatDate(c.submission_deadline)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Spacer */}
                                        <div className="flex-1" />

                                        {/* Footer */}
                                        <div className="mt-4 pt-3 border-t flex items-center justify-end">
                                            <span className="flex items-center gap-1 text-sm font-medium text-indigo-600">
                                                View Details
                                                <ArrowRight className="h-4 w-4" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
