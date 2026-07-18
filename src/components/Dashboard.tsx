"use client";

import { useCallback, useMemo, useState } from "react";
import ProgressRing from "./ProgressRing";
import ThemeToggle from "./ThemeToggle";
import { DAYS, GROUPS, barColor, dateKey } from "@/lib/groups";
import { indexById, useLibrary } from "@/lib/library";
import { useCompletionsRange } from "@/lib/store";
import { useSchedule, useWorkouts } from "@/lib/workouts";
import {
  completionFraction,
  currentStreak,
  doneCountFor,
  longestStreak,
  monthGrid,
  tonnage,
  volumeByGroup,
  weekDates,
} from "@/lib/stats";
import type { MuscleGroup } from "@/types";

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

function weeklyTonnageSeries(today: Date, tonnageFor: (dates: Date[]) => number) {
  return Array.from({ length: 8 }, (_, i) => {
    const end = new Date(today);
    end.setDate(end.getDate() - (7 - i) * 7);
    const dates = weekDates(end);
    return tonnageFor(dates);
  });
}

export default function Dashboard() {
  const { library } = useLibrary();
  const byId = useMemo(() => indexById(library), [library]);
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
  const volume = useMemo(() => volumeByGroup(thisWeek, days, byId), [thisWeek, days, byId]);
  const weekTonnage = useMemo(() => tonnage(thisWeek, days), [thisWeek, days]);
  const volumeSeries = useMemo(
    () => weeklyTonnageSeries(today, (dates) => tonnage(dates, days)),
    [today, days]
  );
  const seriesMax = Math.max(1, ...volumeSeries);
  const seriesMin = Math.min(...volumeSeries);
  const range = Math.max(1, seriesMax - seriesMin);
  const chartPoints = volumeSeries.map((v, i) => {
    const x = (i / Math.max(1, volumeSeries.length - 1)) * 322;
    const y = 114 - ((v - seriesMin) / range) * 92;
    return `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`;
  });
  const areaPath = `M0,128 ${chartPoints.map((p) => `L${p}`).join(" ")} L322,128 Z`;
  const previous = volumeSeries[volumeSeries.length - 2] ?? 0;
  const latest = volumeSeries[volumeSeries.length - 1] ?? 0;
  const trend =
    previous > 0 ? Math.round(((latest - previous) / previous) * 100) : latest > 0 ? 100 : 0;
  const maxVolume = Math.max(1, ...Object.values(volume));
  const volumeEntries = Object.entries(volume)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  const recent = useMemo(
    () =>
      Object.keys(days)
        .filter((k) => doneCountFor(days[k]) > 0)
        .sort()
        .reverse()
        .slice(0, 8),
    [days]
  );

  return (
    <div className="flex w-full max-w-app flex-col">
      <header className="border-b border-line bg-bg px-5 pb-5 pt-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[.12em] text-accent">
              Your · Progress
            </div>
            <h1 className="mt-1 font-display text-[28px] font-bold tracking-[-.02em]">
              Dashboard
            </h1>
          </div>
          <ThemeToggle />
        </div>
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

        <Card title="Volume · Last 8 weeks">
          <div className="mb-2 flex justify-end">
            <span className={`text-[12px] font-bold ${trend >= 0 ? "text-success" : "text-pr"}`}>
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </span>
          </div>
          <svg width="100%" height="128" viewBox="0 0 322 128" preserveAspectRatio="none">
            <defs>
              <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="rgb(var(--accent))" stopOpacity="0.35" />
                <stop offset="1" stopColor="rgb(var(--accent))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="0" y1="30" x2="322" y2="30" stroke="rgb(var(--border))" strokeWidth="1" strokeDasharray="3 5" />
            <line x1="0" y1="70" x2="322" y2="70" stroke="rgb(var(--border))" strokeWidth="1" strokeDasharray="3 5" />
            <path d={areaPath} fill="url(#volGrad)" />
            <polyline points={chartPoints.join(" ")} fill="none" stroke="rgb(var(--accent))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="mt-1 flex justify-between text-[10px] font-semibold text-mute">
            <span>W1</span><span>W3</span><span>W5</span><span>W7</span><span>Now</span>
          </div>
        </Card>

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

        {/* -------------------------------- volume ------------------------------- */}
        <Card title="This week's volume">
          {volumeEntries.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-muted">
              No sets logged yet this week.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {volumeEntries.map(([group, sets]) => {
                const g = GROUPS[group as MuscleGroup];
                return (
                  <div key={group} className="flex items-center gap-2.5">
                    <span className="w-[68px] flex-none text-[12px] font-semibold text-muted">
                      {g?.name ?? group}
                    </span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-raised">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(sets / maxVolume) * 100}%`,
                          background: g ? barColor(g.color) : "rgb(var(--muted))",
                        }}
                      />
                    </div>
                    <span className="w-9 flex-none text-right font-display text-[12px] font-bold tabular-nums">
                      {sets}
                    </span>
                  </div>
                );
              })}
              <div className="mt-1 flex items-baseline justify-between">
                <p className="text-[11px] text-muted">Sets completed, Mon–Sun.</p>
                {weekTonnage > 0 && (
                  <p className="text-[11px] text-muted">
                    <span className="font-display text-[13px] font-bold text-text">
                      {weekTonnage.toLocaleString()}
                    </span>{" "}
                    kg moved
                  </p>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* ---------------------------- recent sessions --------------------------- */}
        <Card title="Recent sessions">
          {recent.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-muted">
              Tick off your first exercise to start your history.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recent.map((key) => {
                const d = new Date(
                  Number(key.slice(0, 4)),
                  Number(key.slice(5, 7)) - 1,
                  Number(key.slice(8, 10))
                );
                const label = nameFor(key);
                const done = doneCountFor(days[key]);
                const total = totalFor(key) || done;
                return (
                  <li
                    key={key}
                    className="flex items-center justify-between rounded-field bg-raised px-3 py-2.5"
                  >
                    <span className="text-[13px] font-semibold">
                      {d.toLocaleDateString(undefined, {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                      {label && <span className="text-muted"> · {label}</span>}
                    </span>
                    <span
                      className={`font-display text-[12px] font-bold tabular-nums ${
                        done >= total ? "text-done-text" : "text-muted"
                      }`}
                    >
                      {done}/{total} done
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
