import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { STOREFRONT_CATALOG_FETCH_LIMIT } from "@/lib/catalog";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeCtx(user: AuthenticatedUser | null = null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  process.env.SHOPIFY_STORE_DOMAIN = "test.myshopify.com";
  process.env.SHOPIFY_STOREFRONT_API_ACCESS_TOKEN = "test-token";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function ok(data: unknown) {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({ data }),
    text: async () => "",
  } as Response);
}

const rawVariant = {
  id: "gid://shopify/ProductVariant/1",
  title: "Default Title",
  availableForSale: true,
  price: { amount: "385.00", currencyCode: "USD" },
  compareAtPrice: null,
  selectedOptions: [{ name: "Title", value: "Default Title" }],
};

const rawProduct = {
  id: "gid://shopify/Product/1",
  title: "Aria",
  handle: "aria",
  description: "",
  descriptionHtml: "",
  productType: "Sculpted",
  vendor: "Maison",
  tags: ["Stoneware"],
  options: [{ name: "Title", values: ["Default Title"] }],
  priceRange: {
    minVariantPrice: { amount: "385.00", currencyCode: "USD" },
    maxVariantPrice: { amount: "385.00", currencyCode: "USD" },
  },
  images: {
    edges: [
      { node: { url: "https://img/1.jpg", altText: null, width: 800, height: 1000 } },
    ],
  },
  variants: { edges: [{ node: rawVariant }] },
};

