"""Finds which batch-0905 photographs are already on the live store.

The client resells the supplier's catalogue and sends the supplier's own
photographs, so a garment we already list usually arrives as the *identical
image file* we uploaded months ago. A difference hash catches that exactly, and
when it hits it hands back the live product's title — which is worth more than
the dedupe verdict, because it names the garment for free and with none of the
guesswork of reading a season off a crest at 345 px.

What a dHash can NOT do is separate two different garments photographed on the
same flat backdrop: two Real Madrid retros sit around Hamming 10-14 of each
other. That is why the threshold is tight and why a miss means "look at it",
never "it is new".

Two gates, both needed. Distance alone at <= 6 matched a Real Madrid retro to an
F1 Mercedes polo, so a candidate must also be the same club - which the caption
alignment knows exactly. With the club gate in place <= 6 still matched a navy
Siemens-era retro to the 2026/27 away player shirt, so the distance is 4.

    python scripts/dedupe-0905.py --hash-live      # once, ~2400 downloads, cached
    python scripts/dedupe-0905.py --hash-batch     # once, local
    python scripts/dedupe-0905.py --report         # all teams
    python scripts/dedupe-0905.py --report --team "Real Madrid"

Writes .dupcheck/0905/live-hashes.json, batch-hashes.json and matches.json.
"""
import argparse
import concurrent.futures
import io
import json
import os
import urllib.request

from PIL import Image

CATALOG = 'scripts/catalog-0906.json'
RAW = 'import/batch-0905-raw'
OUT = '.dupcheck/0905'
THRESHOLD = 4


def dhash(im, size=8):
    """64-bit difference hash: is each pixel brighter than the one to its right."""
    im = im.convert('L').resize((size + 1, size), Image.LANCZOS)
    px = list(im.getdata())
    bits = 0
    for row in range(size):
        base = row * (size + 1)
        for col in range(size):
            bits = (bits << 1) | (1 if px[base + col] > px[base + col + 1] else 0)
    return bits


def hamming(a, b):
    return bin(a ^ b).count('1')


def fetch_hash(url):
    # Shopify resizes on the CDN, so ask for a small one rather than the original.
    sized = url if '?' not in url else url.split('?')[0]
    sized += '?width=256'
    try:
        with urllib.request.urlopen(sized, timeout=30) as r:
            return dhash(Image.open(io.BytesIO(r.read())))
    except Exception as exc:                       # noqa: BLE001 - a dead CDN url must not stop the run
        print(f'  skip {url[:70]}: {exc}')
        return None


def hash_live():
    catalog = json.load(open(CATALOG))
    jobs = [(p['handle'], p['title'], p.get('type'), url)
            for p in catalog for url in (p.get('images') or [])]
    print(f'hashing {len(jobs)} live images from {len(catalog)} products')

    out = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
        for (handle, title, ptype, url), h in zip(jobs, pool.map(lambda j: fetch_hash(j[3]), jobs)):
            if h is not None:
                out.append({'handle': handle, 'title': title, 'type': ptype, 'url': url, 'h': h})
    os.makedirs(OUT, exist_ok=True)
    json.dump(out, open(f'{OUT}/live-hashes.json', 'w'))
    print(f'wrote {len(out)} live hashes')


def hash_batch():
    files = json.load(open(f'{RAW}/_files.json'))
    out = []
    for r in files:
        with Image.open(os.path.join(RAW, r['file'])) as im:
            out.append({'key': r['key'], 'h': dhash(im)})
    os.makedirs(OUT, exist_ok=True)
    json.dump(out, open(f'{OUT}/batch-hashes.json', 'w'))
    print(f'wrote {len(out)} batch hashes')


def report(team_filter=None):
    live = json.load(open(f'{OUT}/live-hashes.json'))
    batch = json.load(open(f'{OUT}/batch-hashes.json'))
    align = json.load(open('scripts/batch-0905/alignment.json'))
    cfg = json.load(open('scripts/batch-0905/batch.json'))
    aliases = cfg['teamAliases']
    catalog = {p['handle']: p for p in json.load(open(CATALOG))}

    def live_is(entry, team):
        """Same club? A bare hash distance is not enough.

        Two different garments on the supplier's flat backdrop sit at Hamming
        4-6 of each other, which on the first run matched a Real Madrid retro
        to an F1 Mercedes polo. The batch photo's club is known exactly from
        the caption alignment, so require the live product to agree."""
        prod = catalog.get(entry['handle'], {})
        hay = (entry['title'] + ' ' + ' '.join(prod.get('tags') or [])).lower()
        return any(a in hay for a in aliases.get(team, [team.lower()]))

    team_of, cap_of = {}, {}
    for m in align['messages']:
        for k in m.get('photos', []):
            team_of[k] = m.get('team')
            cap_of[k] = m.get('cap')

    matches = {}
    for b in batch:
        if team_filter and team_of.get(b['key']) != team_filter:
            continue
        team = team_of.get(b['key'])
        best = None
        for l in live:
            d = hamming(b['h'], l['h'])
            if d > THRESHOLD or (best is not None and d >= best['dist']):
                continue
            if team and not live_is(l, team):
                continue
            best = {'dist': d, 'handle': l['handle'], 'title': l['title'], 'type': l['type']}
        if best:
            matches[b['key']] = best

    json.dump(matches, open(f'{OUT}/matches.json', 'w'), indent=1)

    teams = {}
    for k, t in team_of.items():
        if team_filter and t != team_filter:
            continue
        if t:
            teams.setdefault(t, {'total': 0, 'hit': 0})
            teams[t]['total'] += 1
            if k in matches:
                teams[t]['hit'] += 1

    order = json.load(open('scripts/batch-0905/batch.json'))['order']
    print(f'{"team":22} {"photos":>6} {"already listed":>14} {"new":>5}')
    for t in order:
        if t in teams:
            s = teams[t]
            print(f'{t:22} {s["total"]:6d} {s["hit"]:14d} {s["total"] - s["hit"]:5d}')
    tot = sum(s['total'] for s in teams.values())
    hit = sum(s['hit'] for s in teams.values())
    print(f'{"TOTAL":22} {tot:6d} {hit:14d} {tot - hit:5d}')

    if team_filter:
        print(f'\nmatched photographs in {team_filter}:')
        for k, m in sorted(matches.items(), key=lambda kv: int(kv[0][1:])):
            print(f'  {k:6} d={m["dist"]}  [{cap_of.get(k)}] -> {m["title"]}')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--hash-live', action='store_true')
    ap.add_argument('--hash-batch', action='store_true')
    ap.add_argument('--report', action='store_true')
    ap.add_argument('--team')
    a = ap.parse_args()
    if a.hash_live:
        hash_live()
    if a.hash_batch:
        hash_batch()
    if a.report:
        report(a.team)
