"use client";

import { useEffect, useMemo, useState } from "react";
import Sheet from "./Sheet";
import Thumb from "./Thumb";
import ExerciseDetail from "./ExerciseDetail";
import { GROUPS, GROUP_KEYS, chipStyle, tagStyle } from "@/lib/groups";
import { searchLibrary, useLibrary } from "@/lib/library";
import type { LibraryExercise, MuscleGroup } from "@/types";

export default function ExercisePicker({
  open,
  onClose,
  onAdd,
  onRemove,
  existingIds,
  dayLabel,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (exerciseId: string) => void;
  /** Added is a toggle, not a dead end — tapping it again takes it back out. */
  onRemove: (exerciseId: string) => void;
  existingIds: Set<string>;
  dayLabel: string;
}) {
  const { library, loading, error } = useLibrary();
  const [group, setGroup] = useState<MuscleGroup | "all">("chest");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<LibraryExercise | null>(null);

  /*
   * This component stays mounted while its sheet is closed, so the detail view
   * has to be torn down explicitly — otherwise reopening "Add exercise" drops
   * you straight back into whichever image you last had open.
   */
  useEffect(() => {
    if (!open) setDetail(null);
  }, [open]);

  // A search should look across every group, not just the selected chip.
  const results = useMemo(
    () => searchLibrary(library, q.trim() ? "all" : group, q),
    [library, group, q]
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add exercise"
      subtitle={`Tap to add to ${dayLabel}. ${library ? library.exercises.length : "…"} moves available offline.`}
    >
      <div className="px-4 pb-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search all exercises…"
          className="w-full rounded-field bg-raised px-3.5 py-2.5 text-[14px] outline-none placeholder:text-muted/70 focus:border-accent"
        />
      </div>

      {!q.trim() && (
        /*
         * The row scrolls sideways, so it needs to read as its own bar rather
         * than as the first item of the list underneath: hence the rule at the
         * bottom, and the mask that fades the chips out at both edges to show
         * there is more to scroll to.
         */
        <div className="relative border-b border-line pb-3">
          <div
            className="no-scrollbar flex gap-2 overflow-x-auto px-4"
            style={{
              maskImage:
                "linear-gradient(to right, transparent, #000 14px, #000 calc(100% - 14px), transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, #000 14px, #000 calc(100% - 14px), transparent)",
            }}
          >
            {GROUP_KEYS.map((k) => {
              const g = GROUPS[k];
              const active = k === group;
              return (
                <button
                  key={k}
                  onClick={() => setGroup(k)}
                  aria-pressed={active}
                  style={chipStyle(active)}
                  className={`flex h-9 flex-none items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold transition ${
                    active ? "shadow-lift-strong" : "bg-raised text-muted"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 flex-none rounded-full"
                    // On the accent fill the hue would muddy, so it goes white.
                    style={{ background: active ? "rgb(var(--on-accent))" : g.color }}
                  />
                  {g.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-3">
        {loading && <p className="py-10 text-center text-sm text-muted">Loading library…</p>}
        {error && (
          <p className="py-10 text-center text-sm text-muted">
            Couldn&apos;t load the exercise library. {error}
          </p>
        )}
        {!loading && !error && results.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">No exercises match “{q}”.</p>
        )}

        <div className="flex flex-col gap-2">
          {results.map((ex) => {
            const added = existingIds.has(ex.id);
            const g = GROUPS[ex.group];
            return (
              <div
                key={ex.id}
                className="flex items-center gap-3 rounded-card bg-raised px-3 py-2.5"
              >
                <Thumb
                  src={ex.image}
                  group={ex.group}
                  size={42}
                  radius={10}
                  onPress={() => setDetail(ex)}
                  pressLabel={`See how to do ${ex.name}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-semibold">{ex.name}</div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[10px] font-label font-bold uppercase tracking-[.06em]"
                      style={tagStyle(g)}
                    >
                      {g.name}
                    </span>
                    {ex.equipment && (
                      <span className="truncate text-[11px] text-muted">{ex.equipment}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => (added ? onRemove(ex.id) : onAdd(ex.id))}
                  aria-pressed={added}
                  aria-label={`${added ? "Remove" : "Add"} ${ex.name}`}
                  className={
                    added
                      ? "press flex-none rounded-field border border-done/40 bg-done/10 px-3.5 py-2 text-[13px] font-bold text-done-text"
                      : "press flex-none rounded-field bg-accent px-3.5 py-2 text-[13px] font-bold text-on-accent shadow-lift-strong active:shadow-none"
                  }
                >
                  {added ? "✓ Added" : "Add"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <ExerciseDetail exercise={detail} onClose={() => setDetail(null)} />
    </Sheet>
  );
}
