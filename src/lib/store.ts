"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
  documentId,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "./firebase";
import { useAuth } from "./auth-context";
import type { DayCompletions, PlanDay, PlanItem } from "@/types";
import { DAYS, dateKey } from "./groups";

const DEFAULT_FOCUS = [
  "Push Day",
  "Pull Day",
  "Legs",
  "Shoulders",
  "Arms",
  "Core & Mobility",
  "Rest",
];

export function emptyPlanDay(dayOfWeek: number): PlanDay {
  return {
    dayOfWeek,
    focusLabel: DEFAULT_FOCUS[dayOfWeek] ?? DAYS[dayOfWeek].full,
    isRestDay: dayOfWeek === 6,
    items: [],
  };
}

/* ---------------------------- plan (legacy) ------------------------------- */

/**
 * @deprecated Superseded by useWorkouts()/useSchedule() in lib/workouts.ts.
 *
 * Kept only so the plan/{weekday} documents remain readable. The migration
 * copies them into the workouts collection and never deletes them, so this is
 * the rollback path if the new model turns out wrong.
 */
export function usePlan() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Record<number, PlanDay>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPlan({});
      setLoading(false);
      return;
    }
    const ref = collection(getDb(), "users", user.uid, "plan");
    const unsub: Unsubscribe = onSnapshot(ref, (snap) => {
      const next: Record<number, PlanDay> = {};
      snap.forEach((d) => {
        const data = d.data() as PlanDay;
        next[Number(d.id)] = {
          ...data,
          // weightKg was added later — default it so older plan docs still work.
          items: (data.items ?? []).map((it) => ({ ...it, weightKg: it.weightKg ?? 0 })),
        };
      });
      setPlan(next);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const getDay = useCallback(
    (dow: number): PlanDay => plan[dow] ?? emptyPlanDay(dow),
    [plan]
  );

  const saveDay = useCallback(
    async (day: PlanDay) => {
      if (!user) return;
      // Renumber order on every write so it always reflects array position.
      const items = day.items.map((it, i) => ({ ...it, order: i }));
      await setDoc(doc(getDb(), "users", user.uid, "plan", String(day.dayOfWeek)), {
        ...day,
        items,
      });
    },
    [user]
  );

  const addExercise = useCallback(
    async (dow: number, exerciseId: string, sets = 3, reps = 10, weightKg = 0) => {
      const day = plan[dow] ?? emptyPlanDay(dow);
      if (day.items.some((i) => i.exerciseId === exerciseId)) return;
      const item: PlanItem = { exerciseId, sets, reps, weightKg, order: day.items.length };
      await saveDay({ ...day, items: [...day.items, item] });
    },
    [plan, saveDay]
  );

  const removeExercise = useCallback(
    async (dow: number, exerciseId: string) => {
      const day = plan[dow] ?? emptyPlanDay(dow);
      await saveDay({ ...day, items: day.items.filter((i) => i.exerciseId !== exerciseId) });
    },
    [plan, saveDay]
  );

  const updateItem = useCallback(
    async (dow: number, exerciseId: string, patch: Partial<PlanItem>) => {
      const day = plan[dow] ?? emptyPlanDay(dow);
      await saveDay({
        ...day,
        items: day.items.map((i) => (i.exerciseId === exerciseId ? { ...i, ...patch } : i)),
      });
    },
    [plan, saveDay]
  );

  const moveItem = useCallback(
    async (dow: number, from: number, to: number) => {
      const day = plan[dow] ?? emptyPlanDay(dow);
      if (to < 0 || to >= day.items.length) return;
      const items = [...day.items];
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);
      await saveDay({ ...day, items });
    },
    [plan, saveDay]
  );

  const setDayMeta = useCallback(
    async (dow: number, patch: Partial<Pick<PlanDay, "focusLabel" | "isRestDay">>) => {
      const day = plan[dow] ?? emptyPlanDay(dow);
      await saveDay({ ...day, ...patch });
    },
    [plan, saveDay]
  );

  return { plan, getDay, loading, saveDay, addExercise, removeExercise, updateItem, moveItem, setDayMeta };
}

/* ----------------------------- completions -------------------------------- */

/** Live completions for a single calendar date (YYYY-MM-DD). */
export function useDayCompletions(dayKey: string) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DayCompletions["entries"]>({});

  useEffect(() => {
    if (!user) {
      setEntries({});
      return;
    }
    const ref = doc(getDb(), "users", user.uid, "completions", dayKey);
    return onSnapshot(ref, (snap) => {
      setEntries((snap.data() as DayCompletions | undefined)?.entries ?? {});
    });
  }, [user, dayKey]);

  const toggle = useCallback(
    async (exerciseId: string, item: { sets: number; reps: number; weightKg: number }) => {
      if (!user) return;
      const ref = doc(getDb(), "users", user.uid, "completions", dayKey);
      const isDone = !entries[exerciseId]?.done;
      // setDoc+merge rather than updateDoc: the day doc may not exist yet.
      await setDoc(
        ref,
        {
          entries: {
            [exerciseId]: {
              done: isDone,
              // Snapshot what was actually lifted. Changing the plan next week
              // must not retroactively alter this session's numbers.
              setsDone: isDone ? item.sets : 0,
              repsDone: isDone ? item.reps : 0,
              weightKg: isDone ? item.weightKg : 0,
              at: new Date().toISOString(),
            },
          },
        },
        { merge: true }
      );
    },
    [user, dayKey, entries]
  );

  /** Write an exact completion — used by the per-exercise log screen. */
  const setCompletion = useCallback(
    async (
      exerciseId: string,
      v: { done: boolean; sets: number; reps: number; weightKg: number }
    ) => {
      if (!user) return;
      await setDoc(
        doc(getDb(), "users", user.uid, "completions", dayKey),
        {
          entries: {
            [exerciseId]: {
              done: v.done,
              setsDone: v.done ? v.sets : 0,
              repsDone: v.done ? v.reps : 0,
              weightKg: v.done ? v.weightKg : 0,
              at: new Date().toISOString(),
            },
          },
        },
        { merge: true }
      );
    },
    [user, dayKey]
  );

  /** Adjust the logged weight for an already-completed exercise. */
  const setLoggedWeight = useCallback(
    async (exerciseId: string, weightKg: number) => {
      if (!user) return;
      await setDoc(
        doc(getDb(), "users", user.uid, "completions", dayKey),
        { entries: { [exerciseId]: { weightKg } } },
        { merge: true }
      );
    },
    [user, dayKey]
  );

  return { entries, toggle, setCompletion, setLoggedWeight };
}

/**
 * Completions across a date range, for the dashboard.
 * Doc IDs are YYYY-MM-DD so a documentId() range query works as a date range.
 */
export function useCompletionsRange(fromKey: string, toKey: string) {
  const { user } = useAuth();
  const [days, setDays] = useState<Record<string, DayCompletions["entries"]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setDays({});
      setLoading(false);
      return;
    }
    const q = query(
      collection(getDb(), "users", user.uid, "completions"),
      where(documentId(), ">=", fromKey),
      where(documentId(), "<=", toKey)
    );
    return onSnapshot(q, (snap) => {
      const next: Record<string, DayCompletions["entries"]> = {};
      snap.forEach((d) => {
        next[d.id] = (d.data() as DayCompletions).entries ?? {};
      });
      setDays(next);
      setLoading(false);
    });
  }, [user, fromKey, toKey]);

  return { days, loading };
}

export { dateKey };
