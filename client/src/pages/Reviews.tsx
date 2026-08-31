import { CartDrawer } from "@/components/CartDrawer";
import { StoreFooter, StoreHeader } from "@/components/StoreHeader";
import { REVIEWS, reviewHref, type Review } from "@/lib/reviews";
import { REVIEWS_URL, WHATSAPP_URL } from "@/lib/storeInfo";
import { ArrowUpRight, Quote } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";

/**
 * Reuses the reveal-on-scroll the rest of the site already uses rather than
 * pulling in a motion library for one page — the cards then enter exactly like
 * every other section instead of in a style of their own.
 */
function useScrollReveals() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-reveal]"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      nodes.forEach(n => n.classList.add("is-revealed"));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    nodes.forEach(n => observer.observe(n));
    return () => observer.disconnect();
  }, []);
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  return (
    <a
      className={`review-card review-card--${review.size ?? "normal"} scroll-reveal`}
      href={reviewHref(review)}
      target="_blank"
      rel="noreferrer"
      data-scroll-reveal
      // Staggered by index so the grid resolves in reading order.
      style={{ transitionDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <Quote size={20} aria-hidden="true" />
      <blockquote>{review.quote}</blockquote>
      <div className="review-card__who">
        <div>
          <p className="review-card__handle">{review.handle}</p>
          {review.bought ? <p className="review-card__bought">{review.bought}</p> : null}
        </div>
        <span aria-hidden="true"><ArrowUpRight size={16} /></span>
      </div>
    </a>
  );
}

export default function Reviews() {
  useScrollReveals();
  const hasReviews = REVIEWS.length > 0;

  return (
    <div className="store-page store-page--light">
      <StoreHeader />
      <main>
        <section className="shop-intro">
          <p className="section-index">Reviews</p>
          <h1>In their<br /><em>own words.</em></h1>
          <p>Straight from our Instagram. Tap any one to open the story it came from.</p>
        </section>

        {hasReviews ? (
          <section className="reviews-grid">
            {REVIEWS.map((review, index) => (
              <ReviewCard key={`${review.handle}-${index}`} review={review} index={index} />
            ))}
          </section>
        ) : (
          <section className="reviews-empty">
            <p className="section-index">Straight from the source</p>
            <h2>Every review<br /><em>lives on Instagram.</em></h2>
            <p>
              Our buyers post them to our story highlight — real people, their own words, their own kits.
              Have a read, then come back and pick yours.
            </p>
            <a className="outline-cta" href={REVIEWS_URL} target="_blank" rel="noreferrer">
              Read the reviews <ArrowUpRight size={17} />
            </a>
          </section>
        )}

        <section className="instagram-section">
          <h2>Seen enough?<br /><em>Pick your kit.</em></h2>
          <Link href="/shop">Shop the archive <ArrowUpRight size={20} /></Link>
        </section>
      </main>
      <StoreFooter />
      <CartDrawer />
    </div>
  );
}
