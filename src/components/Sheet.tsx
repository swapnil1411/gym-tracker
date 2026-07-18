"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Bottom-sheet modal: scrim + slide-up panel, focus-trapped and Esc-closable. */
export default function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Stop the page behind the sheet from scrolling with it.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-20 animate-fadeIn bg-[rgba(6,8,10,.7)] backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed bottom-0 left-1/2 z-30 flex max-h-[82vh] w-full max-w-app -translate-x-1/2 animate-sheetUp flex-col rounded-t-[22px] border-t border-line bg-surface outline-none"
      >
        <div className="mx-auto mb-1 mt-2.5 h-1 w-9 rounded-sm bg-line" />
        <h3 className="mx-5 mb-0.5 mt-1.5 font-display text-[19px] font-extrabold">{title}</h3>
        {subtitle && <p className="mx-5 mb-3 text-[13px] text-muted">{subtitle}</p>}
        {children}
      </div>
    </>
  );
}
