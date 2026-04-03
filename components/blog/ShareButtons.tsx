"use client";

import { useState, useEffect } from "react";
import { Check, Copy, Linkedin } from "lucide-react";

interface ShareButtonsProps {
  title: string;
  slug: string;
}

/**
 * ShareButtons — Social share buttons for blog posts.
 * Twitter/X, LinkedIn, and Copy Link with toast-style feedback.
 * Uses useEffect to resolve the full URL on the client only — avoids hydration mismatch.
 */
export function ShareButtons({ title, slug }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  // Build full URL on mount only (avoids server/client hydration mismatch)
  const [url, setUrl] = useState(`https://acadflow.com/blog/${slug}`);
  useEffect(() => {
    setUrl(`${window.location.origin}/blog/${slug}`);
  }, [slug]);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-500 mr-1">Share:</span>

      {/* X (formerly Twitter) */}
      <a
        href={`https://x.com/intent/post?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
        aria-label="Share on X"
        title="Share on X"
      >
        <span className="text-sm font-semibold">X</span>
      </a>

      {/* LinkedIn */}
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
        aria-label="Share on LinkedIn"
        title="Share on LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
      </a>

      {/* Copy Link */}
      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-500 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
        title="Copy link"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-emerald-500" />
            <span className="text-emerald-600">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            <span>Copy link</span>
          </>
        )}
      </button>
    </div>
  );
}
