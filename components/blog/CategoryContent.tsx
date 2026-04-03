import { cn } from "@/lib/utils";
import type { BlogCategoryValue } from "@/lib/blog/types";

interface CategoryContentProps {
  content: string;
  category: BlogCategoryValue;
}

/**
 * CategoryContent — Wraps BlogContent with category-specific prose styling.
 * Each category gets distinct blockquote, heading, code, and list styles.
 */
export function CategoryContent({ content, category }: CategoryContentProps) {
  return (
    <article
      className={cn(
        // Base prose styles
        "prose prose-gray max-w-none",
        "prose-headings:font-semibold prose-headings:tracking-tight",
        "prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:scroll-mt-24",
        "prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-h3:scroll-mt-24",
        "prose-p:leading-relaxed prose-p:text-gray-600",
        "prose-a:no-underline hover:prose-a:underline",
        "prose-strong:text-gray-900",
        "prose-ul:text-gray-600",
        "prose-blockquote:not-italic",
        // Category-specific overrides
        categoryStyles[category]
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

// ─── Per-category prose overrides ───────────────────────────────────────────

const categoryStyles: Record<BlogCategoryValue, string> = {
  // AI — Futuristic, gradient accents, neon highlights
  ai: [
    "prose-a:text-violet-600 hover:prose-a:text-violet-700",
    "prose-blockquote:border-violet-300 prose-blockquote:bg-violet-50/50 prose-blockquote:rounded-r-lg prose-blockquote:py-3 prose-blockquote:pr-4",
    "prose-blockquote:text-violet-800",
    "prose-li:marker:text-violet-400",
    "prose-code:text-violet-700 prose-code:bg-violet-50 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5",
    "prose-pre:bg-slate-950 prose-pre:border prose-pre:border-violet-500/20",
    "prose-h2:bg-gradient-to-r prose-h2:from-violet-700 prose-h2:to-indigo-600 prose-h2:bg-clip-text prose-h2:text-transparent",
  ].join(" "),

  // Conferences — Structured, step-like, indigo accents
  conferences: [
    "prose-a:text-indigo-600 hover:prose-a:text-indigo-700",
    "prose-blockquote:border-indigo-300 prose-blockquote:bg-indigo-50/40 prose-blockquote:rounded-r-lg prose-blockquote:py-3 prose-blockquote:pr-4",
    "prose-blockquote:text-indigo-800",
    "prose-li:marker:text-indigo-400",
    "prose-h2:border-l-4 prose-h2:border-indigo-500 prose-h2:pl-4",
    "prose-code:text-indigo-700 prose-code:bg-indigo-50 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5",
  ].join(" "),

  // Research — Academic, serif headings, citation-style blockquotes
  research: [
    "prose-a:text-teal-600 hover:prose-a:text-teal-700",
    "prose-blockquote:border-teal-200 prose-blockquote:bg-stone-50/60 prose-blockquote:rounded-r-lg prose-blockquote:py-3 prose-blockquote:pr-4 prose-blockquote:italic",
    "prose-blockquote:text-stone-700",
    "prose-li:marker:text-teal-400",
    "prose-h2:font-serif",
    "prose-h3:font-serif",
    "prose-code:text-teal-700 prose-code:bg-teal-50 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5",
  ].join(" "),

  // Productivity — Minimal, warm amber, clean
  productivity: [
    "prose-a:text-amber-600 hover:prose-a:text-amber-700",
    "prose-blockquote:border-amber-300 prose-blockquote:bg-amber-50/50 prose-blockquote:rounded-r-lg prose-blockquote:py-3 prose-blockquote:pr-4",
    "prose-blockquote:text-amber-800",
    "prose-li:marker:text-amber-400",
    "prose-h2:text-gray-900",
    "prose-code:text-amber-700 prose-code:bg-amber-50 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5",
    "prose-strong:text-amber-800",
  ].join(" "),

  // Tech — Developer blog, dark code blocks, emerald accents
  tech: [
    "prose-a:text-emerald-600 hover:prose-a:text-emerald-700",
    "prose-blockquote:border-emerald-400 prose-blockquote:bg-gray-50/60 prose-blockquote:rounded-r-lg prose-blockquote:py-3 prose-blockquote:pr-4",
    "prose-blockquote:text-gray-700",
    "prose-li:marker:text-emerald-400",
    "prose-h2:text-gray-900",
    "prose-code:text-emerald-700 prose-code:bg-emerald-50 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5",
    "prose-pre:bg-gray-950 prose-pre:border prose-pre:border-emerald-500/20",
  ].join(" "),
};
