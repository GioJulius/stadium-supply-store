/**
 * Gives 28 listings a FRONT-facing lead photograph.
 *
 * The client's 5 Sep feedback ("we can't see the first picture") turned out to
 * be broader than the eighteen listings fixed on the day. Auditing the 33
 * listings in their screenshots showed only twelve had a front-facing whole-
 * garment photograph anywhere in the gallery; the other 21 had back views and
 * close-ups only. The supplier shoots the back first for anything carrying a
 * print, and our import took the gallery in the order it was given.
 *
 * Two mechanisms:
 *
 * 1. PULL — 21 listings whose gallery has no front shot at all. The photograph
 *    is downloaded from the listing's own ezfashion album (the album id is on
 *    the product as a `supplier-<id>` tag; the five with no tag were matched by
 *    title, see supplier-links-front-photos.md), uploaded, and made the lead.
 *    Album images are staged by `scripts/fetch-front-shots.py` into
 *    `import/front-shots/<handle>/NN.jpg` — `import/` is gitignored, so that
 *    staging is reproduced from the supplier rather than committed.
 *
 * 2. PROMOTE — 7 listings that already own a front shot further down the
 *    gallery. Named by FILENAME, never by index: a positional table stops being
 *    idempotent after its first run.
 *
 * A third group needed no work here at all. `_01` is the supplier's own primary
 * product shot on some albums and the size chart on others, and
 * orderGalleryImages() used to demote it on filename alone. It now demotes only
 * a NON-SQUARE `_01`, which is what a measurement table always is — that alone
 * restored the front shot on the AC Milan half-zip and both Italy home shirts.
 *
 * Idempotent: an upload is skipped when a photo with the same alt is already on
 * the product and leading, a promote is skipped when it already leads.
 *
 * Usage: node scripts/front-shots-0906.mjs [--apply]
 */
import { readFileSync, existsSync } from "node:fs";
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
const STAGE = fileURLToPath(new URL("../import/front-shots/", import.meta.url));

/** handle -> which staged album photograph is the front of the garment. */
const PULL = [
  ["real-madrid-2024-25-home-jersey-bellingham-5", 3, "listing had one photo, the printed back"],
  ["manchester-united-2025-26-third-jersey-mbeumo-19", 1, "listing had one photo, the printed back"],
  ["2025-26-ac-milan-away-player-version1", 18, "gallery was close-ups only"],
  ["2026-italy-half-zip-training-set", 18, "back of the top; now the front with the pants"],
  ["2025-26-manchester-united-chinese-knot-kids-kit", 24, "gallery was close-ups only"],
  ["2025-26-real-madrid-chinese-knot-kids-kit", 24, "gallery was close-ups only"],
  ["2025-26-real-madrid-chinese-knot-long-sleeve-fan-version", 21, "gallery was close-ups only"],
  ["2025-26-manchester-united-chinese-knot-long-sleeve-fan-version", 21, "gallery was close-ups only"],
  ["2026-world-cup-france-training-set-fan-version", 0, "back print only"],
  ["2026-27-real-madrid-home-long-sleeve-player-version", 0, "back only"],
  ["2026-27-liverpool-home-long-sleeve-player-version", 0, "back only"],
  ["2026-27-fc-barcelona-home-long-sleeve-player-version", 0, "back only"],
  ["2026-27-fc-barcelona-home-player-version", 0, "back only"],
  ["2026-27-liverpool-home-womens-shirt", 0, "back only"],
  ["2026-27-manchester-united-home-womens-shirt", 0, "back only"],
  ["2026-27-fc-barcelona-home-fan-version", 0, "back only"],
  ["2026-27-fc-barcelona-away-kids-kit", 1, "gallery was close-ups only"],
  ["2026-world-cup-france-half-zip-training-set", 19, "back of the top; now the front with the pants"],
  ["2026-world-cup-england-half-zip-training-set", 19, "back of the top; now the front with the pants"],
  ["2026-27-liverpool-half-zip-training-set", 21, "back of the top; now the front with the pants"],
  ["2026-27-real-madrid-half-zip-training-set", 21, "back of the top; now the front with the pants"],
];

