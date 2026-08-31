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
 * Attribution is deliberately partial: buyers who tagged the shop publicly on
 * Instagram keep their handle, but WhatsApp customers appear by first name
 * only. Those names come from a private contact list, not from something the
 * person chose to publish, and a surname on a public page is not theirs to
 * give away. Spelling and phrasing are left exactly as written — the typos are
 * what make these read as real people rather than copywriting.
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

export const REVIEWS: Review[] = [
  {
    quote: "THANK YOU, THANK YOU, THANK YOU, I can't stress enough how thankful and grateful I am for this order, will definitely be ordering again soon",
    handle: "Logan",
    bought: "Manchester United training set",
    size: "tall",
  },
  {
    quote: "Thank you, absolutely love it, awesome quality",
    handle: "Karthy",
    bought: "Printed name and number",
  },
  {
    quote: "It came! Loving this jersey, cannot wait to show it off on a good day. Definitely ordering my retro united jerseys soon!",
    handle: "Brandon",
    bought: "PSG Neymar Jr 10",
    size: "wide",
  },
  {
    quote: "Thank you very much, I received my order, just know that I will be back to order something again. But once again I'm really happy with the texture of the jersey",
    handle: "Modiehi",
    bought: "PSG",
  },
  {
    quote: "I received the parcel and I'm happy with everything. Thank you for the excellent service, hoping from getting another one soon",
    handle: "Vinho",
  },
  {
    quote: "incredibly happy about my order! the quality of the t-shirts are amazing and im excited to wear this !!!",
    handle: "Verified buyer",
    bought: "Liverpool home",
    size: "tall",
  },
  {
    quote: "thank you very much sorry for doubting in you but I am very satisfied with my tracksuit",
    handle: "Ronald",
    bought: "Manchester United tracksuit",
  },
  {
    quote: "Thank you very much for the great customer service and im very happy with the quality",
    handle: "Verified buyer",
  },
  {
    quote: "Thnk u very much parcel has arrived and looking stunning many many thnxz",
    handle: "Verified buyer",
  },
  {
    quote: "I received my package. thank u so much. i am mostly satisfied and greatfull, will definitely order again",
    handle: "Verified buyer",
    size: "wide",
  },
  {
    quote: "Thank you so much. The order has arrived.",
    handle: "Soji",
  },
  {
    quote: "s/o @stadium.supply",
    handle: "@sedi.on.marz_",
    bought: "Manchester United and Real Madrid",
  },
];

/** Where a card points: its own story if known, otherwise the highlight. */
export function reviewHref(review: Review): string {
  return review.storyUrl ?? REVIEWS_URL;
}
