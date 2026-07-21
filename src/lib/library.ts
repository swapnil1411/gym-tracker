"use client";

import { useEffect, useState } from "react";
import { GROUPS } from "./groups";
import type { Library, LibraryExercise, MuscleGroup } from "@/types";

let cache: Library | null = null;
let inflight: Promise<Library> | null = null;

/**
 * Loads the build-time bundled library from /library.json.
 * Static asset on our own origin → service-worker cached, works offline,
 * and costs nothing per user (unlike storing it in Firestore).
 */
export function loadLibrary(): Promise<Library> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch("/library.json")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load library.json (${r.status})`);
        return r.json() as Promise<Library>;
      })
      .then((lib) => {
        cache = lib;
        return lib;
      })
      .catch((err) => {
        inflight = null; // let a later attempt retry
        throw err;
      });
  }
  return inflight;
}

export function useLibrary() {
  const [library, setLibrary] = useState<Library | null>(cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadLibrary()
      .then((lib) => alive && setLibrary(lib))
      .catch((e) => alive && setError((e as Error).message));
    return () => {
      alive = false;
    };
  }, []);

  return { library, error, loading: !library && !error };
}

/** id -> exercise, for resolving plan items. */
export function indexById(lib: Library | null): Map<string, LibraryExercise> {
  const m = new Map<string, LibraryExercise>();
  if (lib) for (const ex of lib.exercises) m.set(ex.id, ex);
  return m;
}

export function searchLibrary(
  lib: Library | null,
  group: MuscleGroup | "all",
  query: string
): LibraryExercise[] {
  if (!lib) return [];
  const q = query.trim().toLowerCase();
  const words = q ? q.split(/\s+/) : [];

  return lib.exercises
    .filter((ex) => {
      if (group !== "all" && ex.group !== group) return false;
      if (!words.length) return true;
      /*
       * The group name is part of the haystack so that searching "cardio",
       * "legs" or "yoga" returns that group. Every one of those is a word
       * someone will type, and matching only exercise names meant the most
       * obvious query in the box returned an empty screen — the chips were the
       * only way in, and they scroll out of sight.
       */
      const hay = `${ex.name} ${ex.equipment ?? ""} ${GROUPS[ex.group].name}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    })
    .sort((a, b) => {
      if (!q) return a.name.localeCompare(b.name);
      // Prefix matches first — typing "bench" should surface "Bench Press" above
      // "Close-Grip Barbell Bench Press".
      const ap = a.name.toLowerCase().startsWith(q) ? 0 : 1;
      const bp = b.name.toLowerCase().startsWith(q) ? 0 : 1;
      return ap - bp || a.name.localeCompare(b.name);
    })
    .slice(0, 120);
}
