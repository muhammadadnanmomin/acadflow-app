"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { toast } from "@/components/ui/use-toast";

import { getOrCreateOrganization } from "@/lib/organizations/getOrCreateOrganization";

import {
    Calendar,
    Upload,
    Plus,
    X,
    ImageIcon,
    FileText,
    Loader2,
} from "lucide-react";

const supabase = createClient();

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface ConferenceFormProps {
    mode: "create" | "edit";
    conferenceId?: string;
    /** Called after a successful create/update so the parent can refresh */
    onSuccess?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_DOC_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_PPT_TYPES = [
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

function validateFile(
    file: File,
    allowedTypes: string[],
    label: string
): string | null {
    if (!allowedTypes.includes(file.type)) {
        return `${label}: Invalid file type. Allowed: ${allowedTypes
            .map((t) => t.split("/").pop())
            .join(", ")}`;
    }
    if (file.size > MAX_FILE_SIZE) {
        return `${label}: File exceeds 2 MB limit.`;
    }
    return null;
}

async function uploadToStorage(
    file: File,
    folder: string
): Promise<string | null> {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage
        .from("conference-assets")
        .upload(path, file, { upsert: false });

    if (error) {
        console.error("Upload error:", error);
        return null;
    }

    const {
        data: { publicUrl },
    } = supabase.storage.from("conference-assets").getPublicUrl(path);

    return publicUrl;
}

/* ------------------------------------------------------------------ */
/*  Submission type options                                            */
/* ------------------------------------------------------------------ */
const SUBMISSION_TYPE_OPTIONS = [
    { value: "full_paper", label: "Full Paper" },
    { value: "short_paper", label: "Short Paper" },
    { value: "abstract_only", label: "Abstract Only" },
    { value: "poster", label: "Poster" },
] as const;

/* ------------------------------------------------------------------ */
/*  Section heading component                                          */
/* ------------------------------------------------------------------ */
function SectionHeading({
    icon: Icon,
    title,
}: {
    icon: React.ElementType;
    title: string;
}) {
    return (
        <div className="flex items-center gap-2 pt-6 pb-2 border-b mb-4">
            <Icon className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{title}</h3>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  ConferenceForm Component                                           */
/* ------------------------------------------------------------------ */

export default function ConferenceForm({
    mode,
    conferenceId,
    onSuccess,
}: ConferenceFormProps) {
    const router = useRouter();
    const { profile, loading: profileLoading } = useProfile();

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(mode === "edit");

    /* ---- Basic Info ---- */
    const [title, setTitle] = useState("");
    const [shortName, setShortName] = useState("");
    const [description, setDescription] = useState("");
    const [venue, setVenue] = useState("");
    const [conferenceMode, setConferenceMode] = useState("offline");
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);

    /* Existing file URLs (edit mode) */
    const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
    const [existingBannerUrl, setExistingBannerUrl] = useState<string | null>(
        null
    );
    const [existingSamplePaperUrl, setExistingSamplePaperUrl] = useState<
        string | null
    >(null);
    const [pptTemplateFile, setPptTemplateFile] = useState<File | null>(null);
    const [existingPptTemplateUrl, setExistingPptTemplateUrl] = useState<string | null>(null);

    /* ---- Dates ---- */
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [deadline, setDeadline] = useState("");
    const [abstractDeadline, setAbstractDeadline] = useState("");
    const [reviewDeadline, setReviewDeadline] = useState("");
    const [cameraReadyDeadline, setCameraReadyDeadline] = useState("");
    const [registrationDeadline, setRegistrationDeadline] = useState("");

    /* ---- Tracks ---- */
    const [tracks, setTracks] = useState<string[]>([]);
    const [trackInput, setTrackInput] = useState("");

    /* ---- Submission Settings ---- */
    const [allowedSubmissionTypes, setAllowedSubmissionTypes] = useState<
        string[]
    >([]);
    const [maxAuthorsPerPaper, setMaxAuthorsPerPaper] = useState("");
    const [allowedFileTypes, setAllowedFileTypes] = useState<string[]>(["pdf"]);
    const [maxFileSizeMb, setMaxFileSizeMb] = useState("");
    const [samplePaperFile, setSamplePaperFile] = useState<File | null>(null);

    /* ---- Payment ---- */
    const [paymentRequired, setPaymentRequired] = useState(true);
    const [currency, setCurrency] = useState("INR");
    const [registrationFee, setRegistrationFee] = useState("");
    const [physicalFee, setPhysicalFee] = useState("");
    const [virtualFee, setVirtualFee] = useState("");
    const [fullPublicationFee, setFullPublicationFee] = useState("");
    const [abstractPublicationFee, setAbstractPublicationFee] = useState("");

    /* ---- Proceedings ---- */
    const [publishProceedings, setPublishProceedings] = useState(false);
    const [proceedingsIsbn, setProceedingsIsbn] = useState("");
    const [journalName, setJournalName] = useState("");

    /* ---- Contact & Links ---- */
    const [contactEmail, setContactEmail] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [website, setWebsite] = useState("");
    const [brochureUrl, setBrochureUrl] = useState("");
    const [whatsappGroupLink, setWhatsappGroupLink] = useState("");
    const [maxParticipants, setMaxParticipants] = useState("");

    /* ================================================================ */
    /*  Load conference (edit mode)                                      */
    /* ================================================================ */
    async function loadConference() {
        if (!profile || !conferenceId) return;

        const { data, error } = await supabase
            .from("conferences")
            .select("*")
            .eq("id", conferenceId)
            .eq("organizer_id", profile.id)
            .single();

        if (error || !data) {
            toast({
                variant: "destructive",
                title: "Not found",
                description: "Conference not found or you do not have access.",
            });
            router.push("/dashboard/organizer/conferences");
            return;
        }

        /* Populate all fields */
        setTitle(data.title || "");
        setShortName(data.short_name || "");
        setDescription(data.description || "");
        setVenue(data.venue || "");
        setConferenceMode(data.mode || "offline");

        setExistingLogoUrl(data.conference_logo_url || null);
        setExistingBannerUrl(data.conference_banner_url || null);
        setExistingSamplePaperUrl(data.sample_paper_format_url || null);
        setExistingPptTemplateUrl(data.presentation_ppt_template_url || null);

        setStart(data.start_date || "");
        setEnd(data.end_date || "");
        setDeadline(data.submission_deadline || "");
        setAbstractDeadline(data.abstract_deadline || "");
        setReviewDeadline(data.review_deadline || "");
        setCameraReadyDeadline(data.camera_ready_deadline || "");
        setRegistrationDeadline(data.registration_deadline || "");

        setTracks(data.tracks || []);
        setAllowedSubmissionTypes(data.allowed_submission_types || []);
        setMaxAuthorsPerPaper(
            data.max_authors_per_paper != null
                ? String(data.max_authors_per_paper)
                : ""
        );
        setAllowedFileTypes(data.allowed_file_types || ["pdf"]);
        setMaxFileSizeMb(
            data.max_file_size_mb != null ? String(data.max_file_size_mb) : ""
        );

        setPaymentRequired(data.payment_required ?? true);
        setCurrency(data.currency || "INR");
        setRegistrationFee(
            data.registration_fee != null ? String(data.registration_fee) : ""
        );
        setPhysicalFee(
            data.physical_presentation_fee != null
                ? String(data.physical_presentation_fee)
                : ""
        );
        setVirtualFee(
            data.virtual_presentation_fee != null
                ? String(data.virtual_presentation_fee)
                : ""
        );
        setFullPublicationFee(
            data.full_paper_publication_fee != null
                ? String(data.full_paper_publication_fee)
                : ""
        );
        setAbstractPublicationFee(
            data.abstract_publication_fee != null
                ? String(data.abstract_publication_fee)
                : ""
        );

        setPublishProceedings(data.publish_proceedings ?? false);
        setProceedingsIsbn(data.proceedings_isbn || "");
        setJournalName(data.journal_name || "");

        setContactEmail(data.contact_email || "");
        setContactPhone(data.contact_phone || "");
        setWebsite(data.website_link || "");
        setBrochureUrl(data.brochure_url || "");
        setWhatsappGroupLink(data.whatsapp_group_link || "");
        setMaxParticipants(
            data.max_participants != null ? String(data.max_participants) : ""
        );

        setPageLoading(false);
    }

    useEffect(() => {
        if (mode === "edit" && !profileLoading) {
            loadConference();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profileLoading, profile]);

    /* ================================================================ */
    /*  Track helpers                                                    */
    /* ================================================================ */
    function addTrack() {
        const trimmed = trackInput.trim();
        if (!trimmed) return;
        if (tracks.includes(trimmed)) {
            toast({
                variant: "destructive",
                title: "Duplicate track",
                description: `"${trimmed}" already exists.`,
            });
            return;
        }
        setTracks((prev) => [...prev, trimmed]);
        setTrackInput("");
    }

    function removeTrack(t: string) {
        setTracks((prev) => prev.filter((x) => x !== t));
    }

    /* ================================================================ */
    /*  Submission type toggle                                           */
    /* ================================================================ */
    function toggleSubmissionType(val: string) {
        setAllowedSubmissionTypes((prev) =>
            prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
        );
    }

    function toggleFileType(val: string) {
        setAllowedFileTypes((prev) =>
            prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
        );
    }

    /* ================================================================ */
    /*  Deadline validation                                              */
    /* ================================================================ */
    function validateDeadlines(): string | null {
        if (!start) return null;
        const s = new Date(start);
        const checks: [string, string][] = [
            ["Abstract Deadline", abstractDeadline],
            ["Review Deadline", reviewDeadline],
            ["Camera-Ready Deadline", cameraReadyDeadline],
            ["Registration Deadline", registrationDeadline],
        ];
        for (const [label, val] of checks) {
            if (val && new Date(val) > s) {
                return `${label} must not be after the conference start date.`;
            }
        }
        return null;
    }

    /* ================================================================ */
    /*  Reset all fields (create mode)                                   */
    /* ================================================================ */
    function resetForm() {
        setTitle("");
        setShortName("");
        setDescription("");
        setVenue("");
        setConferenceMode("offline");
        setLogoFile(null);
        setBannerFile(null);

        setStart("");
        setEnd("");
        setDeadline("");
        setAbstractDeadline("");
        setReviewDeadline("");
        setCameraReadyDeadline("");
        setRegistrationDeadline("");

        setTracks([]);
        setTrackInput("");

        setAllowedSubmissionTypes([]);
        setMaxAuthorsPerPaper("");
        setAllowedFileTypes(["pdf"]);
        setMaxFileSizeMb("");
        setSamplePaperFile(null);
        setPptTemplateFile(null);

        setPaymentRequired(true);
        setCurrency("INR");
        setRegistrationFee("");
        setPhysicalFee("");
        setVirtualFee("");
        setFullPublicationFee("");
        setAbstractPublicationFee("");

        setPublishProceedings(false);
        setProceedingsIsbn("");
        setJournalName("");

        setContactEmail("");
        setContactPhone("");
        setWebsite("");
        setBrochureUrl("");
        setWhatsappGroupLink("");
        setMaxParticipants("");

        // reset file inputs
        const fileInputs = document.querySelectorAll<HTMLInputElement>(
            'input[type="file"]'
        );
        fileInputs.forEach((input) => (input.value = ""));
    }

    /* ================================================================ */
    /*  Build the conference data payload                                */
    /* ================================================================ */
    function buildPayload(
        profileId: string,
        orgId: string | null,
        conferenceLogoUrl: string | null,
        conferenceBannerUrl: string | null,
        samplePaperFormatUrl: string | null,
        presentationPptTemplateUrl: string | null
    ) {
        const base: Record<string, unknown> = {
            // Basic Info
            title,
            short_name: shortName,
            description,
            venue,
            mode: conferenceMode,
            conference_logo_url: conferenceLogoUrl,
            conference_banner_url: conferenceBannerUrl,

            // Dates
            start_date: start,
            end_date: end,
            submission_deadline: deadline || null,
            abstract_deadline: abstractDeadline || null,
            review_deadline: reviewDeadline || null,
            camera_ready_deadline: cameraReadyDeadline || null,
            registration_deadline: registrationDeadline || null,

            // Tracks
            tracks: tracks.length > 0 ? tracks : null,

            // Submission Settings
            allowed_submission_types:
                allowedSubmissionTypes.length > 0 ? allowedSubmissionTypes : null,
            max_authors_per_paper: maxAuthorsPerPaper
                ? parseInt(maxAuthorsPerPaper, 10)
                : null,
            allowed_file_types:
                allowedFileTypes.length > 0 ? allowedFileTypes : null,
            max_file_size_mb: maxFileSizeMb ? parseInt(maxFileSizeMb, 10) : null,
            sample_paper_format_url: samplePaperFormatUrl,
            presentation_ppt_template_url: presentationPptTemplateUrl,

            // Payment
            payment_required: paymentRequired,
            currency: currency || "INR",
            registration_fee: paymentRequired ? registrationFee || null : null,
            physical_presentation_fee: paymentRequired ? physicalFee || null : null,
            virtual_presentation_fee: paymentRequired ? virtualFee || null : null,
            full_paper_publication_fee: paymentRequired
                ? fullPublicationFee || null
                : null,
            abstract_publication_fee: paymentRequired
                ? abstractPublicationFee || null
                : null,

            // Proceedings
            publish_proceedings: publishProceedings,
            proceedings_isbn: publishProceedings ? proceedingsIsbn || null : null,
            journal_name: publishProceedings ? journalName || null : null,

            // Contact & Links
            contact_email: contactEmail,
            contact_phone: contactPhone,
            website_link: website,
            brochure_url: brochureUrl || null,
            whatsapp_group_link: whatsappGroupLink || null,
            max_participants: maxParticipants || null,
        };

        if (mode === "create") {
            base.organizer_id = profileId;
            base.organization_id = orgId;
            base.is_published = false;
        }

        return base;
    }

    /* ================================================================ */
    /*  Submit handler                                                   */
    /* ================================================================ */
    async function handleSubmit() {
        if (!profile) return;

        /* --- basic validation --- */
        if (!title || !shortName || !start || !end) {
            toast({
                variant: "destructive",
                title: "Missing fields",
                description:
                    "Please fill all required fields (Title, Short Name, Start Date, End Date).",
            });
            return;
        }

        if (shortName.length > 20) {
            toast({
                variant: "destructive",
                title: "Invalid short name",
                description: "Short name must be 20 characters or fewer.",
            });
            return;
        }

        /* --- deadline validation --- */
        const deadlineErr = validateDeadlines();
        if (deadlineErr) {
            toast({
                variant: "destructive",
                title: "Invalid date",
                description: deadlineErr,
            });
            return;
        }

        /* --- file validation (client-side) --- */
        if (logoFile) {
            const err = validateFile(logoFile, ALLOWED_IMAGE_TYPES, "Conference Logo");
            if (err) {
                toast({ variant: "destructive", title: "Invalid file", description: err });
                return;
            }
        }
        if (bannerFile) {
            const err = validateFile(
                bannerFile,
                ALLOWED_IMAGE_TYPES,
                "Conference Banner"
            );
            if (err) {
                toast({ variant: "destructive", title: "Invalid file", description: err });
                return;
            }
        }
        if (samplePaperFile) {
            const err = validateFile(
                samplePaperFile,
                ALLOWED_DOC_TYPES,
                "Sample Paper Format"
            );
            if (err) {
                toast({ variant: "destructive", title: "Invalid file", description: err });
                return;
            }
        }

        setLoading(true);

        try {
            /* --- file uploads --- */
            let conferenceLogoUrl: string | null =
                mode === "edit" ? existingLogoUrl : null;
            let conferenceBannerUrl: string | null =
                mode === "edit" ? existingBannerUrl : null;
            let samplePaperFormatUrl: string | null =
                mode === "edit" ? existingSamplePaperUrl : null;

            if (logoFile) {
                conferenceLogoUrl = await uploadToStorage(logoFile, "logos");
                if (!conferenceLogoUrl) {
                    toast({
                        variant: "destructive",
                        title: "Upload failed",
                        description: "Could not upload logo.",
                    });
                    setLoading(false);
                    return;
                }
            }
            if (bannerFile) {
                conferenceBannerUrl = await uploadToStorage(bannerFile, "banners");
                if (!conferenceBannerUrl) {
                    toast({
                        variant: "destructive",
                        title: "Upload failed",
                        description: "Could not upload banner.",
                    });
                    setLoading(false);
                    return;
                }
            }
            if (samplePaperFile) {
                samplePaperFormatUrl = await uploadToStorage(
                    samplePaperFile,
                    "sample-papers"
                );
                if (!samplePaperFormatUrl) {
                    toast({
                        variant: "destructive",
                        title: "Upload failed",
                        description: "Could not upload sample paper.",
                    });
                    setLoading(false);
                    return;
                }
            }

            let pptTemplateUrl: string | null =
                mode === "edit" ? existingPptTemplateUrl : null;

            if (pptTemplateFile) {
                const err = validateFile(
                    pptTemplateFile,
                    ALLOWED_PPT_TYPES,
                    "PPT Presentation Template"
                );
                if (err) {
                    toast({
                        variant: "destructive",
                        title: "Invalid file",
                        description: err,
                    });
                    setLoading(false);
                    return;
                }

                pptTemplateUrl = await uploadToStorage(
                    pptTemplateFile,
                    "ppt-templates"
                );

                if (!pptTemplateUrl) {
                    toast({
                        variant: "destructive",
                        title: "Upload failed",
                        description: "Could not upload PPT template.",
                    });
                    setLoading(false);
                    return;
                }
            }

            /* --- org --- */
            const orgId = await getOrCreateOrganization(
                profile.id,
                profile.name || "My Organization"
            );

            /* --- build payload --- */
            const payload = buildPayload(
                profile.id,
                orgId,
                conferenceLogoUrl,
                conferenceBannerUrl,
                samplePaperFormatUrl,
                pptTemplateUrl
            );

            if (mode === "create") {
                /* --- INSERT --- */
                const { error } = await supabase.from("conferences").insert(payload);

                if (error) {
                    toast({
                        variant: "destructive",
                        title: "Failed to create",
                        description: error.message,
                    });
                    return;
                }

                toast({
                    title: "Conference created",
                    description: "Your conference has been created successfully.",
                });

                resetForm();
                onSuccess?.();
            } else {
                /* --- UPDATE --- */
                const { error } = await supabase
                    .from("conferences")
                    .update(payload)
                    .eq("id", conferenceId!)
                    .eq("organizer_id", profile.id);

                if (error) {
                    toast({
                        variant: "destructive",
                        title: "Update failed",
                        description: error.message,
                    });
                    return;
                }

                toast({
                    title: "Updated",
                    description: "Conference updated successfully.",
                });

                router.push("/dashboard/organizer/conferences");
            }
        } finally {
            setLoading(false);
        }
    }

    /* ================================================================ */
    /*  Loading states                                                   */
    /* ================================================================ */
    if (mode === "edit" && (profileLoading || pageLoading)) {
        return (
            <Card className="p-6 flex items-center justify-center min-h-[200px]">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading conference...</span>
            </Card>
        );
    }

    /* ================================================================ */
    /*  Render                                                           */
    /* ================================================================ */
    return (
        <Card className="p-6 space-y-2">
            <h2 className="text-xl font-semibold">
                {mode === "create" ? "Create Conference" : "Edit Conference"}
            </h2>

            {/* ---------------------------------------------------------- */}
            {/*  1. BASIC INFORMATION                                       */}
            {/* ---------------------------------------------------------- */}
            <SectionHeading icon={FileText} title="Basic Information" />

            <div className="grid gap-4 md:grid-cols-2">
                {/* Title */}
                <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium">Title *</label>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. International Conference on AI 2026"
                    />
                </div>

                {/* Short Name */}
                <div className="space-y-1">
                    <label className="text-sm font-medium">Short Name *</label>
                    <Input
                        value={shortName}
                        onChange={(e) => setShortName(e.target.value.slice(0, 20))}
                        placeholder="e.g. ICAI2026"
                        maxLength={20}
                    />
                    <p className="text-xs text-muted-foreground">
                        {shortName.length}/20 characters
                    </p>
                </div>

                {/* Mode */}
                <div className="space-y-1">
                    <label className="text-sm font-medium">Mode</label>
                    <select
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={conferenceMode}
                        onChange={(e) => setConferenceMode(e.target.value)}
                    >
                        <option value="offline">Offline</option>
                        <option value="online">Online</option>
                        <option value="hybrid">Hybrid</option>
                    </select>
                </div>

                {/* Description */}
                <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        placeholder="Describe your conference..."
                    />
                </div>

                {/* Venue */}
                <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium">Venue</label>
                    <Input
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        placeholder="e.g. IIT Delhi, New Delhi, India"
                    />
                </div>

                {/* Logo Upload */}
                <div className="space-y-1">
                    <label className="text-sm font-medium">Conference Logo</label>
                    {mode === "edit" && existingLogoUrl && !logoFile && (
                        <p className="text-xs text-green-600 mb-1">
                            ✓ Logo already uploaded
                        </p>
                    )}
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer border rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                                {logoFile ? logoFile.name : "Choose image..."}
                            </span>
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp"
                                className="hidden"
                                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                            />
                        </label>
                        {logoFile && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setLogoFile(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        JPG, PNG or WebP · Max 2 MB
                    </p>
                </div>

                {/* Banner Upload */}
                <div className="space-y-1">
                    <label className="text-sm font-medium">Conference Banner</label>
                    {mode === "edit" && existingBannerUrl && !bannerFile && (
                        <p className="text-xs text-green-600 mb-1">
                            ✓ Banner already uploaded
                        </p>
                    )}
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer border rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                                {bannerFile ? bannerFile.name : "Choose image..."}
                            </span>
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp"
                                className="hidden"
                                onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                            />
                        </label>
                        {bannerFile && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setBannerFile(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Recommended: 1200×400 px · JPG, PNG or WebP · Max 2 MB
                    </p>
                </div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/*  2. IMPORTANT DATES                                         */}
            {/* ---------------------------------------------------------- */}
            <SectionHeading icon={Calendar} title="Important Dates" />

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-sm font-medium">Start Date *</label>
                    <Input
                        type="date"
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">End Date *</label>
                    <Input
                        type="date"
                        value={end}
                        onChange={(e) => setEnd(e.target.value)}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">Submission Deadline</label>
                    <Input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">Abstract Deadline</label>
                    <Input
                        type="date"
                        value={abstractDeadline}
                        onChange={(e) => setAbstractDeadline(e.target.value)}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">Review Deadline</label>
                    <Input
                        type="date"
                        value={reviewDeadline}
                        onChange={(e) => setReviewDeadline(e.target.value)}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">Camera-Ready Deadline</label>
                    <Input
                        type="date"
                        value={cameraReadyDeadline}
                        onChange={(e) => setCameraReadyDeadline(e.target.value)}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">Registration Deadline</label>
                    <Input
                        type="date"
                        value={registrationDeadline}
                        onChange={(e) => setRegistrationDeadline(e.target.value)}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">Max Participants</label>
                    <Input
                        type="number"
                        value={maxParticipants}
                        onChange={(e) => setMaxParticipants(e.target.value)}
                        placeholder="e.g. 500"
                    />
                </div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/*  3. TRACKS / CATEGORIES                                     */}
            {/* ---------------------------------------------------------- */}
            <SectionHeading icon={Plus} title="Tracks / Categories" />

            <div className="space-y-3">
                <div className="flex gap-2">
                    <Input
                        value={trackInput}
                        onChange={(e) => setTrackInput(e.target.value)}
                        placeholder="e.g. Machine Learning"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                addTrack();
                            }
                        }}
                    />
                    <Button variant="outline" onClick={addTrack} type="button">
                        <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                </div>

                {tracks.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {tracks.map((t) => (
                            <Badge
                                key={t}
                                variant="secondary"
                                className="gap-1 pr-1 cursor-default"
                            >
                                {t}
                                <button
                                    type="button"
                                    onClick={() => removeTrack(t)}
                                    className="ml-1 rounded-full hover:bg-muted p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}

                {tracks.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        No tracks added yet. Add tracks to categorize submissions.
                    </p>
                )}
            </div>

            {/* ---------------------------------------------------------- */}
            {/*  4. SUBMISSION SETTINGS                                     */}
            {/* ---------------------------------------------------------- */}
            <SectionHeading icon={FileText} title="Submission Settings" />

            <div className="grid gap-4 md:grid-cols-2">
                {/* Allowed Submission Types */}
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">
                        Allowed Submission Types
                    </label>
                    <div className="flex flex-wrap gap-4">
                        {SUBMISSION_TYPE_OPTIONS.map((opt) => (
                            <div key={opt.value} className="flex items-center gap-2">
                                <Checkbox
                                    id={`sub-type-${opt.value}`}
                                    checked={allowedSubmissionTypes.includes(opt.value)}
                                    onCheckedChange={() => toggleSubmissionType(opt.value)}
                                />
                                <Label
                                    htmlFor={`sub-type-${opt.value}`}
                                    className="text-sm font-normal cursor-pointer"
                                >
                                    {opt.label}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Max authors */}
                <div className="space-y-1">
                    <label className="text-sm font-medium">Max Authors per Paper</label>
                    <Input
                        type="number"
                        min={1}
                        value={maxAuthorsPerPaper}
                        onChange={(e) => setMaxAuthorsPerPaper(e.target.value)}
                        placeholder="e.g. 5"
                    />
                </div>

                {/* Max file size */}
                <div className="space-y-1">
                    <label className="text-sm font-medium">Max File Size (MB)</label>
                    <Input
                        type="number"
                        min={1}
                        value={maxFileSizeMb}
                        onChange={(e) => setMaxFileSizeMb(e.target.value)}
                        placeholder="e.g. 10"
                    />
                </div>

                {/* Allowed file types */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Allowed File Types</label>
                    <div className="flex gap-4">
                        {["pdf", "docx"].map((ft) => (
                            <div key={ft} className="flex items-center gap-2">
                                <Checkbox
                                    id={`file-type-${ft}`}
                                    checked={allowedFileTypes.includes(ft)}
                                    onCheckedChange={() => toggleFileType(ft)}
                                />
                                <Label
                                    htmlFor={`file-type-${ft}`}
                                    className="text-sm font-normal cursor-pointer uppercase"
                                >
                                    {ft}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sample Paper Format */}
                <div className="space-y-1">
                    <label className="text-sm font-medium">
                        Sample Paper Format Template
                    </label>
                    {mode === "edit" && existingSamplePaperUrl && !samplePaperFile && (
                        <p className="text-xs text-green-600 mb-1">
                            ✓ Sample paper already uploaded
                        </p>
                    )}
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer border rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors">
                            <Upload className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                                {samplePaperFile ? samplePaperFile.name : "Choose file..."}
                            </span>
                            <input
                                type="file"
                                accept=".pdf,.docx"
                                className="hidden"
                                onChange={(e) =>
                                    setSamplePaperFile(e.target.files?.[0] || null)
                                }
                            />
                        </label>
                        {samplePaperFile && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSamplePaperFile(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        PDF or DOCX · Max 2 MB
                    </p>
                </div>

                {/* Presentation PPT Template */}
                <div className="space-y-1">
                    <label className="text-sm font-medium">
                        Presentation PPT Template
                    </label>
                    {mode === "edit" && existingPptTemplateUrl && !pptTemplateFile && (
                        <p className="text-xs text-green-600 mb-1">
                            ✓ PPT template already uploaded
                        </p>
                    )}
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer border rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors">
                            <Upload className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                                {pptTemplateFile ? pptTemplateFile.name : "Choose file..."}
                            </span>
                            <input
                                type="file"
                                accept=".ppt,.pptx"
                                className="hidden"
                                onChange={(e) =>
                                    setPptTemplateFile(e.target.files?.[0] || null)
                                }
                            />
                        </label>
                        {pptTemplateFile && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPptTemplateFile(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        PPT or PPTX · Max 2 MB
                    </p>
                </div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/*  5. PAYMENT SETTINGS                                        */}
            {/* ---------------------------------------------------------- */}
            <SectionHeading icon={Calendar} title="Payment Settings" />

            <div className="grid gap-4 md:grid-cols-2">
                {/* Payment Required toggle */}
                <div className="flex items-center justify-between md:col-span-2 p-3 border rounded-md">
                    <div>
                        <p className="text-sm font-medium">Payment Required</p>
                        <p className="text-xs text-muted-foreground">
                            Toggle off to make this a free conference
                        </p>
                    </div>
                    <Switch
                        checked={paymentRequired}
                        onCheckedChange={setPaymentRequired}
                    />
                </div>

                {paymentRequired && (
                    <>
                        {/* Currency */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Currency</label>
                            <Select value={currency} onValueChange={setCurrency}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="INR">INR (₹)</SelectItem>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div /> {/* spacer for grid alignment */}

                        {/* Fee fields */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Registration Fee</label>
                            <Input
                                type="number"
                                value={registrationFee}
                                onChange={(e) => setRegistrationFee(e.target.value)}
                                placeholder="e.g. 2000"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">
                                Physical Presentation Fee
                            </label>
                            <Input
                                type="number"
                                value={physicalFee}
                                onChange={(e) => setPhysicalFee(e.target.value)}
                                placeholder="e.g. 3000"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">
                                Virtual Presentation Fee
                            </label>
                            <Input
                                type="number"
                                value={virtualFee}
                                onChange={(e) => setVirtualFee(e.target.value)}
                                placeholder="e.g. 1500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">
                                Full Paper Publication Fee
                            </label>
                            <Input
                                type="number"
                                value={fullPublicationFee}
                                onChange={(e) => setFullPublicationFee(e.target.value)}
                                placeholder="e.g. 5000"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">
                                Abstract Publication Fee
                            </label>
                            <Input
                                type="number"
                                value={abstractPublicationFee}
                                onChange={(e) => setAbstractPublicationFee(e.target.value)}
                                placeholder="e.g. 2500"
                            />
                        </div>
                    </>
                )}
            </div>

            {/* ---------------------------------------------------------- */}
            {/*  6. PUBLISHING & PROCEEDINGS                                 */}
            {/* ---------------------------------------------------------- */}
            <SectionHeading icon={FileText} title="Publishing & Proceedings" />

            <div className="grid gap-4 md:grid-cols-2">
                {/* Toggle */}
                <div className="flex items-center justify-between md:col-span-2 p-3 border rounded-md">
                    <div>
                        <p className="text-sm font-medium">Publish Proceedings</p>
                        <p className="text-xs text-muted-foreground">
                            Enable if proceedings will be published with an ISBN or journal
                        </p>
                    </div>
                    <Switch
                        checked={publishProceedings}
                        onCheckedChange={setPublishProceedings}
                    />
                </div>

                {publishProceedings && (
                    <>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">
                                Proceedings ISBN
                            </label>
                            <Input
                                value={proceedingsIsbn}
                                onChange={(e) => setProceedingsIsbn(e.target.value)}
                                placeholder="e.g. 978-3-16-148410-0"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Journal Name</label>
                            <Input
                                value={journalName}
                                onChange={(e) => setJournalName(e.target.value)}
                                placeholder="e.g. Springer LNCS"
                            />
                        </div>
                    </>
                )}
            </div>

            {/* ---------------------------------------------------------- */}
            {/*  7. CONTACT & LINKS                                         */}
            {/* ---------------------------------------------------------- */}
            <SectionHeading icon={Calendar} title="Contact & Links" />

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-sm font-medium">Contact Email</label>
                    <Input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="e.g. info@conference.org"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">Contact Phone</label>
                    <Input
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">Website Link</label>
                    <Input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="e.g. https://conference.org"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">Brochure URL</label>
                    <Input
                        type="url"
                        value={brochureUrl}
                        onChange={(e) => setBrochureUrl(e.target.value)}
                        placeholder="e.g. https://conference.org/brochure.pdf"
                    />
                </div>

                <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium">WhatsApp Group Link</label>
                    <Input
                        type="url"
                        value={whatsappGroupLink}
                        onChange={(e) => setWhatsappGroupLink(e.target.value)}
                        placeholder="e.g. https://chat.whatsapp.com/..."
                    />
                </div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/*  SUBMIT BUTTON                                              */}
            {/* ---------------------------------------------------------- */}
            <div className="pt-6 flex gap-3">
                {mode === "edit" && (
                    <Button
                        variant="outline"
                        onClick={() => router.push("/dashboard/organizer/conferences")}
                    >
                        Cancel
                    </Button>
                )}

                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={mode === "create" ? "w-full md:w-auto" : ""}
                    size="lg"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            {mode === "create" ? "Creating..." : "Saving..."}
                        </>
                    ) : mode === "create" ? (
                        "Create Conference"
                    ) : (
                        "Save Changes"
                    )}
                </Button>
            </div>
        </Card>
    );
}
