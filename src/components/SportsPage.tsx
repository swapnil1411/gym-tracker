"use client";

import { useMemo, useState } from "react";
import LogActivitySheet from "./LogActivitySheet";
import { DAYS, dateKey } from "@/lib/groups";
import { startOfWeek, weekDates } from "@/lib/stats";
import { ACTIVITY_BY_ID, paceLabel, roundKcal } from "@/lib/activities";
import { useActivitiesRange, useDayActivities, kcalOn, type ActivityEntry } from "@/lib/activity-store";
import { computeBurn } from "@/lib/burn";
import { indexById, useLibrary } from "@/lib/library";
import { useDayCompletions } from "@/lib/store";
import { useBody } from "@/lib/body";

/* The hero's CARDIO / SPORTS split. Movement priced by distance or machine is
   cardio; everything played against someone (or a mat) is sport. */
const CARDIO_IDS = new Set(["run", "walk", "incline-walk", "cycle", "swim", "hiit", "rope"]);

/**
 * Sports and cardio, week by week — the Stitch refined layout: a centred week
 * pager, a glowing weekly-burn hero with the cardio/sports split, a compact
 * day strip, then the day's activity cards and a floating "Log activity" pill.
 */
export default function SportsPage() {
  const { body } = useBody();
  const { library } = useLibrary();
  const byId = useMemo(() => indexById(library), [library]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [sheetFor, setSheetFor] = useState<ActivityEntry | null | "new">(null);

  const anchor = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const dates = useMemo(() => weekDates(anchor), [anchor]);
  const todayKey = dateKey(new Date());
  const [selectedKey, setSelectedKey] = useState(todayKey);

  // Keep the selection inside the week being viewed, otherwise paging back
  // shows an empty day that isn't on screen.
  const selected = dates.find((d) => dateKey(d) === selectedKey) ?? dates[0];
  const key = dateKey(selected);

  const { days } = useActivitiesRange(dateKey(dates[0]), dateKey(dates[6]));
  const { entries, add, update, remove } = useDayActivities(key);
  const { entries: completions } = useDayCompletions(key);

  /*
   * Everything that came from the Today tab — the lifting, plus any cardio
   * machine inside the session. Passing no activities keeps this to just those
   * rows; the bouts logged on this page are rendered separately below because
   * they're editable and these aren't.
   */
  const fromToday = useMemo(
    () => computeBurn({ entries: completions, activities: [], byId, weightKg: body.weightKg }),
    [completions, byId, body.weightKg]
  );

  const weekSport = dates.reduce((sum, d) => sum + kcalOn(days, d), 0);
  const weekCardio = dates.reduce(
    (sum, d) =>
      sum +
      (days[dateKey(d)] ?? []).reduce(
        (s, e) => s + (CARDIO_IDS.has(e.type) ? e.kcal : 0),
        0
      ),
    0
  );
  const dayKcal = entries.reduce((sum, e) => sum + e.kcal, 0);

  const rangeLabel = `${startOfWeek(anchor).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  })} — ${dates[6].toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-app flex-col md:max-w-2xl">
      {/* ------------------------------ week pager ----------------------------- */}
      <div className="flex items-center justify-between px-5 pt-4">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          aria-label="Previous week"
          className="press flex h-10 w-10 flex-none items-center justify-center rounded-xl text-dim transition hover:bg-surface3"
        >
          ‹
        </button>
        <div className="text-center">
          <div className="text-[11px] font-label font-extrabold uppercase tracking-[.12em] text-mute">
            {weekOffset === 0 ? "Current week" : "Past week"}
          </div>
          <div className="mt-0.5 text-[16px] font-extrabold">{rangeLabel}</div>
        </div>
        <button
          onClick={() => setWeekOffset((w) => Math.min(0, w + 1))}
          disabled={weekOffset >= 0}
          aria-label="Next week"
          className="press flex h-10 w-10 flex-none items-center justify-center rounded-xl text-dim transition hover:bg-surface3 disabled:opacity-30"
        >
          ›
        </button>
      </div>

      {/* --------------------------------- hero -------------------------------- */}
      <div className="px-5 pt-3">
        <div className="relative overflow-hidden rounded-[24px] border border-line bg-surface p-6">
          {/* Background accent glow, per the design. */}
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative z-10 flex flex-col items-center">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="mb-2 text-accent" aria-hidden="true">
              <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2z" />
            </svg>
            <div className="text-[11px] font-label font-extrabold uppercase tracking-[.12em] text-dim">
              Total weekly burn
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-display text-[34px] font-bold leading-none tabular-nums text-accent">
                {roundKcal(weekSport).toLocaleString()}
              </span>
              <span className="text-[13px] font-semibold text-mute">kcal</span>
            </div>
            <div className="mt-5 flex w-full justify-between gap-2">
              <div className="flex-1 rounded-tile border border-line/50 bg-surface2 p-3 text-center">
                <div className="text-[10px] font-label font-extrabold uppercase tracking-[.12em] text-mute">
                  Cardio
                </div>
                <div className="mt-1 font-display text-[19px] font-extrabold tabular-nums">
                  {roundKcal(weekCardio).toLocaleString()}
                </div>
              </div>
              <div className="flex-1 rounded-tile border border-line/50 bg-surface2 p-3 text-center">
                <div className="text-[10px] font-label font-extrabold uppercase tracking-[.12em] text-mute">
                  Sports
                </div>
                <div className="mt-1 font-display text-[19px] font-extrabold tabular-nums">
                  {roundKcal(weekSport - weekCardio).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------ week strip ----------------------------- */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between rounded-2xl border border-line bg-surface2 p-2">
          {dates.map((d, i) => {
            const k = dateKey(d);
            const on = k === key;
            const kcal = kcalOn(days, d);
            return (
              <button
                key={k}
                onClick={() => setSelectedKey(k)}
                aria-pressed={on}
                className={`press flex flex-1 flex-col items-center rounded-xl py-2 transition ${
                  on ? "bg-accent-ghost text-accent ring-1 ring-accent/30" : "text-dim"
                }`}
              >
                <span className="text-[10px] font-label font-extrabold uppercase tracking-[.1em]">
                  {DAYS[i].label[0]}
                </span>
                <span className="text-[15px] font-extrabold tabular-nums">{d.getDate()}</span>
                {/* A dot, not a number: seven three-digit figures at 48px wide
                    is a wall of noise, and the day's total is one tap away. */}
                <span
                  className={`mt-1 h-1 w-1 rounded-full ${
                    on ? "bg-accent" : kcal > 0 ? "bg-accent/60" : "bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------ day detail ----------------------------- */}
      <div className="flex flex-1 flex-col px-5 pb-2 pt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-[19px] font-extrabold tracking-[-.01em]">
            {selected.toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </h2>
          <span className="text-[13px] font-semibold text-dim">
            {roundKcal(dayKcal + fromToday.total)} kcal total
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-3">
          {/* Rows that came from Today are facts of the session, not editable
              bouts, so they render without a chevron or press state. */}
          {fromToday.rows.map((r) => (
            <div
              key={r.key}
              className="flex items-center justify-between gap-4 rounded-card border border-line bg-surface p-4"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 flex-none items-center justify-center rounded-tile bg-accent-ghost text-accent">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {r.key === "lift" ? (
                      <path d="M6.5 7v10M17.5 7v10M6.5 12h11M4 9.5v5M20 9.5v5" />
                    ) : (
                      <path d="M13 4a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zM4 20l4.5-2 1.5-5.5L8 9l4-2.5 3 3 3.5.5M10 12l-2 8" />
                    )}
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[16px] font-extrabold first-letter:uppercase">
                    {r.label}
                  </div>
                  <div className="text-[13px] font-medium text-dim">
                    {r.key === "lift" ? `${fromToday.setsDone} sets logged` : "cardio"} · from
                    Today
                  </div>
                </div>
              </div>
              <div className="flex-none text-right">
                <div className="text-[16px] font-extrabold tabular-nums text-accent">
                  {roundKcal(r.kcal)}
                </div>
                <div className="text-[10px] font-label font-extrabold uppercase tracking-[.1em] text-mute">
                  kcal
                </div>
              </div>
            </div>
          ))}

          {entries.map((e) => {
            const def = ACTIVITY_BY_ID.get(e.type);
            const pace = paceLabel(e.minutes, e.km);
            const cardio = CARDIO_IDS.has(e.type);
            return (
              <button
                key={e.id}
                onClick={() => setSheetFor(e)}
                className="press flex items-center justify-between gap-4 rounded-card border border-line bg-surface p-4 text-left"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div
                    className={`flex h-12 w-12 flex-none items-center justify-center rounded-tile text-[20px] leading-none ${
                      cardio ? "bg-success/10" : "bg-pr/10"
                    }`}
                  >
                    {def?.emoji ?? "✨"}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[16px] font-extrabold">
                      {def?.label ?? e.type}
                    </div>
                    <div className="truncate text-[13px] font-medium text-dim">
                      {e.minutes} min
                      {e.km ? ` · ${e.km} km` : ""}
                      {pace ? ` · ${pace}` : ""}
                      {e.gradePct !== undefined ? ` · ${e.gradePct}% incline` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex-none text-right">
                  <div
                    className={`text-[16px] font-extrabold tabular-nums ${
                      cardio ? "text-success" : "text-pr"
                    }`}
                  >
                    {roundKcal(e.kcal)}
                  </div>
                  <div className="text-[10px] font-label font-extrabold uppercase tracking-[.1em] text-mute">
                    kcal
                  </div>
                </div>
              </button>
            );
          })}

          {entries.length === 0 && fromToday.rows.length === 0 && (
            <div className="flex flex-col items-center rounded-[24px] border-2 border-dashed border-line p-8 text-center opacity-60">
              <p className="text-[13px] leading-relaxed text-muted">
                Nothing logged for this day.
                <br />
                Add a run, a match, or anything you moved for.
              </p>
            </div>
          )}
        </div>

        {/* The design's floating "Log activity" pill, bottom-right. */}
        <div className="pointer-events-none sticky bottom-0 z-[8] mt-auto flex justify-end pb-4 pt-6">
          <button
            onClick={() => setSheetFor("new")}
            className="press pointer-events-auto flex h-14 items-center justify-center gap-2 rounded-full bg-accent px-6 text-[15px] font-extrabold text-on-accent shadow-lift-strong"
          >
            <span className="text-[20px] leading-none">+</span> Log activity
          </button>
        </div>
      </div>

      <LogActivitySheet
        open={sheetFor !== null}
        onClose={() => setSheetFor(null)}
        editing={sheetFor === "new" ? null : sheetFor}
        onSave={(v) => {
          if (sheetFor && sheetFor !== "new") update(sheetFor.id, v);
          else add(v);
        }}
        onDelete={
          sheetFor && sheetFor !== "new" ? () => remove(sheetFor.id) : undefined
        }
      />
    </div>
  );
}
