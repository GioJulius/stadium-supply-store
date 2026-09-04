# Stadium Supply — where the build stands, and what closes it out

Written 4 Sep 2026, from the WhatsApp thread of 2–4 Sep and the 306 images the
client sent over those three days.

## What the client actually asked for

Three things, in their words:

1. **Every team, every product.** "the liverpool section is sorted but only
   that … from each team there's things missing and more teams … from the
   beginning i told you i need all the teams we sell and products loaded up."
2. **More than one photograph per listing.** "not having 1 image alone, more
   then 1 to show quality like you did the first time not with the ones of
   yesterday." A single photo reads as unfinished to them.
3. **No gaps in the range.** They sell everything on their supplier's site
   except the cropped jersey vest, the reversible jackets and soccer shorts sold
   on their own — "we sell everything else". Their reason: without the full
   range, buyers keep having to ask "do you have this", which is the exact
   labour the website is meant to remove. Roughly 60 lines per team, across fan
   version, player version, short and long sleeve, kids sets, training
   tracksuits, windbreaker jackets and retros.

Deadline they set: **before Monday 7 Sep**. "send as much as you can and we will
try and get it done before monday."

## What arrived

306 files in the 4 Sep export:

| Batch | Date | Photos | Status |
| --- | --- | --- | --- |
| Inter Milan | 2 Sep, 6:24–6:37 PM | 76 | imported 2 Sep (34 listings) |
| Liverpool top-up | 2 Sep, 6:42 PM | 5 | imported 2 Sep |
| Bayern Munich | 3 Sep, 11:31 AM | 70 | imported 4 Sep — 34 listings, live |
| France | 4 Sep, 2:28–2:30 PM | 47 | imported 4 Sep — 32 listings, live |
| Brazil | 4 Sep, 4:47–4:51 PM | 76 | imported 4 Sep — 44 listings, live |
| Supplier-site captures | 4 Sep | 32 (.webp) | PSG and Manchester United, held as reference |

The client captioned each message with the garment type — retro, retro long
sleeve, fan version, fan version long sleeve, player version, player long
sleeve, goalkeeper, kids set, training set, half zip, hoodie, windbreaker, vests
set — which is what the price tier is read from.

## Done in this pass

- **110 new listings** across Bayern Munich, France and Brazil, taking the
  catalogue from 324 to 434 products. Identification, grouping and pricing are
  recorded in `scripts/team-batches-manifest.json`; the import is
  `scripts/import-team-batches.mjs` and is idempotent.
- **Every photograph the client sent is attached to its listing.** Where they
  sent a front, a back and a collar detail, all three are on the product page.
  No listing in this batch was created from a single photo unless a single photo
  is all that arrived for that garment.
- **Prices follow the client's own tier table** — fan R500 (S–4XL), fan long
  sleeve R600, player R650, player long sleeve R750, retro R700, hoodie /
  half-zip / sweatshirt R850, jacket or windbreaker R1000, training set R700
  (R600 for a vest set), kids R450.
- **Navigation now reaches the new stock.** Inter Milan added under Serie A (34
  listings had no menu route to them at all), half-zip sets and sweatshirts
  added under Training & Outerwear, and a new Shirt Types group for fan version,
  player version, long sleeve and goalkeeper. Shop toolbar gains Long sleeve,
  Kids and Training chips.

## What still stands between here and the client's vision

**1. The 90 listings that carry one photograph.** This is the client's loudest
complaint and most of it predates this batch: 26 from the 1 Sep Liverpool batch,
24 rugby, 11 from the 2 Sep batch, and a scattering of F1 and Instagram
listings. For those the client only ever sent one photo, so the extra views have
to come from the supplier's own product pages — which is exactly what they meant
by "you didn't go back on the link and check for images". **Blocked on one
thing: the supplier site URL.** The 63 listings already built from that source
average seven images each, so the route works — it just needs the link and a run
of the same fetcher.

**2. The teams still missing entirely.** The client says roughly 60 lines per
team. Current depth by club: Liverpool 53, Inter Milan 34, Manchester United 31,
Bayern 35, Brazil 48, France 39, PSG 11, and single figures for Real Madrid,
Barcelona, Juventus, AC Milan, Arsenal, Chelsea, Tottenham, Manchester City.
Every one of those is a gap the client will notice. Two ways to close it: they
keep sending batches (works, but it is their evening spent photographing), or we
import from the supplier site directly against their exclusion list. They have
already said they prefer the second — "theres thousands of products on the site
and you know exactly what you want to sell and not sell" — but that also needs
the link.

**3. Season labels to confirm.** Titles assert a season only where the shirt
itself carries the sponsor or design that dates it; everything else is titled by
colourway. Worth one pass with the client so nothing on the storefront claims a
year the photograph does not support.

**4. Retro long sleeve has no price of its own** in the client's table. Priced
at the retro tier (R700) for now — confirm whether it should sit higher, the way
fan long sleeve sits R100 above fan.

## The one question to put to the client

> Can you send me the link to your supplier's site? I want to pull the extra
> photos for the listings that only have one — that's the fix for what you
> flagged — and then load the teams that are still thin, working off the
> exclusion list you gave me (no cropped vests, no reversible jackets, no shorts
> on their own).

## Where it ended, 4 Sep 2026

Deployed and verified on stadiumsupply.co.za: **437 customer-facing products**,
up from 324. Bayern 35, France 39, Brazil 48, Inter Milan 34, Liverpool 53,
Real Madrid 33. Sitemap 446 urls; new product pages serve their own prerendered
titles.

Scope was deliberately held to **the batches the client actually sent over
WhatsApp**. The supplier bulk import is prepared but not run — see below.

### The supplier pipeline is ready when you want it

The link the client meant is `ezfashion.x.yupoo.com`, and the scraper,
classifier, image trimmer and Shopify importer for it already exist in
`import/`. Three things were fixed to make it safe to run:

- **The client's exclusions are now enforced in the classifier.** 183
  shorts-sold-alone and 36 cropped jerseys were sitting in the importable pile;
  they are excluded now, along with the 632 US-sports albums, which turned out
  never to have been a rule in `classify.py` at all — only in its output file,
  so any re-run would have quietly let them back in.
- **`import_supplier.py` was creating invisible products.** It never applied the
  `Mapped Media` tag the storefront filters on, so a listing would be created,
  published, and never rendered. Fixed, and the 11 products from the pilot run
  were back-tagged.
- **A 12-album pilot was run end to end** to prove the chain — 11 Real Madrid
  listings, eight photographs each, correct tier and size run.

That leaves **4,399 importable albums** not yet live, at roughly 40 seconds per
product — about 49 hours of running and 18 GB of downloads, so it wants staging
across several background batches rather than one pass.

### Still open

- **134 listings carry a single photograph** (44 from this batch where only one
  photo arrived, 90 from before). The supplier albums are the fix; each one
  averages 26 photographs.
- **Retro long sleeve** is priced at the retro tier, R700. Fan long sleeve sits
  R100 above fan, so this may want R800 — worth one question.
- **Season labels** on the retros want a confirmation pass with the client.
