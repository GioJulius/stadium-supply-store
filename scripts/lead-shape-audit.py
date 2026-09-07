"""Flags every live listing whose LEAD image is not a square garment photograph.

The client's standing complaint is "we can't see the first picture": a card in
the shop grid leading on a size chart, a hang tag or a fabric close-up. The
5 Sep audit found those by downloading and eyeballing contact sheets, which is
fine for a few hundred listings but wasteful for the whole catalogue.

The cheap discriminator is already written up in stadium-supply-lead-images:
**size charts are non-square (1.54:1 or 3.76:1); garment photographs are square.**
So the whole catalogue can be triaged from image DIMENSIONS alone, and dimensions
live in the first few kilobytes of a JPEG - no need to download the picture.

This fetches a Range request per lead image, parses the header for width and
height, and prints every listing whose lead is more than `--tol` away from
square. Those, and only those, are then worth a contact sheet.

    python scripts/lead-shape-audit.py                      # audit, print report
    python scripts/lead-shape-audit.py --json out.json      # also write the rows

Read-only: it never touches Shopify.
"""
import argparse
import concurrent.futures
import io
import json
import urllib.request

from PIL import Image

SNAPSHOT = 'scripts/seo-snapshot.json'
CATALOG = 'scripts/catalog-0906b.json'
HEAD_BYTES = 65536


def lead_url(p):
    """The snapshot carries featuredImage; the catalog dump carries images[]."""
    fi = p.get('featuredImage')
    if isinstance(fi, dict):
        return fi.get('url')
    if isinstance(fi, str):
        return fi
    imgs = p.get('images') or []
    return imgs[0] if imgs else None


def dimensions(url):
    """(width, height) from the first HEAD_BYTES of the file, or None."""
    req = urllib.request.Request(url, headers={'Range': 'bytes=0-%d' % (HEAD_BYTES - 1)})
    try:
        with urllib.request.urlopen(req, timeout=30) as fh:
            head = fh.read()
    except Exception:
        return None
    try:
        return Image.open(io.BytesIO(head)).size
    except Exception:
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--tol', type=float, default=0.06,
                    help='how far from 1.00 an aspect ratio may sit and still count as square')
    ap.add_argument('--json', dest='out')
    ap.add_argument('--source', default=SNAPSHOT)
    args = ap.parse_args()

    products = json.load(open(args.source, encoding='utf-8'))
    targets = [(p['handle'], p.get('title', ''), lead_url(p)) for p in products]
    missing = [h for h, _, u in targets if not u]
    targets = [t for t in targets if t[2]]

    rows = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
        for (handle, title, url), size in zip(targets, pool.map(lambda t: dimensions(t[2]), targets)):
            if not size:
                rows.append({'handle': handle, 'title': title, 'ratio': None, 'w': None, 'h': None})
                continue
            w, h = size
            rows.append({'handle': handle, 'title': title, 'w': w, 'h': h, 'ratio': round(w / h, 3)})

    bad = [r for r in rows if r['ratio'] is not None and abs(r['ratio'] - 1) > args.tol]
    unread = [r for r in rows if r['ratio'] is None]
    bad.sort(key=lambda r: abs(r['ratio'] - 1), reverse=True)

    print('%d listings audited, %d unreadable, %d with no image' % (len(rows), len(unread), len(missing)))
    print('%d lead images are not square (tolerance %.2f)\n' % (len(bad), args.tol))
    for r in bad:
        print('%7.3f  %5dx%-5d  %-52s %s' % (r['ratio'], r['w'], r['h'], r['handle'][:52], r['title'][:40]))
    if missing:
        print('\nno image at all: %s' % ', '.join(missing))
    if unread:
        print('\nheader unreadable: %s' % ', '.join(r['handle'] for r in unread))

    if args.out:
        json.dump({'bad': bad, 'unreadable': unread, 'noImage': missing}, open(args.out, 'w'), indent=1)
        print('\nwrote %s' % args.out)


if __name__ == '__main__':
    main()
