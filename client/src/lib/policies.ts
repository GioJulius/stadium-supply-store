/**
 * Returns, privacy and terms.
 *
 * A store cannot launch without these: payment providers ask for them, and in
 * South Africa the ECT Act and the CPA give buyers rights that a shop has to
 * state plainly. Everything here is built from what the client has actually
 * told us — the flat R100 courier rate, The Courier Guy, the Friday 12:00
 * weekly supplier batch, the 10–15 business day lead time, the R50 printing and badge add-ons —
 * and from the statutory positions those facts sit inside.
 *
 * Two deliberate silences. Nothing claims the kits are officially licensed
 * merchandise, because the catalogue cannot support that. Nothing mentions VAT,
 * because whether the client is registered is not ours to assume.
 *
 * THIS COPY NEEDS THE CLIENT'S SIGN-OFF BEFORE LAUNCH. It is an honest, careful
 * draft, not legal advice, and the refund turnaround in particular is a promise
 * only they can make.
 */

/** `link` renders under the paragraphs — used where a policy leans on another
 *  page, such as the size guide the returns terms now turn on. */
export type PolicySection = { heading: string; body: string[]; link?: { href: string; label: string } };

export type Policy = {
  slug: string;
  /** Shown in the header, split across two lines with the second emphasised. */
  eyebrow: string;
  titleTop: string;
  titleEm: string;
  intro: string;
  sections: PolicySection[];
};

const CONTACT_LINE =
  "The fastest way to reach us is WhatsApp on 068 830 7605. You can also email stadiumsupply@outlook.com or message us on Instagram or TikTok.";

export const RETURNS: Policy = {
  slug: "returns",
  eyebrow: "Returns",
  titleTop: "If it is not",
  titleEm: "right.",
  intro:
    "We order in one batch a week, so timing matters here more than at a shop that holds stock. This page says exactly when an order can still be stopped, where you stand on sizes, and what happens if a kit arrives faulty.",
  sections: [
    {
      heading: "Orders go to our supplier every Friday at 12:00",
      body: [
        "Everything ordered during the week is placed with our supplier in one batch on Friday at 12:00. Until that cut-off your order has not been bought yet, so message us and we will cancel it and refund you in full, no reason needed.",
        "After the cut-off the kit has been paid for and is on its way to us, and we cannot cancel it or pull it back out of the batch.",
      ],
    },
    {
      heading: "Sizes are chosen by you",
      body: [
        "We order exactly the size you select at checkout, so a kit that fits differently to how you hoped is not something we can exchange or refund. Our kits are cut to an Asian sizing standard and run about a size small — please read the size guide before you order, and message us if you are between sizes. We would far rather answer a question than send you the wrong fit.",
        "If you spot a mistake in your own order, tell us before Friday at 12:00 and we will change it.",
      ],
      link: { href: "/size-guide", label: "Read the size guide" },
    },
    {
      heading: "Faulty, damaged or not what you ordered",
      body: [
        "If a kit arrives faulty, damaged, or is simply not the item you ordered, that one is on us. Message us as soon as it arrives with clear photographs or a short video showing the problem, and we will replace it or refund you — whichever you would rather.",
        "Under section 56 of the Consumer Protection Act you have six months from delivery to return goods that turn out to be defective. Fair wear, damage from washing against the care label, and a kit that simply does not fit are not defects.",
      ],
    },
    {
      heading: "Your right to change your mind",
      body: [
        "South African law gives you one right we cannot sign away: under section 44 of the Electronic Communications and Transactions Act you may cancel an online purchase within 7 days of receiving it and send it back for a refund of what you paid for the goods.",
        "The kit has to come back unworn, unwashed and with its tags on, and the return delivery is at your cost when nothing is wrong with it. This is separate from the Friday cut-off above: the cut-off is about stopping an order before it is bought, this is about sending a delivered parcel back.",
      ],
    },
    {
      heading: "Printed and personalised kits",
      body: [
        "A shirt printed with your name, number or a competition badge is made to your instruction and cannot be resold, so it falls outside the change-of-mind right above. Please check your spelling and number carefully before you pay.",
        "This does not affect anything if the kit is faulty, or if we print something other than what you asked for — that is our error and we replace it.",
      ],
    },
    {
      heading: "How to start a return",
      body: [
        "Message us with your order number and, if something is damaged or wrong, a photo of the item as it arrived. Photos settle most cases in one message rather than several.",
        CONTACT_LINE,
      ],
    },
    {
      heading: "Getting your money back",
      body: [
        "Refunds go back to the method you paid with. Once we have approved a return we process the refund on our side promptly; how quickly it appears then depends on your bank or card issuer.",
        "The original R100 delivery charge is refunded too when the fault was ours.",
      ],
    },
  ],
};

