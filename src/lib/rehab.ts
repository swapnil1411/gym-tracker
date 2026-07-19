/*
 * Knee rehab & mobility, built on the Knees Over Toes (ATG) method.
 *
 * Ben Patrick — "Knees Over Toes Guy" — trains the knee through its full range
 * rather than around it: strength at end range in both directions, built from
 * the ground up (feet and shins before quads and hips), and always starting
 * from a version you can already do pain-free.
 *
 * This is a hand-written summary of his publicly taught progressions, in our
 * own words. It is not his program, not affiliated with him, and not medical
 * advice — the UI says all three. Each move links out to a video search rather
 * than embedding one, for the same reasons `videoSearchUrl` does in groups.ts:
 * stored video ids rot, and form is the one thing you don't want going stale.
 */

export type Level = 1 | 2 | 3;

export const LEVELS: Record<Level, { label: string; hint: string }> = {
  1: { label: "Zero", hint: "No equipment — start here" },
  2: { label: "Build", hint: "A step, a wall, light load" },
  3: { label: "Strong", hint: "Loaded, once the basics are painless" },
};

export interface RehabExercise {
  id: string;
  name: string;
  /** Alternative names people search for. Never shown; only matched. */
  aliases: string[];
  /** What it actually trains, shown as the row's subtitle. */
  target: string;
  level: Level;
  dose: string;
  equipment: string;
  /** Why it earns a place in a knee protocol. */
  why: string;
  /** The two or three things that decide whether it works or hurts. */
  cues: string[];
  protocols: string[];
}

export interface Protocol {
  id: string;
  name: string;
  blurb: string;
  aliases: string[];
}

export const PROTOCOLS: Protocol[] = [
  {
    id: "knee-cap",
    name: "Knee cap rehab",
    blurb:
      "Pain at or under the knee cap — jumper's knee, runner's knee, patellar tendinopathy. Build tolerance at both ends of the range, starting with the shin and the VMO.",
    aliases: [
      "knee",
      "cap",
      "kneecap",
      "patella",
      "patellar",
      "tendon",
      "tendinitis",
      "tendinopathy",
      "jumpers",
      "runners",
      "anterior",
      "pain",
      "rehab",
      "vmo",
    ],
  },
  {
    id: "knee-zero",
    name: "Knees Zero — start here",
    blurb:
      "The floor of the whole method: nothing but your bodyweight and a wall. If a knee hurts, this is the layer you earn before anything else.",
    aliases: ["knee", "zero", "start", "beginner", "basic", "bodyweight", "rehab", "pain"],
  },
  {
    id: "knee-strength",
    name: "Bulletproof knees",
    blurb:
      "Once the basics are painless, load them. Full-range strength is what actually makes a knee hard to hurt — mobility alone doesn't.",
    aliases: ["knee", "strength", "strengthening", "strong", "sled", "loaded", "athletic", "jump"],
  },
  {
    id: "ankles-feet",
    name: "Ankles, shins & calves",
    blurb:
      "Ben Patrick's first principle: the knee inherits whatever the ankle can't do. Stiff ankles push the load up into the knee cap.",
    aliases: ["ankle", "ankles", "foot", "feet", "shin", "shins", "calf", "calves", "achilles", "tibialis", "mobility"],
  },
  {
    id: "hips-hamstrings",
    name: "Hips & hamstrings",
    blurb:
      "The other end of the chain. Weak hamstrings and locked hip flexors leave the knee doing work that was never its job.",
    aliases: ["hip", "hips", "hamstring", "hamstrings", "glute", "groin", "spine", "back", "flexibility", "mobility", "acl"],
  },
];

