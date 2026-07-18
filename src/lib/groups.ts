import type { CSSProperties } from "react";
import type { MuscleGroup } from "@/types";

export interface GroupMeta {
  name: string;
  color: string;
  icon: string;
}

export const GROUPS: Record<MuscleGroup, GroupMeta> = {
  chest: { name: "Chest", color: "#FF5A4D", icon: "🏋️" },
  back: { name: "Back", color: "#4A9FE8", icon: "🧗" },
  legs: { name: "Legs", color: "#8B7CF6", icon: "🦵" },
  shoulders: { name: "Shoulders", color: "#39D98A", icon: "🤸" },
  biceps: { name: "Biceps", color: "#F5A623", icon: "💪" },
  triceps: { name: "Triceps", color: "#EC6B9E", icon: "🔻" },
  core: { name: "Core", color: "#2FC4C4", icon: "🌀" },
  mobility: { name: "Mobility", color: "#7ED957", icon: "🧘" },
  yoga: { name: "Yoga", color: "#C79BFF", icon: "☯️" },
};

export const GROUP_KEYS = Object.keys(GROUPS) as MuscleGroup[];

/** hex + alpha -> rgba(), mirroring the prototype's `hex()` helper. */
export function hexA(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/**
 * Muscle-group tag colours. The palette was picked for a dark field, so on
 * light backgrounds the text is darkened via --tag-darken (set per theme in
 * globals.css) rather than maintaining a second hand-tuned palette.
 */
export function tagStyle(color: string): CSSProperties {
  return {
    background: `color-mix(in srgb, ${color} calc(var(--tag-alpha) * 100%), transparent)`,
    color: `color-mix(in srgb, ${color}, black var(--tag-darken))`,
  };
}

/** Same darkening treatment, for solid swatches like the volume bars. */
export function barColor(color: string): string {
  return `color-mix(in srgb, ${color}, black calc(var(--tag-darken) * 0.6))`;
}

export const DAYS = [
  { key: "mon", label: "MON", full: "Monday" },
  { key: "tue", label: "TUE", full: "Tuesday" },
  { key: "wed", label: "WED", full: "Wednesday" },
  { key: "thu", label: "THU", full: "Thursday" },
  { key: "fri", label: "FRI", full: "Friday" },
  { key: "sat", label: "SAT", full: "Saturday" },
  { key: "sun", label: "SUN", full: "Sunday" },
] as const;

/** JS getDay() is 0=Sun..6=Sat; our model is 0=Mon..6=Sun. */
export function toMondayIndex(jsDay: number): number {
  return (jsDay + 6) % 7;
}

/** Local-time YYYY-MM-DD. Never use toISOString() here — it shifts by timezone. */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
