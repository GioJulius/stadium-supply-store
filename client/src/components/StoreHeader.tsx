import { useCart } from "@/contexts/CartContext";
import { isCustomerFacingMappedProduct, STOREFRONT_CATALOG_PAGE_SIZE } from "@/lib/catalog";
import { isGroup, leafHref, SHOP_MENU, type NavNode } from "@/lib/navigation";
import { trpc } from "@/lib/trpc";
import { Menu, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

const links = [
  { href: "/shop", label: "Shop all" },
  { href: "/shop?q=2026&label=2026%E2%80%932027%20Season", label: "New arrivals" },
  { href: "/how-it-works", label: "How it works" },
];

/**
 * One row of the menu tree. A branch toggles its children open; a leaf is a
 * link into the archive. Depth only drives indentation and type size — the
 * shape is the same all the way down, so a league nested under a competition
 * behaves like a club nested under a league without a second component.
 *
 * Open state lives here rather than in a map on the panel because each branch
 * is independent: opening LaLiga should not collapse Premier League, which is
 * how the reference menu behaves.
 */
function MenuBranch({ node, depth, counts, onNavigate }: { node: NavNode; depth: number; counts: Map<string, number>; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);

  if (!isGroup(node)) {
    const count = counts.get(node.q);
    return (
      <Link href={leafHref(node)} className="menu-tree__leaf" style={{ paddingLeft: `${depth * 18}px` }} onClick={onNavigate}>
        {node.label}
        {count === undefined ? null : <i>{String(count).padStart(2, "0")}</i>}
      </Link>
    );
  }

  return (
    <div className={`menu-tree__branch ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="menu-tree__toggle"
        style={{ paddingLeft: `${depth * 18}px` }}
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      >
        <span>{node.label}</span>
        {open ? <Minus size={17} strokeWidth={1.6} /> : <Plus size={17} strokeWidth={1.6} />}
      </button>
      {open ? (
        <div className="menu-tree__children">
          {node.children.map(child => (
            <MenuBranch key={child.label} node={child} depth={depth + 1} counts={counts} onNavigate={onNavigate} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function StoreHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount, openCart } = useCart();
  const [location] = useLocation();
  const isHome = location === "/";
  const closeMenu = () => setMenuOpen(false);

  // The same cached catalogue query the shop pages use, so counting the menu
  // costs no extra request. Only fetched once the drawer has been opened —
  // an untouched menu shouldn't pull 250 products on every first paint.
  const { data: products = [] } = trpc.commerce.products.list.useQuery(
    { first: STOREFRONT_CATALOG_PAGE_SIZE },
    { enabled: menuOpen },
  );
  const counts = useMemo(() => {
    const tally = new Map<string, number>();
    if (!products.length) return tally;
    const haystacks = products
      .filter(isCustomerFacingMappedProduct)
      .map(product => [product.title, product.productType ?? "", ...product.tags].join(" ").toLowerCase());
    const walk = (nodes: NavNode[]) => nodes.forEach(node => {
      if (isGroup(node)) walk(node.children);
      else tally.set(node.q, haystacks.filter(text => text.includes(node.q)).length);
    });
    SHOP_MENU.forEach(section => section.children && walk(section.children));
    return tally;
  }, [products]);

  // The panel scrolls its own tree; letting the page behind it scroll too is
  // the classic mobile drawer bug where a flick moves the wrong surface.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [menuOpen]);

  // Escape closes the drawer, matching the backdrop and the close button.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

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
        <button className="menu-panel__backdrop" onClick={closeMenu} aria-label="Close menu" tabIndex={menuOpen ? 0 : -1} />
        <div className="menu-panel__surface">
          <div className="menu-panel__top">
            <span className="eyebrow">Navigation</span>
            <button onClick={closeMenu} className="icon-button" aria-label="Close menu"><X size={23} /></button>
          </div>
          <nav className="menu-tree" aria-label="Shop navigation">
            {SHOP_MENU.map(section =>
              section.href ? (
                <Link key={section.label} href={section.href} className="menu-tree__top-link" onClick={closeMenu}>
                  {section.label}
                </Link>
              ) : (
                <MenuBranch
                  key={section.label}
                  node={{ label: section.label, children: section.children ?? [] }}
                  depth={0}
                  counts={counts}
                  onNavigate={closeMenu}
                />
              ),
            )}
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
        <Link href="/how-it-works">How it works ↗</Link>
        <a href="https://www.instagram.com/stadium.supply/" target="_blank" rel="noreferrer">Follow @stadium.supply ↗</a>
      </div>
      <div className="site-footer__legal">© {new Date().getFullYear()} Stadium Supply<br />All rights reserved.</div>
    </footer>
  );
}
