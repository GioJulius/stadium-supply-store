import { SIZE_NOTES } from "@/lib/storeInfo";
import { X } from "lucide-react";
import { useEffect } from "react";

/** The size notes on their own, for embedding in a page. */
export function SizeGuideContent() {
  return (
    <div className="size-guide__notes">
      {SIZE_NOTES.map(note => (
        <article key={note.title}>
          <h3>{note.title}</h3>
          <p>{note.body}</p>
        </article>
      ))}
    </div>
  );
}

/**
 * The same notes as an overlay, opened from the size picker on a product page.
 * Sizing doubt is what stops a shopper at the size buttons, so the answer has
 * to arrive without navigating away and losing the variant they'd picked.
 */
export function SizeGuideDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="size-guide-dialog" role="dialog" aria-modal="true" aria-label="Size guide">
      <button className="size-guide-dialog__backdrop" onClick={onClose} aria-label="Close size guide" />
      <div className="size-guide-dialog__surface">
        <div className="size-guide-dialog__top">
          <p className="eyebrow">Size guide</p>
          <button onClick={onClose} className="icon-button" aria-label="Close size guide"><X size={21} /></button>
        </div>
        <SizeGuideContent />
      </div>
    </div>
  );
}
