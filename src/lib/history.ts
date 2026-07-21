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
  /**
   * Most recent logged date *including* today. lastOn deliberately excludes
   * today; this one doesn't, because deciding whether a log should advance the
   * plan needs to know if anything newer already exists.
   */
  latestOn: string | null;
  /**
   * The cardio equivalent of lastKg — what you last did on the machine. Kept on
   * the same record rather than in a parallel map: it is the same question
   * ("what did I do last time?") asked of a different kind of exercise, and one
   * pass over the completions answers both.
   */
  lastMinutes: number;
  lastSpeedKmh: number;
  lastInclinePct: number;
  lastKcal: number;
  /** Best single cardio bout by calories, and when. */
  bestKcal: number;
  /** How many separate days this exercise has been logged. */
  sessions: number;
  /** Every logged session, oldest first — the series behind the chart. */
  points: SessionPoint[];
}

export interface SessionPoint {
  on: string;
  kg: number;
  sets: number;
  reps: number;
}

const empty = (): ExerciseHistory => ({
  bestKg: 0,
  bestOn: null,
  lastKg: 0,
  lastReps: 0,
  lastSets: 0,
  lastOn: null,
  latestOn: null,
  lastMinutes: 0,
  lastSpeedKmh: 0,
  lastInclinePct: 0,
  lastKcal: 0,
  bestKcal: 0,
  sessions: 0,
  points: [],
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
        if ((entry.kcal ?? 0) > h.bestKcal) h.bestKcal = entry.kcal ?? 0;
        // Today's own entry isn't "history" — it's what you're doing now.
        if (key !== todayKey) {
          h.lastKg = kg;
          h.lastReps = entry.repsDone ?? 0;
          h.lastSets = entry.setsDone ?? 0;
          h.lastOn = key;
          h.lastMinutes = entry.minutesDone ?? 0;
          h.lastSpeedKmh = entry.speedKmh ?? 0;
          h.lastInclinePct = entry.inclinePct ?? 0;
          h.lastKcal = entry.kcal ?? 0;
        }
        h.latestOn = key;
        h.sessions += 1;
        h.points.push({
          on: key,
          kg,
          sets: entry.setsDone ?? 0,
          reps: entry.repsDone ?? 0,
        });
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

/**
 * Change in working weight between the last two logged sessions.
 * null when there is nothing to compare against yet.
 */
export function weightDelta(h: ExerciseHistory | undefined): number | null {
  if (!h || h.points.length < 2) return null;
  const last = h.points[h.points.length - 1];
  const prev = h.points[h.points.length - 2];
  return last.kg - prev.kg;
}

export function formatKg(kg: number): string {
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(1);
}
