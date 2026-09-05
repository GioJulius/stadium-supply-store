# The client's WhatsApp feedback of 5 Sep 2026 — what was fixed

Five things, four of them data and one of them code. All applied.
Script: `scripts/fix-client-feedback-0905.mjs` (idempotent, `--apply` to run).

## 1. "There's no option here as well for name and number"

On `2026/27 FC Barcelona Away Jersey Player Version`. **Code, not data.**

`isPersonalisable()` in `client/src/lib/catalog.ts` was asking how a listing was
*worded* rather than what the garment *is*: it required the words "fan version"
and explicitly refused "player version". So the printing panel was hidden on
every player-spec shirt — and, less obviously, on every listing titled plainly
as a "Jersey" with neither word in it (`Manchester City 2025/26 Away Jersey`).

Now: any shirt takes a name and number. Retros are still withheld — they are
reproductions of one season's printing — and so is anything that is not a shirt.
**234 listings offered printing before; 324 do now.**

**One thing to check with the client:** a handful of listings are sold with a
name already on them — `Doué 14`, `Neymar Jr 10`, `Müller 13`, `Bellingham 5`.
They now offer printing too. If those should be excluded, say so and it is a
one-line change.

## 2. "Lots of issues like these, where we can't see the first picture"

Audited **every** multi-photo listing on the store — 393 of them, by eye, not by
heuristic. Eighteen led on something that is not the garment: a hangtag, a size
chart, or a fabric close-up.

- **Nine** already had a whole-garment photograph further down the gallery. The
  gallery was reordered. No upload.
- **Five** had no garment photograph at all — every image was a tag or a
  close-up. They are all Netherlands and Italy listings, and the missing shot
  was sitting in the 4 Sep batch, held back as a duplicate. Those photographs
  are now their lead image.
- **Two** were the storefront's own doing, see below.

**`2025/26 AC Milan Away Player Version` is the weakest of the nine.** Its whole
gallery is close-ups; the best available is a three-quarter crop. It needs a
photograph rather than a reorder.

### Two listings the code was breaking

`orderGalleryImages()` in `server/_core/shopifyNormalize.ts` moves the
supplier's `_01` image to the end of every gallery, because `_01` is the size
chart. I checked that assumption against all 122 supplier galleries on the
store: it holds for the overwhelming majority, but not for
`2025/26 Galatasaray Third Fan Version` and
`2026 World Cup Netherlands Away Kids Kit`, where `_01` is the garment and the
rule was burying the only good photograph. Those two now carry a copy of that
photograph under a filename the rule leaves alone. **The rule itself was left
alone** — loosening it would move ~70 other leads that are currently fine.

(Size charts turn out to be reliably non-square — 1.54:1 or 3.76:1 — where
garment photos are square. If this comes up again, that is the discriminator.)

## 3. "Can the first picture be the jacket with the pants"

`2026/27 Real Madrid Training Jacket Set` led on the jacket alone and
`2025/26 Real Madrid Marvel White Half-Zip Training Set` on the top alone. Both
galleries already held a shot of the full set; both now lead on it. The same
applied to `2026 Italy Half-Zip Training Set` and
`2026 World Cup Netherlands Half-Zip Training Set`, which had the same problem.

## 4. "We also don't sell women jerseys all jerseys are unisex"

Five listings came off a supplier women's album. Three had already been retitled;
the remaining two said **Women's** in the title and now do not:

- `2026/27 Real Madrid Third Women's Shirt` → `2026/27 Real Madrid Third Shirt`
- `2026/27 Real Madrid Away Women's Shirt` → `2026/27 Real Madrid Away Shirt`

They were **not** delisted. All five are already sold on the unisex size run,
and for their kits there is no other listing on the store — deleting them would
remove the kit. Their URL still contains `womens`; changing a handle breaks any
link already shared, so it was left.

## 5. "This isn't a retro it's a half zip"

Correct — the photograph shows a quarter-zip collar and a pair of pants.

`Real Madrid 2013/14 Third Retro Long Sleeve + Pants`
→ **`Real Madrid Retro Half-Zip Training Set (white and purple)`**, product type
`Half-Zip Training Set`, retagged off `Soccer Retro`, with a description that
matches the garment.

**Its price was left at R800.** Every other half-zip set on the store is R850.
Moving it is the client's call, not ours — one word and it changes.

## Also fixed while in here

`2025/26 AC Milan Away Player version1` — the only title on the store carrying
an import artefact — is now `2025/26 AC Milan Away Player Version`.

## Still needs the client

**Six listings have no whole-garment photograph anywhere in their gallery.**
Nothing on our side can fix these; the supplier only ever sent detail shots:

- `2025/26 Manchester United Chinese Knot Kids Kit`
- `2025/26 Manchester United Chinese Knot Long Sleeve Fan Version`
- `2025/26 Real Madrid Chinese Knot Kids Kit`
- `2025/26 Real Madrid Chinese Knot Long Sleeve Fan Version`
- `2026/27 FC Barcelona Away Kids Kit`
- `2026 World Cup Germany Jacket Set`

**Three garments from the 4 Sep batch were wrongly held as duplicates.** Putting
the batch photographs beside the live listings to fix the lead images showed
that `p85`, `p86` and `p93` are *not* the Italy listings they were matched to —
the training set and the half-zip set are the reverse colourway (white body with
green sleeves, against the live green body with white sleeves), and `p93` has no
polo collar where the live 2012 retro does. They are three more Italy products
waiting to be listed. `p94` is worth re-checking on the same basis.

Related: `batch-0904c-wave2-record.md`, `unlisted-audit-2026-09-05.md`.
