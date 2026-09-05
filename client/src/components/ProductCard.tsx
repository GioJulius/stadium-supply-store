import type { Product } from "@shared/commerce/types";
import { formatMoney } from "@/lib/format";
import { sizeRangeLabel, sizesInStock, versionOf, VERSION_LABELS } from "@/lib/facets";
import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

/**
 * The badge in the corner of the card. Version leads when the listing declares
 * one, because that is what the shopper is filtering on and what separates two
 * otherwise identical photographs of the same kit; condition and product type
 * stand in for the listings that never said.
 */
function productBadge(product: Product) {
  const version = versionOf(product);
  if (version) return VERSION_LABELS[version];
  if (product.tags.some(tag => tag.toLowerCase().includes("new"))) return "New arrival";
  if (product.tags.some(tag => tag.toLowerCase().includes("excellent"))) return "Excellent condition";
  return product.productType || "Curated piece";
}

export function ProductCard({ product, featured = false }: { product: Product; featured?: boolean }) {
  const image = product.images[0];
  const alternateImage = product.images[1];
  const minPrice = product.priceRange.min;
  // Saying the size run on the card is what stops the dead-end click the
  // wireframe calls out — a shopper who wears 4XL can see from the grid
  // whether opening the kit is worth it.
  const sizes = sizesInStock(product);
  const sizeRange = sizeRangeLabel(sizes);
  return (
    <Link href={`/product/${product.handle}`} className={`product-card ${featured ? "product-card--featured" : ""}`}>
      <div className="product-card__visual">
        {image ? <img src={image.url} alt={image.altText ?? product.title} /> : <div className="product-card__fallback">Stadium<br />Supply</div>}
        {alternateImage ? <img className="product-card__image--alternate" src={alternateImage.url} alt="" aria-hidden="true" /> : null}
        <div className="product-card__toprow">
          <span className="product-card__badge">{productBadge(product)}</span>
          <span className="product-card__price-tag">{formatMoney(minPrice)}</span>
        </div>
        {product.images.length > 1 ? <span className="product-card__gallery-count">{String(product.images.length).padStart(2, "0")} views</span> : null}
        <span className="product-card__quick">Shop this kit</span>
        <span className="product-card__arrow"><ArrowUpRight size={19} /></span>
      </div>
      <div className="product-card__details">
        <h3>{product.title}</h3>
        <div className="product-card__meta">
          <strong>{formatMoney(minPrice)}</strong>
          <span className="product-card__sizes">{sizeRange ? `${sizeRange} in stock` : "Sold out"}</span>
        </div>
      </div>
    </Link>
  );
}
