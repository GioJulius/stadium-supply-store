# Client Pricing, Sizing, and Customisation Audit

## Source of truth

This audit records the client’s pricing and size instructions received on 2026-08-27. It supersedes the earlier provisional Fan Version price of R450. No catalog pricing or variant range has been changed under this rule set yet.

| Client category | Price | Requested sizes | Safe mapping rule |
|---|---:|---|---|
| Soccer Fan Version | R500 | S–4XL | Products classified as **Fan Version** in `kit-consolidation-register.md` |
| Soccer Player Version | R650 | S–2XL | Products classified as **Player Version** in `kit-consolidation-register.md` |
| Soccer Retro/Vintage | R700 | S–2XL | Products classified as **Retro** in `kit-consolidation-register.md` |
| Soccer custom badge | +R50 | N/A | Optional paid service; needs cart/checkout add-on design |
| Name and number | +R50 | N/A | Optional paid service; needs text input and cart/checkout add-on design |
| Long sleeve, where available | +R100 | Product-specific | Only products explicitly offered in long-sleeve form |
| Soccer hoodie | R850 | S–2XL | Explicit hoodie products only |
| Half-zip training tracksuit | R850 | S–2XL | Needs visual/product-type confirmation |
| Full-zip tracksuit | R1,000 | S–2XL | Needs visual/product-type confirmation |
| Windbreaker or jacket only | R1,000 | S–2XL | Needs visual/product-type confirmation |
| Chinese jacket | R1,200 | S–2XL | Explicit Chinese New Year / Chinese jacket products only |
| Full windbreaker tracksuit | R1,200 | S–2XL | Needs visual/product-type confirmation |
| Adidas/Nike training top and shorts | R600 | S–2XL | Needs a matching top-and-shorts product/set |
| Adidas/Nike plain half-zip tracksuit | R700 | S–2XL | Needs visual/product-type confirmation |
| Adidas/Nike plain full-zip tracksuit | R850 | S–2XL | Needs visual/product-type confirmation |
| Kiddies soccer set | R450 | 2–3, 4–5, 6–7, 8–9, 10–11 | No currently identified customer-facing item is confidently classed as kiddies |
| Adults training / vest-and-shorts set | R700 | S–2XL | Needs a matching set product |
| Rugby jersey — adult | R700 | S–5XL | Apply only to confirmed rugby records |
| Rugby jersey — kiddies | R550 | 2–3, 4–5, 6–7, 8–9, 10–11 | No currently identified customer-facing item is confidently classed as kiddies rugby |
| F1 jersey | R650 | S–2XL | Apply only to confirmed motorsport jersey/polo records |
| F1 jacket | R1,200 | S–2XL | Apply only to confirmed motorsport jackets |

## Existing catalog audit

The active catalog contains **102 Shopify products**, while the customer-facing Stadium Supply storefront exposes the reviewed set of **96 approved products**. The existing reviewed kit register provides a reliable Fan/Player/Retro classification for the shirt products; the remaining product types require one additional classification pass rather than a blanket price update.

| Audit result | Current state | Required treatment |
|---|---|---|
| Standard soccer shirts | Classified as Fan, Player, or Retro in the kit register; currently four size variants | Safe to update to the new stated price and requested maximum size range once approved for bulk application |
| Explicit soccer hoodies | Arsenal 2023/24 Training Hoodie, Arsenal 2024/25 Training Hoodie, Liverpool 2025/26 Training Hoodie | Price to R850 and extend to S–2XL after confirmation |
| Explicit Chinese jacket | Manchester United 2025/26 Chinese New Year Anthem Jacket | Price to R1,200 and extend to S–2XL after confirmation |
| Rugby candidates | Fijian 7s 2025/26 Home Jersey and Blues 2026 30th Anniversary Home Jersey | Need a final confirmation that both are adult rugby products before applying R700 and S–5XL |
| F1 candidates | Red Bull Racing 2021/22 Training Jersey and Training Polo | Need a final confirmation that both should use the F1 jersey R650 tier and S–2XL range |
| Training jackets, tops, and tracksuits | Liverpool, Arsenal, PSG, Manchester United, Inter Miami, and Manchester City training/presentation products | Product names alone do not reliably distinguish half-zip, full-zip, windbreaker, plain tracksuit, or top-and-shorts pricing. Hold for visual classification. |

## Recommended customisation implementation

The current Shopify/cart data path only submits a selected **size variant**. It cannot add a paid name, number, badge, or long-sleeve surcharge as a cart attribute today. Rendering a form alone would create an unpriced, non-orderable request.

The appropriate approach is to create three optional paid service products—**Badge (+R50)**, **Name & Number (+R50)**, and **Long Sleeve (+R100)**—and add their chosen variants to the same Shopify cart as the base jersey. The jersey line must store the typed name/number as line-item attributes so it follows the order to fulfilment. Eligibility can be controlled by the reviewed product classification and the fact that a product already has a long-sleeve version available.

This keeps the base jersey’s size options simple, produces visible paid add-ons in the cart and checkout, and preserves the custom text for the fulfilment team. It requires a small extension to the shared commerce/cart contract and storefront cart UI before activation.

## Confirmation needed before price changes

Before making a bulk price and size update, obtain a single confirmation on the following classifications:

1. Treat **Fijian 7s** and **Blues 2026** as adult rugby jerseys at R700, S–5XL.
2. Treat both **Red Bull Racing** jersey/polo products as F1 jerseys at R650, S–2XL.
3. Confirm how each training jacket/tracksuit should map to the client’s R600/R700/R850/R1,000/R1,200 categories after visual review.
4. Confirm whether customisation should be available on all adult soccer jerseys or only on selected Fan/Player products; long sleeve must remain product-specific.
