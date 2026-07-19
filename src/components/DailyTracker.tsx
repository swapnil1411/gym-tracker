"use client";

import { useEffect, useMemo, useState } from "react";
import ProgressRing from "./ProgressRing";
import Thumb from "./Thumb";
import ExerciseDetail from "./ExerciseDetail";
import Stepper from "./Stepper";
import ExercisePicker from "./ExercisePicker";
import LogSheet from "./LogSheet";
import WorkoutSlider from "./WorkoutSlider";
import { DAYS, GROUPS, dateKey, tagStyle, toMondayIndex } from "@/lib/groups";
import { indexById, useLibrary } from "@/lib/library";
import { useDayCompletions } from "@/lib/store";
import { useSchedule, useWorkouts, useLegacyPlanMigration } from "@/lib/workouts";
import { useExerciseHistory, formatKg, formatDayLabel } from "@/lib/history";
import { ACTIVITY_BY_ID, liftingKcal, roundKcal } from "@/lib/activities";
import { useDayActivities } from "@/lib/activity-store";
import { useBody } from "@/lib/body";
import type { LibraryExercise } from "@/types";

export default function DailyTracker() {
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
    moveItem,
  } = useWorkouts();
  const {
    resolve,
    assign,
    toggleWorkout,
    clearAssignment,
    loading: schedLoading,
  } = useSchedule();
  const { history } = useExerciseHistory();

  // Import the old plan/{weekday} docs once, but only after the workouts
  // collection has actually reported empty — otherwise a slow first snapshot
  // looks like "no workouts" and the import runs against live data twice.
  useLegacyPlanMigration(!loading && !schedLoading && ordered.length === 0);

  const todayIdx = toMondayIndex(new Date().getDay());
  const [selected, setSelected] = useState(todayIdx);
  const [editing, setEditing] = useState(false);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [logTarget, setLogTarget] = useState<{ w: string; ex: string } | null>(null);
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
  const { entries: activities } = useDayActivities(key);
  const { body } = useBody();

  const { workoutIds, isOverride } = resolve(key);
  // A workout can be deleted while dates still point at it.
  const sessions = workoutIds.map((id) => workouts[id]).filter(Boolean);
  const allItems = sessions.flatMap((w) => w.items);

  const doneCount = allItems.filter((i) => entries[i.exerciseId]?.done).length;
  const isFuture = selectedDate > new Date() && key !== dateKey(new Date());
  const totalSets = allItems.reduce((sum, item) => sum + item.sets, 0);
  const nextOpen = sessions
    .flatMap((w) => w.items.map((item) => ({ workoutId: w.id, item })))
    .find(({ item }) => !entries[item.exerciseId]?.done);
  const estimatedMinutes = Math.max(15, Math.round((totalSets * 3.5) / 5) * 5);
  const prTarget = sessions
    .flatMap((w) => w.items.map((item) => ({ workoutId: w.id, item, ex: byId.get(item.exerciseId) })))
    .map((row) => {
      const h = history.get(row.item.exerciseId);
      const logged = entries[row.item.exerciseId];
      const todayKg = logged?.done ? logged.weightKg ?? row.item.weightKg : row.item.weightKg;
      const previousBest = h?.bestKg ?? 0;
      return { ...row, h, todayKg, previousBest };
    })
    .filter((row) => row.ex && row.previousBest > 0 && row.todayKg >= row.previousBest)
    .sort((a, b) => b.todayKg - a.todayKg)[0];

  /*
   * What the day cost, broken into blocks: the lifting itself, then every bout
   * logged on Sports for the same date. Lifting counts sets actually ticked
   * off rather than planned ones — a session you skipped is not energy spent.
   */
  const setsDone = allItems
    .filter((i) => entries[i.exerciseId]?.done)
    .reduce((sum, i) => sum + (entries[i.exerciseId]?.setsDone || i.sets), 0);
  const liftMinutes = Math.max(15, Math.round((setsDone * 3.5) / 5) * 5);
  const burn = useMemo(() => {
    const rows: { label: string; kcal: number }[] = [];
    const lift = liftingKcal(setsDone, body.weightKg);
    if (lift > 0) {
      rows.push({
        label: `${liftMinutes} min ${sessions.map((w) => w.name).join(" + ") || "gym"}`,
        kcal: lift,
      });
    }
    for (const a of activities) {
      rows.push({
        label: `${a.minutes} min ${ACTIVITY_BY_ID.get(a.type)?.label.toLowerCase() ?? a.type}`,
        kcal: a.kcal,
      });
    }
    return { rows, total: rows.reduce((s, r) => s + r.kcal, 0) };
  }, [setsDone, liftMinutes, sessions, activities, body.weightKg]);

  // Renaming inline only makes sense when there's exactly one session to rename.
  const soleSession = sessions.length === 1 ? sessions[0] : null;

  useEffect(() => {
    setNameDraft(soleSession?.name ?? "");
    setNameEditing(false);
  }, [soleSession?.id, soleSession?.name]);

  const commitName = () => {
    const next = nameDraft.trim();
    if (soleSession && next && next !== soleSession.name) rename(soleSession.id, next);
    else setNameDraft(soleSession?.name ?? "");
    setNameEditing(false);
  };

  const logWorkout = logTarget ? workouts[logTarget.w] : undefined;
  const logItem = logTarget
    ? logWorkout?.items.find((i) => i.exerciseId === logTarget.ex) ?? null
    : null;

  /** Create a session and put it on this day in one step. */
  const createAndAdd = async (name: string) => {
    const id = await create(name);
    if (id) await assign(key, [...workoutIds, id]);
  };

  const title = sessions.length ? sessions.map((w) => w.name).join(" + ") : "Rest";

  return (
    <div className="flex w-full max-w-app flex-col">
      {/* ---------------------------------- header --------------------------------- */}
      {/* The brand, theme toggle and log-out moved to the persistent TopBar in
          the Ergonomic design, so this header is just the day itself. */}
      <header className="px-5 pb-4 pt-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {nameEditing && soleSession ? (
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  if (e.key === "Escape") {
                    setNameDraft(soleSession.name);
                    setNameEditing(false);
                  }
                }}
                aria-label="Rename this session"
                className="w-full rounded-field border border-accent bg-surface2 px-2.5 py-1.5 font-display text-[28px] font-bold tracking-[-.02em] text-text outline-none"
              />
            ) : (
              <button
                onClick={() => soleSession && setNameEditing(true)}
                disabled={!soleSession}
                className="group flex items-center gap-2 text-left"
                aria-label={soleSession ? `Rename ${soleSession.name}` : undefined}
              >
                <span
                  key={title}
                  className="rise-in font-display text-[clamp(28px,8vw,34px)] font-bold leading-[1.05] tracking-[-.02em]"
                >
                  {title}
                </span>
                {soleSession && (
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-1 flex-none text-mute transition group-hover:text-dim"
                    aria-hidden="true"
                  >
                    <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z" />
                  </svg>
                )}
              </button>
            )}

            <div className="mt-1.5 text-[14px] font-medium tracking-[.01em] text-dim">
              {DAYS[selected].full}
              {" · "}
              {selectedDate.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
              {selected === todayIdx && " · today"}
              {isOverride && <span className="ml-1.5">· today only</span>}
            </div>
            {/* The volume/duration figures the accent hero card used to carry —
                kept, because they answer "how long will this take". */}
            {allItems.length > 0 && (
              <div className="mt-1 text-[12.5px] font-medium text-mute">
                {allItems.length} {allItems.length === 1 ? "exercise" : "exercises"} ·{" "}
                {totalSets} sets · ~{estimatedMinutes} min
              </div>
            )}
          </div>
          <ProgressRing done={doneCount} total={allItems.length} size={56} />
        </div>

        <WorkoutSlider
          workouts={ordered}
          selectedIds={workoutIds}
          isOverride={isOverride}
          onToggle={(id) => toggleWorkout(key, id)}
          onClear={() => assign(key, [])}
          onCreate={createAndAdd}
          onResetToUsual={() => clearAssignment(key)}
        />
      </header>

      {/* --------------------------------- day pills -------------------------------- */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1.5 pt-4">
        {DAYS.map((d, i) => {
          const dd = new Date();
          dd.setDate(dd.getDate() + (i - todayIdx));
          const ids = resolve(dateKey(dd)).workoutIds;
          const names = ids.map((id) => workouts[id]?.name).filter(Boolean);
          const label = names.length ? names.join(" + ") : "rest";
          const active = i === selected;
          return (
            <button
              key={d.key}
              onClick={() => {
                setSelected(i);
                setEditing(false);
              }}
              aria-pressed={active}
              className={`relative min-w-[104px] flex-none rounded-[14px] border px-3.5 py-3 text-left font-display text-[13px] font-bold tracking-[.04em] transition ${
                active ? "border-accent bg-accent-ghost text-accent" : "border-line bg-surface text-text"
              }`}
            >
              {d.label}
              <small
                className={`mt-1 block max-w-[78px] truncate font-body text-[11px] font-medium capitalize tracking-normal ${
                  active ? "text-accent" : "text-mute"
                }`}
              >
                {label}
              </small>
              {i === todayIdx && (
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-bg bg-success" />
              )}
            </button>
          );
        })}
      </div>

      {sessions.length > 0 && (
        <div className="flex gap-2 px-5">
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
      <div className="flex flex-1 flex-col gap-3 px-5 pb-4 pt-2.5">
        {(loading || schedLoading) && (
          <p className="py-10 text-center text-sm text-muted">Loading your sessions…</p>
        )}

        {!loading && !schedLoading && sessions.length === 0 && (
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
                Tap a session above to train anyway.
              </>
            )}
          </div>
        )}

        {sessions.length > 0 && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-extrabold uppercase tracking-[.12em] text-mute">
              Exercises · tap to log
            </span>
            <span className="text-[12.5px] font-bold text-accent-text">
              {doneCount}/{allItems.length}
            </span>
          </div>
        )}

        {sessions.map((w) => (
          <div key={w.id} className="flex flex-col gap-2.5">
            {/* Only label the groups when there's more than one session in play. */}
            {sessions.length > 1 && (
              <div className="mt-1 flex items-baseline justify-between px-1">
                <span className="font-display text-[12px] font-bold uppercase tracking-[.1em]">
                  {w.name}
                </span>
                <span className="text-[11px] text-muted">
                  {w.items.filter((i) => entries[i.exerciseId]?.done).length}/{w.items.length}
                </span>
              </div>
            )}

            {w.items.map((item, i) => {
              const ex = byId.get(item.exerciseId);
              const group = ex?.group ?? "core";
              const g = GROUPS[group];
              const entry = entries[item.exerciseId];
              const isDone = Boolean(entry?.done);
              const h = history.get(item.exerciseId);

              /*
               * Once a day is logged, show what was actually lifted that day —
               * not the session's current numbers. The template is a
               * prescription for next time and moves as you progress; the
               * completion is a record of one date and must never appear to
               * change after the fact.
               */
              const shownSets = isDone ? entry?.setsDone ?? item.sets : item.sets;
              const shownReps = isDone ? entry?.repsDone ?? item.reps : item.reps;
              const shownKg = isDone ? entry?.weightKg ?? item.weightKg : item.weightKg;

              return (
                <div
                  key={item.exerciseId}
                  style={{ animationDelay: `${Math.min(i, 6) * 38}ms` }}
                  onClick={() => !editing && setLogTarget({ w: w.id, ex: item.exerciseId })}
                  role={editing ? undefined : "button"}
                  tabIndex={editing ? undefined : 0}
                  onKeyDown={(e) => {
                    if (editing) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setLogTarget({ w: w.id, ex: item.exerciseId });
                    }
                  }}
                  className={`rise-in relative flex items-center gap-3 overflow-hidden rounded-2xl border p-3.5 ${
                    isDone ? "border-success bg-success2" : "border-line bg-surface"
                  } ${editing ? "" : "cursor-pointer press press-card"}`}
                >
                  {/*
                   * Ergonomic design: the tick moves to the leading edge and
                   * becomes the biggest target on the row, because marking a set
                   * done is the thing you do mid-session with shaky hands. The
                   * rest of the row still opens the log sheet.
                   */}
                  {!editing ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isFuture) toggle(item.exerciseId, item);
                      }}
                      disabled={isFuture}
                      aria-pressed={isDone}
                      aria-label={`Mark ${ex?.name ?? "exercise"} ${isDone ? "not done" : "done"}`}
                      className={`press flex h-11 w-11 flex-none items-center justify-center rounded-[13px] border-2 disabled:opacity-30 ${
                        isDone ? "border-success bg-success" : "border-surface3 bg-transparent"
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className={`h-[18px] w-[18px] ${isDone ? "animate-pop opacity-100" : "opacity-0"}`}
                        fill="none"
                        stroke="rgb(var(--on-done))"
                        strokeWidth={2.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12.5 10 17l9-10" />
                      </svg>
                    </button>
                  ) : (
                    <div onClick={(e) => e.stopPropagation()}>
                      <Thumb
                        src={ex?.image ?? null}
                        group={group}
                        alt=""
                        onPress={ex ? () => setDetail(ex) : undefined}
                        pressLabel={ex ? `See how to do ${ex.name}` : undefined}
                      />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div
                      className={`truncate text-[15.5px] font-semibold tracking-[-.01em] transition ${
                        isDone ? "text-dim line-through decoration-success" : ""
                      }`}
                    >
                      {ex?.name ?? "Unknown exercise"}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-md bg-surface2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.06em]"
                        style={tagStyle(g)}
                      >
                        {g.name}
                      </span>
                      {editing ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Stepper
                            label="sets"
                            value={item.sets}
                            suffix=" sets"
                            onChange={(sets) => updateItem(w.id, item.exerciseId, { sets })}
                          />
                          <Stepper
                            label="reps"
                            value={item.reps}
                            suffix=" reps"
                            max={200}
                            onChange={(reps) => updateItem(w.id, item.exerciseId, { reps })}
                          />
                          <Stepper
                            label="weight"
                            value={item.weightKg}
                            suffix=" kg"
                            min={0}
                            max={500}
                            step={2.5}
                            onChange={(weightKg) =>
                              updateItem(w.id, item.exerciseId, { weightKg })
                            }
                          />
                        </div>
                      ) : (
                        <span className="text-[12.5px] font-semibold text-dim">
                          {shownSets} × {shownReps}
                          {shownKg > 0 && (
                            <>
                              {" · "}
                              <span className="font-semibold text-text">
                                {formatKg(shownKg)}kg
                              </span>
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    {/* What you managed last time you did this move. */}
                    {!editing && h && h.lastOn && h.lastKg > 0 && (
                      <div className="mt-1 text-[11.5px] text-mute">
                        Last time{" "}
                        <b className="font-semibold text-dim">{formatKg(h.lastKg)}kg</b>
                        {" · "}
                        {formatDayLabel(h.lastOn)}
                        {h.bestKg > h.lastKg && <> · best {formatKg(h.bestKg)}kg</>}
                      </div>
                    )}
                  </div>

                  {!editing && (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      className="flex-none text-mute"
                    >
                      <path
                        d="M9 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}

                  {/* Reorder and remove, in a column so nothing overlaps. */}
                  {editing && (
                    <div className="flex flex-none flex-col items-center gap-1">
                      <button
                        onClick={() => moveItem(w.id, i, i - 1)}
                        disabled={i === 0}
                        aria-label="Move up"
                        className="flex h-7 w-7 items-center justify-center rounded-field border border-line text-muted transition hover:text-text disabled:opacity-25"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveItem(w.id, i, i + 1)}
                        disabled={i === w.items.length - 1}
                        aria-label="Move down"
                        className="flex h-7 w-7 items-center justify-center rounded-field border border-line text-muted transition hover:text-text disabled:opacity-25"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeExercise(w.id, item.exerciseId)}
                        aria-label={`Remove ${ex?.name ?? "exercise"}`}
                        className="flex h-7 w-7 items-center justify-center rounded-field border border-line text-muted transition hover:border-accent hover:text-accent-text"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            <button
              onClick={() => setPickerFor(w.id)}
              className="mt-1 flex items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-line py-[15px] text-sm font-semibold text-dim transition hover:border-accent hover:text-text"
            >
              <span className="text-lg leading-none">+</span> Add exercise to {w.name}
            </button>
          </div>
        ))}

        {prTarget?.ex && (
          <button
            onClick={() => setLogTarget({ w: prTarget.workoutId, ex: prTarget.item.exerciseId })}
            className="press flex items-center gap-3 rounded-2xl border border-pr/25 bg-pr2 px-4 py-3.5 text-left"
          >
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-[11px] bg-pr text-[#1c1206]">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4zM7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3"
                  stroke="currentColor"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-extrabold text-pr">PR to beat today</div>
              <div className="mt-0.5 truncate text-[12.5px] font-medium text-dim">
                {prTarget.ex.name} · best {formatKg(prTarget.previousBest)}kg
                {prTarget.h?.bestOn ? ` · ${formatDayLabel(prTarget.h.bestOn)}` : ""}
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Energy cost of the day, lifting plus anything logged on Sports. */}
      {burn.total > 0 && (
        <div className="px-5 pt-4">
          <div className="rounded-card border border-line bg-surface p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-[.1em] text-mute">
                Approx. burned today
              </h2>
              <span className="font-display text-[19px] font-extrabold tabular-nums text-accent">
                {roundKcal(burn.total)}
                <span className="ml-1 text-[11px] font-semibold text-mute">kcal</span>
              </span>
            </div>
            <div className="mt-2.5 flex flex-col gap-1.5">
              {burn.rows.map((r) => (
                <div key={r.label} className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-[12.5px] font-medium text-dim">{r.label}</span>
                  <span className="flex-none font-display text-[12.5px] font-bold tabular-nums text-muted">
                    {roundKcal(r.kcal)}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-[1.5] text-mute">
              Estimated from your bodyweight — expect it to be within about a fifth.
            </p>
          </div>
        </div>
      )}

      {/*
       * Sticky primary action. `sticky bottom-0` pins it to the bottom of the
       * scrolling <main>, so it sits just above the nav without leaving the
       * normal flow — no fixed positioning to fight with the phone frame. The
       * gradient stops the list from appearing to run underneath a hard edge.
       */}
      {sessions.length > 0 && !isFuture && !editing && (
        <div className="sticky bottom-0 z-[8] mt-auto bg-gradient-to-t from-bg from-55% to-transparent px-5 pb-3 pt-7">
          <button
            onClick={() => {
              if (nextOpen) setLogTarget({ w: nextOpen.workoutId, ex: nextOpen.item.exerciseId });
            }}
            disabled={!nextOpen}
            className="press flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-accent text-[16px] font-extrabold text-on-accent shadow-lift-strong disabled:opacity-55 disabled:shadow-none"
          >
            {nextOpen && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
            {!nextOpen
              ? "Session complete"
              : doneCount === 0
                ? "Start session"
                : "Continue session"}
          </button>
        </div>
      )}

      <ExercisePicker
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        onAdd={(id) => pickerFor && addExercise(pickerFor, id)}
        onRemove={(id) => pickerFor && removeExercise(pickerFor, id)}
        existingIds={
          new Set(pickerFor ? workouts[pickerFor]?.items.map((i) => i.exerciseId) ?? [] : [])
        }
        dayLabel={pickerFor ? workouts[pickerFor]?.name ?? "" : ""}
      />

      <LogSheet
        open={logTarget !== null}
        onClose={() => setLogTarget(null)}
        exercise={logTarget ? byId.get(logTarget.ex) : undefined}
        item={logItem}
        entry={logTarget ? entries[logTarget.ex] : undefined}
        history={logTarget ? history.get(logTarget.ex) : undefined}
        isDone={logTarget ? Boolean(entries[logTarget.ex]?.done) : false}
        onSave={({ sets, reps, weightKg, markDone }) => {
          if (!logTarget) return;
          /*
           * Only advance the template when this is the newest session for the
           * exercise. Editing last Monday after training on Friday is a
           * correction to that day's record — letting it rewrite the plan would
           * undo Friday's progression.
           */
          const latest = history.get(logTarget.ex)?.latestOn;
          if (!latest || key >= latest) {
            updateItem(logTarget.w, logTarget.ex, { sets, reps, weightKg });
          }
          // …and record what was actually done on this date.
          if (markDone || entries[logTarget.ex]?.done) {
            setCompletion(logTarget.ex, { done: true, sets, reps, weightKg });
          }
        }}
      />

      <ExerciseDetail exercise={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
