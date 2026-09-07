/**
 * Extends every product to the size run its category sells in.
 *
 * An early import batch created products with S-XL only, so those listings were
 * turning away every shopper above an XL on a catalogue whose supplier stocks up
 * to 5XL. New variants inherit the product's existing price and are created with
 * inventory untracked like the rest of the catalogue, so they are immediately
 * purchasable.
 *
 * Idempotent: only missing sizes are created, never removed. Against a correct
 * catalogue a dry run prints nothing, which is the test.
 *
 * THE RUNS COME FROM `shared/commerce/taxonomy.json`, NOT FROM THIS FILE. That
 * matters because this script silently stopped working once before: it matched
 * the productType strings "Soccer Fan Version" and "Football Jersey", and when
 * scripts/normalise-product-types.mjs collapsed 28 category names into 17 on
 * 7 Sep 2026 those strings ceased to exist. Nothing errored — every fan shirt
 * simply fell through to the S-2XL default and would have quietly lost its 3XL
 * and 4XL on the next sweep. Reading the same file the live smoke test pins
 * means a future rename breaks loudly, in a test, instead of here in silence.
 *
 * Sizes are the client's 7 September 2026 list, which supersedes the 27 August
 * one this script was originally written against.
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

const taxonomy = JSON.parse(
  readFileSync(new URL("../shared/commerce/taxonomy.json", import.meta.url), "utf8"),
);

/** Types this file has never heard of, counted so the run can report them. */
const unknownTypes = new Map();

/**
 * The run this product should carry, or null to leave it alone.
 *
 * Null covers two cases the sweep must not touch: kids sizes are ages set per
 * product from the batch manifest, and Service products (the printing and badge
 * fees) carry no size at all.
 *
 * An UNKNOWN type also returns null rather than falling back to a default. A
 * type this file has never heard of is an unnormalised import, and guessing
 * S-2XL at it is how the old version of this script would have quietly stripped
 * the fan run down. The live smoke test fails on exactly that condition, so the
 * fix is to normalise the catalogue, not to widen the guess here.
 */
function wantedSizes(product) {
  const type = product.productType || "";
  const entry = taxonomy.types[type];
  if (!entry) {
    unknownTypes.set(type, (unknownTypes.get(type) ?? 0) + 1);
    return null;
  }
  return entry.sizes ? taxonomy.sizeRuns[entry.sizes] : null;
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

if (unknownTypes.size) {
  console.log("");
  console.log(`${unknownTypes.size} productType(s) not in shared/commerce/taxonomy.json — left untouched:`);
  for (const [type, n] of [...unknownTypes].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${type || "(none)"}`);
  }
  console.log("Normalise them with scripts/normalise-product-types.mjs, or add the");
  console.log("category to that file if the store genuinely sells something new.");
}
