/**
 * Imports the Liverpool batch the client supplied on 1 Sep 2026.
 *
 * 38 photographs arrived over WhatsApp, nearly all with a price caption, so
 * `scripts/liverpool-batch-manifest.json` carries the identification, the
 * caption price, the tier and which photograph belongs to which product.
 * Photos 3 and 4 are the front and back of one reversible retro jacket.
 *
 * Ten of the 38 are held back rather than imported: the client already has a
 * listing for that exact garment, sometimes twice, and several of those sit at
 * the wrong price (R450 on the old S-XL imports where the client's own list
 * says R500). Those want a correction to the existing listing, not a second
 * one, so they are recorded under `heldBack` in the manifest and left alone.
 *
 * Photos are indexed 1-38 in the manifest, matching the sorted filename order
 * of the 2026-09-01 files in `media/` — the same order they arrived in the chat.
 *
 * Prices and sizes follow the tier table already in the catalogue, which the
 * client's captions land on exactly: fan R500 S-4XL, fan long sleeve R600
 * S-4XL, player R650 / long sleeve R750 S-2XL, retro R700 S-2XL, hoodie and
 * half-zip R850, jacket R1000, training set R700, kids R450.
 *
 * Idempotent: a handle that already exists is skipped.
 *
 * Usage: node scripts/import-liverpool-batch.mjs [--apply] [--limit N]
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

const MEDIA_DIR = "C:/Users/MR GLOBAL/Desktop/GioGlobal/media";
const manifest = JSON.parse(readFileSync(new URL("./liverpool-batch-manifest.json", import.meta.url), "utf8"));

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
  title.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** The batch is the 38 files WhatsApp saved on 1 Sep; manifest photo numbers are 1-based into this. */
const files = (await readdir(MEDIA_DIR)).filter(f => f.includes("2026-09-01") && f.endsWith(".jpeg")).sort();
if (files.length !== 38) throw new Error(`expected 38 supplied photos, found ${files.length}`);

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

for (const item of manifest.products) {
  if (created >= LIMIT) break;
  const handle = slug(item.title);
  const existing = (await gql(`query($h:String!){ productByHandle(handle:$h){ id } }`, { h: handle })).productByHandle;
  if (existing) { console.log(`SKIP    ${handle} — already exists`); skipped++; continue; }

  const sizes = manifest.sizes[item.sizes];
  const photos = item.photos.map(i => join(MEDIA_DIR, files[i - 1]));
  console.log(`CREATE  ${handle.padEnd(58)} R${item.price.padEnd(8)} ${String(sizes.length).padStart(2)} sizes  ${photos.length} photo(s)`);
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
        productType: item.productType,
        descriptionHtml: DESCRIPTION(item),
        tags: [item.productType, "Liverpool", "Mapped Media", "liverpool-batch-2026-09"],
        productOptions: [{ name: "Size", values: sizes.map(name => ({ name })) }],
        variants: sizes.map(size => ({
          optionValues: [{ optionName: "Size", name: size }],
          price: item.price,
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
console.log(`held back (already listed, see manifest.heldBack): ${manifest.heldBack.length} photos`);
