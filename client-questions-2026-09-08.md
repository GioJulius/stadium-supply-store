# Questions for the client — 8 September 2026

Six things the catalogue cannot answer on its own, collected while applying the
7 September price list and building the category filters. Each one is a pricing
or naming decision that belongs to the client.

None of them is blocking. The store is selling; these are the loose ends.

The message below is written to be pasted into WhatsApp as it stands. The
reasoning behind each question follows, for whoever picks this up.

---

## Paste into WhatsApp

> Hi! A few quick questions so I can finish tidying the shop 👇
>
> **1.** The plain black adidas hooded full-zip tracksuit — is that R850 like the
> other plain full-zips, or R1 200 like a windbreaker tracksuit? It has a hood so
> I wasn't sure which one it counts as.
>
> **2.** In the shop there's "Tracksuit" (the club ones, R1 000) and "Plain
> Tracksuit" (the adidas/Nike ones, R700 and R850). They sit next to each other
> and look almost the same at a glance. Want me to rename one — maybe "Club
> Tracksuit" — so customers don't mix them up?
>
> **3.** Do you have measurements for the rugby jerseys? The size guide covers
> soccer fan, player and kids, but the 30 rugby items run S–5XL and have no chart
> at all, so people are guessing.
>
> **4.** "Stadium Supply Fan Jersey — Drop 20" is R650. That's your own brand and
> it isn't on any price list — is R650 right?
>
> **5.** The plain "Chiefs 2026/27 Home Jersey" — that's Kaizer Chiefs, not the
> rugby Chiefs? I've filed it under Kaizer Chiefs but wanted to check.
>
> **6.** About 830 items only have one photo, because they came through as one
> picture per item. If you ever send extra angles for the big sellers I'll add
> them — more photos sells more.

---

## Why each one is being asked

**1. The plain hooded windbreaker set.**
`adidas Black Hooded Full-Zip Tracksuit` is priced at R850, the plain full-zip
tier. The 7 September list has a "full windbreaker tracksuit" at R1 200, but
that line sits in the club section and this garment is unbranded. Both readings
are defensible, so it needs the client. Nothing else in the catalogue is
affected either way — it is one product.

**2. `Tracksuit` vs `Plain Tracksuit`.**
Genuinely different products at genuinely different tiers: club tracksuits at
R1 000, unbranded adidas/Nike at R700 half-zip and R850 full-zip. The names were
left alone during the 7 September taxonomy pass precisely because they are not
duplicates — but they are confusable on a product card, and renaming a category
the client sells is their call, not a de-duplication.

**3. Rugby measurements.**
`client/src/lib/sizeCharts.ts` holds transcribed supplier tables for fan, player
and kids only. Rugby sells S–5XL — a wider run than anything else in the store —
and has no chart, so the size guide is silent exactly where the sizing is least
familiar. This is the one question with a direct effect on returns.

**4. `Stadium Supply Fan Jersey — Drop 20`.**
R650, own-brand, covered by no price list the client has sent. It has been
carried unchanged through two repricing passes because there was nothing to
check it against.

**5. The two Chiefs.**
The store carries both `Chiefs Home Rugby Jersey` (Super Rugby, always says
rugby) and `Chiefs 2026/27 Home Jersey` (a fan-version football shirt from the
older import lineage, with nothing else identifying it). It has been filed as
Kaizer Chiefs — reasonable for a South African store that also stocks Orlando
Pirates, but inferred rather than read off the listing. If it is wrong it is one
line in `client/src/lib/teams.ts`.

**6. The single-photo listings.**
833 of 1 249. Not fixable with tooling: none of them carries a `supplier-<id>`
album tag, because they came from WhatsApp batches at one photograph per
garment. Only the client can close it, and it is worth framing as an upside for
the best sellers rather than a backlog of 833.
