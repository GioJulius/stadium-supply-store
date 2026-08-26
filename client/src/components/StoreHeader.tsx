import { useCart } from "@/contexts/CartContext";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const links = [
  { href: "/shop", label: "Shop all" },
  { href: "/shop?edit=latest", label: "New arrivals" },
  { href: "/shop?category=football", label: "Football kits" },
];

export function StoreHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount, openCart } = useCart();
  const [location] = useLocation();
  const isHome = location === "/";

  return (
    <>
      <header className={`site-header ${isHome ? "site-header--home" : ""}`}>
        <div className="site-header__inner">
          <button className="header-control header-control--menu" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={18} strokeWidth={1.8} />
            <span>Menu</span>
          </button>

          <Link href="/" className="brand-lockup" aria-label="Stadium Supply home">
            <span>Stadium</span>
            <span>Supply</span>
          </Link>

          <nav className="desktop-nav" aria-label="Primary navigation">
            {links.map(link => (
              <Link key={link.href} href={link.href}>{link.label}</Link>
            ))}
          </nav>

          <button className="header-control header-control--cart" onClick={openCart} aria-label={`Open cart with ${itemCount} items`}>
            <ShoppingBag size={17} strokeWidth={1.8} />
            <span>Bag</span>
            <b>{String(itemCount).padStart(2, "0")}</b>
          </button>
        </div>
      </header>

      <aside className={`menu-panel ${menuOpen ? "menu-panel--open" : ""}`} aria-hidden={!menuOpen}>
        <button className="menu-panel__backdrop" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
        <div className="menu-panel__surface">
          <div className="menu-panel__top">
            <span className="eyebrow">Navigation / 01</span>
            <button onClick={() => setMenuOpen(false)} className="icon-button" aria-label="Close menu"><X size={23} /></button>
          </div>
          <nav className="menu-panel__nav" aria-label="Mobile navigation">
            {links.map((link, index) => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="menu-panel__meta">
            <p>From the stands<br />to the streets.</p>
            <a href="https://www.instagram.com/stadium.supply/" target="_blank" rel="noreferrer">Instagram ↗</a>
          </div>
        </div>
      </aside>
    </>
  );
}

export function StoreFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__brand">Stadium<br />Supply</div>
      <div className="site-footer__meta">
        <p>Curated football culture<br />from every era.</p>
        <a href="https://www.instagram.com/stadium.supply/" target="_blank" rel="noreferrer">Follow @stadium.supply ↗</a>
      </div>
      <div className="site-footer__legal">© {new Date().getFullYear()} Stadium Supply<br />All rights reserved.</div>
    </footer>
  );
}
