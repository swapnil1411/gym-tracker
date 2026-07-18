"use client";

import { useMemo, useState } from "react";
import ProgressRing from "./ProgressRing";
import Thumb from "./Thumb";
import Stepper from "./Stepper";
import ExercisePicker from "./ExercisePicker";
import { DAYS, GROUPS, dateKey, hexA, toMondayIndex } from "@/lib/groups";
import { indexById, useLibrary } from "@/lib/library";
import { useDayCompletions, usePlan } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";

export default function DailyTracker() {
  const { logOut } = useAuth();
  const { library } = useLibrary();
  const byId = useMemo(() => indexById(library), [library]);
  const { getDay, addExercise, removeExercise, updateItem, loading } = usePlan();

  const todayIdx = toMondayIndex(new Date().getDay());
  const [selected, setSelected] = useState(todayIdx);
  const [editing, setEditing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const day = getDay(selected);

  // Completions are keyed to real calendar dates. Selecting another weekday shows
  // that day within the CURRENT week, so history and streaks stay honest.
  const selectedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (selected - todayIdx));
    return d;
  }, [selected, todayIdx]);

  const key = dateKey(selectedDate);
  const { entries, toggle } = useDayCompletions(key);

  const doneCount = day.items.filter((i) => entries[i.exerciseId]?.done).length;
  const isFuture = selectedDate > new Date() && key !== dateKey(new Date());

  return (
    <div className="flex w-full max-w-app flex-col">
      {/* ---------------------------------- header --------------------------------- */}
      <header className="border-b border-line bg-gradient-to-b from-[#12171C] to-bg px-5 pb-4 pt-[22px]">
        <div className="flex items-center justify-between gap-3.5">
          <div className="font-display text-[15px] font-black tracking-[.14em]">
            GYM<span className="text-accent">·</span>LOG
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={logOut}
              className="text-[12px] font-semibold text-muted transition hover:text-text"
            >
              Log out
            </button>
            <ProgressRing done={doneCount} total={day.items.length} />
          </div>
        </div>

        <div className="mt-3">
          <div className="font-display text-[34px] font-black uppercase leading-[.95] tracking-tight">
            {DAYS[selected].full}
          </div>
          <div className="mt-1.5 text-[13px] font-medium tracking-[.02em] text-muted">
            {day.isRestDay ? (
              <>Rest day — recover well.</>
            ) : (
              <>
                Focus: <b className="font-semibold text-text">{day.focusLabel}</b>
              </>
            )}
            {selected !== todayIdx && (
              <span className="ml-2 text-muted">
                · {selectedDate.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* --------------------------------- day pills -------------------------------- */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1.5 pt-3.5">
        {DAYS.map((d, i) => {
          const dd = getDay(i);
          const active = i === selected;
          return (
            <button
              key={d.key}
              onClick={() => {
                setSelected(i);
                setEditing(false);
              }}
              aria-pressed={active}
              className={`relative flex-none rounded-[11px] border px-3.5 py-2.5 font-display text-[12px] font-bold tracking-[.1em] transition ${
                active
                  ? "border-text bg-text text-[#101418]"
                  : "border-line bg-surface text-muted"
              }`}
            >
              {d.label}
              <small
                className={`mt-0.5 block font-body text-[9px] font-semibold capitalize tracking-[.02em] ${
                  active ? "text-[#5a636c]" : "text-muted"
                }`}
              >
                {dd.isRestDay ? "rest" : dd.focusLabel}
              </small>
              {i === todayIdx && (
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-bg bg-accent" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 px-5">
        <button
          onClick={() => setEditing((v) => !v)}
          className={`py-1.5 text-[12.5px] font-semibold transition ${
            editing ? "text-accent" : "text-muted"
          }`}
        >
          {editing ? "Done editing" : "Edit list"}
        </button>
      </div>

      {/* ----------------------------------- list ---------------------------------- */}
      <div className="flex flex-1 flex-col gap-2.5 px-4 pb-4 pt-2.5">
        {loading && <p className="py-10 text-center text-sm text-muted">Loading your plan…</p>}

        {!loading && day.items.length === 0 && (
          <div className="px-5 py-10 text-center text-sm leading-relaxed text-muted">
            {day.isRestDay ? (
              <>
                {DAYS[selected].full} is a rest day.
                <br />
                Add mobility or yoga if you want to move anyway.
              </>
            ) : (
              <>
                No exercises yet for {DAYS[selected].full}.
                <br />
                Tap <b className="text-text">+ Add exercise</b> to build this day.
              </>
            )}
          </div>
        )}

        {day.items.map((item) => {
          const ex = byId.get(item.exerciseId);
          const group = ex?.group ?? "core";
          const g = GROUPS[group];
          const isDone = Boolean(entries[item.exerciseId]?.done);

          return (
            <div
              key={item.exerciseId}
              className={`relative flex items-center gap-3 overflow-hidden rounded-2xl border p-3 transition ${
                isDone ? "border-transparent bg-[#151A18]" : "border-line bg-surface"
              } ${editing ? "pr-12" : ""}`}
            >
              <div className={isDone ? "opacity-70 grayscale-[.5]" : ""}>
                <Thumb src={ex?.image ?? null} group={group} alt="" />
              </div>

              <div className="min-w-0 flex-1">
                <div
                  className={`truncate text-[15.5px] font-bold tracking-[-.01em] transition ${
                    isDone ? "text-muted line-through decoration-done" : ""
                  }`}
                >
                  {ex?.name ?? "Unknown exercise"}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[.06em]"
                    style={{ background: hexA(g.color, 0.16), color: g.color }}
                  >
                    {g.name}
                  </span>
                  {editing ? (
                    <div className="flex items-center gap-1.5">
                      <Stepper
                        label="sets"
                        value={item.sets}
                        suffix=" sets"
                        onChange={(sets) => updateItem(selected, item.exerciseId, { sets })}
                      />
                      <Stepper
                        label="reps"
                        value={item.reps}
                        suffix=" reps"
                        max={200}
                        onChange={(reps) => updateItem(selected, item.exerciseId, { reps })}
                      />
                    </div>
                  ) : (
                    <span className="text-[12px] font-medium text-muted">
                      {item.sets} × {item.reps}
                    </span>
                  )}
                </div>
              </div>

              {!editing && (
                <button
                  onClick={() => !isFuture && toggle(item.exerciseId, item.sets)}
                  disabled={isFuture}
                  aria-pressed={isDone}
                  aria-label={`Mark ${ex?.name ?? "exercise"} ${isDone ? "not done" : "done"}`}
                  className={`flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] border-2 transition disabled:opacity-30 ${
                    isDone ? "border-done bg-done" : "border-line bg-transparent"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-4 w-4 ${isDone ? "animate-pop opacity-100" : "opacity-0"}`}
                    fill="none"
                    stroke="#101418"
                    strokeWidth={3.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 12l6 6L20 5" />
                  </svg>
                </button>
              )}

              {editing && (
                <button
                  onClick={() => removeExercise(selected, item.exerciseId)}
                  aria-label={`Remove ${ex?.name ?? "exercise"}`}
                  className="absolute bottom-0 right-0 top-0 w-11 text-lg text-muted transition hover:text-accent"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={() => setPickerOpen(true)}
          className="mt-1 flex items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-line py-[15px] text-sm font-semibold text-muted transition hover:border-accent hover:text-text"
        >
          <span className="text-lg leading-none">+</span> Add exercise
        </button>
      </div>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={(id) => addExercise(selected, id)}
        existingIds={new Set(day.items.map((i) => i.exerciseId))}
        dayLabel={DAYS[selected].full}
      />
    </div>
  );
}
