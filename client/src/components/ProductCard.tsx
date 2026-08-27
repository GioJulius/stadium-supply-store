import type { Product } from "@shared/commerce/types";
import { formatMoney } from "@/lib/format";
import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

function productBadge(product: Product) {
  if (product.tags.some(tag => tag.toLowerCase().includes("new"))) return "New arrival";
  if (product.tags.some(tag => tag.toLowerCase().includes("excellent"))) return "Excellent condition";
  return product.productType || "Curated piece";
}

export function ProductCard({ product, featured = false }: { product: Product; featured?: boolean }) {
  const image = product.images[0];
  const alternateImage = product.images[1];
  const minPrice = product.priceRange.min;
  const sizeValues = product.options.find(option => option.name.toLowerCase() === "size")?.values;
  return (
    <Link href={`/product/${product.handle}`} className={`product-card ${featured ? "product-card--featured" : ""}`}>
      <div className="product-card__visual">
        {image ? <img src={image.url} alt={image.altText ?? product.title} /> : <div className="product-card__fallback">Stadium<br />Supply</div>}
        {alternateImage ? <img className="product-card__image--alternate" src={alternateImage.url} alt="" aria-hidden="true" /> : null}
        <span className="product-card__badge">{productBadge(product)}</span>
        <span className="product-card__price-tag">{formatMoney(minPrice)}</span>
        {product.images.length > 1 ? <span className="product-card__gallery-count">{String(product.images.length).padStart(2, "0")} views</span> : null}
        <span className="product-card__quick">Shop this kit</span>
        <span className="product-card__arrow"><ArrowUpRight size={19} /></span>
      </div>
      <div className="product-card__details">
        <div><p>{product.vendor || "Stadium Supply"}</p><h3>{product.title}</h3>{sizeValues?.length ? <span className="product-card__sizes">Sizes {sizeValues.join(" · ")}</span> : null}</div>
        <strong>{formatMoney(minPrice)}</strong>
      </div>
    </Link>
  );
}
