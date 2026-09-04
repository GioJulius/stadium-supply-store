/**
 * Imports the Bayern Munich, France and Brazil batches the client supplied over
 * WhatsApp on 3 and 4 Sep 2026.
 *
 * Context, from the chat on 2 Sep: the client had checked the storefront and
 * found "the liverpool section is sorted but only that ... from each team
 * there's things missing and more teams", and asked for two things — every team
 * and every product type they sell, and more than one photograph per listing,
 * because "not having 1 image alone, more then 1 to show quality" is what makes
 * a listing look real. Both are honoured here: the batches cover the full range
 * the client sells (fan, player, long sleeve, goalkeeper, retro, kids, training
 * sets, half-zip tracksuits, hoodies and windbreakers) and every group carries
 * every photograph the client sent of that garment.
 *
 * `scripts/team-batches-manifest.json` holds the identification: which
 * photographs belong to which product, the price tier and the size run. Photo
 * numbers are 1-based into the chronological list of the 274 WhatsApp photos
 * saved on 2, 3 and 4 Sep in `media/`; 1-81 are the Inter Milan and Liverpool
 * batches already imported on 2 Sep and this script covers 82-274 only.
 *
 * Idempotent: a handle that already exists is skipped.
 *
 * Usage: node scripts/import-team-batches.mjs [--apply] [--limit N] [--team X]
 */
import { readFileSync, statSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { basename, join } from "node:path";

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

const MEDIA_DIR = "C:/Users/MR GLOBAL/Desktop/GioGlobal/media";
const BATCH_TAG = "supplied-batch-2026-09-04";
const manifest = JSON.parse(readFileSync(new URL("./team-batches-manifest.json", import.meta.url), "utf8"));

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
  title.toLowerCase().replace(/[\u2019']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * The 274 photographs WhatsApp saved on 2, 3 and 4 Sep, in the order they
 * arrived. Sorted on the timestamp the filename carries rather than on the
 * filename itself, so that "10.00 AM" does not sort before "6.24 PM".
 */
const NAME = /^WhatsApp Image (2026-09-0[234]) at (\d{1,2})\.(\d{2})\.(\d{2}) (AM|PM)(?: \((\d+)\))?\.jpeg$/;
const files = (await readdir(MEDIA_DIR))
  .map(f => [f, NAME.exec(f)])
  .filter(([, m]) => m)
  .map(([f, m]) => ({ f, key: [m[1], (Number(m[2]) % 12) + (m[5] === "PM" ? 12 : 0), +m[3], +m[4], +(m[6] ?? 0)] }))
  .sort((a, b) => {
    for (let i = 0; i < a.key.length; i++) {
      if (a.key[i] < b.key[i]) return -1;
      if (a.key[i] > b.key[i]) return 1;
    }
    return 0;
  })
  .map(x => x.f);
if (files.length !== 274) throw new Error(`expected 274 supplied photos on 2-4 Sep, found ${files.length}`);

async function stageAndUpload(path) {
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
  const photos = item.photos.map(i => join(MEDIA_DIR, files[i - 1]));
  console.log(`CREATE  ${handle.padEnd(62)} R${tier.price.padEnd(8)} ${String(sizes.length).padStart(2)} sizes  ${photos.length} photo(s)`);
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

  await gql(
    `mutation($id:ID!,$input:[PublicationInput!]!){ publishablePublish(id:$id, input:$input){ userErrors{field message} } }`,
    { id: result.productSet.product.id, input: publications.map(p => ({ publicationId: p.id })) },
  );
  created++;
}

console.log(`\n${APPLY ? "applied" : "dry run"}: ${created} created, ${skipped} already present`);
