/**
 * Gives every live product customer-facing copy, search metadata, image alt
 * text and a SKU.
 *
 * Before this, 70% of the catalogue had no description at all, and the 59
 * products that did have one carried the importer's boilerplate:
 *
 *   "This product has been matched to its supplied kit media and is offered
 *    in Small through..."
 *
 * That is reconciliation jargon describing OUR pipeline, shown to shoppers. It
 * had to go regardless of what replaced it.
 *
 * The copy is assembled from facts the listing already proves - version, sleeve,
 * the real size range, whether it takes printing - so each description says
 * something true and specific about that shirt rather than padding a template.
 * Nothing is claimed that the catalogue cannot back: no authenticity language,
 * no invented provenance, no stock promises. The ordering and delivery lines
 * are the client's own, quoted from the How It Works and Shipping pages so the
 * store tells one story.
 *
 * SEO titles and descriptions matter here beyond search: this store is shared
 * as a link on WhatsApp, Instagram and TikTok, and those previews read the same
 * fields.
 *
 * Usage: node scripts/write-product-copy.mjs [--apply] [--limit N]
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")
    .filter(l => l.trim() && !l.trim().startsWith("#") && l.includes("="))
    .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]));

const ENDPOINT = `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-04/graphql.json`;
const APPLY = process.argv.includes("--apply");
const LIMIT = Number(process.argv[process.argv.indexOf("--limit") + 1]) || Infinity;

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
    if ((r.status === 429 || r.status >= 500) && attempt < 5) {
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

/**
 * What each version actually means to someone deciding between them. This is
 * the single most asked question in the client's own WhatsApp thread, so it
 * belongs on the page rather than in a reply an hour later.
 */
const VERSION_COPY = {
  "Soccer Fan Version": "The fan version: the everyday cut, a little roomier through the body, and the one most people wear off the pitch.",
  "Soccer Fan Version Long Sleeve": "The long-sleeve fan version: the everyday cut, a little roomier through the body, with full sleeves.",
  "Soccer Player Version": "The player version: the tighter, lighter match spec the squad wears, cut close through the chest and sleeve.",
  "Soccer Retro": "A retro reissue of a shirt that has been out of production for years — the season, the sponsor and the cut as they were.",
  "Rugby Jersey": "Built for rugby: heavier fabric, a reinforced collar, and a cut that holds its shape.",
  "Rugby Vest": "A training vest cut for rugby — lightweight, sleeveless, and sized generously.",
  "Kids Kit": "A full kids set — shirt and shorts together, sized by age.",
  "Half-Zip Training Top": "A half-zip training top, the piece the squad warms up in.",
  "Jacket / Windbreaker": "Outerwear from the training range — worn on the touchline rather than the pitch.",
  Hoodie: "From the training range: a heavier layer for the walk to the ground.",
  "Training Top & Shorts": "A training set — top and shorts together.",
  "F1 Jersey": "From the paddock rather than the pitch — team-issue motorsport kit.",
};

const SIZE_WORD = { S: "Small", M: "Medium", L: "Large", XL: "XL", "2XL": "2XL", "3XL": "3XL", "4XL": "4XL", "5XL": "5XL" };

/** Mirrors `isPersonalisable` in client/src/lib/catalog.ts. */
const NON_SHIRT = /hood|sweatshirt|jacket|windbreaker|tracksuit|training|half-zip|polo|pants|t-shirt|anthem|presentation/i;
function personalisable(p) {
  const hay = [p.title, p.productType ?? "", ...p.tags].join(" ");
  if (NON_SHIRT.test(hay)) return false;
  if (/shorts/i.test(hay) && !/\b(kit|set)\b/i.test(hay)) return false;
  if (/player version|authentic/i.test(hay)) return false;
  if (/kids|kiddies/i.test(hay)) return true;
  return /fan version|fan jersey/i.test(hay);
}

function sizeSentence(sizes) {
  const real = sizes.filter(s => s !== "Default Title");
  if (!real.length) return "";
  if (/^\d/.test(real[0])) return `Sized by age, ${real[0]} up to ${real[real.length - 1]} years.`;
  const first = SIZE_WORD[real[0]] ?? real[0];
  const last = SIZE_WORD[real[real.length - 1]] ?? real[real.length - 1];
  return `Available ${first} through ${last}.`;
}

function buildDescription(p) {
  const sizes = p.variants.edges.map(e => e.node.title);
  const lines = [
    VERSION_COPY[p.productType] ?? "Sourced and shipped by Stadium Supply.",
    sizeSentence(sizes),
    personalisable(p)
      ? "Add your own name and number for R50, and a competition badge for R50 — both at checkout."
      : "",
    // The client's own words, so the product page and the How It Works page
    // never contradict each other on the one thing shoppers ask about.
    "We order every piece from our supplier once your payment lands. Stock usually reaches us in 10–15 business days, then ships to your door for a flat R100 anywhere in South Africa.",
  ];
  return lines.filter(Boolean).join("\n\n");
}

