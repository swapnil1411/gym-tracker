"use client";

import { useEffect, useRef, type ReactNode } from "react";

/*
 * Every open sheet listens on `document`, so without a stack a single Escape
 * closes all of them at once — including the one underneath the sheet you were
 * actually looking at. Only the topmost entry acts on the key.
 */
const stack: symbol[] = [];

/** Bottom-sheet modal: scrim + slide-up panel, focus-trapped and Esc-closable. */
export default function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  elevated = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Raise above an already-open sheet, for a sheet opened from within one. */
  elevated?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const idRef = useRef<symbol>(null);
  idRef.current ??= Symbol("sheet");

  useEffect(() => {
    if (!open) return;
    const id = idRef.current!;
    stack.push(id);

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (stack[stack.length - 1] !== id) return; // a sheet above us owns this
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKey);
    // Stop the page behind the sheet from scrolling with it.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      const i = stack.lastIndexOf(id);
      if (i !== -1) stack.splice(i, 1);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className={`fixed inset-0 ${elevated ? "z-40" : "z-20"} animate-fadeIn bg-black/60 backdrop-blur-[3px]`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        // Opaque on purpose: the panel must fully cover the dimmed content
        // behind it. (This used to be a `pane` class that quietly stopped
        // existing during a token cleanup, which made every sheet transparent.)
        className={`fixed bottom-0 left-1/2 ${elevated ? "z-50" : "z-30"} flex max-h-[82dvh] w-full max-w-app -translate-x-1/2 animate-sheetUp flex-col rounded-t-sheet border border-line bg-surface outline-none sm:bottom-6 sm:rounded-sheet`}
      >
        <div className="mx-auto mb-1 mt-2.5 h-1 w-9 rounded-sm bg-line" />

        {/*
         * An explicit close button, not just the scrim.
         *
         * On a phone this sheet is 82dvh tall, so the only scrim left to tap is
         * a thin strip at the very top — and there is no Esc key. Without this
         * the sheet is a dead end and the only way out is reloading the page.
         * 44px square is the minimum comfortable touch target.
         */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="press absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-surface3 text-[17px] leading-none text-text"
        >
          ✕
        </button>

        <h3 className="mx-5 mb-0.5 mt-1.5 pr-12 font-display text-[19px] font-extrabold">
          {title}
        </h3>
        {subtitle && <p className="mx-5 mb-3 pr-12 text-[13px] text-muted">{subtitle}</p>}
        {children}
      </div>
    </>
  );
}
