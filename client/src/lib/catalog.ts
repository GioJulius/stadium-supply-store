import type { Product } from "@shared/commerce/types";

export type CatalogFilter = "all" | "fan" | "player" | "retro" | "new";
export type CatalogSortMode = "featured" | "price-asc" | "price-desc" | "name-asc";

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
