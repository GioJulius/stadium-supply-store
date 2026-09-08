import type { ProductSummary } from "@shared/commerce/types";
import taxonomy from "@shared/commerce/taxonomy.json";

// Printing and badge rules live in shared/ so the server enforces the same test
// the UI offers — each answer is worth R50 a line. Re-exported here because
// every existing call site imports them from this module.
export { isBadgeable, isPersonalisable } from "@shared/commerce/personalisation";

/**
 * The canonical product categories, from `shared/commerce/taxonomy.json`.
 *
 * `productType` is the eyebrow on the product page and the fallback badge on
 * every card, and the catalogue once carried four spellings of the same shelf,
 * so the set is pinned rather than inferred. The live smoke test in
 * `server/shopify.smoke.test.ts` fails on any customer-facing product whose type
 * is not in here, and `scripts/apply-client-sizing.mjs` reads the same file for
 * the size run each category sells in — so a new category has to be added there
 * once, deliberately, instead of arriving as whatever an importer typed.
 */
export const CANONICAL_TYPES: ReadonlySet<string> = new Set(Object.keys(taxonomy.types));

/** The size run each category sells in — `null` where sizes are set per product. */
export const SIZE_RUNS: Readonly<Record<string, readonly string[]>> = taxonomy.sizeRuns;

/**
 * The chips on the shop toolbar. Every key but `all` is matched as a substring
 * of the listing's title, product type and tags together, so a key is the term
 * the catalogue actually says — "long sleeve", not "longSleeve".
 */
export type CatalogFilter = "all" | "fan" | "player" | "retro" | "long sleeve" | "kids" | "training" | "new";
export type CatalogSortMode = "latest" | "price-asc" | "price-desc" | "name-asc";

/**
 * How many products to pull for the storefront. This is NOT Shopify's page size
 * — the server pages through the Storefront API 250 at a time — it is a ceiling
 * so a runaway catalogue cannot land unbounded on a phone.
 *
 * The ceiling truncates *silently*: the server sorts by TITLE, so whatever sits
 * past it simply stops existing for browse, search and the filter chips, while
 * its own product page and its sitemap entry carry on working. That is how it
 * failed twice. The catalogue passed 250 on 2 Sep 2026, and passed the 1000 it
 * was raised to on 6 Sep — for a day the shop showed 999 of 1 249 kits and the
 * whole alphabetical tail from Manchester United onward was unreachable.
 *
 * So keep real headroom, not a value that merely clears today's count, and keep
 * the two live guards that now watch it: the ceiling check in
 * `server/shopify.smoke.test.ts`, and `server/routers/commerce.ts`, whose input
 * `max` must never be lower than this number or the request is rejected outright.
 */
export const STOREFRONT_CATALOG_FETCH_LIMIT = 5000;

/** Products per page in the shop grid. */
export const SHOP_PAGE_SIZE = 48;

const CUSTOMER_FACING_BASELINE_HANDLES = new Set([
  "stadium-supply-fan-jersey-drop-01",
  "mbeumo-19-black-kit",
]);

/**
 * A product is customer-facing only after its storefront lead media has been
 * reconciled to a supplied asset. Generic drops from 07 onward are covered by
 * the reconciliation register; the two named records below have confirmed media.
 */
export function isCustomerFacingMappedProduct(product: ProductSummary): boolean {
  return CUSTOMER_FACING_BASELINE_HANDLES.has(product.handle) || product.tags.includes("Editable Drop") || product.tags.includes("Mapped Media");
}

/**
 * Club identity is spread across title, product type and tags — which one
 * carries it depends on the import lineage the listing came from — so every
 * catalogue search reads all three as one string.
 */
function searchableText(product: ProductSummary): string {
  return [product.title, product.productType ?? "", ...product.tags].join(" ").toLowerCase();
}

/**
 * How recently a listing went live. Shopify's `publishedAt` is the only date
 * the storefront gets, and it tracks when we put a kit up — which is within a
 * day or two of the client posting it, so it stands in for "newest release"
 * closely enough to order a shop by.
 */
function publishedTime(product: ProductSummary): number {
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
function isInstagramSourced(product: ProductSummary): boolean {
  return product.tags.some(tag => /^ig-post-|^ig-drop-|^instagram/i.test(tag));
}

/**
 * `query` is the free-text term behind a menu link (a club, a competition, a
 * garment type); `filter` is the version chip on the shop toolbar. They
 * compose, so "Arsenal" + "Retro" narrows rather than replaces.
 */
export function filterAndSortProducts(
  products: ProductSummary[],
  filter: CatalogFilter,
  sort: CatalogSortMode,
  query = "",
  exclude = "",
): ProductSummary[] {
  const queried = textMatchProducts(products, query, exclude);
  const matching = filter === "all" ? queried : queried.filter(product => searchableText(product).includes(filter));
  return sortProducts(matching, sort);
}

/**
 * The free-text half of the old combined helper, split out so the shop can
 * narrow by search term first and then build its filter rail from whatever
 * survived — the rail's options have to describe the results, not the archive.
 */
export function textMatchProducts(products: ProductSummary[], query = "", exclude = ""): ProductSummary[] {
  const term = query.trim().toLowerCase();
  const without = exclude.trim().toLowerCase();
  if (!term && !without) return products;
  return products.filter(product => {
    const text = searchableText(product);
    if (term && !text.includes(term)) return false;
    // "Retro" means retro football; the retro rugby shirts belong to Rugby.
    if (without && text.includes(without)) return false;
    return true;
  });
}

/** The ordering half of the old combined helper. */
export function sortProducts(products: ProductSummary[], sort: CatalogSortMode): ProductSummary[] {
  return [...products].sort((a, b) => {
    const aPrice = Number(a.priceRange.min.amount);
    const bPrice = Number(b.priceRange.min.amount);
    if (sort === "price-asc") return aPrice - bPrice;
    if (sort === "price-desc") return bPrice - aPrice;
    if (sort === "name-asc") return a.title.localeCompare(b.title);
    return compareByFreshness(a, b);
  });
}

/**
 * The default order: the client's own Instagram stock first, then everything
 * else, and newest first within each. Used by the shop grid and by the home
 * page's latest drop, so both agree on what "new" means.
 */
export function compareByFreshness(a: ProductSummary, b: ProductSummary): number {
  const bySource = Number(isInstagramSourced(b)) - Number(isInstagramSourced(a));
  if (bySource !== 0) return bySource;
  const byDate = publishedTime(b) - publishedTime(a);
  if (byDate !== 0) return byDate;
  return a.title.localeCompare(b.title);
}

/**
 * Split a Shopify description into display paragraphs.
 *
 * `descriptionHtml` is the only field that still knows where the breaks were;
 * the plain `description` has had its tags removed with nothing in their place.
 * Text is extracted from the markup, never injected as HTML, so an unexpected
 * tag from the Shopify admin renders as inert text rather than as markup.
 */
export function paragraphsFrom(html: string | null | undefined, fallback = ""): string[] {
  const source = (html ?? "").trim();
  if (!source) return fallback.trim() ? [fallback.trim()] : [];
  return source
    .split(/<\/(?:p|div|li)>|<br\s*\/?>/i)
    .map(chunk => chunk.replace(/<[^>]*>/g, ""))
    .map(chunk => chunk
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
