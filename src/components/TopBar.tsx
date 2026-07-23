"use client";

import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/lib/auth-context";

/**
 * Persistent app bar, styled per the Stitch "Refined" screens: brand mark and
 * wordmark in the primary accent, round icon buttons on surface-3, logout
 * tinted with the error role so a destructive action reads as one.
 *
 * The bar spans the full viewport; its content aligns to the same measure as
 * the pages so brand and actions never drift to the far corners of a wide
 * screen.
 */
export default function TopBar({
  bodyOpen,
  onToggleBody,
}: {
  bodyOpen: boolean;
  onToggleBody: () => void;
}) {
  const { logOut } = useAuth();

  return (
    <header className="flex h-14 flex-none border-b border-line bg-header-top">
      <div className="mx-auto flex w-full max-w-app items-center justify-between px-5 md:max-w-2xl">
        <div className="flex items-center gap-2.5 text-accent">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6.5 7v10M17.5 7v10M6.5 12h11M4 9.5v5M20 9.5v5"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
            />
          </svg>
          <div className="font-display text-[17px] font-extrabold tracking-[-.02em]">GymLog</div>
        </div>

        <div className="flex items-center gap-2">
          {/*
           * Body composition, left of the theme toggle. It sits here rather than
           * in the bottom bar because it's weekly-cadence, closer to a setting
           * than to a daily log — and unlike the old Today-only header icon, this
           * bar is on screen no matter which tab you're in.
           */}
          <button
            onClick={onToggleBody}
            aria-label="Your body"
            aria-pressed={bodyOpen}
            title="Your body"
            className={`press flex h-10 w-10 items-center justify-center rounded-full border transition ${
              bodyOpen
                ? "border-accent bg-accent text-on-accent"
                : "border-line bg-surface3 text-text"
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.9}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM6 22v-6l-2-1 1.5-5A2 2 0 0 1 7.4 9h9.2a2 2 0 0 1 1.9 1l1.5 5-2 1v6" />
            </svg>
          </button>
          <ThemeToggle />
          <button
            onClick={logOut}
            aria-label="Log out"
            title="Log out"
            className="press flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface3 text-error"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
