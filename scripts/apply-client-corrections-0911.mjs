/**
 * The client's WhatsApp corrections of 10 Sep 2026, applied to the catalogue.
 *
 * The manifest is `scripts/client-corrections-0911.json`; the reasoning and the
 * eye-verification behind every line is in `client-corrections-2026-09-11.md`.
 * This file is only the mechanism.
 *
 * WHY THE ORDER MATTERS. Most of these corrections are season SWAPS, not
 * renames: the client moves kit A onto kit B's season and kit B onto A's. Run
 * one-way and the store ends up with two listings called the same thing. Titles
 * are not unique in Shopify so nothing would error — it would just look right
 * and be wrong, which is how this catalogue got here. So every retitle is
 * checked against the POST-state of the whole batch, and a title that would
 * still be duplicated after the batch lands is refused before anything is
 * written.
 *
 * Season lives in the TITLE only — tags carry team and version, never season —
 * so a reseason is a one-field edit. A fan<->player correction is not: it moves
 * the price tier and the facet tag with it, which is why `reclass` exists
 * separately and writes all three.
 *
 * Idempotent. Every edit is skipped when the value already matches, so a second
 * run is a no-op and prints nothing but skips.
 *
 *   node scripts/apply-client-corrections-0911.mjs            # dry run
 *   node scripts/apply-client-corrections-0911.mjs --apply
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .filter(l => l.trim() && !l.trim().startsWith("#") && l.includes("="))
    .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const ENDPOINT = `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-04/graphql.json`;
const APPLY = process.argv.includes("--apply");
const M = JSON.parse(readFileSync(new URL("./client-corrections-0911.json", import.meta.url), "utf8"));

async function gql(query, variables = {}) {
  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": env.SHOPIFY_ADMIN_API_ACCESS_TOKEN },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}

/* ---------- read the whole catalogue once ---------- */

const Q = `query($cursor:String){ products(first:100, after:$cursor){
  pageInfo{hasNextPage endCursor}
  edges{ node{ id handle title productType status tags
    media(first:30){edges{node{ id ... on MediaImage { image{url altText} } }}}
    variants(first:100){edges{node{id price}}} } } } }`;

const all = [];
for (let cursor = null; ; ) {
  const d = await gql(Q, { cursor });
  all.push(...d.products.edges.map(e => e.node));
  if (!d.products.pageInfo.hasNextPage) break;
  cursor = d.products.pageInfo.endCursor;
}
const byHandle = new Map(all.map(p => [p.handle, p]));
console.log(`catalogue: ${all.length} products\n`);

const missing = [];
const seen = h => { const p = byHandle.get(h); if (!p) missing.push(h); return p; };

/* ---------- precondition: no duplicate titles AFTER the batch ---------- */

const after = new Map(all.map(p => [p.handle, p.title]));
for (const r of [...M.retitle, ...M.reclass]) if (r.title && after.has(r.handle)) after.set(r.handle, r.title);
for (const a of M.archive) after.delete(a.handle);

const dupes = new Map();
for (const [h, t] of after) {
  const k = t.trim().toLowerCase();
  if (!dupes.has(k)) dupes.set(k, []);
  dupes.get(k).push(h);
}
const touched = new Set([...M.retitle, ...M.reclass].map(r => r.handle));
const clashes = [...dupes.entries()]
  .filter(([, hs]) => hs.length > 1 && hs.some(h => touched.has(h)))
  .map(([t, hs]) => `  "${t}"\n${hs.map(h => `      ${h}`).join("\n")}`);

if (clashes.length) {
  console.error(`REFUSING TO RUN — ${clashes.length} title(s) would be duplicated after this batch:\n${clashes.join("\n")}\n`);
  console.error("Resolve these in client-corrections-0911.json (usually the other side of the swap is missing) and re-run.");
  process.exit(1);
}
console.log("precondition ok: no title is duplicated after the batch\n");

/* ---------- mutations ---------- */

const PRODUCT_UPDATE = `mutation($input:ProductInput!){ productUpdate(input:$input){ userErrors{field message} } }`;
const VARIANTS_UPDATE = `mutation($productId:ID!,$variants:[ProductVariantsBulkInput!]!){
  productVariantsBulkUpdate(productId:$productId, variants:$variants){ userErrors{field message} } }`;

let changed = 0, skipped = 0;

async function productUpdate(handle, input) {
  if (!APPLY) return;
  const r = await gql(PRODUCT_UPDATE, { input });
  if (r.productUpdate.userErrors.length) throw new Error(`${handle}: ${JSON.stringify(r.productUpdate.userErrors)}`);
}

async function setPrice(p, price) {
  const variants = p.variants.edges.filter(v => v.node.price !== price).map(v => ({ id: v.node.id, price }));
  if (!variants.length) return false;
  if (APPLY) {
    const errs = (await gql(VARIANTS_UPDATE, { productId: p.id, variants })).productVariantsBulkUpdate.userErrors;
    if (errs.length) throw new Error(`${p.handle}: ${JSON.stringify(errs)}`);
  }
  return true;
}

/* archive -------------------------------------------------------------- */
for (const a of M.archive) {
  const p = seen(a.handle); if (!p) continue;
  if (p.status === "ARCHIVED") { skipped++; console.log(`  skip  ${a.handle} (already archived)`); continue; }
  await productUpdate(a.handle, { id: p.id, status: "ARCHIVED" });
  changed++;
  console.log(`ARCHIVE ${a.handle}\n        ${a.why}`);
}

