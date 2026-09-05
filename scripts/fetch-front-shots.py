"""Stages the ezfashion album photographs for the 21 listings that had no
front-facing photograph of their own (5 Sep 2026 client feedback).

`import/` is gitignored, so this is how `scripts/front-shots-0906.mjs` gets its
source images: reproduced from the supplier rather than committed. The album id
for each listing is on the product as a `supplier-<id>` tag; the five listings
with no tag were matched by title against the supplier's catalogue, and all 21
are recorded with their album titles in `supplier-links-front-photos.md`.

Two things about reading Yupoo, both of which cost time to find:

  * The album URL needs `?uid=1`. Without it every album is a 404.
  * The album's own <title> is rendered by JavaScript, so a plain HTTP client
    sees a shell with no title in it. The PHOTOGRAPHS are in the HTML though,
    on `data-origin-src`, so fetching images needs no browser. To resolve or
    search album ids in bulk, page `/albums?tab=gallery&page=N` instead — that
    endpoint returns parseable HTML with every album's id and title.

Run from the repo root:  python scripts/fetch-front-shots.py
"""
import json
import os
import re
import time
import urllib.request

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"
BASE = "https://ezfashion.x.yupoo.com"
HEADERS = {"User-Agent": UA, "Referer": BASE + "/albums"}
DST = "import/front-shots"

# Album pages expose full-resolution originals on data-origin-src.
PHOTO = re.compile(r'data-origin-src="(https://photo\.yupoo\.com/ezfashion/[a-f0-9]+/[^"]+)"')

ALBUMS = {
    "real-madrid-2024-25-home-jersey-bellingham-5": "163988729",
    "manchester-united-2025-26-third-jersey-mbeumo-19": "206522080",
    "2025-26-ac-milan-away-player-version1": "203699927",
    "2026-italy-half-zip-training-set": "235379604",
    "2025-26-manchester-united-chinese-knot-kids-kit": "224260170",
    "2025-26-real-madrid-chinese-knot-kids-kit": "224260178",
    "2025-26-real-madrid-chinese-knot-long-sleeve-fan-version": "224260225",
    "2025-26-manchester-united-chinese-knot-long-sleeve-fan-version": "224260230",
    "2026-world-cup-france-training-set-fan-version": "246939367",
    "2026-27-real-madrid-home-long-sleeve-player-version": "240045171",
    "2026-27-liverpool-home-long-sleeve-player-version": "240045176",
    "2026-27-fc-barcelona-home-long-sleeve-player-version": "247188106",
    "2026-27-fc-barcelona-home-player-version": "249514648",
    "2026-27-liverpool-home-womens-shirt": "246938404",
    "2026-27-manchester-united-home-womens-shirt": "246938517",
    "2026-27-fc-barcelona-home-fan-version": "246939308",
    "2026-27-fc-barcelona-away-kids-kit": "249939789",
    "2026-world-cup-france-half-zip-training-set": "235379966",
    "2026-world-cup-england-half-zip-training-set": "235397278",
    "2026-27-liverpool-half-zip-training-set": "235374643",
    "2026-27-real-madrid-half-zip-training-set": "235381783",
}


def get(url, tries=3):
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            return urllib.request.urlopen(req, timeout=60).read()
        except Exception:
            if attempt == tries - 1:
                raise
            time.sleep(2 * (attempt + 1))


def main():
    index = {}
    for handle, album in ALBUMS.items():
        folder = os.path.join(DST, handle)
        os.makedirs(folder, exist_ok=True)
        html = get(f"{BASE}/albums/{album}?uid=1").decode("utf-8", "replace")
        urls = list(dict.fromkeys(PHOTO.findall(html)))
        index[handle] = {"album": album, "urls": urls}
        for i, url in enumerate(urls):
            path = os.path.join(folder, "%02d.jpg" % i)
            if os.path.exists(path) and os.path.getsize(path) > 2000:
                continue
            with open(path, "wb") as fh:
                fh.write(get(url))
        print("%-62s %2d photos" % (handle, len(urls)))
        time.sleep(0.5)

    with open(os.path.join(DST, "_index.json"), "w") as fh:
        json.dump(index, fh, indent=1)


if __name__ == "__main__":
    main()
