"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
  level: number; // 2 or 3
}

interface TableOfContentsProps {
  content: string;
}

/**
 * TableOfContents — Sticky sidebar that parses h2/h3 from HTML content.
 * Uses IntersectionObserver to highlight the current section on scroll.
 */
export function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  // Parse headings from HTML content
  const headings: TocItem[] = (() => {
    const regex = /<h([23])\s+id="([^"]+)"[^>]*>(.*?)<\/h[23]>/gi;
    const items: TocItem[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      // Strip any HTML tags from heading text
      const text = match[3].replace(/<[^>]+>/g, "");
      items.push({
        id: match[2],
        text,
        level: parseInt(match[1], 10),
      });
    }
    return items;
  })();

  // Intersection observer to track active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first heading that is intersecting
        const visible = entries.find((e) => e.isIntersecting);
        if (visible?.target?.id) {
          setActiveId(visible.target.id);
        }
      },
      {
        rootMargin: "-80px 0px -70% 0px",
        threshold: 0,
      }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav
      className="hidden lg:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto"
      aria-label="Table of contents"
    >
      <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
        On this page
      </h4>

      <ul className="space-y-1 border-l border-gray-200">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(heading.id)?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
              className={cn(
                "block border-l-2 py-1.5 text-sm transition-all",
                heading.level === 3 ? "pl-6" : "pl-4",
                activeId === heading.id
                  ? "border-indigo-600 font-medium text-indigo-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
