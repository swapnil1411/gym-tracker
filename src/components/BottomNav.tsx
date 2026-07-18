"use client";

import type React from "react";

export type Tab = "today" | "plan" | "stats";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "today",
    label: "Today",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
    id: "stats",
    label: "Stats",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
      className="pb-safe flex-none border-t border-line bg-bg shadow-[0_-16px_32px_-28px_rgba(0,0,0,0.9)] sm:rounded-b-[42px]"
    >
      <div className="flex items-center justify-center gap-12 px-5 pb-4 pt-5">
        {TABS.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              aria-current={on ? "page" : undefined}
              className="press flex w-[112px] flex-none flex-col items-center gap-1.5 rounded-2xl px-4 py-2.5"
            >
              <span
                className={`flex leading-none transition ${
                  on ? "text-accent" : "text-mute"
                }`}
              >
                {t.icon}
              </span>
              <span
                className={`font-display text-[10px] font-bold tracking-[.08em] transition ${
                  on ? "text-accent" : "text-mute"
                }`}
              >
                {t.label.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
