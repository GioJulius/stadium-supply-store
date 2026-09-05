/**
 * The client's WhatsApp feedback of 5 Sep 2026, applied to the catalogue.
 *
 * Four of the five things they raised are data, and live here. The fifth — "no
 * option for name and number" on player-version shirts — is code, and is fixed
 * in `client/src/lib/catalog.ts` (`isPersonalisable`).
 *
 * 1. LEAD IMAGES. "Lots of issues like these, where we can't see the first
 *    picture." Nine listings led on a hangtag, a size chart or a fabric
 *    close-up. Each one already has a whole-garment photograph further down its
 *    gallery, so this reorders the gallery rather than uploading anything.
 *
 * 2. THE JACKET WITH THE PANTS. "Can the first picture be the jacket with the
 *    pants." Two Real Madrid sets led on the top alone. Same fix: a photo of
 *    the full set exists in both galleries.
 *
 * 3. TEN LISTINGS GET A WHOLE-GARMENT LEAD THEY DID NOT HAVE. These are the
 *    photographs held out of the 4 Sep import as duplicates of an existing
 *    listing (see batch-0904c-wave2-record.md). Five of those listings have no
 *    garment shot at all — every image is a tag or a close-up — so the held
 *    photograph becomes the lead. The other five are appended as extra views,
 *    which is also the client's standing complaint about single-photo listings.
 *
 * 4. WOMEN'S SHIRTS. "We also don't sell women jerseys all jerseys are unisex."
 *    Two titles still said Women's. The garments are already sold on the unisex
 *    size run, so this is a retitle, not a delisting — and these two ARE the
 *    only listing for their kit.
 *
 * 5. A RETRO THAT IS A HALF ZIP. "This isn't a retro it's a half zip."
 *    Correct: the photograph shows a quarter-zip collar and a pair of pants.
 *    Retitled and reclassified. NOTE the price is left at R800 — every other
 *    half-zip set on the store is R850, and moving it is the client's call.
 *
 * Idempotent throughout. Reorders are computed from media IDs, uploads are
 * skipped when a photo with the same alt text is already on the product, and
 * text edits are skipped when the value already matches.
 *
 * Usage: node scripts/fix-client-feedback-0905.mjs [--apply]
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .filter(l => l.trim() && !l.trim().startsWith("#") && l.includes("="))
    .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const ENDPOINT = `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-04/graphql.json`;
const TOKEN = env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
const APPLY = process.argv.includes("--apply");
const STAGE_DIR = fileURLToPath(new URL("../import/batch-0904c/", import.meta.url));

/**
 * Promote an existing gallery image to the lead.
 *
 * The target is named by FILENAME, not by position. A position is only true of
 * the order it was read in, so a positional table stops being idempotent the
 * moment it runs once — that is what made `scripts/promote-lead-image.mjs`
 * unsafe to re-run, and it must not be repeated here.
 */
const PROMOTE = [
  ["2024-uefa-italy-home-player-version", "162684643_04.jpg", "led on a fabric close-up"],
  ["2024-uefa-netherlands-home-fan-version", "162679048_03.jpg", "led on a fabric close-up"],
  ["2025-26-ac-milan-away-player-version1", "203699927_06.jpg", "led on a Puma FOREVER BETTER hangtag"],
  ["2026-italy-half-zip-training-set", "235379604_07.jpg", "led on a sleeve close-up; now the top with the pants"],
  ["2026-world-cup-netherlands-half-zip-training-set", "235397757_07.jpg", "led on the pants alone; now the top with the pants"],
  ["2026-27-real-madrid-training-jacket-set", "251843947_05.jpg", "client asked for the jacket with the pants"],
  ["2025-26-real-madrid-marvel-white-half-zip-training-set", "221483834_06.jpg", "client asked for the top with the pants"],
];

/** Held-back photographs from the 4 Sep batch, and where they belong. */
const APPEND = [
  ["2026-italy-away-long-sleeve-player-version", "p97", true, "no garment photo at all — every image was a tag or a close-up"],
  ["2026-world-cup-netherlands-away-fan-version", "p104", true, "no garment photo at all"],
  ["2026-world-cup-netherlands-home-kids-kit", "p105", true, "no garment photo at all"],
  ["2026-world-cup-netherlands-away-player-version", "p109", true, "no garment photo at all"],
  ["2026-world-cup-netherlands-home-player-version", "p110", true, "no garment photo at all"],
  ["portugal-2024-25-home-jersey", "p21", false, "extra view"],
  ["england-2024-25-home-jersey", "p82", false, "extra view — the listing had one photograph"],
  ["2026-world-cup-argentina-half-zip-training-set", "p43", false, "extra view"],
  ["argentina-2010-away-retro-jersey-filigree", "p55", false, "extra view"],
  ["2026-italy-home-kids-kit", "p96", false, "extra view"],
];

