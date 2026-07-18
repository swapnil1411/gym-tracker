"use client";

import { useEffect, useMemo, useState } from "react";
import Thumb from "./Thumb";
import ExerciseDetail from "./ExerciseDetail";
import ThemeToggle from "./ThemeToggle";
import Stepper from "./Stepper";
import ExercisePicker from "./ExercisePicker";
import { DAYS, GROUPS, tagStyle } from "@/lib/groups";
import { indexById, useLibrary } from "@/lib/library";
import { WORKOUT_PRESETS, useSchedule, useWorkouts } from "@/lib/workouts";
import type { LibraryExercise } from "@/types";

export default function PlanEditor({ onBack }: { onBack: () => void }) {
  const { library } = useLibrary();
  const byId = useMemo(() => indexById(library), [library]);
  const {
    ordered,
    workouts,
    create,
    rename,
    remove,
    addExercise,
    removeExercise,
    updateItem,
    moveItem,
  } = useWorkouts();
  const { defaults, setWeekdayDefault } = useSchedule();

  /** Weekday defaults predate multi-session days, so normalise the old shape. */
  const usualFor = (dow: number): string[] => {
    const v = defaults.byWeekday?.[dow];
    if (Array.isArray(v)) return v;
    return v ? [v] : [];
  };

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [detail, setDetail] = useState<LibraryExercise | null>(null);
  const [nameDraft, setNameDraft] = useState("");

  // Fall back to the first workout whenever the selection goes stale — on first
  // load, or after the selected one is deleted.
  const workout = (selectedId && workouts[selectedId]) || ordered[0] || null;

  useEffect(() => {
    setNameDraft(workout?.name ?? "");
  }, [workout?.id, workout?.name]);

  const commitName = () => {
    const next = nameDraft.trim();
    if (workout && next && next !== workout.name) rename(workout.id, next);
    else if (!next) setNameDraft(workout?.name ?? "");
  };

  const unusedPresets = WORKOUT_PRESETS.filter(
    (p) => !ordered.some((w) => w.name.toLowerCase() === p.toLowerCase())
  );

  return (
    <div className="flex w-full max-w-app flex-col">
      <header className="border-b border-line bg-bg px-5 pb-5 pt-4">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onBack}
            className="press -ml-1 flex items-center gap-1.5 rounded-field px-1.5 py-1 text-[13px] font-semibold text-muted"
          >
            ‹ Today
          </button>
          <ThemeToggle />
        </div>
        <h1 className="mt-3 font-display text-[clamp(24px,7vw,30px)] font-black uppercase leading-[.95] tracking-tight">
          Your sessions
        </h1>
        <p className="mt-1.5 text-[13px] text-muted">
          Build each session once. It keeps its exercises and weights wherever you put it in
          the week.
        </p>
      </header>

      {/* ------------------------------ session picker ----------------------------- */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2 pt-3.5 sm:px-5">
        {ordered.map((w) => {
          const active = w.id === workout?.id;
          return (
            <button
              key={w.id}
              onClick={() => setSelectedId(w.id)}
              aria-pressed={active}
              className={`press flex-none rounded-tile px-3.5 py-2.5 font-display text-[12px] font-bold tracking-[.1em] ${
                active ? "bg-text text-bg" : "bg-surface text-muted"
              }`}
            >
              {w.name.toUpperCase()}
              <small
                className={`mt-0.5 block font-body text-[9px] font-semibold tracking-[.02em] ${
                  active ? "text-bg/60" : "text-muted"
                }`}
              >
                {w.items.length} moves
              </small>
            </button>
          );
        })}
      </div>

      {ordered.length === 0 && (
        <div className="px-4 pt-2">
          <div className="rounded-card bg-surface p-4">
            <div className="text-[11px] font-bold uppercase tracking-[.1em] text-muted">
              Start with a split
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {unusedPresets.map((p) => (
                <button
                  key={p}
                  onClick={() => create(p)}
                  className="press rounded-full bg-raised px-3 py-2 text-[12.5px] font-semibold"
                >
                  + {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {workout && (
        <div className="flex flex-col gap-3 px-4 pt-2">
          {/* session meta */}
          <div className="rounded-card bg-surface p-4">
            <label
              htmlFor="wname"
              className="text-[11px] font-bold uppercase tracking-[.1em] text-muted"
            >
              Session name
            </label>
            <input
              id="wname"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              placeholder="e.g. Back + Biceps"
              className="mt-2 w-full rounded-field bg-raised px-3.5 py-2.5 text-[15px] font-semibold outline-none"
            />

            <button
              onClick={() => {
                if (
                  confirm(
                    `Delete "${workout.name}"? Days pointing at it become rest days. Your logged history is kept.`
                  )
                ) {
                  remove(workout.id);
                  setSelectedId(null);
                }
              }}
              className="press mt-3 w-full rounded-field bg-raised py-2.5 text-[13px] font-semibold text-muted"
            >
              Delete session
            </button>
          </div>

          {/* items */}
          <div className="flex flex-col gap-2.5">
            {workout.items.length === 0 && (
              <p className="px-5 py-8 text-center text-sm leading-relaxed text-muted">
                Nothing in {workout.name} yet.
              </p>
            )}

            {workout.items.map((item, i) => {
              const ex = byId.get(item.exerciseId);
              const group = ex?.group ?? "core";
              const g = GROUPS[group];
              return (
                <div
                  key={item.exerciseId}
                  className="rise-in flex items-start gap-3 rounded-card glass p-3"
                  style={{ animationDelay: `${Math.min(i, 6) * 38}ms` }}
                >
                  <Thumb
                    src={ex?.image ?? null}
                    group={group}
                    size={46}
                    onPress={ex ? () => setDetail(ex) : undefined}
                    pressLabel={ex ? `See how to do ${ex.name}` : undefined}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-bold tracking-[-.01em]">
                      {ex?.name ?? "Unknown exercise"}
                    </div>
                    <span
                      className="mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[.06em]"
                      style={tagStyle(g)}
                    >
                      {g.name}
                    </span>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Stepper
                        label="sets"
                        value={item.sets}
                        suffix=" sets"
                        onChange={(sets) => updateItem(workout.id, item.exerciseId, { sets })}
                      />
                      <Stepper
                        label="reps"
                        value={item.reps}
                        suffix=" reps"
                        max={200}
                        onChange={(reps) => updateItem(workout.id, item.exerciseId, { reps })}
                      />
                      <Stepper
                        label="weight"
                        value={item.weightKg}
                        suffix=" kg"
                        min={0}
                        max={500}
                        step={2.5}
                        onChange={(weightKg) =>
                          updateItem(workout.id, item.exerciseId, { weightKg })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex flex-none flex-col items-center gap-1">
                    <button
                      onClick={() => moveItem(workout.id, i, i - 1)}
                      disabled={i === 0}
                      aria-label="Move up"
                      className="flex h-7 w-7 items-center justify-center rounded-field border border-line text-muted transition hover:text-text disabled:opacity-25"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveItem(workout.id, i, i + 1)}
                      disabled={i === workout.items.length - 1}
                      aria-label="Move down"
                      className="flex h-7 w-7 items-center justify-center rounded-field border border-line text-muted transition hover:text-text disabled:opacity-25"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => removeExercise(workout.id, item.exerciseId)}
                      aria-label={`Remove ${ex?.name ?? "exercise"}`}
                      className="flex h-7 w-7 items-center justify-center rounded-field border border-line text-muted transition hover:border-accent hover:text-accent-text"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => setPickerOpen(true)}
              className="mt-1 flex items-center justify-center gap-2 rounded-card border-[1.5px] border-dashed border-line py-[15px] text-sm font-semibold text-muted transition hover:border-accent hover:text-text"
            >
              <span className="text-lg leading-none">+</span> Add exercise to {workout.name}
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------ weekly rhythm ------------------------------ */}
      {ordered.length > 0 && (
        <div className="px-4 pb-6 pt-4">
          <div className="rounded-card bg-surface p-4">
            <div className="text-[11px] font-bold uppercase tracking-[.1em] text-muted">
              Usual week
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
              What each weekday defaults to. Changing a single day on the tracker overrides
              just that date, never this.
            </p>

            <div className="mt-3 flex flex-col gap-1.5">
              {DAYS.map((d, i) => (
                <div key={d.key} className="flex items-center gap-2">
                  <span className="w-10 flex-none font-display text-[11px] font-bold tracking-[.1em] text-muted">
                    {d.label}
                  </span>
                  {/* Toggles, not a dropdown — a weekday can hold more than one session. */}
                  <div className="no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
                    {ordered.map((w) => {
                      const on = usualFor(i).includes(w.id);
                      return (
                        <button
                          key={w.id}
                          onClick={() =>
                            setWeekdayDefault(
                              i,
                              on
                                ? usualFor(i).filter((x) => x !== w.id)
                                : [...usualFor(i), w.id]
                            )
                          }
                          aria-pressed={on}
                          className={`press flex-none rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${
                            on ? "bg-accent text-on-accent" : "bg-raised text-muted"
                          }`}
                        >
                          {w.name}
                        </button>
                      );
                    })}
                    {usualFor(i).length === 0 && (
                      <span className="flex-none self-center px-1 text-[12px] text-muted">
                        rest
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={(id) => workout && addExercise(workout.id, id)}
        onRemove={(id) => workout && removeExercise(workout.id, id)}
        existingIds={new Set(workout?.items.map((i) => i.exerciseId) ?? [])}
        dayLabel={workout?.name ?? ""}
      />

      <ExerciseDetail exercise={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
