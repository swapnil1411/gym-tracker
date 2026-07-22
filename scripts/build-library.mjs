#!/usr/bin/env node
/**
 * Builds data/library.json — the bundled, offline exercise library.
 *
 * Sources:
 *   1. Free Exercise DB (Unlicense / public domain) — strength + stretching
 *   2. Yoga API (CC0 image set) — yoga poses. Free host, frequently down:
 *      a failure here is a warning, never a build failure.
 *   3. Hand-seeded knees-friendly mobility moves.
 *
 * Runs before `next dev` / `next build`. No runtime API calls ship to the client.
 */

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "data", "library.json");
const PUBLIC_OUT_DIR = path.join(ROOT, "public");

const FED_DATA =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const FED_IMAGES =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const YOGA_BASE = "https://yoga-api-nzy4.onrender.com/v1";

/** primaryMuscles value -> our normalized group */
const MUSCLE_TO_GROUP = {
  chest: "chest",
  lats: "back",
  "middle back": "back",
  "lower back": "back",
  traps: "back",
  quadriceps: "legs",
  hamstrings: "legs",
  glutes: "legs",
  calves: "legs",
  abductors: "legs",
  adductors: "legs",
  shoulders: "shoulders",
  biceps: "biceps",
  triceps: "triceps",
  // Previously unmapped, which silently dropped every forearm exercise from
  // the library — wrist curls, farmer's walks and grip work all vanished.
  forearms: "forearms",
  abdominals: "core",
};

