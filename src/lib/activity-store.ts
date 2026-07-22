"use client";

import { useCallback, useEffect, useState } from "react";
import {
  collection,
  doc,
  documentId,
  onSnapshot,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { getDb } from "./firebase";
import { useAuth } from "./auth-context";
import { dateKey } from "./groups";
import type { Intensity } from "./activities";

/**
 * One logged bout of sport or cardio.
 *
 * `kcal` is snapshotted at save time rather than recomputed on read — the same
 * invariant the completions collection follows. Every model in activities.ts
 * scales with bodyweight, so recomputing would mean that updating your weight
 * on the Body page silently rewrites what last month's sessions cost you.
 */
export interface ActivityEntry {
  id: string;
  type: string;
  minutes: number;
  intensity: Intensity;
  km?: number;
  speedKmh?: number;
  gradePct?: number;
  kcal: number;
  note?: string;
  at: string;
}

interface ActivityDay {
  entries: ActivityEntry[];
  /** Everyday steps for the date, logged as one end-of-day figure. */
  steps?: number;
}

/** activities/{YYYY-MM-DD}. Doc ids match completions so the two align by date. */
function dayRef(uid: string, key: string) {
  return doc(getDb(), "users", uid, "activities", key);
}

/** Live activities for a single calendar date. */
export function useDayActivities(key: string) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [steps, setStepsState] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setStepsState(0);
      setLoading(false);
      return;
    }
    return onSnapshot(dayRef(user.uid, key), (snap) => {
      const data = snap.data() as ActivityDay | undefined;
      setEntries(data?.entries ?? []);
      setStepsState(data?.steps ?? 0);
      setLoading(false);
    });
  }, [user, key]);

  /*
   * The whole day is rewritten on every change. A day holds a handful of bouts
   * at most, and arrayUnion can't express an edit or a delete — so one document
   * write keeps add, edit and remove on a single code path.
   */
  const write = useCallback(
    async (next: ActivityEntry[]) => {
      if (!user) return;
      setEntries(next); // optimistic; the cache echoes it back anyway
      await setDoc(dayRef(user.uid, key), { entries: next }, { merge: true });
    },
    [user, key]
  );

  const add = useCallback(
    (entry: Omit<ActivityEntry, "id" | "at">) =>
      write([
        ...entries,
        { ...entry, id: crypto.randomUUID(), at: new Date().toISOString() },
      ]),
    [entries, write]
  );

  const update = useCallback(
    (id: string, patch: Partial<ActivityEntry>) =>
      write(entries.map((e) => (e.id === id ? { ...e, ...patch } : e))),
    [entries, write]
  );

  const remove = useCallback(
    (id: string) => write(entries.filter((e) => e.id !== id)),
    [entries, write]
  );

  /** Steps live on the same day doc so they can never drift to another date. */
  const setSteps = useCallback(
    async (next: number) => {
      if (!user) return;
      const clamped = Math.max(0, Math.round(next));
      setStepsState(clamped); // optimistic, like everything else here
      await setDoc(dayRef(user.uid, key), { steps: clamped }, { merge: true });
    },
    [user, key]
  );

  return { entries, steps, setSteps, loading, add, update, remove };
}

/** Activities across a date range, for the calendar and the weekly total. */
export function useActivitiesRange(fromKey: string, toKey: string) {
  const { user } = useAuth();
  const [days, setDays] = useState<Record<string, ActivityEntry[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setDays({});
      setLoading(false);
      return;
    }
    const q = query(
      collection(getDb(), "users", user.uid, "activities"),
      where(documentId(), ">=", fromKey),
      where(documentId(), "<=", toKey)
    );
    return onSnapshot(q, (snap) => {
      const next: Record<string, ActivityEntry[]> = {};
      snap.forEach((d) => {
        next[d.id] = (d.data() as ActivityDay).entries ?? [];
      });
      setDays(next);
      setLoading(false);
    });
  }, [user, fromKey, toKey]);

  return { days, loading };
}

export function kcalOn(days: Record<string, ActivityEntry[]>, d: Date): number {
  return (days[dateKey(d)] ?? []).reduce((sum, e) => sum + e.kcal, 0);
}

export function kcalAcross(days: Record<string, ActivityEntry[]>, dates: Date[]): number {
  return dates.reduce((sum, d) => sum + kcalOn(days, d), 0);
}
