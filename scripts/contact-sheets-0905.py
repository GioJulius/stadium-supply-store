"""Renders contact sheets of the batch-0905 photographs for identification by eye.

Perceptual hashing does not separate garments photographed on a flat backdrop —
that lesson is written up in batch-0904b/0904c. Grouping a batch's photos into
garments, and naming each one, is done by looking at them. This is the cheapest
way to look at 664 photographs.

Every sheet is built to be **at most 1568 px on its long edge**, because that is
what an image is downscaled to before it reaches the model. A wider sheet does
not carry more detail, it carries less: the tile shrinks by the same ratio and
the collar, sleeve length and sponsor wordmark are the first things to go.

    python scripts/contact-sheets-0905.py --keys p1-p16
    python scripts/contact-sheets-0905.py --keys p1-p16 --grid 4x4 --tile 360
    python scripts/contact-sheets-0905.py --range p118-p147 --name arsenal
    python scripts/contact-sheets-0905.py --boundaries 118,148,190

Writes into .dupcheck/0905/ (gitignored).
"""
import argparse
import json
import os
import re

from PIL import Image, ImageDraw, ImageFont

RAW = 'import/batch-0905-raw'
OUT = '.dupcheck/0905'
MAX_EDGE = 1568

BG = (24, 24, 27)
FG = (228, 228, 231)
DIM = (140, 140, 148)


def load_files():
    with open(os.path.join(RAW, '_files.json')) as fh:
        records = json.load(fh)
    return {r['key']: r for r in records}, records


def parse_keys(spec, records):
    """"p1-p16", "p3,p9,p12" or a mix of both, in file order."""
    order = {r['key']: i for i, r in enumerate(records)}
    out = []
    for part in spec.split(','):
        part = part.strip()
        if not part:
            continue
        m = re.fullmatch(r'p(\d+)\s*-\s*p?(\d+)', part)
        if m:
            out.extend('p%d' % n for n in range(int(m.group(1)), int(m.group(2)) + 1))
        else:
            out.append(part if part.startswith('p') else 'p' + part)
    unknown = [k for k in out if k not in order]
    assert not unknown, f'no such photo key(s): {unknown[:5]}'
    return out


def font(size):
    for name in ('arialbd.ttf', 'arial.ttf', 'DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def render(keys, index, path, cols, rows, tile, gutter=16, band=20, title=None):
    """One sheet. Tile size is reduced if the canvas would exceed MAX_EDGE."""
    head = 28 if title else 0
    width = cols * tile + (cols + 1) * gutter
    if width > MAX_EDGE:
        tile = (MAX_EDGE - (cols + 1) * gutter) // cols
        width = cols * tile + (cols + 1) * gutter
    height = head + rows * (tile + band) + (rows + 1) * gutter
    if height > MAX_EDGE:
        tile = (MAX_EDGE - head - (rows + 1) * gutter) // rows - band
        width = cols * tile + (cols + 1) * gutter
        height = head + rows * (tile + band) + (rows + 1) * gutter

    sheet = Image.new('RGB', (width, height), BG)
    draw = ImageDraw.Draw(sheet)
    label_font, title_font = font(max(11, band - 6)), font(18)
    if title:
        draw.text((gutter, 6), title, font=title_font, fill=FG)

    for i, key in enumerate(keys):
        col, row = i % cols, i // cols
        x = gutter + col * (tile + gutter)
        y = head + gutter + row * (tile + band + gutter)

        rec = index[key]
        with Image.open(os.path.join(RAW, rec['file'])) as im:
            im = im.convert('RGB')
            im.thumbnail((tile, tile), Image.LANCZOS)
            sheet.paste(im, (x + (tile - im.width) // 2, y + (tile - im.height) // 2))

        draw.text((x, y + tile + 3), key, font=label_font, fill=FG)
        stamp = f"{rec['hhmm']}:{rec['sec']:02d}"
        w = draw.textlength(stamp, font=label_font)
        draw.text((x + tile - w, y + tile + 3), stamp, font=label_font, fill=DIM)

    os.makedirs(os.path.dirname(path), exist_ok=True)
    sheet.save(path, quality=88)
    print(f'{path}  {sheet.width}x{sheet.height}  {len(keys)} tiles')
    return path


def chunk(seq, n):
    for i in range(0, len(seq), n):
        yield seq[i:i + n]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--keys', help='p1-p16 or p3,p9,p12')
    ap.add_argument('--range', dest='rng', help='alias for --keys')
    ap.add_argument('--boundaries', help='comma-separated photo numbers to straddle')
    ap.add_argument('--name', default='sheet')
    ap.add_argument('--grid', default='4x4')
    ap.add_argument('--tile', type=int, default=360)
    args = ap.parse_args()

    index, records = load_files()
    cols, rows = (int(v) for v in args.grid.lower().split('x'))
    per = cols * rows

    if args.boundaries:
        # Six either side of each candidate edge: does the kit actually change here?
        for n in (int(v) for v in args.boundaries.split(',')):
            keys = [f'p{i}' for i in range(max(1, n - 6), min(len(records), n + 5) + 1)]
            render(keys, index, f'{OUT}/boundary-{n:03d}.jpg', 6, 2, 250, gutter=8, band=18,
                   title=f'boundary at p{n}')
        return

    spec = args.keys or args.rng
    assert spec, 'pass --keys, --range or --boundaries'
    keys = parse_keys(spec, records)
    parts = list(chunk(keys, per))
    for i, part in enumerate(parts, 1):
        suffix = f'-{i}' if len(parts) > 1 else ''
        render(part, index, f'{OUT}/{args.name}{suffix}.jpg', cols, rows, args.tile,
               title=f'{args.name}  {part[0]}-{part[-1]}  ({i}/{len(parts)})')


if __name__ == '__main__':
    main()
