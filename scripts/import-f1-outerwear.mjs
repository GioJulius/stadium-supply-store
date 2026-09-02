/**
 * Imports the F1 team outerwear the client supplied on 31 Aug 2026.
 *
 * Nine photographs arrived over WhatsApp with a single instruction — "R1200" —
 * and no supplier feed, so `scripts/f1-outerwear-manifest.json` carries the
 * identification (read off each garment's livery and sponsor set), the
 * description copy, and which photograph belongs to which product. Two garments
 * were photographed twice, so the nine photos import as seven products.
 *
 * Unlike the rugby batch this names its photos outright rather than indexing a
 * sorted directory: these sit in `media/` alongside hundreds of other WhatsApp
 * files from the same afternoon, so position is not stable.
 *
 * Sizing and tagging follow the outerwear already in the catalogue — S-2XL,
 * productType "Hoodie" / "Half-Zip Training Top" / "Jacket / Windbreaker" — and
 * tags follow the F1 convention already in use ("F1 Jersey" plus the team).
 * Inventory is left untracked like the rest of the catalogue.
 *
 * Every product is tagged `Mapped Media`, which is what the storefront gates on.
 *
 * Idempotent: a handle that already exists is skipped, so a failed run can be
 * repeated without creating doubles.
 *
 * Usage: node scripts/import-f1-outerwear.mjs [--apply] [--limit N]
 */
import { existsSync, readFileSync, statSync } from "node:fs";
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
const manifest = JSON.parse(readFileSync(new URL("./f1-outerwear-manifest.json", import.meta.url), "utf8"));

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

/** Fail before touching Shopify if any supplied photograph has moved. */
for (const item of manifest.products) {
  for (const f of item.files) {
    if (!existsSync(join(MEDIA_DIR, f))) throw new Error(`missing photo: ${f}`);
  }
}

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

const price = manifest.pricing.outerwear;
const sizes = manifest.sizes;
let created = 0, skipped = 0;

for (const item of manifest.products) {
  if (created >= LIMIT) break;
  const handle = slug(item.title);
  const existing = (await gql(`query($h:String!){ productByHandle(handle:$h){ id } }`, { h: handle })).productByHandle;
  if (existing) { console.log(`SKIP    ${handle} — already exists`); skipped++; continue; }

  const photos = item.files.map(f => join(MEDIA_DIR, f));
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
        productType: item.productType,
        descriptionHtml: DESCRIPTION(item),
        tags: ["F1 Jersey", "F1", item.team, "Mapped Media", "f1-outerwear-2026-08"],
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
