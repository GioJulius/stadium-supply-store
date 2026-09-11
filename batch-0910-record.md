# Batch 2026-09-10 — record

Sources: `stadium supply media/Stadium Supply.zip` (`chat.txt`, the full chat
text export — authoritative for captions, order and per-second timestamps) and
`stadium supply media/WhatsApp Unknown 2026-09-11 at 10.18.23 AM.zip`
(30 photographs).

## What the client sent on 10 September

| When | What | Photographs |
|---|---|---|
| 21:55 | "yes there's a few but it's just small technical working and season mistakes will send it through" | — |
| **22:12:42 – 22:13:14** | **55 corrections** — screenshots of live product cards, one caption each | not exported |
| **22:18:44 – 22:18:47** | **8 corrections** — Manchester United | not exported |
| 22:31:53, 22:35:20 | 2 corrections — "2026" | not exported |
| **23:00:55** | Plain tracksuits: "half zip R850 . Full zip R1000" | not exported |
| **23:07:01 – 23:07:04** | **8 corrections** — national sides | not exported |
| 23:07:29 | "Please add these items" | — |
| **23:10:46 – 23:10:58** | **New products** — 5 album messages + 25 singles | **30 (the zip)** |
| 23:11:25 | "If all of these are sorted with the payment then we are definitely all done." | — |
| 23:15:23 | "please add these as well" — replying to their own **4 September** `All south african jerseys` message | — |

**74 correction messages in total**, and one price change.

## Correction to an earlier reading of this chat

An earlier pass through WhatsApp Web scrolled past a date divider and read the
`Brazil` block (16:47–16:51) and the `All south african jerseys` / `germany` /
`All spain` blocks (20:20–20:42) as belonging to 10 September. **They are from
4 September**, and `chat.txt` proves it: the export covers 9 Sep 07:18 through
11 Sep 09:42 continuously and contains no such messages on the 10th.

Those batches were imported at the time. Live today: **Brazil 48, Germany 24,
Spain 19** listings.

## The one real photograph gap

The 23:15 "please add these as well" points at the 4 September 20:20 block.
That night's download (`WhatsApp Unknown 2026-09-04 at 8.44.55 PM.zip`, 60
files) **starts at 20:21 and misses 20:20 entirely** — the `retro`, `kids set`
and `fan versions` messages under `All south african jerseys`.

It shows: South African **football** is three listings today —
`south-africa-1998-home-retro-jersey-bafana` (which is the 20:21 Kappa retro,
so that one did land), `south-africa-2024-25-home-jersey-safa` and
`south-africa-2024-25-gk-jersey-kappa-kombat`. No Bafana fan version, no kids
kit. The nine Springboks rugby listings are a separate, complete set.

**What to ask the owner for: the Stadium Supply chat, 4 September 20:15–20:22.**
A handful of photographs, not a hundred.

## The 23:10 batch (in hand)

Extracted to `import/batch-0910-raw/` as `p1`–`p30`, ordered by filename
timestamp then duplicate suffix (`_files.json`). Contact sheets in
`.dupcheck/0910/` (gitignored), built by `scripts/contact-sheets-0910.py`.

Identified by eye, not by the clock:

| Keys | Garment | Caption | Tier |
|---|---|---|---|
| p1–p9 | **F1 racing jackets** — Ferrari red/black-white, Ferrari red, BMW Petronas navy, Ferrari white, Ferrari black, Ferrari pink, BMW Petronas black, Porsche, Red Bull Infiniti | `F1 jackets R1300` | **R1 300** |
| p10, p11, p17 | PSG retro (navy/burgundy Fly Emirates; p17 long sleeve) | `psg retro` | R700 / LS R800 |
| p12, p13 | PSG pre-match / training shirts (white "PARIS"; white Qatar Airways Jordan) | `psg training kit 2025` | check photo before pricing |
| p14 | Man United red windbreaker tracksuit | `man united windbreaker tracksuit` | R1 200 |
| p15, p16 | Barcelona maroon tracksuit | `barcelona tracksuit` | R1 000 |
| p18 | Liverpool red/black paisley half-zip set | `half zip liverpool` | R850 |
| p19 | Liverpool teal/black full-zip set | `full zip liverpool` | R1 000 |
| p20 | Liverpool black/cream adidas full-zip set | `full zip liverpool` | R1 000 |
| p21 | Arsenal red retro-style full-zip set | `full zip arsenal` | R1 000 |
| p22 | PSG blue/red full-zip set | `full zip psg` | R1 000 |
| p23 | PSG navy/white full-zip set | `full zip windbreaker psg` | R1 200 |
| p24 | Real Madrid navy/grey windbreaker tracksuit | `full zip windbreaker tracksuit real madrid` | R1 200 |
| p25 | PSG blue windbreaker jacket (no bottoms) | `psg windbreaker jacket` | jacket |
| p26 | PSG black Jordan tracksuit | `psg windbreaker tracksuit full zip` | R1 200 |
| p27 | Man City grey/black windbreaker jacket | `man city windbreaker jacket` | jacket |
| p28 | PSG black/orange half-zip set | `psg half zip` | R850 |
| p29 | Springboks green "Pick n Pay" | `springboks 2026 home kit` | R700, S–5XL |
| p30 | Springboks green/gold FNB | `springboks 2026 home kit` | R700, S–5XL |

