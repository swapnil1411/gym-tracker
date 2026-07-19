"use client";

import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/lib/auth-context";

/**
 * Persistent app bar.
 *
 * In the Ergonomic design this sits above the scroll area on every tab, so the
 * brand and the theme toggle stop being re-implemented per screen — they used
 * to live inside DailyTracker's header, which meant Stats, Rehab and Body each
 * had their own copy in a slightly different place.
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
    <header className="flex h-14 flex-none items-center justify-between border-b border-line bg-bg px-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-accent text-on-accent">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6.5 7v10M17.5 7v10M6.5 12h11M4 9.5v5M20 9.5v5"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="font-display text-[15px] font-extrabold tracking-[.09em]">GYMLOG</div>
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
          className={`press flex h-10 w-10 items-center justify-center rounded-xl border transition ${
            bodyOpen
              ? "border-accent bg-accent text-on-accent"
              : "border-line bg-surface text-dim"
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
          className="press flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-dim"
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
    </header>
  );
}
