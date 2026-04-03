import { BlogCard } from "./BlogCard";
import type { BlogPost } from "@/lib/blog/types";

interface RelatedPostsProps {
  posts: BlogPost[];
}

/**
 * RelatedPosts — Section below the blog content showing related articles.
 */
export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className="border-t border-gray-100 pt-12">
      <h2 className="text-xl font-bold text-gray-900">
        More from AcadFlow Blog
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Continue exploring related articles
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
