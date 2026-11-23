// The whole browsable catalogue, assembled in the browser.
//
// Why not `trpc.commerce.products.list`: on Cloudflare's free plan a Worker
// gets 10 ms of CPU per request, and building 1 274 products on the server
// (parse + normalise + superjson) costs ~170 ms. That request died with error
// 1102 on every cold load from 6 Nov 2026 and /shop read "00 kits". So the
// Worker now passes Shopify's raw pages through untouched (/api/catalog-page,
// edge-cached per cursor) and the browser does the parsing and normalising,
// with the same `normalizeProductSummary` the server uses.
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { ProductSummary } from "@shared/commerce/types";
import { normalizeProductSummary, type RawProductSummary } from "../../../server/_core/shopifyNormalize";
import { STOREFRONT_CATALOG_FETCH_LIMIT } from "./catalog";

type RawPage = {
  data?: {
    products: {
      pageInfo?: { hasNextPage: boolean; endCursor: string | null };
      edges: Array<{ node: RawProductSummary }>;
    };
  };
  errors?: Array<{ message?: string }>;
};

async function fetchCatalog(): Promise<ProductSummary[]> {
  const out: ProductSummary[] = [];
  const seen = new Set<string>();
  let cursor: string | null = null;
  do {
    const url: string = cursor ? `/api/catalog-page?after=${encodeURIComponent(cursor)}` : "/api/catalog-page";
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Catalogue page failed: HTTP ${res.status}`);
    const body = (await res.json()) as RawPage;
    if (!body.data) throw new Error(body.errors?.[0]?.message ?? "Catalogue page had no data");
    // Pages are cached separately at the edge, so two adjacent pages can come
    // from slightly different moments; drop any repeat rather than show it twice.
    for (const { node } of body.data.products.edges) {
      if (seen.has(node.id)) continue;
      seen.add(node.id);
      out.push(normalizeProductSummary(node));
    }
    const info = body.data.products.pageInfo;
    cursor = info?.hasNextPage ? info.endCursor : null;
  } while (cursor && out.length < STOREFRONT_CATALOG_FETCH_LIMIT);
  return out;
}

type Options = Pick<UseQueryOptions<ProductSummary[]>, "enabled">;

/** Same key everywhere, so the shop, home, menu and product page share one download. */
export function useCatalog(options: Options = {}) {
  return useQuery({
    queryKey: ["catalog"],
    queryFn: fetchCatalog,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}
