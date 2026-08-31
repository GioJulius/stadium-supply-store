import { CartDrawer } from "@/components/CartDrawer";
import { StoreFooter, StoreHeader } from "@/components/StoreHeader";
import { REVIEWS, reviewHref, type Review } from "@/lib/reviews";
import { REVIEWS_URL, WHATSAPP_URL } from "@/lib/storeInfo";
import { ArrowUpRight, Quote } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "wouter";

/**
 * Reveals the grid as one unit rather than observing each card.
 *
 * Watching twelve cards individually left four of them permanently invisible:
 * a card whose row is skipped past, or which never reaches the observer's
 * threshold, simply never gets its class and stays at opacity 0. Missing
 * animation is a shrug; a missing review is lost social proof, so the grid
 * itself is the single trigger and every card follows it on a stagger.
 */
function useRevealOnce<T extends HTMLElement>(ref: React.RefObject<T | null>) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reveal = () => node.classList.add("is-revealed");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) { reveal(); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      reveal();
      observer.disconnect();
    }, { threshold: 0.05 });
    observer.observe(node);
    // Whatever happens, the reviews are on screen shortly after arrival.
    const failsafe = window.setTimeout(reveal, 1200);
    return () => { observer.disconnect(); window.clearTimeout(failsafe); };
  }, [ref]);
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  return (
    <a
      className={`review-card review-card--${review.size ?? "normal"}`}
      href={reviewHref(review)}
      target="_blank"
      rel="noreferrer"
      // Staggered by index so the grid resolves in reading order.
      style={{ transitionDelay: `${Math.min(index, 9) * 55}ms` }}
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
  const gridRef = useRef<HTMLElement>(null);
  useRevealOnce(gridRef);
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
          <section className="reviews-grid" ref={gridRef}>
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
