/**
 * Cardio exercises inside a gym session.
 *
 * A treadmill bout is a *duration at a speed and a gradient*. Logging it as
 * "3 sets × 10 reps × 0 kg" records nothing you'd ever want to read back, and
 * the progression it feeds — heaviest weight ever lifted — is meaningless for a
 * machine you never load. So cardio items carry their own three numbers and
 * their own progress measure (calories, derived from all three).
 *
 * This is deliberately *not* a second copy of Sports. Sports logs a bout that
 * stands alone on a date; this logs a machine that is part of a session you
 * planned, sits in its list, and ticks off with the rest of it. The calorie
 * maths is shared with Sports rather than duplicated — see lib/activities.ts.
 */

import { kcalFromMets, treadmillMets } from "./activities";
import type { LibraryExercise, PlanItem } from "@/types";

/**
 * How a machine's cost is estimated.
 *
 * "treadmill" gets speed and gradient and uses the ACSM equations, because on a
 * treadmill those two numbers *are* the workout — a 10% gradient at 5 km/h is
 * close to double the cost of the same walk on the flat, and a flat MET value
 * would miss all of it. "machine" gets a single intensity-free MET, because
 * nobody's bike console agrees with anyone else's about what a "level" is.
 */
export type CardioMode = "treadmill" | "machine";

interface CardioMeta {
  mode: CardioMode;
  /** Used by "machine" mode. 2011 Compendium, moderate effort. */
  mets: number;
  defaultMinutes: number;
  defaultSpeedKmh: number;
  defaultInclinePct: number;
}

const TREADMILL: CardioMeta = {
  mode: "treadmill",
  mets: 6.0,
  defaultMinutes: 20,
  defaultSpeedKmh: 5.5,
  defaultInclinePct: 10,
};

const machine = (mets: number, defaultMinutes = 20): CardioMeta => ({
  mode: "machine",
  mets,
  defaultMinutes,
  defaultSpeedKmh: 0,
  defaultInclinePct: 0,
});

/*
 * Keyed on the library ids the build script emits for the source's own 14
 * cardio entries, plus the one seeded treadmill move that lives in mobility
 * because it belongs to a knee protocol. Anything cardio-grouped that isn't
 * listed falls back to a middling machine MET rather than being refused.
 */
const CARDIO: Record<string, CardioMeta> = {
  "fed-Walking_Treadmill": { ...TREADMILL, mets: 4.3, defaultSpeedKmh: 5.5 },
  "fed-Jogging_Treadmill": { ...TREADMILL, mets: 7.0, defaultSpeedKmh: 8, defaultInclinePct: 1, defaultMinutes: 20 },
  "fed-Running_Treadmill": { ...TREADMILL, mets: 9.8, defaultSpeedKmh: 11, defaultInclinePct: 1, defaultMinutes: 20 },
  "fed-Trail_Running_Walking": { ...TREADMILL, mets: 8.0, defaultSpeedKmh: 8, defaultInclinePct: 3, defaultMinutes: 30 },
  "seed-backward-treadmill-walk": { ...TREADMILL, mets: 4.0, defaultSpeedKmh: 3, defaultInclinePct: 0, defaultMinutes: 10 },
  "fed-Bicycling": machine(7.5, 40),
  "fed-Bicycling_Stationary": machine(7.0, 30),
  "fed-Recumbent_Bike": machine(6.0, 30),
  "fed-Elliptical_Trainer": machine(5.0, 20),
  "fed-Rowing_Stationary": machine(7.0, 20),
  "fed-Stairmaster": machine(9.0, 20),
  "fed-Step_Mill": machine(9.0, 20),
  "fed-Rope_Jumping": machine(11.8, 10),
  "fed-Skating": machine(7.0, 30),
  "fed-Prowler_Sprint": machine(8.0, 10),
};

const FALLBACK = machine(6.0);

/** True when this exercise should be logged in minutes rather than in sets. */
export function isCardio(ex: LibraryExercise | undefined): boolean {
  if (!ex) return false;
  return ex.group === "cardio" || ex.id in CARDIO;
}

export function cardioMeta(ex: LibraryExercise | undefined): CardioMeta {
  return (ex && CARDIO[ex.id]) ?? FALLBACK;
}

/** The three numbers a cardio item is logged with, with sane fallbacks. */
export interface CardioValues {
  minutes: number;
  speedKmh: number;
  inclinePct: number;
}

export function cardioDefaults(ex: LibraryExercise | undefined): CardioValues {
  const meta = cardioMeta(ex);
  return {
    minutes: meta.defaultMinutes,
    speedKmh: meta.defaultSpeedKmh,
    inclinePct: meta.defaultInclinePct,
  };
}

/** Read an item's cardio prescription, filling anything absent from defaults. */
export function cardioFromItem(
  item: Pick<PlanItem, "minutes" | "speedKmh" | "inclinePct">,
  ex: LibraryExercise | undefined
): CardioValues {
  const d = cardioDefaults(ex);
  return {
    minutes: item.minutes ?? d.minutes,
    speedKmh: item.speedKmh ?? d.speedKmh,
    inclinePct: item.inclinePct ?? d.inclinePct,
  };
}

/**
 * Estimated kcal for one cardio bout. 0 without a bodyweight — every model here
 * scales with mass, so guessing one would just be inventing a number.
 */
export function cardioKcal(
  v: CardioValues,
  ex: LibraryExercise | undefined,
  weightKg: number | null
): number {
  if (!weightKg || weightKg <= 0 || v.minutes <= 0) return 0;
  const meta = cardioMeta(ex);
  const mets =
    meta.mode === "treadmill" && v.speedKmh > 0
      ? treadmillMets(v.speedKmh, v.inclinePct)
      : meta.mets;
  return kcalFromMets(mets, v.minutes, weightKg);
}

/** "20 min · 5.5 km/h · 10%" — one line, only the parts that apply. */
export function cardioSummary(v: CardioValues, ex: LibraryExercise | undefined): string {
  const parts = [`${v.minutes} min`];
  if (cardioMeta(ex).mode === "treadmill" && v.speedKmh > 0) {
    parts.push(`${formatNum(v.speedKmh)} km/h`);
    if (v.inclinePct > 0) parts.push(`${formatNum(v.inclinePct)}% incline`);
  }
  return parts.join(" · ");
}

/** 5 not 5.0, but 5.5 keeps its half. Matches formatKg's behaviour. */
export function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
