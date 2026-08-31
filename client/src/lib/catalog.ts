import type { Product } from "@shared/commerce/types";

export type CatalogFilter = "all" | "fan" | "player" | "retro" | "new";
export type CatalogSortMode = "latest" | "price-asc" | "price-desc" | "name-asc";

/** Shopify Storefront supports up to 250 products in a single catalog request. */
export const STOREFRONT_CATALOG_PAGE_SIZE = 250;

const CUSTOMER_FACING_BASELINE_HANDLES = new Set([
  "stadium-supply-fan-jersey-drop-01",
  "mbeumo-19-black-kit",
]);

/**
 * A product is customer-facing only after its storefront lead media has been
 * reconciled to a supplied asset. Generic drops from 07 onward are covered by
 * the reconciliation register; the two named records below have confirmed media.
 */
export function isCustomerFacingMappedProduct(product: Product): boolean {
  return CUSTOMER_FACING_BASELINE_HANDLES.has(product.handle) || product.tags.includes("Editable Drop") || product.tags.includes("Mapped Media");
}

/**
 * Club identity is spread across title, product type and tags — which one
 * carries it depends on the import lineage the listing came from — so every
 * catalogue search reads all three as one string.
 */
function searchableText(product: Product): string {
  return [product.title, product.productType ?? "", ...product.tags].join(" ").toLowerCase();
}

/**
 * How recently a listing went live. Shopify's `publishedAt` is the only date
 * the storefront gets, and it tracks when we put a kit up — which is within a
 * day or two of the client posting it, so it stands in for "newest release"
 * closely enough to order a shop by.
 */
function publishedTime(product: Product): number {
  const t = product.publishedAt ? Date.parse(product.publishedAt) : NaN;
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Kits the client photographed for Instagram are their own current stock and
 * the ones they are actively promoting, so those lead the shop; the listings
 * built from supplier stock photos follow. This is an ordering rule only —
 * nothing on the page says where a photograph came from, because that is our
 * business and not the shopper's.
 */
function isInstagramSourced(product: Product): boolean {
  return product.tags.some(tag => /^ig-post-|^ig-drop-|^instagram/i.test(tag));
}

/**
 * `query` is the free-text term behind a menu link (a club, a competition, a
 * garment type); `filter` is the version chip on the shop toolbar. They
 * compose, so "Arsenal" + "Retro" narrows rather than replaces.
 */
export function filterAndSortProducts(
  products: Product[],
  filter: CatalogFilter,
  sort: CatalogSortMode,
  query = "",
  exclude = "",
): Product[] {
  const term = query.trim().toLowerCase();
  const without = exclude.trim().toLowerCase();
  const queried = products.filter(product => {
    const text = searchableText(product);
    if (term && !text.includes(term)) return false;
    // "Retro" means retro football; the retro rugby shirts belong to Rugby.
    if (without && text.includes(without)) return false;
    return true;
  });
  const matching = filter === "all" ? queried : queried.filter(product => searchableText(product).includes(filter));

  return [...matching].sort((a, b) => {
    const aPrice = Number(a.priceRange.min.amount);
    const bPrice = Number(b.priceRange.min.amount);
    if (sort === "price-asc") return aPrice - bPrice;
    if (sort === "price-desc") return bPrice - aPrice;
    if (sort === "name-asc") return a.title.localeCompare(b.title);
    return compareByFreshness(a, b);
  });
}

/**
 * Fan-version shirts can be printed with the buyer's own name and number for
 * R50, charged as its own cart line — see `server/_core/printingFee.ts`.
 * Player and authentic versions are excluded — those ship in the official
 * player spec — as is anything that isn't a shirt (tracksuits, jackets,
 * hoodies, polos, and shorts sold on their own). Kids kits DO print — the set
 * includes a shirt. Matching is on the title, productType and tags together,
 * because the catalogue expresses "fan version" in all three depending on
 * which import lineage a listing came from.
 */
const NON_SHIRT = /hood|sweatshirt|jacket|windbreaker|tracksuit|training|half-zip|polo|pants|t-shirt|anthem|presentation/i;

/**
 * Shorts on their own cannot take a name and number, but a kit or a set that
 * includes shorts can, because the shirt in it prints like any other. Two
 * plain tests rather than one lookahead regex, because the intent is the point.
 */
function isShortsOnly(haystack: string): boolean {
  return /shorts/i.test(haystack) && !/\b(kit|set)\b/i.test(haystack);
}

/**
 * The default order: the client's own Instagram stock first, then everything
 * else, and newest first within each. Used by the shop grid and by the home
 * page's latest drop, so both agree on what "new" means.
 */
export function compareByFreshness(a: Product, b: Product): number {
  const bySource = Number(isInstagramSourced(b)) - Number(isInstagramSourced(a));
  if (bySource !== 0) return bySource;
  const byDate = publishedTime(b) - publishedTime(a);
  if (byDate !== 0) return byDate;
  return a.title.localeCompare(b.title);
}

export function isPersonalisable(product: Product): boolean {
  const haystack = [product.title, product.productType ?? "", ...product.tags].join(" ");
  if (NON_SHIRT.test(haystack)) return false;
  if (isShortsOnly(haystack)) return false;
  if (/player version|authentic/i.test(haystack)) return false;
  // Kids kits are sold as sets rather than as "fan version", so they never
  // matched the wording test below even though the shirt prints the same way.
  if (/kids|kiddies/i.test(haystack)) return true;
  return /fan version|fan jersey/i.test(haystack);
}
