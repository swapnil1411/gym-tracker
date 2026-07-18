export type MuscleGroup =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "core"
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

/** An exercise as placed on a given weekday's plan. */
export interface PlanItem {
  exerciseId: string;
  sets: number;
  reps: number;
  /** Working weight in kg. 0 means bodyweight / not tracked. */
  weightKg: number;
  order: number;
}

/** plan/{dayOfWeek} — dayOfWeek 0=Mon .. 6=Sun */
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
