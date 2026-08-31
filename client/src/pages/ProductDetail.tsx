import { CartDrawer } from "@/components/CartDrawer";
import { SizeGuideDialog } from "@/components/SizeGuide";
import { StoreFooter, StoreHeader } from "@/components/StoreHeader";
import { useCart } from "@/contexts/CartContext";
import { isPersonalisable } from "@/lib/catalog";
import { formatMoney } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import type { Product } from "@shared/commerce/types";
import { ArrowLeft, Check, LoaderCircle, Minus, Plus } from "lucide-react";
import { useState } from "react";
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

function ProductView({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [wantsPersonalisation, setWantsPersonalisation] = useState(false);
  const [printName, setPrintName] = useState("");
  const [printNumber, setPrintNumber] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id ?? "");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const { addItem, loading } = useCart();
  const variant = product.variants.find(candidate => candidate.id === selectedVariantId) ?? product.variants[0];
  const image = product.images[selectedImageIndex] ?? product.images[0];
  const { size, condition } = detailFromTags(product);
  const sizeOptions = product.options.find(option => option.name.toLowerCase() === "size")?.values ?? [];
  const selectedSize = variant?.selectedOptions.find(option => option.name.toLowerCase() === "size")?.value;
  const personalisable = isPersonalisable(product);
  // An opted-in shopper who has typed nothing yet gets the plain shirt rather
  // than a blocked button — the form is an offer, not a required step.
  const personalisation =
    personalisable && wantsPersonalisation && (printName.trim() || printNumber.trim())
      ? { name: printName.trim(), number: printNumber.trim() }
      : undefined;
  return (
    <main className="product-detail">
      <SizeGuideDialog open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
      <Link href="/shop" className="product-back"><ArrowLeft size={15} /> Back to archive</Link>
        <div className="product-detail__grid">
        <div className="product-detail__media">
          <div className="product-detail__image">{image ? <img src={image.url} alt={image.altText ?? product.title} /> : <div>Stadium Supply</div>}<span>{String(selectedImageIndex + 1).padStart(2, "0")} / {String(product.images.length || 1).padStart(2, "0")}</span></div>
          {product.images.length > 1 ? <div className="product-detail__thumbnails" aria-label="Product image gallery">{product.images.map((galleryImage, index) => <button key={galleryImage.url} type="button" className={index === selectedImageIndex ? "is-selected" : ""} aria-label={`View image ${index + 1} of ${product.images.length}`} onClick={() => setSelectedImageIndex(index)}><img src={galleryImage.url} alt="" /></button>)}</div> : null}
        </div>
        <section className="product-detail__content">
          <p className="eyebrow">{product.vendor || "Stadium Supply"} / {product.productType || "Football kit"}</p>
          <h1>{product.title}</h1>
          <p className="product-price">{formatMoney(variant?.price ?? product.priceRange.min)}</p>
          <p className="product-description">{product.description || "A carefully sourced piece from the Stadium Supply archive."}</p>
          <dl className="product-specs">
            <div><dt>Condition</dt><dd>{condition}</dd></div>
            <div><dt>Size</dt><dd>{sizeOptions.length ? "Small–XL" : size}</dd></div>
            <div><dt>Source</dt><dd>Imported</dd></div>
          </dl>
          {sizeOptions.length > 0 && <div className="size-picker"><p className="eyebrow">Select size <span>{selectedSize}</span><button type="button" className="size-picker__guide" onClick={() => setSizeGuideOpen(true)}>Size guide</button></p><div>{sizeOptions.map(option => { const matchingVariant = product.variants.find(candidate => candidate.selectedOptions.some(selected => selected.name.toLowerCase() === "size" && selected.value === option)); return <button key={option} className={matchingVariant?.id === variant?.id ? "is-selected" : ""} disabled={!matchingVariant || !matchingVariant.availableForSale} onClick={() => matchingVariant && setSelectedVariantId(matchingVariant.id)}>{option}</button>; })}</div></div>}
          {personalisable && (
            <div className="personalisation">
              <label className="personalisation__toggle">
                <input
                  type="checkbox"
                  checked={wantsPersonalisation}
                  onChange={event => setWantsPersonalisation(event.target.checked)}
                />
                <span>Print my name and number — free</span>
              </label>
              {wantsPersonalisation && (
                <div className="personalisation__fields">
                  <label>
                    <span className="eyebrow">Name on back</span>
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
                  <label>
                    <span className="eyebrow">Number</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={printNumber}
                      placeholder="10"
                      autoComplete="off"
                      onChange={event => {
                        const next = event.target.value.replace(/\D/g, "").slice(0, 2);
                        setPrintNumber(next);
                      }}
                    />
                    <small>0-99</small>
                  </label>
                </div>
              )}
              {wantsPersonalisation && !personalisation && (
                <p className="personalisation__hint">Add a name or a number, or untick to take the shirt as it comes.</p>
              )}
            </div>
          )}
          <div className="product-purchase">
            <div className="quantity-control quantity-control--large">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Minus size={15} /></button><span>{quantity}</span><button onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity"><Plus size={15} /></button>
            </div>
            <button className="add-button" disabled={!variant?.availableForSale || loading} onClick={() => variant && addItem(variant.id, quantity, personalisation)}>
              {variant?.availableForSale ? "Add to bag" : "Sold out"}<span>↗</span>
            </button>
          </div>
          <div className="product-assurance"><Check size={16} /><p>Every piece is checked before it enters the archive. Individual character is part of the story.</p></div>
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