const RETITLE = [
  // Not something the client raised — found while fixing this listing's lead
  // image. It is the only title on the store with an import artefact in it.
  ["2025-26-ac-milan-away-player-version1", { title: "2025/26 AC Milan Away Player Version" }],
  ["2026-27-real-madrid-third-womens-shirt", { title: "2026/27 Real Madrid Third Shirt" }],
  ["2026-27-real-madrid-away-womens-shirt", { title: "2026/27 Real Madrid Away Shirt" }],
  [
    "real-madrid-2013-14-third-retro-long-sleeve-pants",
    {
      title: "Real Madrid Retro Half-Zip Training Set (white and purple)",
      productType: "Half-Zip Training Set",
      retag: { drop: ["Soccer Retro"], add: ["Half-Zip Training Set"] },
      descriptionHtml:
        "<p>The white adidas Originals quarter-zip top with the purple three stripes and the club crest, and the matching purple pants.</p>" +
        "<p>Imported to order from our supplier. Sizes run small — see the size guide before choosing.</p>",
    },
  ],
];

/**
 * Two galleries where the supplier's `_01` is the GARMENT, not a size chart.
 *
 * orderGalleryImages() in shopifyNormalize.ts demotes every `_01` to the end.
 * That is right for the other 120 supplier galleries on this store — the sample
 * is overwhelmingly size charts — but wrong for these two, where it buries the
 * only whole-garment shot and leads on the close-up that follows it. Rather
 * than loosen a rule that is correct almost everywhere, re-upload that
 * photograph under a filename the rule leaves alone and put the copy first.
 * The original stays in the gallery, at the end.
 */
const RECOPY = [
  ["2025-26-galatasaray-s-k-third-fan-version", "led on a collar close-up; its only garment shot is the demoted _01"],
  ["2026-world-cup-netherlands-away-kids-kit", "led on a hem close-up; its only garment shot is the demoted _01"],
];

const SIZE_CHART_FILENAME = /\/\d{4,}_0*1\.(?:jpe?g|png|webp)(?:$|\?)/i;

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

const PRODUCT = `query($h:String!){ productByHandle(handle:$h){ id title productType tags
  media(first:50){ edges{ node{ id mediaContentType alt ... on MediaImage { image { url } } } } } } }`;

async function load(handle) {
  const p = (await gql(PRODUCT, { h: handle })).productByHandle;
  if (!p) throw new Error(`${handle}: not on the store`);
  p.mediaList = p.media.edges.map(e => ({ id: e.node.id, alt: e.node.alt ?? "", url: e.node.image?.url ?? "" }));
  return p;
}

async function reorder(product, ids) {
  const moves = ids.map((id, newPosition) => ({ id, newPosition: String(newPosition) }));
  const r = await gql(
    `mutation($id:ID!,$moves:[MoveInput!]!){ productReorderMedia(id:$id, moves:$moves){ userErrors{field message} } }`,
    { id: product.id, moves },
  );
  const errs = r.productReorderMedia.userErrors;
  if (errs.length) throw new Error(`${product.title}: reorder ${JSON.stringify(errs)}`);
}

async function stageAndUpload(path) {
  const bytes = readFileSync(path);
  const filename = path.split(/[\\/]/).pop();
  for (let attempt = 0; ; attempt++) {
    try {
      const staged = await gql(
        `mutation($input:[StagedUploadInput!]!){ stagedUploadsCreate(input:$input){ stagedTargets{ url resourceUrl parameters{name value} } userErrors{field message} } }`,
        { input: [{ resource: "IMAGE", filename, mimeType: "image/jpeg", httpMethod: "POST", fileSize: String(bytes.length) }] },
      );
      if (staged.stagedUploadsCreate.userErrors.length) throw new Error(JSON.stringify(staged.stagedUploadsCreate.userErrors));
      const target = staged.stagedUploadsCreate.stagedTargets[0];
      const form = new FormData();
      for (const p of target.parameters) form.append(p.name, p.value);
      form.append("file", new Blob([bytes], { type: "image/jpeg" }), filename);
      const up = await fetch(target.url, { method: "POST", body: form });
      if (!up.ok) throw new Error(`staged upload ${up.status}`);
      return target.resourceUrl;
    } catch (err) {
      if (attempt >= 5) throw err;
      await new Promise(r => setTimeout(r, 4000 * (attempt + 1)));
    }
  }
}

let changed = 0;

console.log("== 1/4  lead images: promote a garment photo the gallery already has");
for (const [handle, filename, why] of PROMOTE) {
  const product = await load(handle);
  const wanted = product.mediaList.find(m => m.url.split("/").pop().split("?")[0] === filename);
  if (!wanted) throw new Error(`${handle}: ${filename} is not in the gallery`);
  if (product.mediaList[0].id === wanted.id) { console.log(`SKIP    ${handle} — already leads correctly`); continue; }
  console.log(`LEAD    ${handle.padEnd(52)} -> ${filename}  (${why})`);
  if (APPLY) await reorder(product, [wanted.id, ...product.mediaList.filter(m => m.id !== wanted.id).map(m => m.id)]);
  changed++;
}

