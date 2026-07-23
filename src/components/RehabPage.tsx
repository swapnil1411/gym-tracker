"use client";

import { useMemo, useState } from "react";
import Sheet from "./Sheet";
import { chipStyle } from "@/lib/groups";
import {
  EXERCISES,
  LEVELS,
  PROTOCOLS,
  exerciseById,
  exercisesIn,
  protocolName,
  rehabVideoUrl,
  searchRehab,
  type Level,
  type RehabExercise,
} from "@/lib/rehab";
import { useRehabLists, type RehabList } from "@/lib/rehab-store";

const LEVEL_COLOR: Record<Level, string> = {
  1: "rgb(var(--success))",
  2: "rgb(var(--accent))",
  3: "rgb(var(--pr))",
};

function LevelTag({ level }: { level: Level }) {
  return (
    <span
      className="flex-none rounded-md px-1.5 py-0.5 text-[10px] font-label font-bold uppercase tracking-[.06em]"
      style={{
        background: `color-mix(in srgb, ${LEVEL_COLOR[level]} calc(var(--tag-alpha) * 100%), transparent)`,
        color: LEVEL_COLOR[level],
      }}
    >
      {LEVELS[level].label}
    </span>
  );
}

/** Resolve stored ids, dropping any that no longer exist in the library. */
function resolve(ids: string[]): RehabExercise[] {
  return ids.map(exerciseById).filter((ex): ex is RehabExercise => !!ex);
}

/* A row is two controls, so it can't be one <button> — a button inside a
   button is invalid HTML and breaks keyboard navigation. */