export const PRIVACY: Policy = {
  slug: "privacy",
  eyebrow: "Privacy",
  titleTop: "What we know",
  titleEm: "about you.",
  intro:
    "We collect what an order needs and nothing beyond it. This page says what that is, where it goes, and how to get it back or removed.",
  sections: [
    {
      heading: "What we collect",
      body: [
        "Your name, delivery address, email address and phone number, so we can take your order and get the parcel to you. Alongside that we keep the order itself: the items, sizes, and any name, number or badge you asked us to print.",
        "We never see or store your card details. Payment is handled entirely by our payment provider on their own secure checkout.",
      ],
    },
    {
      heading: "Why we hold it",
      body: [
        "To take payment, place your order with our supplier, get the parcel couriered to you, and talk to you about that order. We also keep a record of completed sales because a business is required to.",
        "We do not sell your information, and we do not add you to a marketing list because you bought something.",
      ],
    },
    {
      heading: "Who else sees it",
      body: [
        "The Courier Guy receives your name, address and phone number, because a courier cannot deliver without them. Our payment provider receives what it needs to take the payment. Our store runs on Shopify, which processes order data on our behalf.",
        "That is the full list. Nobody else receives your details.",
      ],
    },
    {
      heading: "Your rights under POPIA",
      body: [
        "You may ask us what personal information we hold about you, ask us to correct it, or ask us to delete it. Message us and we will action it — we may need to keep the record of a completed sale itself where the law requires it.",
        CONTACT_LINE,
      ],
    },
    {
      heading: "Cookies",
      body: [
        "Your browser stores a small amount of data so your cart survives a page refresh and so the site remembers what you were looking at. That is what it is for.",
      ],
    },
  ],
};

export const TERMS: Policy = {
  slug: "terms",
  eyebrow: "Terms",
  titleTop: "The deal,",
  titleEm: "in plain words.",
  intro:
    "These are the terms you agree to when you order from Stadium Supply. We have kept them short and readable on purpose.",
  sections: [
    {
      heading: "Ordering",
      body: [
        "Placing an order is an offer to buy. The sale is confirmed once your payment has been received and we have sent you confirmation.",
        "If something you ordered turns out to be unavailable from our supplier, we will tell you and refund that item in full.",
      ],
    },
    {
      heading: "Prices and payment",
      body: [
        "All prices are in South African rand and are the amounts you pay for the goods. Delivery is a flat R100 anywhere in South Africa and is added at checkout.",
        "Adding a name and number is R50, and a competition badge is R50. Each is charged per shirt and shown as its own line in your cart before you pay.",
      ],
    },
    {
      heading: "How long it takes",
      body: [
        "We do not hold stock. Every piece is ordered from our supplier for you, in one batch placed every Friday at 12:00. Stock usually reaches us in 10 to 15 business days from that order, and your parcel goes out the same week it lands.",
        "Those timings are our honest expectation based on how the route normally runs, not a guarantee. International shipping and customs can move them. If your order is running late we will tell you rather than leave you guessing.",
      ],
    },
    {
      heading: "The kits themselves",
      body: [
        "We describe every kit as accurately as we can — the club, the season, and whether it is a fan version, a player version or a retro reissue. Colours can read slightly differently between a screen and daylight.",
        "Sizing follows our supplier's cut, which runs closer to the body than South African high-street sizing. Our size guide is there to help you choose, and we would rather answer a question before you order than process a return after.",
      ],
    },
    {
      heading: "Personalisation",
      body: [
        "Names, numbers and badges are printed exactly as you enter them, so the spelling and the number are yours to check. We cannot undo a print once it is done.",
      ],
    },
    {
      heading: "Returns",
      body: [
        "Your cancellation and refund rights are set out in full on our returns page, including the Friday cut-off, the 7-day cooling-off period and what happens if a kit arrives faulty.",
      ],
    },
    {
      heading: "Governing law",
      body: [
        "These terms are governed by the law of the Republic of South Africa. Nothing here takes away rights the Consumer Protection Act or the Electronic Communications and Transactions Act give you.",
        CONTACT_LINE,
      ],
    },
  ],
};

export const POLICIES: Policy[] = [RETURNS, PRIVACY, TERMS];