/** Already own a front shot — it just was not leading. */
const PROMOTE = [
  ["aston-villa-2025-26-away-fan-version", "a01_3.jpg", "led on the back collar"],
  ["paris-saint-germain-2024-25-fourth-jersey-d-doue-14", "010_02_ecde1f8b-8180-41d3-8b19-869f2461c067.jpg", "led on the printed back"],
  ["2025-26-fc-barcelona-hooded-training-set", "212967540_03.jpg", "led on the back of the hood"],
  ["2026-germany-sweatshirt-long-sleeve", "224260090_03.jpg", "led on the back"],
  ["2025-26-fc-barcelona-sweatshirt-long-sleeve", "224260110_03.jpg", "led on the back"],
  ["2026-world-cup-argentina-half-zip-training-set", "p043.jpg", "led on the back of the top"],
  ["2026-world-cup-argentina-windbreaker-set", "231018412_03.jpg", "led on the back"],
];

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

const PRODUCT = `query($h:String!){ productByHandle(handle:$h){ id title
  media(first:50){ edges{ node{ id alt ... on MediaImage { image { url } } } } } } }`;

async function load(handle) {
  const p = (await gql(PRODUCT, { h: handle })).productByHandle;
  if (!p) throw new Error(`${handle}: not on the store`);
  p.mediaList = p.media.edges.map(e => ({ id: e.node.id, alt: e.node.alt ?? "", url: e.node.image?.url ?? "" }));
  return p;
}

async function reorder(product, leadId) {
  const ids = [leadId, ...product.mediaList.filter(m => m.id !== leadId).map(m => m.id)];
  const r = await gql(
    `mutation($id:ID!,$moves:[MoveInput!]!){ productReorderMedia(id:$id, moves:$moves){ userErrors{field message} } }`,
    { id: product.id, moves: ids.map((id, i) => ({ id, newPosition: String(i) })) },
  );
  if (r.productReorderMedia.userErrors.length) throw new Error(`${product.title}: ${JSON.stringify(r.productReorderMedia.userErrors)}`);
}

async function stageAndUpload(path, filename) {
  const bytes = readFileSync(path);
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

console.log("== 1/2  front shots pulled from the supplier album");
for (const [handle, n, why] of PULL) {
  const path = join(STAGE, handle, `${String(n).padStart(2, "0")}.jpg`);
  if (!existsSync(path)) throw new Error(`${handle}: ${path} not staged — run python scripts/fetch-front-shots.py`);
  const alt = `supplier front shot ${String(n).padStart(2, "0")}`;
  const product = await load(handle);
  const already = product.mediaList.find(m => m.alt === alt);
  if (already && product.mediaList[0].id === already.id) { console.log(`SKIP    ${handle} — already leads on it`); continue; }
  console.log(`FRONT   ${handle.padEnd(58)} <- album ${String(n).padStart(2, "0")}  (${why})`);
  if (!APPLY) { changed++; continue; }
  let id = already?.id;
  if (!id) {
    const source = await stageAndUpload(path, `front-${handle}.jpg`);
    const r = await gql(
      `mutation($id:ID!,$media:[CreateMediaInput!]!){ productCreateMedia(productId:$id, media:$media){ media{ ... on MediaImage { id } } mediaUserErrors{field message} } }`,
      { id: product.id, media: [{ originalSource: source, mediaContentType: "IMAGE", alt }] },
    );
    if (r.productCreateMedia.mediaUserErrors.length) throw new Error(`${handle}: ${JSON.stringify(r.productCreateMedia.mediaUserErrors)}`);
    id = r.productCreateMedia.media[0].id;
  }
  // productCreateMedia is asynchronous; reordering before the media is READY is
  // rejected, so re-read until it shows up.
  for (let i = 0; i < 12; i++) {
    const fresh = await load(handle);
    if (fresh.mediaList.some(m => m.id === id)) { await reorder(fresh, id); break; }
    await new Promise(r => setTimeout(r, 2500));
  }
  changed++;
}

console.log("\n== 2/2  front shots the gallery already had");
for (const [handle, filename, why] of PROMOTE) {
  const product = await load(handle);
  const wanted = product.mediaList.find(m => m.url.split("/").pop().split("?")[0] === filename);
  if (!wanted) throw new Error(`${handle}: ${filename} is not in the gallery`);
  if (product.mediaList[0].id === wanted.id) { console.log(`SKIP    ${handle} — already leads correctly`); continue; }
  console.log(`LEAD    ${handle.padEnd(58)} -> ${filename}  (${why})`);
  if (APPLY) await reorder(product, wanted.id);
  changed++;
}

console.log(`\n${APPLY ? "applied" : "dry run"}: ${changed} changes`);
