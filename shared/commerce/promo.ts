/**
 * The "2 for" deal the client asked for on 23 Nov 2026: any two fan versions
 * for R900, any two player versions for R1 200 — R100 off each pair, until the
 * end of Monday 30 Nov.
 *
 * The money is NOT applied here. Two automatic Buy-X-get-Y discounts in Shopify
 * admin do that ("2 Fan Versions for R900", "2 Player Versions for R1200"),
 * keyed to the smart collections `promo-fan-versions` / `promo-player-versions`
 * (product type equals "Fan Version" / "Player Version"), with the same end
 * date. This file only decides when the site TALKS about the deal, so the copy
 * disappears on its own at the same moment the discount stops.
 *
 * Shopify's end time is 30 Nov 23:59 SAST (GMT+2) = 21:59 UTC.
 */
export const PAIR_DEAL_ENDS = Date.parse("2026-11-30T21:59:59Z");

export const PAIR_DEALS = {
  "Fan Version": { label: "fan versions", pairPrice: "R900" },
  "Player Version": { label: "player versions", pairPrice: "R1 200" },
} as const;

export function pairDealLive(now: number = Date.now()): boolean {
  return now <= PAIR_DEAL_ENDS;
}

/** The deal a product qualifies for, by the same product type the Shopify collections use. */
export function pairDealFor(productType: string | null | undefined, now: number = Date.now()) {
  if (!pairDealLive(now) || !productType) return null;
  return PAIR_DEALS[productType as keyof typeof PAIR_DEALS] ?? null;
}