const SEEDED_MOBILITY = [
  {
    name: "Tibialis Raise",
    instructions: [
      "Stand with your back against a wall and walk your feet 30–45cm forward.",
      "Keeping your heels planted and legs straight, pull your toes up toward your shins.",
      "Lower under control until your toes are just off the floor, then repeat.",
    ],
  },
  {
    name: "ATG-style Split Squat",
    instructions: [
      "Take a long split stance with the rear knee resting lightly on a pad.",
      "Sink straight down, letting the front knee travel forward past the toes as far as is comfortable.",
      "Keep the front heel down and the torso upright, then drive back up.",
    ],
  },
  {
    name: "Backward Treadmill Walk",
    instructions: [
      "Set a treadmill to a slow speed (or push a sled backward) and face away from the console.",
      "Walk backward with short steps, landing toe-first and rolling to the heel.",
      "Keep a light forward lean and hold the rails until the movement feels stable.",
    ],
  },
  {
    name: "Elevated Standing Calf Raise",
    instructions: [
      "Stand with the balls of your feet on a step, heels hanging free.",
      "Lower your heels below the step until you feel a stretch in the calves.",
      "Press up onto your toes as high as possible, pause, then lower slowly.",
    ],
  },
  {
    name: "Standing Knee-over-Toe Stretch",
    instructions: [
      "Place one foot on a low step or box in a half-kneeling-style stance.",
      "Drive the knee forward over the toes while keeping the heel flat on the surface.",
      "Hold at the end range, breathe, then ease back. Repeat on the other side.",
    ],
  },
  {
    name: "Couch Stretch",
    instructions: [
      "Kneel with your back foot elevated against a wall or couch, shin vertical.",
      "Bring the front foot forward into a lunge and square your hips.",
      "Squeeze the rear glute and lift the torso upright until you feel the hip flexor stretch.",
    ],
  },
  {
    name: "Seated Good Morning",
    instructions: [
      "Sit upright on a bench with feet flat and a light bar or broomstick across your upper back.",
      "Hinge forward from the hips with a flat back until you feel the hamstrings and lower back load.",
      "Return to upright by driving the chest up.",
    ],
  },
];

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function fetchJson(url, { timeoutMs = 45000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------ 1. Free Exercise DB ----------------------- */

async function loadFreeExerciseDb() {
  const raw = await fetchJson(FED_DATA);
  const out = [];

  for (const ex of raw) {
    const isStretch = ex.category === "stretching";
    /*
     * Cardio is its own group, taken from the source's own category rather than
     * from primaryMuscles. Every treadmill, bike and rower in the set lists
     * "quadriceps", which filed them under Legs — so searching "cardio", or
     * tapping a Cardio chip, found nothing, and a treadmill walk sat in a leg
     * session asking for sets, reps and a weight in kg.
     */
    const isCardio = ex.category === "cardio";
    const primary = (ex.primaryMuscles || [])[0];
    const group = isCardio ? "cardio" : isStretch ? "mobility" : MUSCLE_TO_GROUP[primary];

    // Drop anything we can't place in a group the UI knows how to render.
    if (!group) continue;

    const images = (ex.images || []).map((p) => FED_IMAGES + p);

    out.push({
      id: `fed-${ex.id || slug(ex.name)}`,
      name: ex.name,
      group,
      image: images[0] || null,
      images,
      equipment: ex.equipment || null,
      level: ex.level || null,
      instructions: ex.instructions || [],
      source: "free-exercise-db",
    });
  }
  return out;
}

/* ---------------------------------- 2. Yoga ------------------------------- */

async function loadYoga() {
  const poses = await fetchJson(`${YOGA_BASE}/poses`, { timeoutMs: 60000 });
  const list = Array.isArray(poses) ? poses : poses?.poses || [];

  return list
    .map((p) => {
      const name = p.english_name || p.name;
      if (!name) return null;
      const image = p.url_png || p.url_svg || null;
      return {
        id: `yoga-${p.id ?? slug(name)}`,
        name,
        group: "yoga",
        image,
        images: image ? [image] : [],
        equipment: null,
        level: null,
        instructions: p.pose_description ? [p.pose_description] : [],
        benefits: p.pose_benefits || null,
        sanskritName: p.sanskrit_name || null,
        source: "yoga-api",
      };
    })
    .filter(Boolean);
}

/* -------------------------------- 3. Seeded ------------------------------- */

function loadSeeded() {
  return SEEDED_MOBILITY.map((m) => ({
    id: `seed-${slug(m.name)}`,
    name: m.name,
    group: "mobility",
    image: null,
    images: [],
    equipment: null,
    level: "beginner",
    instructions: m.instructions,
    source: "seeded",
  }));
}

/* --------------------------------- Build ---------------------------------- */

async function main() {
  console.log("→ Building exercise library…");

  const exercises = [];

  // Free Exercise DB is the backbone — if this fails we genuinely cannot build.
  const fed = await loadFreeExerciseDb();
  console.log(`  ✓ Free Exercise DB: ${fed.length} exercises`);
  exercises.push(...fed);

  try {
    const yoga = await loadYoga();
    console.log(`  ✓ Yoga API: ${yoga.length} poses`);
    exercises.push(...yoga);
  } catch (err) {
    console.warn(
      `  ⚠ Yoga API unavailable (${err.message}) — continuing without yoga poses.`
    );
    // Keep any yoga we bundled on a previous successful build rather than
    // silently shipping an empty category.
    if (existsSync(OUT)) {
      try {
        const prev = JSON.parse(await readFile(OUT, "utf8"));
        const prevYoga = (prev.exercises || []).filter((e) => e.group === "yoga");
        if (prevYoga.length) {
          console.warn(`  ↳ reusing ${prevYoga.length} yoga poses from previous build`);
          exercises.push(...prevYoga);
        }
      } catch {
        /* previous file unreadable — fine, just skip yoga */
      }
    }
  }

  exercises.push(...loadSeeded());

  // De-dupe by id, then sort for a stable, diff-friendly output file.
  const byId = new Map();
  for (const ex of exercises) if (!byId.has(ex.id)) byId.set(ex.id, ex);
  const merged = [...byId.values()].sort((a, b) =>
    a.group === b.group ? a.name.localeCompare(b.name) : a.group.localeCompare(b.group)
  );

  const counts = {};
  for (const ex of merged) counts[ex.group] = (counts[ex.group] || 0) + 1;

  const payload = JSON.stringify({
    generatedAt: new Date().toISOString(),
    counts,
    exercises: merged,
  });

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, payload);

  // Also emit into public/ so the client fetches it as a static asset (service-worker
  // cached, still zero runtime API calls) instead of inlining ~1.5MB into the JS bundle.
  await mkdir(PUBLIC_OUT_DIR, { recursive: true });
  await writeFile(path.join(PUBLIC_OUT_DIR, "library.json"), payload);

  console.log(`  ✓ wrote ${merged.length} exercises → data/library.json + public/library.json`);
  console.log(`    ${Object.entries(counts).map(([g, n]) => `${g}:${n}`).join("  ")}`);
}

main().catch((err) => {
  console.error("✗ Library build failed:", err);
  process.exit(1);
});
