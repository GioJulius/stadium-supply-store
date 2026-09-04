import os, glob, shutil, json

MED = 'C:/Users/MR GLOBAL/Desktop/GioGlobal/stadium supply media'
WA = ('C:/Users/MRGLOB~1/AppData/Local/Temp/claude/'
      'C--Users-MR-GLOBAL-Desktop-GioGlobal/22b7d060-4b72-4c0c-ab58-6a95b79d102e/scratchpad/wa')
DST = 'import/batch-0904b'

os.makedirs(DST, exist_ok=True)
idx = {}

fs = sorted(glob.glob(WA + '/*.jpeg'))
assert len(fs) == 60, len(fs)
for i, f in enumerate(fs, 1):
    n = 'z%02d.jpg' % i
    shutil.copy(f, os.path.join(DST, n))
    idx['z%d' % i] = n

dirs = sorted(d for d in os.listdir(MED)
              if os.path.isdir(os.path.join(MED, d)) and ('ezfashion' in d or 'JPG _ album' in d))
for i, d in enumerate(dirs, 1):
    for k, f in enumerate(sorted(glob.glob(os.path.join(MED, d, '*.jpg'))), 1):
        n = 'a%02d_%d.jpg' % (i, k)
        shutil.copy(f, os.path.join(DST, n))
        idx['a%d.%d' % (i, k)] = n

for k, f in enumerate(['2d662c34.jpg', '561246b8.jpg', 'c5afc8b5.jpg'], 1):
    n = 'L%d.jpg' % k
    shutil.copy(os.path.join(MED, f), os.path.join(DST, n))
    idx['L%d' % k] = n

json.dump(idx, open(os.path.join(DST, '_index.json'), 'w'), indent=1)
print('staged', len(idx), 'files into', DST)
