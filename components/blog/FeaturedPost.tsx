import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Clock, User } from "lucide-react";

import { getCategoryMeta } from "@/lib/blog/data";
import type { BlogPost } from "@/lib/blog/types";
import { calculateReadingTime } from "@/lib/blog/utils";
import { cn } from "@/lib/utils";

interface FeaturedPostProps {
  post: BlogPost;
}

/**
 * FeaturedPost — Full-width hero card for the latest/pinned featured post.
 * Two-column on desktop, stacked on mobile.
 */
export function FeaturedPost({ post }: FeaturedPostProps) {
  const category = getCategoryMeta(post.category);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <Link
        href={`/blog/${post.slug}`}
        className="group grid overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lg md:grid-cols-2"
      >
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 md:aspect-auto md:min-h-[360px]">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />

          {/* Featured badge */}
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-md">
              ✦ Featured
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                category.color
              )}
            >
              {category.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          <h2 className="text-2xl font-bold leading-tight text-gray-900 group-hover:text-indigo-600 transition-colors sm:text-3xl">
            {post.title}
          </h2>

          <p className="mt-3 text-base leading-relaxed text-gray-600 line-clamp-3">
            {post.excerpt}
          </p>

          {/* Meta */}
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {post.author.name}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {new Date(post.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {calculateReadingTime(post.content)}
            </span>
          </div>

          {/* CTA */}
          <div className="mt-6">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition-colors group-hover:text-indigo-700">
              Read Article
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}
