"use client";

import { cn } from "@/lib/utils";
import { blogCategories } from "@/lib/blog/data";
import type { BlogCategoryValue } from "@/lib/blog/types";

interface BlogFilterProps {
  selected: BlogCategoryValue | "all";
  onChange: (value: BlogCategoryValue | "all") => void;
}

/**
 * BlogFilter — Horizontal pill-style category filter tabs.
 */
export function BlogFilter({ selected, onChange }: BlogFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* "All" pill */}
      <button
        type="button"
        onClick={() => onChange("all")}
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
          selected === "all"
            ? "bg-indigo-600 text-white shadow-sm"
            : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
        )}
      >
        All
      </button>

      {/* Category pills */}
      {blogCategories.map((cat) => (
        <button
          key={cat.value}
          type="button"
          onClick={() => onChange(cat.value)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
            selected === cat.value
              ? "bg-indigo-600 text-white shadow-sm"
              : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
