import type { BlogPost } from "@/lib/blog/types";

interface JsonLdProps {
  post: BlogPost;
  url: string;
}

/**
 * JsonLd — Injects BlogPosting structured data for SEO.
 * Renders a <script type="application/ld+json"> tag with Schema.org data.
 */
export function JsonLd({ post, url }: JsonLdProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.seo.metaTitle,
    description: post.seo.metaDescription,
    image: post.coverImage.startsWith("http")
      ? post.coverImage
      : `https://confairo.com${post.coverImage}`,
    datePublished: post.date,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: post.author.name,
      jobTitle: post.author.role,
    },
    publisher: {
      "@type": "Organization",
      name: "Confairo",
      logo: {
        "@type": "ImageObject",
        url: "https://confairo.com/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    keywords: post.seo.keywords?.join(", "),
    wordCount: post.content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length,
    articleSection: post.category,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
