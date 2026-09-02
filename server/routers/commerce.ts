/**
 * Commerce router — backend-agnostic tRPC surface for the storefront.
 *
 * The router is intentionally thin: zod validates input, then delegates to the
 * named functions exported from `server/_core/shopify`. If we ever swap
 * commerce backends, only `_core/shopify.ts` + `_core/shopifyNormalize.ts`
 * change — this router stays put.
 */

import { z } from "zod";
import {
  addCartLines,
  createCart,
  getCart,
  getCollectionByHandle,
  getProductByHandle,
  listCollections,
  listProducts,
  removeCartLines,
  updateCartLines,
} from "../_core/shopify";
import {
  PERSONALISATION_NAME_KEY,
  PERSONALISATION_NUMBER_KEY,
  BADGE_KEY,
  BADGE_CHOICE_KEY,
} from "../_core/shopifyNormalize";
import { reconcileAddonFees } from "../_core/addonFees";
import { publicProcedure, router } from "../_core/trpc";

/**
 * Shirt personalisation. Validated here rather than trusted from the client,
 * because whatever lands in these fields gets printed onto a garment: the
 * charset is limited to what a print shop can set, the name is capped at the
 * width of a shirt back, and the number is 1-2 digits like a real squad number.
 */
const personalisationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .max(12)
      .regex(/^[A-Za-z .'-]*$/, "Letters, spaces, apostrophes and hyphens only")
      .default(""),
    number: z
      .string()
      .trim()
      .regex(/^(|[0-9]|[1-9][0-9])$/, "0-99")
      .default(""),
  })
  .refine(p => p.name !== "" || p.number !== "", {
    message: "Personalisation needs a name or a number",
  });

const cartLineInputSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
  personalisation: personalisationSchema.optional(),
  /** The client's paid competition badge — R50, charged per shirt. */
  badge: z.boolean().optional(),
  /** Which competition badge, free text so an unlisted one still gets ordered. */
  badgeChoice: z.string().trim().max(40).optional(),
});

/** Map validated personalisation onto the cart-line attributes Shopify stores. */
function toLineAttributes(line: z.infer<typeof cartLineInputSchema>) {
  const p = line.personalisation;
  const attributes: Array<{ key: string; value: string }> = [];
  if (p?.name) attributes.push({ key: PERSONALISATION_NAME_KEY, value: p.name.toUpperCase() });
  if (p?.number) attributes.push({ key: PERSONALISATION_NUMBER_KEY, value: p.number });
  if (line.badge) attributes.push({ key: BADGE_KEY, value: "Yes" });
  // Only meaningful alongside the badge itself, so it is never sent on its own.
  if (line.badge && line.badgeChoice) attributes.push({ key: BADGE_CHOICE_KEY, value: line.badgeChoice });
  return attributes.length ? attributes : undefined;
}

const toCartLine = (line: z.infer<typeof cartLineInputSchema>) => ({
  variantId: line.variantId,
  quantity: line.quantity,
  attributes: toLineAttributes(line),
});

const cartLineUpdateSchema = z.object({
  lineId: z.string().min(1),
  /** 0 means "remove this line" — the route forwards to removeLines. */
  quantity: z.number().int().min(0).max(99),
});

export const commerceRouter = router({
  products: router({
    list: publicProcedure
      .input(
        z
          .object({
            first: z.number().int().min(1).max(1000).optional(),
            collectionHandle: z.string().min(1).optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return listProducts(input ?? {});
      }),
    byHandle: publicProcedure
      .input(z.object({ handle: z.string().min(1) }))
      .query(async ({ input }) => {
        return getProductByHandle(input.handle);
      }),
  }),
  collections: router({
    list: publicProcedure
      .input(z.object({ first: z.number().int().min(1).max(50).optional() }).optional())
      .query(async ({ input }) => {
        return listCollections(input?.first);
      }),
    byHandle: publicProcedure
      .input(z.object({ handle: z.string().min(1) }))
      .query(async ({ input }) => {
        return getCollectionByHandle(input.handle);
      }),
  }),
  cart: router({
    create: publicProcedure
      .input(z.object({ lines: z.array(cartLineInputSchema).min(1).max(50) }))
      .mutation(async ({ input }) => {
        return reconcileAddonFees(await createCart(input.lines.map(toCartLine)));
      }),
    get: publicProcedure
      .input(z.object({ cartId: z.string().min(1) }))
      .query(async ({ input }) => {
        return getCart(input.cartId);
      }),
    addLines: publicProcedure
      .input(
        z.object({
          cartId: z.string().min(1),
          lines: z.array(cartLineInputSchema).min(1).max(50),
        })
      )
      .mutation(async ({ input }) => {
        return reconcileAddonFees(await addCartLines(input.cartId, input.lines.map(toCartLine)));
      }),
    updateLines: publicProcedure
      .input(
        z.object({
          cartId: z.string().min(1),
          lines: z.array(cartLineUpdateSchema).min(1).max(50),
        })
      )
      .mutation(async ({ input }) => {
        // qty 0 means "remove this line" — split the request so the client
        // never has to call two procedures for a single user gesture.
        const toRemove = input.lines.filter(l => l.quantity === 0).map(l => l.lineId);
        const toUpdate = input.lines.filter(l => l.quantity > 0);

        let cart = null;
        if (toUpdate.length) {
          cart = await updateCartLines(input.cartId, toUpdate);
        }
        if (toRemove.length) {
          cart = await removeCartLines(input.cartId, toRemove);
        }
        if (!cart) cart = await getCart(input.cartId);
        return reconcileAddonFees(cart);
      }),
    removeLines: publicProcedure
      .input(
        z.object({
          cartId: z.string().min(1),
          lineIds: z.array(z.string().min(1)).min(1).max(50),
        })
      )
      .mutation(async ({ input }) => {
        return reconcileAddonFees(await removeCartLines(input.cartId, input.lineIds));
      }),
  }),
});

export type CommerceRouter = typeof commerceRouter;
