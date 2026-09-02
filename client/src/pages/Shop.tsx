import { CartDrawer } from "@/components/CartDrawer";
import { ProductCard } from "@/components/ProductCard";
import { SearchForm, StoreFooter, StoreHeader } from "@/components/StoreHeader";
import { filterAndSortProducts, isCustomerFacingMappedProduct, SHOP_PAGE_SIZE, STOREFRONT_CATALOG_FETCH_LIMIT, type CatalogFilter, type CatalogSortMode } from "@/lib/catalog";
import { trpc } from "@/lib/trpc";
import { ArrowDownUp, ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "wouter";
import { X } from "lucide-react";

/**
 * Page numbers to render: always the first and last, plus a window around the
 * current page, with gaps standing in for the rest. Keeps the control a fixed
 * width however long the archive gets.
 */
function pageNumbers(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const around = [current - 1, current, current + 1].filter(n => n > 1 && n < total);
  const out: Array<number | "gap"> = [1];
  if (around[0] > 2) out.push("gap");
  out.push(...around);
  if (around[around.length - 1] < total - 1) out.push("gap");
  out.push(total);
  return out;
}

const filters = [
  { label: "All pieces", key: "all" },
  { label: "Fan version", key: "fan" },
  { label: "Player version", key: "player" },
  { label: "Retro", key: "retro" },
  { label: "New arrivals", key: "new" },
];

export default function Shop() {
  const { data: products = [], isLoading } = trpc.commerce.products.list.useQuery({ first: STOREFRONT_CATALOG_FETCH_LIMIT });
  const [activeFilter, setActiveFilter] = useState<CatalogFilter>("all");
  const [sortMode, setSortMode] = useState<CatalogSortMode>("latest");
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

  // The archive passed 300 pieces, which is too many cards — and too many images
  // — to put on one page. Paginate the grid rather than the Shopify query, so
  // filtering and sorting still run across the whole archive and only the
  // rendering is chunked.
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / SHOP_PAGE_SIZE));
  // A filter, sort or search that shortens the list can strand the visitor on a
  // page that no longer exists; send them back to the first one.
  const currentPage = Math.min(page, pageCount);
  useEffect(() => { setPage(1); }, [activeFilter, sortMode, query, exclude]);
  const visibleProducts = useMemo(
    () => filteredProducts.slice((currentPage - 1) * SHOP_PAGE_SIZE, currentPage * SHOP_PAGE_SIZE),
    [filteredProducts, currentPage],
  );

  // Paging keeps the scroll position, which lands the visitor mid-grid on a set
  // of cards they have not seen. Put them back at the top of the grid — but not
  // on first paint, which would fight the page's own entry scroll.
  const gridTop = useRef<HTMLDivElement>(null);
  const hasPaged = useRef(false);
  useEffect(() => {
    if (!hasPaged.current) { hasPaged.current = true; return; }
    gridTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage]);

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
        <section className="shop-grid-section" ref={gridTop}>
          <SearchForm className="store-search--shop" />
          <div className="shop-toolbar">
            <p>{String(filteredProducts.length).padStart(2, "0")} pieces available{pageCount > 1 ? <span className="shop-toolbar__page"> — page {currentPage} of {pageCount}</span> : null}</p>
            <div className="catalog-controls">
              <div className="filter-strip" aria-label="Filter products">
                {filters.map(filter => <button className={activeFilter === filter.key ? "is-active" : ""} key={filter.key} onClick={() => setActiveFilter(filter.key as CatalogFilter)}>{filter.label}</button>)}
              </div>
              <label className="sort-control"><ArrowDownUp size={13} /><span>Sort</span><select value={sortMode} onChange={event => setSortMode(event.target.value as CatalogSortMode)} aria-label="Sort kits"><option value="latest">Newest first</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="name-asc">Name: A–Z</option></select></label>
            </div>
          </div>
          {isLoading ? <div className="shop-loading"><LoaderCircle className="spin" size={28} /> Curating the archive</div> : filteredProducts.length ? (
            <>
              <div className="shop-product-grid">{visibleProducts.map(product => <ProductCard key={product.id} product={product} />)}</div>
              {pageCount > 1 ? (
                <nav className="shop-pagination" aria-label="Archive pages">
                  <button onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>
                    <ChevronLeft size={15} aria-hidden="true" /> Previous
                  </button>
                  <ol>
                    {pageNumbers(currentPage, pageCount).map((entry, i) => entry === "gap"
                      ? <li key={`gap-${i}`} className="shop-pagination__gap" aria-hidden="true">…</li>
                      : <li key={entry}>
                          <button
                            onClick={() => setPage(entry)}
                            className={entry === currentPage ? "is-active" : ""}
                            aria-current={entry === currentPage ? "page" : undefined}
                          >{String(entry).padStart(2, "0")}</button>
                        </li>)}
                  </ol>
                  <button onClick={() => setPage(currentPage + 1)} disabled={currentPage === pageCount}>
                    Next <ChevronRight size={15} aria-hidden="true" />
                  </button>
                </nav>
              ) : null}
            </>
          ) : <div className="shop-empty"><p>No pieces are in this part of the archive right now.</p>{activeFilter !== "all" ? <button onClick={() => setActiveFilter("all")}>View all pieces</button> : <Link href="/shop">Browse the whole archive</Link>}</div>}
        </section>
      </main>
      <StoreFooter />
      <CartDrawer />
    </div>
  );
}
