"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WORKOUT_PRESETS } from "@/lib/workouts";
import type { Workout } from "@/types";

/**
 * A single button you slide through your sessions, plus a "+" to add another.
 *
 * Sliding *browses*; tapping the card adds or removes that session from the
 * day. They are separate gestures on purpose: a day can be Pull and Cardio and
 * Abs at once, so "whatever you stopped scrolling on" would toggle sessions on
 * just by passing them.
 *
 * Built on CSS scroll-snap rather than a drag handler — the browser supplies
 * real touch momentum and snapping, off the main thread, so it stays smooth
 * over the glass cards.
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
  const trackRef = useRef<HTMLDivElement>(null);
  const raf = useRef<number | undefined>(undefined);
  const settle = useRef<number | undefined>(undefined);
  const programmatic = useRef(false);

  /*
   * Which card is under the centre line right now. Styling from committed state
   * meant the highlight waited on a debounce and then popped; this follows the
   * finger instead.
   */
  const [liveIndex, setLiveIndex] = useState(0);

  const nearestIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 0;
    const centre = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestDistance = Infinity;
    Array.from(track.children).forEach((c, i) => {
      const el = c as HTMLElement;
      const d = Math.abs(el.offsetLeft + el.clientWidth / 2 - centre);
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    });
    return best;
  }, []);

  const scrollToIndex = useCallback((i: number, smooth: boolean) => {
    const track = trackRef.current;
    const child = track?.children[i] as HTMLElement | undefined;
    if (!track || !child) return;
    const target = child.offsetLeft - (track.clientWidth - child.clientWidth) / 2;
    // Already there: re-scrolling would cut off the browser's own snap.
    if (Math.abs(track.scrollLeft - target) < 2) return;
    programmatic.current = true;
    track.scrollTo({ left: target, behavior: smooth ? "smooth" : "auto" });
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(
      () => {
        programmatic.current = false;
      },
      smooth ? 420 : 60
    );
  }, []);

  const onScroll = () => {
    if (raf.current === undefined) {
      raf.current = requestAnimationFrame(() => {
        raf.current = undefined;
        setLiveIndex(nearestIndex());
      });
    }
  };

  useEffect(
    () => () => {
      if (raf.current !== undefined) cancelAnimationFrame(raf.current);
      window.clearTimeout(settle.current);
    },
    []
  );

  const step = (delta: number) => {
    const next = Math.min(Math.max(liveIndex + delta, 0), workouts.length - 1);
    setLiveIndex(next);
    scrollToIndex(next, true);
  };

  const unusedPresets = WORKOUT_PRESETS.filter(
    (p) => !workouts.some((w) => w.name.toLowerCase() === p.toLowerCase())
  );

  return (
    <div className="mt-3">
      <div className="mb-1.5 flex items-center justify-between px-0.5">
        <span className="text-[11px] font-bold uppercase tracking-[.1em] text-muted">
          {selectedIds.length > 1
            ? `Today · ${selectedIds.length} sessions`
            : "Today's session"}
        </span>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button onClick={onClear} className="text-[11px] font-semibold text-muted">
              Rest day
            </button>
          )}
          {isOverride && (
            <button
              onClick={onResetToUsual}
              className="text-[11px] font-semibold text-accent-text"
            >
              Reset to usual
            </button>
          )}
        </div>
      </div>

      <div className="flex items-stretch gap-2">
        <div
          ref={trackRef}
          onScroll={onScroll}
          role="listbox"
          aria-multiselectable="true"
          tabIndex={0}
          aria-label="Sessions for this day"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              step(1);
            }
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              step(-1);
            }
            if (e.key === "Enter" || e.key === " ") {
              const w = workouts[liveIndex];
              if (w) {
                e.preventDefault();
                onToggle(w.id);
              }
            }
          }}
          className="no-scrollbar flex flex-1 snap-x snap-mandatory gap-3 overflow-x-auto rounded-full outline-none"
        >
          {workouts.length === 0 && (
            <div className="flex h-[58px] w-full flex-none items-center justify-center rounded-full bg-raised text-[13.5px] font-semibold text-muted">
              No sessions yet — tap +
            </div>
          )}

          {workouts.map((w) => {
            const on = selectedIds.includes(w.id);
            return (
              <button
                key={w.id}
                role="option"
                aria-selected={on}
                onClick={() => onToggle(w.id)}
                className={`flex h-[58px] w-full flex-none snap-center flex-col items-center justify-center rounded-full transition-all duration-[320ms] ease-smooth ${
                  on
                    ? "bg-accent text-on-accent shadow-lift-strong"
                    : "scale-[.97] bg-raised text-muted"
                }`}
              >
                <span className="flex max-w-full items-center gap-1.5 truncate px-5 text-[17px] font-black tracking-tight">
                  {on && <span aria-hidden="true">✓</span>}
                  {w.name}
                </span>
                <span className="text-[11px] font-semibold opacity-75">
                  {on ? `${w.items.length} moves · tap to remove` : "tap to add"}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setCreating((v) => !v)}
          aria-label={creating ? "Cancel" : "Add a session"}
          aria-expanded={creating}
          className={`press flex w-[58px] flex-none items-center justify-center rounded-full text-[24px] leading-none transition ${
            creating ? "bg-accent text-on-accent" : "bg-raised text-muted"
          }`}
        >
          {creating ? "×" : "+"}
        </button>
      </div>

      {/* how many sessions exist, and where you are among them */}
      {workouts.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {workouts.length <= 7 ? (
            workouts.map((w, i) => (
              <button
                key={w.id}
                onClick={() => {
                  setLiveIndex(i);
                  scrollToIndex(i, true);
                }}
                aria-label={`Go to ${w.name}`}
                className={`h-1.5 rounded-full transition-all duration-[320ms] ease-smooth ${
                  i === liveIndex
                    ? "w-5 bg-accent"
                    : selectedIds.includes(w.id)
                      ? "w-1.5 bg-accent/50"
                      : "w-1.5 bg-line"
                }`}
              />
            ))
          ) : (
            <span className="text-[11px] font-semibold tabular-nums text-muted">
              {liveIndex + 1} / {workouts.length}
            </span>
          )}
        </div>
      )}

      {creating && (
        <div className="mt-2 rounded-card bg-raised p-3">
          <div className="text-[12px] font-semibold text-muted">Add a session</div>

          {unusedPresets.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {unusedPresets.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    onCreate(p);
                    setCreating(false);
                  }}
                  className="press rounded-full bg-surface px-3 py-1.5 text-[12.5px] font-semibold"
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
              className="min-w-0 flex-1 rounded-field bg-surface px-3 py-2 text-[14px] outline-none placeholder:text-muted/70"
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