/* retitle -------------------------------------------------------------- */
for (const r of M.retitle) {
  const p = seen(r.handle); if (!p) continue;
  if (p.title === r.title) { skipped++; continue; }
  await productUpdate(r.handle, { id: p.id, title: r.title });
  changed++;
  console.log(`TITLE   ${p.title}\n     -> ${r.title}${r.inferred ? "   [inferred]" : ""}`);
}

/* reclass -------------------------------------------------------------- */
for (const r of M.reclass) {
  const p = seen(r.handle); if (!p) continue;
  const input = { id: p.id };
  const notes = [];

  if (r.title && p.title !== r.title) { input.title = r.title; notes.push(`title -> ${r.title}`); }
  if (r.productType && p.productType !== r.productType) { input.productType = r.productType; notes.push(`type -> ${r.productType}`); }

  if (r.tagOut || r.tagIn) {
    let tags = p.tags.slice();
    if (r.tagOut) tags = tags.filter(t => t !== r.tagOut);
    if (r.tagIn && !tags.includes(r.tagIn)) tags.push(r.tagIn);
    if (tags.length !== p.tags.length || tags.some((t, i) => t !== p.tags[i])) {
      input.tags = tags.sort();
      notes.push(`tags -> ${input.tags.join(", ")}`);
    }
  }

  if (Object.keys(input).length > 1) await productUpdate(r.handle, input);
  if (r.price && await setPrice(p, r.price)) notes.push(`price -> R${r.price}`);

  if (!notes.length) { skipped++; continue; }
  changed++;
  console.log(`RECLASS ${p.handle}${r.inferred ? "   [inferred]" : ""}`);
  for (const n of notes) console.log(`        ${n}`);
}

/* swapMedia ------------------------------------------------------------ */
/* Shopify has no "move media between products", so this is read-both, then
   delete-and-recreate on each side from the other's image urls. Idempotent by
   URL: if a's media already carries b's original urls the pair is done. */
const MARK = "swapped-0911";
const MEDIA_DELETE = `mutation($productId:ID!,$mediaIds:[ID!]!){
  productDeleteMedia(productId:$productId, mediaIds:$mediaIds){ mediaUserErrors{field message} } }`;
const MEDIA_CREATE = `mutation($id:ID!,$media:[CreateMediaInput!]!){
  productCreateMedia(productId:$id, media:$media){ mediaUserErrors{field message} } }`;

for (const s of M.swapMedia) {
  const a = seen(s.a), b = seen(s.b);
  if (!a || !b) continue;
  const imgs = p => p.media.edges.map(e => e.node.image?.url).filter(Boolean);
  const [ia, ib] = [imgs(a), imgs(b)];
  if (!ia.length || !ib.length) { console.log(`  skip  swap ${s.a} <-> ${s.b} (a side has no images)`); skipped++; continue; }

  /* A SWAP CANNOT BE DETECTED FROM THE URLS. productCreateMedia copies the
     file, so the photograph that lands on A gets a NEW cdn url — comparing
     A's urls to B's can never say "already swapped", and a second --apply
     would cheerfully swap them back. The marker is what makes this idempotent;
     without it this script is one-shot, which is the trap
     promote-lead-image.mjs fell into. */
  if (a.media.edges.some(e => e.node.image?.altText === MARK)) { skipped++; continue; }

  console.log(`SWAP    ${s.a}\n    <-> ${s.b}\n        ${s.why}`);
  if (APPLY) {
    /* COPY BOTH WAYS FIRST, THEN DELETE. The source of each copy is the other
       product's CDN url, and deleting a product's media invalidates those urls
       — so deleting A before copying A's photos onto B loses them outright. */
    for (const [p, urls] of [[a, ib], [b, ia]]) {
      const r = await gql(MEDIA_CREATE, {
        id: p.id,
        media: urls.map(u => ({ originalSource: u, mediaContentType: "IMAGE", alt: MARK })),
      });
      if (r.productCreateMedia.mediaUserErrors.length) throw new Error(JSON.stringify(r.productCreateMedia.mediaUserErrors));
    }
    for (const p of [a, b]) {
      const ids = p.media.edges.map(e => e.node.id);
      const r = await gql(MEDIA_DELETE, { productId: p.id, mediaIds: ids });
      if (r.productDeleteMedia.mediaUserErrors.length) throw new Error(JSON.stringify(r.productDeleteMedia.mediaUserErrors));
    }
  }
  changed++;
}

/* reprice by category -------------------------------------------------- */
for (const r of M.reprice) {
  const hits = all.filter(p => p.productType === r.match && p.title.includes(r.contains));
  let n = 0;
  for (const p of hits) if (await setPrice(p, r.price)) { n++; changed++; } else skipped++;
  if (n) console.log(`PRICE   ${r.match} / ${r.contains}: ${n} product(s) -> R${r.price}\n        ${r.why}`);
}

/* ---------------------------------------------------------------------- */
if (missing.length) {
  console.log(`\n${missing.length} handle(s) in the manifest are not in the catalogue:`);
  for (const h of missing) console.log(`  ${h}`);
}
console.log(`\n${APPLY ? "applied" : "would apply"}: ${changed}   already correct: ${skipped}`);
if (!APPLY) console.log("dry run — re-run with --apply to write.");
else console.log("\nNow run `npm run seo` and commit scripts/seo-snapshot.json, or production SEO goes stale.");

console.log(`\n${M.questions.length} item(s) still need the client:`);
for (const q of M.questions) console.log(`  - ${q}`);
