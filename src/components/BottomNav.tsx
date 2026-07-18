"use client";

export type Tab = "today" | "plan" | "stats";

/*
 * Plan is deliberately absent. Sessions are created, named, filled and
 * scheduled from the tracker itself, so a permanent tab for it was a third of
 * the nav bar spent on a screen you rarely need. It is still reachable from the
 * calendar button in the tracker header, where the week-level settings live.
 */
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "today", label: "Today", icon: "🔥" },
  { id: "stats", label: "Stats", icon: "📈" },
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
      className="pb-safe fixed bottom-0 left-1/2 z-10 w-full max-w-app -translate-x-1/2 glass"
    >
      <div className="flex">
        {TABS.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              aria-current={on ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-1 py-2.5"
            >
              <span
                className={`text-[19px] leading-none transition ${on ? "" : "opacity-40 grayscale"}`}
                aria-hidden="true"
              >
                {t.icon}
              </span>
              <span
                className={`font-display text-[10px] font-bold tracking-[.08em] transition ${
                  on ? "text-accent-text" : "text-muted"
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
