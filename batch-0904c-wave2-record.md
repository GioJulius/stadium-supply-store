# Wave two of the 4 Sep 2026 10.04 PM batch — what was imported

Answer to `unlisted-audit-2026-09-05.md`, which found "about 93 garments" the
client had sent and the store had never listed. **87 went live on 5 Sep 2026**,
tagged `supplied-batch-2026-09-04c-w2`. The rest are held for a reason, listed
at the bottom.

Manifest `scripts/batch-0904c-wave2-manifest.json`, importer
`scripts/import-batch-0904c-wave2.mjs`, photographs staged by
`scripts/stage-0904c.py` into `import/batch-0904c` (gitignored).

| Team | Photos | Listed | Already live | Held |
| --- | ---: | ---: | ---: | ---: |
| Portugal | 29 | 25 | 1 | 2 |
| Argentina | 29 | 25 | 2 | 2 |
| England | 26 | 24 | 1 | 0 |
| Italy | 14 | 6 | 8 | 0 |
| Netherlands | 17 | 7 | 7 | 3 |
| **Total** | **115** | **87** | **19** | **7** |

Two photographs are second views of a garment already in the list (the Portugal
anthem jacket front and back, and the England 2007/09 long sleeve shot twice),
which is why 89 photographs carry 87 listings.

## Where this differs from the audit's count of 90

The audit was a count of photographs from a reading pass. Three corrections came
out of putting the contact sheets and the live catalogue side by side:

- **England is 24, not 25.** `p66` and `p68` are the same Umbro 2007/09 home
  long sleeve photographed twice, not two garments. They are one listing with
  two photographs.
- **Argentina is 25, not 24.** The audit read two of the four black filigree
  shirts as duplicates of the listing filed as `Argentina 2010 Away Retro Jersey
  (filigree)`. Only one is: that listing carries an embroidered crest and a
  short sleeve, so it is the fan version, and `p55` duplicates it. `p57` is the
  player spec — black ribbed collar, slimmer cut — and the store does not have
  it. That listing is also **mislabelled**: its own photographs show a current
  adidas Originals shirt with a FIFA 2022 badge, not a 2010 retro.
- **Italy's away pair is the other way round.** The audit had `p90` as the
  already-live away fan and `p91` as the new second spec. A dHash of every batch
  photograph against all 327 images on the live listings found `p91` **is** the
  photograph on `2026 Italy Away Fan Version` (distance 7). So `p90` is the new
  one, listed as the player version.

That hash pass also confirmed four other exact photo reuses — `p87`, `p103`,
`p107`, `p115` — which is what settled the Netherlands block.

## Fan versus player was read off the label, not guessed

Every current-range shirt in this batch arrives as a near-identical pair. The
discriminator that worked on all of them, at full resolution:

- **Puma** — `DRYCELL` neck label and an embroidered crest is fan; `ULTRAWEAVE`
  with a dropped hem is player. That is how the Portugal red home split.
- **Nike** — an embroidered crest with a mesh sleeve panel is fan; a flat
  heat-pressed crest with a `DRI-FIT ADV` inner label is player. That is how the
  England 2013 home and the Netherlands orange home split.

The pairs are otherwise identical in a thumbnail, and each call is R150 on the
listing, so this is worth redoing the same way on the next batch.

## Held back, and why

**Five full-zip tracksuits — no price.** Argentina `p40`/`p41` and Italy `p101`
carry the caption `full zip`, and Portugal `p11` (navy Puma) and `p12` (black
KING) are jacket-and-pants sets with no caption at all. The client's tier table
has a jacket at R1 000 and a training set at R600 and nothing between them.
Wave one held the first three for this reason; holding all five keeps the
catalogue consistent. **This is a one-line answer from the client.**

**Two 1988 chevron shirts — already on the store under another name.**
Netherlands `p112` (orange home) and `p115` (light blue away). The audit read
them as adult versions of a kit the store carries only as kids kits — but `p115`
is the *same photograph* as `1988 Netherlands Away Retro Kids Kit` (dHash 5), so
listing it again would read as a duplicate rather than as a new size range. Ask
whether they stock the 1988 chevrons in adult sizes.

Both open questions from the audit's own list are still open: the `all germany`
caption sitting in the middle of the Netherlands photographs, with no Germany
garment anywhere in the export.

## Two flagged assumptions

1. **Portugal `p9` and `p10`** — the Puma white dotted-wave away and the Puma
   red home — are listed as retros at R700. With Portugal's captions past
   WhatsApp's history floor there is no client word on them; the Puma-era
   styling reads retro, but they could be a current-range kit.
2. **Portugal's fan/player split on `p22`–`p29`** is read from the fabric and
   the neck label rather than from the client. The label evidence is good, but
   it is a reading, not a caption.

## Still to do after this

- **Append the 19 duplicate photographs to the listings they match.** They are
  extra views the store does not have, and eight Netherlands listings currently
  lead on a size chart or a hangtag rather than the garment — the audit found
  that separately and it is still true.
- `npm run seo` and commit the refreshed `scripts/seo-snapshot.json`, or
  production SEO goes stale for all 87.

Related: `unlisted-audit-2026-09-05.md`, `batch-0904c-research.md`.
