/**
 * Renames a team's batch-0905 photographs to their product names and splits the
 * ones we already sell into a "found on web" folder.
 *
 * Three outputs, all driven by the single team file so they cannot drift apart:
 *
 *   stadium supply media/2026-09-05 named/<Team>/<Title> - NN.jpg
 *       what the owner browses. The original zip is never touched.
 *   stadium supply media/2026-09-05 named/_found on web/<Team>/
 *       garments already on stadiumsupply.co.za, filed rather than imported.
 *   import/batch-0905/<team-slug>/<Title> - NN.jpg
 *       the copy the importer reads. Gitignored, reproducible from the export.
 *
 * Photographs are addressed BY FILENAME, never by index. A positional table
 * stops being idempotent the moment it is re-run - which is how
 * promote-lead-image.mjs became a one-shot script - so `files` is written into
 * the team file and never recomputed. Rename a product and you edit both.
 *
 *   node scripts/apply-0905-names.mjs --team "Real Madrid"
 *   node scripts/apply-0905-names.mjs --team "Real Madrid" --apply
 *   node scripts/apply-0905-names.mjs --all --apply
 */
import fs from 'node:fs';
import path from 'node:path';

const RAW = 'import/batch-0905-raw';
const DIR = 'scripts/batch-0905';
const TEAMS = `${DIR}/teams`;
const NAMED = 'C:/Users/MR GLOBAL/Desktop/GioGlobal/stadium supply media/2026-09-05 named';
const MIRROR = 'import/batch-0905';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const ALL = args.includes('--all');
const TEAM = args[args.indexOf('--team') + 1];

const index = JSON.parse(fs.readFileSync(`${RAW}/_index.json`, 'utf8'));
const align = JSON.parse(fs.readFileSync(`${DIR}/alignment.json`, 'utf8'));

/** Windows forbids \ / : * ? " < > | in a filename; "2026/27" has to become "2026-27". */
const safeFile = title => title.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
const slug = title => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const teamSlug = t => slug(t);

function loadTeamFiles() {
  return fs.readdirSync(TEAMS).filter(f => f.endsWith('.json'))
    .map(f => ({ file: f, data: JSON.parse(fs.readFileSync(path.join(TEAMS, f), 'utf8')) }));
}

/** Every slug must be unique across the WHOLE batch, not just within a team.
 *  Two nations can both produce "2026 World Cup Half-Zip Training Set", and the
 *  collision surfaces as a silently skipped product (the importer resolves by
 *  handle) rather than as an error. Check before anything is written. */
function assertUniqueSlugs(all) {
  const seen = new Map();
  const clashes = [];
  for (const { data } of all) {
    for (const g of data.garments) {
      const s = slug(g.title);
      if (seen.has(s)) clashes.push(`${s}\n    ${seen.get(s)}\n    ${data.team} / ${g.id}`);
      else seen.set(s, `${data.team} / ${g.id}`);
    }
  }
  if (clashes.length) {
    console.error(`${clashes.length} duplicate product slug(s) across the batch:\n  ${clashes.join('\n  ')}`);
    process.exit(1);
  }
  return seen.size;
}

/** Every photograph in the team's block must be claimed exactly once. */
function assertBlockCovered(data) {
  const block = align.teams.find(t => t.team === data.team);
  if (!block) { console.error(`no aligned block for ${data.team}`); process.exit(1); }
  const expected = [];
  for (const m of align.messages) if (m.team === data.team) expected.push(...(m.photos || []));

  const claimed = new Map();
  for (const g of data.garments) {
    for (const p of g.photos) {
      if (claimed.has(p)) { console.error(`${p} claimed twice: ${claimed.get(p)} and ${g.id}`); process.exit(1); }
      claimed.set(p, g.id);
    }
  }
  const held = new Set((data.heldBack || []).flatMap(h => h.photos));
  const missing = expected.filter(p => !claimed.has(p) && !held.has(p));
  const alien = [...claimed.keys()].filter(p => !expected.includes(p));
  if (missing.length) { console.error(`${missing.length} photo(s) in the block claimed by nothing: ${missing.join(' ')}`); process.exit(1); }
  if (alien.length) { console.error(`photo(s) not in this team's block: ${alien.join(' ')}`); process.exit(1); }
  return expected.length;
}

function copy(src, dest) {
  if (!APPLY) return 'would copy';
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest) && fs.statSync(dest).size === fs.statSync(src).size) return 'exists';
  fs.copyFileSync(src, dest);
  return 'copied';
}

function runTeam(entry) {
  const { file, data } = entry;
  const count = assertBlockCovered(data);
  console.log(`\n${data.team} - ${data.garments.length} garments over ${count} photographs`);

  let listed = 0, fresh = 0, copies = 0;
  const notes = [`# ${data.team} - batch 2026-09-05`, ''];

  for (const g of data.garments) {
    const isListed = g.dedupe?.verdict === 'listed';
    const stem = safeFile(g.title);
    const files = g.photos.map((_, i) => `${stem} - ${String(i + 1).padStart(2, '0')}.jpg`);
    g.files = files;
    g.handle = slug(g.title);

    const dest = isListed
      ? path.join(NAMED, '_found on web', data.team)
      : path.join(NAMED, data.team);

    g.photos.forEach((key, i) => {
      const src = path.join(RAW, index[key]);
      if (!fs.existsSync(src)) { console.error(`missing staged file for ${key}`); process.exit(1); }
      copy(src, path.join(dest, files[i]));
      if (!isListed) copy(src, path.join(MIRROR, teamSlug(data.team), files[i]));
      copies++;
    });

    if (isListed) { listed++; continue; }
    fresh++;
    notes.push(`## ${g.title}`);
    notes.push(`- photographs: ${files.join(', ')}`);
    notes.push(`- tier: ${g.tier}`);
    if (g.blurb) notes.push(`- description: ${g.blurb}`);
    if (g.flagForClient) notes.push(`- FLAG FOR CLIENT: ${g.flagForClient}`);
    if (g.dedupe?.verdict === 'uncertain') notes.push(`- CHECK: ${g.dedupe.why}`);
    notes.push('');
  }

  if (APPLY) {
    data.status = 'renamed';
    fs.writeFileSync(path.join(TEAMS, file), JSON.stringify(data, null, 1) + '\n');
    fs.mkdirSync(path.join(NAMED, data.team), { recursive: true });
    fs.writeFileSync(path.join(NAMED, data.team, `_${teamSlug(data.team)}-descriptions.md`), notes.join('\n'));
  }
  console.log(`  ${fresh} to list, ${listed} already on the website, ${copies} photographs ${APPLY ? 'placed' : 'to place'}`);
  return { fresh, listed };
}

const all = loadTeamFiles();
console.log(`${assertUniqueSlugs(all)} unique product slugs across ${all.length} team file(s)`);

const targets = ALL ? all : all.filter(e => e.data.team === TEAM);
if (!targets.length) { console.error(`no team file for ${TEAM ?? '(none given)'} - pass --team "<name>" or --all`); process.exit(1); }

let F = 0, L = 0;
for (const t of targets) { const r = runTeam(t); F += r.fresh; L += r.listed; }
console.log(`\n${F} products to create, ${L} filed as already on the website${APPLY ? '' : '   (dry run - pass --apply)'}`);
