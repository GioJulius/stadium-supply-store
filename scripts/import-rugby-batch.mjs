/**
 * Imports the rugby batch the client supplied on 31 Aug 2026.
 *
 * The client sent 30 photographs over WhatsApp with a price list rather than a
 * supplier feed, so there is no scrape to run: `scripts/rugby-batch-manifest.json`
 * carries the identification (read off each jersey's crest and sponsor), the
 * price tier, and which photograph belongs to which product. Two jerseys were
 * photographed twice and import as one product with both photos, and one photo
 * was dropped because that jersey is already listed.
 *
 * Sizing and tagging follow the five rugby jerseys already in the catalogue —
 * S-5XL, productType "Rugby Jersey", tagged with the team — so these sit
 * alongside them rather than forming a second convention. Inventory is left
 * untracked like the rest of the catalogue, since nothing is held on hand.
 *
 * Every product is tagged `Mapped Media`, which is what the storefront gates
 * on, because unlike the batches hidden earlier these all have a proper
 * photograph of the garment.
 *
 * Idempotent: a handle that already exists is skipped, so a failed run can be
 * repeated without creating doubles.
 *
 * Usage: node scripts/import-rugby-batch.mjs [--apply] [--limit N]
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

const MEDIA_DIR = "C:/Users/MR GLOBAL/Desktop/GioGlobal/stadium supply media";
const manifest = JSON.parse(readFileSync(new URL("./rugby-batch-manifest.json", import.meta.url), "utf8"));

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

/** Photographs arrive named by WhatsApp timestamp; the manifest indexes them in that order. */
const files = (await readdir(MEDIA_DIR)).filter(f => f.includes("2026-08-31") && f.endsWith(".jpeg")).sort();
if (files.length !== 30) throw new Error(`expected 30 supplied photos, found ${files.length}`);

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

const DESCRIPTION = team =>
  `<p>${team} rugby jersey, imported to order from our supplier. Sizes run small — see the size guide before choosing.</p>`;

const publications = (await gql(`{ publications(first:20){edges{node{id name}}} }`)).publications.edges.map(e => e.node);

let created = 0, skipped = 0;

for (const item of manifest.products) {
  if (created >= LIMIT) break;
  const handle = slug(item.title);
  const existing = (await gql(`query($h:String!){ productByHandle(handle:$h){ id } }`, { h: handle })).productByHandle;
  if (existing) { console.log(`SKIP    ${handle} — already exists`); skipped++; continue; }

  const price = manifest.pricing[item.tier];
  const sizes = item.tier === "kids" ? manifest.sizes.kids : manifest.sizes.adult;
  const photos = item.photos.map(i => join(MEDIA_DIR, files[i]));
  console.log(`CREATE  ${handle}  R${price}  ${sizes.length} sizes  ${photos.length} photo(s)`);
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
        productType: item.tier === "jacket" ? "Jacket" : item.tier === "vest" ? "Rugby Vest" : "Rugby Jersey",
        descriptionHtml: DESCRIPTION(item.team),
        tags: ["Rugby Jersey", "Rugby", item.team, "Mapped Media", "rugby-batch-2026-08"],
        productOptions: [{ name: "Size", values: sizes.map(name => ({ name })) }],
        variants: sizes.map(size => ({
          optionValues: [{ optionName: "Size", name: size }],
          price,
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
