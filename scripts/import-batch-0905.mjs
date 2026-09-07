/**
 * Imports the 5 Sep 2026 batch, one team at a time.
 *
 * Unlike the 0904 importers this one reads no single manifest. The batch runs to
 * roughly 650 garments over 18 teams, so the records are sharded into
 * `scripts/batch-0905/teams/<NN>-<slug>.json`, each written once by eye and then
 * enriched by `dedupe-0905.py` and `apply-0905-names.mjs`. Those team files ARE
 * the manifest; the shared tiers, sizes and batch tag live in
 * `scripts/batch-0905/batch.json`.
 *
 * Photographs are resolved BY FILENAME out of `import/batch-0905/<team-slug>/`,
 * which `apply-0905-names.mjs` populates. There is no positional `_index.json`
 * lookup here on purpose: an index-based table stops being idempotent after its
 * first run, and this one will be re-run per team many times.
 *
 * Garments whose dedupe verdict is `listed` are never created - their
 * photographs were filed into "found on web" instead. Garments marked
 * `uncertain` ARE created, because the cost of a missing listing is higher than
 * the cost of a duplicate the owner can merge, but every one is printed at the
 * end for review.
 *
 * Every product is tagged `Mapped Media`, without which
 * isCustomerFacingMappedProduct() hides it from /shop while the product page
 * still renders - which looks exactly like a caching bug.
 *
 * Idempotent: a handle that already exists is skipped.
 *
 * Usage: node scripts/import-batch-0905.mjs [--apply] [--limit N] --team "Real Madrid"
 *        node scripts/import-batch-0905.mjs [--apply] --all
 */
import { readFileSync, writeFileSync, statSync, existsSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .filter(l => l.trim() && !l.trim().startsWith("#") && l.includes("="))
    .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const ENDPOINT = `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-04/graphql.json`;
const TOKEN = env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
const APPLY = process.argv.includes("--apply");
const ALL = process.argv.includes("--all");
const LIMIT = Number(process.argv[process.argv.indexOf("--limit") + 1]) || Infinity;
const TEAM = process.argv.includes("--team") ? process.argv[process.argv.indexOf("--team") + 1] : null;

const DIR = fileURLToPath(new URL("./batch-0905/", import.meta.url));
const TEAMS_DIR = join(DIR, "teams");
const MIRROR = fileURLToPath(new URL("../import/batch-0905/", import.meta.url));

const batch = JSON.parse(readFileSync(join(DIR, "batch.json"), "utf8"));
const BATCH_TAG = batch.batchTag;

async function gql(query, variables = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
      body: JSON.stringify({ query, variables }),
    });
    const body = await res.json();
    if (body.errors?.some(e => e.extensions?.code === "THROTTLED") && attempt < 8) {
      await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
      continue;
    }
    if (!res.ok || body.errors) throw new Error(JSON.stringify(body.errors ?? body));
    return body.data;
  }
}

const slug = title =>
  title.toLowerCase().replace(/[’']/g, "").replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// The staged upload posts to Google storage, which timed out mid-run on an
// earlier batch. Retry the whole staged-upload round trip, not only the Shopify
// half of it.
async function stageAndUpload(path) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await stageAndUploadOnce(path);
    } catch (err) {
      if (attempt >= 5) throw err;
      console.log(`  retry upload ${basename(path)} (${err.message?.slice(0, 60)})`);
      await new Promise(r => setTimeout(r, 4000 * (attempt + 1)));
    }
  }
}

async function stageAndUploadOnce(path) {
  const size = statSync(path).size;
  const filename = basename(path).replace(/[^A-Za-z0-9._-]/g, "_");
  const staged = await gql(
    `mutation($input:[StagedUploadInput!]!){ stagedUploadsCreate(input:$input){ stagedTargets{ url resourceUrl parameters{name value} } userErrors{field message} } }`,
    { input: [{ resource: "IMAGE", filename, mimeType: "image/jpeg", httpMethod: "POST", fileSize: String(size) }] },
  );
  if (staged.stagedUploadsCreate.userErrors.length) throw new Error(JSON.stringify(staged.stagedUploadsCreate.userErrors));
  const target = staged.stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  for (const p of target.parameters) form.append(p.name, p.value);
  form.append("file", new Blob([readFileSync(path)], { type: "image/jpeg" }), filename);
  const up = await fetch(target.url, { method: "POST", body: form });
  if (!up.ok) throw new Error(`staged upload failed ${up.status}: ${(await up.text()).slice(0, 300)}`);
  return target.resourceUrl;
}

const DESCRIPTION = g =>
  `<p>${g.blurb ?? g.title}</p><p>Imported to order from our supplier. Sizes run small — see the size guide before choosing.</p>`;

