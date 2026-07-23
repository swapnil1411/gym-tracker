"use client";

import { useEffect, useState } from "react";
import Sheet from "./Sheet";
import { GROUPS, tagStyle, videoSearchUrl } from "@/lib/groups";
import type { LibraryExercise } from "@/types";

/**
 * Full-size view of a single exercise: the movement frames at their native
 * resolution plus the step-by-step instructions.
 *
 * Everything here already ships in public/library.json — the source images are
 * ~850px wide, so nothing needs fetching and this works offline in the gym.
 */
export default function ExerciseDetail({
  exercise,
  onClose,
}: {
  exercise: LibraryExercise | null;
  onClose: () => void;
}) {
  const [frame, setFrame] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFrame(0);
    setFailed(false);
  }, [exercise]);

  if (!exercise) return null;

  const g = GROUPS[exercise.group];
  const frames = exercise.images?.length ? exercise.images : exercise.image ? [exercise.image] : [];
  // free-exercise-db ships exactly two frames: the start and end of the rep.
  const frameLabel = frames.length === 2 ? ["Start", "End"][frame] : `${frame + 1}/${frames.length}`;

  return (
    /* Always elevated: this is opened from inside another sheet as often as not,
       and it is always the topmost thing when it is open. */
    <Sheet open onClose={onClose} title={exercise.name} elevated>
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-md px-1.5 py-0.5 text-[10px] font-label font-bold uppercase tracking-[.06em]"
            style={tagStyle(g)}
          >
            {g.name}
          </span>
          {exercise.equipment && (
            <span className="text-[12px] text-muted">{exercise.equipment}</span>
          )}
          {exercise.level && (
            <span className="text-[12px] capitalize text-muted">· {exercise.level}</span>
          )}
        </div>

        {frames.length > 0 && !failed && (
          <div className="mt-3">
            <div className="relative overflow-hidden rounded-card bg-raised">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={frames[frame]}
                alt={`${exercise.name} — ${frameLabel}`}
                onError={() => setFailed(true)}
                className="w-full"
              />
              {frames.length > 1 && (
                <span className="absolute left-2 top-2 rounded-md bg-black/65 px-2 py-1 text-[11px] font-label font-bold uppercase tracking-[.06em] text-white">
                  {frameLabel}
                </span>
              )}
            </div>

            {frames.length > 1 && (
              <div className="mt-2 flex gap-2">
                {frames.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setFrame(i)}
                    aria-label={`Show frame ${i + 1}`}
                    aria-pressed={i === frame}
                    className={`h-1.5 flex-1 rounded-full transition ${
                      i === frame ? "bg-accent" : "bg-line"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {exercise.sanskritName && (
          <p className="mt-3 text-[13px] italic text-muted">{exercise.sanskritName}</p>
        )}
        {exercise.benefits && (
          <p className="mt-3 text-[13.5px] leading-relaxed">{exercise.benefits}</p>
        )}

        {exercise.instructions.length > 0 && (
          <ol className="mt-4 flex flex-col gap-3">
            {exercise.instructions.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent text-[12px] font-bold text-on-accent">
                  {i + 1}
                </span>
                <span className="text-[13.5px] leading-relaxed text-muted">{step}</span>
              </li>
            ))}
          </ol>
        )}

        <a
          href={videoSearchUrl(exercise.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="press mt-5 flex w-full items-center justify-center gap-2 rounded-field bg-accent py-3.5 text-[15px] font-bold text-on-accent shadow-lift-strong"
        >
          <span aria-hidden="true">▶</span>
          Watch form videos
        </a>

        <button
          onClick={onClose}
          className="press mt-2 w-full rounded-field bg-raised py-3.5 text-[15px] font-semibold"
        >
          Close
        </button>
      </div>
    </Sheet>
  );
}
