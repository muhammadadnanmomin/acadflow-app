/**
 * Blog feature type definitions.
 * Structured so they can map directly to a CMS schema (Sanity, Strapi, etc.)
 */

export interface BlogAuthor {
  name: string;
  avatar: string;
  role: string;
  bio: string;
  /** Optional LinkedIn profile URL */
  linkedin?: string;
}

export interface BlogSeo {
  /** Optimized for CTR — max 60 chars */
  metaTitle: string;
  /** Engaging description — 150–160 chars */
  metaDescription: string;
  /** Optional relevant keywords */
  keywords?: string[];
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  /** Rich HTML content for the post body */
  content: string;
  coverImage: string;
  author: BlogAuthor;
  /** Publication date — ISO date string */
  date: string;
  /** Last updated date — ISO date string (for SEO freshness) */
  updatedAt: string;
  /** SEO metadata for the post */
  seo: BlogSeo;
  category: BlogCategoryValue;
  tags: string[];
  featured: boolean;
}

export type BlogCategoryValue =
  | "ai"
  | "conferences"
  | "research"
  | "productivity"
  | "tech";

export interface BlogCategory {
  label: string;
  value: BlogCategoryValue;
  color: string; // Tailwind color class for the badge
}
