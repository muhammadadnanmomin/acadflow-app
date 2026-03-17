"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Download, ExternalLink, RefreshCw } from "lucide-react";

interface Props {
  conferenceId: string;
  title: string;
  description: string | null;
  createdAt: string;
}

/**
 * Proceedings viewer for authorized users.
 * Each click regenerates a fresh signed URL.
 */
export default function ProceedingsViewer({
  conferenceId,
  title,
  description,
  createdAt,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function fetchSignedUrl(): Promise<string | null> {
    setLoading(true);
    try {
      const res = await fetch(`/api/proceedings/${conferenceId}`);
      const json = await res.json();
      if (!res.ok || !json.signedUrl) {
        console.error("Failed to get signed URL:", json.error);
        return null;
      }
      return json.signedUrl;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleView() {
    const url = await fetchSignedUrl();
    if (url) window.open(url, "_blank");
  }

  async function handleDownload() {
    const url = await fetchSignedUrl();
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
    <Card className="mx-auto max-w-lg p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
          <BookOpen className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            📚 Conference Proceedings
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Published {new Date(createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Title & Description */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-gray-500 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleView}
          disabled={loading}
          className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700"
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
          className="flex-1 gap-2"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download
        </Button>
      </div>

      {/* Security note */}
      <p className="mt-4 text-[11px] text-gray-400 text-center">
        Links expire after 5 minutes and are regenerated on each request.
      </p>
    </Card>
  );
}
