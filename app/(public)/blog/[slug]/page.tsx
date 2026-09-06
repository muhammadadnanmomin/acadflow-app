import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  RefreshCw,
  User,
} from "lucide-react";

import { CategoryHeader } from "@/components/blog/CategoryHeader";
import { CategoryContent } from "@/components/blog/CategoryContent";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { ReadingProgressBar } from "@/components/blog/ReadingProgressBar";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { AuthorBox } from "@/components/blog/AuthorBox";
import { BlogCTA } from "@/components/blog/BlogCTA";
import { JsonLd } from "@/components/blog/JsonLd";
import { ScrollToTop } from "@/components/blog/ScrollToTop";
import {
  getBlogBySlug,
  getRelatedPosts,
  getAllSlugs,
  getCategoryMeta,
} from "@/lib/blog/data";
import { calculateReadingTime } from "@/lib/blog/utils";
import { cn } from "@/lib/utils";

// ─── Constants ───────────────────────────────────────────────────────────────
const SITE_URL = "https://confairo.com";

// ─── Static params for build-time generation ─────────────────────────────────
export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

// ─── Dynamic SEO metadata ────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogBySlug(slug);
  if (!post) return { title: "Post Not Found — Confairo Blog" };

  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
  const imageUrl = post.coverImage.startsWith("http")
    ? post.coverImage
    : `${SITE_URL}${post.coverImage}`;

  return {
    title: post.seo.metaTitle,
    description: post.seo.metaDescription,
    keywords: post.seo.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.seo.metaTitle,
      description: post.seo.metaDescription,
      type: "article",
      url: canonicalUrl,
      publishedTime: post.date,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      siteName: "Confairo",
    },
    twitter: {
      card: "summary_large_image",
      title: post.seo.metaTitle,
      description: post.seo.metaDescription,
      images: [imageUrl],
    },
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogBySlug(slug);
  if (!post) notFound();

  const category = getCategoryMeta(post.category);
  const related = getRelatedPosts(post.slug, post.category);
  const readingTime = calculateReadingTime(post.content);
  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;

  return (
    <>
      {/* Structured data for SEO */}
      <JsonLd post={post} url={canonicalUrl} />

      {/* Reading progress bar */}
      <ReadingProgressBar />

      <article className="relative">
        {/* ── Category-themed header ── */}
        <CategoryHeader
          category={post.category}
          title={post.title}
          categoryLabel={category.label}
        />

        {/* ── Meta card (overlapping header) ── */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="-mt-12 relative z-10 rounded-2xl border border-gray-100 bg-white p-6 shadow-lg sm:p-8">
            {/* Back link + category */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-indigo-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Link>
              <span className="text-gray-300">|</span>
              <span
                className={cn(
                  "rounded-full px-3 py-0.5 text-xs font-semibold",
                  category.color
                )}
              >
                {category.label}
              </span>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
              {/* Author */}
              <span className="inline-flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span>
                  <strong className="font-medium text-gray-700">
                    {post.author.name}
                  </strong>{" "}
                  · {post.author.role}
                </span>
              </span>

              {/* Published date */}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(post.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>

              {/* Reading time */}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {readingTime}
              </span>

              {/* Last updated */}
              {post.updatedAt && post.updatedAt !== post.date && (
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Updated{" "}
                  {new Date(post.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Cover image ── */}
        <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6 lg:px-8">
          <div className="relative aspect-[16/8] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-md">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
              priority
            />
          </div>
        </div>

        {/* ── Content area: 2-column with ToC sidebar ── */}
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_240px]">
            {/* Main content */}
            <div className="min-w-0">
              {/* Category-themed content */}
              <CategoryContent
                content={post.content}
                category={post.category}
              />

              {/* Share buttons */}
              <div className="mt-10 border-t border-gray-100 pt-6">
                <ShareButtons title={post.title} slug={post.slug} />
              </div>

              {/* Tags */}
              <div className="mt-6 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Author box */}
              <div className="mt-10">
                <AuthorBox author={post.author} />
              </div>

              {/* CTA section */}
              <div className="mt-10">
                <BlogCTA />
              </div>
            </div>

            {/* Table of contents sidebar */}
            <TableOfContents content={post.content} />
          </div>
        </div>

        {/* ── Related posts ── */}
        <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <RelatedPosts posts={related} />
        </div>
      </article>

      {/* Scroll to top */}
      <ScrollToTop />
    </>
  );
}
