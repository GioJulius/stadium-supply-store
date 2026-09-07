# Price list — 7 September 2026 (AUTHORITATIVE)

Sent by the client on 7 Sep 2026. This is the first list that covers every
category the store sells, and it **supersedes** the 27 August list and every
one-off price given in a WhatsApp caption since.

## Soccer

| Item | Price | Sizes |
|---|---|---|
| Fan version | R500 | S–4XL |
| Player version | R650 | S–2XL |
| Retro / vintage | R700 | S–2XL |

### Customisation

| Item | Price |
|---|---|
| Badge | R50 |
| Name and number | R50 |
| Long sleeve, if available | R100 |

Long sleeve is an **add-on, not a tier**: fan LS R600, player LS R750, retro LS
R800. That is how the store already prices them.

## Outerwear and tracksuits — S to 2XL

| Item | Price |
|---|---|
| Soccer hoodie | R850 |
| Half-zip training tracksuit | R850 |
| Full-zip tracksuit | R1 000 |
| Windbreaker jacket, or jacket only | R1 000 |
| Chinese jacket | R1 200 |
| Full windbreaker tracksuit | R1 200 |

## Plain adidas / Nike — S to 2XL

| Item | Price |
|---|---|
| Training top and shorts | R600 |
| Plain tracksuit — half zip | R700 |
| Plain tracksuit — full zip | R850 |

**These are not the club prices.** A plain half-zip is R700 against R850 for a
club one, and a plain full-zip R850 against R1 000. The difference is the badge.

## Sets and kids

| Item | Price | Sizes |
|---|---|---|
| Adults set — training top and shorts, or vest and shorts | R700 | S–2XL |
| Kiddies set | R450 | 2–3, 4–5, 6–7, 8–9, 10–11 |

## Rugby

| Item | Price | Sizes |
|---|---|---|
| Rugby jersey, adults | R700 | S–5XL |
| Rugby jersey, kids | R550 | same as soccer kids |

## F1

| Item | Price | Sizes |
|---|---|---|
| F1 jersey | R650 | S–2XL |
| F1 jacket | R1 200 | S–2XL |

---

## What this list settled, and what it changed on the store

Applied 7 Sep 2026 by `scripts/apply-price-list-0907.mjs` — **76 products
repriced**.

**1. An adults club training or vest set is R700, not R600 (52 products).**
The 27 August list carried both "training top and shorts R600" and "adults sets
top and shorts training R700" and never resolved which applied; every batch since
has gone in at R600. The new list resolves it by separating the two: **R600 is
the plain adidas/Nike set**, R700 is the club one.

**2. There is no R1 000 half-zip (13 products).**
The thirteen retro training tops were priced from the client's one-off "retro
training top R1000" caption on 5 September. The new list has no such line — a
half-zip training tracksuit is R850 — so they came down to R850. **If the client
did mean R1 000 for retro training tops specifically, this is the one line to put
back.**

**3. Smaller corrections (11 products).** Five sweatshirts at R950 → R850 (a
sweatshirt is already long-sleeved, so the R100 long-sleeve add-on should never
have been applied); two fan shirts at R450/R550 → R500; one retro at R500 → R700;
a half-zip mistyped as a training set at R600 → R850.

**F1 was left alone.** Its outerwear sits at R1 200 as a tier of its own, set by
the client in the 1 September batch, and the new list does not contradict it.

## Settled later on 7 Sep, on the evidence of the photographs

Applied by `scripts/apply-price-corrections-0907b.mjs`. Three named products,
each identified by eye — not a rule. The next vest may well come with shorts.

- **The two rugby training vests are R700** (`Ireland Rugby Training Vest`,
  `New Zealand All Blacks Training Vest`). Both photographs show a vest on its
  own, no shorts, so neither the R700 vest-and-shorts set nor anything else on
  the list covered them. Their R600 was inherited from the rule this list
  replaced — a vest set used to be R600 — so it had stopped standing for
  anything. Owner's call: price them as adult rugby, the same flat R700 as a
  rugby jersey, which is also the tier their S–5XL run belongs to.

- **`Liverpool 2025/26 Training Jersey` is R500**, down from R600. The
  photograph is a short-sleeve green adidas pre-match shirt sold on its own, and
  **R600 is the long-sleeve fan price** — it matched nothing. Eleven standalone
  pre-match and training shirts in the catalogue are now R500, among them
  Liverpool's own `Pre-Match Shirt (Black Check)`. It survived the main
  repricing because it predates it: it still carries the pre-August lineage's
  `Size S-XL` and `Stadium Supply` tags.

  Its `productType` is still `Soccer Fan Version` where the other ten say
  `Fan Version`. That duplication is catalogue-wide and left alone here — it is
  a taxonomy job, and it will matter when the navigation filters are built.

## Still open

- **`Manchester United Away 26/27`** — a legacy single-size listing at R1 350
  that duplicates the proper fan version. It wants deleting, not repricing.
- **`Stadium Supply Fan Jersey — Drop 20`** at R650 — an own-brand item the list
  does not cover.
- **The plain hooded windbreaker set** (`adidas Black Hooded Full-Zip Tracksuit`)
  is listed at the plain full-zip R850. The list prices a full windbreaker
  tracksuit at R1 200, but that line sits in the club section.
