import type { Metadata } from "next";

import { BlogHero } from "@/components/blog/BlogHero";
import { FeaturedPost } from "@/components/blog/FeaturedPost";
import { BlogList } from "@/components/blog/BlogList";
import { getFeaturedPost, getNonFeaturedPosts } from "@/lib/blog/data";

// ─── SEO Metadata ────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Blog — AcadFlow | Insights on AI, Conferences & Academic Workflows",
  description:
    "Explore the AcadFlow blog for insights on AI in academia, conference management best practices, research productivity tips, and the latest in academic technology.",
  keywords: [
    "academic blog",
    "conference management tips",
    "AI in academia",
    "research productivity",
    "peer review guide",
    "AcadFlow blog",
  ],
  openGraph: {
    title: "AcadFlow Blog — Insights on AI, Conferences & Academic Workflows",
    description:
      "Tips, guides, and insights for conference organizers, researchers, and academics. Powered by AcadFlow.",
    type: "website",
  },
};

// ─── Page ────────────────────────────────────────────────────────────────────
export default function BlogPage() {
  const featured = getFeaturedPost();
  const posts = getNonFeaturedPosts();

  return (
    <>
      {/* Hero section */}
      <BlogHero />

      {/* Featured post */}
      {featured && <FeaturedPost post={featured} />}

      {/* Blog listing with search, filter, pagination */}
      <BlogList posts={posts} />
    </>
  );
}
