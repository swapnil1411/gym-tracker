"use client";

/**
 * What a single day cost, in kcal, from everything the app knows about it:
 * the lifting, any cardio machines inside the session, and any bout logged on
 * Sports for the same date.
 *
 * Pure function plus a thin hook, rather than one hook, because DailyTracker
 * already holds all three data sources open and calling a hook there would open
 * a second set of snapshot listeners on the documents it is already reading.
 * BodyPage holds none of them, so it gets the hook.
 *
 * Reading completions is enough to tell cardio from lifting: cardio entries
 * carry a snapshotted `kcal`, strength entries never do. That keeps this
 * independent of whether the caller has the exercise library to hand — the
 * library is only ever needed to put a name on the row.
 */

import { useMemo } from "react";
import { ACTIVITY_BY_ID, liftingKcal, stepsKcal } from "./activities";
import { useDayActivities, type ActivityEntry } from "./activity-store";
import { useDayCompletions } from "./store";
import { useBody } from "./body";
import { indexById, useLibrary } from "./library";
import type { CompletionEntry, LibraryExercise } from "@/types";

export interface BurnRow {
  key: string;
  label: string;
  kcal: number;
}

export interface DayBurn {
  rows: BurnRow[];
  total: number;
  /** Sets ticked off that belong to strength work — cardio doesn't count sets. */
  setsDone: number;
  /** The same ≈3.5 min/set estimate DailyTracker shows, so the two agree. */
  liftMinutes: number;
}

export function computeBurn(opts: {
  entries: Record<string, CompletionEntry>;
  activities: ActivityEntry[];
  byId: Map<string, LibraryExercise>;
  weightKg: number | null;
  /** Everyday steps logged for the date. */
  steps?: number;
  /** Session names, for the lifting row's label. */
  gymLabel?: string;
}): DayBurn {
  const { entries, activities, byId, weightKg, steps, gymLabel } = opts;
  const rows: BurnRow[] = [];

  const done = Object.entries(entries).filter(([, e]) => e.done);

  // Lifting comes from sets actually ticked off, not from the plan — a session
  // you skipped is not energy you spent.
  const setsDone = done
    .filter(([, e]) => e.kcal === undefined)
    .reduce((sum, [, e]) => sum + (e.setsDone || 0), 0);
  const liftMinutes = Math.max(15, Math.round((setsDone * 3.5) / 5) * 5);
  const lift = liftingKcal(setsDone, weightKg);
  if (lift > 0) {
    rows.push({
      key: "lift",
      label: `${liftMinutes} min ${gymLabel || "gym"}`,
      kcal: lift,
    });
  }

  for (const [exId, e] of done) {
    // No bodyweight means no honest estimate, so cardio can log a 0 — don't
    // show a row that says a 20-minute treadmill walk cost nothing.
    if (!e.kcal) continue;
    const name = byId.get(exId)?.name ?? "Cardio";
    rows.push({
      key: exId,
      label: `${e.minutesDone ?? 0} min ${name.toLowerCase()}`,
      kcal: e.kcal,
    });
  }

  for (const a of activities) {
    rows.push({
      key: a.id,
      label: `${a.minutes} min ${ACTIVITY_BY_ID.get(a.type)?.label.toLowerCase() ?? a.type}`,
      kcal: a.kcal,
    });
  }

  // Everyday steps, same walking model as the distance activities. Recomputed
  // on read rather than snapshotted: unlike a logged bout, the step count is
  // still being edited through the day, so there is no "save moment" to freeze.
  const stepBurn = stepsKcal(steps ?? 0, weightKg);
  if (stepBurn > 0) {
    rows.push({
      key: "steps",
      label: `${(steps ?? 0).toLocaleString()} steps`,
      kcal: stepBurn,
    });
  }

  return { rows, total: rows.reduce((s, r) => s + r.kcal, 0), setsDone, liftMinutes };
}

/** The same figure, for screens that aren't already reading the day. */
export function useDayBurn(key: string): DayBurn {
  const { entries } = useDayCompletions(key);
  const { entries: activities, steps } = useDayActivities(key);
  const { body } = useBody();
  const { library } = useLibrary();
  const byId = useMemo(() => indexById(library), [library]);

  return useMemo(
    () => computeBurn({ entries, activities, byId, weightKg: body.weightKg, steps }),
    [entries, activities, byId, body.weightKg, steps]
  );
}
