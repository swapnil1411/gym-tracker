"use client";

import { useEffect, useState } from "react";
import Sheet from "./Sheet";
import Thumb from "./Thumb";
import ExerciseDetail from "./ExerciseDetail";
import ProgressChart from "./ProgressChart";
import Stepper from "./Stepper";
import { GROUPS, tagStyle } from "@/lib/groups";
import { formatKg, formatDayLabel, type ExerciseHistory } from "@/lib/history";
import { roundKcal } from "@/lib/activities";
import {
  cardioFromItem,
  cardioKcal,
  cardioMeta,
  cardioSummary,
  formatNum,
  isCardio,
} from "@/lib/cardio";
import { useBody } from "@/lib/body";
import type { CompletionEntry, LibraryExercise, PlanItem } from "@/types";

export interface LoggedInput {
  sets: number;
  reps: number;
  weightKg: number;
  minutes?: number;
  speedKmh?: number;
  inclinePct?: number;
  kcal?: number;
  markDone: boolean;
}

/**
 * Per-exercise logging screen.
 *
 * Two shapes, chosen by the exercise itself. Strength shows how the working
 * weight has moved and asks for sets/reps/kg. Cardio asks for minutes, and for
 * speed and gradient when it's a treadmill, and answers in calories — because
 * "heaviest ever" is not a thing that happens on a treadmill, and a machine you
 * never load has no working weight to chart.
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
  onSave: (next: LoggedInput) => void;
}) {
  const { body } = useBody();
  const [sets, setSets] = useState(item?.sets ?? 3);
  const [reps, setReps] = useState(item?.reps ?? 10);
  const [weightKg, setWeightKg] = useState(item?.weightKg ?? 0);
  const [minutes, setMinutes] = useState(20);
  const [speedKmh, setSpeedKmh] = useState(5.5);
  const [inclinePct, setInclinePct] = useState(10);
  const [detail, setDetail] = useState(false);

  // Same reason as in ExercisePicker: closed does not mean unmounted.
  useEffect(() => {
    if (!open) setDetail(false);
  }, [open]);

  /*
   * Re-seed whenever a different exercise is opened. A day that already has a
   * completion seeds from *that*, so reopening a past session shows what you
   * did then rather than what the plan has since moved on to.
   */
  useEffect(() => {
    if (!item) return;
    const logged = entry?.done ? entry : null;
    setSets(logged?.setsDone ?? item.sets);
    setReps(logged?.repsDone ?? item.reps);
    setWeightKg(logged?.weightKg ?? item.weightKg);

    const c = cardioFromItem(item, exercise);
    setMinutes(logged?.minutesDone || c.minutes);
    setSpeedKmh(logged?.speedKmh ?? c.speedKmh);
    setInclinePct(logged?.inclinePct ?? c.inclinePct);
  }, [item, entry, exercise]);

  if (!item) return null;

  const group = exercise?.group ?? "core";
  const g = GROUPS[group];
  const cardio = isCardio(exercise);
  const treadmill = cardioMeta(exercise).mode === "treadmill";
  // Suggest the last weight actually lifted, not the planned one.
  const suggestion = history?.lastKg ?? 0;

  const kcal = roundKcal(cardioKcal({ minutes, speedKmh, inclinePct }, exercise, body.weightKg));
  const save = (markDone: boolean) => {
    onSave(
      cardio
        ? { sets: 1, reps: 0, weightKg: 0, minutes, speedKmh, inclinePct, kcal, markDone }
        : { sets, reps, weightKg, markDone }
    );
    onClose();
  };

  const lastCardio =
    history && history.lastOn && history.lastMinutes > 0
      ? cardioSummary(
          {
            minutes: history.lastMinutes,
            speedKmh: history.lastSpeedKmh,
            inclinePct: history.lastInclinePct,
          },
          exercise
        )
      : null;

  return (
    <Sheet open={open} onClose={onClose} title={cardio ? "Log this cardio" : "Log this exercise"}>
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
        {cardio ? (
          lastCardio && (
            <div className="mt-3 rounded-card border border-accent2 bg-accent-ghost px-4 py-3.5">
              <div className="text-[10.5px] font-extrabold uppercase tracking-[.08em] text-accent-text">
                Last time
              </div>
              <p className="mt-1.5 text-[13px] text-dim">
                <b className="font-bold text-text">{lastCardio}</b>
                {history?.lastOn ? ` ${formatDayLabel(history.lastOn)}` : ""}
                {history && history.lastKcal > 0 && ` — about ${roundKcal(history.lastKcal)} kcal.`}
              </p>
            </div>
          )
        ) : (
          suggestion > 0 && (
            <div className="mt-3 rounded-card border border-accent2 bg-accent-ghost px-4 py-3.5">
              <div className="text-[10.5px] font-extrabold uppercase tracking-[.08em] text-accent-text">
                Last time
              </div>
              <p className="mt-1.5 text-[13px] text-dim">
                You logged <b className="font-bold text-text">{formatKg(suggestion)}kg</b>
                {history?.lastOn ? ` ${formatDayLabel(history.lastOn)}` : ""} — that&apos;s the
                number to beat.
              </p>
            </div>
          )
        )}

        {/*
         * The progression chart plots working weight, so it only belongs on the
         * strength side. Cardio's equivalent is the calorie figure below, which
         * moves with all three of its numbers at once.
         */}
        {!cardio &&
          (history && history.points.length > 0 ? (
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
          ))}

        {/* today */}
        <div className="mt-3 rounded-card bg-raised p-4">
          <div className="text-[11px] font-bold uppercase tracking-[.1em] text-muted">Today</div>

          {cardio ? (
            <>
              <div className="mt-3 flex flex-col gap-3">
                <Row label="Time">
                  <Stepper
                    label="minutes"
                    value={minutes}
                    onChange={setMinutes}
                    min={1}
                    max={240}
                    step={1}
                    suffix=" min"
                    size="lg"
                  />
                </Row>
                {treadmill && (
                  <>
                    <Row label="Speed">
                      <Stepper
                        label="speed"
                        value={speedKmh}
                        onChange={setSpeedKmh}
                        min={0.5}
                        max={22}
                        step={0.5}
                        suffix=" km/h"
                        size="lg"
                      />
                    </Row>
                    <Row label="Incline">
                      <Stepper
                        label="incline"
                        value={inclinePct}
                        onChange={setInclinePct}
                        min={0}
                        max={40}
                        step={1}
                        suffix="%"
                        size="lg"
                      />
                    </Row>
                  </>
                )}
              </div>

              {lastCardio && (
                <button
                  onClick={() => {
                    setMinutes(history!.lastMinutes);
                    setSpeedKmh(history!.lastSpeedKmh);
                    setInclinePct(history!.lastInclinePct);
                  }}
                  className="mt-3 w-full rounded-field border border-dashed border-line py-2.5 text-[13px] font-semibold text-muted transition hover:border-accent hover:text-text"
                >
                  Match last time — {lastCardio}
                </button>
              )}
            </>
          ) : (
            <>
              <div className="mt-3 flex flex-col gap-3">
                <Row label="Sets">
                  <Stepper label="sets" value={sets} onChange={setSets} suffix=" sets" size="lg" />
                </Row>
                <Row label="Reps">
                  <Stepper
                    label="reps"
                    value={reps}
                    onChange={setReps}
                    max={200}
                    suffix=" reps"
                    size="lg"
                  />
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
            </>
          )}
        </div>

        {/* Cardio's progress measure. Live, because the number is the reason
            you're touching the incline button at all. */}
        {cardio &&
          (body.weightKg ? (
            <div className="mt-3 rounded-card border border-accent2 bg-accent-ghost px-4 py-3.5 text-center">
              <div className="text-[10.5px] font-extrabold uppercase tracking-[.08em] text-accent-text">
                Approx. burn
              </div>
              <div className="mt-1 font-display text-[38px] font-bold leading-none tabular-nums">
                {kcal}
                <span className="ml-1.5 text-[13px] font-semibold text-dim">kcal</span>
              </div>
              {treadmill && (
                <p className="mt-1.5 text-[11px] text-mute">
                  {formatNum(speedKmh)} km/h at {formatNum(inclinePct)}% ·{" "}
                  {speedKmh >= 6.4 ? "ACSM running" : "ACSM walking"} equation
                </p>
              )}
            </div>
          ) : (
            <p className="mt-3 rounded-card bg-raised p-4 text-[13px] leading-relaxed text-muted">
              Add your weight on the Body page and this will start estimating calories —
              every one of these formulas scales with bodyweight, so there&apos;s nothing
              honest to show without it.
            </p>
          ))}

        <button
          onClick={() => save(true)}
          className={`press mt-4 h-14 w-full rounded-2xl text-[16px] font-extrabold text-on-accent shadow-lift-strong ${
            isDone ? "bg-done" : "bg-accent"
          }`}
        >
          {isDone ? "Update this log" : "Save & mark done"}
        </button>
        {/* Kept alongside the design's single CTA: adjusting a future session's
            numbers shouldn't force you to mark it as trained. */}
        <button
          onClick={() => save(false)}
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
