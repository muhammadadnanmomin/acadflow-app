"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    Calendar,
    MapPin,
    Monitor,
    ArrowRight,
    Search,
    Tag,
    DollarSign,
    CalendarCheck,
    BookOpen,
    Flame,
    Building2,
    CalendarClock,
    X,
    SlidersHorizontal,
    AlertTriangle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ConferenceOrg {
    name: string;
    slug: string;
}

export interface ConferenceItem {
    id: string;
    title: string;
    short_name: string | null;
    description: string | null;
    start_date: string;
    submission_deadline: string | null;
    venue: string | null;
    mode: string | null;
    tracks: string[] | null;
    conference_logo_url: string | null;
    payment_required: boolean | null;
    currency: string | null;
    created_at: string;
    organizations: ConferenceOrg | null;
    conference_fee_categories?: {
        category_name: string;
        physical_presentation_fee: number | null;
        virtual_presentation_fee: number | null;
        full_paper_publication_fee: number | null;
        abstract_publication_fee: number | null;
        listener_fee: number | null;
    }[];
}

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

function getCurrencySymbol(currency: string | null) {
    switch (currency) {
        case "USD":
            return "$";
        case "EUR":
            return "€";
        case "INR":
        default:
            return "₹";
    }
}

function getLowestFee(conf: ConferenceItem): number | null {
    if (!conf.conference_fee_categories || conf.conference_fee_categories.length === 0)
        return null;

    const fees: number[] = [];

    conf.conference_fee_categories.forEach((cat) => {
        [
            cat.physical_presentation_fee,
            cat.virtual_presentation_fee,
            cat.full_paper_publication_fee,
            cat.abstract_publication_fee,
            cat.listener_fee,
        ].forEach((f) => {
            if (f != null && f > 0) fees.push(f);
        });
    });

    if (fees.length === 0) return null;
    return Math.min(...fees);
}

