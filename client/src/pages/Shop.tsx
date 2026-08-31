import { CartDrawer } from "@/components/CartDrawer";
import { ProductCard } from "@/components/ProductCard";
import { StoreFooter, StoreHeader } from "@/components/StoreHeader";
import { filterAndSortProducts, isCustomerFacingMappedProduct, STOREFRONT_CATALOG_PAGE_SIZE, type CatalogFilter, type CatalogSortMode } from "@/lib/catalog";
import { trpc } from "@/lib/trpc";
import { ArrowDownUp, LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "wouter";
import { X } from "lucide-react";

const filters = [
  { label: "All pieces", key: "all" },
  { label: "Fan version", key: "fan" },
  { label: "Player version", key: "player" },
  { label: "Retro", key: "retro" },
  { label: "New arrivals", key: "new" },
];

export default function Shop() {
  const { data: products = [], isLoading } = trpc.commerce.products.list.useQuery({ first: STOREFRONT_CATALOG_PAGE_SIZE });
  const [activeFilter, setActiveFilter] = useState<CatalogFilter>("all");
  const [sortMode, setSortMode] = useState<CatalogSortMode>("featured");
  // The menu navigates by free-text term (`q`) and carries the wording it used
  // (`label`) so the heading reads back the club the visitor actually clicked.
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const exclude = searchParams.get("not") ?? "";
  const queryLabel = searchParams.get("label") ?? query;
  const mappedProducts = useMemo(() => products.filter(isCustomerFacingMappedProduct), [products]);
  const filteredProducts = useMemo(
    () => filterAndSortProducts(mappedProducts, activeFilter, sortMode, query, exclude),
    [activeFilter, mappedProducts, sortMode, query, exclude],
  );

  return (
    <div className="store-page store-page--light">
      <StoreHeader />
      <main>
        <section className="shop-intro">
          <p className="section-index">02 / The archive</p>
          {query ? (
            <>
              <h1>{queryLabel},<br /><em>collected.</em></h1>
              <Link href="/shop" className="shop-intro__clear">Clear filter <X size={14} /></Link>
            </>
          ) : (
            <>
              <h1>Football,<br /><em>collected.</em></h1>
              <p>Rare shirts, cult classics, and contemporary drops selected for the way they carry the game beyond matchday.</p>
            </>
          )}
        </section>
        <section className="shop-grid-section">
          <div className="shop-toolbar">
            <p>{String(filteredProducts.length).padStart(2, "0")} pieces available</p>
            <div className="catalog-controls">
              <div className="filter-strip" aria-label="Filter products">
                {filters.map(filter => <button className={activeFilter === filter.key ? "is-active" : ""} key={filter.key} onClick={() => setActiveFilter(filter.key as CatalogFilter)}>{filter.label}</button>)}
              </div>
              <label className="sort-control"><ArrowDownUp size={13} /><span>Sort</span><select value={sortMode} onChange={event => setSortMode(event.target.value as CatalogSortMode)} aria-label="Sort kits"><option value="featured">Featured</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="name-asc">Name: A–Z</option></select></label>
            </div>
          </div>
          {isLoading ? <div className="shop-loading"><LoaderCircle className="spin" size={28} /> Curating the archive</div> : filteredProducts.length ? (
            <div className="shop-product-grid">{filteredProducts.map(product => <ProductCard key={product.id} product={product} />)}</div>
          ) : <div className="shop-empty"><p>No pieces are in this part of the archive right now.</p>{activeFilter !== "all" ? <button onClick={() => setActiveFilter("all")}>View all pieces</button> : <Link href="/shop">Browse the whole archive</Link>}</div>}
        </section>
      </main>
      <StoreFooter />
      <CartDrawer />
    </div>
  );
}
