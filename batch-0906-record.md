# Batch 2026-09-06 — import record

The client's WhatsApp export of the morning of **6 September 2026**: 36
photographs sent between 09:10 and 09:12, delivered as
`stadium supply media/WhatsApp Unknown 2026-09-06 at 9.13.50 PM.zip`.

Two clubs that were **new to the store**, and an unbranded tracksuit range that
is held rather than listed.

Tagged `supplied-batch-2026-09-06`. Pipeline mirrors the 0905 batch:
`stage-0906.py` → `align-0906.mjs` → team files by eye → `apply-0906-names.mjs`
→ `import-batch-0906.mjs` → `npm run seo`.

| Team | Photos | Garments | Created | Status |
|------|--------|----------|---------|--------|
| Leeds United | 8 | 7 | 7 | imported |
| Ajax | 10 | 10 | 10 | imported |
| Unbranded tracksuits | 18 | — | 0 | **held** |
| **Total** | **36** | **17** | **17** | |

Store total: **1 239 products**, 1 231 with a prerendered page, sitemap at
1 241 urls. Both clubs had zero products before this, so nothing could be a
duplicate and no dedupe pass was needed.

## The crest beats the clock

`p16` is stamped **09:11:40**, in the middle of Ajax's run, and the caption
alignment duly handed it to Ajax. It carries the **LEEDS UNITED AFC** crest, and
it is the same kids kit as `p5` at dHash distance 0 — sent a second time.

The 09:11 `kids set` album therefore holds **one Leeds kit and one Ajax kit**,
which no cumulative alignment can express: an album is assumed to belong to one
team. `captions.tsv` carries an extra pair of team markers to say so, and Leeds'
block reads `p1–p16` with a hole in the middle.

This is the fourth ordering failure in two batches (Newcastle 23:30, Brighton
22:09, and now this). The rule that keeps coming out on top: **read the crest,
then the clock.**

`p32` and `p33` are also the same file — the red and navy Nike tracksuit, sent
twice.

## What went live

**Leeds United — 7 products.** Red Bull has been the shirt sponsor since 2024/25
and adidas the maker since 2020, which is as far as the modern shirts can be
dated. Only the white home is safe to name by season; the yellow, blue and
pinstriped shirts carry a colour instead. The Strongbow retro is Nike-era,
roughly 1998–2000.

**Ajax — 10 products.** Ziggo dates the modern shirts, ABN AMRO the retros. The
client's `retro` album holds the two ABN AMRO shirts *and* the two Bob Marley
Three Little Birds thirds, which are 2021/22 and 2023/24 — they are priced at the
retro tier because that is the album they arrived in. **Flag it if the client
meant otherwise.**

## Held: 18 unbranded tracksuits

The 09:12 albums — six half-zip sets and twelve full-zip tracksuits — carry **no
club crest at all**. They are plain adidas and Nike training wear, which is what
the client's 09:11 text `Tracksuits :` was introducing. Two answers are needed
before they can be listed:

1. **What are they sold as?** Every other product on the store belongs to a club.
   These belong to none, so they need a collection, a naming convention and a
   place in the shop's filters.
2. **What do the full zips cost?** The client's tier table has jacket **R1 000**
   and training set **R600** with nothing between — the same gap that has left
   five full-zip sets unpriced since the 4 September batch. That is now
   seventeen garments waiting on one answer.

They are recorded in `scripts/batch-0906/teams/03-unbranded-tracksuits.json`
under `heldBack`, so the photographs stay accounted for and nothing is lost.
