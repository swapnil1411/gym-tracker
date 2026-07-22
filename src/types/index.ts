export type MuscleGroup =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "core"
  | "cardio"
  | "mobility"
  | "yoga";

export interface LibraryExercise {
  id: string;
  name: string;
  group: MuscleGroup;
  image: string | null;
  images: string[];
  equipment: string | null;
  level: string | null;
  instructions: string[];
  benefits?: string | null;
  sanskritName?: string | null;
  source: "free-exercise-db" | "yoga-api" | "seeded";
}

export interface Library {
  generatedAt: string;
  counts: Record<string, number>;
  exercises: LibraryExercise[];
}

/**
 * An exercise as placed in a workout.
 *
 * sets/reps/weightKg are the strength prescription. The three optional fields
 * below are the cardio one — a treadmill bout is a duration at a speed and a
 * gradient, and asking it for "3 × 10 at 0kg" describes nothing. They stay
 * optional rather than becoming a separate item type because everything else
 * about an item (ordering, membership, the completion it produces) is identical,
 * and a discriminated union would fork every call site for no gain.
 */
export interface PlanItem {
  exerciseId: string;
  sets: number;
  reps: number;
  /** Working weight in kg. 0 means bodyweight / not tracked. */
  weightKg: number;
  order: number;
  /** Cardio: minutes on the machine. */
  minutes?: number;
  /** Cardio: treadmill/bike speed in km/h. */
  speedKmh?: number;
  /** Cardio: treadmill gradient as a percentage. */
  inclinePct?: number;
}

/**
 * workouts/{workoutId} — a named session like "Push" or "Back + Biceps".
 *
 * The workout owns its exercises and their working weights, so the same Pull
 * session carries the same loads whenever you next do it, regardless of which
 * weekday that lands on.
 */
export interface Workout {
  id: string;
  name: string;
  items: PlanItem[];
  /** Position in the day selector. */
  order: number;
  createdAt: string;
}

/**
 * schedule/{YYYY-MM-DD} — which workouts a specific date points at.
 *
 * A list, because one day can be Pull *and* Cardio. An empty list is an
 * explicit rest day, which is distinct from "unassigned" — that is the absence
 * of the document, and falls through to the weekday default.
 */
export interface ScheduledDay {
  workoutIds: string[];
  /** @deprecated Single-session shape, read for back-compat. */
  workoutId?: string | null;
}

/**
 * settings/schedule — the fallback used when a date has no explicit entry.
 * Indexed 0=Mon .. 6=Sun.
 */
export interface WeeklyDefaults {
  byWeekday: Record<number, string[] | string | null>;
  /** Set once the one-off import from the old plan/{weekday} docs has run. */
  migratedAt?: string;
}

/** @deprecated Superseded by Workout. Retained to read pre-migration data. */
export interface PlanDay {
  dayOfWeek: number;
  focusLabel: string;
  isRestDay: boolean;
  items: PlanItem[];
}

export interface CompletionEntry {
  done: boolean;
  setsDone: number;
  /** Reps and weight as actually logged, snapshotted at completion time so
   *  later edits to the plan never rewrite past sessions. */
  repsDone?: number;
  weightKg?: number;
  /** Cardio, snapshotted the same way. */
  minutesDone?: number;
  speedKmh?: number;
  inclinePct?: number;
  /**
   * Cardio calories, frozen at completion time — the same invariant the
   * activities collection follows. Every model scales with bodyweight, so
   * recomputing on read would let updating your weight silently rewrite what
   * last month's sessions cost. Its presence is also what marks an entry as
   * cardio when reading completions without the library to hand.
   */
  kcal?: number;
  at: string;
}

/** completions/{YYYY-MM-DD} */
export interface DayCompletions {
  entries: Record<string, CompletionEntry>;
}

export interface Settings {
  weekStartsOn: number;
  units: "kg" | "lb";
}

export interface Profile {
  displayName: string;
  createdAt: string;
}
