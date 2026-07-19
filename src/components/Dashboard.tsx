"use client";

import { useCallback, useMemo, useState } from "react";
import ProgressRing from "./ProgressRing";
import Sheet from "./Sheet";
import { DAYS, dateKey, parseDateKey } from "@/lib/groups";
import { useCompletionsRange } from "@/lib/store";
import { useSchedule, useWorkouts } from "@/lib/workouts";
import {
  completionFraction,
  currentStreak,
  doneCountFor,
  longestStreak,
  monthGrid,
  weekDates,
} from "@/lib/stats";

const Card = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-[18px] border border-line bg-surface p-4">
    <h2 className="text-[11px] font-bold uppercase tracking-[.1em] text-mute">{title}</h2>
    <div className="mt-3">{children}</div>
  </section>
);

export default function Dashboard() {
  const { workouts } = useWorkouts();
  const { resolve } = useSchedule();

  /** Planned exercise count for a date, via whatever workout it points at. */
  const totalFor = useCallback(
    (key: string) => {
      return resolve(key).workoutIds.reduce(
        (n, id) => n + (workouts[id]?.items.length ?? 0),
        0
      );
    },
    [resolve, workouts]
  );

  /** Session name for a date, for labelling rows. */
  const nameFor = useCallback(
    (key: string) => {
      const names = resolve(key)
        .workoutIds.map((id) => workouts[id]?.name)
        .filter(Boolean);
      return names.length ? names.join(" + ") : null;
    },
    [resolve, workouts]
  );

  const today = useMemo(() => new Date(), []);
  const [monthOffset, setMonthOffset] = useState(0);
  const month = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + monthOffset, 1),
    [today, monthOffset]
  );

  // Pull a window wide enough to cover the visible month, this week, and streaks.
  const from = useMemo(() => {
    const d = new Date(month.getFullYear(), month.getMonth(), 1);
    d.setDate(d.getDate() - 400);
    return dateKey(d);
  }, [month]);
  const to = useMemo(() => {
    const d = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    return dateKey(d > today ? d : today);
  }, [month, today]);

  const { days } = useCompletionsRange(from, to);

  const streak = currentStreak(days, today);
  const best = longestStreak(days);

  const thisWeek = useMemo(() => weekDates(today), [today]);
  const cells = useMemo(() => monthGrid(month), [month]);

  /* Every logged day, newest first. The page shows only the first one — the
     rest are a tap away, so the dashboard stays scannable. */
  const recent = useMemo(
    () =>
      Object.keys(days)
        .filter((k) => doneCountFor(days[k]) > 0)
        .sort()
        .reverse(),
    [days]
  );
  const [historyOpen, setHistoryOpen] = useState(false);

  /** One row of the session history, shared by the card and the sheet. */
  const SessionRow = ({ dayKey }: { dayKey: string }) => {
    const d = parseDateKey(dayKey);
    const label = nameFor(dayKey);
    const done = doneCountFor(days[dayKey]);
    const total = totalFor(dayKey) || done;
    return (
      <div className="flex items-center justify-between rounded-field bg-raised px-3 py-2.5">
        <span className="text-[13px] font-semibold">
          {d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
          {label && <span className="text-muted"> · {label}</span>}
        </span>
        <span
          className={`font-display text-[12px] font-bold tabular-nums ${
            done >= total ? "text-done-text" : "text-muted"
          }`}
        >
          {done}/{total} done
        </span>
      </div>
    );
  };

  return (
    <div className="flex w-full max-w-app flex-col">
      <header className="px-5 pb-1 pt-4">
        <div className="text-[11px] font-extrabold uppercase tracking-[.12em] text-accent">
          Your · Progress
        </div>
        <h1 className="mt-1 font-display text-[28px] font-extrabold tracking-[-.02em]">
          Dashboard
        </h1>
      </header>

      <div className="flex flex-col gap-3 px-5 py-4">
        {/* ------------------------------- streaks ------------------------------- */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[18px] border border-line bg-surface p-4">
            <div className="text-[10.5px] font-bold uppercase tracking-[.08em] text-mute">
              Current streak
            </div>
            <div className="mt-2 font-display text-[34px] font-bold leading-none text-accent">
              {streak}
              <span className="ml-1 text-[13px] font-semibold text-dim">
                {streak === 1 ? "day" : "days"}
              </span>
            </div>
          </div>
          <div className="rounded-[18px] border border-line bg-surface p-4">
            <div className="text-[10.5px] font-bold uppercase tracking-[.08em] text-mute">
              Longest streak
            </div>
            <div className="mt-2 font-display text-[34px] font-bold leading-none text-success">
              {best}
              <span className="ml-1 text-[13px] font-semibold text-dim">
                {best === 1 ? "day" : "days"}
              </span>
            </div>
          </div>
        </div>

        {/* ------------------------------ this week ------------------------------ */}
        <Card title="This week">
          <div className="flex justify-between">
            {thisWeek.map((d, i) => {
              const key = dateKey(d);
              const done = doneCountFor(days[key]);
              const total = totalFor(key);
              const isToday = key === dateKey(today);
              return (
                <div key={key} className="flex flex-col items-center gap-1.5">
                  <ProgressRing done={done} total={total || Math.max(done, 1)} size={38} stroke={4} showText={false} />
                  <span
                    className={`font-display text-[10px] font-bold tracking-[.08em] ${
                      isToday ? "text-accent-text" : "text-muted"
                    }`}
                  >
                    {DAYS[i].label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ------------------------------- heatmap ------------------------------- */}
        <Card title="Consistency">
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => setMonthOffset((v) => v - 1)}
              aria-label="Previous month"
              className="flex h-7 w-7 items-center justify-center rounded-field border border-line text-muted transition hover:text-text"
            >
              ‹
            </button>
            <span className="font-display text-[14px] font-bold">
              {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </span>
            <button
              onClick={() => setMonthOffset((v) => Math.min(0, v + 1))}
              disabled={monthOffset >= 0}
              aria-label="Next month"
              className="flex h-7 w-7 items-center justify-center rounded-field border border-line text-muted transition hover:text-text disabled:opacity-25"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {DAYS.map((d) => (
              <div
                key={d.key}
                className="text-center font-display text-[9px] font-bold tracking-[.06em] text-muted"
              >
                {d.label[0]}
              </div>
            ))}
            {cells.map((d, i) => {
              if (!d) return <div key={`pad-${i}`} />;
              const key = dateKey(d);
              const frac = completionFraction(key, days, totalFor);
              const isToday = key === dateKey(today);
              const future = d > today;
              return (
                <div
                  key={key}
                  title={`${key} — ${Math.round(frac * 100)}% of plan`}
                  className="aspect-square rounded-md border text-center"
                  style={{
                    background:
                      frac > 0
                        ? `rgb(var(--done) / ${0.15 + frac * 0.75})`
                        : "rgb(var(--heat-empty))",
                    borderColor: isToday ? "rgb(var(--accent))" : "transparent",
                    opacity: future ? 0.35 : 1,
                  }}
                >
                  <span
                    className="block pt-[15%] text-[9px] font-semibold"
                    // On a saturated cell the number needs to flip to the page
                    // background colour to stay legible in either theme.
                    style={{ color: frac > 0.45 ? "rgb(var(--bg))" : "rgb(var(--muted))" }}
                  >
                    {d.getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ----------------------------- last session ---------------------------- */}
        <Card title="Last session">
          {recent.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-muted">
              Tick off your first exercise to start your history.
            </p>
          ) : (
            <>
              <SessionRow dayKey={recent[0]} />
              {recent.length > 1 && (
                <button
                  onClick={() => setHistoryOpen(true)}
                  className="press mt-2 w-full rounded-field border border-line py-2.5 text-[12.5px] font-semibold text-accent-text"
                >
                  All {recent.length} sessions ›
                </button>
              )}
            </>
          )}
        </Card>
      </div>

      <Sheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Session history"
        subtitle={`${recent.length} logged ${recent.length === 1 ? "session" : "sessions"}, newest first.`}
      >
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 pb-8 pt-1">
          {recent.map((key) => (
            <SessionRow key={key} dayKey={key} />
          ))}
        </div>
      </Sheet>
    </div>
  );
}
