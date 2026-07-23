"use client";

import { useCallback, useMemo, useState } from "react";
import ProgressRing from "./ProgressRing";
import Sheet from "./Sheet";
import { DAYS, dateKey, parseDateKey } from "@/lib/groups";
import { useCompletionsRange } from "@/lib/store";
import { useSchedule, useWorkouts } from "@/lib/workouts";
import { indexById, useLibrary } from "@/lib/library";
import { formatKg } from "@/lib/history";
import {
  completionFraction,
  currentStreak,
  doneCountFor,
  longestStreak,
  monthGrid,
  weekDates,
} from "@/lib/stats";
import { useActivitiesRange, kcalAcross, kcalOn } from "@/lib/activity-store";
import { roundKcal } from "@/lib/activities";

export default function Dashboard() {
  const { workouts } = useWorkouts();
  const { resolve } = useSchedule();
  const { library } = useLibrary();
  const byId = useMemo(() => indexById(library), [library]);

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
  // Same date window, second source — the calendar shows both without becoming
  // a second calendar.
  const { days: actDays } = useActivitiesRange(from, to);

  const streak = currentStreak(days, today);
  const best = longestStreak(days);

  const thisWeek = useMemo(() => weekDates(today), [today]);
  const cells = useMemo(() => monthGrid(month), [month]);
  const weekSportKcal = kcalAcross(actDays, thisWeek);

  /* Week completion — the "85% COMPLETE" figure on the rings card. Only days
     with a plan (or logged work) count, or five rest days would read as 0%. */
  const weekPct = useMemo(() => {
    let done = 0;
    let planned = 0;
    for (const d of thisWeek) {
      if (d > today) continue;
      const k = dateKey(d);
      const t = totalFor(k) || doneCountFor(days[k]);
      if (t === 0) continue;
      planned += t;
      done += Math.min(doneCountFor(days[k]), t);
    }
    return planned === 0 ? 0 : Math.round((done / planned) * 100);
  }, [thisWeek, today, days, totalFor]);

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

  const monthLogs = useMemo(
    () =>
      cells.filter((d) => d && doneCountFor(days[dateKey(d)]) > 0).length,
    [cells, days]
  );

  /* Last-session card figures: volume from what was actually logged that day,
     duration from the same ≈3.5 min-per-set estimate Today uses. */
  const lastKey = recent[0];
  const lastStats = useMemo(() => {
    if (!lastKey) return null;
    const entries = days[lastKey] ?? {};
    let volume = 0;
    let sets = 0;
    let minutes = 0;
    for (const e of Object.values(entries)) {
      if (!e?.done) continue;
      sets += e.setsDone ?? 0;
      if (e.minutesDone) minutes += e.minutesDone;
      else volume += (e.setsDone ?? 0) * (e.repsDone ?? 0) * (e.weightKg ?? 0);
    }
    const done = doneCountFor(days[lastKey]);
    const total = totalFor(lastKey) || done;
    return {
      volume,
      duration: Math.round(sets * 3.5) + minutes,
      done,
      total,
      complete: done >= total,
    };
  }, [lastKey, days, totalFor]);

  /* A PR earned in the last session: heaviest logged weight for a move that
     beats every earlier log of the same move in the loaded window. */
  const lastPr = useMemo(() => {
    if (!lastKey) return null;
    const entries = days[lastKey] ?? {};
    let bestRow: { exerciseId: string; kg: number; prevBest: number } | null = null;
    for (const [exerciseId, e] of Object.entries(entries)) {
      const kg = e?.done ? e.weightKg ?? 0 : 0;
      if (kg <= 0) continue;
      let prevBest = 0;
      for (const [k, day] of Object.entries(days)) {
        if (k >= lastKey) continue;
        const p = day[exerciseId];
        if (p?.done && (p.weightKg ?? 0) > prevBest) prevBest = p.weightKg ?? 0;
      }
      if (prevBest > 0 && kg >= prevBest && (!bestRow || kg > bestRow.kg))
        bestRow = { exerciseId, kg, prevBest };
    }
    return bestRow;
  }, [lastKey, days]);

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
    <div className="mx-auto flex w-full max-w-app flex-col md:max-w-2xl">
      <header className="px-5 pb-1 pt-4">
        <div className="text-[11px] font-label font-extrabold uppercase tracking-[.12em] text-accent">
          Performance overview
        </div>
        <h1 className="mt-1 font-display text-[28px] font-extrabold tracking-[-.02em]">
          Stats Dashboard
        </h1>
      </header>

      <div className="flex flex-col gap-4 px-5 py-4">
        {/* -------------------------- highlight grid -------------------------- */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-card border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-accent" aria-hidden="true">
                <path d="M12 3c3 4 5 6 5 9a5 5 0 0 1-10 0c0-1.5.6-2.7 1.5-3.7C9 10 10 8.5 12 3z" />
              </svg>
              <span className="text-[11px] font-label font-extrabold uppercase tracking-[.12em] text-dim">
                Current
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-[34px] font-bold leading-none tabular-nums">
                {streak}
              </span>
              <span className="text-[13px] font-semibold text-dim">
                {streak === 1 ? "day" : "days"}
              </span>
            </div>
            <p className="mt-1.5 text-[13px] font-semibold text-mute">Streak active</p>
          </div>
          <div className="rounded-card border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="text-pr" aria-hidden="true">
                <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4zM7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
              </svg>
              <span className="text-[11px] font-label font-extrabold uppercase tracking-[.12em] text-dim">
                Longest
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-[34px] font-bold leading-none tabular-nums text-pr">
                {best}
              </span>
              <span className="text-[13px] font-semibold text-dim">
                {best === 1 ? "day" : "days"}
              </span>
            </div>
            <p className="mt-1.5 text-[13px] font-semibold text-mute">Personal best</p>
          </div>
        </div>

        {/* Only shown once there's something to show — an empty calorie card
            on a lifting-only week is just a reminder of a feature. */}
        {weekSportKcal > 0 && (
          <div className="rounded-card border border-line bg-surface p-4">
            <div className="flex items-baseline justify-between">
              <div className="text-[11px] font-label font-extrabold uppercase tracking-[.12em] text-dim">
                Sport &amp; cardio this week
              </div>
              <span className="font-display text-[20px] font-extrabold leading-none tabular-nums text-accent">
                {roundKcal(weekSportKcal)}
                <span className="ml-1 text-[11px] font-semibold text-dim">kcal</span>
              </span>
            </div>
          </div>
        )}

        {/* --------------------------- weekly rings --------------------------- */}
        <section className="rounded-card border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[17px] font-extrabold tracking-[-.01em]">
              Weekly Progress
            </h2>
            <span className="text-[11px] font-label font-extrabold uppercase tracking-[.12em] text-success">
              {weekPct}% complete
            </span>
          </div>
          <div className="mt-4 flex justify-between">
            {thisWeek.map((d, i) => {
              const key = dateKey(d);
              const done = doneCountFor(days[key]);
              const total = totalFor(key);
              const isToday = key === dateKey(today);
              return (
                <div key={key} className="flex flex-col items-center gap-2">
                  <ProgressRing done={done} total={total || Math.max(done, 1)} size={40} stroke={4} showText={false} />
                  <span
                    className={`font-display text-[10px] font-bold tracking-[.08em] ${
                      isToday ? "text-text" : "text-dim"
                    }`}
                  >
                    {DAYS[i].label[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ----------------------------- heatmap ------------------------------ */}
        <section className="rounded-card border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[17px] font-extrabold tracking-[-.01em]">
              Consistency
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMonthOffset((v) => v - 1)}
                aria-label="Previous month"
                className="flex h-7 w-7 items-center justify-center rounded-field border border-line text-muted transition hover:text-text"
              >
                ‹
              </button>
              <span className="min-w-[92px] text-center font-display text-[13px] font-bold">
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
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1.5">
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
              const sportKcal = kcalOn(actDays, d);
              return (
                <div
                  key={key}
                  title={`${key} — ${Math.round(frac * 100)}% of plan${
                    sportKcal > 0 ? ` · ${roundKcal(sportKcal)} kcal sport` : ""
                  }`}
                  className="relative aspect-square rounded-[4px] border text-center"
                  style={{
                    // The design heat-maps in the primary, saving green for
                    // fully complete days.
                    background:
                      frac >= 1
                        ? "rgb(var(--success))"
                        : frac > 0
                          ? `rgb(var(--accent) / ${0.2 + frac * 0.7})`
                          : "rgb(var(--surface3))",
                    borderColor: isToday ? "rgb(var(--accent))" : "transparent",
                    opacity: future ? 0.35 : 1,
                  }}
                >
                  <span
                    className="block pt-[15%] text-[9px] font-semibold"
                    // On a saturated cell the number needs to flip to stay
                    // legible in either theme.
                    style={{
                      color:
                        frac >= 1
                          ? "rgb(var(--on-success))"
                          : frac > 0.45
                            ? "rgb(var(--on-accent))"
                            : "rgb(var(--muted))",
                    }}
                  >
                    {d.getDate()}
                  </span>
                  {/* Sport sits on the same cell as lifting rather than in its
                      own grid — one day, one square, however you moved. */}
                  {sportKcal > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-[13%] left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-accent"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-medium text-dim">Less</span>
              <span className="h-3 w-3 rounded-[3px] bg-surface3" />
              <span className="h-3 w-3 rounded-[3px] bg-accent/20" />
              <span className="h-3 w-3 rounded-[3px] bg-accent/60" />
              <span className="h-3 w-3 rounded-[3px] bg-accent" />
              <span className="text-[12px] font-medium text-dim">More</span>
            </div>
            <span className="text-[11px] font-label font-extrabold uppercase tracking-[.1em] text-accent">
              {monthLogs} {monthLogs === 1 ? "log" : "logs"} this month
            </span>
          </div>
        </section>

        {/* --------------------------- last session --------------------------- */}
        <section className="rounded-card border border-line bg-surface2 p-4">
          {recent.length === 0 || !lastStats ? (
            <>
              <div className="text-[11px] font-label font-extrabold uppercase tracking-[.12em] text-dim">
                Last session
              </div>
              <p className="py-4 text-center text-[13px] text-muted">
                Tick off your first exercise to start your history.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-label font-extrabold uppercase tracking-[.12em] text-dim">
                    Last session
                  </div>
                  <h2 className="mt-1 truncate font-display text-[19px] font-extrabold">
                    {nameFor(lastKey) ??
                      parseDateKey(lastKey).toLocaleDateString(undefined, {
                        weekday: "long",
                      })}
                  </h2>
                </div>
                {lastStats.complete && (
                  <span className="flex-none rounded-full bg-success/15 px-3 py-1 text-[11px] font-label font-extrabold uppercase tracking-[.1em] text-success">
                    Completed
                  </span>
                )}
              </div>

              <div className="mt-3 flex gap-6 border-y border-line/50 py-3">
                {lastStats.volume > 0 && (
                  <div>
                    <div className="text-[10px] font-label font-extrabold uppercase tracking-[.1em] text-mute">
                      Volume
                    </div>
                    <div className="mt-0.5 text-[15px] font-extrabold tabular-nums">
                      {Math.round(lastStats.volume).toLocaleString()} kg
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-[10px] font-label font-extrabold uppercase tracking-[.1em] text-mute">
                    Duration
                  </div>
                  <div className="mt-0.5 text-[15px] font-extrabold tabular-nums">
                    ~{lastStats.duration} min
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-label font-extrabold uppercase tracking-[.1em] text-mute">
                    Done
                  </div>
                  <div className="mt-0.5 text-[15px] font-extrabold tabular-nums">
                    {lastStats.done}/{lastStats.total}
                  </div>
                </div>
              </div>

              <div className="mt-1 flex items-center justify-between">
                <span className="text-[12.5px] font-medium text-dim">
                  {parseDateKey(lastKey).toLocaleDateString(undefined, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                {recent.length > 1 && (
                  <button
                    onClick={() => setHistoryOpen(true)}
                    className="press flex items-center gap-1 rounded-field px-2 py-1.5 text-[14px] font-bold text-accent"
                  >
                    All {recent.length} sessions
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>
            </>
          )}
        </section>

        {/* ---------------------------- PR banner ----------------------------- */}
        {lastPr && (
          <section
            className="flex items-center gap-4 rounded-card border border-pr/20 bg-pr2 p-4"
            style={{ boxShadow: "0 0 30px -5px rgb(var(--pr) / 0.25)" }}
          >
            <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-pr/10 text-pr">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2l2.4 5.3 5.6.6-4.2 3.9 1.2 5.6L12 14.5 7 17.4l1.2-5.6L4 7.9l5.6-.6L12 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-[17px] font-extrabold text-pr">
                New {byId.get(lastPr.exerciseId)?.name ?? "lift"} PR!
              </h3>
              <p className="mt-0.5 text-[13px] leading-snug text-dim">
                You logged {formatKg(lastPr.kg)}kg — up from {formatKg(lastPr.prevBest)}kg.
              </p>
            </div>
          </section>
        )}
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
