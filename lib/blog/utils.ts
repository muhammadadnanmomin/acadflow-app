/**
 * Blog utility functions.
 * Pure, stateless helpers — CMS-friendly (no framework coupling).
 */

// ─── Stop words removed during slug generation ──────────────────────────────
const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "it",
  "that",
  "this",
  "as",
  "are",
  "was",
  "were",
  "be",
  "been",
  "has",
  "have",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "shall",
  "can",
  "not",
  "no",
  "nor",
  "so",
  "if",
  "than",
  "too",
  "very",
  "just",
  "about",
  "into",
  "over",
  "after",
  "before",
  "between",
  "under",
  "above",
  "up",
  "down",
  "out",
  "off",
  "then",
  "once",
  "here",
  "there",
  "when",
  "where",
  "why",
  "how",
  "all",
  "each",
  "every",
  "both",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "only",
  "own",
  "same",
  "your",
  "our",
]);

// ─── TocItem type (shared between utils and components) ─────────────────────

export interface TocItem {
  id: string;
  text: string;
  level: number; // 2 or 3
}

// ─── stripHtml ──────────────────────────────────────────────────────────────

/**
 * Strips all HTML tags from a string.
 * Also collapses whitespace and trims the result.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-zA-Z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── calculateReadingTime ───────────────────────────────────────────────────

/**
 * Calculates estimated reading time from HTML content.
 * @param content — HTML string
 * @returns formatted string like "5 min read"
 */
export function calculateReadingTime(content: string): string {
  const WORDS_PER_MINUTE = 200;
  const plainText = stripHtml(content);
  const wordCount = plainText
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const minutes = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

// ─── generateSlug ───────────────────────────────────────────────────────────

/**
 * Generates a URL-safe slug from a title string.
 * - Lowercased
 * - Hyphen-separated
 * - Stop words removed
 * - Special characters stripped
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // strip special chars
    .split(/\s+/)
    .filter((word) => word.length > 0 && !STOP_WORDS.has(word))
    .join("-")
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-|-$/g, ""); // trim leading/trailing hyphens
}

// ─── extractHeadings ────────────────────────────────────────────────────────

/**
 * Extracts h2/h3 headings with IDs from HTML content for table of contents.
 * @param html — HTML string with headings containing id attributes
 * @returns Array of TocItem
 */
export function extractHeadings(html: string): TocItem[] {
  const regex = /<h([23])\s+id="([^"]+)"[^>]*>(.*?)<\/h[23]>/gi;
  const items: TocItem[] = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    const text = match[3].replace(/<[^>]+>/g, "").trim();
    items.push({
      id: match[2],
      text,
      level: parseInt(match[1], 10),
    });
  }

  return items;
}
