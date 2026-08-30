import { CartDrawer } from "@/components/CartDrawer";
import { ProductCard } from "@/components/ProductCard";
import { StoreFooter, StoreHeader } from "@/components/StoreHeader";
import { isCustomerFacingMappedProduct, STOREFRONT_CATALOG_PAGE_SIZE } from "@/lib/catalog";
import { STORY_TILES } from "@/lib/storyTiles";
import { trpc } from "@/lib/trpc";
import { ArrowDownRight, ArrowUpRight, Check, Instagram, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";

const HERO_VIDEO = "/media/hero-jerseys-in-the-sun.mp4";
const HERO_POSTER = "/media/hero-jerseys-in-the-sun.jpg";
const HERO_ALT = "Football jerseys swaying on a line in bright sunlight";
const CAMPAIGN_VIDEO = "/media/campaign-rotation.mp4";
const CAMPAIGN_POSTER = "/media/campaign-rotation.jpg";

/**
 * The hero plays a looping film, but only when the visitor hasn't asked for
 * less motion — `prefers-reduced-motion` viewers get the poster frame as a
 * still. Evaluated on mount rather than at module scope, and kept subscribed,
 * so toggling the OS setting mid-visit swaps the hero without a reload.
 */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/**
 * Chrome suspends a muted autoplaying video that isn't on screen at load and
 * does NOT restart it when the visitor scrolls down — the section just sits on
 * a frozen frame. Drive playback off an IntersectionObserver instead: play on
 * entry, pause on exit (which also stops decoding work for a section nobody is
 * looking at). `enabled: false` leaves the element parked on its poster, which
 * is what reduced-motion visitors get.
 */
function useAutoplayInView(enabled: boolean) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (!enabled) {
      video.pause();
      return;
    }
    const play = () => void video.play().catch(() => {});
    if (!("IntersectionObserver" in window)) {
      play();
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? play() : video.pause()),
      { threshold: 0.1 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [enabled]);
  return ref;
}

function useScrollReveals() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-reveal]"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      nodes.forEach(node => node.classList.add("is-revealed"));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });
    nodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

export default function Home() {
  const { data: products = [], isLoading } = trpc.commerce.products.list.useQuery({ first: STOREFRONT_CATALOG_PAGE_SIZE });
  const mappedProducts = products.filter(isCustomerFacingMappedProduct);
  const latest = mappedProducts.slice(0, 4);
  useScrollReveals();
  const prefersReducedMotion = usePrefersReducedMotion();
  const heroVideoRef = useAutoplayInView(!prefersReducedMotion);
  const campaignVideoRef = useAutoplayInView(!prefersReducedMotion);

  return (
    <div className="store-page">
      <StoreHeader />
      <main>
        <section className="hero-section">
          {prefersReducedMotion ? (
            <img className="hero-section__image" src={HERO_POSTER} alt={HERO_ALT} />
          ) : (
            <video
              ref={heroVideoRef}
              className="hero-section__image"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={HERO_POSTER}
              aria-label={HERO_ALT}
            >
              <source src={HERO_VIDEO} type="video/mp4" />
            </video>
          )}
          <div className="hero-section__veil" />
          <div className="hero-section__frame" aria-hidden="true"><span /><span /><span /><span /></div>
          <div className="hero-section__meta"><p>001 / SS-26</p><p>Curated sport culture</p></div>
          <div className="hero-section__content scroll-reveal scroll-reveal--hero" data-scroll-reveal>
            <p className="hero-section__kicker">From the stands<br />to the streets</p>
            <h1>Wear the<br /><em>game.</em></h1>
            <Link href="/shop" className="hero-cta"><span>Shop new arrivals</span><ArrowDownRight size={22} /></Link>
          </div>
          <p className="hero-section__side">Football archive / 2026</p>
        </section>

        <section className="campaign-video" aria-labelledby="campaign-video-heading">
          <video
            ref={campaignVideoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={CAMPAIGN_POSTER}
            aria-label="Stadium Supply campaign film"
          >
            <source src={CAMPAIGN_VIDEO} type="video/mp4" />
          </video>
          <div className="campaign-video__veil" />
          <div className="campaign-video__content">
            <p className="section-index">Campaign / 01</p>
            <h2 id="campaign-video-heading">The detail<br /><em>does the talking.</em></h2>
            <Link href="/shop" className="campaign-video__cta">Shop the rotation <ArrowUpRight size={17} /></Link>
          </div>
        </section>

        <section className="moving-line" aria-label="Brand message"><div><span>Football lives here</span><i>✦</i><span>Rare shirts, real stories</span><i>✦</i><span>Stadium Supply</span><i>✦</i><span>Football lives here</span></div></section>

        <section className="latest-section">
          <div className="section-heading scroll-reveal" data-scroll-reveal><p className="section-index">01 / Latest drop</p><div><h2>New<br /><em>arrivals.</em></h2><p>Selected pieces, ready for their next chapter.</p></div></div>
          {isLoading ? <div className="product-loading product-loading--compact"><LoaderCircle className="spin" size={23} /> Loading pieces</div> : latest.length ? <div className="latest-grid">{latest.map((product, index) => <ProductCard key={product.id} product={product} featured={index === 0} />)}</div> : <div className="shop-empty"><p>The next drop is being prepared.</p><Link href="/shop">Visit the archive</Link></div>}
          <Link href="/shop" className="outline-cta">View the archive <ArrowUpRight size={17} /></Link>
        </section>

        <section className="manifesto-section">
          <div className="manifesto-section__number">02</div>
          <p className="eyebrow">A kit is never just a kit</p>
          <h2 className="scroll-reveal" data-scroll-reveal>Every shirt has<br />a <em>second half.</em></h2>
          <div className="manifesto-section__copy"><p>We source pieces that carry the feeling of matchday into the rest of the week. Club histories, bright away days, perfectly worn details — all part of the uniform.</p><Link href="/shop">Explore the edit <ArrowUpRight size={17} /></Link></div>
        </section>

        <section className="collections-section">
          <div className="collections-section__top scroll-reveal" data-scroll-reveal><p className="section-index">03 / Shop by story</p><p>Find the piece that speaks your language.</p></div>
          <div className="collection-tiles">
            {STORY_TILES.map(tile => <Link href="/shop" key={tile.number} className="collection-tile"><img className="collection-tile__image" src={tile.image} alt={tile.alt} /><span>{tile.number}</span><h3>{tile.lines[0]}<br />{tile.lines[1]}</h3><ArrowUpRight size={22} /></Link>)}
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
