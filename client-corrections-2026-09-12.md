# The client's second 11 September message — three listings

Three product urls, one instruction each, plus a repeat of the checkout ask.

> https://stadiumsupply.co.za/product/manchester-united-2024-25-third-jersey
> this needs to be 25/26 away
> https://stadiumsupply.co.za/product/2023-24-juventus-away-fan-version
> 26/27 season
> https://stadiumsupply.co.za/product/2023-24-juventus-home-fan-version
> 26/27 season

All three are **retitles only**. Each is already a `Fan Version` at the R500 fan
tier carrying the `Fan Version` tag, so nothing reclasses and no price moves.
Applied with `scripts/apply-client-corrections-0912.mjs` +
`scripts/client-corrections-0912.json`, which keeps the title-collision guard
from the 10/11 Sep batches: the POST-state of every title is built first and the
run is refused outright if any would still be duplicated.

Targets were confirmed on a contact sheet of the live lead images
(`.dupcheck/0912/juventus.png`, `mu.png`, gitignored), not by title match.

## Manchester United — the ninth listing of the 11 Sep rotation

`manchester-united-2024-25-third-jersey` → **2025/26 Manchester United Away Fan Version**

It is the same shirt as `2024-25-manchester-united-third-player-version` and
`-third-long-sleeve-fan-version`: white, navy adidas stripes, Snapdragon, lilac
geometric print. Those two moved to *2025/26 Manchester United Away …* on 11 Sep
as part of the eight-listing rotation; this one was not in that list and so kept
the old *2024/25 Third* name.

That family had **no short-sleeve fan version** — the slot was vacant — so the
move needs no parenthetical and creates no clash. The listing comes from the
Instagram lineage (`ig-post-014`, "Manchester United 2024/25 Third Jersey"), but
it is joining a supplied-batch family, so it takes that family's naming, the same
way `real-madrid-2024-25-third-jersey` did on 11 Sep.

The 26/27 Away (blue Snapdragon) and 26/27 Third (cream, no sponsor) are
different shirts and are untouched.

## Juventus away — the item left open on 11 Sep

`2023-24-juventus-away-fan-version` → **2026/27 Juventus Away Fan Version (Pink)**

This is the pink Jeep / "Visit Detroit" shirt. Its player version, long-sleeve
player version and kids kit were all moved to 2026/27 on 11 Sep and carry
**(Pink)**; this fourth piece was not in the owner's list and was flagged as
*still open* at the bottom of `client-corrections-2026-09-11b.md`. The client
has now answered it. The suffix is not needed for uniqueness — it is there so
the four pieces of one kit read together, and because the plain *2026/27
Juventus Away Player Version* is the **black** Visit Detroit shirt.

## Juventus home — the clash held back on 10 Sep, now settled

`2023-24-juventus-home-fan-version` → **2026/27 Juventus Home Fan Version (Wide Stripes)**

This was one of the three genuine clashes the 10 Sep applier caught and refused
to guess at. The contact sheet separates them cleanly:

| | stripes | sponsor |
|---|---|---|
| `2023-24-juventus-home-fan-version` (this one) | **wide** — four black bars, broad white centre panel | gold Jeep, **no** Visit Detroit |
| `2024-25-juventus-home-fan-version` (live *2026/27 Juventus Home Fan Version*) | narrow — six black bars | gold Jeep **+ Visit Detroit** beneath it |

Both are real shirts, so both keep a listing and the one being moved takes the
suffix — the same rule the 11 Sep batch used for AC Milan (Solid Stripes) and
Real Madrid (Green Collar).

Unrelated and untouched: `2026-27-juventus-home-fan-version`, which carries the
title *2025/26 Juventus Home Fan Version* and is the black-and-cream **hooped**
shirt, not a striped one at all.

## The checkout ask — already in force, nothing changed

> "emails need to be mandotory when checking out"

Email has been required since the 11 Sep change (Settings → Checkout →
*Customer contact method* = **Email**). Re-verified today against a real
checkout session on the live store:

- the Contact field is labelled **"Email"**, not "Email or mobile phone number"
- `<input name="email" type="email" required aria-required="true">`
- Phone, in Delivery, is also `required`

Screenshot: `.dupcheck/0912/checkout-contact.png`.

If the client is still reaching a checkout that lets email through, it will not
be this checkout — worth asking whether they mean an abandoned-cart or
draft-order link, or a saved page from before 11 Sep.

## Notes for the owner

- Juventus home: two striped shirts now both read *2026/27 Home Fan Version*,
  separated by the (Wide Stripes) suffix. Confirm the narrow-stripe Visit
  Detroit shirt keeps the plain name, or say which season it should move to.
- Manchester United: the 25/26 Away family now has fan, player, long-sleeve fan
  and long-sleeve player, but no kids kit. Say if one should be listed.
