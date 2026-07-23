"use client";

import { useState } from "react";
import { WORKOUT_PRESETS } from "@/lib/workouts";
import type { Workout } from "@/types";

/**
 * "Available Sessions" — the Stitch refined layout: a horizontally scrollable
 * row of compact 4:5 tiles, one per session, with a dashed "+" tile at the end.
 *
 * Tapping a tile adds or removes that session from the day (a day can be Pull
 * and Cardio and Abs at once); scrolling just browses. This replaced the
 * earlier full-width snap slider when the app was matched to the Stitch
 * design — the toggle semantics are unchanged, only the presentation.
 */
export default function WorkoutSlider({
  workouts,
  selectedIds,
  isOverride,
  onToggle,
  onClear,
  onCreate,
  onResetToUsual,
}: {
  workouts: Workout[];
  /** Every session on this day. Empty means rest. */
  selectedIds: string[];
  /** True when this date has been explicitly set, rather than inherited. */
  isOverride: boolean;
  onToggle: (id: string) => void;
  onClear: () => void;
  onCreate: (name: string) => void;
  onResetToUsual: () => void;
}) {
  const [creating, setCreating] = useState(false);

  const unusedPresets = WORKOUT_PRESETS.filter(
    (p) => !workouts.some((w) => w.name.toLowerCase() === p.toLowerCase())
  );

  return (
    <div className="mt-5">
      <div className="mb-2.5 flex items-center justify-between px-0.5">
        <span className="text-[11px] font-label font-extrabold uppercase tracking-[.12em] text-dim">
          Available sessions
        </span>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button onClick={onClear} className="text-[11px] font-semibold text-dim">
              Rest day
            </button>
          )}
          {isOverride && (
            <button
              onClick={onResetToUsual}
              className="text-[11px] font-semibold text-accent"
            >
              Reset to usual
            </button>
          )}
        </div>
      </div>

      <div
        role="listbox"
        aria-multiselectable="true"
        aria-label="Sessions for this day"
        className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5"
      >
        {workouts.map((w) => {
          const on = selectedIds.includes(w.id);
          return (
            <button
              key={w.id}
              role="option"
              aria-selected={on}
              onClick={() => onToggle(w.id)}
              className={`press flex aspect-[4/5] w-[124px] flex-none flex-col justify-between rounded-tile border p-3 text-left transition-colors ${
                on
                  ? "border-2 border-accent bg-surface3 p-[11px]"
                  : "border-line bg-surface"
              }`}
            >
              {/* Bolt when the session is on today's docket, dumbbell otherwise. */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className={on ? "text-accent" : "text-dim"}
              >
                {on ? (
                  <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2z" />
                ) : (
                  <path d="M6.5 7v10M17.5 7v10M6.5 12h11M4 9.5v5M20 9.5v5" />
                )}
              </svg>
              <div className="min-w-0">
                <div className="truncate font-display text-[17px] font-extrabold leading-tight">
                  {w.name}
                </div>
                <div className={`mt-1 text-[11px] font-semibold ${on ? "text-accent" : "text-dim"}`}>
                  {on ? "Active" : `${w.items.length} ${w.items.length === 1 ? "move" : "moves"}`}
                </div>
              </div>
            </button>
          );
        })}

        {/* The design's dashed empty tile is the add affordance. */}
        <button
          onClick={() => setCreating((v) => !v)}
          aria-label={creating ? "Cancel" : "Add a session"}
          aria-expanded={creating}
          className={`press flex aspect-[4/5] w-[124px] flex-none items-center justify-center rounded-tile border-[1.5px] border-dashed text-[26px] leading-none transition ${
            creating
              ? "border-accent text-accent"
              : "border-line text-mute"
          }`}
        >
          {creating ? "×" : "+"}
        </button>
      </div>

      {creating && (
        <div className="mt-2.5 rounded-card border border-line bg-surface p-3">
          <div className="text-[12px] font-semibold text-dim">Add a session</div>

          {unusedPresets.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {unusedPresets.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    onCreate(p);
                    setCreating(false);
                  }}
                  className="press rounded-full bg-surface2 px-3 py-1.5 text-[12.5px] font-semibold"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem("name") as HTMLInputElement;
              const v = input.value.trim();
              if (v) onCreate(v);
              setCreating(false);
            }}
            className="mt-2 flex gap-2"
          >
            <input
              name="name"
              placeholder="Or type your own…"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-field bg-surface2 px-3 py-2 text-[14px] outline-none placeholder:text-mute/70"
            />
            <button
              type="submit"
              className="press flex-none rounded-field bg-accent px-4 text-[13px] font-bold text-on-accent"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
