import Image from "next/image";
import { Linkedin } from "lucide-react";
import type { BlogAuthor } from "@/lib/blog/types";

interface AuthorBoxProps {
  author: BlogAuthor;
}

/**
 * AuthorBox — Displays author avatar, name, role, bio, and optional LinkedIn link.
 * Clean card design placed after blog content.
 */
export function AuthorBox({ author }: AuthorBoxProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50/80 to-white p-6 shadow-sm sm:flex-row sm:items-start sm:gap-5 sm:p-8">
      {/* Avatar */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-indigo-100 ring-offset-2 sm:h-20 sm:w-20">
        <Image
          src={author.avatar}
          alt={author.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      {/* Info */}
      <div className="text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Written by
        </p>
        <h3 className="mt-1 text-lg font-bold text-gray-900">
          {author.name}
        </h3>
        <p className="text-sm font-medium text-indigo-600">{author.role}</p>

        {/* LinkedIn link */}
        {author.linkedin && (
          <a
            href={author.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn profile"
            className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-indigo-600"
          >
            <Linkedin className="h-4 w-4" />
            <span>LinkedIn</span>
          </a>
        )}

        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          {author.bio}
        </p>
      </div>
    </div>
  );
}
