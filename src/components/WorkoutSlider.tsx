"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WORKOUT_PRESETS } from "@/lib/workouts";
import type { Workout } from "@/types";

interface Option {
  id: string | null;
  name: string;
  count: number | null;
}

/**
 * A single button you slide through your sessions, one page at a time, plus a
 * "+" beside it to add another.
 *
 * Built on CSS scroll-snap rather than a drag handler: the browser gives real
 * touch momentum, rubber-banding and snapping for free, and it runs off the
 * main thread, so it stays smooth over the glass cards. The selection commits
 * once the scroll settles rather than on every frame — otherwise a single swipe
 * would fire a Firestore write per pixel of travel.
 *
 * Whatever you land on is written against the *date*, so switching this
 * Saturday to Push leaves every other Saturday on its usual session, and the
 * session itself keeps its own exercises and weights for next time.
 */
export default function WorkoutSlider({
  workouts,
  activeId,
  isOverride,
  onPick,
  onCreate,
  onResetToUsual,
}: {
  workouts: Workout[];
  activeId: string | null;
  /** True when this date has been explicitly set, rather than inherited. */
  isOverride: boolean;
  onPick: (id: string | null) => void;
  onCreate: (name: string) => void;
  onResetToUsual: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const raf = useRef<number | undefined>(undefined);
  /*
   * Which slide is under the centre line *right now*, as opposed to which one
   * has been committed. Styling from the committed value meant the highlight
   * waited on the settle debounce and then popped — the swipe looked broken
   * even though the easing was fine. This follows the finger instead.
   */
  const [liveIndex, setLiveIndex] = useState(0);
  // Suppresses the settle handler while we are the ones scrolling, otherwise
  // syncing the track's position back would immediately re-fire onPick.
  const programmatic = useRef(false);
  // True from the first scroll event until the settle fires. The commit can
  // land while momentum is still running, and realigning then would fight the
  // browser's in-flight snap — visibly, as a stutter near the end of a flick.
  const interacting = useRef(false);
  const settle = useRef<number | undefined>(undefined);

  const options: Option[] = useMemo(
    () => [
      { id: null, name: "Rest", count: null },
      ...workouts.map((w) => ({ id: w.id, name: w.name, count: w.items.length })),
    ],
    [workouts]
  );

  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.id === activeId)
  );

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
    // Already there (the usual case after a swipe): don't re-scroll, or the
    // browser's own snap animation gets cut off part-way and jerks.
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

  // Realign whenever the selection changes from anywhere else — switching days,
  // a remote update, or tapping a dot.
  useEffect(() => {
    setLiveIndex(activeIndex);
    // Never yank the track while a finger-driven scroll is still resolving;
    // it is already heading to the right place on its own.
    if (interacting.current) return;
    // Smooth, because this also fires for taps on a dot, where an instant jump
    // is exactly the abruptness we are removing.
    scrollToIndex(activeIndex, true);
  }, [activeIndex, scrollToIndex]);

  const onScroll = () => {
    // Repaint the highlight on every frame the browser can give us, throttled
    // to rAF so a fast flick can't queue more work than it can render.
    if (raf.current === undefined) {
      raf.current = requestAnimationFrame(() => {
        raf.current = undefined;
        setLiveIndex(nearestIndex());
      });
    }

    if (programmatic.current) return;
    interacting.current = true;

    // The write is still debounced — the visuals no longer wait on it, so this
    // delay is invisible, and it keeps one swipe from becoming many writes.
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      interacting.current = false;
      const picked = options[nearestIndex()];
      if (picked && picked.id !== activeId) onPick(picked.id);
    }, 130);
  };

  useEffect(
    () => () => {
      if (raf.current !== undefined) cancelAnimationFrame(raf.current);
      window.clearTimeout(settle.current);
    },
    []
  );

  const step = (delta: number) => {
    const next = options[activeIndex + delta];
    if (next) onPick(next.id);
  };

  const unusedPresets = WORKOUT_PRESETS.filter(
    (p) => !workouts.some((w) => w.name.toLowerCase() === p.toLowerCase())
  );

  const isRest = options[liveIndex]?.id === null;
  // Dots stop being readable past a handful; fall back to a counter.
  const useDots = options.length <= 7;

  return (
    <div className="mt-3">
      <div className="mb-1.5 flex items-center justify-between px-0.5">
        <span className="text-[11px] font-bold uppercase tracking-[.1em] text-muted">
          Today&apos;s session
        </span>
        {isOverride && (
          <button onClick={onResetToUsual} className="text-[11px] font-semibold text-accent-text">
            Reset to usual
          </button>
        )}
      </div>

      <div className="flex items-stretch gap-2">
        {/*
          One page per slide, so exactly one session is ever readable. Arrow keys
          work here because there are no on-screen arrows to tab to.
        */}
        <div
          ref={trackRef}
          onScroll={onScroll}
          role="listbox"
          tabIndex={0}
          aria-label="Session for this day"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              step(1);
            }
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              step(-1);
            }
          }}
          className="no-scrollbar flex flex-1 snap-x snap-mandatory gap-3 overflow-x-auto rounded-full outline-none"
        >
          {options.map((o, i) => {
            // Live position, so the fill crossfades as the slide crosses the
            // centre line rather than snapping once the write lands.
            const on = i === liveIndex;
            const rest = o.id === null;
            return (
              <button
                key={o.id ?? "__rest"}
                role="option"
                aria-selected={on}
                onClick={() => onPick(o.id)}
                className={`flex h-[58px] w-full flex-none snap-center flex-col items-center justify-center rounded-full transition-all duration-[320ms] ease-smooth ${
                  on
                    ? rest
                      ? "bg-done text-on-done shadow-lift-strong"
                      : "bg-accent text-on-accent shadow-lift-strong"
                    : "scale-[.97] bg-raised text-muted"
                }`}
              >
                <span className="max-w-full truncate px-5 text-[17px] font-black tracking-tight">
                  {o.name}
                </span>
                {o.count !== null && (
                  <span className="text-[11px] font-semibold opacity-75">
                    {o.count} {o.count === 1 ? "move" : "moves"}
                  </span>
                )}
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

      {/* how many sessions there are, and which one you're on */}
      <div className="mt-2 flex items-center justify-center gap-1.5">
        {useDots ? (
          options.map((o, i) => (
            <button
              key={o.id ?? "__rest"}
              onClick={() => onPick(o.id)}
              aria-label={`Go to ${o.name}`}
              className={`h-1.5 rounded-full transition-all duration-[320ms] ease-smooth ${
                i === liveIndex
                  ? isRest
                    ? "w-5 bg-done"
                    : "w-5 bg-accent"
                  : "w-1.5 bg-line"
              }`}
            />
          ))
        ) : (
          <span className="text-[11px] font-semibold tabular-nums text-muted">
            {liveIndex + 1} / {options.length}
          </span>
        )}
      </div>

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
