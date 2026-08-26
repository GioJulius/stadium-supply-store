import { CartDrawer } from "@/components/CartDrawer";
import { ProductCard } from "@/components/ProductCard";
import { StoreFooter, StoreHeader } from "@/components/StoreHeader";
import { trpc } from "@/lib/trpc";
import { LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";

const filters = ["All pieces", "Football", "New arrivals", "Manchester United"];

export default function Shop() {
  const { data: products = [], isLoading } = trpc.commerce.products.list.useQuery({ first: 24 });
  const [activeFilter, setActiveFilter] = useState("All pieces");
  const filteredProducts = useMemo(() => activeFilter === "All pieces" ? products : products.filter(product => (
    product.tags.some(tag => tag.toLowerCase().includes(activeFilter.toLowerCase().replace(" arrivals", ""))) ||
    (product.productType ?? "").toLowerCase().includes(activeFilter.toLowerCase())
  )), [activeFilter, products]);

  return (
    <div className="store-page store-page--light">
      <StoreHeader />
      <main>
        <section className="shop-intro">
          <p className="section-index">02 / The archive</p>
          <h1>Football,<br /><em>collected.</em></h1>
          <p>Rare shirts, cult classics, and contemporary drops selected for the way they carry the game beyond matchday.</p>
        </section>
        <section className="shop-grid-section">
          <div className="shop-toolbar">
            <p>{String(filteredProducts.length).padStart(2, "0")} pieces available</p>
            <div className="filter-strip" aria-label="Filter products">
              {filters.map(filter => <button className={activeFilter === filter ? "is-active" : ""} key={filter} onClick={() => setActiveFilter(filter)}>{filter}</button>)}
            </div>
          </div>
          {isLoading ? <div className="shop-loading"><LoaderCircle className="spin" size={28} /> Curating the archive</div> : filteredProducts.length ? (
            <div className="shop-product-grid">{filteredProducts.map(product => <ProductCard key={product.id} product={product} />)}</div>
          ) : <div className="shop-empty"><p>No pieces are in this part of the archive right now.</p><button onClick={() => setActiveFilter("All pieces")}>View all pieces</button></div>}
        </section>
      </main>
      <StoreFooter />
      <CartDrawer />
    </div>
  );
}
