/**
 * Imports wave two of the 4 Sep 2026 10.04 PM batch: the five teams wave one
 * skipped because they already had listings on the store - Portugal, Argentina,
 * England, Italy and the Netherlands. 87 products from 115 photographs.
 *
 * Identification, the grouping of album views, the dedupe against every live
 * listing for those five teams, the two flagged assumptions and everything held
 * back live in `scripts/batch-0904c-wave2-manifest.json`. Photographs are staged
 * into `import/batch-0904c` by `scripts/stage-0904c.py`, which must run first -
 * `import/` is gitignored, so staging is reproducible from the export rather
 * than committed.
 *
 * Every product is tagged `Mapped Media`, without which
 * isCustomerFacingMappedProduct() hides it from /shop while the product page
 * still renders - which looks exactly like a caching bug.
 *
 * Idempotent: a handle that already exists is skipped.
 *
 * Usage: node scripts/import-batch-0904c-wave2.mjs [--apply] [--limit N] [--team X]
 */
import { readFileSync, statSync, existsSync } from "node:fs";
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
const LIMIT = Number(process.argv[process.argv.indexOf("--limit") + 1]) || Infinity;
const TEAM = process.argv.includes("--team") ? process.argv[process.argv.indexOf("--team") + 1] : null;

const STAGE_DIR = fileURLToPath(new URL("../import/batch-0904c/", import.meta.url));
const BATCH_TAG = "supplied-batch-2026-09-04c-w2";
const manifest = JSON.parse(readFileSync(new URL("./batch-0904c-wave2-manifest.json", import.meta.url), "utf8"));
const index = JSON.parse(readFileSync(join(STAGE_DIR, "_index.json"), "utf8"));

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

const photoPath = key => {
  const f = index[key];
  if (!f) throw new Error(`photo key ${key} is not in the staged index`);
  const p = join(STAGE_DIR, f);
  if (!existsSync(p)) throw new Error(`staged file missing: ${p}`);
  return p;
};

// The staged upload posts to Google storage, which timed out mid-run on the
// first attempt at this batch. Retry the whole staged-upload round trip rather
// than only the Shopify half of it.
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

const DESCRIPTION = item =>
  `<p>${item.blurb}</p><p>Imported to order from our supplier. Sizes run small — see the size guide before choosing.</p>`;

// Prove every photo key resolves before touching Shopify.
for (const item of manifest.products) item.photos.forEach(photoPath);

const publications = (await gql(`{ publications(first:20){edges{node{id name}}} }`)).publications.edges.map(e => e.node);

let created = 0, skipped = 0;
const wanted = manifest.products.filter(p => !TEAM || p.team.toLowerCase().includes(TEAM.toLowerCase()));

for (const item of wanted) {
  if (created >= LIMIT) break;
  const tier = manifest.tiers[item.tier];
  if (!tier) throw new Error(`${item.title}: unknown tier ${item.tier}`);
  const handle = slug(item.title);
  const existing = (await gql(`query($h:String!){ productByHandle(handle:$h){ id } }`, { h: handle })).productByHandle;
  if (existing) { console.log(`SKIP    ${handle} — already exists`); skipped++; continue; }

  const sizes = manifest.sizes[tier.sizes];
  const photos = item.photos.map(photoPath);
  console.log(`CREATE  ${handle.padEnd(58)} R${tier.price.padEnd(8)} ${String(sizes.length).padStart(2)}sz ${String(photos.length).padStart(2)}img`);
  if (!APPLY) { created++; continue; }

  const sources = [];
  for (const p of photos) sources.push(await stageAndUpload(p));

  const result = await gql(
    `mutation($input:ProductSetInput!){ productSet(input:$input, synchronous:true){ product{ id handle } userErrors{field message} } }`,
    {
      input: {
        title: item.title,
        handle,
        status: "ACTIVE",
        vendor: "Stadium Supply",
        productType: tier.productType,
        descriptionHtml: DESCRIPTION(item),
        tags: [tier.productType, item.team, "Mapped Media", BATCH_TAG],
        productOptions: [{ name: "Size", values: sizes.map(name => ({ name })) }],
        variants: sizes.map(size => ({
          optionValues: [{ optionName: "Size", name: size }],
          price: tier.price,
          inventoryItem: { tracked: false },
        })),
        files: sources.map((originalSource, i) => ({
          originalSource,
          contentType: "IMAGE",
          alt: `${item.title}${i ? ` — view ${i + 1}` : ""}`,
        })),
      },
    },
  );
  const errs = result.productSet.userErrors;
  if (errs.length) throw new Error(`${handle}: ${JSON.stringify(errs)}`);

  // A publish that fails leaves an ACTIVE, correctly tagged product with zero
  // publications — invisible on the storefront while looking perfectly healthy
  // in the admin. It happened once in this batch and was only caught by
  // counting the storefront feed afterwards, so it is fatal here now.
  const published = await gql(
    `mutation($id:ID!,$input:[PublicationInput!]!){ publishablePublish(id:$id, input:$input){ userErrors{field message} } }`,
    { id: result.productSet.product.id, input: publications.map(p => ({ publicationId: p.id })) },
  );
  const pubErrs = published.publishablePublish.userErrors;
  if (pubErrs.length) throw new Error(`${handle}: publish failed ${JSON.stringify(pubErrs)}`);
  created++;
}

console.log(`\n${APPLY ? "applied" : "dry run"}: ${created} created, ${skipped} already present`);
