"use client";

import { Copy, MessageCircle, Mail, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface ShareConferenceProps {
    url: string;
    title?: string;
}

export default function ShareConference({ url, title }: ShareConferenceProps) {
    const { toast } = useToast();

    const displayTitle = title || "this conference";

    /* ── Copy Link ──────────────────────────────────────────────────── */
    async function copyLink() {
        try {
            await navigator.clipboard.writeText(url);
            toast({ title: "Conference link copied to clipboard" });
        } catch {
            toast({
                variant: "destructive",
                title: "Failed to copy",
                description: "Please copy the link manually.",
            });
        }
    }

    /* ── WhatsApp ───────────────────────────────────────────────────── */
    function shareWhatsApp() {
        const message = `📢 Call for Papers\n\n${displayTitle}\n\nSubmit your research or participate here:\n${url}`;
        window.open(
            `https://wa.me/?text=${encodeURIComponent(message)}`,
            "_blank"
        );
    }

    /* ── Email ──────────────────────────────────────────────────────── */
    function shareEmail() {
        const subject = encodeURIComponent("Conference Invitation");
        const body = encodeURIComponent(
            `I found this conference you might be interested in.\n\n${displayTitle}\n\nConference Link:\n${url}`
        );
        window.open(`mailto:?subject=${subject}&body=${body}`);
    }

    /* ── Native Share / Fallback ────────────────────────────────────── */
    async function shareNative() {
        if (typeof navigator !== "undefined" && navigator.share) {
            try {
                await navigator.share({
                    title: displayTitle,
                    text: `Check out this conference: ${displayTitle}`,
                    url,
                });
            } catch {
                // User cancelled — do nothing
            }
        } else {
            copyLink();
        }
    }

    return (
        <div className="flex flex-wrap gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={copyLink}
                className="gap-1.5"
            >
                <Copy className="h-3.5 w-3.5" />
                Copy Link
            </Button>

            <Button
                variant="outline"
                size="sm"
                onClick={shareWhatsApp}
                className="gap-1.5 text-green-700 border-green-200 hover:bg-green-50"
            >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
            </Button>

            <Button
                variant="outline"
                size="sm"
                onClick={shareEmail}
                className="gap-1.5"
            >
                <Mail className="h-3.5 w-3.5" />
                Email
            </Button>

            <Button
                variant="outline"
                size="sm"
                onClick={shareNative}
                className="gap-1.5"
            >
                <Share2 className="h-3.5 w-3.5" />
                Share
            </Button>
        </div>
    );
}
