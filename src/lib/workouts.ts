"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  deleteDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "./firebase";
import { useAuth } from "./auth-context";
import type { PlanDay, PlanItem, ScheduledDay, WeeklyDefaults, Workout } from "@/types";
import { dateKey, parseDateKey, toMondayIndex } from "./groups";

/**
 * Common splits offered when someone has nothing set up yet. These are only
 * *names* — the exercises are always the user's own, because a seeded exercise
 * list would be a guess about their gym, their equipment and their knees.
 */
export const WORKOUT_PRESETS = [
  "Push",
  "Pull",
  "Legs",
  "Chest + Triceps",
  "Back + Biceps",
  "Shoulders + Legs",
  "Legs + Abs",
  "Upper Body",
  "Lower Body",
  "Core & Mobility",
] as const;

/** Doc ids are slugs so the collection stays readable in the Firebase console. */
export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "workout"
  );
}

function uniqueId(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/* ------------------------------- workouts -------------------------------- */

export function useWorkouts() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Record<string, Workout>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWorkouts({});
      setLoading(false);
      return;
    }
    const ref = collection(getDb(), "users", user.uid, "workouts");
    const unsub: Unsubscribe = onSnapshot(ref, (snap) => {
      const next: Record<string, Workout> = {};
      snap.forEach((d) => {
        const data = d.data() as Workout;
        next[d.id] = {
          ...data,
          id: d.id,
          items: (data.items ?? []).map((it) => ({ ...it, weightKg: it.weightKg ?? 0 })),
        };
      });
      setWorkouts(next);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  /** Stable display order: explicit `order`, then name as a tiebreak. */
  const ordered = useMemo(
    () =>
      Object.values(workouts).sort(
        (a, b) => a.order - b.order || a.name.localeCompare(b.name)
      ),
    [workouts]
  );

  const save = useCallback(
    async (w: Workout) => {
      if (!user) return;
      // Renumber on every write so `order` always matches array position.
      const items = w.items.map((it, i) => ({ ...it, order: i }));
      await setDoc(doc(getDb(), "users", user.uid, "workouts", w.id), { ...w, items });
    },
    [user]
  );

  const create = useCallback(
    async (name: string): Promise<string | null> => {
      if (!user) return null;
      const id = uniqueId(slugify(name), new Set(Object.keys(workouts)));
      await save({
        id,
        name: name.trim() || "Workout",
        items: [],
        order: Object.keys(workouts).length,
        createdAt: new Date().toISOString(),
      });
      return id;
    },
    [user, workouts, save]
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      const w = workouts[id];
      if (!w || !name.trim()) return;
      await save({ ...w, name: name.trim() });
    },
    [workouts, save]
  );

  const remove = useCallback(
    async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(getDb(), "users", user.uid, "workouts", id));
    },
    [user]
  );

  const addExercise = useCallback(
    async (id: string, exerciseId: string, sets = 3, reps = 10, weightKg = 0) => {
      const w = workouts[id];
      if (!w || w.items.some((i) => i.exerciseId === exerciseId)) return;
      const item: PlanItem = { exerciseId, sets, reps, weightKg, order: w.items.length };
      await save({ ...w, items: [...w.items, item] });
    },
    [workouts, save]
  );

  const removeExercise = useCallback(
    async (id: string, exerciseId: string) => {
      const w = workouts[id];
      if (!w) return;
      await save({ ...w, items: w.items.filter((i) => i.exerciseId !== exerciseId) });
    },
    [workouts, save]
  );

  const updateItem = useCallback(
    async (id: string, exerciseId: string, patch: Partial<PlanItem>) => {
      const w = workouts[id];
      if (!w) return;
      await save({
        ...w,
        items: w.items.map((i) => (i.exerciseId === exerciseId ? { ...i, ...patch } : i)),
      });
    },
    [workouts, save]
  );

  const moveItem = useCallback(
    async (id: string, from: number, to: number) => {
      const w = workouts[id];
      if (!w || to < 0 || to >= w.items.length) return;
      const items = [...w.items];
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);
      await save({ ...w, items });
    },
    [workouts, save]
  );

  return {
    workouts,
    ordered,
    loading,
    create,
    rename,
    remove,
    addExercise,
    removeExercise,
    updateItem,
    moveItem,
  };
}

/* ------------------------------- schedule -------------------------------- */

/**
 * Resolves "what am I training on date X".
 *
 * Two layers: an explicit per-date assignment wins, otherwise the weekday
 * default applies. That keeps a regular weekly rhythm working without locking
 * you into it — switching this Saturday to Push leaves every other Saturday
 * alone, because the override is written against the date, not the weekday.
 */
