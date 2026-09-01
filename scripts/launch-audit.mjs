import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(new URL("../.env", import.meta.url),"utf8").split("\n")
  .filter(l=>l.trim()&&!l.trim().startsWith("#")&&l.includes("="))
  .map(l=>[l.slice(0,l.indexOf("=")).trim(),l.slice(l.indexOf("=")+1).trim()]));
const EP=`https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-04/graphql.json`;
async function gql(query,variables={}){const r=await fetch(EP,{method:"POST",headers:{"Content-Type":"application/json","X-Shopify-Access-Token":env.SHOPIFY_ADMIN_API_ACCESS_TOKEN},body:JSON.stringify({query,variables})});const j=await r.json();if(j.errors)throw new Error(JSON.stringify(j.errors));return j.data;}
const Q=`query($c:String){products(first:100,after:$c){pageInfo{hasNextPage endCursor}edges{node{
 id handle title description descriptionHtml productType vendor tags status publishedAt
 seo{title description}
 featuredImage{url altText}
 media(first:30){edges{node{... on MediaImage{ image{url altText width height} }}}}
 variants(first:100){edges{node{id title price sku barcode inventoryPolicy inventoryQuantity availableForSale}}}
}}}}`;
let c=null,out=[];do{const d=await gql(Q,{c});out.push(...d.products.edges.map(e=>e.node));c=d.products.pageInfo.hasNextPage?d.products.pageInfo.endCursor:null;}while(c);
writeFileSync(process.argv[2],JSON.stringify(out.map(p=>({
 handle:p.handle,title:p.title,type:p.productType,vendor:p.vendor,tags:p.tags,status:p.status,
 desc:(p.description||"").trim(),descLen:(p.description||"").trim().length,
 seoTitle:p.seo?.title||"",seoDesc:p.seo?.description||"",
 images:p.media.edges.map(e=>e.node?.image).filter(Boolean).map(i=>({url:i.url,alt:i.altText,w:i.width,h:i.height})),
 variants:p.variants.edges.map(e=>e.node),
})),null,1));
console.log("dumped",out.length);