describe("commerce.products", () => {
  // The storefront sends STOREFRONT_CATALOG_FETCH_LIMIT verbatim from
  // client/src/lib/catalog.ts. If this input `max` ever drops below it the
  // whole shop 500s on its first query, so pin the two together.
  it("accepts the exact `first` the storefront asks for", async () => {
    ok({
      products: {
        pageInfo: { hasNextPage: false, endCursor: null },
        edges: [{ node: rawProduct }],
      },
    });

    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.commerce.products.list({ first: STOREFRONT_CATALOG_FETCH_LIMIT })
    ).resolves.toHaveLength(1);
  });

  it("normalizes the Storefront response into backend-agnostic Product shapes", async () => {
    ok({ products: { edges: [{ node: rawProduct }] } });

    const caller = appRouter.createCaller(makeCtx());
    const products = await caller.commerce.products.list();

    expect(products).toHaveLength(1);
    const product = products[0];
    expect(product.handle).toBe("aria");
    expect(product.images).toEqual([
      { url: "https://img/1.jpg", altText: null, width: 800, height: 1000 },
    ]);
    expect(product.priceRange.min.amount).toBe("385.00");
    // A grid asks "can I buy this, and in what size" — and nothing else of a
    // variant. The id, price and title stay behind on the detail query.
    expect(product.variants[0]).toEqual({
      availableForSale: true,
      selectedOptions: [{ name: "Title", value: "Default Title" }],
    });

    // The shape must not contain raw GraphQL edges/nodes — that would mean the
    // normalization layer leaked. Stringify and assert.
    const serialized = JSON.stringify(product);
    expect(serialized.includes("edges")).toBe(false);

    // Endpoint should hit the pinned API version.
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/api\/2025-04\/graphql\.json$/);
    expect((init as RequestInit).headers).toMatchObject({
      "X-Shopify-Storefront-Access-Token": "test-token",
    });
  });

  // The whole catalogue travels on this response — 1 249 products in September
  // 2026 — so the list must not carry anything a card cannot render. Dropping
  // these four took the payload from 3.4 MB to about 1.3 MB.
  it("leaves the detail-page-only fields off the list", async () => {
    ok({ products: { edges: [{ node: rawProduct }] } });

    const caller = appRouter.createCaller(makeCtx());
    const [product] = await caller.commerce.products.list();

    for (const field of ["description", "descriptionHtml", "options"]) {
      expect(product, `${field} belongs to the detail query, not the grid`).not.toHaveProperty(field);
    }
    for (const field of ["id", "title", "price", "compareAtPrice"]) {
      expect(product.variants[0], `variant ${field} is dead weight in a grid`).not.toHaveProperty(field);
    }
  });

  it("still returns the full product, variant ids and all, by handle", async () => {
    ok({ productByHandle: rawProduct });

    const caller = appRouter.createCaller(makeCtx());
    const product = await caller.commerce.products.byHandle({ handle: "aria" });

    expect(product.descriptionHtml).toBe(rawProduct.descriptionHtml);
    expect(product.options).toEqual(rawProduct.options);
    expect(product.variants[0].id).toBe(rawVariant.id);
    expect(product.variants[0].price.amount).toBe(rawVariant.price.amount);
  });

  it("maps a missing handle to a NOT_FOUND TRPCError", async () => {
    ok({ productByHandle: null });

    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.commerce.products.byHandle({ handle: "nope" })
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("commerce.cart", () => {
  it("creates a cart, normalizes lines, and appends channel=online_store to the checkout URL", async () => {
    ok({
      cartCreate: {
        cart: {
          id: "gid://shopify/Cart/1",
          checkoutUrl: "https://test.myshopify.com/checkout/abc",
          totalQuantity: 2,
          cost: {
            totalAmount: { amount: "770.00", currencyCode: "USD" },
            subtotalAmount: { amount: "770.00", currencyCode: "USD" },
          },
          lines: {
            edges: [
              {
                node: {
                  id: "gid://shopify/CartLine/1",
                  quantity: 2,
                  cost: { totalAmount: { amount: "770.00", currencyCode: "USD" } },
                  merchandise: {
                    id: rawVariant.id,
                    title: "Default Title",
                    price: { amount: "385.00", currencyCode: "USD" },
                    product: {
                      handle: "aria",
                      title: "Aria",
                      images: {
                        edges: [{ node: { url: "https://img/1.jpg", altText: null } }],
                      },
                    },
                  },
                },
              },
            ],
          },
        },
        userErrors: [],
      },
    });

    const caller = appRouter.createCaller(makeCtx());
    const cart = await caller.commerce.cart.create({
      lines: [{ variantId: rawVariant.id, quantity: 2 }],
    });

    expect(cart.id).toBe("gid://shopify/Cart/1");
    expect(cart.itemCount).toBe(2);
    expect(cart.checkoutUrl).toMatch(/\?channel=online_store$/);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toMatchObject({
      lineId: "gid://shopify/CartLine/1",
      variantId: rawVariant.id,
      productHandle: "aria",
      quantity: 2,
    });
  });

  // Both extras cost R50, and reconcileAddonFees bills any line that claims one,
  // so the garment has to be checked server-side. The rule used to live only in
  // client code, where it decides whether to OFFER the option — a crafted
  // request could attach printing to a pair of shorts and be charged for work
  // the print shop cannot do.
  it("refuses printing on a garment that cannot take it", async () => {
    ok({
      nodes: [
        {
          id: rawVariant.id,
          product: { title: "Manchester United 2025/26 Home Shorts", productType: "Shorts", tags: ["Fan Version"] },
        },
      ],
    });

    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.commerce.cart.create({
        lines: [{ variantId: rawVariant.id, quantity: 1, personalisation: { name: "PELE", number: "10" } }],
      })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("cannot be printed"),
    });

    // Refused before the cart was ever created: the lookup is the only call.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refuses a badge on a garment that cannot take one", async () => {
    ok({
      nodes: [
        {
          id: rawVariant.id,
          product: { title: "Arsenal Training Hoodie", productType: "Hoodie", tags: ["Hoodie"] },
        },
      ],
    });

    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.commerce.cart.create({
        lines: [{ variantId: rawVariant.id, quantity: 1, badge: true, badgeChoice: "Premier League" }],
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  // The two extras parted company on 8 Sep 2026, when the client asked for
  // printing on retros. A retro takes a name and number; it takes no badge,
  // because every badge on offer is the current competition patch.
  it("prints a retro but refuses it a badge", async () => {
    const retro = {
      nodes: [
        {
          id: rawVariant.id,
          product: { title: "1994 Brazil Home Retro", productType: "Retro", tags: ["Retro"] },
        },
      ],
    };

    ok(retro);
    ok({
      cartCreate: {
        cart: {
          id: "gid://shopify/Cart/1",
          checkoutUrl: "https://shop/checkout",
          totalQuantity: 1,
          cost: { subtotalAmount: { amount: "435.00", currencyCode: "ZAR" }, totalAmount: { amount: "435.00", currencyCode: "ZAR" } },
          lines: { edges: [] },
        },
        userErrors: [],
      },
    });

    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.commerce.cart.create({
        lines: [{ variantId: rawVariant.id, quantity: 1, personalisation: { name: "ROMARIO", number: "11" } }],
      })
    ).resolves.toMatchObject({ id: "gid://shopify/Cart/1" });

    ok(retro);
    await expect(
      caller.commerce.cart.create({
        lines: [{ variantId: rawVariant.id, quantity: 1, badge: true, badgeChoice: "Premier League" }],
      })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("competition badge"),
    });
  });

  // A plain line asks for nothing, so it must not pay for the lookup either.
  it("does not look a variant up when no line asks for an extra", async () => {
    ok({
      cartCreate: {
        cart: {
          id: "gid://shopify/Cart/1",
          checkoutUrl: "https://shop/checkout",
          totalQuantity: 1,
          cost: { subtotalAmount: { amount: "385.00", currencyCode: "ZAR" }, totalAmount: { amount: "385.00", currencyCode: "ZAR" } },
          lines: { edges: [] },
        },
        userErrors: [],
      },
    });

    const caller = appRouter.createCaller(makeCtx());
    await caller.commerce.cart.create({ lines: [{ variantId: rawVariant.id, quantity: 1 }] });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("maps Shopify userErrors onto a BAD_REQUEST TRPCError", async () => {
    ok({
      cartCreate: {
        cart: null,
        userErrors: [{ message: "merchandise does not exist", field: ["lines"] }],
      },
    });

    const caller = appRouter.createCaller(makeCtx());

    await expect(
      caller.commerce.cart.create({
        lines: [{ variantId: "gid://shopify/ProductVariant/999", quantity: 1 }],
      })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("merchandise does not exist"),
    });
  });

  it("propagates HTTP failures as INTERNAL_SERVER_ERROR", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({}),
      text: async () => "",
    } as Response);

    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.commerce.products.list()).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });
});