function Row({
  ex,
  onOpen,
  action,
}: {
  ex: RehabExercise;
  onOpen: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1 rounded-card border border-line bg-surface pr-2">
      <button
        onClick={onOpen}
        className="press flex min-w-0 flex-1 items-center gap-3.5 py-3 pl-3.5 text-left"
      >
        {/* The design leads with a thumbnail; the library has no photos, so a
            surface-3 icon tile holds the slot. */}
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-tile border border-line bg-surface3 text-dim">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M13 4a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zM4 20l4.5-2 1.5-5.5L8 9l4-2.5 3 3 3.5.5M10 12l-2 8" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-extrabold">{ex.name}</span>
          <span className="mt-0.5 block truncate text-[12px] font-medium text-dim">
            {ex.target}
          </span>
        </span>
        <LevelTag level={ex.level} />
        {!action && (
          <span aria-hidden="true" className="flex-none pl-1 text-mute">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </button>
      {action}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              exercise detail                               */
/* -------------------------------------------------------------------------- */

function Detail({
  exercise,
  onClose,
  lists,
  onToggleIn,
}: {
  exercise: RehabExercise | null;
  onClose: () => void;
  lists: RehabList[];
  onToggleIn: (listId: string) => void;
}) {
  if (!exercise) return null;
  return (
    <Sheet open onClose={onClose} elevated title={exercise.name} subtitle={exercise.target}>
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <div className="flex flex-wrap gap-2">
          <LevelTag level={exercise.level} />
          {exercise.protocols.map((p) => (
            <span
              key={p}
              className="rounded-md bg-raised px-1.5 py-0.5 text-[10px] font-label font-bold uppercase tracking-[.06em] text-muted"
            >
              {protocolName(p)}
            </span>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-field bg-raised px-3 py-2.5">
            <div className="text-[9.5px] font-label font-bold uppercase tracking-[.06em] text-mute">Dose</div>
            <div className="mt-1 text-[13px] font-semibold">{exercise.dose}</div>
          </div>
          <div className="rounded-field bg-raised px-3 py-2.5">
            <div className="text-[9.5px] font-label font-bold uppercase tracking-[.06em] text-mute">
              Equipment
            </div>
            <div className="mt-1 text-[13px] font-semibold">{exercise.equipment}</div>
          </div>
        </div>

        <h4 className="mt-4 text-[11px] font-label font-bold uppercase tracking-[.1em] text-mute">
          Why it&apos;s here
        </h4>
        <p className="mt-1.5 text-[13.5px] leading-[1.55] text-muted">{exercise.why}</p>

        <h4 className="mt-4 text-[11px] font-label font-bold uppercase tracking-[.1em] text-mute">
          Get it right
        </h4>
        <ul className="mt-1.5 flex flex-col gap-1.5">
          {exercise.cues.map((c) => (
            <li key={c} className="flex gap-2 text-[13.5px] leading-[1.5]">
              <span aria-hidden="true" className="flex-none pt-[3px] text-accent">
                ▸
              </span>
              <span className="text-muted">{c}</span>
            </li>
          ))}
        </ul>

        {lists.length > 0 && (
          <>
            <h4 className="mt-4 text-[11px] font-label font-bold uppercase tracking-[.1em] text-mute">
              Save to list
            </h4>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {lists.map((l) => {
                const on = l.exerciseIds.includes(exercise.id);
                return (
                  <button
                    key={l.id}
                    onClick={() => onToggleIn(l.id)}
                    aria-pressed={on}
                    className={`press rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition ${
                      on
                        ? "border-accent bg-accent text-on-accent"
                        : "border-line bg-raised text-muted"
                    }`}
                  >
                    {on ? "✓ " : "+ "}
                    {l.name}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <a
          href={rehabVideoUrl(exercise.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="press mt-5 flex items-center justify-center gap-2 rounded-field bg-accent py-3 text-[13.5px] font-bold text-on-accent shadow-lift-strong active:shadow-none"
        >
          Watch on YouTube ↗
        </a>
        <p className="mt-2 text-center text-[11px] text-mute">
          Opens a search of his channel, so you always get a live video.
        </p>
      </div>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/*                          add-to-list search picker                         */
/* -------------------------------------------------------------------------- */

/**
 * Searching is how you *fill* a list — that's the whole point of this sheet.
 * Tapping a row toggles membership and leaves the sheet open, so you can add
 * six moves from six different searches without it closing on you each time.
 */
function AddSheet({
  list,
  onClose,
  onToggle,
  onAddMany,
}: {
  list: RehabList | null;
  onClose: () => void;
  onToggle: (exerciseId: string) => void;
  onAddMany: (ids: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const results = useMemo(() => searchRehab(q, "all"), [q]);
  if (!list) return null;
  const inList = new Set(list.exerciseIds);

  return (
    <Sheet
      open
      onClose={onClose}
      elevated
      title={`Add to ${list.name}`}
      subtitle={`${list.exerciseIds.length} in this list. Search, or add a whole protocol.`}
    >
      <div className="px-4 pb-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search — try “knee cap rehab”…"
          aria-label="Search rehab exercises"
          autoFocus
          className="w-full rounded-field bg-raised px-3.5 py-2.5 text-[14px] outline-none placeholder:text-muted/70 focus:border-accent"
        />
      </div>

      {!q.trim() && (
        <div className="border-b border-line px-4 pb-3">
          <div className="mb-1.5 text-[10.5px] font-label font-bold uppercase tracking-[.08em] text-mute">
            Add a whole protocol
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PROTOCOLS.map((p) => (
              <button
                key={p.id}
                onClick={() => onAddMany(exercisesIn(p.id).map((e) => e.id))}
                className="press rounded-full bg-raised px-3 py-1.5 text-[12px] font-semibold text-muted"
              >
                + {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-3">
        {results.length === 0 && (
          <p className="py-10 text-center text-[13px] text-muted">
            Nothing matches “{q.trim()}”. Try “knee”, “ankle” or “hamstring”.
          </p>
        )}
        <div className="flex flex-col gap-2">
          {results.map((ex) => {
            const on = inList.has(ex.id);
            return (
              <div
                key={ex.id}
                className="flex items-center gap-3 rounded-card bg-raised px-3.5 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold">{ex.name}</div>
                  <div className="mt-0.5 truncate text-[11px] text-muted">{ex.target}</div>
                </div>
                <LevelTag level={ex.level} />
                <button
                  onClick={() => onToggle(ex.id)}
                  aria-pressed={on}
                  aria-label={`${on ? "Remove" : "Add"} ${ex.name}`}
                  className={
                    on
                      ? "press flex-none rounded-field border border-done/40 bg-done/10 px-3 py-2 text-[12.5px] font-bold text-done-text"
                      : "press flex-none rounded-field bg-accent px-3 py-2 text-[12.5px] font-bold text-on-accent shadow-lift-strong active:shadow-none"
                  }
                >
                  {on ? "✓ Added" : "Add"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  the page                                  */
/* -------------------------------------------------------------------------- */

export default function RehabPage() {
  const { lists, createList, deleteList, renameList, toggleIn, addMany } = useRehabLists();

  const [q, setQ] = useState("");
  const [protocol, setProtocol] = useState<string>("knee-cap");
  const [detail, setDetail] = useState<RehabExercise | null>(null);
  const [openListId, setOpenListId] = useState<string | null>(null);
  const [addingToId, setAddingToId] = useState<string | null>(null);
  const [naming, setNaming] = useState<{ seed: string[]; name: string } | null>(null);

  const searching = q.trim().length > 0;
  // Search spans every protocol — otherwise typing "hamstring" with the knee
  // chip up returns nothing and looks broken.
  const results = useMemo(
    () => searchRehab(q, searching ? "all" : protocol),
    [q, protocol, searching]
  );
  const active = PROTOCOLS.find((p) => p.id === protocol);

  const openList = lists.find((l) => l.id === openListId) ?? null;
  const addingTo = lists.find((l) => l.id === addingToId) ?? null;

  return (
    <div className="mx-auto flex w-full max-w-app flex-col md:max-w-2xl">
      <header className="px-5 pb-2 pt-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-[28px] font-extrabold tracking-[-.02em]">Rehab</h1>
          {/* The design's gold system badge — achievement gold names the method,
              it isn't a PR, but it's the same "special" register. */}
          <span className="flex-none rounded-md bg-pr2 px-2 py-1 text-[10px] font-label font-extrabold uppercase tracking-[.1em] text-pr">
            ATG System
          </span>
        </div>
        <p className="mt-2 text-[13px] leading-[1.5] text-muted">
          Unlock structural integrity through progressive length and strength. Move without
          limits — full range, ground up, always pain-free.
        </p>
      </header>

      {/* -------------------------------- lists ------------------------------- */}
      <div className="flex flex-col gap-2 px-5 pt-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-[17px] font-extrabold tracking-[-.01em]">My Lists</h2>
          <button
            onClick={() => setNaming({ seed: [], name: "" })}
            className="press text-[13px] font-bold text-accent"
          >
            + New list
          </button>
        </div>

        {lists.length === 0 ? (
          /* An empty state that does the work: the list they actually said they
             wanted is one tap away, pre-filled, instead of a blank prompt. */
          <div className="rounded-card border border-dashed border-line px-4 py-5 text-center">
            <p className="text-[13px] text-muted">
              Build a routine you can open every morning — the moves you like, in one place.
            </p>
            <button
              onClick={() =>
                setNaming({
                  seed: exercisesIn("knee-cap").map((e) => e.id),
                  name: "Knee cap rehab",
                })
              }
              className="press mt-3 w-full rounded-field bg-accent py-2.5 text-[13px] font-bold text-on-accent shadow-lift-strong active:shadow-none"
            >
              Start a knee cap rehab list
            </button>
          </div>
        ) : (
          /* The design's bento grid — two list tiles per row, an icon tile up
             top, name and count below. */
          <div className="grid grid-cols-2 gap-3">
            {lists.map((l, i) => (
              <button
                key={l.id}
                onClick={() => setOpenListId(l.id)}
                className="press rounded-card border border-line bg-surface p-4 text-left"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-tile ${
                    i % 2 === 0 ? "bg-accent-ghost text-accent" : "bg-pr2 text-pr"
                  }`}
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {i % 2 === 0 ? (
                      <path d="M6.5 7v10M17.5 7v10M6.5 12h11M4 9.5v5M20 9.5v5" />
                    ) : (
                      <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2z" />
                    )}
                  </svg>
                </span>
                <span className="mt-3 block truncate text-[15px] font-extrabold">{l.name}</span>
                <span className="mt-0.5 block text-[12px] font-medium text-dim">
                  {l.exerciseIds.length} {l.exerciseIds.length === 1 ? "exercise" : "exercises"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------- browse ------------------------------- */}
      <div className="mt-5 border-t border-line pt-4">
        {/* Blurred, not solid: the spotlight gradient shows through, per the
            design's "3px backdrop blur on sticky headers". */}
        <div className="sticky top-0 z-10 bg-bg/80 px-5 pb-3 backdrop-blur-[3px]">
          <div className="flex items-center gap-2.5 rounded-[14px] bg-raised px-4 py-3 focus-within:ring-1 focus-within:ring-accent">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="flex-none text-mute">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={2} />
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search all moves…"
              aria-label="Search rehab exercises"
              className="w-full min-w-0 bg-transparent text-[14px] outline-none placeholder:text-dim"
            />
          </div>
        </div>

        {!searching && (
          <div className="pb-3">
            <div
              className="no-scrollbar flex gap-2 overflow-x-auto px-5"
              style={{
                maskImage:
                  "linear-gradient(to right, transparent, #000 14px, #000 calc(100% - 14px), transparent)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, #000 14px, #000 calc(100% - 14px), transparent)",
              }}
            >
              {PROTOCOLS.map((p) => {
                const on = p.id === protocol;
                return (
                  <button
                    key={p.id}
                    onClick={() => setProtocol(p.id)}
                    aria-pressed={on}
                    style={chipStyle(on)}
                    className={`h-9 flex-none rounded-full px-3.5 text-[13px] font-semibold transition ${
                      on ? "shadow-lift-strong" : "bg-raised text-muted"
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 px-5 pb-6">
          {!searching && active && (
            <>
              <p className="text-[12.5px] leading-[1.55] text-muted">{active.blurb}</p>
              <button
                onClick={() =>
                  setNaming({
                    seed: exercisesIn(active.id).map((e) => e.id),
                    name: active.name,
                  })
                }
                className="press mb-1 w-full rounded-field border border-accent/40 bg-accent/10 py-2.5 text-[12.5px] font-semibold text-accent-text"
              >
                Make a list from “{active.name}”
              </button>
            </>
          )}
          {searching && (
            <p className="mb-1 text-[12px] text-mute">
              {results.length} {results.length === 1 ? "move" : "moves"} for “{q.trim()}”
            </p>
          )}

          {searching && results.length === 0 && (
            <p className="py-10 text-center text-[13px] text-muted">
              Nothing matches “{q.trim()}”. Try “knee”, “ankle” or “hamstring”.
            </p>
          )}

          {!searching && (
            <h2 className="mb-1 mt-2 font-display text-[17px] font-extrabold tracking-[-.01em]">
              Discover Moves
            </h2>
          )}
          {results.map((ex) => (
            <Row key={ex.id} ex={ex} onOpen={() => setDetail(ex)} />
          ))}

          {/*
           * Attribution and the medical caveat, not buried in a settings screen.
           * These are somebody else's ideas, and a rehab list that doesn't say
           * "stop if it hurts" is worse than no rehab list.
           */}
          <p className="mt-4 text-[11px] leading-[1.55] text-mute">
            {EXERCISES.length} movements, summarised in our own words from the publicly
            taught Knees Over Toes / ATG progressions by Ben Patrick. Not affiliated with
            him, and not medical advice — if a knee is painful, swollen or unstable, get it
            looked at before loading it. Nothing here should hurt while you do it.
          </p>
        </div>
      </div>

      {/* ------------------------------- naming ------------------------------- */}
      <Sheet
        open={!!naming}
        onClose={() => setNaming(null)}
        title="Name your list"
        subtitle={
          naming?.seed.length
            ? `Starting with ${naming.seed.length} moves — you can add or remove any of them after.`
            : "An empty list. Add moves by searching."
        }
      >
        <div className="px-5 pb-8">
          <input
            value={naming?.name ?? ""}
            onChange={(e) => setNaming((n) => (n ? { ...n, name: e.target.value } : n))}
            placeholder="Knee cap rehab"
            aria-label="List name"
            autoFocus
            className="w-full rounded-field bg-raised px-3.5 py-3 text-[15px] font-semibold outline-none placeholder:font-normal placeholder:text-muted/70 focus:border-accent"
          />
          <button
            onClick={() => {
              if (!naming) return;
              const id = createList(naming.name || "Knee cap rehab", naming.seed);
              setNaming(null);
              setOpenListId(id);
            }}
            className="press mt-3 w-full rounded-field bg-accent py-3 text-[13.5px] font-bold text-on-accent shadow-lift-strong active:shadow-none"
          >
            Create list
          </button>
        </div>
      </Sheet>

      {/* ------------------------------ list view ----------------------------- */}
      <Sheet
        open={!!openList}
        onClose={() => setOpenListId(null)}
        title={openList?.name ?? ""}
        subtitle={`${openList?.exerciseIds.length ?? 0} moves. Tap one for cues and a video.`}
      >
        {openList && (
          <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-8">
            <input
              value={openList.name}
              onChange={(e) => renameList(openList.id, e.target.value)}
              aria-label="Rename list"
              className="mb-3 w-full rounded-field bg-raised px-3.5 py-2.5 text-[14px] font-semibold outline-none focus:border-accent"
            />

            <div className="flex flex-col gap-2">
              {resolve(openList.exerciseIds).map((ex) => (
                <Row
                  key={ex.id}
                  ex={ex}
                  onOpen={() => setDetail(ex)}
                  action={
                    <button
                      onClick={() => toggleIn(openList.id, ex.id)}
                      aria-label={`Remove ${ex.name} from ${openList.name}`}
                      className="press flex h-10 w-10 flex-none items-center justify-center rounded-field text-[16px] text-mute"
                    >
                      ✕
                    </button>
                  }
                />
              ))}
              {openList.exerciseIds.length === 0 && (
                <p className="py-8 text-center text-[13px] text-muted">
                  Empty so far. Add some moves below.
                </p>
              )}
            </div>

            <button
              onClick={() => setAddingToId(openList.id)}
              className="press mt-3 w-full rounded-field bg-accent py-3 text-[13.5px] font-bold text-on-accent shadow-lift-strong active:shadow-none"
            >
              + Add exercises
            </button>
            <button
              onClick={() => {
                deleteList(openList.id);
                setOpenListId(null);
              }}
              className="press mt-2 w-full rounded-field border border-line py-2.5 text-[12.5px] font-semibold text-mute"
            >
              Delete list
            </button>
          </div>
        )}
      </Sheet>

      <AddSheet
        list={addingTo}
        onClose={() => setAddingToId(null)}
        onToggle={(exId) => addingTo && toggleIn(addingTo.id, exId)}
        onAddMany={(ids) => addingTo && addMany(addingTo.id, ids)}
      />

      <Detail
        exercise={detail}
        onClose={() => setDetail(null)}
        lists={lists}
        onToggleIn={(listId) => detail && toggleIn(listId, detail.id)}
      />
    </div>
  );
}
