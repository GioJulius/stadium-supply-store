"""Stages the 6 Sep 2026 9.13 PM WhatsApp export for import.

`import/` is gitignored, so this is how the staging is reproduced from the
original export rather than committed. Photo keys are `p1`..`p664` in the
export's own timestamp order, which is the numbering every batch-0906 document
refers to throughout.

Unlike the earlier batches this one also writes `_files.json`, carrying each
photo's original filename and its parsed wall-clock minute. `align-0906.mjs`
needs that to join the export against the WhatsApp chat, which only ever shows
HH:MM and never the filename.

Run from the repo root:  python scripts/stage-0906.py
"""
import json
import os
import re
import shutil

SRC = 'C:/Users/MR GLOBAL/Desktop/GioGlobal/import/2026-09-06'
DST = 'import/batch-0906-raw'
EXPECTED = 36

STAMP = re.compile(r'at (\d+)\.(\d+)\.(\d+) (AM|PM)')


def parse_stamp(name):
    """(hour24, minute, second, duplicate-suffix) from a WhatsApp export filename.

    stage-0904c.py indexed the match object straight away, so a filename that
    didn't match died on `NoneType has no attribute group` several frames from
    the cause. 664 filenames is enough that one odd name is likely, so say what
    actually went wrong.
    """
    m = STAMP.search(name)
    assert m, f'filename carries no "at H.MM.SS AM/PM" timestamp: {name!r}'
    hour, minute, second, meridiem = int(m.group(1)), int(m.group(2)), int(m.group(3)), m.group(4)
    if meridiem == 'PM' and hour != 12:
        hour += 12
    if meridiem == 'AM' and hour == 12:
        hour = 0
    dup = re.search(r'\((\d+)\)', name)
    return (hour, minute, second, int(dup.group(1)) if dup else 0)


def main():
    names = [f for f in os.listdir(SRC) if f.lower().endswith(('.jpeg', '.jpg'))]
    skipped = [f for f in os.listdir(SRC) if f not in names]
    if skipped:
        print(f'ignoring {len(skipped)} non-photograph file(s): {skipped[:5]}')

    files = sorted(names, key=parse_stamp)
    assert len(files) == EXPECTED, f'expected {EXPECTED} photographs, found {len(files)}'

    os.makedirs(DST, exist_ok=True)
    index, records = {}, []
    for i, name in enumerate(files, 1):
        key, staged = 'p%d' % i, 'p%03d.jpg' % i
        shutil.copy(os.path.join(SRC, name), os.path.join(DST, staged))
        index[key] = staged
        hour, minute, second, dup = parse_stamp(name)
        records.append({
            'key': key,
            'file': staged,
            'src': name,
            'hhmm': '%02d:%02d' % (hour, minute),
            'sec': second,
            'dup': dup,
        })

    with open(os.path.join(DST, '_index.json'), 'w') as fh:
        json.dump(index, fh, indent=1)
    with open(os.path.join(DST, '_files.json'), 'w') as fh:
        json.dump(records, fh, indent=1)

    per_minute = {}
    for r in records:
        per_minute[r['hhmm']] = per_minute.get(r['hhmm'], 0) + 1
    print(f'staged {len(index)} files into {DST}')
    print(f'{len(per_minute)} distinct minutes, {records[0]["hhmm"]} to {records[-1]["hhmm"]}')


if __name__ == '__main__':
    main()
