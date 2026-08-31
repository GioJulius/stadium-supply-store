import type { Product } from "@shared/commerce/types";

export type CatalogFilter = "all" | "fan" | "player" | "retro" | "new";
export type CatalogSortMode = "featured" | "price-asc" | "price-desc" | "name-asc";

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
 * `query` is the free-text term behind a menu link (a club, a competition, a
 * garment type); `filter` is the version chip on the shop toolbar. They
 * compose, so "Arsenal" + "Retro" narrows rather than replaces.
 */
export function filterAndSortProducts(
  products: Product[],
  filter: CatalogFilter,
  sort: CatalogSortMode,
  query = "",
): Product[] {
  const term = query.trim().toLowerCase();
  const queried = term ? products.filter(product => searchableText(product).includes(term)) : products;
  const matching = filter === "all" ? queried : queried.filter(product => searchableText(product).includes(filter));

  return [...matching].sort((a, b) => {
    const aPrice = Number(a.priceRange.min.amount);
    const bPrice = Number(b.priceRange.min.amount);
    if (sort === "price-asc") return aPrice - bPrice;
    if (sort === "price-desc") return bPrice - aPrice;
    if (sort === "name-asc") return a.title.localeCompare(b.title);
    return 0;
  });
}

/**
 * Fan-version shirts can be printed with the buyer's own name and number for
 * R50, charged as its own cart line — see `server/_core/printingFee.ts`.
 * Player and authentic versions are excluded — those ship in the official
 * player spec — as is anything that isn't a shirt (tracksuits, jackets,
 * hoodies, kids kits, polos, shorts). Matching is on the title, productType
 * and tags together, because the catalogue expresses "fan version" in all
 * three depending on which import lineage a listing came from.
 */
const NON_SHIRT = /hood|sweatshirt|jacket|windbreaker|tracksuit|training|half-zip|polo|shorts|pants|kids|t-shirt|anthem|presentation|kit \+/i;

export function isPersonalisable(product: Product): boolean {
  const haystack = [product.title, product.productType ?? "", ...product.tags].join(" ");
  if (NON_SHIRT.test(haystack)) return false;
  if (/player version|authentic/i.test(haystack)) return false;
  return /fan version|fan jersey/i.test(haystack);
}
