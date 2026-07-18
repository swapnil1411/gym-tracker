"use client";

import { useEffect, useMemo, useState } from "react";
import ProgressRing from "./ProgressRing";
import Thumb from "./Thumb";
import ExerciseDetail from "./ExerciseDetail";
import Stepper from "./Stepper";
import ExercisePicker from "./ExercisePicker";
import LogSheet from "./LogSheet";
import ThemeToggle from "./ThemeToggle";
import WorkoutSlider from "./WorkoutSlider";
import { DAYS, GROUPS, dateKey, tagStyle, toMondayIndex } from "@/lib/groups";
import { indexById, useLibrary } from "@/lib/library";
import { useDayCompletions } from "@/lib/store";
import { useSchedule, useWorkouts, useLegacyPlanMigration } from "@/lib/workouts";
import { useExerciseHistory, formatKg, formatDayLabel } from "@/lib/history";
import { useAuth } from "@/lib/auth-context";
import type { LibraryExercise } from "@/types";

export default function DailyTracker() {
  const { logOut } = useAuth();
  const { library } = useLibrary();
  const byId = useMemo(() => indexById(library), [library]);

  const {
    workouts,
    ordered,
    loading,
    create,
    rename,
    addExercise,
    removeExercise,
    updateItem,
  } = useWorkouts();
  const { resolve, assign, clearAssignment, loading: schedLoading } = useSchedule();
  const { history } = useExerciseHistory();

  // Import the old plan/{weekday} docs once, but only after the workouts
  // collection has actually reported empty — otherwise a slow first snapshot
  // looks like "no workouts" and the import runs against live data twice.
  useLegacyPlanMigration(!loading && !schedLoading && ordered.length === 0);

  const todayIdx = toMondayIndex(new Date().getDay());
  const [selected, setSelected] = useState(todayIdx);
  const [editing, setEditing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [logId, setLogId] = useState<string | null>(null);
  const [detail, setDetail] = useState<LibraryExercise | null>(null);
  const [nameEditing, setNameEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  // The strip selects a date within the current week; completions are keyed to
  // real dates so streaks and history stay honest.
  const selectedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (selected - todayIdx));
    return d;
  }, [selected, todayIdx]);

  const key = dateKey(selectedDate);
  const { entries, toggle, setCompletion } = useDayCompletions(key);

  const { workoutId, isOverride } = resolve(key);
  // A workout can be deleted while dates still point at it.
  const workout = workoutId ? workouts[workoutId] ?? null : null;
  const items = workout?.items ?? [];

  const doneCount = items.filter((i) => entries[i.exerciseId]?.done).length;
  const isFuture = selectedDate > new Date() && key !== dateKey(new Date());

  useEffect(() => {
    setNameDraft(workout?.name ?? "");
    setNameEditing(false);
  }, [workout?.id, workout?.name]);

  const commitName = () => {
    const next = nameDraft.trim();
    if (workout && next && next !== workout.name) rename(workout.id, next);
    else setNameDraft(workout?.name ?? "");
    setNameEditing(false);
  };

  const logItem = logId ? items.find((i) => i.exerciseId === logId) ?? null : null;

  /** Create a workout and point today at it in one step. */
  const createAndAssign = async (name: string) => {
    const id = await create(name);
    if (id) await assign(key, id);
  };

  return (
    <div className="flex w-full max-w-app flex-col">
      {/* ---------------------------------- header --------------------------------- */}
      <header className="pt-safe border-b border-line bg-gradient-to-b from-header-top to-bg px-4 pb-4 pt-5 sm:px-5">
        <div className="flex items-center justify-between gap-2">
          <div className="font-display text-[15px] font-black tracking-[.14em]">
            GYM<span className="text-accent-text">·</span>LOG
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={logOut}
              aria-label="Log out"
              title="Log out"
              className="flex h-10 w-10 items-center justify-center rounded-field bg-surface text-muted press"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
            <ProgressRing done={doneCount} total={items.length} size={58} />
          </div>
        </div>

        <div className="mt-3">
          {/*
            The session name is the headline now, not the weekday — the workout
            is what you actually came here to do. The date is the subtitle.
          */}
          {nameEditing && workout ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") {
                  setNameDraft(workout.name);
                  setNameEditing(false);
                }
              }}
              aria-label="Rename this session"
              className="w-full rounded-field border border-accent bg-raised px-2.5 py-1.5 font-display text-[26px] font-black uppercase tracking-tight text-text outline-none"
            />
          ) : (
            <button
              onClick={() => workout && setNameEditing(true)}
              disabled={!workout}
              className="group flex items-center gap-2 text-left"
              aria-label={workout ? `Rename ${workout.name}` : undefined}
            >
              <span
                // Re-keyed so the name crossfades when the session changes
                // instead of swapping between frames.
                key={workout?.id ?? "__rest"}
                className="rise-in font-display text-[clamp(26px,8vw,34px)] font-black uppercase leading-[.95] tracking-tight"
              >
                {workout ? workout.name : "Rest"}
              </span>
              {workout && (
                <svg
                  width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"
                  className="flex-none opacity-40 transition group-hover:opacity-100"
                  aria-hidden="true"
                >
                  <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                </svg>
              )}
            </button>
          )}

          <div className="mt-1.5 text-[13px] font-medium tracking-[.02em] text-muted">
            {DAYS[selected].full}
            {selected !== todayIdx && (
              <>
                {" · "}
                {selectedDate.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
              </>
            )}
            {isOverride && workout && <span className="ml-1.5">· just this day</span>}
          </div>
        </div>

        <WorkoutSlider
          workouts={ordered}
          activeId={workoutId}
          isOverride={isOverride}
          onPick={(id) => assign(key, id)}
          onCreate={createAndAssign}
          onResetToUsual={() => clearAssignment(key)}
        />
      </header>

      {/* --------------------------------- day pills -------------------------------- */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1.5 pt-3.5 sm:px-5">
        {DAYS.map((d, i) => {
          const dd = new Date();
          dd.setDate(dd.getDate() + (i - todayIdx));
          const dKey = dateKey(dd);
          const resolved = resolve(dKey).workoutId;
          const label = resolved ? workouts[resolved]?.name ?? "—" : "rest";
          const active = i === selected;
          return (
            <button
              key={d.key}
              onClick={() => {
                setSelected(i);
                setEditing(false);
              }}
              aria-pressed={active}
              className={`relative min-w-[54px] flex-none rounded-tile border px-3 py-2.5 font-display text-[12px] font-bold tracking-[.1em] transition ${
                active ? "border-text bg-text text-bg" : "border-line bg-surface text-muted"
              }`}
            >
              {d.label}
              <small
                className={`mt-0.5 block max-w-[62px] truncate font-body text-[9px] font-semibold capitalize tracking-[.02em] ${
                  active ? "text-bg/60" : "text-muted"
                }`}
              >
                {label}
              </small>
              {i === todayIdx && (
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-bg bg-accent" />
              )}
            </button>
          );
        })}
      </div>

      {workout && (
        <div className="flex gap-2 px-4 sm:px-5">
          <button
            onClick={() => setEditing((v) => !v)}
            className={`py-1.5 text-[12.5px] font-semibold transition ${
              editing ? "text-accent-text" : "text-muted"
            }`}
          >
            {editing ? "Done editing" : "Edit list"}
          </button>
        </div>
      )}

      {/* ----------------------------------- list ---------------------------------- */}
      <div className="flex flex-1 flex-col gap-2.5 px-4 pb-4 pt-2.5">
        {(loading || schedLoading) && (
          <p className="py-10 text-center text-sm text-muted">Loading your sessions…</p>
        )}

        {!loading && !schedLoading && !workout && (
          <div className="px-5 py-10 text-center text-sm leading-relaxed text-muted">
            {ordered.length === 0 ? (
              <>
                No sessions yet.
                <br />
                Tap <b className="text-text">+</b> above to create Push, Pull, Legs — whatever
                you train.
              </>
            ) : (
              <>
                {DAYS[selected].full} is a rest day.
                <br />
                Pick a session above if you want to train anyway.
              </>
            )}
          </div>
        )}

        {workout && items.length === 0 && (
          <div className="px-5 py-10 text-center text-sm leading-relaxed text-muted">
            No exercises in <b className="text-text">{workout.name}</b> yet.
            <br />
            Add them once and they&apos;ll be here every time you do this session.
          </div>
        )}

        {items.map((item, i) => {
          const ex = byId.get(item.exerciseId);
          const group = ex?.group ?? "core";
          const g = GROUPS[group];
          const isDone = Boolean(entries[item.exerciseId]?.done);
          const h = history.get(item.exerciseId);

          return (
            <div
              key={item.exerciseId}
              // Stagger capped at 6 slots: past that the delay stops reading as
              // choreography and starts reading as lag.
              style={{ animationDelay: `${Math.min(i, 6) * 38}ms` }}
              // Tapping the card body opens the log screen; the checkbox stays a
              // one-tap shortcut for "did it exactly as planned".
              onClick={() => !editing && setLogId(item.exerciseId)}
              role={editing ? undefined : "button"}
              tabIndex={editing ? undefined : 0}
              onKeyDown={(e) => {
                if (editing) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setLogId(item.exerciseId);
                }
              }}
              className={`rise-in relative flex items-center gap-3 overflow-hidden rounded-card p-3 ${
                isDone ? "bg-card-done/80 backdrop-blur-xl" : "glass"
              } ${editing ? "pr-12" : "cursor-pointer press press-card"}`}
            >
              <div
                className={isDone ? "opacity-70 grayscale-[.5]" : ""}
                // The whole card opens the log sheet; the thumbnail is a
                // separate target for "show me how this is done".
                onClick={(e) => e.stopPropagation()}
              >
                <Thumb
                  src={ex?.image ?? null}
                  group={group}
                  alt=""
                  onPress={ex ? () => setDetail(ex) : undefined}
                  pressLabel={ex ? `See how to do ${ex.name}` : undefined}
                />
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
                    style={tagStyle(g)}
                  >
                    {g.name}
                  </span>
                  {editing && workout ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Stepper
                        label="sets"
                        value={item.sets}
                        suffix=" sets"
                        onChange={(sets) => updateItem(workout.id, item.exerciseId, { sets })}
                      />
                      <Stepper
                        label="reps"
                        value={item.reps}
                        suffix=" reps"
                        max={200}
                        onChange={(reps) => updateItem(workout.id, item.exerciseId, { reps })}
                      />
                      <Stepper
                        label="weight"
                        value={item.weightKg}
                        suffix=" kg"
                        min={0}
                        max={500}
                        step={2.5}
                        onChange={(weightKg) =>
                          updateItem(workout.id, item.exerciseId, { weightKg })
                        }
                      />
                    </div>
                  ) : (
                    <span className="text-[12px] font-medium text-muted">
                      {item.sets} × {item.reps}
                      {item.weightKg > 0 && (
                        <>
                          {" · "}
                          <span className="font-semibold text-text">
                            {formatKg(item.weightKg)}kg
                          </span>
                        </>
                      )}
                    </span>
                  )}
                </div>

                {/* What you managed last time you did this move, whenever that was. */}
                {!editing && h && h.lastOn && h.lastKg > 0 && (
                  <div className="mt-1 text-[11px] text-muted">
                    Last time{" "}
                    <b className="font-semibold text-text">{formatKg(h.lastKg)}kg</b>
                    {" · "}
                    {formatDayLabel(h.lastOn)}
                    {h.bestKg > h.lastKg && <> · best {formatKg(h.bestKg)}kg</>}
                  </div>
                )}
              </div>

              {!editing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // don't also open the log sheet
                    if (!isFuture) toggle(item.exerciseId, item);
                  }}
                  disabled={isFuture}
                  aria-pressed={isDone}
                  aria-label={`Mark ${ex?.name ?? "exercise"} ${isDone ? "not done" : "done"}`}
                  className={`flex h-9 w-9 flex-none items-center justify-center rounded-field border-2 press disabled:opacity-30 ${
                    isDone ? "border-done bg-done" : "border-line bg-transparent"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-4 w-4 ${isDone ? "animate-pop opacity-100" : "opacity-0"}`}
                    fill="none"
                    stroke="rgb(var(--on-done))"
                    strokeWidth={3.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 12l6 6L20 5" />
                  </svg>
                </button>
              )}

              {editing && workout && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeExercise(workout.id, item.exerciseId);
                  }}
                  aria-label={`Remove ${ex?.name ?? "exercise"}`}
                  className="absolute bottom-0 right-0 top-0 w-11 text-lg text-muted transition hover:text-accent-text"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}

        {workout && (
          <button
            onClick={() => setPickerOpen(true)}
            className="mt-1 flex items-center justify-center gap-2 rounded-card border-[1.5px] border-dashed border-line py-[15px] text-sm font-semibold text-muted transition hover:border-accent hover:text-text"
          >
            <span className="text-lg leading-none">+</span> Add exercise to {workout.name}
          </button>
        )}
      </div>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={(id) => workout && addExercise(workout.id, id)}
        existingIds={new Set(items.map((i) => i.exerciseId))}
        dayLabel={workout?.name ?? ""}
      />

      <LogSheet
        open={logId !== null}
        onClose={() => setLogId(null)}
        exercise={logId ? byId.get(logId) : undefined}
        item={logItem}
        history={logId ? history.get(logId) : undefined}
        isDone={logId ? Boolean(entries[logId]?.done) : false}
        onSave={({ sets, reps, weightKg, markDone }) => {
          if (!logId || !workout) return;
          // Carry the numbers into the workout so the next time you do this
          // session — whichever day that lands on — it starts from here…
          updateItem(workout.id, logId, { sets, reps, weightKg });
          // …and record what was actually done today.
          if (markDone || entries[logId]?.done) {
            setCompletion(logId, { done: true, sets, reps, weightKg });
          }
        }}
      />

      <ExerciseDetail exercise={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
