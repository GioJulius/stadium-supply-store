import type { Cart } from "@shared/commerce/types";
import { addCartLines, getProductByHandle, removeCartLines, updateCartLines } from "./shopify";
import { PERSONALISATION_NAME_KEY, PERSONALISATION_NUMBER_KEY, BADGE_KEY } from "./shopifyNormalize";

/**
 * The client's paid extras: R50 for a name and number, R50 for a competition
 * badge, per shirt.
 *
 * Shopify's Storefront API has no notion of a surcharge on a line, so each
 * add-on is its own product riding in the cart as its own line. That keeps the
 * shirts on the variants they already have, and it reaches the hosted checkout
 * and the order where the merchant and the printer can both see what was paid
 * for.
 *
 * The client never adds these lines. The server *reconciles* them after every
 * cart mutation: count how many shirts asked for each extra and make that
 * line's quantity match. Deriving them from the cart, rather than adding and
 * removing them alongside the shirt, is what makes it impossible to be charged
 * for printing on a shirt you have since removed.
 */
export const PRINTING_FEE_HANDLE = "name-number-printing";
export const BADGE_FEE_HANDLE = "competition-badge";

type Addon = {
  handle: string;
  /** True when this cart line asked for the extra. */
  wants: (item: Cart["items"][number]) => boolean;
};

const ADDONS: Addon[] = [
  { handle: PRINTING_FEE_HANDLE, wants: item => Boolean(item.personalisation) },
  { handle: BADGE_FEE_HANDLE, wants: item => item.attributes?.[BADGE_KEY] === "Yes" },
];

const ADDON_HANDLES = new Set(ADDONS.map(a => a.handle));

/** Resolved once per process; the variant ids are stable and the lookup is a round trip. */
const variantIds = new Map<string, Promise<string | null>>();

export function resetAddonCache() {
  variantIds.clear();
}

async function feeVariantId(handle: string): Promise<string | null> {
  if (!variantIds.has(handle)) {
    variantIds.set(
      handle,
      getProductByHandle(handle)
        .then(product => product.variants[0]?.id ?? null)
        .catch(error => {
          // A missing add-on product must not take the whole cart down: the
          // shopper still gets their shirt, and the miss is loud in the logs.
          console.error(`[addonFees] could not resolve ${handle}`, error);
          variantIds.delete(handle);
          return null;
        }),
    );
  }
  return variantIds.get(handle)!;
}

/**
 * Brings every add-on line in step with what the cart is carrying. Returns the
 * cart untouched when nothing needs to move, so the common path costs no extra
 * Shopify call.
 *
 * Overloaded so a cart in gives a cart out: every Shopify cart mutation returns
 * a non-null cart, and only `getCart` on a stale id can be null.
 */
export async function reconcileAddonFees(cart: Cart): Promise<Cart>;
export async function reconcileAddonFees(cart: Cart | null): Promise<Cart | null>;
export async function reconcileAddonFees(cart: Cart | null): Promise<Cart | null> {
  let current = cart;
  for (const addon of ADDONS) {
    if (!current) return current;
    current = await reconcileOne(current, addon);
  }
  return current;
}

async function reconcileOne(cart: Cart, addon: Addon): Promise<Cart> {
  // A fee line never counts towards another fee.
  const wanted = cart.items.reduce(
    (total, item) => (!ADDON_HANDLES.has(item.productHandle) && addon.wants(item) ? total + item.quantity : total),
    0,
  );
  const existing = cart.items.find(item => item.productHandle === addon.handle);

  if (wanted === 0) {
    if (!existing) return cart;
    return removeCartLines(cart.id, [existing.lineId]);
  }

  const variantId = await feeVariantId(addon.handle);
  if (!variantId) return cart;

  if (!existing) return addCartLines(cart.id, [{ variantId, quantity: wanted }]);
  if (existing.quantity === wanted) return cart;
  return updateCartLines(cart.id, [{ lineId: existing.lineId, quantity: wanted }]);
}
