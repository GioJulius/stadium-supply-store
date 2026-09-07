/**
 * Which garments can be printed with a name and number, and carry a badge.
 *
 * This lives in `shared/` because BOTH sides have to agree and neither can be
 * trusted alone. The storefront asks so it knows whether to offer the option;
 * the server asks because the answer is worth R50 — `reconcileAddonFees` adds a
 * paid fee line for any cart line that claims personalisation, so a request that
 * claims it on a retro shirt or a pair of shorts would have been charged for
 * printing that cannot be done. It was client-side only until 8 Sep 2026, and
 * two offline scripts had already grown their own copies of these rules.
 *
 * The shape is structural rather than `Product` so the server can pass what a
 * variant lookup returns without building a whole product.
 */
export type PrintableFacts = {
  title: string;
  productType: string | null;
  tags: string[];
};

/**
 * Not a shirt: tracksuits, jackets, hoodies, polos, and shorts sold on their
 * own. Kids kits DO print — the set includes a shirt.
 */
const NON_SHIRT =
  /hood|sweatshirt|crewneck|jacket|windbreaker|tracksuit|training|half-zip|half zip|polo|pants|t-shirt|tee|anthem|presentation|track top/i;

/**
 * Retro shirts are reproductions of a specific season's printing, so they are
 * still sold as they come.
 */
const NOT_PRINTABLE = /\bretro\b/i;

/**
 * Shorts on their own cannot take a name and number, but a kit or a set that
 * includes shorts can, because the shirt in it prints like any other. Two plain
 * tests rather than one lookahead regex, because the intent is the point.
 */
function isShortsOnly(haystack: string): boolean {
  return /shorts/i.test(haystack) && !/\b(kit|set)\b/i.test(haystack);
}

/**
 * Any listing that is a shirt takes a name and number, unless it is a retro.
 *
 * The test is what the garment IS. An earlier version asked how the listing was
 * WORDED — it required the words "fan version" and explicitly refused "player
 * version" — which hid the option on every player-spec shirt and on every
 * listing titled plainly as a "Jersey". The client raised the player versions on
 * 5 Sep 2026: the shirt prints the same way whichever spec it is.
 *
 * Matching runs over the title, productType and tags together, because the
 * catalogue expresses the same fact in all three depending on which import
 * lineage a listing came from.
 */
export function isPersonalisable(product: PrintableFacts): boolean {
  const haystack = [product.title, product.productType ?? "", ...product.tags].join(" ");
  if (NON_SHIRT.test(haystack)) return false;
  if (isShortsOnly(haystack)) return false;
  if (NOT_PRINTABLE.test(haystack)) return false;
  return true;
}
