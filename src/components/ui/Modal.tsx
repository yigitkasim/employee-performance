"use client";

import { useCallback, useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Accessible dialog shell used by every modal in the app.
 *
 * The hand-rolled modals each missed something: no role/aria-modal, focus left
 * behind the overlay so Tab wandered into the page underneath, Escape only
 * worked on one of them, and focus was never returned to the control that
 * opened the dialog. Centralising it fixes all of them at once.
 */
export function Modal({
  title,
  description,
  onClose,
  children,
  width = "w-[520px]",
  labelledBy,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
  labelledBy?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const titleId = labelledBy ?? "modal-title";

  // Remember what had focus, move focus in, and put it back on close.
  useEffect(() => {
    restoreTo.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = overflow;
      restoreTo.current?.focus?.();
    };
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      // Trap Tab inside the dialog.
      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={`bg-white rounded-xl shadow-2xl ${width} max-w-full max-h-[90vh] overflow-auto scroll-area outline-none`}
      >
        <div className="p-5">
          <div className="flex justify-between items-start mb-4 gap-4">
            <div>
              <h2 id={titleId} className="font-semibold text-base">
                {title}
              </h2>
              {description && (
                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="text-slate-400 hover:text-slate-700 rounded p-1 -m-1"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
