import { CartDrawer } from "@/components/CartDrawer";
import { SizeGuideDialog } from "@/components/SizeGuide";
import { StoreFooter, StoreHeader } from "@/components/StoreHeader";
import { useCart } from "@/contexts/CartContext";
import { isCustomerFacingMappedProduct, isPersonalisable, paragraphsFrom, STOREFRONT_CATALOG_FETCH_LIMIT } from "@/lib/catalog";
import { clubOf, isLongSleeve, kitKey, kitSlotOf, KIT_SLOT_LABELS, seasonOf, sortSizes, versionOf, VERSION_LABELS } from "@/lib/facets";
import {
  BADGE_FEE_AMOUNT,
  BADGE_FEE_LABEL,
  BADGE_OPTIONS,
  PRINTING_FEE_AMOUNT,
  PRINTING_FEE_LABEL,
  SHIPPING_RATE,
} from "@/lib/storeInfo";
import { formatMoney } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import type { Product } from "@shared/commerce/types";
import { ArrowLeft, LoaderCircle, Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useRoute } from "wouter";

function detailFromTags(product: Product) {
  const size = product.tags.find(tag => tag.toLowerCase().startsWith("size "))?.replace(/^size\s*/i, "") ?? "One size";
  const condition = product.tags.find(tag => tag.toLowerCase().includes("condition")) ?? "Curated condition";
  return { size, condition };
}

/**
 * Mirrors the server-side rules in `commerce.ts`: letters and a couple of
 * punctuation marks for the name, a squad number of 0-99. Enforced here only
 * so the shopper is corrected while typing — the router validates again before
 * anything reaches Shopify.
 */
