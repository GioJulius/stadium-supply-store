# Batch 2026-09-05 — import record

The client's WhatsApp export of the night of **5 September 2026**: 664 photographs
sent between 19:19 and 23:41 covering **18 team blocks**, roughly 650 distinct
garments — about the size of the whole store before it.

Captions were read off WhatsApp Web on 6 Sep 2026 and aligned cumulatively by
`scripts/align-0905.mjs`; all 664 photographs are bound to a caption and a team
with **zero drift across 101 albums**. The per-team records live in
`scripts/batch-0905/teams/<NN>-<slug>.json` and those files ARE the manifest.

Pipeline per team: write the team file by eye off contact sheets →
`node scripts/apply-0905-names.mjs --team "<Team>" --apply` →
`node scripts/import-batch-0905.mjs --team "<Team>" --apply` → `npm run seo`.

Everything is tagged `supplied-batch-2026-09-05`.

## Progress — COMPLETE

All 18 teams imported 6 September 2026. **664 photographs → 642 garments → 560
products created**, 82 filed as already on the website, 9 of the 560 flagged for
review.

| # | Team | Photos | Garments | Created | Already listed |
|---|------|--------|----------|---------|----------------|
| 1 | Real Madrid | 76 | 75 | 61 | 14 |
| 2 | AC Milan | 45 | 45 | 40 | 5 |
| 3 | Juventus | 20 | 20 | 19 | 1 |
| 4 | Club Brugge | 2 | 1 | 0 | 1 |
| 5 | Sao Paulo | 4 | 4 | 4 | 0 |
| 6 | Galatasaray | 3 | 3 | 3 | 0 |
| 7 | Inter Miami | 16 | 16 | 15 | 1 |
| 8 | PSG | 67 | 65 | 58 | 7 |
| 9 | FC Barcelona | 100 | 95 | 83 | 12 |
| 10 | Manchester City | 44 | 44 | 42 | 2 |
| 11 | Nottingham Forest | 6 | 6 | 5 | 1 |
| 12 | Crystal Palace | 5 | 5 | 2 | 3 |
| 13 | Brighton & Hove Albion | 7 | 7 | 4 | 3 |
| 14 | Aston Villa | 11 | 11 | 2 | 9 |
| 15 | Tottenham Hotspur | 32 | 31 | 29 | 2 |
| 16 | Arsenal | 68 | 66 | 59 | 7 |
| 17 | Newcastle United | 18 | 18 | 18 | 0 |
| 18 | Manchester United | 140 | 130 | 116 | 14 |
| | **TOTAL** | **664** | **642** | **560** | **82** |

Store total: **1 222 products**, up from 662 before this batch. 560 carry
`supplied-batch-2026-09-05` and every one of them has a featured image. 1 214 get
a prerendered product page; the sitemap carries 1 223 urls.

### What the batch taught

1. **The hash is a bonus, not the dedupe.** `dedupe-0905.py` found nothing at all
   for PSG, Arsenal, Newcastle, Nottingham Forest, Galatasaray and Sao Paulo, and
   only a fraction elsewhere. It works when the client resends the *supplier's*
   photograph (Aston Villa: 7 of 11) and fails whenever the client photographs a
   garment we shot ourselves. **Every team needs a contact sheet of its live
   listings read by eye**; that is where 30 of the 82 matches came from.
2. **The club gate has a substring hole.** `milan` as an alias for AC Milan puts
   the whole *Inter* Milan catalogue inside its gate, which produced one
   confident false positive.
3. **Within-minute album order is reconstructed, not read** — and it was wrong
   twice: Newcastle's 23:30 block and the Brighton album that landed under
   Crystal Palace. A drift check cannot see a reordering inside one minute. The
   cheap tells: kids sets are the only photographs with **shorts**, half-zip sets
   the only ones with **bottoms**, and the crest settles the team.
4. **The client repeats photographs across albums.** Four blocks carried the same
   file twice (Manchester United, Arsenal, Tottenham, and the Manchester United
   fan/kids pair). Run the within-block hash before writing a team file.
5. **Size-chart leads are catalogue-wide, not incidental.** Ten live listings
   across four teams led on a size chart or a fabric close-up with the garment
   sitting at index 1 or 2. All ten were promoted. Nothing in the importer
   prevents it, so **the whole catalogue is worth one sweep**.
6. **The supplier sells blank shirts.** Juventus, Nottingham Forest and Crystal
   Palace all arrived with sponsorless versions of a sponsored kit; they are
   titled by colour so they cannot collide with the sponsored listing.