export const EXERCISES: RehabExercise[] = [
  {
    id: "backward-walk",
    name: "Backward Walking",
    aliases: ["reverse walking", "retro walking", "backwards"],
    target: "Knee blood flow · VMO · quads",
    level: 1,
    dose: "5–10 min, or 1,000–2,000 steps daily",
    equipment: "None (a treadmill switched off works too)",
    why: "The single most repeated piece of advice in the method, and the one that costs nothing. Walking backwards loads the knee with almost no impact, drives blood into a famously poorly-supplied joint, and trains the quad to fully straighten the leg — which is exactly what stops hurting first.",
    cues: [
      "Roll toe to heel, the opposite of walking forwards.",
      "Straighten the knee completely on every step — that lockout is the point.",
      "Daily beats hard. This is the one to do even on rest days.",
    ],
    protocols: ["knee-cap", "knee-zero", "knee-strength"],
  },
  {
    id: "tibialis-raise",
    name: "Tibialis Raise",
    aliases: ["tib raise", "shin raise", "toe raise", "anterior tibialis"],
    target: "Tibialis anterior (front of shin)",
    level: 1,
    dose: "2 × 25 reps",
    equipment: "A wall",
    why: "The shin muscle decelerates the knee every time you land or stop. Almost nobody trains it, and it is the classic missing link behind knee cap pain — a strong tib takes load off the tendon rather than adding to it.",
    cues: [
      "Back flat on the wall, heels roughly one foot-length out.",
      "Pull the toes up as high as they go, then lower slowly.",
      "Walk the heels further out to make it harder, closer to make it easier.",
    ],
    protocols: ["knee-cap", "knee-zero", "ankles-feet"],
  },
  {
    id: "fhl-calf-raise",
    name: "KOT Calf Raise",
    aliases: ["fhl calf raise", "calf raise", "big toe calf raise", "soleus"],
    target: "Calf · big toe · ankle range",
    level: 1,
    dose: "2 × 25 reps",
    equipment: "A step or a book",
    why: "Trains the calf through a full stretch instead of the usual half-inch bounce, and finishes on the big toe — the toe you actually push off. Restores the ankle range that otherwise gets stolen from the knee.",
    cues: [
      "Let the heel sink all the way below the step first.",
      "Rise until you're on the big toe, not the outside edge of the foot.",
      "Slow at both ends. Speed here is wasted effort.",
    ],
    protocols: ["knee-cap", "knee-zero", "ankles-feet"],
  },
  {
    id: "atg-split-squat",
    name: "ATG Split Squat",
    aliases: ["knees over toes lunge", "atg lunge", "front foot elevated split squat", "deep lunge"],
    target: "VMO · quads · hip flexor stretch",
    level: 2,
    dose: "3 × 5–10 each side",
    equipment: "A step or two to hold, ideally something to hold onto",
    why: "The signature movement. The front knee travels well past the toes under control, which is precisely the position everyone is told to avoid — and precisely the position a knee needs to be strong in if it's going to survive stairs, hills and sport.",
    cues: [
      "Front hamstring should touch the calf at the bottom. If it can't, elevate the front foot and work down.",
      "Back knee stays straight and the rear hip opens — that stretch is half the exercise.",
      "Hold a rail. Assisting it is how you earn the range, not cheating.",
    ],
    protocols: ["knee-cap", "knee-zero", "knee-strength", "hips-hamstrings"],
  },
  {
    id: "patrick-step",
    name: "Patrick Step",
    aliases: ["patrick step up", "vmo step", "knee extension step"],
    target: "VMO · terminal knee extension",
    level: 2,
    dose: "2 × 10 each side",
    equipment: "A low box or step",
    why: "Named after Ben Patrick himself, and the most direct hit on the VMO — the teardrop above the inside of the knee that fires in the last few degrees of straightening and is almost always the weak link in knee cap pain.",
    cues: [
      "Stand on one leg on the box, free leg reaching forward.",
      "Bend the standing knee just a little and tap the free heel down.",
      "Small range done honestly beats a big range done with the hip.",
    ],
    protocols: ["knee-cap", "knee-strength"],
  },
  {
    id: "poliquin-step-up",
    name: "Poliquin Step-Up",
    aliases: ["peterson step up", "vmo step up", "toes elevated step up"],
    target: "VMO · quads",
    level: 2,
    dose: "2 × 10–20 each side",
    equipment: "A low step and a small wedge or plate",
    why: "A short-range step-up with the toes raised, which pins the load onto the VMO and keeps it there. Boring, unglamorous, and one of the fastest ways to change how the knee cap tracks.",
    cues: [
      "Toes higher than the heel on the working foot.",
      "Move slowly — three seconds up, three down.",
      "The other leg hangs; it doesn't help.",
    ],
    protocols: ["knee-cap", "knee-strength"],
  },
  {
    id: "reverse-step-down",
    name: "Reverse Step-Down",
    aliases: ["eccentric step down", "step down", "backward step up"],
    target: "Eccentric quad control",
    level: 2,
    dose: "3 × 8 each side",
    equipment: "A box or a bottom stair",
    why: "Stairs going down hurt long after stairs going up stop hurting, because lowering is where the tendon takes its real load. This trains exactly that, at a height you choose.",
    cues: [
      "Lower over three or four seconds — never drop.",
      "Knee tracks over the middle toes, not caving inwards.",
      "Lower the box before you shorten the tempo.",
    ],
    protocols: ["knee-cap", "knee-strength"],
  },
  {
    id: "slant-squat",
    name: "Slant Board Squat",
    aliases: ["atg squat", "heels elevated squat", "sissy squat", "full depth squat"],
    target: "Quads at full knee flexion",
    level: 3,
    dose: "3 × 10",
    equipment: "A slant board, or plates under the heels",
    why: "Full-depth squatting with the heels raised puts the knee at maximum flexion under load. This is the end range you're ultimately rehabbing towards — strong here means very little in daily life can catch the knee out.",
    cues: [
      "Go all the way down. Half a squat trains half a knee.",
      "Torso upright; this should feel like quads, not lower back.",
      "Bodyweight for weeks before you hold anything.",
    ],
    protocols: ["knee-cap", "knee-strength"],
  },
  {
    id: "sled-drag",
    name: "Backward Sled Drag",
    aliases: ["sled pull", "reverse sled", "prowler"],
    target: "Loaded knee conditioning",
    level: 3,
    dose: "4–6 lengths, moderate load",
    equipment: "Sled or harness (a plate on turf works)",
    why: "Backward walking with resistance. All the joint-friendly qualities of the free version, with enough load to actually build the quad — and no eccentric portion at all, which is why beat-up knees tolerate it when nothing else works.",
    cues: [
      "Stay tall; don't lean back against the load.",
      "Full knee lockout each step, same as walking backwards.",
      "Should feel like conditioning, never like a max effort.",
    ],
    protocols: ["knee-strength"],
  },
  {
    id: "elephant-walk",
    name: "Elephant Walk",
    aliases: ["hamstring walk", "toe touch walk"],
    target: "Hamstrings · calves",
    level: 1,
    dose: "30–60 seconds",
    equipment: "None",
    why: "A moving hamstring stretch that also asks the knee to fully straighten under a stretch — which restores the extension that stiff hamstrings quietly take away.",
    cues: [
      "Hands towards the floor, bend knees as much as you need.",
      "Alternately straighten one knee at a time.",
      "Work towards straight legs and flat palms over weeks, not one session.",
    ],
    protocols: ["knee-zero", "ankles-feet", "hips-hamstrings"],
  },
  {
    id: "seated-good-morning",
    name: "Seated Good Morning",
    aliases: ["good morning", "spinal hinge"],
    target: "Hamstrings · lower back · spine",
    level: 2,
    dose: "3 × 10",
    equipment: "A bench and a broomstick or light bar",
    why: "Teaches the hips and spine to take load in a hinge, so the knee stops compensating for a back that won't bend. Seated removes the balance problem and isolates the hinge.",
    cues: [
      "Sit tall, hinge forward from the hips with a long spine.",
      "Feel it in the hamstrings, not the lower back.",
      "A broomstick for the first month is not too light.",
    ],
    protocols: ["knee-zero", "hips-hamstrings"],
  },
  {
    id: "couch-stretch",
    name: "Couch Stretch",
    aliases: ["hip flexor stretch", "quad stretch", "sofa stretch"],
    target: "Hip flexors · quads",
    level: 1,
    dose: "60–90 seconds each side",
    equipment: "A wall or a sofa",
    why: "A tight hip flexor tilts the pelvis and keeps the quad permanently switched on, which loads the knee cap all day long. This is the release valve, and it pairs directly with the ATG split squat.",
    cues: [
      "Rear shin up the wall, front foot planted.",
      "Squeeze the glute of the back leg — that's what makes it work.",
      "Breathe. If you're bracing against pain, come out of it.",
    ],
    protocols: ["knee-cap", "knee-zero", "hips-hamstrings"],
  },
  {
    id: "nordic-curl",
    name: "Nordic Curl",
    aliases: ["nordic hamstring curl", "russian curl", "hamstring eccentric"],
    target: "Hamstrings (eccentric) · ACL protection",
    level: 3,
    dose: "3 × 5, partial range",
    equipment: "Something to anchor the ankles",
    why: "The most evidence-backed movement in the whole list for reducing hamstring and ACL injuries. Brutally hard, so almost everyone starts with a range of a few inches and a band or a hand-assist.",
    cues: [
      "Only lower as far as you can control coming back up.",
      "Hips stay extended — no hinging at the waist.",
      "Add range in inches, not stages.",
    ],
    protocols: ["knee-strength", "hips-hamstrings"],
  },
  {
    id: "jefferson-curl",
    name: "Jefferson Curl",
    aliases: ["spinal curl", "roll down", "loaded flexion"],
    target: "Spine · hamstrings",
    level: 3,
    dose: "3 × 5–8, very light",
    equipment: "A raised surface and a light weight",
    why: "Deliberate, loaded spinal flexion — segment by segment. Contentious, and the reason it belongs here is the same as the ATG split squat: strength in the position you've been told to fear is what makes the position safe.",
    cues: [
      "Roll down one vertebra at a time, chin first.",
      "Legs stay straight; this is not a deadlift.",
      "Start with 2.5 kg. Genuinely.",
    ],
    protocols: ["hips-hamstrings"],
  },
  {
    id: "cossack-squat",
    name: "Cossack Squat",
    aliases: ["lateral squat", "side squat", "adductor squat"],
    target: "Adductors · hips · lateral knee",
    level: 2,
    dose: "3 × 6 each side",
    equipment: "None (a counterweight helps)",
    why: "Everything else on this list is straight-line. Knees rarely fail in a straight line. This covers the sideways range that running and cutting demand and that nothing else here trains.",
    cues: [
      "Sink to one side with the other leg straight, toes up.",
      "Keep both heels down if you can; elevate them if you can't yet.",
      "Hold a light plate out front as a counterweight to sit deeper.",
    ],
    protocols: ["knee-strength", "hips-hamstrings"],
  },
  {
    id: "standing-pigeon",
    name: "Standing Pigeon",
    aliases: ["pigeon stretch", "figure four", "glute stretch", "hip external rotation"],
    target: "Glutes · hip external rotation",
    level: 1,
    dose: "60 seconds each side",
    equipment: "A table or a high box",
    why: "Restores the hip rotation that a stiff glute takes away. When the hip can't rotate, the knee twists to make up the difference — which is where the medial knee pain in runners tends to come from.",
    cues: [
      "Ankle across the opposite knee, shin on the surface.",
      "Hinge forward from the hip, spine long.",
      "Standing version keeps load off the knee itself, unlike floor pigeon.",
    ],
    protocols: ["knee-zero", "hips-hamstrings"],
  },
];

