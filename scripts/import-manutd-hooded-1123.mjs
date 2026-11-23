/**
 * Adds the one tracksuit the client sent on 22 Nov 2026 ("Hi can you please add
 * this tracksuit when you can" + "R1200"): Manchester United black hooded
 * full-zip tracksuit, adidas, gold three stripes, royal-blue side panels.
 *
 * R1 200 is the client's own caption — the windbreaker-set tier on the 7 Sep
 * list, same as "2026/27 Manchester United Training Jacket Set". Not a dupe of
 * "Manchester United Black and Yellow Full-Zip Tracksuit" (R1 000): that one has
 * a stand collar and a trefoil; this one is hooded with the performance logo.
 *
 * Usage: node scripts/import-manutd-hooded-1123.mjs <photo.jpg> [more.jpg] [--apply]
 * Idempotent: skips if the handle already exists.
 */
import { readFileSync, statSync } from "node:fs";
import { basename } from "node:path";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .filter(l => l.trim() && !l.trim().startsWith("#") && l.includes("="))
    .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const ENDPOINT = `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-04/graphql.json`;
const APPLY = process.argv.includes("--apply");
const photos = process.argv.slice(2).filter(a => !a.startsWith("--"));
if (!photos.length) throw new Error("pass the photo path(s)");

const TITLE = "Manchester United Black and Gold Hooded Windbreaker Tracksuit";
const HANDLE = "manchester-united-black-and-gold-hooded-windbreaker-tracksuit";
const SIZES = ["S", "M", "L", "XL", "2XL"];
const PRICE = "1200.00";
const TYPE = "Jacket / Windbreaker";
const TAGS = ["Jacket / Windbreaker", "Manchester United", "Mapped Media", "supplied-batch-2026-11-22"];
const DESCRIPTION = [
  "Black woven full-zip windbreaker with a drawcord hood, elastic cuffs and hem, gold three stripes across the shoulders, royal-blue panels at the sides and the club crest in gold on the chest, with matching tapered pants carrying the gold stripes and crest.",
  "Sold as the full set, jacket and pants.",
  "Imported to order from our supplier. Sizes run small — see the size guide before choosing.",
].map(p => `<p>${p}</p>`).join("");

async function gql(query, variables = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": env.SHOPIFY_ADMIN_API_ACCESS_TOKEN },
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

async function upload(path) {
  const filename = basename(path).replace(/[^A-Za-z0-9._-]/g, "_");
  const staged = await gql(
    `mutation($input:[StagedUploadInput!]!){ stagedUploadsCreate(input:$input){ stagedTargets{ url resourceUrl parameters{name value} } userErrors{message} } }`,
    { input: [{ resource: "IMAGE", filename, mimeType: "image/jpeg", httpMethod: "POST", fileSize: String(statSync(path).size) }] },
  );
  const t = staged.stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  for (const p of t.parameters) form.append(p.name, p.value);
  form.append("file", new Blob([readFileSync(path)], { type: "image/jpeg" }), filename);
  const up = await fetch(t.url, { method: "POST", body: form });
  if (!up.ok) throw new Error(`upload failed ${up.status}`);
  return t.resourceUrl;
}

const existing = (await gql(`query($h:String!){ productByHandle(handle:$h){ id } }`, { h: HANDLE })).productByHandle;
if (existing) { console.log(`SKIP ${HANDLE} — already exists`); process.exit(0); }
console.log(`CREATE ${HANDLE} R${PRICE} ${SIZES.length} sizes ${photos.length} img`);
if (!APPLY) { console.log("dry run — add --apply"); process.exit(0); }

const sources = [];
for (const p of photos) sources.push(await upload(p));
const result = await gql(
  `mutation($input:ProductSetInput!){ productSet(input:$input, synchronous:true){ product{ id handle } userErrors{field message} } }`,
  {
    input: {
      title: TITLE, handle: HANDLE, status: "ACTIVE", vendor: "Stadium Supply", productType: TYPE,
      descriptionHtml: DESCRIPTION, tags: TAGS,
      productOptions: [{ name: "Size", values: SIZES.map(name => ({ name })) }],
      variants: SIZES.map(size => ({ optionValues: [{ optionName: "Size", name: size }], price: PRICE, inventoryItem: { tracked: false } })),
      files: sources.map((originalSource, i) => ({ originalSource, contentType: "IMAGE", alt: `${TITLE}${i ? ` — view ${i + 1}` : ""}` })),
    },
  },
);
if (result.productSet.userErrors.length) throw new Error(JSON.stringify(result.productSet.userErrors));
const publications = (await gql(`{ publications(first:20){ nodes{ id } } }`)).publications.nodes;
const pub = await gql(
  `mutation($id:ID!,$input:[PublicationInput!]!){ publishablePublish(id:$id, input:$input){ userErrors{message} } }`,
  { id: result.productSet.product.id, input: publications.map(p => ({ publicationId: p.id })) },
);
if (pub.publishablePublish.userErrors.length) throw new Error(JSON.stringify(pub.publishablePublish.userErrors));
console.log(`created https://stadiumsupply.co.za/product/${HANDLE}`);
console.log("then: npm run seo, rebuild + deploy so the prerendered page exists");
