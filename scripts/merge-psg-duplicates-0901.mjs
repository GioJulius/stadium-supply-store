/**
 * Merges the two PSG listings that turned out to be the same shirt filed three
 * and two times over.
 *
 * These were flagged, not merged, during the 1 Sep categorisation pass, because
 * "the photos look alike" is not evidence — a perceptual-hash sweep on this
 * catalogue once scored an All Blacks jersey as a near-match for an F1 t-shirt.
 * What settles it here is a strict pixel comparison of every image in every
 * candidate gallery: two listings are the same product only when they are built
 * from the same photographs.
 *
 *   Doué 14  A0 == C0 (mean per-channel diff 0.04)   -> A folds into C
 *            B2 == C1 (0.14)                          -> B folds into C
 *   Neymar   D0 == E2 (byte-identical MD5)            -> D folds into E
 *
 * The same test cleared the two Spain half-zip sets, which look near-identical
 * on a contact sheet but share no image at all, so they stay as two products.
 *
 * The survivor is the listing with the real kit designation and the fullest
 * gallery. It inherits any photograph its twin held that it did not — appended,
 * so its own lead image keeps the shop grid stable. Every group already agrees
 * on price and size range, so no shopper loses an option in the merge.
 *
 * Twins are DRAFTED rather than deleted: it takes them off the storefront while
 * leaving the record and any order history intact, and it is one click to undo
 * if the client disagrees that these are the same shirt.
 *
 * Usage: node scripts/merge-psg-duplicates-0901.mjs [--apply]
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")
    .filter(l => l.trim() && !l.trim().startsWith("#") && l.includes("="))
    .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]));

const ENDPOINT = `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-04/graphql.json`;
const APPLY = process.argv.includes("--apply");

async function gql(query, variables = {}) {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });
    if (r.status === 429 && attempt < 5) {
      await new Promise(s => setTimeout(s, 2000 * (attempt + 1)));
      continue;
    }
    const j = await r.json();
    if (j.errors) throw new Error(JSON.stringify(j.errors));
    return j.data;
  }
}

function check(label, payload) {
  const errs = payload?.userErrors ?? payload?.mediaUserErrors ?? [];
  if (errs.length) throw new Error(`${label}: ${JSON.stringify(errs)}`);
  return payload;
}

const MERGES = [
  {
    survivor: "paris-saint-germain-2024-25-fourth-jersey-d-doue-14",
    // "Fourth" is the designation the photos support: PSG's 2024/25 Jordan
    // fourth kit. The twins called the same shirt Home and Away.
    title: "Paris Saint-Germain 2024/25 Fourth Jersey — Doué 14 Player Version",
    twins: [
      { handle: "paris-saint-germain-2024-25-home-jersey-doue-14", duplicateAt: [0] },
      // Its duplicate is the THIRD image, not the first: index, not count.
      { handle: "paris-saint-germain-2024-25-away-jersey-doue-14", duplicateAt: [2] },
    ],
  },
  {
    survivor: "paris-saint-germain-2023-24-home-jersey-jordan",
    // Every back shot in the survivor's own gallery reads NEYMAR JR 10, so the
    // twin's name belongs on the listing that is being kept.
    title: "Paris Saint-Germain 2018/19 Fourth Retro Jersey — Neymar 10 (Jordan)",
    twins: [{ handle: "paris-saint-germain-2023-24-away-jersey-neymar-10", duplicateAt: [0] }],
  },
];

const Q = `query($handle:String!){ productByHandle(handle:$handle){
  id handle title status
  media(first:50){edges{node{... on MediaImage{ id image{url} }}}} } }`;

/** Strip Shopify's `?v=` cache buster so a re-fetch of the same asset matches. */
const bare = url => url.split("?")[0];

console.log(`${APPLY ? "APPLYING" : "DRY RUN"}\n`);

for (const merge of MERGES) {
  const survivor = (await gql(Q, { handle: merge.survivor })).productByHandle;
  if (!survivor) throw new Error(`survivor missing: ${merge.survivor}`);
  const survivorUrls = new Set(
    survivor.media.edges.map(e => e.node?.image?.url).filter(Boolean).map(bare));

  console.log(`survivor: ${survivor.title}`);
  console.log(`  ${survivorUrls.size} images, title -> "${merge.title}"`);

  const toAppend = [];
  for (const twin of merge.twins) {
    const t = (await gql(Q, { handle: twin.handle })).productByHandle;
    if (!t) throw new Error(`twin missing: ${twin.handle}`);
    const urls = t.media.edges.map(e => e.node?.image?.url).filter(Boolean);
    // Anything the pixel comparison already matched to a survivor image is a
    // re-upload of the same photograph, so only genuinely new frames come over.
    const dupes = new Set(twin.duplicateAt);
    const unique = urls.filter((u, i) => !dupes.has(i) && !survivorUrls.has(bare(u)));
    unique.forEach(u => { survivorUrls.add(bare(u)); toAppend.push(u); });
    console.log(`  twin: ${t.title}`);
    console.log(`    ${urls.length} images, ${unique.length} unique -> survivor; then DRAFT`);

    if (!APPLY) continue;
    check("productUpdate(twin)", (await gql(
      "mutation($input:ProductInput!){productUpdate(input:$input){userErrors{field message}}}",
      { input: { id: t.id, status: "DRAFT", tags: [] } })).productUpdate);
  }

  if (!APPLY) { console.log(""); continue; }

  if (toAppend.length) {
    check("productCreateMedia", (await gql(
      `mutation($pid:ID!,$media:[CreateMediaInput!]!){
         productCreateMedia(productId:$pid,media:$media){
           mediaUserErrors{field message} } }`,
      {
        pid: survivor.id,
        media: toAppend.map(url => ({
          originalSource: url,
          mediaContentType: "IMAGE",
          alt: merge.title,
        })),
      })).productCreateMedia);
  }
  check("productUpdate(survivor)", (await gql(
    "mutation($input:ProductInput!){productUpdate(input:$input){userErrors{field message}}}",
    { input: { id: survivor.id, title: merge.title } })).productUpdate);
  console.log(`  merged: +${toAppend.length} images\n`);
}
console.log(APPLY ? "done" : "dry run - re-run with --apply");
