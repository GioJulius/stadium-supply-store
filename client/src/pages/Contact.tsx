import { CartDrawer } from "@/components/CartDrawer";
import { StoreFooter, StoreHeader } from "@/components/StoreHeader";
import { EMAIL_ADDRESS, INSTAGRAM_URL, TIKTOK_URL, WHATSAPP_URL } from "@/lib/storeInfo";
import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

/**
 * No contact form. The client runs on WhatsApp and answers there, so a form
 * would only route a customer into an inbox nobody watches — every route here
 * lands in a conversation they actually have open.
 */
const CHANNELS = [
  { label: "WhatsApp", href: WHATSAPP_URL, detail: "Fastest answer. Sizing, stock, orders, anything.", cta: "Start a chat" },
  { label: "TikTok", href: TIKTOK_URL, detail: "Kits on, kits moving. See how they actually fit before you order.", cta: "@stadium_supply" },
  { label: "Instagram", href: INSTAGRAM_URL, detail: "New drops land here first. DMs are open.", cta: "@stadium.supply" },
  { label: "Email", href: `mailto:${EMAIL_ADDRESS}`, detail: "Rather write it down? This reaches the same people.", cta: EMAIL_ADDRESS },
];

export default function Contact() {
  return (
    <div className="store-page store-page--light">
      <StoreHeader />
      <main>
        <section className="shop-intro">
          <p className="section-index">Contact</p>
          <h1>Talk to<br /><em>a human.</em></h1>
          <p>We answer on WhatsApp, usually the same day. Ask us anything before you order.</p>
        </section>

        <section className="contact-section">
          {CHANNELS.map(channel => (
            <a
              key={channel.label}
              className="contact-card"
              href={channel.href}
              // mailto must open in the mail client, not a dead blank tab.
              {...(channel.href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noreferrer" })}
            >
              <p className="section-index">{channel.label}</p>
              <p className="contact-card__detail">{channel.detail}</p>
              <span>{channel.cta} <ArrowUpRight size={16} /></span>
            </a>
          ))}
        </section>

        <section className="instagram-section">
          <h2>Before you<br /><em>ask.</em></h2>
          <Link href="/how-it-works">How it works <ArrowUpRight size={20} /></Link>
        </section>
      </main>
      <StoreFooter />
      <CartDrawer />
    </div>
  );
}
