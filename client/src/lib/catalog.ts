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

export function filterAndSortProducts(products: Product[], filter: CatalogFilter, sort: CatalogSortMode): Product[] {
  const matching = filter === "all" ? products : products.filter(product => {
    const searchable = [product.title, product.productType ?? "", ...product.tags].join(" ").toLowerCase();
    return searchable.includes(filter);
  });

  return [...matching].sort((a, b) => {
    const aPrice = Number(a.priceRange.min.amount);
    const bPrice = Number(b.priceRange.min.amount);
    if (sort === "price-asc") return aPrice - bPrice;
    if (sort === "price-desc") return bPrice - aPrice;
    if (sort === "name-asc") return a.title.localeCompare(b.title);
    return 0;
  });
}
