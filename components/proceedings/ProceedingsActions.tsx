"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download, RefreshCw } from "lucide-react";

interface Props {
  conferenceId: string;
  title: string;
}

/**
 * View / Download action buttons.
 * Each click generates a fresh signed URL (never re-uses a stale one).
 */
export default function ProceedingsActions({ conferenceId, title }: Props) {
  const [loading, setLoading] = useState(false);

  async function getSignedUrl(): Promise<string | null> {
    setLoading(true);
    try {
      const res = await fetch(`/api/proceedings/${conferenceId}`);
      const json = await res.json();
      if (!res.ok || !json.signedUrl) return null;
      return json.signedUrl;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleView() {
    const url = await getSignedUrl();
    if (url) window.open(url, "_blank");
  }

  async function handleDownload() {
    const url = await getSignedUrl();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "proceedings"}.pdf`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        onClick={handleView}
        disabled={loading}
        className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-sm"
      >
        {loading ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <ExternalLink className="h-4 w-4" />
        )}
        View PDF
      </Button>

      <Button
        onClick={handleDownload}
        disabled={loading}
        variant="outline"
        className="flex-1 gap-2 border-gray-300"
      >
        {loading ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Download
      </Button>
    </div>
  );
}