function getDaysUntil(dateStr: string): number {
    const target = new Date(dateStr);
    const now = new Date();
    return Math.ceil(
        (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface Props {
    conferences: ConferenceItem[];
}

type SortOption = "upcoming" | "deadline" | "lowest_fee" | "recent";

export default function ConferenceExplorer({ conferences }: Props) {
    const today = new Date().toISOString().split("T")[0];

    /* ---- State ---- */
    const [search, setSearch] = useState("");
    const [modeFilter, setModeFilter] = useState("all");
    const [submissionFilter, setSubmissionFilter] = useState("all");
    const [priceFilter, setPriceFilter] = useState("all");
    const [sortBy, setSortBy] = useState<SortOption>("upcoming");

    /* ---- Trending ---- */
    const trending = useMemo(() => {
        return conferences
            .filter((c) => c.submission_deadline && c.submission_deadline >= today)
            .sort(
                (a, b) =>
                    new Date(a.submission_deadline!).getTime() -
                    new Date(b.submission_deadline!).getTime()
            )
            .slice(0, 5);
    }, [conferences, today]);

    /* ---- Filtered + Sorted ---- */
    const filteredConferences = useMemo(() => {
        let result = [...conferences];

        /* Search */
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (c) =>
                    c.title.toLowerCase().includes(q) ||
                    (c.short_name && c.short_name.toLowerCase().includes(q)) ||
                    (c.description && c.description.toLowerCase().includes(q)) ||
                    (c.venue && c.venue.toLowerCase().includes(q)) ||
                    (c.tracks && c.tracks.some((t) => t.toLowerCase().includes(q)))
            );
        }

        /* Mode filter */
        if (modeFilter !== "all") {
            result = result.filter(
                (c) => c.mode && c.mode.toLowerCase() === modeFilter
            );
        }

        /* Submission filter */
        if (submissionFilter === "open") {
            result = result.filter(
                (c) => c.submission_deadline && c.submission_deadline >= today
            );
        } else if (submissionFilter === "closed") {
            result = result.filter(
                (c) => !c.submission_deadline || c.submission_deadline < today
            );
        }

        /* Price filter */
        if (priceFilter === "free") {
            result = result.filter((c) => c.payment_required === false);
        } else if (priceFilter === "paid") {
            result = result.filter((c) => c.payment_required !== false);
        }

        /* Sort */
        switch (sortBy) {
            case "upcoming":
                result.sort(
                    (a, b) =>
                        new Date(a.start_date).getTime() -
                        new Date(b.start_date).getTime()
                );
                break;
            case "deadline":
                result.sort((a, b) => {
                    if (!a.submission_deadline) return 1;
                    if (!b.submission_deadline) return -1;
                    return (
                        new Date(a.submission_deadline).getTime() -
                        new Date(b.submission_deadline).getTime()
                    );
                });
                break;
            case "lowest_fee":
                result.sort((a, b) => {
                    const feeA = getLowestFee(a) ?? Infinity;
                    const feeB = getLowestFee(b) ?? Infinity;
                    return feeA - feeB;
                });
                break;
            case "recent":
                result.sort(
                    (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                );
                break;
        }

        return result;
    }, [conferences, search, modeFilter, submissionFilter, priceFilter, sortBy, today]);

    const hasActiveFilters =
        search.trim() !== "" ||
        modeFilter !== "all" ||
        submissionFilter !== "all" ||
        priceFilter !== "all";

    function clearFilters() {
        setSearch("");
        setModeFilter("all");
        setSubmissionFilter("all");
        setPriceFilter("all");
        setSortBy("upcoming");
    }

    /* ---- If no conferences at all ---- */
    if (conferences.length === 0) {
        return (
            <div className="rounded-xl border bg-white p-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
                    <BookOpen className="h-8 w-8 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">
                    No conferences available yet
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                    We don&apos;t have any published conferences at the moment. Check
                    back soon — new academic events are added regularly.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* ─── Trending Conferences ─── */}
            {trending.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Flame className="h-5 w-5 text-orange-500" />
                        <h2 className="text-lg font-semibold text-gray-900">
                            Trending Conferences
                        </h2>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
                        {trending.map((c) => {
                            const days = getDaysUntil(c.submission_deadline!);
                            return (
                                <Link
                                    key={`trending-${c.id}`}
                                    href={`/conferences/${c.id}`}
                                    className="group shrink-0 w-72 rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                                >
                                    <div className="flex items-start gap-3">
                                        {c.conference_logo_url ? (
                                            <img
                                                src={c.conference_logo_url}
                                                alt=""
                                                className="h-10 w-10 rounded-lg object-cover border shrink-0"
                                            />
                                        ) : (
                                            <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                                <Calendar className="h-5 w-5 text-indigo-400" />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition">
                                                {c.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {formatDate(c.start_date)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <CalendarClock className="h-3.5 w-3.5 text-amber-500" />
                                        <span className="text-xs font-medium text-amber-600">
                                            {days <= 0
                                                ? "Deadline today!"
                                                : days === 1
                                                    ? "Submissions close tomorrow"
                                                    : `Submissions close in ${days} days`}
                                        </span>
                                    </div>
                                    {days <= 7 && days >= 0 && (
                                        <Badge className="mt-2 bg-red-100 text-red-700 border-red-200 text-[10px]">
                                            <AlertTriangle className="h-3 w-3" />
                                            Closing Soon
                                        </Badge>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ─── Search + Filters ─── */}
            <div className="space-y-3">
                {/* Search */}
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        placeholder="Search by title, tracks, venue, or description..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border px-9 py-2.5 text-sm outline-none focus:border-indigo-500 transition"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Filter bar */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                    </div>

                    <Select value={modeFilter} onValueChange={setModeFilter}>
                        <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Mode" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Modes</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="physical">Physical</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={submissionFilter} onValueChange={setSubmissionFilter}>
                        <SelectTrigger className="w-[170px]">
                            <SelectValue placeholder="Submissions" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="open">Submissions Open</SelectItem>
                            <SelectItem value="closed">Submissions Closed</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={priceFilter} onValueChange={setPriceFilter}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Price" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Prices</SelectItem>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={sortBy}
                        onValueChange={(v) => setSortBy(v as SortOption)}
                    >
                        <SelectTrigger className="w-[170px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="upcoming">Upcoming First</SelectItem>
                            <SelectItem value="deadline">Submission Deadline</SelectItem>
                            <SelectItem value="lowest_fee">Lowest Fee</SelectItem>
                            <SelectItem value="recent">Recently Added</SelectItem>
                        </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="text-gray-500"
                        >
                            <X className="h-3.5 w-3.5" />
                            Clear
                        </Button>
                    )}

                    <span className="ml-auto text-sm text-gray-400">
                        {filteredConferences.length} conference
                        {filteredConferences.length !== 1 && "s"}
                    </span>
                </div>
            </div>

            {/* ─── Empty filtered state ─── */}
            {filteredConferences.length === 0 && (
                <div className="rounded-xl border bg-white p-12 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                        <Search className="h-7 w-7 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">
                        No conferences match your filters
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Try adjusting your search or filter criteria.
                    </p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={clearFilters}
                    >
                        Clear Filters
                    </Button>
                </div>
            )}

            {/* ─── Conference Grid ─── */}
            {filteredConferences.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredConferences.map((c) => {
                        const submissionsOpen =
                            c.submission_deadline && c.submission_deadline >= today;
                        const lowestFee = getLowestFee(c);
                        const currencySymbol = getCurrencySymbol(c.currency);
                        const tracks: string[] = c.tracks ?? [];
                        const deadlineDays = c.submission_deadline
                            ? getDaysUntil(c.submission_deadline)
                            : null;
                        const org = c.organizations;

                        return (
                            <Link
                                key={c.id}
                                href={`/conferences/${c.id}`}
                                className="group rounded-xl border bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col overflow-hidden"
                            >
                                {/* Logo + Top section */}
                                <div className="p-5 pb-0 flex items-start gap-3">
                                    {c.conference_logo_url && (
                                        <img
                                            src={c.conference_logo_url}
                                            alt=""
                                            className="h-12 w-12 rounded-lg object-cover border shrink-0"
                                        />
                                    )}

                                    <div className="min-w-0 flex-1">
                                        {/* Date Badge */}
                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {formatDate(c.start_date)}
                                            </span>

                                            {submissionsOpen && (
                                                <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                                                    <CalendarCheck className="h-3 w-3" />
                                                    Submissions Open
                                                </Badge>
                                            )}

                                            {submissionsOpen &&
                                                deadlineDays !== null &&
                                                deadlineDays <= 7 &&
                                                deadlineDays >= 0 && (
                                                    <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 text-[10px]">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        Closing Soon
                                                    </Badge>
                                                )}
                                        </div>

                                        {/* Title + Short name */}
                                        <h2 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition leading-snug">
                                            {c.title}
                                            {c.short_name && (
                                                <Badge
                                                    variant="secondary"
                                                    className="ml-2 align-middle text-[10px] px-1.5 py-0"
                                                >
                                                    {c.short_name}
                                                </Badge>
                                            )}
                                        </h2>

                                        {/* Organization */}
                                        {org && (
                                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                <Building2 className="h-3 w-3" />
                                                Hosted by{" "}
                                                <a
                                                    href={`/org/${org.slug}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-indigo-500 hover:text-indigo-700 hover:underline transition-colors"
                                                >
                                                    {org.name}
                                                </a>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="px-5 pt-3 pb-5 flex flex-col flex-1">
                                    {/* Description */}
                                    <p className="line-clamp-2 text-sm text-gray-600">
                                        {c.description || "No description provided."}
                                    </p>

                                    {/* Tracks */}
                                    {tracks.length > 0 && (
                                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                            <Tag className="h-3.5 w-3.5 text-gray-400" />
                                            {tracks.slice(0, 3).map((t) => (
                                                <Badge
                                                    key={t}
                                                    variant="outline"
                                                    className="text-[11px] px-2 py-0"
                                                >
                                                    {t}
                                                </Badge>
                                            ))}
                                            {tracks.length > 3 && (
                                                <span className="text-[11px] text-gray-400">
                                                    +{tracks.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Info Row */}
                                    <div className="mt-3 space-y-1 text-sm text-gray-500">
                                        {c.mode && (
                                            <div className="flex items-center gap-2">
                                                <Monitor className="h-4 w-4" />
                                                <span className="capitalize">{c.mode}</span>
                                            </div>
                                        )}

                                        {c.venue && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4" />
                                                <span className="truncate">{c.venue}</span>
                                            </div>
                                        )}

                                        {/* Submission countdown */}
                                        {submissionsOpen && deadlineDays !== null && (
                                            <div className="flex items-center gap-2 text-amber-600">
                                                <CalendarClock className="h-4 w-4" />
                                                <span className="text-xs font-medium">
                                                    {deadlineDays <= 0
                                                        ? "Deadline today!"
                                                        : deadlineDays === 1
                                                            ? "Submissions close tomorrow"
                                                            : `Submissions close in ${deadlineDays} days`}
                                                </span>
                                            </div>
                                        )}

                                        {/* Submission deadline date */}
                                        {c.submission_deadline && !submissionsOpen && (
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <CalendarClock className="h-4 w-4" />
                                                <span className="text-xs">
                                                    Deadline was {formatDate(c.submission_deadline)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Spacer */}
                                    <div className="flex-1" />

                                    {/* Footer */}
                                    <div className="mt-4 flex items-center justify-between border-t pt-3">
                                        <div className="flex items-center gap-1 text-sm">
                                            <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                                            {c.payment_required === false ? (
                                                <span className="font-medium text-green-600">
                                                    Free
                                                </span>
                                            ) : lowestFee != null ? (
                                                <span className="font-medium text-gray-700">
                                                    From {currencySymbol}
                                                    {lowestFee}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </div>

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
    );
}
