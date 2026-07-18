"use client";

import { useMemo, useState } from "react";
import ProgressRing from "./ProgressRing";
import { DAYS, GROUPS, dateKey, hexA, toMondayIndex } from "@/lib/groups";
import { indexById, useLibrary } from "@/lib/library";
import { useCompletionsRange, usePlan } from "@/lib/store";
import {
  completionFraction,
  currentStreak,
  doneCountFor,
  longestStreak,
  monthGrid,
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
  <section className="rounded-2xl border border-line bg-surface p-4">
    <h2 className="text-[11px] font-bold uppercase tracking-[.1em] text-muted">{title}</h2>
    <div className="mt-3">{children}</div>
  </section>
);

export default function Dashboard() {
  const { library } = useLibrary();
  const byId = useMemo(() => indexById(library), [library]);
  const { plan, getDay } = usePlan();

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
      <header className="border-b border-line bg-gradient-to-b from-[#12171C] to-bg px-5 pb-4 pt-[22px]">
        <div className="font-display text-[15px] font-black tracking-[.14em]">
          YOUR<span className="text-accent">·</span>PROGRESS
        </div>
        <h1 className="mt-3 font-display text-[30px] font-black uppercase leading-[.95] tracking-tight">
          Dashboard
        </h1>
      </header>

      <div className="flex flex-col gap-3 px-4 py-4">
        {/* ------------------------------- streaks ------------------------------- */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="text-[11px] font-bold uppercase tracking-[.1em] text-muted">
              Current streak
            </div>
            <div className="mt-2 font-display text-[34px] font-black leading-none text-accent">
              {streak}
              <span className="ml-1 text-[13px] font-semibold text-muted">
                {streak === 1 ? "day" : "days"}
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="text-[11px] font-bold uppercase tracking-[.1em] text-muted">
              Longest streak
            </div>
            <div className="mt-2 font-display text-[34px] font-black leading-none text-done">
              {best}
              <span className="ml-1 text-[13px] font-semibold text-muted">
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
              const total = getDay(i).items.length;
              const isToday = key === dateKey(today);
              return (
                <div key={key} className="flex flex-col items-center gap-1.5">
                  <ProgressRing done={done} total={total || Math.max(done, 1)} size={38} stroke={4} showText={false} />
                  <span
                    className={`font-display text-[10px] font-bold tracking-[.08em] ${
                      isToday ? "text-accent" : "text-muted"
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
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-muted transition hover:text-text"
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
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-muted transition hover:text-text disabled:opacity-25"
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
              const frac = completionFraction(key, days, plan);
              const isToday = key === dateKey(today);
              const future = d > today;
              return (
                <div
                  key={key}
                  title={`${key} — ${Math.round(frac * 100)}% of plan`}
                  className="aspect-square rounded-md border text-center"
                  style={{
                    background: frac > 0 ? hexA("#39D98A", 0.15 + frac * 0.75) : "#161B21",
                    borderColor: isToday ? "#FF5A1F" : "transparent",
                    opacity: future ? 0.35 : 1,
                  }}
                >
                  <span
                    className="block pt-[15%] text-[9px] font-semibold"
                    style={{ color: frac > 0.45 ? "#0E1114" : "#6B747E" }}
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
                          background: g?.color ?? "#8B949E",
                        }}
                      />
                    </div>
                    <span className="w-9 flex-none text-right font-display text-[12px] font-bold tabular-nums">
                      {sets}
                    </span>
                  </div>
                );
              })}
              <p className="mt-1 text-[11px] text-muted">Sets completed, Mon–Sun.</p>
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
                const dow = toMondayIndex(d.getDay());
                const day = getDay(dow);
                const done = doneCountFor(days[key]);
                const total = day.items.length || done;
                return (
                  <li
                    key={key}
                    className="flex items-center justify-between rounded-xl border border-line bg-raised px-3 py-2.5"
                  >
                    <span className="text-[13px] font-semibold">
                      {d.toLocaleDateString(undefined, {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                      <span className="text-muted"> · {day.focusLabel}</span>
                    </span>
                    <span
                      className="font-display text-[12px] font-bold tabular-nums"
                      style={{ color: done >= total ? "#39D98A" : "#8B949E" }}
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
