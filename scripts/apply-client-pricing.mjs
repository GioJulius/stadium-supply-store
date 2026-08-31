/**
 * Applies the client's price list of 27 Aug 2026 to the whole catalogue.
 *
 * The list was captured in `client-pricing-and-sizing-audit.md` but never
 * applied, so the shop has been live on importer defaults — a R450 fallback had
 * leaked across fan shirts, rugby, F1, hoodies, half-zips and jackets, and some
 * fan shirts were sitting at the player price. The client twice asked us to
 * "double check prices".
 *
 * Long sleeve is the client's "+R100 if available", and the catalogue already
 * shows that rule where it was applied by hand (player R750, retro R800,
 * hoodie R950), so it is encoded here rather than treated as a separate tier.
 *
 * Prices are set on EVERY variant of a product, not just the cheapest, because
 * the storefront advertises `priceRange.min` and a stale larger size would sell
 * at the wrong money.
 *
 * Idempotent: variants already at the target price are skipped.
 *
 * Usage: node scripts/apply-client-pricing.mjs [--apply] [--limit N]
 */
import { readFileSync } from "node:fs";

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

/** The client's list, as sent on WhatsApp on 27 Aug 2026. */
const LONG_SLEEVE_SURCHARGE = 100;

function targetPrice(product) {
  const type = product.productType || "";
  const title = product.title;
  const tags = product.tags;
  const has = t => tags.includes(t);
  const isLongSleeve = /long[- ]sleeve/i.test(title);
  const isRugby = /rugby/i.test(`${title} ${type} ${tags.join(" ")}`);
  const add = base => base + (isLongSleeve ? LONG_SLEEVE_SURCHARGE : 0);

  switch (type) {
    case "Soccer Fan Version":
    case "Soccer Fan Version Long Sleeve":
      return add(500);
    case "Soccer Player Version":
      return add(650);
    case "Soccer Retro":
      return add(700);
    case "Football Jersey":
      if (has("Player Version")) return add(650);
      if (has("Retro") || has("Soccer Retro")) return add(700);
      return add(500); // Fan Version, and the importer's untagged default
    case "F1 Jersey":
      return 650;
    case "Hoodie":
      return add(850);
    case "Half-Zip Training Top":
      return 850;
    case "Jacket / Windbreaker":
      // A full windbreaker tracksuit is R1200; a jacket on its own is R1000.
      return /\b(set|suit|tracksuit)\b/i.test(title) ? 1200 : 1000;
    case "Chinese Jacket":
    case "Jacket":
      return 1200;
    case "Tracksuit":
      return 1000;
    case "Training Top & Shorts":
      // The client's list has two overlapping lines here — "Adidas/Nike
      // training top and shorts R600" and "adults sets top and shorts
      // training R700". Every set in the catalogue is club or nation
      // branded, so which line applies is genuinely ambiguous; the existing
      // R600 is kept rather than moving five live prices on a guess.
      return add(600);
    case "Football Training Wear":
      return /hoodie/i.test(title) ? 850 : 600;
    case "Kids Kit":
      return isRugby ? 550 : 450;
    case "Rugby Jersey":
      return 700;
    case "Rugby Vest":
      return 600;
    default:
      return null; // unmapped — reported, never guessed at
  }
}

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

const PAGE = `query($cursor:String){ products(first:50, after:$cursor){ pageInfo{hasNextPage endCursor}
  edges{ node{ id handle title productType tags
    variants(first:30){ edges{ node{ id title price } } } } } } }`;

const all = [];
let cursor = null;
do {
  const page = await gql(PAGE, { cursor });
  all.push(...page.products.edges.map(e => e.node));
  cursor = page.products.pageInfo.hasNextPage ? page.products.pageInfo.endCursor : null;
} while (cursor);

// Only products the storefront actually shows.
const visible = all.filter(p => p.tags.includes("Mapped Media") || p.tags.includes("Editable Drop"));
console.log(`${all.length} products, ${visible.length} customer-facing\n`);

let changed = 0, variantsChanged = 0, ok = 0;
const unmapped = [];

for (const product of visible) {
  if (changed >= LIMIT) break;
  const target = targetPrice(product);
  if (target === null) { unmapped.push(product); continue; }

  const variants = product.variants.edges.map(e => e.node);
  const wrong = variants.filter(v => Number(v.price) !== target);
  if (!wrong.length) { ok++; continue; }

  const from = [...new Set(variants.map(v => `R${Number(v.price)}`))].join("/");
  console.log(`${from.padEnd(16)} -> R${target}   ${product.productType.padEnd(30)} ${product.title.slice(0, 46)}`);
  if (APPLY) {
    const r = await gql(
      `mutation($pid:ID!,$vars:[ProductVariantsBulkInput!]!){ productVariantsBulkUpdate(productId:$pid, variants:$vars){ userErrors{field message} } }`,
      { pid: product.id, vars: wrong.map(v => ({ id: v.id, price: String(target) })) },
    );
    const errs = r.productVariantsBulkUpdate.userErrors;
    if (errs.length) throw new Error(`${product.handle}: ${JSON.stringify(errs)}`);
  }
  changed++;
  variantsChanged += wrong.length;
}

if (unmapped.length) {
  console.log(`\nUNMAPPED product types (left alone):`);
  unmapped.forEach(p => console.log(`   ${p.productType || "(none)"} — ${p.title.slice(0, 50)}`));
}
console.log(`\n${APPLY ? "applied" : "dry run"}: ${changed} products repriced (${variantsChanged} variants), ${ok} already correct`);
