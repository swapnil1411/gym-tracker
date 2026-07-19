"use client";

import { useMemo } from "react";
import ThemeToggle from "./ThemeToggle";
import { GROUPS } from "@/lib/groups";
import {
  ACTIVITY,
  GOALS,
  computeMetrics,
  useBody,
  type Activity,
  type Goal,
  type Sex,
} from "@/lib/body";

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-[18px] border border-line bg-surface p-4">
    <h2 className="text-[11px] font-bold uppercase tracking-[.1em] text-mute">{title}</h2>
    <div className="mt-3">{children}</div>
  </section>
);

/** Numeric field. Empty string clears back to null rather than storing 0. */
function Field({
  label,
  unit,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  unit: string;
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder: string;
}) {
  return (
    <label className="flex flex-1 flex-col gap-1.5">
      <span className="text-[10.5px] font-bold uppercase tracking-[.08em] text-mute">
        {label}
      </span>
      <span className="flex items-baseline gap-1 rounded-field border border-line bg-raised px-3 py-2.5 focus-within:border-accent">
        <input
          type="number"
          inputMode="decimal"
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => {
            const v = e.target.value.trim();
            onChange(v === "" ? null : Number(v));
          }}
          className="w-full min-w-0 bg-transparent font-display text-[19px] font-bold tabular-nums outline-none placeholder:font-body placeholder:text-[15px] placeholder:font-normal placeholder:text-mute/70"
        />
        <span className="flex-none text-[12px] font-semibold text-mute">{unit}</span>
      </span>
    </label>
  );
}

/*
 * The BMI scale drawn to real proportions between 15 and 40, so the marker's
 * position is the actual reading rather than a decorative one.
 */
