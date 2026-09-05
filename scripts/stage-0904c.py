"""Stages the 4 Sep 2026 10.04 PM WhatsApp export for import.

`import/` is gitignored, so this is how the staging is reproduced from the
original export rather than committed. Photo keys are `p1`..`p149` in the
export's own timestamp order, which is the numbering `batch-0904c-research.md`
refers to throughout — so a key here can be read straight off that document.

Run from the repo root:  python scripts/stage-0904c.py
"""
import json
import os
import re
import shutil

# The export was unpacked one level up, alongside the other WhatsApp batches,
# rather than inside the repo. Absolute so this runs from anywhere.
SRC = 'C:/Users/MR GLOBAL/Desktop/GioGlobal/import/2026-09-04c'
DST = 'import/batch-0904c'


def sort_key(name):
    """Timestamp order, matching order.txt and the research document."""
    m = re.search(r'at (\d+)\.(\d+)\.(\d+) (AM|PM)', name)
    hour, minute, second, meridiem = int(m.group(1)), int(m.group(2)), int(m.group(3)), m.group(4)
    if meridiem == 'PM' and hour != 12:
        hour += 12
    if meridiem == 'AM' and hour == 12:
        hour = 0
    dup = re.search(r'\((\d+)\)', name)
    return (hour, minute, second, int(dup.group(1)) if dup else 0)


def main():
    files = sorted((f for f in os.listdir(SRC) if f.lower().endswith(('.jpeg', '.jpg'))), key=sort_key)
    assert len(files) == 149, f'expected 149 photographs, found {len(files)}'

    os.makedirs(DST, exist_ok=True)
    index = {}
    for i, name in enumerate(files, 1):
        staged = 'p%03d.jpg' % i
        shutil.copy(os.path.join(SRC, name), os.path.join(DST, staged))
        index['p%d' % i] = staged

    with open(os.path.join(DST, '_index.json'), 'w') as fh:
        json.dump(index, fh, indent=1)
    print(f'staged {len(index)} files into {DST}')


if __name__ == '__main__':
    main()
