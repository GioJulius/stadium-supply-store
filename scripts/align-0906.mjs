/**
 * Joins the WhatsApp captions to the 664 staged photographs of batch 0906.
 *
 * The client sends each garment as an album with a one-word type caption, and a
 * bare team name as a text message immediately before each team's block. Reading
 * those captions off WhatsApp Web gives, per message, the caption and the album's
 * photo count — the count comes from the "+N" overlay on the fourth tile, where
 * the album holds **N + 3** photographs (calibrated against the export: 19:21
 * carries 37 files and its two albums decode to 15 + 22).
 *
 * Alignment is therefore cumulative, not per-minute: WhatsApp stamps a message
 * once but writes its files as they arrive, so a 13-photo album sent at 20:06
 * lands files across 20:06 and 20:07. Walking the messages in order and handing
 * each the next `size` files reproduces the export exactly.
 *
 * Writes scripts/batch-0906/alignment.json and prints a drift report: for every
 * message, how far the first file it claims sits from the message's own clock.
 * A healthy run drifts by 0-1 minutes; anything larger means a message was
 * missed while scrolling and every later assignment is off by that album.
 *
 *   node scripts/align-0906.mjs
 */
import fs from 'node:fs';

const RAW = 'import/batch-0906-raw';
const DIR = 'scripts/batch-0906';

const files = JSON.parse(fs.readFileSync(`${RAW}/_files.json`, 'utf8'));

const toMin = hhmm => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const messages = fs.readFileSync(`${DIR}/captions.tsv`, 'utf8')
  .split(/\r?\n/).filter(Boolean)
  .map(line => {
    const [t, size, cap = '', flag = ''] = line.split('\t');
    return {
      t,
      size: Number(size),
      cap,
      team: flag.startsWith('TEAM:') ? flag.slice(5) : null,
      skip: flag === 'SKIP',
    };
  });

const claimed = messages.reduce((a, m) => a + m.size, 0);
if (claimed !== files.length) {
  console.log(`NOTE: captions account for ${claimed} photographs, the export holds ${files.length}.`);
  console.log('      The drift report below shows where the missing one falls.\n');
}

let cursor = 0;
const out = [];
let currentTeam = null;
const drifts = [];

for (const m of messages) {
  if (m.team) currentTeam = m.team;
  if (m.size === 0) { out.push({ ...m, team: currentTeam, photos: [] }); continue; }

  const photos = files.slice(cursor, cursor + m.size);
  cursor += m.size;

  const drift = photos.length ? toMin(photos[0].hhmm) - toMin(m.t) : null;
  if (drift !== null) drifts.push({ t: m.t, cap: m.cap, drift, first: photos[0].key });

  out.push({
    t: m.t,
    cap: m.cap,
    team: currentTeam,
    size: m.size,
    from: photos[0]?.key,
    to: photos[photos.length - 1]?.key,
    photos: photos.map(p => p.key),
    firstFileMinute: photos[0]?.hhmm,
    drift,
  });
}

const leftover = files.slice(cursor).map(f => f.key);

// Team blocks, which are what the per-team checkpoint loop iterates over.
const teams = [];
for (const r of out) {
  if (!r.team) continue;
  let block = teams.find(b => b.team === r.team);
  if (!block) teams.push(block = { team: r.team, order: teams.length + 1, from: null, to: null, count: 0, captions: [] });
  if (!r.photos.length) continue;
  block.from ??= r.from;
  block.to = r.to;
  block.count += r.size;
  block.captions.push({ cap: r.cap, size: r.size, from: r.from, to: r.to });
}

fs.mkdirSync(DIR, { recursive: true });
fs.writeFileSync(`${DIR}/alignment.json`, JSON.stringify({ messages: out, teams, leftover }, null, 1));

const bad = drifts.filter(d => Math.abs(d.drift) > 1);
console.log(`${out.length} messages, ${cursor} photographs assigned, ${leftover.length} left over`);
console.log(`drift  >1 min on ${bad.length} of ${drifts.length} albums`);
for (const d of bad.slice(0, 12)) console.log(`  ${d.t}  ${String(d.drift).padStart(4)}m  ${d.first}  ${d.cap}`);
console.log('');
console.log('TEAM BLOCKS');
for (const b of teams) {
  console.log(`${String(b.order).padStart(2)}. ${b.team.padEnd(20)} ${String(b.count).padStart(3)} photos  ${b.from}-${b.to}  (${b.captions.length} albums)`);
}
