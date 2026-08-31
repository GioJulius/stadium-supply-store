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
    body: "Message us on Instagram with your usual size and the kit you're after and we'll tell you exactly which one to take.",
  },
];

/**
 * Name-and-number printing is a real R50 line in the cart, not a free extra.
 * The handle is shared so the drawer can tell the fee apart from a garment and
 * render it as the derived charge it is.
 */
export const PRINTING_FEE_HANDLE = "name-number-printing";
export const PRINTING_FEE_LABEL = "+R50";
