"use client";

import { useState, useMemo } from "react";
import { BlogSearch } from "./BlogSearch";
import { BlogFilter } from "./BlogFilter";
import { BlogCard } from "./BlogCard";
import type { BlogPost, BlogCategoryValue } from "@/lib/blog/types";

const POSTS_PER_PAGE = 6;

interface BlogListProps {
  posts: BlogPost[];
}

/**
 * BlogList — Client component that composes search, filter, and card grid.
 * Handles filtering, searching, and "Load More" pagination.
 */
export function BlogList({ posts }: BlogListProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<BlogCategoryValue | "all">("all");
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);

  // Filter + search
  const filteredPosts = useMemo(() => {
    let result = posts;

    // Category filter
    if (category !== "all") {
      result = result.filter((p) => p.category === category);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [posts, category, search]);

  // Reset visible count when filters change
  const handleCategoryChange = (value: BlogCategoryValue | "all") => {
    setCategory(value);
    setVisibleCount(POSTS_PER_PAGE);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setVisibleCount(POSTS_PER_PAGE);
  };

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      {/* Toolbar: Search + Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <BlogFilter selected={category} onChange={handleCategoryChange} />
        <BlogSearch value={search} onChange={handleSearchChange} />
      </div>

      {/* Grid */}
      {visiblePosts.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visiblePosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No articles found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter to find what you&apos;re looking
            for.
          </p>
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + POSTS_PER_PAGE)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow"
          >
            Load More Articles
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