/** Google truncates around 60 and 155; the social preview cards are tighter. */
function buildSeo(p) {
  const title = `${p.title} | Stadium Supply`.slice(0, 70);
  const sizes = p.variants.edges.map(e => e.node.title);
  const price = p.variants.edges[0]?.node.price;
  const bits = [
    price ? `R${String(price).replace(".00", "")}` : "",
    sizeSentence(sizes).replace(/\.$/, ""),
    "Delivered anywhere in South Africa for R100.",
  ].filter(Boolean);
  return { title, description: bits.join(" · ").slice(0, 155) };
}

/**
 * Alt text describes the product for a screen reader and for image search. The
 * gallery order is meaningful (the lead shot first), so later frames are
 * numbered rather than all claiming to be the same view.
 */
function altFor(p, index, total) {
  return index === 0 || total === 1 ? p.title : `${p.title} — view ${index + 1} of ${total}`;
}

/**
 * Stable, human-readable and unique: SS-<handle>-<hash>-<size>.
 *
 * The hash is not decoration. Truncating the handle alone collided 73 times
 * across 12 products - including `...-third-jersey-mbeumo-19` against
 * `...-third-long-sleeve-jersey`, two different garments that would have
 * shared a code and eventually shipped as each other. The suffix is derived
 * from the FULL handle, so it stays stable across runs and distinguishes
 * listings whose names only diverge past the truncation point.
 */
function skuFor(p, variantTitle) {
  const stem = p.handle.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toUpperCase().slice(0, 28).replace(/-$/, "");
  let h = 0;
  for (const ch of p.handle) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const size = variantTitle === "Default Title" ? "STD" : variantTitle.toUpperCase();
  return `SS-${stem}-${h.toString(36).toUpperCase().slice(-4).padStart(4, "0")}-${size}`;
}

const Q = `query($c:String){products(first:100,after:$c){pageInfo{hasNextPage endCursor}edges{node{
  id handle title productType tags status
  seo{title description}
  media(first:40){edges{node{... on MediaImage{ id image{altText} }}}}
  variants(first:100){edges{node{id title price sku}}}
}}}}`;

let cursor = null;
const products = [];
do {
  const d = await gql(Q, { c: cursor });
  products.push(...d.products.edges.map(e => e.node));
  cursor = d.products.pageInfo.hasNextPage ? d.products.pageInfo.endCursor : null;
} while (cursor);

const live = products.filter(
  p => p.status === "ACTIVE"
    && (p.tags.includes("Mapped Media") || p.tags.includes("Editable Drop"))
    // The two add-on fee products are not things anyone browses.
    && p.productType !== "Service",
);

console.log(`${APPLY ? "APPLYING" : "DRY RUN"} — ${live.length} live products\n`);

let done = 0;
for (const p of live.slice(0, LIMIT)) {
  const description = buildDescription(p);
  const seo = buildSeo(p);
  const media = p.media.edges.map(e => e.node).filter(Boolean);
  const altUpdates = media
    .map((m, i) => ({ id: m.id, alt: altFor(p, i, media.length) }))
    .filter((m, i) => media[i].image?.altText !== m.alt);
  const skuUpdates = p.variants.edges
    .map(e => e.node)
    .map(v => ({ id: v.id, sku: skuFor(p, v.title) }))
    .filter((v, i) => p.variants.edges[i].node.sku !== v.sku);

  if (done < 2 && !APPLY) {
    console.log(`--- SAMPLE: ${p.title}`);
    console.log(description.split("\n\n").map(l => "    " + l).join("\n"));
    console.log(`    SEO: ${seo.title}`);
    console.log(`         ${seo.description}`);
    console.log(`    alt: ${altUpdates[0]?.alt ?? "(unchanged)"}`);
    console.log(`    sku: ${skuUpdates[0]?.sku ?? "(unchanged)"}\n`);
  }

  if (APPLY) {
    check("productUpdate", (await gql(
      `mutation($input:ProductInput!){productUpdate(input:$input){userErrors{field message}}}`,
      { input: { id: p.id, descriptionHtml: description.split("\n\n").map(l => `<p>${l}</p>`).join(""), seo } },
    )).productUpdate);

    if (skuUpdates.length) {
      check("variantsBulkUpdate", (await gql(
        `mutation($pid:ID!,$vars:[ProductVariantsBulkInput!]!){productVariantsBulkUpdate(productId:$pid,variants:$vars){userErrors{field message}}}`,
        { pid: p.id, vars: skuUpdates.map(v => ({ id: v.id, inventoryItem: { sku: v.sku } })) },
      )).productVariantsBulkUpdate);
    }
    for (const a of altUpdates) {
      check("fileUpdate", (await gql(
        `mutation($files:[FileUpdateInput!]!){fileUpdate(files:$files){userErrors{field message}}}`,
        { files: [{ id: a.id, alt: a.alt }] },
      )).fileUpdate);
    }
  }
  done++;
  if (APPLY && done % 25 === 0) console.log(`  ${done}/${live.length}`);
}
console.log(`\n${done} products ${APPLY ? "updated" : "would change"}`);
if (!APPLY) console.log("dry run — re-run with --apply");
