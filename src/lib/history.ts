"use client";

import { useMemo } from "react";
import { useCompletionsRange } from "./store";
import { dateKey, parseDateKey } from "./groups";

export interface ExerciseHistory {
  /** Heaviest weight ever logged for this exercise. */
  bestKg: number;
  bestOn: string | null;
  /** Most recent logged session. */
  lastKg: number;
  lastReps: number;
  lastSets: number;
  lastOn: string | null;
  /** How many separate days this exercise has been logged. */
  sessions: number;
}

const empty = (): ExerciseHistory => ({
  bestKg: 0,
  bestOn: null,
  lastKg: 0,
  lastReps: 0,
  lastSets: 0,
  lastOn: null,
  sessions: 0,
});

/**
 * Per-exercise weight history, so the tracker can tell you what you last
 * lifted before you decide what to load today.
 *
 * Keyed on the exercise rather than the calendar. Once a workout can land on
 * any weekday, "last week" is the wrong question — you might hit Push twice in
 * one week or once in ten days. "Last time you did this" is always meaningful.
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
        h.sessions += 1;
        map.set(exId, h);
      }
    }
    return map;
  }, [days, today]);

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