export function useSchedule() {
  const { user } = useAuth();
  const [byDate, setByDate] = useState<Record<string, ScheduledDay>>({});
  const [defaults, setDefaults] = useState<WeeklyDefaults>({ byWeekday: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setByDate({});
      setDefaults({ byWeekday: {} });
      setLoading(false);
      return;
    }
    const unsubDates = onSnapshot(
      collection(getDb(), "users", user.uid, "schedule"),
      (snap) => {
        const next: Record<string, ScheduledDay> = {};
        snap.forEach((d) => (next[d.id] = d.data() as ScheduledDay));
        setByDate(next);
      }
    );
    const unsubDefaults = onSnapshot(
      doc(getDb(), "users", user.uid, "settings", "schedule"),
      (snap) => {
        setDefaults((snap.data() as WeeklyDefaults | undefined) ?? { byWeekday: {} });
        setLoading(false);
      }
    );
    return () => {
      unsubDates();
      unsubDefaults();
    };
  }, [user]);

  const resolve = useCallback(
    (key: string): { workoutId: string | null; isOverride: boolean } => {
      const explicit = byDate[key];
      if (explicit) return { workoutId: explicit.workoutId, isOverride: true };
      const dow = toMondayIndex(parseDateKey(key).getDay());
      return { workoutId: defaults.byWeekday?.[dow] ?? null, isOverride: false };
    },
    [byDate, defaults]
  );

  /** Point a single date at a workout. null = rest day. */
  const assign = useCallback(
    async (key: string, workoutId: string | null) => {
      if (!user) return;
      await setDoc(doc(getDb(), "users", user.uid, "schedule", key), { workoutId });
    },
    [user]
  );

  /** Drop the override so the date falls back to its weekday default. */
  const clearAssignment = useCallback(
    async (key: string) => {
      if (!user) return;
      await deleteDoc(doc(getDb(), "users", user.uid, "schedule", key));
    },
    [user]
  );

  const setWeekdayDefault = useCallback(
    async (dow: number, workoutId: string | null) => {
      if (!user) return;
      await setDoc(
        doc(getDb(), "users", user.uid, "settings", "schedule"),
        { byWeekday: { [dow]: workoutId } },
        { merge: true }
      );
    },
    [user]
  );

  return {
    byDate,
    defaults,
    loading,
    resolve,
    assign,
    clearAssignment,
    setWeekdayDefault,
  };
}

/* ------------------------------ migration -------------------------------- */

/**
 * One-off import of the old plan/{weekday} documents.
 *
 * Deliberately additive: the original plan docs are read and left in place, so
 * this can be re-run or rolled back without losing anything. Each distinct
 * focus label becomes a workout, and the weekday it came from becomes that
 * workout's default slot — which reproduces the previous behaviour exactly on
 * the first load after upgrading.
 */
export function useLegacyPlanMigration(enabled: boolean) {
  const { user } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (!user || !enabled || ran.current) return;
    ran.current = true;

    (async () => {
      const db = getDb();
      const settingsRef = doc(db, "users", user.uid, "settings", "schedule");

      // Bail if a previous run already completed, or if workouts already exist.
      const [existingWorkouts, planSnap] = await Promise.all([
        getDocs(collection(db, "users", user.uid, "workouts")),
        getDocs(collection(db, "users", user.uid, "plan")),
      ]);
      if (!existingWorkouts.empty || planSnap.empty) return;

      const byWeekday: Record<number, string | null> = {};
      const idByName = new Map<string, string>();
      const taken = new Set<string>();

      const days = planSnap.docs
        .map((d) => ({ dow: Number(d.id), data: d.data() as PlanDay }))
        .sort((a, b) => a.dow - b.dow);

      for (const { dow, data } of days) {
        const label = (data.focusLabel ?? "").trim();
        const items = data.items ?? [];

        // A rest day, or an empty unnamed day, becomes an empty default slot
        // rather than a workout nobody asked for.
        if (data.isRestDay || (!label && items.length === 0)) {
          byWeekday[dow] = null;
          continue;
        }

        const name = label || "Workout";
        const key = name.toLowerCase();

        // Two weekdays sharing a label are the same workout, so they share one
        // document — which is the entire point of the new model.
        let id = idByName.get(key);
        if (!id) {
          id = uniqueId(slugify(name), taken);
          taken.add(id);
          idByName.set(key, id);
          await setDoc(doc(db, "users", user.uid, "workouts", id), {
            id,
            name,
            items: items.map((it, i) => ({ ...it, weightKg: it.weightKg ?? 0, order: i })),
            order: idByName.size - 1,
            createdAt: new Date().toISOString(),
          });
        }
        byWeekday[dow] = id;
      }

      await setDoc(settingsRef, { byWeekday, migratedAt: new Date().toISOString() }, { merge: true });
    })().catch((e) => {
      // Never block the app on migration — worst case the user sets up manually.
      console.error("[migration] legacy plan import failed", e);
      ran.current = false;
    });
  }, [user, enabled]);
}

export { dateKey };