/** Video search, scoped to his channel. See groups.ts for why this isn't a stored id. */
export function rehabVideoUrl(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${name} Knees Over Toes Guy form`
  )}`;
}

const PROTOCOL_BY_ID = new Map(PROTOCOLS.map((p) => [p.id, p]));
const EXERCISE_BY_ID = new Map(EXERCISES.map((ex) => [ex.id, ex]));

/** Resolve stored pin ids. Returns undefined for ids that no longer exist. */
export function exerciseById(id: string): RehabExercise | undefined {
  return EXERCISE_BY_ID.get(id);
}

export function exercisesIn(protocol: string): RehabExercise[] {
  return EXERCISES.filter((ex) => ex.protocols.includes(protocol)).sort(
    (a, b) => a.level - b.level
  );
}

export function protocolName(id: string): string {
  return PROTOCOL_BY_ID.get(id)?.name ?? id;
}

/**
 * One searchable blob per exercise, including the names and aliases of every
 * protocol it belongs to. That's what lets "knee cap rehab" — three words that
 * appear in no exercise name — return the whole patellar protocol.
 */
const HAYSTACK = new Map(
  EXERCISES.map((ex) => {
    const fromProtocols = ex.protocols
      .map((id) => {
        const p = PROTOCOL_BY_ID.get(id);
        return p ? `${p.name} ${p.aliases.join(" ")}` : "";
      })
      .join(" ");
    return [
      ex.id,
      `${ex.name} ${ex.aliases.join(" ")} ${ex.target} ${ex.equipment} ${fromProtocols}`.toLowerCase(),
    ];
  })
);

/**
 * Search across everything, then filter by protocol.
 *
 * All words must match, so "knee cap" doesn't drag in every knee exercise. If
 * that finds nothing we fall back to ranking by how many words matched, so a
 * near-miss still returns something useful rather than an empty screen.
 */
export function searchRehab(query: string, protocol: string | "all"): RehabExercise[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const inProtocol = (ex: RehabExercise) =>
    protocol === "all" || ex.protocols.includes(protocol);

  if (!words.length) {
    return EXERCISES.filter(inProtocol).sort((a, b) => a.level - b.level);
  }

  const scored = EXERCISES.filter(inProtocol).map((ex) => {
    const hay = HAYSTACK.get(ex.id)!;
    return { ex, hits: words.filter((w) => hay.includes(w)).length };
  });

  const all = scored.filter((s) => s.hits === words.length);
  const pool = all.length ? all : scored.filter((s) => s.hits > 0);

  return pool
    .sort((a, b) => b.hits - a.hits || a.ex.level - b.ex.level)
    .map((s) => s.ex);
}