const NAME_PATTERN = /^[A-Za-z .'-]*$/;
const NAME_MAX = 12;

/**
 * The trail above the title. Built from what the listing declares, so a kit
 * that never said its season shows "Manchester United" and stops there rather
 * than inventing a crumb.
 */
function breadcrumb(product: Product): string[] {
  const club = clubOf(product);
  const season = seasonOf(product);
  const slot = kitSlotOf(product);
  const tail = [season, slot ? KIT_SLOT_LABELS[slot] : null].filter(Boolean).join(" ");
  return ["Football", club, tail || null].filter((crumb): crumb is string => Boolean(crumb));
}

/**
 * The other listings that are the same kit in a different spec.
 *
 * Version is not a variant in this catalogue — a fan shirt and a player shirt
 * are separate products — so the only way to offer the switch the wireframe
 * draws is to find the siblings by name. `kitKey` matches maybe a fifth of the
 * archive, which is why this renders nothing at all when there is no sibling
 * instead of implying that every kit comes in three versions.
 */
function useSiblingKits(product: Product) {
  // Same query key as the shop grid, so arriving from /shop costs nothing and
  // a cold landing resolves in the background without blocking the page.
  const { data: products = [] } = trpc.commerce.products.list.useQuery({ first: STOREFRONT_CATALOG_FETCH_LIMIT });
  return useMemo(() => {
    const key = kitKey(product);
    if (!key) return [];
    return products
      .filter(isCustomerFacingMappedProduct)
      .filter(candidate => candidate.handle !== product.handle && kitKey(candidate) === key)
      .slice(0, 4);
  }, [products, product]);
}

/** "Fan", or "Fan · long sleeve" when that is what separates it from the sibling. */
function siblingLabel(product: Product): string {
  const version = versionOf(product);
  const base = version ? VERSION_LABELS[version] : "Other";
  return isLongSleeve(product) ? `${base} · long sleeve` : base;
}

function ProductView({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [wantsPersonalisation, setWantsPersonalisation] = useState(false);
  const [printName, setPrintName] = useState("");
  const [printNumber, setPrintNumber] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id ?? "");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [wantsBadge, setWantsBadge] = useState(false);
  const [badgeChoice, setBadgeChoice] = useState<string>(BADGE_OPTIONS[0]);
  const [badgeOther, setBadgeOther] = useState("");
  const { addItem, loading } = useCart();

  const variant = product.variants.find(candidate => candidate.id === selectedVariantId) ?? product.variants[0];
  const image = product.images[selectedImageIndex] ?? product.images[0];
  const { condition } = detailFromTags(product);
  // Shopify returns the option values in the order they were created, which
  // on imported products is often alphabetical — "M, L, XL … S" puts small
  // last. Sort them the way a size run actually reads.
  const sizeOptions = sortSizes(product.options.find(option => option.name.toLowerCase() === "size")?.values ?? []);
  const selectedSize = variant?.selectedOptions.find(option => option.name.toLowerCase() === "size")?.value;
  const personalisable = isPersonalisable(product);
  const siblings = useSiblingKits(product);
  const currentVersion = versionOf(product);

  // Shopify's plain `description` strips the tags without putting anything back,
  // so four paragraphs arrive as one run-on sentence. Read the paragraphs out of
  // the HTML field instead — the text is extracted rather than injected, so no
  // markup from the admin reaches the page.
  const descriptionParagraphs = paragraphsFrom(product.descriptionHtml, product.description);

  // An opted-in shopper who has typed nothing yet gets the plain shirt rather
  // than a blocked button — the form is an offer, not a required step.
  const personalisation =
    personalisable && wantsPersonalisation && (printName.trim() || printNumber.trim())
      ? { name: printName.trim(), number: printNumber.trim() }
      : undefined;

  // "Other" is a prompt, not an answer — what the shopper typed is what the
  // packer needs, and if they typed nothing the line carries no choice at all.
  const badgeSelection = badgeChoice === "Other" ? (badgeOther.trim() || undefined) : badgeChoice;

  // What the button says it will cost. Display only — the cart is recomputed
  // server-side after every mutation, and that is the number that gets paid.
  const unitPrice = Number(variant?.price.amount ?? product.priceRange.min.amount);
  const extras = (personalisation ? PRINTING_FEE_AMOUNT : 0) + (personalisable && wantsBadge ? BADGE_FEE_AMOUNT : 0);
  const runningTotal = (unitPrice + extras) * quantity;
  const currency = variant?.price.currencyCode ?? product.priceRange.min.currencyCode;

  return (
    <main className="product-detail">
      <SizeGuideDialog open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />

      <nav className="product-crumbs" aria-label="Breadcrumb">
        <Link href="/shop" className="product-back"><ArrowLeft size={14} /> Archive</Link>
        <ol>{breadcrumb(product).map(crumb => <li key={crumb}>{crumb}</li>)}</ol>
      </nav>

      <div className="product-detail__grid">
        <div className="product-detail__media">
          <div className="product-detail__image">
            {image ? <img src={image.url} alt={image.altText ?? product.title} /> : <div>Stadium Supply</div>}
            <span>{String(selectedImageIndex + 1).padStart(2, "0")} / {String(product.images.length || 1).padStart(2, "0")}</span>
          </div>
          {product.images.length > 1 || personalisation ? (
            <div className="product-detail__thumbnails" aria-label="Product image gallery">
              {product.images.map((galleryImage, index) => (
                <button
                  key={galleryImage.url}
                  type="button"
                  className={index === selectedImageIndex ? "is-selected" : ""}
                  aria-label={`View image ${index + 1} of ${product.images.length}`}
                  onClick={() => setSelectedImageIndex(index)}
                ><img src={galleryImage.url} alt="" /></button>
              ))}
              {/*
                The wireframe's live printing preview. It is a readback of what
                will be printed, not a mockup of the shirt — we have no artwork
                to composite onto a flat-lay photograph, and a fake preview that
                does not match the finished kit is worse than none.
              */}
              {personalisation ? (
                <div className="print-preview" aria-live="polite">
                  <span className="print-preview__name">{personalisation.name || "—"}</span>
                  <span className="print-preview__number">{personalisation.number || "—"}</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <section className="product-detail__content">
          <p className="eyebrow">{product.vendor || "Stadium Supply"} / {product.productType || "Football kit"}</p>
          <h1>{product.title}</h1>
          <p className="product-price">{formatMoney(variant?.price ?? product.priceRange.min)}</p>
          <p className="product-availability">
            {variant?.availableForSale ? "In stock" : "Sold out"} · flat {SHIPPING_RATE} delivery anywhere in SA
          </p>

          {siblings.length ? (
            <div className="version-switch">
              <p className="eyebrow">Also available as</p>
              <div className="version-switch__row">
                {currentVersion ? <span className="chip is-on">{siblingLabel(product)}</span> : null}
                {siblings.map(sibling => (
                  <Link key={sibling.handle} href={`/product/${sibling.handle}`} className="chip">
                    {siblingLabel(sibling)} · {formatMoney(sibling.priceRange.min)}
                  </Link>
                ))}
              </div>
              <p className="version-switch__note">Fan is the relaxed replica cut · Player is the tighter, lighter match spec</p>
            </div>
          ) : null}

          {sizeOptions.length > 0 && (
            <div className="size-picker">
              <p className="eyebrow">
                Select size <span>{selectedSize}</span>
                <button type="button" className="size-picker__guide" onClick={() => setSizeGuideOpen(true)}>Size guide</button>
              </p>
              <div>
                {sizeOptions.map(option => {
                  const matchingVariant = product.variants.find(candidate =>
                    candidate.selectedOptions.some(selected => selected.name.toLowerCase() === "size" && selected.value === option));
                  return (
                    <button
                      key={option}
                      className={matchingVariant?.id === variant?.id ? "is-selected" : ""}
                      disabled={!matchingVariant || !matchingVariant.availableForSale}
                      onClick={() => matchingVariant && setSelectedVariantId(matchingVariant.id)}
                    >{option}</button>
                  );
                })}
              </div>
            </div>
          )}

          {personalisable && (
            <div className="printing-panel">
              <div className="printing-panel__head">
                <h2>Add printing — optional</h2>
                <span>{PRINTING_FEE_LABEL}</span>
              </div>

              <label className="printing-panel__toggle">
                <input
                  type="checkbox"
                  checked={wantsPersonalisation}
                  onChange={event => setWantsPersonalisation(event.target.checked)}
                />
                <span>Print a name and number on the back</span>
              </label>

              {wantsPersonalisation && (
                <div className="printing-panel__fields">
                  <label>
                    <span className="eyebrow">Name</span>
                    <input
                      type="text"
                      value={printName}
                      maxLength={NAME_MAX}
                      placeholder="SURNAME"
                      autoComplete="off"
                      onChange={event => {
                        const next = event.target.value.toUpperCase();
                        if (NAME_PATTERN.test(next)) setPrintName(next);
                      }}
                    />
                    <small>{printName.length}/{NAME_MAX}</small>
                  </label>
                  <label className="printing-panel__number">
                    <span className="eyebrow">No.</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={printNumber}
                      placeholder="10"
                      autoComplete="off"
                      onChange={event => setPrintNumber(event.target.value.replace(/\D/g, "").slice(0, 2))}
                    />
                    <small>0–99</small>
                  </label>
                </div>
              )}

              {wantsPersonalisation && !personalisation && (
                <p className="printing-panel__hint">Add a name or a number, or untick to take the shirt as it comes.</p>
              )}

              <div className="printing-panel__badges">
                <span className="eyebrow">Competition badge <b>{BADGE_FEE_LABEL}</b></span>
                <div className="printing-panel__badge-row">
                  <button
                    type="button"
                    className={!wantsBadge ? "chip is-on" : "chip"}
                    aria-pressed={!wantsBadge}
                    onClick={() => setWantsBadge(false)}
                  >No badge</button>
                  {BADGE_OPTIONS.filter(option => option !== "Other").slice(0, 4).map(option => (
                    <button
                      key={option}
                      type="button"
                      className={wantsBadge && badgeChoice === option ? "chip is-on" : "chip"}
                      aria-pressed={wantsBadge && badgeChoice === option}
                      onClick={() => { setWantsBadge(true); setBadgeChoice(option); setBadgeOther(""); }}
                    >{option}</button>
                  ))}
                  <button
                    type="button"
                    className={wantsBadge && badgeChoice === "Other" ? "chip is-on" : "chip"}
                    aria-pressed={wantsBadge && badgeChoice === "Other"}
                    onClick={() => { setWantsBadge(true); setBadgeChoice("Other"); }}
                  >Another badge</button>
                </div>
                {/*
                  The chips show the four badges the client sells most. "Another
                  badge" opens the full list rather than dropping the other
                  competitions, because the supplier stocks more than four and a
                  shopper who knows what they want should not be turned away.
                */}
                {wantsBadge && badgeChoice === "Other" && (
                  <div className="printing-panel__other">
                    <label>
                      <span className="eyebrow">Which badge</span>
                      <select value={badgeOther} onChange={event => setBadgeOther(event.target.value)}>
                        <option value="">Choose or type below</option>
                        {BADGE_OPTIONS.filter(option => option !== "Other").map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span className="eyebrow">Or name it</span>
                      <input
                        type="text"
                        value={badgeOther}
                        maxLength={40}
                        placeholder="e.g. Copa del Rey"
                        autoComplete="off"
                        onChange={event => setBadgeOther(event.target.value)}
                      />
                    </label>
                  </div>
                )}
              </div>

              <p className="printing-panel__terms">Printed kits are made to order and cannot be returned.</p>
            </div>
          )}

          <div className="product-purchase">
            <div className="quantity-control quantity-control--large">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Minus size={15} /></button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity"><Plus size={15} /></button>
            </div>
            <button
              className="add-button"
              disabled={!variant?.availableForSale || loading}
              onClick={() => variant && addItem(variant.id, quantity, personalisation, wantsBadge, badgeSelection)}
            >
              {variant?.availableForSale
                ? <>Add to bag <span>{formatMoney({ amount: runningTotal.toFixed(2), currencyCode: currency })}</span></>
                : <>Sold out <span>↗</span></>}
            </button>
          </div>

          {descriptionParagraphs.length
            ? descriptionParagraphs.map(paragraph => <p key={paragraph} className="product-description">{paragraph}</p>)
            : <p className="product-description">A carefully sourced piece from the Stadium Supply archive.</p>}

          <dl className="product-specs">
            <div><dt>Condition</dt><dd>{condition}</dd></div>
            <div><dt>Delivery</dt><dd>Flat {SHIPPING_RATE}, door to door</dd></div>
            <div><dt>Source</dt><dd>Imported</dd></div>
          </dl>
        </section>
      </div>
    </main>
  );
}

export default function ProductDetail() {
  const [, params] = useRoute("/product/:handle");
  const handle = params?.handle ?? "";
  const { data: product, isLoading, error } = trpc.commerce.products.byHandle.useQuery({ handle }, { enabled: Boolean(handle) });
  return (
    <div className="store-page store-page--light">
      <StoreHeader />
      {isLoading ? <div className="product-loading"><LoaderCircle className="spin" size={28} /> Retrieving the piece</div> : product ? <ProductView product={product} /> : <main className="product-missing"><p>{error ? "This piece has moved on." : "That archive page is unavailable."}</p><Link href="/shop">Return to the archive</Link></main>}
      <StoreFooter />
      <CartDrawer />
    </div>
  );
}
