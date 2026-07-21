"use client";

import { useCallback, useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { getDb } from "./firebase";
import { useAuth } from "./auth-context";

export type Sex = "male" | "female";
export type Activity = "sedentary" | "light" | "moderate" | "active" | "athlete";
export type Goal = "cut" | "maintain" | "gain";

/** settings/body — the only profile numbers the app stores. */
export interface BodyProfile {
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
  sex: Sex;
  activity: Activity;
  goal: Goal;
}

export const EMPTY_BODY: BodyProfile = {
  weightKg: null,
  heightCm: null,
  age: null,
  sex: "male",
  activity: "moderate",
  goal: "maintain",
};

/*
 * Activity multipliers as published with Mifflin-St Jeor. "Moderate" means
 * training 3–5 days a week, which is what this app is for, hence the default.
 */
export const ACTIVITY: Record<Activity, { label: string; hint: string; factor: number }> = {
  sedentary: { label: "Sedentary", hint: "Desk job, no training", factor: 1.2 },
  light: { label: "Light", hint: "1–3 sessions a week", factor: 1.375 },
  moderate: { label: "Moderate", hint: "3–5 sessions a week", factor: 1.55 },
  active: { label: "Active", hint: "6–7 sessions a week", factor: 1.725 },
  athlete: { label: "Athlete", hint: "Twice a day / physical job", factor: 1.9 },
};

export const GOALS: Record<Goal, { label: string; hint: string; delta: number }> = {
  cut: { label: "Lose fat", hint: "−20%", delta: -0.2 },
  maintain: { label: "Maintain", hint: "±0", delta: 0 },
  gain: { label: "Build muscle", hint: "+10%", delta: 0.1 },
};

/**
 * Living, minus training: BMR plus the cost of being awake, walking around and
 * digesting, with no session in it. This is the "sedentary" multiplier, and it
 * is the honest base to add *measured* training onto — the activity multipliers
 * above already contain an assumed amount of exercise, so adding today's logged
 * burn to the TDEE would count the same session twice.
 */
export const NON_EXERCISE_FACTOR = 1.2;

/**
 * What today actually cost, given what was logged.
 *
 * A second estimate of the same quantity as `tdee`, arrived at from the other
 * direction: TDEE guesses your training from a five-way activity picker, while
 * this one reads it off the sessions you ticked. On a rest day it lands below
 * maintenance; on a hard day, above. They are alternatives, never addends.
 */
export function burnForDay(bmr: number, exerciseKcal: number): number {
  return bmr * NON_EXERCISE_FACTOR + exerciseKcal;
}

export interface BodyMetrics {
  bmi: number;
  category: string;
  /** Healthy-BMI weight span for this height, in kg. */
  healthyRange: [number, number];
  /** Mifflin-St Jeor resting burn. */
  bmr: number;
  /** BMR × activity — maintenance, i.e. what you burn on an average day. */
  tdee: number;
  /** BMR × 1.2 — the same day with no training in it at all. */
  baseline: number;
  /** TDEE adjusted for the chosen goal. */
  calories: number;
  proteinG: number;
  /** Millilitres per day. */
  waterMl: number;
}

/**
 * BMI is a population-level screen, not a body-composition measure — it reads
 * muscle as excess weight, so a lifter can sit in "overweight" while lean. The
 * UI says so rather than hiding it.
 */
export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function computeMetrics(p: BodyProfile): BodyMetrics | null {
  const { weightKg: w, heightCm: h, age } = p;
  if (!w || !h || w <= 0 || h <= 0) return null;

  const m = h / 100;
  const bmi = w / (m * m);

  // Mifflin-St Jeor needs an age; without one, fall back to 30 so the page
  // still gives a usable number rather than a blank.
  const a = age && age > 0 ? age : 30;
  const bmr = 10 * w + 6.25 * h - 5 * a + (p.sex === "female" ? -161 : 5);
  const tdee = bmr * ACTIVITY[p.activity].factor;
  const calories = tdee * (1 + GOALS[p.goal].delta);

  // 1.6 g/kg is the middle of the range where resistance-training studies stop
  // showing further gains.
  const proteinG = w * 1.6;

  // 35 ml/kg baseline, plus roughly what a training session costs in sweat.
  const bonus = { sedentary: 0, light: 250, moderate: 500, active: 750, athlete: 1000 }[
    p.activity
  ];
  const waterMl = w * 35 + bonus;

  return {
    bmi,
    category: bmiCategory(bmi),
    healthyRange: [18.5 * m * m, 24.9 * m * m],
    bmr,
    tdee,
    baseline: bmr * NON_EXERCISE_FACTOR,
    calories,
    proteinG,
    waterMl,
  };
}

export function useBody() {
  const { user } = useAuth();
  const [body, setBody] = useState<BodyProfile>(EMPTY_BODY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBody(EMPTY_BODY);
      setLoading(false);
      return;
    }
    const ref = doc(getDb(), "users", user.uid, "settings", "body");
    return onSnapshot(ref, (snap) => {
      setBody({ ...EMPTY_BODY, ...(snap.data() as Partial<BodyProfile> | undefined) });
      setLoading(false);
    });
  }, [user]);

  const update = useCallback(
    async (patch: Partial<BodyProfile>) => {
      if (!user) return;
      // Optimistic: Firestore's offline cache echoes it back anyway, but this
      // keeps the inputs from lagging a keystroke behind on a slow connection.
      setBody((b) => ({ ...b, ...patch }));
      await setDoc(doc(getDb(), "users", user.uid, "settings", "body"), patch, { merge: true });
    },
    [user]
  );

  return { body, loading, update };
}
