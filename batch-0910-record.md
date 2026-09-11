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