const SCALE_MIN = 15;
const SCALE_MAX = 40;
const BANDS: { to: number; color: string; label: string }[] = [
  { to: 18.5, color: "rgb(var(--accent))", label: "Under" },
  { to: 25, color: "rgb(var(--success))", label: "Healthy" },
  { to: 30, color: "rgb(var(--pr))", label: "Over" },
  { to: SCALE_MAX, color: GROUPS.chest.color, label: "Obese" },
];
const pct = (v: number) =>
  ((Math.min(Math.max(v, SCALE_MIN), SCALE_MAX) - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;

/* Hoisted, not defined inside BodyPage — a component declared in a render body
   is a new type every render, which remounts it and drops focus. */
function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string; hint?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            aria-pressed={on}
            className={`press flex-1 rounded-field border px-3 py-2 text-center transition ${
              on
                ? "border-accent bg-accent text-on-accent"
                : "border-line bg-raised text-muted"
            }`}
          >
            <span className="block whitespace-nowrap text-[13px] font-bold">{o.label}</span>
            {o.hint && (
              <span className="mt-0.5 block text-[10px] font-semibold opacity-70">{o.hint}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function BodyPage({ onBack }: { onBack: () => void }) {
  const { body, update } = useBody();
  const m = useMemo(() => computeMetrics(body), [body]);

  return (
    <div className="flex w-full max-w-app flex-col">
      <header className="border-b border-line bg-bg px-5 pb-5 pt-4">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onBack}
            className="press -ml-1 flex items-center gap-1.5 rounded-field px-1.5 py-1 text-[13px] font-semibold text-muted"
          >
            ‹ Today
          </button>
          <ThemeToggle />
        </div>
        <h1 className="mt-3 font-display text-[clamp(24px,7vw,30px)] font-black uppercase leading-[.95] tracking-tight">
          Your body
        </h1>
        <p className="mt-1.5 text-[13px] text-muted">
          Your weight and height, and what they mean for daily food and water.
        </p>
      </header>

      <div className="flex flex-col gap-3 px-5 py-4">
        {/* ------------------------------- inputs ------------------------------- */}
        <Card title="Measurements">
          <div className="flex gap-2.5">
            <Field
              label="Weight"
              unit="kg"
              placeholder="70"
              value={body.weightKg}
              onChange={(v) => update({ weightKg: v })}
            />
            <Field
              label="Height"
              unit="cm"
              placeholder="175"
              value={body.heightCm}
              onChange={(v) => update({ heightCm: v })}
            />
            <Field
              label="Age"
              unit="yr"
              placeholder="30"
              value={body.age}
              onChange={(v) => update({ age: v })}
            />
          </div>

          <div className="mt-3">
            <Segmented<Sex>
              value={body.sex}
              onChange={(sex) => update({ sex })}
              options={[
                { id: "male", label: "Male" },
                { id: "female", label: "Female" },
              ]}
            />
          </div>
        </Card>

        {!m && (
          <p className="px-1 py-6 text-center text-[13px] text-muted">
            Enter your weight and height to see your BMI, calories and water.
          </p>
        )}

        {m && (
          <>
            {/* --------------------------------- BMI --------------------------------- */}
            <Card title="Body mass index">
              <div className="flex items-end justify-between">
                <div className="font-display text-[40px] font-bold leading-none tabular-nums">
                  {m.bmi.toFixed(1)}
                </div>
                <div className="pb-1 text-right">
                  <div className="text-[14px] font-bold">{m.category}</div>
                  <div className="text-[11px] text-muted">
                    Healthy for you: {Math.round(m.healthyRange[0])}–
                    {Math.round(m.healthyRange[1])} kg
                  </div>
                </div>
              </div>

              <div className="relative mt-4">
                <div className="flex h-2.5 overflow-hidden rounded-full">
                  {BANDS.map((b, i) => {
                    const from = i === 0 ? SCALE_MIN : BANDS[i - 1].to;
                    return (
                      <div
                        key={b.label}
                        style={{
                          width: `${pct(b.to) - pct(from)}%`,
                          background: b.color,
                          opacity: b.label === m.category ? 1 : 0.28,
                        }}
                      />
                    );
                  })}
                </div>
                {/* marker */}
                <div
                  className="absolute w-[3px] -translate-x-1/2 rounded-full bg-text transition-all duration-500 ease-smooth"
                  style={{ left: `${pct(m.bmi)}%`, height: 18, top: -4 }}
                  aria-hidden="true"
                />
                <div className="mt-1.5 flex justify-between text-[9.5px] font-semibold text-mute">
                  {BANDS.map((b) => (
                    <span key={b.label}>{b.label}</span>
                  ))}
                </div>
              </div>

              <p className="mt-3 text-[11.5px] leading-[1.5] text-muted">
                BMI only compares weight to height — it counts muscle as excess. If you lift,
                treat it as a rough screen, not a verdict.
              </p>
            </Card>

            {/* ------------------------------ activity ------------------------------ */}
            <Card title="How active are you?">
              <div className="flex flex-col gap-1.5">
                {(Object.keys(ACTIVITY) as Activity[]).map((k) => {
                  const a = ACTIVITY[k];
                  const on = body.activity === k;
                  return (
                    <button
                      key={k}
                      onClick={() => update({ activity: k })}
                      aria-pressed={on}
                      className={`press flex items-center justify-between rounded-field border px-3.5 py-2.5 text-left transition ${
                        on
                          ? "border-accent bg-accent text-on-accent"
                          : "border-line bg-raised"
                      }`}
                    >
                      <span>
                        <span className="block text-[13.5px] font-bold">{a.label}</span>
                        <span
                          className={`block text-[11px] ${on ? "opacity-75" : "text-muted"}`}
                        >
                          {a.hint}
                        </span>
                      </span>
                      <span className="font-display text-[12px] font-bold tabular-nums opacity-70">
                        ×{a.factor}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* -------------------------------- goal -------------------------------- */}
            <Card title="Goal">
              <Segmented<Goal>
                value={body.goal}
                onChange={(goal) => update({ goal })}
                options={(Object.keys(GOALS) as Goal[]).map((k) => ({
                  id: k,
                  label: GOALS[k].label,
                  hint: GOALS[k].hint,
                }))}
              />
            </Card>

            {/* ------------------------------ calories ------------------------------ */}
            <Card title="Daily intake">
              <div className="rounded-field bg-accent px-4 py-3.5 text-on-accent">
                <div className="text-[10.5px] font-bold uppercase tracking-[.08em] opacity-75">
                  Eat per day · {GOALS[body.goal].label.toLowerCase()}
                </div>
                <div className="mt-1 font-display text-[36px] font-bold leading-none tabular-nums">
                  {Math.round(m.calories / 10) * 10}
                  <span className="ml-1.5 text-[13px] font-semibold opacity-75">kcal</span>
                </div>
              </div>

              <div className="mt-2.5 grid grid-cols-3 gap-2">
                {[
                  ["Resting", `${Math.round(m.bmr)}`, "kcal"],
                  ["Burned/day", `${Math.round(m.tdee)}`, "kcal"],
                  ["Protein", `${Math.round(m.proteinG)}`, "g"],
                ].map(([label, value, unit]) => (
                  <div key={label} className="rounded-field bg-raised px-2.5 py-2.5 text-center">
                    <div className="text-[9.5px] font-bold uppercase tracking-[.06em] text-mute">
                      {label}
                    </div>
                    <div className="mt-1 font-display text-[17px] font-bold leading-none tabular-nums">
                      {value}
                      <span className="ml-0.5 text-[10px] font-semibold text-muted">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-[11.5px] leading-[1.5] text-muted">
                Mifflin-St Jeor, ×{ACTIVITY[body.activity].factor} for activity. It is an
                estimate — weigh yourself weekly and adjust if the trend isn&apos;t moving.
              </p>
            </Card>

            {/* -------------------------------- water ------------------------------- */}
            <Card title="Water">
              <div className="flex items-end justify-between">
                <div className="font-display text-[40px] font-bold leading-none tabular-nums text-accent">
                  {(m.waterMl / 1000).toFixed(1)}
                  <span className="ml-1.5 text-[13px] font-semibold text-dim">L / day</span>
                </div>
                <div className="pb-1 text-right text-[11px] text-muted">
                  ≈ {Math.round(m.waterMl / 250)} glasses
                </div>
              </div>
              <p className="mt-3 text-[11.5px] leading-[1.5] text-muted">
                35 ml per kg, plus what a session costs in sweat. Add more in heat, and drink
                to thirst around training rather than forcing it.
              </p>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