const files = readdirSync(TEAMS_DIR).filter(f => f.endsWith(".json")).sort();
const teamFiles = files.map(f => ({ file: f, data: JSON.parse(readFileSync(join(TEAMS_DIR, f), "utf8")) }));
const targets = ALL ? teamFiles : teamFiles.filter(t => t.data.team === TEAM);
if (!targets.length) {
  console.error(`no team file for ${TEAM ?? "(none given)"} — pass --team "<name>" or --all`);
  process.exit(1);
}

const photoPath = (data, file) => {
  const p = join(MIRROR, slug(data.team), file);
  if (!existsSync(p)) throw new Error(`${data.team}: staged file missing, run apply-0905-names.mjs --apply first: ${p}`);
  return p;
};

// Prove every photograph resolves before touching Shopify.
for (const { data } of targets) {
  if (data.status === "named") throw new Error(`${data.team} has not been renamed yet — run apply-0905-names.mjs --apply`);
  for (const g of data.garments) {
    if (g.dedupe?.verdict === "listed") continue;
    (g.files ?? []).forEach(f => photoPath(data, f));
  }
}

const publications = (await gql(`{ publications(first:20){edges{node{id name}}} }`)).publications.edges.map(e => e.node);

let created = 0, skipped = 0, filed = 0;
const review = [];

for (const entry of targets) {
  const { data } = entry;
  console.log(`\n=== ${data.team} ===`);
  let teamCreated = 0, failed = false;

  for (const g of data.garments) {
    if (g.dedupe?.verdict === "listed") { filed++; continue; }
    if (created >= LIMIT) { failed = true; break; }

    const tier = batch.tiers[g.tier];
    if (!tier) throw new Error(`${g.title}: unknown tier ${g.tier}`);
    const handle = g.handle ?? slug(g.title);

    const existing = (await gql(`query($h:String!){ productByHandle(handle:$h){ id } }`, { h: handle })).productByHandle;
    if (existing) { console.log(`SKIP    ${handle} — already exists`); skipped++; continue; }

    const sizes = batch.sizes[tier.sizes];
    const photos = (g.files ?? []).map(f => photoPath(data, f));
    const mark = g.dedupe?.verdict === "uncertain" ? " ?" : "  ";
    console.log(`CREATE${mark}${handle.padEnd(58)} R${tier.price.padEnd(8)} ${String(sizes.length).padStart(2)}sz ${String(photos.length).padStart(2)}img`);
    if (g.dedupe?.verdict === "uncertain") review.push(`${data.team}: ${g.title} — ${g.dedupe.why}`);
    if (g.flagForClient) review.push(`${data.team}: ${g.title} — FLAG FOR CLIENT: ${g.flagForClient}`);
    if (!APPLY) { created++; teamCreated++; continue; }

    const sources = [];
    for (const p of photos) sources.push(await stageAndUpload(p));

    const result = await gql(
      `mutation($input:ProductSetInput!){ productSet(input:$input, synchronous:true){ product{ id handle } userErrors{field message} } }`,
      {
        input: {
          title: g.title,
          handle,
          status: "ACTIVE",
          vendor: "Stadium Supply",
          productType: tier.productType,
          descriptionHtml: DESCRIPTION(g),
          tags: [tier.productType, data.team, "Mapped Media", BATCH_TAG],
          productOptions: [{ name: "Size", values: sizes.map(name => ({ name })) }],
          variants: sizes.map(size => ({
            optionValues: [{ optionName: "Size", name: size }],
            price: tier.price,
            inventoryItem: { tracked: false },
          })),
          files: sources.map((originalSource, i) => ({
            originalSource,
            contentType: "IMAGE",
            alt: `${g.title}${i ? ` — view ${i + 1}` : ""}`,
          })),
        },
      },
    );
    const errs = result.productSet.userErrors;
    if (errs.length) throw new Error(`${handle}: ${JSON.stringify(errs)}`);

    // A publish that fails leaves an ACTIVE, correctly tagged product with zero
    // publications — invisible on the storefront while looking perfectly healthy
    // in the admin. It happened once on an earlier batch and was only caught by
    // counting the storefront feed afterwards, so it is fatal here.
    const published = await gql(
      `mutation($id:ID!,$input:[PublicationInput!]!){ publishablePublish(id:$id, input:$input){ userErrors{field message} } }`,
      { id: result.productSet.product.id, input: publications.map(p => ({ publicationId: p.id })) },
    );
    const pubErrs = published.publishablePublish.userErrors;
    if (pubErrs.length) throw new Error(`${handle}: publish failed ${JSON.stringify(pubErrs)}`);
    created++; teamCreated++;
  }

  if (APPLY && !failed) {
    data.status = "imported";
    writeFileSync(join(TEAMS_DIR, entry.file), JSON.stringify(data, null, 1) + "\n");
  }
  console.log(`  ${teamCreated} created for ${data.team}`);
}

console.log(`\n${APPLY ? "applied" : "dry run"}: ${created} created, ${skipped} already present, ${filed} filed as found on web`);
if (review.length) {
  console.log(`\nREVIEW (${review.length}):`);
  for (const r of review) console.log(`  - ${r}`);
}