console.log("\n== 2/4  held-back batch photographs onto the listings they belong to");
for (const [handle, key, asLead, why] of APPEND) {
  const path = join(STAGE_DIR, `p${String(Number(key.slice(1))).padStart(3, "0")}.jpg`);
  if (!existsSync(path)) throw new Error(`${key}: not staged — run python scripts/stage-0904c.py first`);
  const alt = `supplied-batch-2026-09-04c ${key}`;
  const product = await load(handle);
  const already = product.mediaList.find(m => m.alt === alt);
  if (already && (!asLead || product.mediaList[0].id === already.id)) { console.log(`SKIP    ${handle} — ${key} already there`); continue; }
  console.log(`${asLead ? "LEAD  " : "ADD   "}  ${handle.padEnd(52)} <- ${key}  (${why})`);
  if (!APPLY) { changed++; continue; }
  let id = already?.id;
  if (!id) {
    const source = await stageAndUpload(path);
    const r = await gql(
      `mutation($id:ID!,$media:[CreateMediaInput!]!){ productCreateMedia(productId:$id, media:$media){ media{ ... on MediaImage { id } } mediaUserErrors{field message} } }`,
      { id: product.id, media: [{ originalSource: source, mediaContentType: "IMAGE", alt }] },
    );
    const errs = r.productCreateMedia.mediaUserErrors;
    if (errs.length) throw new Error(`${handle}: ${JSON.stringify(errs)}`);
    id = r.productCreateMedia.media[0].id;
  }
  if (asLead) {
    // productCreateMedia is asynchronous — the media is READY a moment later,
    // and reordering it before then is rejected. Re-read until it appears.
    for (let i = 0; i < 12; i++) {
      const fresh = await load(handle);
      if (fresh.mediaList.some(m => m.id === id)) {
        await reorder(fresh, [id, ...fresh.mediaList.filter(m => m.id !== id).map(m => m.id)]);
        break;
      }
      await new Promise(r => setTimeout(r, 2500));
    }
  }
  changed++;
}

console.log("\n== 3/4  galleries where the supplier's _01 is the garment, not a size chart");
for (const [handle, why] of RECOPY) {
  const alt = "lead copy of the demoted _01";
  const product = await load(handle);
  const already = product.mediaList.find(m => m.alt === alt);
  if (already && product.mediaList[0].id === already.id) { console.log(`SKIP    ${handle} — already fixed`); continue; }
  const source = product.mediaList.find(m => SIZE_CHART_FILENAME.test(m.url));
  if (!source) throw new Error(`${handle}: no _01 image to copy`);
  console.log(`COPY    ${handle.padEnd(52)} (${why})`);
  if (!APPLY) { changed++; continue; }
  let id = already?.id;
  if (!id) {
    const res = await fetch(source.url);
    if (!res.ok) throw new Error(`${handle}: could not read ${source.url}`);
    const tmp = join(STAGE_DIR, `${handle}-lead.jpg`);
    writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
    const uploaded = await stageAndUpload(tmp);
    const r = await gql(
      `mutation($id:ID!,$media:[CreateMediaInput!]!){ productCreateMedia(productId:$id, media:$media){ media{ ... on MediaImage { id } } mediaUserErrors{field message} } }`,
      { id: product.id, media: [{ originalSource: uploaded, mediaContentType: "IMAGE", alt }] },
    );
    if (r.productCreateMedia.mediaUserErrors.length) throw new Error(`${handle}: ${JSON.stringify(r.productCreateMedia.mediaUserErrors)}`);
    id = r.productCreateMedia.media[0].id;
  }
  for (let i = 0; i < 12; i++) {
    const fresh = await load(handle);
    if (fresh.mediaList.some(m => m.id === id)) {
      await reorder(fresh, [id, ...fresh.mediaList.filter(m => m.id !== id).map(m => m.id)]);
      break;
    }
    await new Promise(r => setTimeout(r, 2500));
  }
  changed++;
}

console.log("\n== 4/4  titles the client corrected");
for (const [handle, edit] of RETITLE) {
  const product = await load(handle);
  const needs =
    product.title !== edit.title ||
    (edit.productType && product.productType !== edit.productType) ||
    (edit.retag && edit.retag.drop.some(t => product.tags.includes(t)));
  if (!needs) { console.log(`SKIP    ${handle} — already correct`); continue; }
  console.log(`TITLE   ${handle.padEnd(52)} -> ${edit.title}`);
  if (!APPLY) { changed++; continue; }
  const input = { id: product.id, title: edit.title };
  if (edit.productType) input.productType = edit.productType;
  if (edit.descriptionHtml) input.descriptionHtml = edit.descriptionHtml;
  if (edit.retag) {
    input.tags = [...product.tags.filter(t => !edit.retag.drop.includes(t)), ...edit.retag.add.filter(t => !product.tags.includes(t))];
  }
  const r = await gql(`mutation($input:ProductInput!){ productUpdate(input:$input){ userErrors{field message} } }`, { input });
  if (r.productUpdate.userErrors.length) throw new Error(`${handle}: ${JSON.stringify(r.productUpdate.userErrors)}`);
  changed++;
}

console.log(`\n${APPLY ? "applied" : "dry run"}: ${changed} changes`);
