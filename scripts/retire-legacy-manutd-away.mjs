/**
 * Retires the legacy `Manchester United Away 26/27` listing.
 *
 * It is a leftover from the pre-Vercel catalogue: R1 350 for a single
 * "Default Title" variant with no size run, typed `Football Kit` — a category
 * name that no longer exists — and tagged `Size XL` in the old lineage's style.
 * The kit it duplicates is properly listed several times over: fan R500, player
 * R650, kids R450, long sleeve R600/R750.
 *
 * It is already unreachable. `publishedAt` is null, there is no online-store
 * URL, and its only channel publication is **Manus**, the host the store moved
 * off on 30 August 2026. So no customer can reach it and nobody can be charged
 * the R1 350 — this is tidying, not a fix.
 *
 * ARCHIVED, NOT DELETED. Archiving takes it off every channel and out of the
 * admin's active list, which is the whole of the intent, while keeping the
 * record and any order history it might carry. Deleting buys nothing over that
 * and cannot be undone. If the owner does want it gone permanently, do it from
 * the Shopify admin where the confirmation is theirs.
 *
 *   node scripts/retire-legacy-manutd-away.mjs            # dry run
 *   node scripts/retire-legacy-manutd-away.mjs --apply
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n").filter(l => l.trim() && !l.trim().startsWith("#") && l.includes("="))
    .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const APPLY = process.argv.includes("--apply");
const HANDLE = "manchester-united-away-26-27";

async function gql(query, variables = {}) {
  const res = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-04/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": env.SHOPIFY_ADMIN_API_ACCESS_TOKEN },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (!res.ok || body.errors) throw new Error(JSON.stringify(body.errors ?? body));
  return body.data;
}

async function main() {
const found = await gql(
  `query($handle:String!){ productByHandle(handle:$handle){ id title status publishedAt
     tags resourcePublicationsV2(first:10){ edges{ node{ isPublished publication{ name } } } } } }`,
  { handle: HANDLE },
);
const product = found.productByHandle;
if (!product) return console.log(`${HANDLE} is already gone — nothing to do.`);
if (product.status === "ARCHIVED") return console.log(`${product.title} is already archived.`);

const channels = product.resourcePublicationsV2.edges.filter(e => e.node.isPublished).map(e => e.node.publication.name);
console.log(`${product.title}`);
console.log(`  status ${product.status}, publishedAt ${product.publishedAt ?? "null"}, channels: ${channels.join(", ") || "none"}`);

// Refuse if it has become reachable since this was written — then it is a live
// listing somebody may be looking at, and taking it down is the owner's call.
if (product.publishedAt || channels.some(name => /online store/i.test(name))) {
  console.error("\nREFUSING: this listing is published to a customer-facing channel now.");
  console.error("It was only on the dead Manus channel when this script was written.");
  process.exitCode = 1;
  return;
}

if (!APPLY) return console.log("\ndry run — pass --apply to archive it");

const out = await gql(
  `mutation($input:ProductInput!){ productUpdate(input:$input){ product{ status } userErrors{ field message } } }`,
  { input: { id: product.id, status: "ARCHIVED" } },
);
const errs = out.productUpdate.userErrors;
if (errs.length) throw new Error(JSON.stringify(errs));
console.log(`\narchived — status is now ${out.productUpdate.product.status}`);
}

await main();
