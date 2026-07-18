import type { CSSProperties } from "react";
import type { MuscleGroup } from "@/types";

export interface GroupMeta {
  name: string;
  /** Radix step 9 — the solid. Identical in both themes by design. */
  color: string;
  /** Radix step 11 — the accessible text shade, which does differ per theme. */
  inkLight: string;
  inkDark: string;
  icon: string;
}

/*
 * Nine hues from Radix Colors, each taken at the same scale step, so no tag
 * shouts louder than the others and every one is contrast-checked (APCA).
 * Iris and jade are reserved for --accent and --done, hence their absence.
 */
export const GROUPS: Record<MuscleGroup, GroupMeta> = {
  chest: { name: "Chest", color: "#e5484d", inkLight: "#ce2c31", inkDark: "#ff9592", icon: "🏋️" },
  back: { name: "Back", color: "#0090ff", inkLight: "#0d74ce", inkDark: "#70b8ff", icon: "🧗" },
  legs: { name: "Legs", color: "#ffc53d", inkLight: "#ab6400", inkDark: "#ffca16", icon: "🦵" },
  shoulders: { name: "Shoulders", color: "#00a2c7", inkLight: "#107d98", inkDark: "#4ccce6", icon: "🤸" },
  biceps: { name: "Biceps", color: "#f76b15", inkLight: "#cc4e00", inkDark: "#ffa057", icon: "💪" },
  triceps: { name: "Triceps", color: "#d6409f", inkLight: "#c2298a", inkDark: "#ff8dcc", icon: "🔻" },
  core: { name: "Core", color: "#bdee63", inkLight: "#5c7c2f", inkDark: "#bde56c", icon: "🌀" },
  mobility: { name: "Mobility", color: "#12a594", inkLight: "#008573", inkDark: "#0bd8b6", icon: "🧘" },
  yoga: { name: "Yoga", color: "#8e4ec6", inkLight: "#8145b5", inkDark: "#d19dff", icon: "☯️" },
};

export const GROUP_KEYS = Object.keys(GROUPS) as MuscleGroup[];

/** hex + alpha -> rgba(), mirroring the prototype's `hex()` helper. */
export function hexA(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/**
 * Text shade for a group, switched by theme. light-dark() reads the
 * `color-scheme` that globals.css sets per theme, so this needs no JS and no
 * re-render when the user flips the toggle.
 */
function ink(g: GroupMeta): string {
  return `light-dark(${g.inkLight}, ${g.inkDark})`;
}

/** Muscle-group tag: tinted field, step-11 text. */
export function tagStyle(g: GroupMeta): CSSProperties {
  return {
    background: `color-mix(in srgb, ${g.color} calc(var(--tag-alpha) * 100%), transparent)`,
    color: ink(g),
  };
}

/**
 * Filter-chip styling.
 *
 * Selection is drawn in the accent, never the group hue: "which chip is
 * selected" must look identical whichever chip it is, or the UI appears to
 * change colour scheme as you browse. The dot already carries the group
 * identity, so the fill doesn't need to.
 */
export function chipStyle(active: boolean): CSSProperties {
  if (!active) return {};
  return {
    background: "rgb(var(--accent))",
    color: "rgb(var(--on-accent))",
  };
}

/** Solid swatches like the volume bars — step 9 works on either theme. */
export function barColor(color: string): string {
  return color;
}

/**
 * Deep link to form videos for an exercise.
 *
 * Deliberately a search URL rather than a stored video id. Pre-resolving 900
 * exercises to specific videos would mean either scraping (against YouTube's
 * ToS, and brittle) or the Data API (search.list costs 100 units of a 10k daily
 * quota — nine days to cover the library, re-burnt on every rebuild). Both then
 * rot as videos are deleted or go private, with nothing surfacing the breakage.
 *
 * Resolving at tap time costs nothing, never goes stale, needs no API key, and
 * lets the person pick a channel they trust rather than whatever ranked first
 * on the day the library was built — which matters when bad form means injury.
 */
export function videoSearchUrl(name: string): string {
  const q = encodeURIComponent(`${name} proper form technique`);
  return `https://www.youtube.com/results?search_query=${q}`;
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
