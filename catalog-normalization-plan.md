# Stadium Supply Catalog Normalization Plan

## Current decisions

| Catalog segment | Count | Decision | Rationale |
|---|---:|---|---|
| Named and category-defined baseline records | 8 | Retain | These are the only records with a merchant-meaningful title or category. |
| Generic Drops 07–70 with matched supplied lead media | 64 | Retain as provisional | Their exact supplied-media group has been matched, but kit identity, naming, and final category still require review. |
| Unmatched supplied media groups | 32 | Do not import yet | No Shopify product will be created until the group has an identity and pricing category. |
| Generic products created before the controlled workflow | 0 additional | Stop creating | The generic import process is closed pending merchant-approved mapping. |

## Product-edit rule

Each generic drop must be updated in-place rather than duplicated once its final identity is available. The edit sequence is: confirm kit identity; update title, handle, description, tags, and price tier; confirm S–XL availability; attach the correct image order; and finally review storefront presentation.

## No destructive action without review

No product should be deleted or archived in this stage. The mapping register identifies which records are provisional; merchant review will determine whether any should later be merged, renamed, or archived.
