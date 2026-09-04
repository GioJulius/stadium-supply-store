/**
 * The 4 Sep 2026b batch created "South Africa Gold Home Fan Version" from the
 * two Kappa photographs in the client's WhatsApp export. It is the same
 * garment as the "South Africa Retro Goalkeeper Jersey (Kappa Kombat)" already
 * on the store — the gold, black and white Kappa Kombat shirt — which the
 * dedupe pass missed because it compared the export only against the Germany
 * and Spain listings, and this shirt was neither.
 *
 * The existing listing wins: its title is the accurate one (this is the
 * goalkeeper shirt, not a home shirt). This moves the two new photographs onto
 * it, taking it from two images to four, and deletes the duplicate.
 *
 * Usage: node scripts/fix-south-africa-duplicate-0904b.mjs [--apply]
 */
import { readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .filter(l => l.trim() && !l.trim().startsWith("#") && l.includes("="))
    .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const ENDPOINT = `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-04/graphql.json`;
const TOKEN = env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
const APPLY = process.argv.includes("--apply");

const STAGE_DIR = fileURLToPath(new URL("../import/batch-0904b/", import.meta.url));
const KEEP_HANDLE = "south-africa-2024-25-gk-jersey-kappa-kombat";
const DROP_HANDLE = "south-africa-gold-home-fan-version";
const PHOTOS = ["z02.jpg", "z01.jpg"];

async function gql(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (!res.ok || body.errors) throw new Error(JSON.stringify(body.errors ?? body));
  return body.data;
}

async function stageAndUpload(path) {
  const size = statSync(path).size;
  const filename = basename(path);
  const staged = await gql(
    `mutation($input:[StagedUploadInput!]!){ stagedUploadsCreate(input:$input){ stagedTargets{ url resourceUrl parameters{name value} } userErrors{field message} } }`,
    { input: [{ resource: "IMAGE", filename, mimeType: "image/jpeg", httpMethod: "POST", fileSize: String(size) }] },
  );
  const target = staged.stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  for (const p of target.parameters) form.append(p.name, p.value);
  form.append("file", new Blob([readFileSync(path)], { type: "image/jpeg" }), filename);
  const up = await fetch(target.url, { method: "POST", body: form });
  if (!up.ok) throw new Error(`staged upload failed ${up.status}`);
  return target.resourceUrl;
}

const keep = (await gql(`query($h:String!){ productByHandle(handle:$h){ id title media(first:20){nodes{id}} } }`, { h: KEEP_HANDLE })).productByHandle;
const drop = (await gql(`query($h:String!){ productByHandle(handle:$h){ id title } }`, { h: DROP_HANDLE })).productByHandle;
if (!keep) throw new Error(`survivor ${KEEP_HANDLE} not found`);
console.log(`keep   ${keep.title} (${keep.media.nodes.length} media)`);
console.log(`drop   ${drop ? drop.title : "(already gone)"}`);
if (!APPLY) { console.log("\ndry run — pass --apply"); process.exit(0); }

const sources = [];
for (const f of PHOTOS) sources.push(await stageAndUpload(join(STAGE_DIR, f)));
const added = await gql(
  `mutation($id:ID!,$media:[CreateMediaInput!]!){ productCreateMedia(productId:$id, media:$media){ mediaUserErrors{field message} } }`,
  {
    id: keep.id,
    media: sources.map(originalSource => ({ originalSource, mediaContentType: "IMAGE", alt: `${keep.title} — supplier view` })),
  },
);
if (added.productCreateMedia.mediaUserErrors.length) throw new Error(JSON.stringify(added.productCreateMedia.mediaUserErrors));
console.log(`added  ${sources.length} photographs to ${keep.title}`);

if (drop) {
  const del = await gql(`mutation($input:ProductDeleteInput!){ productDelete(input:$input){ deletedProductId userErrors{field message} } }`, { input: { id: drop.id } });
  if (del.productDelete.userErrors.length) throw new Error(JSON.stringify(del.productDelete.userErrors));
  console.log(`deleted ${drop.title}`);
}