### Still open

- `2025-26-nottingham-forest-fc-away-fan-version` is ACTIVE with **zero images**
  and duplicates the 8-image Bally's away. Needs deleting or merging.
- The `retro half zip` albums (Real Madrid, AC Milan) are priced at R1 000 on the
  client's own "retro training top R1000" line. If they meant the R850 half-zip
  tier, eleven listings are R150 over.
- Nine listings went in as `uncertain` and are printed by the importer's REVIEW
  block: four Manchester United, four FC Barcelona-adjacent calls and the Arsenal
  half-zip set.
- Two live titles look wrong: `Manchester United 1998/99 Third Retro (Sharp)`
  shows the 1993/95 VIEWCAM shirt and `Manchester United 1994/96 Home Retro`
  shows the 1996/98 kit.

## Manchester United (6 Sep 2026)

140 photographs (p525–p664) over fourteen albums → **130 garments**: 116 created,
14 filed as already on the website, 4 of the 116 flagged for review.

**The 23:40 tail fixed the batch's one loose photograph.** The alignment had left
`p664` unassigned. The four tail captions were fan version / full zip / half zip /
training vest set against five files; by eye **p660 and p661 are both fan-version
shirts**, so that album holds 2 photographs, not 1. `captions.tsv` was corrected
and the re-run assigns all 664 with nothing left over and drift unchanged at zero.
An album of 2 or 3 has no `+N` overlay to decode, which is exactly where the size
read off the chat is least reliable — check those against the garments.

**Five garments carry more than one photograph**, the rest are one photo one
garment:

- 2011 Champions League final pre-match shirt — `p537` and `p572` are the same
  shirt shot twice, sixteen tiles apart in the same retro album.
- Purple full-zip tracksuit — `p584` (grey backdrop) and `p585` (white).
- Blue floral originals player shirt — `p657` plus the `p658` close-up.
- The three retro training tops, each sent as front, back and a composite. They
  are ordered **front first** so the shop grid does not lead on the back of the
  garment.

`p634` (fan album) and `p644` (kids album) are the identical file at dHash
distance 0; both are claimed by the 2025/26 home kids kit.

**Dedupe.** Five hits came from `dedupe-0905.py` (p543, p586, p637, p646, p650)
and nine more by eye against a contact sheet of all 27 live Manchester United
listings — hashing does not catch our own listing photographed differently.
Four went in as `uncertain`, created and flagged:

- **1994/96 Home Retro** — the live 1994/96 listing shows a *white*-collared Umbro
  Sharp shirt, which is the 1996/98 kit; `p566` has the black collar of the real
  1994/96. Either that title is wrong or these are two shirts.
- **Red Tezos Half-Zip Training Set** — the live listing is the same top sold on
  its own; this one comes with the matching bottoms.
- **Red and Orange Home Fan Version** — the store already carries two 2025/26 home
  listings; this shirt has orange side panels neither of them shows.
- **2026/27 Away Fan Version** — the live `Manchester United Away 26/27` is a
  legacy single-size R1350 entry with one folded photograph; this is the same kit
  listed properly at R500, S–4XL.

**Two live titles look wrong and were left alone:**
`Manchester United 1998/99 Third Retro Jersey (Sharp)` shows the black SHARP
VIEWCAM shirt, which is 1993/95, and `Manchester United 1994/96 Home Retro Jersey
(Sharp)` shows the 1996/98 white-collared kit.

**Seasons** were read off the sponsor and manufacturer: SHARP to 2000, Vodafone
2000–2006, AIG 2006–2010, AON 2010–2014, Chevrolet 2014–2021, TeamViewer
2021–2024, Snapdragon 2024 onward. Where that does not pin a year the title
carries no season and the garment is marked `seasonConfidence: unknown` (nine of
them — the AIG goalkeeper and away shirts, the navy third pair, the two Vodafone
retro training tops and the red-and-orange home shirt).

## FC Barcelona (6 Sep 2026)

100 photographs (p234–p333) over nine albums → **95 garments**: 83 created, 12
filed as already on the website, none flagged uncertain.

**Six garments carry more than one photograph.** `p299` is the front and `p302`
the back of the red anthem jacket; `p303`/`p304` are the same grey tech-fleece
tracksuit on two backdrops; `p317` is a close-up of the embroidery on `p318`;
`p273`/`p286` are the mint third shirt with the Spotify roundel and with the
wordmark; `p277`/`p281` are the same zigzag shirt, one shot carrying cup badges
on the sleeve. Fronts and full-garment shots lead in every case.

