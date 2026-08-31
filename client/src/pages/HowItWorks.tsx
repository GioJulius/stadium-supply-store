import { CartDrawer } from "@/components/CartDrawer";
import { SizeGuideContent } from "@/components/SizeGuide";
import { StoreFooter, StoreHeader } from "@/components/StoreHeader";
import { PROCESS_STEPS } from "@/lib/storeInfo";
import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

export default function HowItWorks() {
  return (
    <div className="store-page store-page--light">
      <StoreHeader />
      <main>
        <section className="shop-intro">
          <p className="section-index">The process</p>
          <h1>How it<br /><em>works.</em></h1>
          <p>We order on your behalf — here's exactly how the cycle runs, start to finish.</p>
        </section>

        <section className="process-section">
          {PROCESS_STEPS.map(step => (
            <article key={step.number} className="process-step">
              <p className="process-step__number">{step.number}</p>
              <h2>{step.title}</h2>
              <div>{step.body.map(line => <p key={line}>{line}</p>)}</div>
            </article>
          ))}
        </section>

        <section className="size-guide" id="size-guide">
          <div className="size-guide__heading">
            <p className="section-index">Size guide</p>
            <h2>Get the fit<br /><em>right first time.</em></h2>
          </div>
          <SizeGuideContent />
        </section>

        <section className="instagram-section">
          <h2>Ready to<br /><em>order?</em></h2>
          <Link href="/shop">Browse the archive <ArrowUpRight size={20} /></Link>
        </section>
      </main>
      <StoreFooter />
      <CartDrawer />
    </div>
  );
}
