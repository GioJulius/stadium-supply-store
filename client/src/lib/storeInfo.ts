/**
 * The two pieces of copy shoppers ask for before they'll commit: how a
 * pre-order shop actually works, and which size to pick.
 *
 * Stadium Supply holds no stock — every order is placed with the supplier once
 * payment clears — so the lead time is the single most important thing on the
 * site. Saying it plainly, up front and in the shopper's own terms is what
 * stops a 10–15 day wait turning into a "where is my order" message.
 */

export type ProcessStep = { number: string; title: string; body: string[] };

export const PROCESS_STEPS: ProcessStep[] = [
  {
    number: "01",
    title: "You order",
    body: [
      "Place your order any time. We don't keep stock on hand — every piece is ordered directly from our supplier for you.",
      "As soon as your payment lands, your order is confirmed and goes into the next supplier run.",
    ],
  },
  {
    number: "02",
    title: "We order",
    body: [
      "Your order is placed with the supplier within 24 hours of payment being received.",
      "From there it usually takes 10–15 business days to reach us, which covers international shipping and importation.",
    ],
  },
  {
    number: "03",
    title: "You receive",
    body: [
      "Once your order arrives, we check it, prepare it and ship it straight to your door.",
      "Your kit is then ready to go — from the stands to the streets.",
    ],
  },
];

export type SizeNote = { title: string; body: string };

export const SIZE_NOTES: SizeNote[] = [
  {
    title: "General fit",
    body: "Retro shirts and modern replicas are cut for an Asian sizing standard, so they run about one size small. Order one size up from what you'd normally wear.",
  },
  {
    title: "Player version",
    body: "A tight, performance cut — the same spec the squad wears. Size up once for a slim fit, or twice if you want room or you're between sizes.",
  },
  {
    title: "Fan version",
    body: "A slimmer regular fit. Size up once if you'd rather wear it loose over a hoodie or a long sleeve.",
  },
  {
    title: "Kids kits",
    body: "Kids sets are sized by age on the label and run true to that age. If your child is tall for their age, take the next size up.",
  },
  {
    title: "Still unsure?",
    body: "Message us on WhatsApp with your usual size and the kit you're after and we'll tell you exactly which one to take. You can also see the kits on and moving on our TikTok.",
  },
];

/**
 * Name-and-number printing is a real R50 line in the cart, not a free extra.
 * The handle is shared so the drawer can tell the fee apart from a garment and
 * render it as the derived charge it is.
 */
export const PRINTING_FEE_HANDLE = "name-number-printing";
export const PRINTING_FEE_LABEL = "+R50";
export const BADGE_FEE_HANDLE = "competition-badge";

/**
 * Cart-line attribute keys, mirroring `server/_core/shopifyNormalize.ts` the
 * same way BADGE_FEE_HANDLE mirrors the reconciler's copy. Read-only here: the
 * client renders what the server wrote, it never sets these itself.
 */
export const BADGE_KEY = "Badge";
export const BADGE_CHOICE_KEY = "Badge type";

/**
 * The competition badges the client can actually source. "Other" stays on the
 * list because the supplier stocks more than this and a shopper who knows what
 * they want should not be turned away by a dropdown that has not heard of it.
 */
export const BADGE_OPTIONS = [
  "Premier League",
  "UEFA Champions League",
  "UEFA Europa League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
  "FIFA Club World Cup",
  "Other",
] as const;
export const BADGE_FEE_LABEL = "+R50";

/**
 * The same two fees as numbers, so the product page can show a running total
 * in the add-to-bag button.
 *
 * These are for DISPLAY ONLY and they are a mirror, not a source: the charge
 * that is actually taken comes from the Shopify add-on products that
 * `server/_core/addonFees.ts` reconciles against the cart. If the client
 * reprices either extra in Shopify, the cart will be right and these two
 * numbers will be stale — so change them here too, and never compute a total
 * the shopper pays from them.
 */
export const PRINTING_FEE_AMOUNT = 50;
export const BADGE_FEE_AMOUNT = 50;

/**
 * Where the shop actually talks to people. WhatsApp is the channel the client
 * runs on — the number is the one published in their own Instagram bio — so
 * it is what we point shoppers at when they need a person rather than a page.
 */
export const WHATSAPP_URL = "https://wa.me/27688307605";
export const INSTAGRAM_URL = "https://www.instagram.com/stadium.supply/";
/** Their largest audience — 16.4K followers, ahead of Instagram. */
export const TIKTOK_URL = "https://www.tiktok.com/@stadium_supply";
/** Published on the TikTok profile, for people who would rather write than chat. */
export const EMAIL_ADDRESS = "stadiumsupply@outlook.com";
/** The shop's "reviews" story highlight — real buyers, in their own words. */
export const REVIEWS_URL = "https://www.instagram.com/stories/highlights/17856584361642350/";


/**
 * Shipping, in the terms the client gave: one flat courier rate to the door,
 * on top of the 10-15 business day import wait the process page explains.
 * Saying the number plainly is what stops "how much is delivery" arriving in
 * the WhatsApp inbox all day.
 */
export const SHIPPING_RATE = "R100";
export const SHIPPING_NOTES: SizeNote[] = [
  {
    title: "What it costs",
    body: "A flat R100 to your door, anywhere in South Africa. You will see it added at checkout — there is nothing else to pay on delivery.",
  },
  {
    title: "Who delivers",
    body: "Every order ships with The Courier Guy, door to door, with tracking sent to you once your parcel is collected.",
  },
  {
    title: "How long it takes",
    body: "We order from our supplier within 24 hours of your payment. Stock usually reaches us in 10-15 business days, then your parcel goes out the same week it lands.",
  },
  {
    title: "Where we ship",
    body: "South Africa only for now. If you are outside the country, message us on WhatsApp and we will quote you.",
  },
];
