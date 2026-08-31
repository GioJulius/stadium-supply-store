/**
 * Backend-agnostic commerce types.
 *
 * These shapes are the ONLY thing the frontend imports for commerce data.
 * They intentionally don't expose any Shopify-specific concepts (GraphQL
 * edges/nodes, GIDs, userErrors). The Shopify adapter in
 * `server/_core/shopify.ts` + `server/_core/shopifyNormalize.ts` are
 * responsible for normalizing into these shapes.
 *
 * Keep `Money.amount` as a `string` — it mirrors what every commerce backend
 * returns and avoids float-precision risk on totals. The UI converts to a
 * number only when calling `Intl.NumberFormat`.
 */

export type Money = {
  amount: string; // decimal string, e.g. "385.00"
  currencyCode: string; // ISO 4217, e.g. "USD"
};

export type Image = {
  url: string;
  altText: string | null;
  width?: number;
  height?: number;
};

export type ProductOption = {
  name: string; // e.g. "Size"
  values: string[]; // e.g. ["Small", "Medium", "Large"]
};

export type SelectedOption = {
  name: string;
  value: string;
};

export type ProductVariant = {
  /** Opaque variant identifier — pass back to addItem / cart mutations as-is. */
  id: string;
  /** Human label such as "Medium / Charcoal" or "Default Title". */
  title: string;
  price: Money;
  compareAtPrice: Money | null;
  availableForSale: boolean;
  /** Flat list of selected options — sized for variant pickers. */
  selectedOptions: SelectedOption[];
};

export type Product = {
  id: string;
  /** URL-friendly slug used as the route param on PDP. */
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  productType: string | null;
  vendor: string | null;
  tags: string[];
  images: Image[];
  /** Min / max across all variants — useful for "from $X" pricing. */
  priceRange: { min: Money; max: Money };
  /** Available option dimensions (e.g. Size, Color) for the variant picker. */
  options: ProductOption[];
  variants: ProductVariant[];
};

export type Collection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: Image | null;
};

/**
 * Shirt personalisation a shopper asked for on one cart line. Carried on the
 * Shopify cart line as custom attributes, so it survives the handoff to the
 * hosted checkout and lands on the order for whoever does the printing.
 */
export type Personalisation = {
  name: string;
  number: string;
};

export type CartItem = {
  /** Cart-line identifier — required for update/remove. */
  lineId: string;
  variantId: string;
  productHandle: string;
  productTitle: string;
  variantTitle: string;
  image: Image | null;
  unitPrice: Money;
  quantity: number;
  lineTotal: Money;
  /** null when the shopper took the shirt as it comes. */
  personalisation: Personalisation | null;
  /** Every cart-line custom attribute, keyed as Shopify stores them. */
  attributes: Record<string, string>;
};

export type Cart = {
  id: string;
  /** Already includes `channel=online_store` — open directly. */
  checkoutUrl: string;
  items: CartItem[];
  itemCount: number;
  subtotal: Money;
  total: Money;
};
