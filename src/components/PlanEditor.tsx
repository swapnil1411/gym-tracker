"use client";

import { useEffect, useMemo, useState } from "react";
import Thumb from "./Thumb";
import ThemeToggle from "./ThemeToggle";
import Stepper from "./Stepper";
import ExercisePicker from "./ExercisePicker";
import { DAYS, GROUPS, tagStyle, toMondayIndex } from "@/lib/groups";
import { indexById, useLibrary } from "@/lib/library";
import { usePlan } from "@/lib/store";

export default function PlanEditor() {
  const { library } = useLibrary();
  const byId = useMemo(() => indexById(library), [library]);
  const { getDay, addExercise, removeExercise, updateItem, moveItem, setDayMeta } = usePlan();

  const [selected, setSelected] = useState(toMondayIndex(new Date().getDay()));
  const [pickerOpen, setPickerOpen] = useState(false);

  const day = getDay(selected);
  const [focusDraft, setFocusDraft] = useState(day.focusLabel);

  // Keep the text field in sync when switching days or when a remote change lands,
  // without fighting the user mid-keystroke.
  useEffect(() => setFocusDraft(day.focusLabel), [selected, day.focusLabel]);

  const commitFocus = () => {
    const next = focusDraft.trim();
    if (next && next !== day.focusLabel) setDayMeta(selected, { focusLabel: next });
    else if (!next) setFocusDraft(day.focusLabel);
  };

  return (
    <div className="flex w-full max-w-app flex-col">
      <header className="border-b border-line bg-gradient-to-b from-header-top to-bg px-4 pb-4 pt-5 sm:px-5">
        <div className="flex items-center justify-between gap-2">
          <div className="font-display text-[15px] font-black tracking-[.14em]">
            PLAN<span className="text-accent">·</span>EDITOR
          </div>
          <ThemeToggle />
        </div>
        <h1 className="mt-3 font-display text-[clamp(24px,7vw,30px)] font-black uppercase leading-[.95] tracking-tight">
          Weekly split
        </h1>
        <p className="mt-1.5 text-[13px] text-muted">
          Pick a day, then set what it&apos;s for and which moves it holds.
        </p>
      </header>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2 pt-3.5 sm:px-5">
        {DAYS.map((d, i) => {
          const dd = getDay(i);
          const active = i === selected;
          return (
            <button
              key={d.key}
              onClick={() => setSelected(i)}
              aria-pressed={active}
              className={`flex-none rounded-[11px] border px-3.5 py-2.5 font-display text-[12px] font-bold tracking-[.1em] transition ${
                active ? "border-text bg-text text-bg" : "border-line bg-surface text-muted"
              }`}
            >
              {d.label}
              <small
                className={`mt-0.5 block font-body text-[9px] font-semibold capitalize tracking-[.02em] ${
                  active ? "text-bg/60" : "text-muted"
                }`}
              >
                {dd.isRestDay ? "rest" : `${dd.items.length} moves`}
              </small>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 px-4 pt-2">
        {/* day meta */}
        <div className="rounded-2xl border border-line bg-surface p-4">
          <label
            htmlFor="focus"
            className="text-[11px] font-bold uppercase tracking-[.1em] text-muted"
          >
            Focus label
          </label>
          <input
            id="focus"
            value={focusDraft}
            onChange={(e) => setFocusDraft(e.target.value)}
            onBlur={commitFocus}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            placeholder="e.g. Push Day"
            className="mt-2 w-full rounded-xl border border-line bg-raised px-3.5 py-2.5 text-[15px] font-semibold outline-none focus:border-accent"
          />

          <button
            onClick={() => setDayMeta(selected, { isRestDay: !day.isRestDay })}
            role="switch"
            aria-checked={day.isRestDay}
            className="mt-3 flex w-full items-center justify-between rounded-xl border border-line bg-raised px-3.5 py-3 text-left"
          >
            <span className="text-[14px] font-semibold">Rest day</span>
            <span
              className={`relative h-6 w-11 flex-none rounded-full transition ${
                day.isRestDay ? "bg-done" : "bg-line"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                  day.isRestDay ? "left-[22px]" : "left-0.5"
                }`}
              />
            </span>
          </button>
        </div>

        {/* items */}
        <div className="flex flex-col gap-2.5">
          {day.items.length === 0 && (
            <p className="px-5 py-8 text-center text-sm leading-relaxed text-muted">
              Nothing scheduled for {DAYS[selected].full} yet.
            </p>
          )}

          {day.items.map((item, i) => {
            const ex = byId.get(item.exerciseId);
            const group = ex?.group ?? "core";
            const g = GROUPS[group];
            return (
              <div
                key={item.exerciseId}
                className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-3"
              >
                <Thumb src={ex?.image ?? null} group={group} size={46} />

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold tracking-[-.01em]">
                    {ex?.name ?? "Unknown exercise"}
                  </div>
                  <span
                    className="mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[.06em]"
                    style={tagStyle(g.color)}
                  >
                    {g.name}
                  </span>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Stepper
                      label="sets"
                      value={item.sets}
                      suffix=" sets"
                      onChange={(sets) => updateItem(selected, item.exerciseId, { sets })}
                    />
                    <Stepper
                      label="reps"
                      value={item.reps}
                      suffix=" reps"
                      max={200}
                      onChange={(reps) => updateItem(selected, item.exerciseId, { reps })}
                    />
                    <Stepper
                      label="weight"
                      value={item.weightKg}
                      suffix=" kg"
                      min={0}
                      max={500}
                      step={2.5}
                      onChange={(weightKg) => updateItem(selected, item.exerciseId, { weightKg })}
                    />
                  </div>
                </div>

                <div className="flex flex-none flex-col items-center gap-1">
                  <button
                    onClick={() => moveItem(selected, i, i - 1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-muted transition hover:text-text disabled:opacity-25"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveItem(selected, i, i + 1)}
                    disabled={i === day.items.length - 1}
                    aria-label="Move down"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-muted transition hover:text-text disabled:opacity-25"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeExercise(selected, item.exerciseId)}
                    aria-label={`Remove ${ex?.name ?? "exercise"}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-muted transition hover:border-accent hover:text-accent"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}

          <button
            onClick={() => setPickerOpen(true)}
            className="mt-1 flex items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-line py-[15px] text-sm font-semibold text-muted transition hover:border-accent hover:text-text"
          >
            <span className="text-lg leading-none">+</span> Add exercise to {DAYS[selected].label}
          </button>
        </div>
      </div>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={(id) => addExercise(selected, id)}
        existingIds={new Set(day.items.map((i) => i.exerciseId))}
        dayLabel={DAYS[selected].full}
      />
    </div>
  );
}
