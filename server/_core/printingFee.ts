import type { Cart } from "@shared/commerce/types";
import { addCartLines, getProductByHandle, removeCartLines, updateCartLines } from "./shopify";

/**
 * Name-and-number printing costs R50 per personalised shirt.
 *
 * Shopify's Storefront API has no notion of a surcharge on a line, so the fee
 * is its own product and rides in the cart as its own line. That keeps the 98
 * personalisable shirts on the variants they already have, and it reaches the
 * hosted checkout and the order where the merchant and the printer can both
 * see what was paid for.
 *
 * The fee line is never added by the client. Instead the server *reconciles*
 * it after every cart mutation: count how many personalised shirts the cart
 * holds and make the fee line's quantity match. Deriving it from the cart,
 * rather than adding and removing it alongside the shirt, is what makes it
 * impossible to be charged for printing on a shirt you have since removed —
 * the failure that a paired add/remove would eventually produce.
 */
export const PRINTING_FEE_HANDLE = "name-number-printing";

/** Resolved once per process; the variant id is stable and the lookup is a network round trip. */
let feeVariantIdPromise: Promise<string | null> | null = null;

export function resetPrintingFeeCache() {
  feeVariantIdPromise = null;
}

async function feeVariantId(): Promise<string | null> {
  if (!feeVariantIdPromise) {
    feeVariantIdPromise = getProductByHandle(PRINTING_FEE_HANDLE)
      .then(product => product.variants[0]?.id ?? null)
      .catch(error => {
        // A missing fee product must not take the whole cart down: the shopper
        // still gets their shirt, and the miss is loud in the logs.
        console.error("[printingFee] could not resolve the fee variant", error);
        feeVariantIdPromise = null;
        return null;
      });
  }
  return feeVariantIdPromise;
}

const isFeeLine = (item: Cart["items"][number]) => item.productHandle === PRINTING_FEE_HANDLE;

/** Shirts count toward the fee; the fee line itself never does. */
function chargeableQuantity(cart: Cart): number {
  return cart.items.reduce(
    (total, item) => (item.personalisation && !isFeeLine(item) ? total + item.quantity : total),
    0,
  );
}

/**
 * Brings the cart's printing-fee line in line with what it is carrying.
 * Returns the cart unchanged when nothing needs to move, so the common path
 * costs no extra Shopify call.
 *
 * Overloaded so a cart in gives a cart out: every Shopify cart mutation
 * returns a non-null cart, and only `getCart` on a stale id can be null, so
 * callers coming from a mutation should not have to null-check.
 */
export async function reconcilePrintingFee(cart: Cart): Promise<Cart>;
export async function reconcilePrintingFee(cart: Cart | null): Promise<Cart | null>;
export async function reconcilePrintingFee(cart: Cart | null): Promise<Cart | null> {
  if (!cart) return cart;

  const wanted = chargeableQuantity(cart);
  const existing = cart.items.find(isFeeLine);

  if (wanted === 0) {
    if (!existing) return cart;
    return removeCartLines(cart.id, [existing.lineId]);
  }

  const variantId = await feeVariantId();
  if (!variantId) return cart;

  if (!existing) return addCartLines(cart.id, [{ variantId, quantity: wanted }]);
  if (existing.quantity === wanted) return cart;
  return updateCartLines(cart.id, [{ lineId: existing.lineId, quantity: wanted }]);
}
