import type { DayCompletions, LibraryExercise } from "@/types";
import { dateKey, parseDateKey, toMondayIndex } from "./groups";

type Entries = DayCompletions["entries"];
type DaysMap = Record<string, Entries>;

export function doneCountFor(entries: Entries | undefined): number {
  if (!entries) return 0;
  return Object.values(entries).filter((e) => e.done).length;
}

/** Consecutive days ending today (or yesterday) with ≥1 completed exercise. */
export function currentStreak(days: DaysMap, today = new Date()): number {
  let streak = 0;
  const cursor = new Date(today);

  // A day you haven't trained *yet* shouldn't break the streak, so if today is
  // empty we start counting from yesterday.
  if (doneCountFor(days[dateKey(cursor)]) === 0) cursor.setDate(cursor.getDate() - 1);

  while (doneCountFor(days[dateKey(cursor)]) > 0) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function longestStreak(days: DaysMap): number {
  const active = Object.keys(days)
    .filter((k) => doneCountFor(days[k]) > 0)
    .sort();
  if (!active.length) return 0;

  let best = 1;
  let run = 1;
  for (let i = 1; i < active.length; i++) {
    const prev = parseDateKey(active[i - 1]);
    const cur = parseDateKey(active[i]);
    const gapDays = Math.round((cur.getTime() - prev.getTime()) / 86_400_000);
    run = gapDays === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }
  return best;
}

/** How much of that date's plan was completed, 0..1. */
/**
 * How much of a day's planned work got done, 0..1.
 *
 * Takes a resolver rather than a plan map: which exercises a date was meant to
 * hold depends on the workout scheduled for it, which is no longer derivable
 * from the weekday alone.
 */
export function completionFraction(
  dayKey: string,
  days: DaysMap,
  totalFor: (dayKey: string) => number
): number {
  const done = doneCountFor(days[dayKey]);
  if (done === 0) return 0;
  const total = totalFor(dayKey);
  if (total === 0) return 1; // trained something unplanned — still counts as a full day
  return Math.min(1, done / total);
}

/** Monday-anchored start of the week containing `d`. */
export function startOfWeek(d: Date): Date {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  s.setDate(s.getDate() - toMondayIndex(s.getDay()));
  return s;
}

export function weekDates(d: Date): Date[] {
  const start = startOfWeek(d);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(start);
    x.setDate(start.getDate() + i);
    return x;
  });
}

export function monthGrid(month: Date): (Date | null)[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = toMondayIndex(first.getDay());

  const cells: (Date | null)[] = Array(lead).fill(null);
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), i));
  }
  return cells;
}

/**
 * Total weight moved across the given dates: sets × reps × kg, summed.
 * Bodyweight entries (weightKg 0) contribute nothing, which is the honest
 * answer for a "kg lifted" number.
 */
export function tonnage(dates: Date[], days: DaysMap): number {
  let total = 0;
  for (const d of dates) {
    const entries = days[dateKey(d)];
    if (!entries) continue;
    for (const entry of Object.values(entries)) {
      if (!entry.done) continue;
      total += (entry.setsDone || 0) * (entry.repsDone || 0) * (entry.weightKg || 0);
    }
  }
  return total;
}

/** Sets completed per muscle group across the given dates. */
export function volumeByGroup(
  dates: Date[],
  days: DaysMap,
  byId: Map<string, LibraryExercise>
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const d of dates) {
    const entries = days[dateKey(d)];
    if (!entries) continue;
    for (const [exId, entry] of Object.entries(entries)) {
      if (!entry.done) continue;
      const group = byId.get(exId)?.group;
      if (!group) continue;
      totals[group] = (totals[group] ?? 0) + (entry.setsDone || 0);
    }
  }
  return totals;
}
