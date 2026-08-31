import { REVIEWS_URL } from "./storeInfo";

/**
 * Real customer reviews, transcribed from the shop's Instagram "reviews"
 * highlight.
 *
 * These are deliberately hand-entered rather than scraped: the highlight is
 * login-gated, so nothing can read it automatically, and a review is the one
 * thing on a shop that must never be invented. An empty list here renders an
 * honest empty state rather than filler — better a page that says "read them
 * on Instagram" than one that shows testimonials nobody wrote.
 *
 * To add one: copy the buyer's words verbatim, use the handle exactly as it
 * appears, and set `storyUrl` to that specific story if you have its link so
 * the card opens the review it quotes; otherwise it falls back to the
 * highlight. `size` only controls how much room the card takes in the grid.
 */
export type Review = {
  /** The buyer's own words, verbatim. Never paraphrase or improve them. */
  quote: string;
  /** Instagram handle, including the @. */
  handle: string;
  /** What they bought, if the story says. Shown as context under the name. */
  bought?: string;
  /** Link to the exact story; omit to fall back to the highlight. */
  storyUrl?: string;
  size?: "wide" | "tall" | "normal";
};

export const REVIEWS: Review[] = [];

/** Where a card points: its own story if known, otherwise the highlight. */
export function reviewHref(review: Review): string {
  return review.storyUrl ?? REVIEWS_URL;
}
