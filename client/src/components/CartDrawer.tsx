import { useCart } from "@/contexts/CartContext";
import { formatMoney } from "@/lib/format";
import { Minus, Plus, X } from "lucide-react";

export function CartDrawer() {
  const { cart, isOpen, closeCart, loading, updateQuantity, removeItem, proceedToCheckout } = useCart();
  const items = cart?.items ?? [];

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
          ) : items.map(item => (
            <article className="cart-item" key={item.lineId}>
              <div className="cart-item__image">{item.image ? <img src={item.image.url} alt={item.image.altText ?? item.productTitle} /> : <span>SS</span>}</div>
              <div className="cart-item__content">
                <div>
                  <h3>{item.productTitle}</h3>
                  {item.variantTitle !== "Default Title" && <p>{item.variantTitle}</p>}
                </div>
                <strong>{formatMoney(item.lineTotal)}</strong>
                <div className="cart-item__actions">
                  <div className="quantity-control" aria-label={`Quantity for ${item.productTitle}`}>
                    <button disabled={loading} onClick={() => updateQuantity(item.lineId, Math.max(0, item.quantity - 1))} aria-label="Decrease quantity"><Minus size={13} /></button>
                    <span>{item.quantity}</span>
                    <button disabled={loading} onClick={() => updateQuantity(item.lineId, item.quantity + 1)} aria-label="Increase quantity"><Plus size={13} /></button>
                  </div>
                  <button className="text-link" disabled={loading} onClick={() => removeItem(item.lineId)}>Remove</button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="cart-drawer__footer">
          <div className="cart-total"><span>Subtotal</span><strong>{cart ? formatMoney(cart.subtotal) : "—"}</strong></div>
          <p>Taxes and shipping are calculated securely at checkout.</p>
          <button className="checkout-button" disabled={!items.length || loading} onClick={proceedToCheckout}>Secure checkout <span>↗</span></button>
        </div>
      </div>
    </aside>
  );
}
