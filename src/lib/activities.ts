/**
 * Calorie estimation for sports, running and the non-lifting parts of a session.
 *
 * Two formulas, because one doesn't honestly cover both cases:
 *
 *  1. Running and walking are dominated by *distance × bodyweight*, not by how
 *     fast you covered it. Running costs ≈1.03 kcal per kg per km across the
 *     whole normal pace range, so logging "5 km" gives a good number even when
 *     you have no idea what your pace was. Walking is the exception — it is
 *     both pace- and gradient-sensitive, so it uses the ACSM equation, which
 *     is what makes incline work score properly instead of reading as a stroll.
 *
 *  2. Everything else uses the Compendium of Physical Activities MET formula.
 *
 * All of it is an estimate: MET-derived numbers land within roughly ±20–25% of
 * indirect calorimetry. That is why nothing here is ever shown with a decimal
 * and why the UI says "approx" — a figure like 342.7 kcal would be claiming a
 * precision the method does not have.
 */

export type Intensity = "easy" | "moderate" | "hard";

/**
 * "distance" asks for km and uses the per-km model.
 * "incline" asks for speed and gradient and uses ACSM.
 * "simple" is minutes × MET.
 */
export type ActivityKind = "distance" | "incline" | "simple";

export interface ActivityDef {
  id: string;
  label: string;
  emoji: string;
  kind: ActivityKind;
  /** METs by intensity. Used directly by "simple", as a fallback otherwise. */
  mets: Record<Intensity, number>;
  defaultMinutes: number;
}

/*
 * MET values are from the 2011 Compendium of Physical Activities (Ainsworth et
 * al.). Kept to a scannable set on purpose — a list of two hundred sports is a
 * search problem, and this is a bottom sheet you use mid-session.
 */
export const ACTIVITIES: ActivityDef[] = [
  { id: "run", label: "Running", emoji: "🏃", kind: "distance", mets: { easy: 8.3, moderate: 9.8, hard: 11.8 }, defaultMinutes: 30 },
  { id: "walk", label: "Walking", emoji: "🚶", kind: "distance", mets: { easy: 3.0, moderate: 3.5, hard: 5.0 }, defaultMinutes: 30 },
  { id: "incline-walk", label: "Incline walk", emoji: "⛰️", kind: "incline", mets: { easy: 5.3, moderate: 7.0, hard: 9.0 }, defaultMinutes: 20 },
  { id: "cycle", label: "Cycling", emoji: "🚲", kind: "distance", mets: { easy: 5.8, moderate: 8.0, hard: 10.0 }, defaultMinutes: 40 },
  { id: "pickleball", label: "Pickleball", emoji: "🥒", kind: "simple", mets: { easy: 4.5, moderate: 5.8, hard: 6.5 }, defaultMinutes: 60 },
  { id: "tennis", label: "Tennis", emoji: "🎾", kind: "simple", mets: { easy: 5.0, moderate: 7.3, hard: 8.0 }, defaultMinutes: 60 },
  { id: "badminton", label: "Badminton", emoji: "🏸", kind: "simple", mets: { easy: 4.5, moderate: 5.5, hard: 7.0 }, defaultMinutes: 45 },
  { id: "squash", label: "Squash", emoji: "🎯", kind: "simple", mets: { easy: 7.3, moderate: 9.0, hard: 12.0 }, defaultMinutes: 45 },
  { id: "football", label: "Football", emoji: "⚽", kind: "simple", mets: { easy: 7.0, moderate: 8.0, hard: 10.0 }, defaultMinutes: 60 },
  { id: "basketball", label: "Basketball", emoji: "🏀", kind: "simple", mets: { easy: 4.5, moderate: 6.5, hard: 8.0 }, defaultMinutes: 45 },
  { id: "cricket", label: "Cricket", emoji: "🏏", kind: "simple", mets: { easy: 4.0, moderate: 4.8, hard: 6.0 }, defaultMinutes: 90 },
  { id: "swim", label: "Swimming", emoji: "🏊", kind: "simple", mets: { easy: 5.8, moderate: 8.3, hard: 9.8 }, defaultMinutes: 30 },
  { id: "hiit", label: "HIIT / circuits", emoji: "🔥", kind: "simple", mets: { easy: 6.0, moderate: 8.0, hard: 10.0 }, defaultMinutes: 20 },
  { id: "rope", label: "Skipping", emoji: "🪢", kind: "simple", mets: { easy: 8.8, moderate: 11.8, hard: 12.3 }, defaultMinutes: 15 },
  { id: "yoga", label: "Yoga", emoji: "🧘", kind: "simple", mets: { easy: 2.5, moderate: 3.0, hard: 4.0 }, defaultMinutes: 30 },
  { id: "stretch", label: "Stretching", emoji: "🤸", kind: "simple", mets: { easy: 2.3, moderate: 2.5, hard: 3.0 }, defaultMinutes: 15 },
  { id: "lift", label: "Weights", emoji: "🏋️", kind: "simple", mets: { easy: 3.5, moderate: 5.0, hard: 6.0 }, defaultMinutes: 45 },
  { id: "other", label: "Other", emoji: "✨", kind: "simple", mets: { easy: 3.0, moderate: 5.0, hard: 7.0 }, defaultMinutes: 30 },
];

