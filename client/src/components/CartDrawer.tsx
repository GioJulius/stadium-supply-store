import { useCart } from "@/contexts/CartContext";
import { formatMoney } from "@/lib/format";
import { BADGE_CHOICE_KEY, BADGE_FEE_HANDLE, BADGE_KEY, PRINTING_FEE_HANDLE, SHIPPING_RATE } from "@/lib/storeInfo";
import { Minus, Plus, X } from "lucide-react";
import { Link } from "wouter";
import type { Cart } from "@shared/commerce/types";

/**
 * The flat courier rate, as a number, so the drawer can show a total that
 * includes it. Display only — Shopify applies the real shipping rate at
 * checkout, and that is the figure that gets charged.
 */
const SHIPPING_AMOUNT = Number(SHIPPING_RATE.replace(/[^\d.]/g, "")) || 0;

/** True for the two derived add-on charges, which are lines but not garments. */
function isFeeLine(item: Cart["items"][number]): boolean {
  return item.productHandle === PRINTING_FEE_HANDLE || item.productHandle === BADGE_FEE_HANDLE;
}

/**
 * One line describing what was chosen, the way the wireframe reads it back:
 * "Fan · L · MOLEFE 10 · Premier League". Everything comes off the cart line
 * itself, so it can only say what the shopper actually bought.
 */
function itemSummary(item: Cart["items"][number]): string {
  const parts: string[] = [];
  if (item.variantTitle && item.variantTitle !== "Default Title") parts.push(item.variantTitle);
  if (item.personalisation) {
    const printed = [item.personalisation.name, item.personalisation.number].filter(Boolean).join(" ");
    if (printed) parts.push(`"${printed}"`);
  }
  if (item.attributes?.[BADGE_KEY] === "Yes") {
    parts.push(item.attributes[BADGE_CHOICE_KEY] || "badge to confirm");
  }
  return parts.join(" · ");
}

export function CartDrawer() {
  const { cart, isOpen, closeCart, loading, updateQuantity, removeItem, proceedToCheckout } = useCart();
  // The add-on fees are derived from the shirts, so they read as consequences
  // of them. Shopify returns cart lines in the order they were created, which
  // can put a R50 printing charge above the kit it belongs to; sort the
  // garments first so the bag reads top-down the way it was filled.
  const items = [...(cart?.items ?? [])].sort((a, b) => Number(isFeeLine(a)) - Number(isFeeLine(b)));
  const subtotal = cart ? Number(cart.subtotal.amount) : 0;
  const currencyCode = cart?.subtotal.currencyCode ?? "ZAR";
  const estimatedTotal = subtotal + (items.length ? SHIPPING_AMOUNT : 0);

  return (
    <aside className={`cart-drawer ${isOpen ? "cart-drawer--open" : ""}`} aria-hidden={!isOpen}>
      <button className="cart-drawer__backdrop" onClick={closeCart} aria-label="Close cart" />
      <div className="cart-drawer__surface">
        <div className="cart-drawer__header">
          <div>
            <p className="eyebrow">Your selection</p>
            <h2>Bag / {String(cart?.itemCount ?? 0).padStart(2, "0")}</h2>
          </div>
          <button onClick={closeCart} className="icon-button" aria-label="Close cart"><X size={23} /></button>
        </div>

        <div className="cart-drawer__items">
          {items.length === 0 ? (
            <div className="cart-empty"><p>Your bag is waiting for its first kit.</p><button onClick={closeCart}>Continue browsing</button></div>
          ) : items.map(item => {
            // Add-on fees are derived from how many shirts asked for them, so
            // they get no quantity stepper and no remove link — untick the
            // extra on the shirt and the charge leaves by itself.
            const isFee = isFeeLine(item);
            return isFee ? (
              <article className="cart-item cart-item--fee" key={item.lineId}>
                <div className="cart-item__content">
                  <div>
                    <h3>{item.productTitle}</h3>
                    <p>{item.quantity} × {formatMoney(item.unitPrice)}</p>
                  </div>
                  <strong>{formatMoney(item.lineTotal)}</strong>
                </div>
              </article>
            ) : (
              <article className="cart-item" key={item.lineId}>
                <div className="cart-item__image">{item.image ? <img src={item.image.url} alt={item.image.altText ?? item.productTitle} /> : <span>SS</span>}</div>
                <div className="cart-item__content">
                  <div>
                    <h3>{item.productTitle}</h3>
                    {itemSummary(item) ? <p className="cart-item__summary">{itemSummary(item)}</p> : null}
                  </div>
                  <strong>{formatMoney(item.lineTotal)}</strong>
                  <div className="cart-item__actions">
                    <div className="quantity-control" aria-label={`Quantity for ${item.productTitle}`}>
                      <button disabled={loading} onClick={() => updateQuantity(item.lineId, Math.max(0, item.quantity - 1))} aria-label="Decrease quantity"><Minus size={13} /></button>
                      <span>{item.quantity}</span>
                      <button disabled={loading} onClick={() => updateQuantity(item.lineId, item.quantity + 1)} aria-label="Increase quantity"><Plus size={13} /></button>
                    </div>
                    {/*
                      "Edit" goes back to the kit's own page, where the printing
                      panel lives. Editing in the drawer would mean a second copy
                      of that form and a second set of rules to keep in step.
                    */}
                    <Link href={`/product/${item.productHandle}`} className="text-link" onClick={closeCart}>Edit</Link>
                    <button className="text-link" disabled={loading} onClick={() => removeItem(item.lineId)}>Remove</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="cart-drawer__footer">
          {/*
            Delivery is priced here rather than sprung at the end of checkout —
            the whole point of the flat R100 is that it can be said up front.
          */}
          <div className="cart-total cart-total--minor"><span>Subtotal</span><span>{cart ? formatMoney(cart.subtotal) : "—"}</span></div>
          <div className="cart-total cart-total--minor">
            <span>Delivery, anywhere in SA</span>
            <span>{items.length ? formatMoney({ amount: SHIPPING_AMOUNT.toFixed(2), currencyCode }) : "—"}</span>
          </div>
          <div className="cart-total">
            <span>Total</span>
            <strong>{items.length ? formatMoney({ amount: estimatedTotal.toFixed(2), currencyCode }) : "—"}</strong>
          </div>
          <button className="checkout-button" disabled={!items.length || loading} onClick={proceedToCheckout}>Secure checkout <span>↗</span></button>
          <p className="cart-drawer__reassure">Or keep shopping — nothing is lost.</p>
        </div>
      </div>
    </aside>
  );
}