Five PSG zip garments (p22, p23, p25, p26, p28) against five PSG zip captions —
the caption-to-photo mapping within that run is by garment, not by clock.

**`F1 jackets R1300` is four marques, not nine Ferraris**: Ferrari ×5, BMW
Petronas ×2, Porsche ×1, Red Bull ×1. The existing F1 outerwear tier (seven
listings from 1 Sep) stays at R1 200 — owner's decision, 11 Sep.

---

## Imported 11 September 2026 — 25 listings, one existing listing updated

`scripts/import-batch-0910.mjs --apply`, reading `scripts/batch-0910/batch.json`
and `scripts/batch-0910/garments.json`. Tagged `supplied-batch-2026-09-10`.
Catalogue 1 249 → 1 273 active.

### Three corrections to the table above

**30 photographs are 26 garments, not 30.** Four albums are one garment shot
twice, and the table above read each photograph as its own product:

- `p12` + `p13` — the *back* (arched PARIS) and the *front* (Qatar Airways,
  Jumpman) of one shirt.
- `p10` + `p11` — the same short-sleeve retro on a rail and on a hanger. `p17`
  is the long-sleeve and IS a second listing.
- `p15` + `p16` — a close-up of the Barcelona jacket, and the full set.
- `p29` + `p30` — the back (Pick n Pay) and front (FNB) of one Springboks shirt.

**The five PSG zip captions map to the garments by FABRIC, not by clock order.**
The table above gave `p22` "full zip psg" and `p23` "full zip windbreaker psg".
It is the other way round: `p22` is a woven shell (R1 200) and `p23` a knit
anthem jacket (R1 000). R200 a listing, and the photograph is the only thing
that says which.

**`p18` really is a half-zip.** At sheet size its placket reads as a full-length
zip like `p20` and `p21` beside it. Cropped in, the zip stops mid-chest — the
client's `half zip liverpool` caption was right and the R850 tier holds.

### The one garment that was already listed

`p29`/`p30` is the live `South Africa Springboks Home Rugby Jersey` — same gold
V-collar with the white pinstripe, same gold sleeve panels, same FNB roundel,
the same *2026 Tour Edition* line above it, and the same white wall and wooden
hanger in the photograph. It carried **one** picture and no back view, so both
photographs were appended to it and it was retitled
**South Africa 2026 Springboks Home Rugby Jersey** from the client's own
`springboks 2026 home kit` caption; it had no season at all before. It is *not*
the live `South Africa 2025/26 Springboks Home Rugby Jersey`, which has a
serrated gold collar trim and plain green sleeves.

Nothing else in the batch was a duplicate. Every garment was checked by eye
against sheets of the live **lead** photographs for its team
(`.dupcheck/0910/live-*.jpg`, built by `.dupcheck/0910/live-sheet.py`), never by
title match. The two that came closest and are still different garments:
`p19` against `Liverpool Originals Track Jacket (teal)` — that one is plain
teal, a jacket on its own, with no chevrons — and `p21` against
`Arsenal Red and Navy Originals Track Jacket`, which has navy sleeves and the
Emirates wordmark.

### Where the titles came from

Season and product name were researched only where the garment is a real,
datable kit. Where it is a generic replica tracksuit, the catalogue's own
colour-descriptive convention is used rather than inventing a season.

- **`p10`/`p11`/`p17` are 2017/18, not 2016/17.** Navy body, *dark burgundy
  raglan sleeves*, a thin red centre stripe and Fly Emirates in white is the
  2017/18 home shirt. The 2016/17 has sleeves in a darker shade of the same
  blue and a broad stripe of fourteen red pinstripes.
- **`p12`/`p13` is the Jordan Night Edition pre-match top**, 2025/26 — medium
  grey, tonal armour-like graphic of circular and geometric forms, black ribbed
  collar, Qatar Airways in black, arched PARIS across the upper back. Sold
  without shorts, so it takes the R500 standalone pre-match price.
- **`p18` is the Shankly Gates graphic** — the Anfield gates, red on black,
  from Liverpool's 2025/26 adidas range.
- **`p19`, `p20`, `p21` are adidas Originals**, trefoil and the older crests,
  not the current performance range.
- **The nine F1 jackets are four marques.** Ferrari ×5, **BMW Sauber** ×2
  (Petronas, Credit Suisse, M Power — the team raced 2006-2009), **Porsche**
  Motorsport ×1 and **Infiniti Red Bull Racing** ×1 (Infiniti was title partner
  2013-2015). `bmw-sauber` and `porsche` were added to
  `client/src/lib/teams.ts`, or those three listings resolve to no team and drop
  out of the team filter. Porsche is sports-car racing and is tagged
  `Formula 1` anyway, because the client sells it inside the F1 jacket message
  and the sport facet has nowhere else to put one motorsport listing; its
  description says what it actually is.

### Prices

The client's caption `F1 jackets R1300` sets a **new tier above** the R1 200 F1
jacket line on the 7 September price list. The seven existing F1 outerwear
listings stay at R1 200 (owner, 11 Sep) — these nine are vintage embroidered
bombers, a different garment from the modern team-issue softshells. Everything
else follows the 7 September list: retro R700 / LS R800, pre-match R500,
half-zip set R850, full-zip tracksuit or jacket-only R1 000, full windbreaker
tracksuit R1 200, rugby jersey R700 at S–5XL.
