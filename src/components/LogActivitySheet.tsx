"use client";

import { useEffect, useState } from "react";
import Sheet from "./Sheet";
import Stepper from "./Stepper";
import {
  ACTIVITIES,
  ACTIVITY_BY_ID,
  INTENSITY_LABEL,
  estimateKcal,
  paceLabel,
  roundKcal,
  type Intensity,
} from "@/lib/activities";
import { useBody } from "@/lib/body";
import type { ActivityEntry } from "@/lib/activity-store";

/**
 * Log or edit one bout of sport/cardio.
 *
 * The kcal figure updates live above the Save button rather than appearing
 * after the fact — the number is the entire reason you're filling this in, so
 * you should be able to see a longer session move it before you commit.
 */
export default function LogActivitySheet({
  open,
  onClose,
  editing,
  onSave,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  /** Existing entry when editing, null when adding. */
  editing: ActivityEntry | null;
  onSave: (v: {
    type: string;
    minutes: number;
    intensity: Intensity;
    km?: number;
    speedKmh?: number;
    gradePct?: number;
    kcal: number;
  }) => void;
  onDelete?: () => void;
}) {
  const { body } = useBody();
  const [type, setType] = useState("run");
  const [minutes, setMinutes] = useState(30);
  const [intensity, setIntensity] = useState<Intensity>("moderate");
  const [km, setKm] = useState(5);
  const [speedKmh, setSpeedKmh] = useState(5);
  const [gradePct, setGradePct] = useState(10);

  // Re-seed on open: editing shows what was logged, adding shows the sport's
  // own default duration so most bouts are two taps.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type);
      setMinutes(editing.minutes);
      setIntensity(editing.intensity);
      setKm(editing.km ?? 5);
      setSpeedKmh(editing.speedKmh ?? 5);
      setGradePct(editing.gradePct ?? 10);
    } else {
      setType("run");
      setMinutes(ACTIVITY_BY_ID.get("run")!.defaultMinutes);
      setIntensity("moderate");
    }
  }, [open, editing]);

  const def = ACTIVITY_BY_ID.get(type)!;
  const input = {
    type,
    minutes,
    intensity,
    ...(def.kind === "distance" ? { km } : {}),
    ...(def.kind === "incline" ? { speedKmh, gradePct } : {}),
  };
  const kcal = roundKcal(estimateKcal(input, body.weightKg));
  const pace = def.kind === "distance" ? paceLabel(minutes, km) : null;

  const pickType = (id: string) => {
    setType(id);
    // Only re-default the duration when adding — silently rewriting a logged
    // session's minutes because you fixed the sport would be surprising.
    if (!editing) setMinutes(ACTIVITY_BY_ID.get(id)!.defaultMinutes);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? "Edit activity" : "Log activity"}
      subtitle="Calories are estimated from your bodyweight."
    >
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {/* ------------------------------ sport ------------------------------ */}
        <div className="grid grid-cols-4 gap-2">
          {ACTIVITIES.map((a) => {
            const on = a.id === type;
            return (
              <button
                key={a.id}
                onClick={() => pickType(a.id)}
                aria-pressed={on}
                className={`press flex flex-col items-center gap-1 rounded-field border px-1 py-2.5 transition ${
                  on ? "border-accent bg-accent text-on-accent" : "border-line bg-raised"
                }`}
              >
                <span className="text-[19px] leading-none">{a.emoji}</span>
                <span
                  className={`text-center text-[10px] font-bold leading-tight ${
                    on ? "" : "text-muted"
                  }`}
                >
                  {a.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ---------------------------- intensity ---------------------------- */}
        <div className="mt-4 flex gap-1.5">
          {(Object.keys(INTENSITY_LABEL) as Intensity[]).map((i) => {
            const on = i === intensity;
            return (
              <button
                key={i}
                onClick={() => setIntensity(i)}
                aria-pressed={on}
                className={`press flex-1 rounded-field border py-2 text-[13px] font-bold transition ${
                  on ? "border-accent bg-accent text-on-accent" : "border-line bg-raised text-muted"
                }`}
              >
                {INTENSITY_LABEL[i]}
              </button>
            );
          })}
        </div>

        {/* ------------------------------ numbers ---------------------------- */}
        <div className="mt-3 rounded-card bg-raised p-4">
          <div className="flex flex-col gap-3">
            <Row label="Duration">
              <Stepper
                label="minutes"
                value={minutes}
                onChange={setMinutes}
                min={5}
                max={300}
                step={5}
                suffix=" min"
                size="lg"
              />
            </Row>

            {def.kind === "distance" && (
              <Row label="Distance">
                <Stepper
                  label="distance"
                  value={km}
                  onChange={setKm}
                  min={0}
                  max={200}
                  step={0.5}
                  suffix=" km"
                  size="lg"
                />
              </Row>
            )}

            {def.kind === "incline" && (
              <>
                <Row label="Speed">
                  <Stepper
                    label="speed"
                    value={speedKmh}
                    onChange={setSpeedKmh}
                    min={1}
                    max={12}
                    step={0.5}
                    suffix=" km/h"
                    size="lg"
                  />
                </Row>
                <Row label="Incline">
                  <Stepper
                    label="incline"
                    value={gradePct}
                    onChange={setGradePct}
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

          {pace && (
            <p className="mt-3 text-center text-[12px] font-semibold text-mute">{pace}</p>
          )}
        </div>

        {/* ------------------------------- result ---------------------------- */}
        {body.weightKg ? (
          <div className="mt-3 rounded-card border border-accent2 bg-accent-ghost px-4 py-3.5 text-center">
            <div className="text-[10.5px] font-label font-extrabold uppercase tracking-[.08em] text-accent-text">
              Approx. burn
            </div>
            <div className="mt-1 font-display text-[38px] font-bold leading-none tabular-nums">
              {kcal}
              <span className="ml-1.5 text-[13px] font-semibold text-dim">kcal</span>
            </div>
          </div>
        ) : (
          <p className="mt-3 rounded-card bg-raised p-4 text-[13px] leading-relaxed text-muted">
            Add your weight on the Body page and this will start estimating calories —
            every one of these formulas scales with bodyweight, so there&apos;s nothing
            honest to show without it.
          </p>
        )}

        <button
          onClick={() => {
            onSave({ ...input, kcal });
            onClose();
          }}
          className="press mt-4 h-14 w-full rounded-2xl bg-accent text-[16px] font-extrabold text-on-accent shadow-lift-strong"
        >
          {editing ? "Update activity" : "Save activity"}
        </button>

        {editing && onDelete && (
          <button
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="press mt-2 w-full rounded-field border border-line py-2.5 text-[13px] font-semibold text-muted"
          >
            Delete this activity
          </button>
        )}

        <p className="mt-4 text-center text-[11px] leading-[1.5] text-mute">
          Estimates from published MET values and the ACSM walking equation. Expect
          them to be within about a fifth of the truth — good enough for a weekly
          trend, not for balancing a diet to the calorie.
        </p>
      </div>
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
