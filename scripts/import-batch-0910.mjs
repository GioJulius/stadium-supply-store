/**
 * Imports the 10 Sep 2026 batch — the 30 photographs the client sent at 23:10
 * under "Please add these items".
 *
 * Two manifests, both written by eye and both tracked:
 *   scripts/batch-0910/batch.json     tiers, size runs, batch tag
 *   scripts/batch-0910/garments.json  the garments, their photographs and copy
 *
 * Photographs are resolved by the p-KEY out of import/batch-0910-raw/_files.json,
 * never by position in a directory listing. A positional table stops being
 * idempotent after its first run; a key is tied to a filename and survives one.
 *
 * Five garments were photographed twice (front/back, or set plus close-up) and
 * are ONE listing with two images. The first key in `keys` is the lead photo —
 * that is the picture the shop grid shows, and the client's standing complaint
 * is about exactly that, so the order in the manifest is deliberate.
 *
 * The `updates` block is the other half of this batch: a garment that turned out
 * to be already listed. Its photographs are appended to the existing product
 * rather than creating a second listing of the same shirt. Appending is made
 * idempotent by stamping `alt: "batch-0910"` on the created media and testing
 * for it — productCreateMedia copies the file and mints a NEW cdn url, so
 * comparing urls can never tell you whether you have already run.
 *
 * Every product is tagged `Mapped Media`, without which
 * isCustomerFacingMappedProduct() hides it from /shop while the product page
 * still renders — which looks exactly like a caching bug.
 *
 * Idempotent: a handle that already exists is skipped.
 *
 * Usage: node scripts/import-batch-0910.mjs [--apply] [--limit N] [--only <id>]
 */
import { readFileSync, writeFileSync, statSync, existsSync } from "node:fs";
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
const ONLY = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;

const DIR = fileURLToPath(new URL("./batch-0910/", import.meta.url));
const RAW = fileURLToPath(new URL("../import/batch-0910-raw/", import.meta.url));

const batch = JSON.parse(readFileSync(join(DIR, "batch.json"), "utf8"));
const manifest = JSON.parse(readFileSync(join(DIR, "garments.json"), "utf8"));
const BATCH_TAG = batch.batchTag;
const MEDIA_STAMP = "batch-0910";

const photos = Object.fromEntries(
  JSON.parse(readFileSync(join(RAW, "_files.json"), "utf8")).map(r => [r.key, join(RAW, r.file)]),
);

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

// The staged upload posts to Google storage, which has timed out mid-run before.
// Retry the whole round trip, not only the Shopify half of it.
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

/**
 * The blurb says what the garment is; the context says why it is that. Both are
 * written per garment in the manifest. The closing paragraph is the client's own
 * ordering line, the same one the rest of the catalogue carries.
 */
const DESCRIPTION = g =>
  [g.blurb, g.context, "Imported to order from our supplier. Sizes run small — see the size guide before choosing."]
    .filter(Boolean)
    .map(p => `<p>${p}</p>`)
    .join("");

const F1_MARQUES = new Set(["Scuderia Ferrari", "BMW Sauber", "Porsche", "Red Bull Racing"]);

const tagsFor = g => {
  const tier = batch.tiers[g.tier];
  const tags = [tier.productType, g.team, "Mapped Media", BATCH_TAG];
  // Porsche is sports-car racing, not Formula 1 — but the client sells it inside
  // the "F1 jackets" message and the shop's sport facet has nowhere else to put
  // a single motorsport listing, so it carries the same tag. The garment's own
  // description says what it actually is.
  if (F1_MARQUES.has(g.team)) tags.push("Formula 1");
  return [...new Set(tags)].sort();
};

const targets = manifest.garments.filter(g => !ONLY || g.id === ONLY);

// ---- checks before anything is written -------------------------------------

for (const g of [...manifest.garments, ...manifest.updates]) {
  for (const k of g.keys) {
    if (!photos[k]) throw new Error(`${g.id}: no such photo key ${k}`);
    if (!existsSync(photos[k])) throw new Error(`${g.id}: photo missing on disk: ${photos[k]}`);
  }
}
for (const g of manifest.garments) {
  if (!batch.tiers[g.tier]) throw new Error(`${g.id}: unknown tier ${g.tier}`);
}

// A duplicate title does NOT error in Shopify — the catalogue just ends up with
// two listings under one name and reads as correct while being wrong. That is
// how several listings got mislabelled in the first place, so build the POST
// state of every title in this batch and refuse to write if any would collide.
{
  const seen = new Map();
  for (const g of manifest.garments) {
    const key = g.title.toLowerCase();
    if (seen.has(key)) throw new Error(`two garments share a title: ${g.id} and ${seen.get(key)} — ${g.title}`);
    seen.set(key, g.id);
  }
  for (const u of manifest.updates) {
    if (!u.retitle) continue;
    const key = u.retitle.toLowerCase();
    if (seen.has(key)) throw new Error(`${u.id} retitles onto a title this batch creates: ${u.retitle}`);
    seen.set(key, u.id);
  }
  // A title already live under the very handle this entry owns is this batch's
  // own earlier run, not a collision — the guard has to let a re-run through or
  // it can only ever be used once.
  const live = await listTitles();
  for (const [key, id] of seen) {
    const clash = live.get(key);
    if (!clash) continue;
    const u = manifest.updates.find(x => x.id === id);
    if (u && clash === u.handle) continue;
    const g = manifest.garments.find(x => x.id === id);
    if (g && clash === (g.handle ?? slug(g.title))) continue;
    throw new Error(`${id} would collide with live product ${clash}: ${key}`);
  }
}

