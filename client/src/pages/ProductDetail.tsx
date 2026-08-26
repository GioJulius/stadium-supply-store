import { CartDrawer } from "@/components/CartDrawer";
import { StoreFooter, StoreHeader } from "@/components/StoreHeader";
import { useCart } from "@/contexts/CartContext";
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

function ProductView({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const { addItem, loading } = useCart();
  const variant = product.variants[0];
  const image = product.images[0];
  const { size, condition } = detailFromTags(product);
  return (
    <main className="product-detail">
      <Link href="/shop" className="product-back"><ArrowLeft size={15} /> Back to archive</Link>
      <div className="product-detail__grid">
        <div className="product-detail__image">{image ? <img src={image.url} alt={image.altText ?? product.title} /> : <div>Stadium Supply</div>}<span>01 / 01</span></div>
        <section className="product-detail__content">
          <p className="eyebrow">{product.vendor || "Stadium Supply"} / {product.productType || "Football kit"}</p>
          <h1>{product.title}</h1>
          <p className="product-price">{formatMoney(variant?.price ?? product.priceRange.min)}</p>
          <p className="product-description">{product.description || "A carefully sourced piece from the Stadium Supply archive."}</p>
          <dl className="product-specs">
            <div><dt>Condition</dt><dd>{condition}</dd></div>
            <div><dt>Size</dt><dd>{size}</dd></div>
            <div><dt>Source</dt><dd>Imported</dd></div>
          </dl>
          <div className="product-purchase">
            <div className="quantity-control quantity-control--large">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Minus size={15} /></button><span>{quantity}</span><button onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity"><Plus size={15} /></button>
            </div>
            <button className="add-button" disabled={!variant?.availableForSale || loading} onClick={() => variant && addItem(variant.id, quantity)}>
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
