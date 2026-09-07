# Batch 2026-09-06 — captions harvested, photographs still to come

Read off WhatsApp Web on 6 Sep 2026. **The photographs are NOT on this machine
yet**, so nothing here has been staged or imported.

## What the client sent, 09:10–09:12

    09:10  Leeds United           (team marker)
    09:10    fan version              4
    09:10  Ajax                   (team marker)
    09:10    players version          1
    09:10    retro                    1
    09:10    kids set                 1
    09:11    (uncaptioned)            1
    09:11    player version           1
    09:11    retro                    4
    09:11    fan version              2
    09:11    kids set                 2
    09:11    half zip                 1
    09:11  "Tracksuits :"         (text, no photographs)
    09:12    half zip                 6   (+3 overlay)
    09:12    full zip                12   (+9 overlay)

**≈36 photographs.** Only the two 09:12 albums carry a `+N` overlay, so those two
sizes are solid. The rest were counted from rendered tiles and are the usual weak
spot — `align-0906.mjs` will show the drift once the export exists, and eleven of
these messages share the minutes 09:10 and 09:11, which is exactly where the
0905 batch had its two album-order failures. **Check the order by eye: kids sets
are the only photographs with shorts, half-zip and full-zip sets the only ones
with bottoms.**

## Both teams are new to the store

`Leeds United` — 0 products live. `Ajax` — 0 products live. Nothing to dedupe
against, but the Ajax garments in the chat are Ziggo-era home/away/third plus
ABN AMRO retros, so the usual sponsor dating applies.

## Blocked on: the photographs

There is no `import/2026-09-06` export and no zip in `stadium supply media`.
`Download` and `Download all` were clicked in WhatsApp Web and no file appeared
in `Downloads` — most likely Chrome's "ask where to save each file" dialog, which
is a native window a browser agent cannot see or dismiss.

To unblock, do what produced the earlier batches: select today's media messages
in WhatsApp and download them, so a `WhatsApp Unknown 2026-09-06 at *.zip` lands
in `Downloads` or `stadium supply media`. Then:

    python scripts/stage-0906.py          # unpack + number p1..pN
    node   scripts/align-0906.mjs         # join captions to files, drift report
    # team files by eye, then apply-names / import as per batch-0905-record.md

## Also outstanding from today's chat

The `full zip` album is 12 photographs of tracksuits, and the client's tier table
still has **jacket R1 000 / training set R600 and nothing between** — the same gap
that left five full-zip tracksuits unpriced in the 4 Sep batch. Ask the price
before importing them.
