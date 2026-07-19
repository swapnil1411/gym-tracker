"use client";

import { useMemo, useState } from "react";
import LogActivitySheet from "./LogActivitySheet";
import { DAYS, dateKey } from "@/lib/groups";
import { startOfWeek, weekDates } from "@/lib/stats";
import { ACTIVITY_BY_ID, liftingKcal, paceLabel, roundKcal } from "@/lib/activities";
import { useActivitiesRange, useDayActivities, kcalOn, type ActivityEntry } from "@/lib/activity-store";
import { useDayCompletions } from "@/lib/store";
import { useBody } from "@/lib/body";

/**
 * Sports and cardio, week by week.
 *
 * Deliberately the same shape as Today — a week strip, a list of the selected
 * day, one primary action pinned to the bottom — because it is the same job
 * done with different equipment, and a second navigation idiom would be one to
 * learn for no gain.
 */
export default function SportsPage() {
  const { body } = useBody();
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

  // Lifting is derived from what was actually ticked off, not from the plan —
  // a session you skipped shouldn't show up as calories you spent.
  const setsDone = Object.values(completions)
    .filter((e) => e.done)
    .reduce((sum, e) => sum + (e.setsDone || 0), 0);
  const gymKcal = roundKcal(liftingKcal(setsDone, body.weightKg));

  const weekSport = dates.reduce((sum, d) => sum + kcalOn(days, d), 0);
  const dayKcal = entries.reduce((sum, e) => sum + e.kcal, 0);

  const weekLabel =
    weekOffset === 0
      ? "This week"
      : `${startOfWeek(anchor).toLocaleDateString(undefined, { day: "numeric", month: "short" })} – ${dates[6].toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;

  return (
    <div className="flex min-h-full w-full max-w-app flex-col">
      <header className="px-5 pb-2 pt-4">
        <div className="text-[11px] font-extrabold uppercase tracking-[.12em] text-accent">
          Sports
        </div>
        <h1 className="mt-1 font-display text-[28px] font-extrabold tracking-[-.02em]">
          Cardio &amp; sport
        </h1>
      </header>

      {/* ------------------------------ week total ----------------------------- */}
      <div className="px-5 pt-2">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            aria-label="Previous week"
            className="press flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-line bg-surface text-dim"
          >
            ‹
          </button>
          <div className="text-[12px] font-bold uppercase tracking-[.08em] text-mute">
            {weekLabel}
          </div>
          <button
            onClick={() => setWeekOffset((w) => Math.min(0, w + 1))}
            disabled={weekOffset >= 0}
            aria-label="Next week"
            className="press flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-line bg-surface text-dim disabled:opacity-30"
          >
            ›
          </button>
        </div>

        <div className="mt-3 rounded-card bg-accent px-4 py-3.5 text-on-accent">
          <div className="text-[10.5px] font-bold uppercase tracking-[.08em] opacity-75">
            Burned this week · sport &amp; cardio
          </div>
          <div className="mt-1 font-display text-[36px] font-bold leading-none tabular-nums">
            {roundKcal(weekSport)}
            <span className="ml-1.5 text-[13px] font-semibold opacity-75">kcal</span>
          </div>
        </div>
      </div>

      {/* ------------------------------ week strip ----------------------------- */}
      <div className="mt-3 flex gap-1.5 px-5">
        {dates.map((d, i) => {
          const k = dateKey(d);
          const on = k === key;
          const kcal = kcalOn(days, d);
          return (
            <button
              key={k}
              onClick={() => setSelectedKey(k)}
              aria-pressed={on}
              className={`press flex flex-1 flex-col items-center gap-1 rounded-field border py-2 transition ${
                on ? "border-accent bg-accent text-on-accent" : "border-line bg-raised"
              }`}
            >
              <span className={`text-[9.5px] font-bold ${on ? "opacity-75" : "text-mute"}`}>
                {DAYS[i].label}
              </span>
              <span className="font-display text-[14px] font-extrabold tabular-nums">
                {d.getDate()}
              </span>
              {/* A dot, not a number: seven three-digit figures at 48px wide is
                  a wall of noise, and the day's real total is one tap away. */}
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  kcal > 0 ? (on ? "bg-on-accent" : "bg-accent") : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* ------------------------------ day detail ----------------------------- */}
      <div className="flex flex-1 flex-col px-5 pb-2 pt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-[.1em] text-mute">
            {selected.toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </h2>
          <span className="font-display text-[13px] font-extrabold tabular-nums text-accent">
            {roundKcal(dayKcal + gymKcal)} kcal
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {gymKcal > 0 && (
            <div className="flex items-center gap-3 rounded-card border border-dashed border-line px-3.5 py-3">
              <span className="text-[19px] leading-none">🏋️</span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-bold">Gym session</div>
                <div className="text-[11.5px] text-muted">
                  {setsDone} sets logged · from Today
                </div>
              </div>
              <span className="font-display text-[15px] font-extrabold tabular-nums">
                {gymKcal}
              </span>
            </div>
          )}

          {entries.map((e) => {
            const def = ACTIVITY_BY_ID.get(e.type);
            const pace = paceLabel(e.minutes, e.km);
            return (
              <button
                key={e.id}
                onClick={() => setSheetFor(e)}
                className="press flex items-center gap-3 rounded-card border border-line bg-surface px-3.5 py-3 text-left"
              >
                <span className="text-[19px] leading-none">{def?.emoji ?? "✨"}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-bold">{def?.label ?? e.type}</div>
                  <div className="truncate text-[11.5px] text-muted">
                    {e.minutes} min
                    {e.km ? ` · ${e.km} km` : ""}
                    {pace ? ` · ${pace}` : ""}
                    {e.gradePct !== undefined ? ` · ${e.gradePct}% incline` : ""}
                  </div>
                </div>
                <span className="font-display text-[15px] font-extrabold tabular-nums text-accent">
                  {roundKcal(e.kcal)}
                </span>
              </button>
            );
          })}

          {entries.length === 0 && gymKcal === 0 && (
            <p className="py-10 text-center text-[13px] leading-relaxed text-muted">
              Nothing logged for this day.
              <br />
              Add a run, a match, or anything you moved for.
            </p>
          )}
        </div>

        <div className="sticky bottom-0 z-[8] mt-auto bg-gradient-to-t from-bg from-55% to-transparent pb-3 pt-7">
          <button
            onClick={() => setSheetFor("new")}
            className="press flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-[16px] font-extrabold text-on-accent shadow-lift-strong"
          >
            + Log activity
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
