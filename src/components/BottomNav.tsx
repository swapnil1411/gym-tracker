"use client";

import type React from "react";

export type Tab = "today" | "rehab" | "stats" | "body";

/*
 * Four tabs, per the Ergonomic design: Body was promoted out of a header icon
 * on Today, where it was effectively undiscoverable, into the bar itself.
 */
const TABS: { id: Tab; label: string; icon: (on: boolean) => React.ReactNode }[] = [
  {
    id: "today",
    label: "Today",
    // The flame fills when active — the only tab that does, because it's home.
    icon: (on) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={on ? "currentColor" : "none"}>
        <path
          d="M12 3c3 4 5 6 5 9a5 5 0 0 1-10 0c0-1.5.6-2.7 1.5-3.7C9 10 10 8.5 12 3z"
          stroke="currentColor"
          strokeWidth={1.9}
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "rehab",
    label: "Rehab",
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 14h3l2-5 3 9 2-6 1.5 2H20"
          stroke="currentColor"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "stats",
    label: "Stats",
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6"
          stroke="currentColor"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "body",
    label: "Body",
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM6 22v-6l-2-1 1.5-5A2 2 0 0 1 7.4 9h9.2a2 2 0 0 1 1.9 1l1.5 5-2 1v6"
          stroke="currentColor"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function BottomNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <nav
      aria-label="Main"
      className="pb-safe z-10 flex-none border-t border-line bg-bg sm:rounded-b-[42px]"
    >
      <div className="flex items-stretch px-2 pb-3 pt-2.5">
        {TABS.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              aria-current={on ? "page" : undefined}
              className="press flex flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl py-1.5"
            >
              <span className={`flex leading-none transition ${on ? "text-accent" : "text-mute"}`}>
                {t.icon(on)}
              </span>
              <span
                className={`text-[10.5px] tracking-[.04em] transition ${
                  on ? "font-extrabold text-accent" : "font-semibold text-mute"
                }`}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