async function listTitles() {
  const out = new Map();
  let cursor = null;
  for (;;) {
    const page = await gql(
      `query($c:String){ products(first:250, after:$c, query:"status:active"){ pageInfo{hasNextPage endCursor} nodes{ handle title } } }`,
      { c: cursor },
    );
    for (const n of page.products.nodes) out.set(n.title.toLowerCase(), n.handle);
    if (!page.products.pageInfo.hasNextPage) return out;
    cursor = page.products.pageInfo.endCursor;
  }
}

// ---- create -----------------------------------------------------------------

const publications = (await gql(`{ publications(first:20){edges{node{id name}}} }`)).publications.edges.map(e => e.node);

let created = 0, skipped = 0;

for (const g of targets) {
  if (created >= LIMIT) break;
  const tier = batch.tiers[g.tier];
  const handle = g.handle ?? slug(g.title);
  const sizes = batch.sizes[tier.sizes];
  const files = g.keys.map(k => photos[k]);

  const existing = (await gql(`query($h:String!){ productByHandle(handle:$h){ id } }`, { h: handle })).productByHandle;
  if (existing) { console.log(`SKIP   ${handle} — already exists`); skipped++; continue; }

  console.log(`CREATE ${handle.padEnd(58)} R${tier.price.padEnd(8)} ${String(sizes.length).padStart(2)}sz ${files.length}img  ${tier.productType}`);
  if (!APPLY) { created++; continue; }

  const sources = [];
  for (const p of files) sources.push(await stageAndUpload(p));

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
        tags: tagsFor(g),
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
  // in the admin. Fatal here, because nothing downstream would catch it.
  const published = await gql(
    `mutation($id:ID!,$input:[PublicationInput!]!){ publishablePublish(id:$id, input:$input){ userErrors{field message} } }`,
    { id: result.productSet.product.id, input: publications.map(p => ({ publicationId: p.id })) },
  );
  if (published.publishablePublish.userErrors.length) {
    throw new Error(`${handle}: publish failed ${JSON.stringify(published.publishablePublish.userErrors)}`);
  }
  created++;
}

// ---- update existing listings ----------------------------------------------

let appended = 0, retitled = 0, already = 0;

for (const u of ONLY ? manifest.updates.filter(x => x.id === ONLY) : manifest.updates) {
  const p = (await gql(
    `query($h:String!){ productByHandle(handle:$h){ id title media(first:50){ nodes{ alt } } } }`,
    { h: u.handle },
  )).productByHandle;
  if (!p) throw new Error(`${u.id}: no live product at handle ${u.handle}`);

  const stamped = p.media.nodes.some(m => (m.alt ?? "").includes(MEDIA_STAMP));
  const needsTitle = u.retitle && p.title !== u.retitle;

  if (stamped && !needsTitle) { console.log(`SKIP   ${u.handle} — already updated`); already++; continue; }
  console.log(`UPDATE ${u.handle.padEnd(58)} ${stamped ? "" : `+${u.keys.length}img `}${needsTitle ? `retitle → ${u.retitle}` : ""}`);
  if (!APPLY) continue;

  if (!stamped) {
    const media = [];
    for (const k of u.keys) {
      media.push({
        originalSource: await stageAndUpload(photos[k]),
        mediaContentType: "IMAGE",
        alt: `${u.retitle ?? p.title} — ${MEDIA_STAMP} ${k}`,
      });
    }
    const res = await gql(
      `mutation($id:ID!,$media:[CreateMediaInput!]!){ productCreateMedia(productId:$id, media:$media){ mediaUserErrors{field message} } }`,
      { id: p.id, media },
    );
    if (res.productCreateMedia.mediaUserErrors.length) {
      throw new Error(`${u.handle}: ${JSON.stringify(res.productCreateMedia.mediaUserErrors)}`);
    }
    appended++;
  }
  if (needsTitle) {
    const res = await gql(
      `mutation($input:ProductInput!){ productUpdate(input:$input){ userErrors{field message} } }`,
      { input: { id: p.id, title: u.retitle } },
    );
    if (res.productUpdate.userErrors.length) throw new Error(`${u.handle}: ${JSON.stringify(res.productUpdate.userErrors)}`);
    retitled++;
  }
}

if (APPLY && !ONLY && created + skipped === manifest.garments.length) {
  manifest.status = "imported";
  writeFileSync(join(DIR, "garments.json"), JSON.stringify(manifest, null, 1) + "\n");
}

console.log(
  `\n${APPLY ? "applied" : "dry run"}: ${created} created, ${skipped} already present; ` +
  `${appended} listings gained photos, ${retitled} retitled, ${already} updates already done`,
);
console.log("after an apply: npm run seo, then commit scripts/seo-snapshot.json");
