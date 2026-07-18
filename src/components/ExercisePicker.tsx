"use client";

import { useMemo, useState } from "react";
import Sheet from "./Sheet";
import Thumb from "./Thumb";
import { GROUPS, GROUP_KEYS, hexA } from "@/lib/groups";
import { searchLibrary, useLibrary } from "@/lib/library";
import type { MuscleGroup } from "@/types";

export default function ExercisePicker({
  open,
  onClose,
  onAdd,
  existingIds,
  dayLabel,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (exerciseId: string) => void;
  existingIds: Set<string>;
  dayLabel: string;
}) {
  const { library, loading, error } = useLibrary();
  const [group, setGroup] = useState<MuscleGroup | "all">("chest");
  const [q, setQ] = useState("");

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
          className="w-full rounded-xl border border-line bg-raised px-3.5 py-2.5 text-[14px] outline-none placeholder:text-muted/70 focus:border-accent"
        />
      </div>

      {!q.trim() && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
          {GROUP_KEYS.map((k) => {
            const g = GROUPS[k];
            const active = k === group;
            return (
              <button
                key={k}
                onClick={() => setGroup(k)}
                aria-pressed={active}
                style={{
                  borderColor: active ? g.color : undefined,
                  borderWidth: active ? 2 : 1,
                  padding: active ? "8px 12px" : "9px 13px",
                }}
                className="flex flex-none items-center gap-1.5 rounded-xl border border-line bg-raised text-[13px] font-semibold transition"
              >
                <span aria-hidden="true">{g.icon}</span>
                {g.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-8">
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
                className="flex items-center gap-3 rounded-[13px] border border-line bg-raised px-3 py-2.5"
              >
                <Thumb src={ex.image} group={ex.group} size={42} radius={10} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-semibold">{ex.name}</div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[.06em]"
                      style={{ background: hexA(g.color, 0.16), color: g.color }}
                    >
                      {g.name}
                    </span>
                    {ex.equipment && (
                      <span className="truncate text-[11px] text-muted">{ex.equipment}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => !added && onAdd(ex.id)}
                  disabled={added}
                  className={
                    added
                      ? "flex-none rounded-[10px] border border-done bg-raised px-3.5 py-2 text-[13px] font-bold text-done"
                      : "flex-none rounded-[10px] bg-accent px-3.5 py-2 text-[13px] font-bold text-white transition active:scale-95"
                  }
                >
                  {added ? "✓ Added" : "Add"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}