**Dedupe: eight by hash, four by eye.** The eye caught the 2016/17 purple away
(`p269`), the 2024/25 black away (`p284`), the 2025/26 graded home (`p292`) and
the 2026/27 purple away *player* shirt (`p333`) — all four already on the store
under a different photograph, which is precisely what a hash cannot see. Note
that `p275` is the **fan** version of that same 2026/27 away and went in as new.

**Sponsor pins the era** on the retros: Kappa to 1997, unicef 2006–2011, Qatar
Foundation 2011–2013, Qatar Airways 2013–2017, Rakuten 2017–2022, Spotify 2022
onward. Inside the Spotify years the goalkeeper shirts, pre-match shirts and
special editions cannot be dated from the garment, so 26 titles carry a colour
instead of a season and are marked `seasonConfidence: unknown`.

Live-catalogue note for the client: the store's `2025/26 Third Jersey` is the
**turquoise gradient** shirt. The turquoise *halved* shirts in this batch
(`p285`, `p315`, `p327`, `p328`) are a different kit and are titled by colour.

## PSG (6 Sep 2026)

67 photographs (p167–p233) over eight albums → **65 garments**: 58 created, 7
filed as already on the website.

**`dedupe-0905.py` found nothing at all for PSG** — every one of the client's
photographs of this team is a different file from the ones already uploaded. All
seven matches were made by eye against a contact sheet of the 11 live Paris
Saint-Germain listings. A zero-hit hash report means *look harder*, never *all
new*.

**Two live listings carry stale handles.** Both are titled `2018/19 Fourth Retro
Jersey — Neymar 10 (Jordan)` while their handles read
`paris-saint-germain-2023-24-away-jersey-neymar-10` and
`…-2023-24-home-jersey-jordan`. They were retitled and the handles never
followed, so a match has to be made on the **photograph**, not the handle.

**Tier split where the live title has no tier.** Where the batch holds the same
kit in both cuts and the live listing does not say which it is, the closer
photograph was filed as listed and the other cut created with its tier in the
title — the 2024/25 fourth pinstripe (fan filed, player created) and the 2024/25
fourth camo (player filed, fan created).

**Two garments carry two photographs**: `p220`/`p221` are the same 2025/26 home
fan shirt, and `p183` (jacket album) and `p223` (fan album) are the same navy
Fly Emirates retro sweatshirt sent twice in different albums.

**Sponsor pins the era**: OPEL to 2002, THOMSON 2002–06, Fly Emirates 2006–19,
ALL Accor 2019–22, Qatar Airways 2022 onward. Inside the Qatar Airways years the
training tops, wing-print shirts and one-off colourways cannot be dated, so 17
titles carry a colour instead of a season.

## Arsenal (6 Sep 2026)

68 photographs (p439–p506) over nine albums → **66 garments**: 59 created, 7
filed as already on the website, 1 flagged.

**Arsenal was the most duplicated team so far** — six of the fourteen
fan-version photographs were already on the store (2025/26 home, home long
sleeve, away, away long sleeve, 2024/25 home, 2026/27 away), plus the blue
training hoodie. `dedupe-0905.py` again found **none** of them; every match came
by eye off a contact sheet of the 15 live Arsenal listings. That is now three
teams running where the hash contributed nothing.

**`p461` and `p463` are the same file** at dHash distance 0 — the client sent
the blue training hoodie twice inside one album. `p501` is a collar close-up of
the floral embroidered away shirt in `p500`.

**Tier split.** The live Arsenal listings carry no tier in their titles and their
photographs are the fan cut, so the fan photograph was filed as listed and the
matching player-album shirt created with Player Version in the title.

**Flagged:** the white and red half-zip set. The live `2024/25 Half-Zip Training
Top` is the same design sold on its own and with **navy** sleeves; this one has
black sleeves and comes with the bottoms.

**Sponsor and maker pin the retros**: JVC to 1999, Dreamcast 1999–2002, O2
2002–06, Emirates 2006 onward; Nike 1994–2014, Puma 2014–19, adidas 2019 onward.

## Manchester City (6 Sep 2026)

44 photographs (p334–p377) over seven albums → **44 garments**: 42 created, 2
filed as already on the website. One photograph per garment throughout — nothing
to group, the first team in this batch where that held.

