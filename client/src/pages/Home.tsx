import { CartDrawer } from "@/components/CartDrawer";
import { ProductCard } from "@/components/ProductCard";
import { StoreFooter, StoreHeader } from "@/components/StoreHeader";
import { trpc } from "@/lib/trpc";
import { ArrowDownRight, ArrowUpRight, Check, Instagram, LoaderCircle } from "lucide-react";
import { Link } from "wouter";

const HERO_IMAGE = "/manus-storage/stadium-supply-hero_3813b1fa.png";

export default function Home() {
  const { data: products = [], isLoading } = trpc.commerce.products.list.useQuery({ first: 8 });
  const latest = products.slice(0, 4);

  return (
    <div className="store-page">
      <StoreHeader />
      <main>
        <section className="hero-section">
          <img className="hero-section__image" src={HERO_IMAGE} alt="Stadium Supply football shirts under a blue sky" />
          <div className="hero-section__veil" />
          <div className="hero-section__frame" aria-hidden="true"><span /><span /><span /><span /></div>
          <div className="hero-section__meta"><p>001 / SS-26</p><p>Curated sport culture</p></div>
          <div className="hero-section__content">
            <p className="hero-section__kicker">From the stands<br />to the streets</p>
            <h1>Wear the<br /><em>game.</em></h1>
            <Link href="/shop" className="hero-cta"><span>Shop new arrivals</span><ArrowDownRight size={22} /></Link>
          </div>
          <p className="hero-section__side">Football archive / 2026</p>
        </section>

        <section className="moving-line" aria-label="Brand message"><div><span>Football lives here</span><i>✦</i><span>Rare shirts, real stories</span><i>✦</i><span>Stadium Supply</span><i>✦</i><span>Football lives here</span></div></section>

        <section className="latest-section">
          <div className="section-heading"><p className="section-index">01 / Latest drop</p><div><h2>New<br /><em>arrivals.</em></h2><p>Selected pieces, ready for their next chapter.</p></div></div>
          {isLoading ? <div className="product-loading product-loading--compact"><LoaderCircle className="spin" size={23} /> Loading pieces</div> : latest.length ? <div className="latest-grid">{latest.map((product, index) => <ProductCard key={product.id} product={product} featured={index === 0} />)}</div> : <div className="shop-empty"><p>The next drop is being prepared.</p><Link href="/shop">Visit the archive</Link></div>}
          <Link href="/shop" className="outline-cta">View the archive <ArrowUpRight size={17} /></Link>
        </section>

        <section className="manifesto-section">
          <div className="manifesto-section__number">02</div>
          <p className="eyebrow">A kit is never just a kit</p>
          <h2>Every shirt has<br />a <em>second half.</em></h2>
          <div className="manifesto-section__copy"><p>We source pieces that carry the feeling of matchday into the rest of the week. Club histories, bright away days, perfectly worn details — all part of the uniform.</p><Link href="/shop">Explore the edit <ArrowUpRight size={17} /></Link></div>
        </section>

        <section className="collections-section">
          <div className="collections-section__top"><p className="section-index">03 / Shop by story</p><p>Find the piece that speaks your language.</p></div>
          <div className="collection-tiles">
            <Link href="/shop?category=football" className="collection-tile collection-tile--one"><span>01</span><h3>Club<br />football</h3><ArrowUpRight size={22} /></Link>
            <Link href="/shop?category=football" className="collection-tile collection-tile--two"><span>02</span><h3>National<br />colours</h3><ArrowUpRight size={22} /></Link>
            <Link href="/shop?category=football" className="collection-tile collection-tile--three"><span>03</span><h3>Retro<br />icons</h3><ArrowUpRight size={22} /></Link>
          </div>
        </section>

        <section className="assurance-section">
          <div className="assurance-section__heading"><p className="section-index">04 / Our standard</p><h2>Keep it<br /><em>authentic.</em></h2></div>
          <div className="assurance-list">
            <article><Check size={18} /><h3>Curated condition</h3><p>Clear grading and honest detail, piece by piece.</p></article>
            <article><Check size={18} /><h3>Global sourcing</h3><p>Original sport culture found across eras and borders.</p></article>
            <article><Check size={18} /><h3>Made to be worn</h3><p>For the terraces, the streets, and everywhere in between.</p></article>
          </div>
        </section>

        <section className="instagram-section">
          <div className="instagram-section__stamp"><Instagram size={26} /><span>@stadium.supply</span></div>
          <h2>Follow the<br /><em>movement.</em></h2>
          <a href="https://www.instagram.com/stadium.supply/" target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={20} /></a>
        </section>
      </main>
      <StoreFooter />
      <CartDrawer />
    </div>
  );
}
