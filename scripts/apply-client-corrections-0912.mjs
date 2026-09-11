/**
 * The client's WhatsApp corrections of 11 Sep 2026 (second message), applied to the catalogue.
 *
 * The manifest is `scripts/client-corrections-0912.json`; the reasoning and
 * the eye-verification behind every line is in
 * `client-corrections-2026-09-12.md`. This file is only the mechanism.
 *
 * Same shape as apply-client-corrections-0911.mjs, and the same safety
 * mechanism: almost none of these are renames, they are SWAPS and ROTATIONS —
 * the client moves kit A onto kit B's season and B onto C's. Shopify does not
 * require unique titles, so a half-applied rotation does not error, it just
 * leaves two listings under one name and the catalogue looks right while being
 * wrong. So the POST-state of every title in the batch is built first and the
 * run is refused outright if any title would still be duplicated.
 *
 * Idempotent: every edit is skipped when the value already matches.
 *
 *   node scripts/apply-client-corrections-0912.mjs            # dry run
 *   node scripts/apply-client-corrections-0912.mjs --apply
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
const M = JSON.parse(readFileSync(new URL("./client-corrections-0912.json", import.meta.url), "utf8"));

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
  console.error("Resolve these in client-corrections-0912.json (usually the other side of the rotation is missing) and re-run.");
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

/* retitle -------------------------------------------------------------- */
for (const r of M.retitle) {
  const p = seen(r.handle); if (!p) continue;
  if (p.title === r.title) { skipped++; continue; }
  await productUpdate(r.handle, { id: p.id, title: r.title });
  changed++;
  console.log(`TITLE   ${p.title}\n     -> ${r.title}${r.inferred ? "   [inferred]" : ""}   ("${r.said}")`);
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
  console.log(`RECLASS ${p.handle}   ("${r.said}")`);
  for (const n of notes) console.log(`        ${n}`);
}

/* ---------------------------------------------------------------------- */
if (missing.length) {
  console.log(`\n${missing.length} handle(s) in the manifest are not in the catalogue:`);
  for (const h of missing) console.log(`  ${h}`);
}
console.log(`\n${APPLY ? "applied" : "would apply"}: ${changed}   already correct: ${skipped}`);
if (!APPLY) console.log("dry run — re-run with --apply to write.");
else console.log("\nNow run `npm run seo` and commit scripts/seo-snapshot.json, or production SEO goes stale.");

console.log(`\n${M.questions.length} note(s) for the owner:`);
for (const q of M.questions) console.log(`  - ${q}`);