Only four City products were live before this batch and the hash matched none of
them. Two matched by eye — the 2025/26 home and the 2025/26 away — both filed
against their **fan** photograph, with the player-album shirts of the same kits
created as Player Versions.

**Not a duplicate:** the live `2026/27 Goalkeeper Jersey` is bright teal with a
honeycomb print. The green keeper shirts here (`p356`, `p369`) are dark forest
green with a different print, so both went in as new.

**The client's own tier split, kept as sent:** `p362` is the 2013/14 Nike home
shirt but arrived inside the *player version* album, so it is priced at the
player tier and titled Player Version. The same kit also appears in the retro
album as `p342` at the retro tier. That is the client's split, not a mistake —
do not merge them.

**Sponsor and maker pin the retros**: Brother to 1999, EIDOS 1999–2002, Thomas
Cook 2007–09, Etihad 2009 onward; Kappa to 2003, Umbro 2009–13, Nike 2013–19,
Puma 2019 onward. The Asahi training wear, keeper shirts and print specials
cannot be dated, so 17 titles carry a colour instead.

## AC Milan (6 Sep 2026)

45 photographs (p77–p121) over eight albums → **45 garments**: 40 created, 5
filed as already on the website. One photograph per garment throughout.

### The club gate has a false-positive hole — `milan`

`dedupe-0905.py` matched `p119` to **Inter Milan** 2025/26 Third at distance 3.
`batch.json` lists `milan` as an alias for AC Milan, and `milan` is a substring
of every *Inter* Milan title, so the entire Inter catalogue sits inside AC
Milan's club gate. `p119` carries the AC Milan crest and went in as new. **Check
any AC Milan hash hit that names an Inter listing by eye before believing it.**

Four hash hits were genuine (`p92`, `p98`, `p110`, `p115`), plus `p104` by eye.
Three near-misses stayed new: `p96` is the white bwin away *with* the Athens 2007
final embroidery, which the live 2009/10 away does not carry; `p111` is an adidas
bwin track jacket, not the live Puma windbreaker; `p113` is grey camo, not the
live green half-zip set.

### Six live listings were leading on a size chart — fixed

Six of the nine live AC Milan listings had a **size chart** as their first image,
with the real garment photographs sitting at index 1 or 2 in galleries of 8–9.
That is the client's standing "we can't see the first picture" complaint,
unnoticed by the 5 Sep audit. All six were promoted:

    node scripts/promote-lead-image.mjs --picks scripts/lead-image-picks-0906.json --apply

`promote-lead-image.mjs` now takes `--picks <file>`. The picks are **positional
and therefore not idempotent** — after a run the indexes below the promoted image
have shifted — so every pass gets its own dated file and old files are never
re-run. `2025-26-ac-milan-half-zip-training-set` and the away player version were
already leading on the garment and were left alone.

The other teams in this batch are worth the same check; a size-chart lead comes
from the supplier's own gallery order and nothing in the importer prevents it.

**Retro half-zip pricing.** The `retro half zip` album is priced at the
`retroTop` tier (R1 000), the same call already made for Real Madrid's identical
album. If the client meant the ordinary R850 half-zip tier, six listings here are
R150 over.

**Sponsor pins the era**: OPEL to 2006, bwin 2006–10, Fly Emirates 2010 onward;
Lotto to 1998, adidas 1998–2018, Puma 2018 onward.

## Tottenham Hotspur (6 Sep 2026)

32 photographs (p407–p438) over seven albums → **31 garments**: 29 created, 2
filed as already on the website. Only two Spurs products were live before this.

**`p428` and `p437` are the same file** at dHash distance 0 — the navy BETMGM
training set, sent once in the training-set album and again inside the player
album. That is the third team in this batch where the client repeated a
photograph across albums (Manchester United `p634`/`p644`, Arsenal
`p461`/`p463`), so it is worth running the within-block hash on every team
before writing the file.

**Judge white shirts at full resolution.** `p438` matched the live 2026/27 home
player version by eye — the same tonal-chevron shirt, on a mannequin here and a
hanger there. `p433` looks like the same shirt in a contact-sheet thumbnail but
has navy and grey shoulder panels: it is the 2025/26 home and went in as new.

**Another size-chart lead**, same fault as AC Milan: the live 2024/25 player
version led on the chart with the garment at index 1. Promoted via
`scripts/lead-image-picks-0906b.json`.

