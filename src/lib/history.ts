"use client";

import { useMemo } from "react";
import { useCompletionsRange } from "./store";
import { dateKey, parseDateKey } from "./groups";
import { startOfWeek } from "./stats";

export interface ExerciseHistory {
  /** Heaviest weight ever logged for this exercise. */
  bestKg: number;
  bestOn: string | null;
  /** Most recent logged session. */
  lastKg: number;
  lastReps: number;
  lastSets: number;
  lastOn: string | null;
  /** Heaviest logged during the previous Mon–Sun week — "what you did last week". */
  lastWeekBestKg: number;
  lastWeekOn: string | null;
}

const empty = (): ExerciseHistory => ({
  bestKg: 0,
  bestOn: null,
  lastKg: 0,
  lastReps: 0,
  lastSets: 0,
  lastOn: null,
  lastWeekBestKg: 0,
  lastWeekOn: null,
});

/**
 * Per-exercise weight history, so the tracker can tell you what you lifted
 * last week before you decide what to load today.
 *
 * Reads a rolling window (default a year) from the same completions collection
 * the dashboard uses, so Firestore's offline cache usually serves it for free.
 */
export function useExerciseHistory(windowDays = 365) {
  const today = useMemo(() => new Date(), []);

  const from = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - windowDays);
    return dateKey(d);
  }, [today, windowDays]);
  const to = useMemo(() => dateKey(today), [today]);

  const { days, loading } = useCompletionsRange(from, to);

  // Previous calendar week, Mon–Sun.
  const { lastWeekStart, lastWeekEnd } = useMemo(() => {
    const thisWeekStart = startOfWeek(today);
    const start = new Date(thisWeekStart);
    start.setDate(start.getDate() - 7);
    const end = new Date(thisWeekStart);
    end.setDate(end.getDate() - 1);
    return { lastWeekStart: dateKey(start), lastWeekEnd: dateKey(end) };
  }, [today]);

  const history = useMemo(() => {
    const map = new Map<string, ExerciseHistory>();
    const todayKey = dateKey(today);

    // Ascending, so the final write for each exercise is genuinely the latest.
    for (const key of Object.keys(days).sort()) {
      for (const [exId, entry] of Object.entries(days[key])) {
        if (!entry.done) continue;
        const kg = entry.weightKg ?? 0;

        const h = map.get(exId) ?? empty();

        if (kg > h.bestKg) {
          h.bestKg = kg;
          h.bestOn = key;
        }
        // Today's own entry isn't "history" — it's what you're doing now.
        if (key !== todayKey) {
          h.lastKg = kg;
          h.lastReps = entry.repsDone ?? 0;
          h.lastSets = entry.setsDone ?? 0;
          h.lastOn = key;
        }
        if (key >= lastWeekStart && key <= lastWeekEnd && kg > h.lastWeekBestKg) {
          h.lastWeekBestKg = kg;
          h.lastWeekOn = key;
        }

        map.set(exId, h);
      }
    }
    return map;
  }, [days, today, lastWeekStart, lastWeekEnd]);

  return { history, loading };
}

/** "Mon 14 Jul" */
export function formatDayLabel(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatKg(kg: number): string {
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(1);
}
