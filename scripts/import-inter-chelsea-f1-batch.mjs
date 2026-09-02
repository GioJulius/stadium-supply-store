/**
 * Imports the batch the client supplied on 2 Sep 2026.
 *
 * 147 photographs arrived over WhatsApp in two sends and were saved to
 * "stadium supply media/products/". Unlike the Liverpool batch, none of them
 * carried a price caption, so every price comes from the client's own tier
 * table in client-pricing-and-sizing-audit.md rather than from the chat.
 *
 * `scripts/inter-chelsea-f1-manifest.json` carries the identification, the
 * tier, the price and which photograph belongs to which product. It resolves
 * to 77 products across four groups: a Chelsea run (26/27 home, away and
 * third plus a deep retro shelf), F1 teamwear (five 2026 team jackets and a
 * row of team tees), a large Inter Milan run (26/27 home, away and third,
 * 25/26 away and third, nine retros, training kit and hoodies), and the
 * Liverpool 26/27 third in adult and kids.
 *
 * Ten photographs are held back rather than imported because the client
 * already has a listing for that exact garment — the Ferrari team jacket, the
 * Mercedes polo, the McLaren geometric tee, the Chelsea 25/26 home fan shirt
 * and both Munich-final 2011/12 shirts. Those are recorded under `heldBack`
 * in the manifest and left alone.
 *
 * Photo indices 1-147 follow the chronological order of the WhatsApp filename
 * timestamps — the order they arrived in the chat. `orderedFiles()` below
 * parses the time out of each filename rather than sorting the strings,
 * because a plain sort puts "... 6.29.00 PM (1).jpeg" before
 * "... 6.29.00 PM.jpeg" and would shift every paired front/back photo.
 *
 * Where the garment could be matched by eye to an album in the ezfashion supplier
 * catalogue, up to three of the supplier's own studio photographs are appended
 * after the client's — front, back and a detail crop. They live in
 * "stadium supply media/supplier" and are named <album id>_<n>.jpg. Supplier
 * size charts (both the near-white text pages and the photographic F1 one) and
 * images repeated across albums are filtered out before download. 49 of the 77
 * products carry extras; the rest had no confident match and ship with the
 * client photographs alone.
 *
 * Idempotent: a handle that already exists is skipped.
 *
 * Usage: node scripts/import-inter-chelsea-f1-batch.mjs [--apply] [--limit N]
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

const MEDIA_DIR = "C:/Users/MR GLOBAL/Desktop/GioGlobal/stadium supply media/products";
const SUPPLIER_DIR = "C:/Users/MR GLOBAL/Desktop/GioGlobal/stadium supply media/supplier";
const manifest = JSON.parse(readFileSync(new URL("./inter-chelsea-f1-manifest.json", import.meta.url), "utf8"));

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

/** Chronological order of the WhatsApp filenames — see the header note on why this is not a string sort. */
async function orderedFiles() {
  const parse = name => {
    const m = /at (\d+)\.(\d+)\.(\d+) (AM|PM)(?: \((\d+)\))?/.exec(name);
    if (!m) throw new Error(`unparseable supplied filename: ${name}`);
    let hour = Number(m[1]);
    if (m[4] === "PM" && hour !== 12) hour += 12;
    if (m[4] === "AM" && hour === 12) hour = 0;
    return [hour, Number(m[2]), Number(m[3]), Number(m[5] ?? 0)];
  };
  const files = (await readdir(MEDIA_DIR)).filter(f => f.endsWith(".jpeg"));
  return files
    .map(f => ({ f, k: parse(f) }))
    .sort((a, b) => a.k[0] - b.k[0] || a.k[1] - b.k[1] || a.k[2] - b.k[2] || a.k[3] - b.k[3])
    .map(x => x.f);
}

const files = await orderedFiles();
if (files.length !== 147) throw new Error(`expected 147 supplied photos, found ${files.length}`);

/** Tag each product with its club or series so the storefront filters keep working. */
const groupOf = title => {
  if (/^Chelsea/.test(title)) return "Chelsea";
  if (/^Inter Milan/.test(title)) return "Inter Milan";
  if (/^Liverpool/.test(title)) return "Liverpool";
  return "Formula 1";
};

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
  const clientPhotos = item.photos.map(i => join(MEDIA_DIR, files[i - 1]));
  const supplierPhotos = (item.supplierPhotos?.files ?? []).map(f => join(SUPPLIER_DIR, f));
  const photos = [...clientPhotos, ...supplierPhotos];
  console.log(
    `CREATE  ${handle.padEnd(58)} R${item.price.padEnd(8)} ${String(sizes.length).padStart(2)} sizes  ` +
    `${clientPhotos.length} client + ${supplierPhotos.length} supplier photo(s)`,
  );
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
        tags: [item.productType, groupOf(item.title), "Mapped Media", "supplied-batch-2026-09-02"],
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
const heldPhotos = manifest.heldBack.reduce((n, h) => n + h.photos.length, 0);
console.log(`held back (already listed, see manifest.heldBack): ${heldPhotos} photos across ${manifest.heldBack.length} garments`);
