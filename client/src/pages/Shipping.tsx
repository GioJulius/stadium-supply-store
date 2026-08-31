import { CartDrawer } from "@/components/CartDrawer";
import { StoreFooter, StoreHeader } from "@/components/StoreHeader";
import { SHIPPING_NOTES, SHIPPING_RATE, WHATSAPP_URL } from "@/lib/storeInfo";
import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

export default function Shipping() {
  return (
    <div className="store-page store-page--light">
      <StoreHeader />
      <main>
        <section className="shop-intro">
          <p className="section-index">Shipping</p>
          <h1>{SHIPPING_RATE} to<br /><em>your door.</em></h1>
          <p>One flat courier rate anywhere in South Africa, tracked from our hands to yours.</p>
        </section>

        <section className="size-guide">
          <div className="size-guide__heading">
            <p className="section-index">The detail</p>
            <h2>What to<br /><em>expect.</em></h2>
          </div>
          <div className="size-guide__notes">
            {SHIPPING_NOTES.map(note => (
              <article key={note.title}>
                <h3>{note.title}</h3>
                <p>{note.body}</p>
              </article>
            ))}
            <a className="size-guide__whatsapp" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
              Ask us about delivery <span aria-hidden="true">&#8599;</span>
            </a>
          </div>
        </section>

        <section className="instagram-section">
          <h2>Know how<br /><em>we work?</em></h2>
          <Link href="/how-it-works">Read the process <ArrowUpRight size={20} /></Link>
        </section>
      </main>
      <StoreFooter />
      <CartDrawer />
    </div>
  );
}
