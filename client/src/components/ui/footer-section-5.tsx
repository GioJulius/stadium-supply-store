import { COMPANY, INSTAGRAM_URL, TIKTOK_URL, WHATSAPP_URL } from "@/lib/storeInfo";
import { FlutedGlass } from "@paper-design/shaders-react";
import { MessageCircle } from "lucide-react";
import { Link } from "wouter";

/**
 * Site footer: an outlined wordmark sitting on top of a navy panel that is
 * textured with a fluted-glass shader. Adapted from the SolaceUI
 * "footer-section-5" reference — wouter instead of next/link, and plain CSS
 * (`.ss-footer*` in index.css) because this app styles by class, not Tailwind
 * utilities. The shader draws highlights and shadows only (transparent
 * colorBack), so if WebGL is unavailable the panel is simply flat navy.
 */

type FooterLink = { name: string; href: string; external?: boolean };

const footerLinks: { title: string; links: FooterLink[] }[] = [
  {
    title: "Shop",
    links: [
      { name: "Shop all", href: "/shop" },
      { name: "New arrivals", href: "/shop?q=2026&label=2026%E2%80%932027%20Season" },
      { name: "Reviews", href: "/reviews" },
      { name: "Size guide", href: "/size-guide" },
    ],
  },
  {
    title: "Help",
    links: [
      { name: "How it works", href: "/how-it-works" },
      { name: "Shipping", href: "/shipping" },
      { name: "Returns & refunds", href: "/returns" },
      { name: "Contact", href: "/contact" },
      { name: "Privacy", href: "/privacy" },
      { name: "Terms", href: "/terms" },
    ],
  },
  {
    title: "Talk to us",
    links: [
      { name: "WhatsApp", href: WHATSAPP_URL, external: true },
      { name: "Instagram", href: INSTAGRAM_URL, external: true },
      { name: "TikTok", href: TIKTOK_URL, external: true },
    ],
  },
];

function InstagramIcon() {
  return (
    <svg viewBox="193 6 24 24" aria-hidden="true">
      <path d="M200.1 6.333H209.9C213.633 6.333 216.667 9.367 216.667 13.1V22.9C216.667 24.695 215.954 26.416 214.685 27.685C213.416 28.954 211.695 29.667 209.9 29.667H200.1C196.367 29.667 193.333 26.633 193.333 22.9V13.1C193.333 11.305 194.046 9.584 195.315 8.315C196.584 7.046 198.305 6.333 200.1 6.333ZM199.867 8.667C198.753 8.667 197.684 9.109 196.897 9.897C196.109 10.684 195.667 11.753 195.667 12.867V23.133C195.667 25.455 197.545 27.333 199.867 27.333H210.133C211.247 27.333 212.315 26.891 213.103 26.103C213.891 25.316 214.333 24.247 214.333 23.133V12.867C214.333 10.545 212.455 8.667 210.133 8.667H199.867ZM211.125 10.417C211.512 10.417 211.883 10.57 212.156 10.844C212.43 11.117 212.583 11.488 212.583 11.875C212.583 12.262 212.43 12.633 212.156 12.906C211.883 13.18 211.512 13.333 211.125 13.333C210.738 13.333 210.367 13.18 210.094 12.906C209.82 12.633 209.667 12.262 209.667 11.875C209.667 11.488 209.82 11.117 210.094 10.844C210.367 10.57 210.738 10.417 211.125 10.417ZM205 12.167C206.547 12.167 208.031 12.781 209.125 13.875C210.219 14.969 210.833 16.453 210.833 18C210.833 19.547 210.219 21.031 209.125 22.125C208.031 23.219 206.547 23.833 205 23.833C203.453 23.833 201.969 23.219 200.875 22.125C199.781 21.031 199.167 19.547 199.167 18C199.167 16.453 199.781 14.969 200.875 13.875C201.969 12.781 203.453 12.167 205 12.167ZM205 14.5C204.072 14.5 203.181 14.869 202.525 15.525C201.869 16.181 201.5 17.072 201.5 18C201.5 18.928 201.869 19.819 202.525 20.475C203.181 21.131 204.072 21.5 205 21.5C205.928 21.5 206.818 21.131 207.475 20.475C208.131 19.819 208.5 18.928 208.5 18C208.5 17.072 208.131 16.181 207.475 15.525C206.818 14.869 205.928 14.5 205 14.5Z" fill="currentColor" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="239 5 24 24" aria-hidden="true">
      <path d="M256.367 9.79C255.569 8.879 255.13 7.71 255.13 6.5H251.525V20.967C251.498 21.75 251.167 22.492 250.604 23.036C250.04 23.58 249.287 23.884 248.503 23.883C246.847 23.883 245.47 22.53 245.47 20.85C245.47 18.843 247.407 17.338 249.402 17.957V14.27C245.377 13.733 241.853 16.86 241.853 20.85C241.853 24.735 245.073 27.5 248.492 27.5C252.155 27.5 255.13 24.525 255.13 20.85V13.512C256.592 14.562 258.347 15.125 260.147 15.122V11.517C260.147 11.517 257.953 11.622 256.367 9.79Z" fill="currentColor" />
    </svg>
  );
}

export default function FooterSection5() {
  return (
    <footer className="ss-footer">
      <div className="ss-footer__wordmark" aria-hidden="true">
        <span>Stadium Supply</span>
      </div>

      <div className="ss-footer__panel">
        <div className="ss-footer__shader">
          <FlutedGlass
            size={0.89}
            shape="lines"
            angle={0}
            distortionShape="prism"
            distortion={0.5}
            shift={0}
            blur={0}
            edges={0.25}
            stretch={0}
            scale={1.11}
            fit="cover"
            highlights={0.1}
            shadows={0.2}
            grainMixer={0.1}
            grainOverlay={0.1}
            colorBack="#00000000"
            colorHighlight="#FFFFFF"
            colorShadow="#000000"
            style={{ width: "100%", height: "100%" }}
          />
        </div>

        <div className="ss-footer__content">
          <div className="ss-footer__intro">
            <div>
              <img className="ss-footer__crest" src="/favicon.svg" alt="" width={44} height={44} />
              <p className="ss-footer__tagline">
                Curated football culture from every era.
              </p>
            </div>

            <div className="ss-footer__bottom">
              <div className="ss-footer__socials">
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
                  <MessageCircle aria-hidden="true" strokeWidth={1.75} />
                </a>
                <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="Instagram @stadium.supply">
                  <InstagramIcon />
                </a>
                <a href={TIKTOK_URL} target="_blank" rel="noreferrer" aria-label="TikTok @stadium_supply">
                  <TikTokIcon />
                </a>
              </div>
              <p className="ss-footer__legal">
                © {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved.
                <br />
                Reg. {COMPANY.registrationNumber} · {COMPANY.address}
              </p>
            </div>
          </div>

          <nav className="ss-footer__columns" aria-label="Footer">
            {footerLinks.map((section) => (
              <div key={section.title} className="ss-footer__column">
                <h3>{section.title}</h3>
                <ul>
                  {section.links.map((link) => (
                    <li key={link.name}>
                      {link.external ? (
                        <a href={link.href} target="_blank" rel="noreferrer">{link.name} ↗</a>
                      ) : (
                        <Link href={link.href}>{link.name}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