**Sponsor pins the era**: HOLSTEN to 1995, MANSION 2006–10, AIA 2010 onward;
Umbro to 2006, Puma 2006–12, Under Armour 2012–17, Nike 2017 onward.

## Newcastle United (6 Sep 2026)

18 photographs (p507–p524) → **18 garments, all 18 created**. The store carried
**no** Newcastle products at all before this, so nothing could be a duplicate.

### The 23:30 albums were harvested in the wrong order

The chat gave `player(4), kids(3), retro(3), windbreaker(1)`. The photographs say
`retro(3), windbreaker(1), player(4), kids(3)` — the same multiset of sizes, a
different order, which is why the alignment still reported zero drift while
handing three kids kits to "retro".

**The tell is the shorts.** A kids set is the only album whose photographs show a
shirt *and* shorts, and the only three such photographs in the block are
`p515`–`p517`. Everything else followed from that.

All four messages share the minute **23:30**, and within-minute order is the one
thing the harvester *reconstructs* (smallest `offsetTop`) rather than reads — so
it is exactly where this fails. `captions.tsv` was reordered and
`align-0905.mjs` re-run: still 664 assigned, zero drift, nothing left over.
**Any minute carrying several albums is worth an eye check before writing the
team file.**

**Sponsor dates every garment here precisely**: Newcastle Brown Ale to 2000,
northern rock 2003–12, Sela 2023–26, **KNOX Hydrate from 2026/27**. No title
needed a colour fallback — the first team in this batch where that held.

## Juventus (6 Sep 2026)

20 photographs (p122–p141) over four albums → **20 garments**: 19 created, 1
filed as already on the website.

**Album order checked, and correct this time.** Three of the four albums share
the minute 20:14, which is the Newcastle failure mode, so the order was verified
before writing: the only two photographs carrying shorts are `p132`/`p133`,
exactly where the kids album sits, and the two hoodies and six mannequin shots
follow as the chat gives them.

**`VISIT DETROIT` dates the striped shirts.** Jeep has sponsored Juventus since
2012, but the wordmark gained the *Visit Detroit* line in 2024/25 — which is the
only thing separating three otherwise identical black-and-white striped shirts
here. `p126` carries plain gold Jeep (2023/24); `p131` and `p137` carry Jeep
Visit Detroit (2024/25).

**Blank shirts.** `p123` and `p125` are the hooped 2026/27 shirt **without a
sponsor** — the supplier sells a blank version alongside the sponsored one. They
are titled by colour rather than season so they do not collide with the sponsored
2026/27 home listing.

The one match was by eye: `p124` is the live 2025/26 home, the striped shirt with
the **pink** shoulder trim. Its player cut (`p137`) went in as new.

## Inter Miami (6 Sep 2026)

16 photographs (p151–p166) over five albums → **16 garments**: 15 created, 1
filed as already on the website.

**Inter Miami takes calendar years, not split seasons.** It is an MLS club and
the store's existing listing is `Inter Miami 2025 Home Jersey`, so the titles
here follow that — 2025 and 2026 for the first-team kits. The light blue third
is the exception: the live kids listing calls it 2025/26, so the third shirts
keep that form.

Three albums share the minute 20:52 and the order checks out — the half-zip
photograph is the only one with bottoms, the kids photographs the only ones with
shorts.

One match, by eye: `p158` is the live 2025 home. Its player cut (`p152`) went in
as new, the same tier split used for PSG, Arsenal and Manchester City. The live
Polkadot away long sleeve is not in this batch, and the live light blue kids kit
is a different garment from the three kids kits here.

**A third size-chart lead** — the live 2025/26 Third Kids Kit — promoted via
`scripts/lead-image-picks-0906c.json`. Three teams in a row now; the sweep is
worth running across the whole catalogue rather than team by team.

## Nottingham Forest (6 Sep 2026)

6 photographs (p378–p383) over two albums → **6 garments**: 5 created, 1 filed as
already on the website (`p383`, the white Bally's away, matched by eye — the hash
found nothing again).

**An empty listing worth deleting.** `2025-26-nottingham-forest-fc-away-fan-version`
is **ACTIVE with zero images** and is the same white Bally's away as the 8-image
listing sitting beside it. It renders as an empty card in the shop grid. It wants
deleting or merging, not another photograph — **flagged for the client**, not
touched here.

`p379` carries no sponsor at all — the supplier's blank pre-match version of the
red home shirt — so it is titled by colour, the same treatment given to the blank
Juventus hooped shirts.
