/**
 * Remove the Express shipping rate, leaving Standard (R100) as the only
 * domestic option. Asked for by the client on 11 Sep 2026:
 * "can you please remove the express option".
 *
 * Express is not in this codebase — the cart drawer prices a flat R100 and
 * checkout is Shopify's, so the extra rate lives in the Shopify delivery
 * profile and nowhere else. Grepping the app for "Express" finds nothing.
 *
 * The domestic zone also carries a SECOND, conditional Standard rate at R0
 * (free over a cart threshold). That is left alone — it is still Standard,
 * and it is the client's promotion to remove, not a stray option.
 *
 * Idempotent: prints and exits if there is no Express definition left.
 *
 *   node scripts/remove-express-shipping.mjs            # dry run
 *   node scripts/remove-express-shipping.mjs --apply
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

const PROFILES = `{ deliveryProfiles(first:10){edges{node{ id name
  profileLocationGroups{ locationGroupZones(first:20){edges{node{
    zone{ id name }
    methodDefinitions(first:50){edges{node{ id name active
      rateProvider{ ... on DeliveryRateDefinition { price{ amount currencyCode } } } }}} }}} } }}} }`;

const d = await gql(PROFILES);

/* Shopify returns synthetic ids for rates that exist only as a condition on
   another rate ("...?source=RateRangeCondition&source_id=..."). Those are not
   deletable definitions of their own — skip anything with a query string. */
const targets = [];
for (const pe of d.deliveryProfiles.edges) {
  for (const lg of pe.node.profileLocationGroups) {
    for (const ze of lg.locationGroupZones.edges) {
      for (const me of ze.node.methodDefinitions.edges) {
        const m = me.node;
        if (m.id.includes("?")) continue;
        if (!/express/i.test(m.name)) continue;
        targets.push({ profileId: pe.node.id, zone: ze.node.zone.name, m });
      }
    }
  }
}

/* Deliberately no process.exit() anywhere: on Windows, exiting while the fetch
   sockets are still closing trips a libuv assertion and the shell reports exit
   127 on an otherwise successful run. Let the event loop drain instead. */

const UPDATE = `mutation($id:ID!,$profile:DeliveryProfileInput!){
  deliveryProfileUpdate(id:$id, profile:$profile){ userErrors{field message} } }`;

if (!targets.length) {
  console.log("no Express rate found — nothing to do.");
} else {
  for (const t of targets) {
    console.log(`${APPLY ? "DELETE" : "would delete"}  ${t.zone} / "${t.m.name}"  R${t.m.rateProvider?.price?.amount ?? "?"}`);
  }

  if (!APPLY) {
    console.log("\ndry run — re-run with --apply to write.");
  } else {
    for (const t of targets) {
      const r = await gql(UPDATE, { id: t.profileId, profile: { methodDefinitionsToDelete: [t.m.id] } });
      const errs = r.deliveryProfileUpdate.userErrors;
      if (errs.length) throw new Error(JSON.stringify(errs));
    }
    console.log(`\ndeleted ${targets.length} rate(s). Standard R100 is now the only domestic option.`);
  }
}
