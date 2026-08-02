import type { CollectionEntry } from "astro:content";
import { postFilter } from "./postFilter";
import { slugifyStr } from "./slugify";

type Category = {
  category: string;
  categoryName: string;
};

/**
 * Builds a de-duplicated, sorted category list from posts.
 *
 * - Drafts and scheduled posts are excluded via `postFilter()`
 * - `category` is the slug used in URLs; `categoryName` is the original label for display
 */
export function getUniqueCategories(posts: CollectionEntry<"posts">[]) {
  const categories: Category[] = posts
    .filter(postFilter)
    .flatMap(post => post.data.categories ?? [])
    .map(category => ({ category: slugifyStr(category), categoryName: category }))
    .filter(
      (value, index, self) =>
        self.findIndex(cat => cat.category === value.category) === index
    )
    .sort((catA, catB) => catA.category.localeCompare(catB.category));
  return categories;
}
