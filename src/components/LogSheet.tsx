"use client";

import { useEffect, useState } from "react";
import Sheet from "./Sheet";
import Thumb from "./Thumb";
import ExerciseDetail from "./ExerciseDetail";
import ProgressChart from "./ProgressChart";
import Stepper from "./Stepper";
import { GROUPS, tagStyle } from "@/lib/groups";
import { formatKg, formatDayLabel, type ExerciseHistory } from "@/lib/history";
import type { CompletionEntry, LibraryExercise, PlanItem } from "@/types";

/**
 * Per-exercise logging screen: shows how the working weight has moved over
 * time, then lets you dial in today's sets/reps/kg and mark it done.
 */
export default function LogSheet({
  open,
  onClose,
  exercise,
  item,
  entry,
  history,
  isDone,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  exercise: LibraryExercise | undefined;
  item: PlanItem | null;
  /** What was already logged for this exercise on the day being viewed. */
  entry: CompletionEntry | undefined;
  history: ExerciseHistory | undefined;
  isDone: boolean;
  onSave: (next: { sets: number; reps: number; weightKg: number; markDone: boolean }) => void;
}) {
  const [sets, setSets] = useState(item?.sets ?? 3);
  const [reps, setReps] = useState(item?.reps ?? 10);
  const [weightKg, setWeightKg] = useState(item?.weightKg ?? 0);
  const [detail, setDetail] = useState(false);

  // Same reason as in ExercisePicker: closed does not mean unmounted.
  useEffect(() => {
    if (!open) setDetail(false);
  }, [open]);

  /*
   * Re-seed whenever a different exercise is opened. A day that already has a
   * completion seeds from *that*, so reopening a past session shows what you
   * lifted then rather than what the plan has since moved on to.
   */
  useEffect(() => {
    if (!item) return;
    const logged = entry?.done ? entry : null;
    setSets(logged?.setsDone ?? item.sets);
    setReps(logged?.repsDone ?? item.reps);
    setWeightKg(logged?.weightKg ?? item.weightKg);
  }, [item, entry]);

  if (!item) return null;

  const group = exercise?.group ?? "core";
  const g = GROUPS[group];
  // Suggest the last weight actually lifted, not the planned one.
  const suggestion = history?.lastKg ?? 0;

  return (
    <Sheet open={open} onClose={onClose} title="Log this exercise">
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {/* which exercise */}
        <div className="flex items-center gap-3 rounded-card bg-raised p-3">
          <Thumb
            src={exercise?.image ?? null}
            group={group}
            size={46}
            onPress={exercise ? () => setDetail(true) : undefined}
            pressLabel={exercise ? `See how to do ${exercise.name}` : undefined}
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-bold">{exercise?.name ?? "Exercise"}</div>
            <span
              className="mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[.06em]"
              style={tagStyle(g)}
            >
              {g.name}
            </span>
          </div>
        </div>

        {/* "LAST TIME" callout from the Ergonomic design — the number to beat,
            stated before you're asked to choose today's. */}
        {suggestion > 0 && (
          <div className="mt-3 rounded-card border border-accent2 bg-accent-ghost px-4 py-3.5">
            <div className="text-[10.5px] font-extrabold uppercase tracking-[.08em] text-accent-text">
              Last time
            </div>
            <p className="mt-1.5 text-[13px] text-dim">
              You logged <b className="font-bold text-text">{formatKg(suggestion)}kg</b>
              {history?.lastOn ? ` ${formatDayLabel(history.lastOn)}` : ""} — that&apos;s the number to beat.
            </p>
          </div>
        )}

        {history && history.points.length > 0 ? (
          <div className="mt-3">
            <ProgressChart points={history.points} />
          </div>
        ) : (
          <div className="mt-3 rounded-card bg-raised p-4">
            <div className="text-[11px] font-bold uppercase tracking-[.1em] text-muted">
              Working weight
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              You haven&apos;t logged this one yet. Whatever you put in now becomes the
              number to beat next time.
            </p>
          </div>
        )}

        {/* today */}
        <div className="mt-3 rounded-card bg-raised p-4">
          <div className="text-[11px] font-bold uppercase tracking-[.1em] text-muted">Today</div>

          <div className="mt-3 flex flex-col gap-3">
            <Row label="Sets">
              <Stepper label="sets" value={sets} onChange={setSets} suffix=" sets" size="lg" />
            </Row>
            <Row label="Reps">
              <Stepper label="reps" value={reps} onChange={setReps} max={200} suffix=" reps" size="lg" />
            </Row>
            <Row label="Weight">
              <Stepper
                label="weight"
                value={weightKg}
                onChange={setWeightKg}
                min={0}
                max={500}
                step={2.5}
                suffix=" kg"
                size="lg"
              />
            </Row>
          </div>

          {suggestion > 0 && weightKg !== suggestion && (
            <button
              onClick={() => setWeightKg(suggestion)}
              className="mt-3 w-full rounded-field border border-dashed border-line py-2.5 text-[13px] font-semibold text-muted transition hover:border-accent hover:text-text"
            >
              Match last time — {formatKg(suggestion)}kg
            </button>
          )}
          {suggestion > 0 && (
            <button
              onClick={() => setWeightKg(suggestion + 2.5)}
              className="mt-2 w-full rounded-field border border-dashed border-line py-2.5 text-[13px] font-semibold text-muted transition hover:border-accent hover:text-text"
            >
              Add 2.5kg — {formatKg(suggestion + 2.5)}kg
            </button>
          )}
        </div>

        <button
          onClick={() => {
            onSave({ sets, reps, weightKg, markDone: true });
            onClose();
          }}
          className={`press mt-4 h-14 w-full rounded-2xl text-[16px] font-extrabold text-on-accent shadow-lift-strong ${
            isDone ? "bg-done" : "bg-accent"
          }`}
        >
          {isDone ? "Update this log" : "Save & mark done"}
        </button>
        {/* Kept alongside the design's single CTA: adjusting a future session's
            numbers shouldn't force you to mark it as trained. */}
        <button
          onClick={() => {
            onSave({ sets, reps, weightKg, markDone: false });
            onClose();
          }}
          className="press mt-2 w-full rounded-field border border-line py-2.5 text-[13px] font-semibold text-muted"
        >
          Save without marking done
        </button>
      </div>

      <ExerciseDetail
        exercise={detail ? (exercise ?? null) : null}
        onClose={() => setDetail(false)}
      />
    </Sheet>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[14px] font-semibold">{label}</span>
      {children}
    </div>
  );
}
