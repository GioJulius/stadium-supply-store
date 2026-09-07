/**
 * Live smoke test for the Shopify Storefront integration.
 *
 * Goal: prove the store actually returns at least one usable product with
 * the three things a storefront needs to render — a title, an image, and a
 * non-zero price. If this passes, the homepage and PDP will work; if it
 * fails, there's an integration / catalog issue, not a UI bug.
 *
 * Behavior:
 *   - Calls the real Storefront API via `listProducts()` (no mocking).
 *   - Auto-skips when `SHOPIFY_STORE_DOMAIN` and the storefront token aren't
 *     configured, so CI environments without credentials stay green.
 *   - Logs the first 3 normalized products so the agent can see the actual
 *     output (titles, prices, image URLs) without reaching for `curl`.
 *
 * For a more verbose, standalone version see `scripts/shopify-probe.mjs`.
 */

import { describe, expect, it } from "vitest";
import { isShopifyConfigured, listProducts } from "./_core/shopify";
import { isCustomerFacingMappedProduct, STOREFRONT_CATALOG_FETCH_LIMIT } from "@/lib/catalog";

const configured = isShopifyConfigured();

describe.skipIf(!configured)("shopify smoke (live)", () => {
  it(
    "returns at least one product with title, image, and non-zero price",
    { timeout: 30_000 },
    async () => {
    const products = await listProducts({ first: 10 });

    // Print a compact view so the agent can see the actual normalized output
    // (titles, prices, image URLs) directly in test logs.
    const preview = products.slice(0, 3).map(p => ({
      handle: p.handle,
      title: p.title,
      price: `${p.priceRange.min.amount} ${p.priceRange.min.currencyCode}`,
      firstImage: p.images[0]?.url ?? null,
      variantCount: p.variants.length,
    }));
    // eslint-disable-next-line no-console
    console.log("[shopify smoke] products:", JSON.stringify(preview, null, 2));

    expect(products.length).toBeGreaterThanOrEqual(1);

    const usable = products.find(p => {
      const hasTitle = typeof p.title === "string" && p.title.trim().length > 0;
      const hasImage = (p.images[0]?.url ?? "").length > 0;
      const priceNum = Number.parseFloat(p.priceRange.min.amount);
      const hasPrice = Number.isFinite(priceNum) && priceNum > 0;
      return hasTitle && hasImage && hasPrice;
    });

      expect(
        usable,
        "No product had all three of: title, first image URL, and price > 0"
      ).toBeTruthy();
    }
  );

  // The storefront asks for STOREFRONT_CATALOG_FETCH_LIMIT products and renders
  // whatever comes back. Shopify sorts by TITLE, so once the catalogue passes
  // that ceiling the alphabetical tail disappears from the shop grid, the search
  // and the filter chips with no error anywhere — product pages and the sitemap
  // keep working, which is exactly what makes it hard to notice. It has happened
  // twice: at 250 on 2 Sep 2026, and at 1000 on 6 Sep with 1 249 products live.
  //
  // Fetch the catalogue unbounded (omitting `first` pages until Shopify stops)
  // and fail while there is still room to raise the ceiling calmly.
  // One name per category. The catalogue was imported in several lineages that
  // each invented their own wording, and by September 2026 the same category
  // was live under as many as four names — "Soccer Retro", "Soccer
  // Retro/Vintage" and "Retro"; "Windbreaker or jacket", "Jacket" and
  // "Jacket / Windbreaker". `productType` is the eyebrow on the product page
  // and the fallback badge on every card, so that showed; it would show more
  // once a type filter is built over these values.
  //
  // A NEW name here is not necessarily wrong — the store will sell a category
  // it does not sell today. It has to be a decision, though, not a spelling an
  // importer happened to use, so add it to this list deliberately.
  const CANONICAL_TYPES = new Set([
    "Fan Version",
    "Player Version",
    "Retro",
    "Kids Kit",
    "Training Set",
    "Half-Zip Training Set",
    "Half-Zip Training Top",
    "Hoodie",
    "Sweatshirt",
    "Jacket / Windbreaker",
    "Tracksuit",
    "Plain Tracksuit",
    "Rugby Jersey",
    "Rugby Vest",
    "F1 Jersey",
    "F1 Jacket",
    "Service",
  ]);

  it(
    "gives every customer-facing product a canonical productType",
    { timeout: 120_000 },
    async () => {
      const all = await listProducts();
      const facing = all.filter(isCustomerFacingMappedProduct);
      const offenders = new Map<string, string[]>();
      for (const p of facing) {
        const type = p.productType ?? "(none)";
        if (CANONICAL_TYPES.has(type)) continue;
        offenders.set(type, [...(offenders.get(type) ?? []), p.handle].slice(0, 5));
      }

      expect(
        [...offenders.keys()],
        `Off-taxonomy productType(s) on customer-facing products:\n` +
          [...offenders].map(([t, hs]) => `  "${t}" — e.g. ${hs.join(", ")}`).join("\n") +
          `\nEither map it onto an existing category in ` +
          `scripts/normalise-product-types.mjs and re-run it, or add it to ` +
          `CANONICAL_TYPES here if the store genuinely sells a new category.`
      ).toEqual([]);
    }
  );

  it(
    "has headroom under the storefront fetch ceiling",
    { timeout: 120_000 },
    async () => {
      const all = await listProducts();
      const headroom = STOREFRONT_CATALOG_FETCH_LIMIT - all.length;

      // eslint-disable-next-line no-console
      console.log(
        `[shopify smoke] catalogue ${all.length} / ceiling ${STOREFRONT_CATALOG_FETCH_LIMIT} (${headroom} to spare)`
      );

      expect(
        all.length,
        `The catalogue is ${all.length} products and the storefront only fetches ` +
          `${STOREFRONT_CATALOG_FETCH_LIMIT}. Everything past that is invisible in ` +
          `browse and search. Raise STOREFRONT_CATALOG_FETCH_LIMIT in ` +
          `client/src/lib/catalog.ts and the input max in server/routers/commerce.ts.`
      ).toBeLessThanOrEqual(STOREFRONT_CATALOG_FETCH_LIMIT);

      expect(
        headroom,
        `Only ${headroom} products of headroom left under the ceiling. A weekly ` +
          `batch runs to several hundred, so raise the ceiling now rather than ` +
          `after the next import silently hides the tail of the alphabet.`
      ).toBeGreaterThanOrEqual(500);
    }
  );
});

// Visible reminder when the suite is skipped — keeps it from looking like a
// silent pass on misconfigured sandboxes.
describe.skipIf(configured)("shopify smoke (skipped)", () => {
  it("is skipped because SHOPIFY_STORE_DOMAIN / SHOPIFY_STOREFRONT_API_ACCESS_TOKEN are not set", () => {
    expect(true).toBe(true);
  });
});
