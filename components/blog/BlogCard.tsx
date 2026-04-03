import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, User } from "lucide-react";

import { getCategoryMeta } from "@/lib/blog/data";
import type { BlogPost } from "@/lib/blog/types";
import { calculateReadingTime } from "@/lib/blog/utils";
import { cn } from "@/lib/utils";

interface BlogCardProps {
  post: BlogPost;
}

/**
 * BlogCard — Card component for the blog listing grid.
 * Hover: lifts up with shadow transition.
 */
export function BlogCard({ post }: BlogCardProps) {
  const category = getCategoryMeta(post.category);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-gray-200"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Category badge */}
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold",
            category.color
          )}
        >
          {category.label}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Title (2-line clamp) */}
        <h3 className="text-base font-semibold leading-snug text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {post.title}
        </h3>

        {/* Excerpt (2-line clamp) */}
        <p className="mt-2 text-sm leading-relaxed text-gray-500 line-clamp-2">
          {post.excerpt}
        </p>

        {/* Meta footer */}
        <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-gray-400">
          {/* Author */}
          <span className="inline-flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {post.author.name}
          </span>

          {/* Date */}
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(post.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>

          {/* Read time */}
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {calculateReadingTime(post.content)}
          </span>
        </div>
      </div>
    </Link>
  );
}
