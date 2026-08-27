# Latest Shopify Gallery Audit

**Audit basis:** Active products tagged `Mapped Media`, queried on 2026-08-26 after controlled media consolidation.

The audit confirms that every reviewed controlled product currently has **four purchasable S–XL variants**. An earlier issue affecting the first created batch—where the Small size was missing—was corrected and verified for Real Madrid 2025/26 Player, PSG 2024/25 Home, New Zealand 2024/25 Player, Italy 2026 Home, Manchester United 1992/94 Home, Netherlands 2026/27 Home, Manchester United 2023/24 Training, Arsenal 2022/23 Away, and Manchester United 1990/92 Away.

Completed recent full-gallery groups include Barcelona 2024/25 Away Lamine Yamal, Liverpool 2025/26 Training Hoodie, South Africa 2026/27 Away stills, France 2006/07 Home Zidane, PSG 2025/26 Fifth, Germany 2024/25 Home Müller, Portugal 2025/26 Home Ronaldo, FC Barcelona 2016/17 Away, Arsenal 2024/25 Goalkeeper RAYA, Liverpool 1995/96 Away, Manchester United 2007/08 Away Ronaldo, Galatasaray 2025/26 Away, and Club Brugge 2025/26 Home.

Two original source videos remain outstanding rather than being replaced or silently omitted: the Manchester United 2015/16 Presentation Jacket MP4 and South Africa 2026/27 Away MP4. Shopify rejected the available video-host URL for the first product; both require Shopify-compatible direct video ingestion before the group can be called fully complete.

The Manchester United 1992/94 Home Retro MP4 was also tested on 2026-08-27 using Shopify's `productCreateMedia` mutation with a freshly uploaded public MP4 URL. Shopify returned **“Invalid video url”** for `originalSource`, confirming that the available public-upload route is not accepted for product-video ingestion. The remaining three MP4 assets are therefore preserved as outstanding rather than substituted; a Shopify-compatible direct video source or staged-video-upload route is required to attach them.

**Approved pending status:** The store owner confirmed on 2026-08-27 that all three product-video attachments should remain pending for now. The completed image catalog stays live; no video was removed, replaced, or represented as attached.

**Final owner instruction:** Later on 2026-08-27, the owner instructed that the three videos should not be pursued further. The video items are therefore deferred with no further Shopify ingestion work scheduled. This does not affect the completed supplied-image galleries, product records, pricing, variants, or storefront behavior.

Confirmed non-duplicate decisions remain in force: PSG 2018/19 Neymar Third groups are one retained four-image product; Manchester United 2024/25 standard and Lifestyler home editions stay separate; Arsenal 2024/25 short-sleeve fan and long-sleeve authentic editions stay separate; Liverpool fan/player editions stay separate.

## Storefront validation

On 2026-08-27, the live development storefront was checked at desktop and mobile breakpoints. The catalog rendered the reviewed product cards, price tags, filters, and product routes. The AC Milan 2007/08 Home product detail page loaded its selected image, R700 price, S–XL picker, and add-to-bag action. On mobile, the product was added to the bag, the bag count changed from `00` to `01`, and the test item was then removed successfully, restoring the empty bag state. Checkout was intentionally not opened because no purchase or submission was requested.

### End-to-end filtered catalog journey

The journey was repeated after final consolidation on 2026-08-27. The **Retro** filter reduced the archive from 24 reviewed products to 3. The filtered AC Milan 2007/08 Home product card exposed the expected `/product/ac-milan-2007-08-home-jersey` destination; the destination page loaded with the S–XL selector and R700 price. A size-selection interaction, add-to-bag action, and subsequent removal were completed successfully; the bag count changed from `00` to `01` and back to `00`. The responsive mobile layout had also been captured at a 375px viewport in the project preview.

### Checkout handoff

With the owner’s confirmation, the same test cart was taken to the secure Shopify checkout handoff on 2026-08-27. Shopify opened its checkout page and correctly carried the AC Milan 2007/08 Home Jersey, size S, quantity 1, at R700. No customer details were entered and no purchase was submitted. The test item was subsequently removed from the storefront cart, restoring the bag count to `00`.

## Kit-identification approval basis

| Basis | Application in the completed catalog |
|---|---|
| **Direct owner direction** | The owner approved the controlled identity-and-consolidation workflow, the use of all supplied still images, the Small–XL size range, and the price schedule of Fan R450, Player R650, and Retro R700. The owner also approved preserving known distinct versions instead of collapsing them into duplicates. |
| **Accepted visual inference** | Individual club, season, kit type, and personalization names were inferred from the supplied-media review and recorded in the kit-consolidation register. High-confidence matches were then applied to a single existing or newly created Shopify record under the owner-approved workflow. |
| **Explicit distinct/merge reviews** | PSG 2024/25 Fourth D. Doué was merged only after duplicate review. Manchester United standard versus Lifestyler, Arsenal short-sleeve fan versus long-sleeve authentic, and Liverpool fan versus player editions were retained as distinct products after evidence review. |
| **Deferred media exception** | The three remaining product MP4s are excluded from the completed media scope by the owner’s later instruction not to pursue them. No still-image product gallery was omitted as a result. |

## Active catalog retrieval

On 2026-08-27, the active Shopify catalog was retrieved through three pages: 50 records, 50 records, and 2 records, for a total of **102 active products**. This retrieval was saved as the current reference for final catalog reconciliation. Historic `Stadium Supply Fan Jersey — Drop NN` labels in the consolidation register identify the original import lineage; the corresponding active Shopify records were subsequently renamed to the reviewed kit identities.

## Storefront visibility refresh

On 2026-08-27, the storefront catalog page size was raised to Shopify’s supported 250-product request ceiling. The active customer-facing archive now resolves **96 approved pieces**—the expected count after treating the two confirmed duplicate pairs as single retained listings and excluding the unapproved legacy records. Product cards now show the lead image, a second-image hover preview when present, and a gallery-view count. On product pages, the lead image is compact enough for size, quantity, add-to-bag, and checkout controls to remain visible without scrolling through an oversized gallery; all additional supplied still images are available as selectable thumbnails.
