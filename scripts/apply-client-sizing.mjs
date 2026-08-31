/**
 * Extends products to the size ranges the client specified on 27 Aug 2026.
 *
 * Fan shirts sell S-4XL, player and retro S-2XL, rugby S-5XL, and everything
 * else S-2XL. An early import batch created products with S-XL only, so those
 * listings have been turning away every shopper above an XL — on a catalogue
 * whose supplier stocks up to 5XL.
 *
 * New variants inherit the product's existing price, which is correct now that
 * `apply-client-pricing.mjs` has run, and are created with inventory untracked
 * like the rest of the catalogue so they are immediately purchasable.
 *
 * Idempotent: only missing sizes are created.
 *
 * Usage: node scripts/apply-client-sizing.mjs [--apply] [--limit N]
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

const FAN = ["S", "M", "L", "XL", "2XL", "3XL", "4XL"];
const STANDARD = ["S", "M", "L", "XL", "2XL"];
const RUGBY = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

function wantedSizes(product) {
  const type = product.productType || "";
  if (type === "Kids Kit") return null; // age sizes, set at import
  if (type === "Rugby Jersey" || type === "Rugby Vest") return RUGBY;
  if (type === "Soccer Fan Version" || type === "Soccer Fan Version Long Sleeve") return FAN;
  if (type === "Football Jersey" && !product.tags.includes("Player Version") && !product.tags.includes("Retro")) return FAN;
  return STANDARD;
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
    options{ id name }
    variants(first:40){ edges{ node{ id price selectedOptions{ name value } } } } } } } }`;

const all = [];
let cursor = null;
do {
  const page = await gql(PAGE, { cursor });
  all.push(...page.products.edges.map(e => e.node));
  cursor = page.products.pageInfo.hasNextPage ? page.products.pageInfo.endCursor : null;
} while (cursor);

const visible = all.filter(p => p.tags.includes("Mapped Media") || p.tags.includes("Editable Drop"));
let extended = 0, added = 0, ok = 0, skipped = 0;

for (const product of visible) {
  if (extended >= LIMIT) break;
  const wanted = wantedSizes(product);
  if (!wanted) { skipped++; continue; }

  const sizeOption = product.options.find(o => o.name.toLowerCase() === "size");
  if (!sizeOption) { skipped++; continue; }

  const variants = product.variants.edges.map(e => e.node);
  const have = new Set(variants.map(v => v.selectedOptions.find(o => o.name.toLowerCase() === "size")?.value));
  const missing = wanted.filter(s => !have.has(s));
  if (!missing.length) { ok++; continue; }

  const price = variants[0]?.price;
  console.log(`${product.title.slice(0, 50).padEnd(52)} +${missing.join(",")}  @R${Number(price)}`);
  if (APPLY) {
    const r = await gql(
      `mutation($pid:ID!,$vars:[ProductVariantsBulkInput!]!){ productVariantsBulkCreate(productId:$pid, variants:$vars, strategy: REMOVE_STANDALONE_VARIANT){ userErrors{field message} } }`,
      {
        pid: product.id,
        vars: missing.map(size => ({
          optionValues: [{ optionName: sizeOption.name, name: size }],
          price,
          inventoryItem: { tracked: false },
        })),
      },
    );
    const errs = r.productVariantsBulkCreate.userErrors;
    if (errs.length) throw new Error(`${product.handle}: ${JSON.stringify(errs)}`);
  }
  extended++;
  added += missing.length;
}

console.log(`\n${APPLY ? "applied" : "dry run"}: ${extended} products extended (${added} variants added), ${ok} already complete, ${skipped} not sized`);