export const ACTIVITY_BY_ID = new Map(ACTIVITIES.map((a) => [a.id, a]));

export const INTENSITY_LABEL: Record<Intensity, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
};

/** Gross kcal per kg per km. Running is famously flat across pace; walking isn't. */
const KCAL_PER_KG_KM = { run: 1.03, walk: 0.53, cycle: 0.28 } as const;

/** Standard MET formula: 1 MET ≈ 3.5 ml O₂/kg/min, and 1 L O₂ ≈ 5 kcal. */
export function kcalFromMets(mets: number, minutes: number, weightKg: number): number {
  return (mets * 3.5 * weightKg) / 200 * minutes;
}

/**
 * ACSM walking equation. VO₂ (ml/kg/min) = 0.1·S + 1.8·S·G + 3.5, where S is
 * metres per minute and G is the gradient as a fraction. This is the reason a
 * 20-minute incline walk doesn't get costed like a stroll to the shops: at
 * 5 km/h a 10% gradient roughly doubles the metabolic cost.
 */
export function inclineWalkMets(speedKmh: number, gradePct: number): number {
  const mPerMin = (speedKmh * 1000) / 60;
  const vo2 = 0.1 * mPerMin + 1.8 * mPerMin * (gradePct / 100) + 3.5;
  return vo2 / 3.5;
}

export interface ActivityInput {
  type: string;
  minutes: number;
  intensity: Intensity;
  /** Distance activities. */
  km?: number;
  /** Incline activities. */
  speedKmh?: number;
  gradePct?: number;
}

/**
 * Estimated kcal for one bout. Returns 0 without a bodyweight — every model
 * here scales with mass, so guessing one would just be inventing a number.
 */
export function estimateKcal(input: ActivityInput, weightKg: number | null): number {
  if (!weightKg || weightKg <= 0 || input.minutes <= 0) return 0;
  const def = ACTIVITY_BY_ID.get(input.type);
  if (!def) return 0;

  if (def.kind === "incline") {
    const mets = inclineWalkMets(input.speedKmh ?? 5, input.gradePct ?? 10);
    return kcalFromMets(mets, input.minutes, weightKg);
  }

  // Distance model, but only when a distance was actually given. Otherwise the
  // MET table is the better guess — it at least knows how long you were out.
  if (def.kind === "distance" && input.km && input.km > 0) {
    const perKgKm = KCAL_PER_KG_KM[def.id as keyof typeof KCAL_PER_KG_KM];
    if (perKgKm) return perKgKm * weightKg * input.km;
  }

  return kcalFromMets(def.mets[input.intensity], input.minutes, weightKg);
}

/** Pace as mm:ss per km, or null when the numbers don't support one. */
export function paceLabel(minutes: number, km: number | undefined): string | null {
  if (!km || km <= 0 || minutes <= 0) return null;
  const perKm = minutes / km;
  const m = Math.floor(perKm);
  const s = Math.round((perKm - m) * 60);
  // 5:60/km is not a thing.
  return s === 60 ? `${m + 1}:00 /km` : `${m}:${String(s).padStart(2, "0")} /km`;
}

/**
 * Lifting burn for a session, derived rather than logged.
 *
 * Duration reuses DailyTracker's own estimate (≈3.5 min per set including
 * rest), so the calorie figure and the "~45 min" figure on the same screen can
 * never disagree. Resistance training sits at 3.5–6.0 METs depending on how
 * much you rest between sets; 5.0 is the compendium's "vigorous" value and the
 * right default for anyone actually working to a set count.
 */
export function liftingKcal(totalSets: number, weightKg: number | null): number {
  if (!weightKg || totalSets <= 0) return 0;
  const minutes = Math.max(15, Math.round((totalSets * 3.5) / 5) * 5);
  return kcalFromMets(5.0, minutes, weightKg);
}

/** Rounded the way an estimate deserves to be: nearest 5 under 100, else 10. */
export function roundKcal(kcal: number): number {
  if (kcal <= 0) return 0;
  return kcal < 100 ? Math.round(kcal / 5) * 5 : Math.round(kcal / 10) * 10;
}
