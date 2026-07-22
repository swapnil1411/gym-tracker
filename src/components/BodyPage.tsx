"use client";

import { useMemo } from "react";
import { GROUPS, dateKey } from "@/lib/groups";
import { roundKcal } from "@/lib/activities";
import { useDayActivities } from "@/lib/activity-store";
import { useDayBurn } from "@/lib/burn";
import { usePedometer } from "@/lib/pedometer";
import {
  ACTIVITY,
  GOALS,
  NON_EXERCISE_FACTOR,
  burnForDay,
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

/**
 * A measurement row: −, the value, +.
 *
 * The design specified steppers only, but the middle stays a real input on
 * purpose — nobody is tapping + seventy-four times to enter a starting weight.
 * The steppers are for nudging, the field is for saying.
 */
function MeasureRow({
  label,
  unit,
  value,
  onChange,
  placeholder,
  step = 1,
}: {
  label: string;
  unit: string;
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder: string;
  step?: number;
}) {
  const nudge = (by: number) =>
    onChange(Math.max(0, Math.round(((value ?? Number(placeholder)) + by) * 10) / 10));

  const btn =
    "press flex h-10 w-10 flex-none items-center justify-center rounded-[11px] text-[22px] leading-none";

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[14px] font-semibold">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => nudge(-step)}
          aria-label={`Decrease ${label.toLowerCase()}`}
          className={`${btn} border border-line bg-raised text-dim`}
        >
          −
        </button>
        <span className="flex min-w-[74px] items-baseline justify-center gap-1">
          <input
            type="number"
            inputMode="decimal"
            value={value ?? ""}
            placeholder={placeholder}
            aria-label={label}
            onChange={(e) => {
              const v = e.target.value.trim();
              onChange(v === "" ? null : Number(v));
            }}
            className="w-full min-w-0 bg-transparent text-right font-display text-[18px] font-extrabold tabular-nums outline-none placeholder:font-normal placeholder:text-mute/60"
          />
          <span className="flex-none text-[12px] font-semibold text-mute">{unit}</span>
        </span>
        <button
          onClick={() => nudge(step)}
          aria-label={`Increase ${label.toLowerCase()}`}
          className={`${btn} bg-accent text-on-accent`}
        >
          +
        </button>
      </div>
    </div>
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

export default function BodyPage() {
  const { body, update } = useBody();
  const m = useMemo(() => computeMetrics(body), [body]);
  const todayKey = dateKey(new Date());
  const burn = useDayBurn(todayKey);
  const { steps, setSteps } = useDayActivities(todayKey);
  const ped = usePedometer();
  const vsMaintenance = m ? burnForDay(m.bmr, burn.total) - m.tdee : 0;

  return (
    <div className="flex w-full max-w-app flex-col">
      <header className="px-5 pb-2 pt-4">
        <div className="text-[11px] font-extrabold uppercase tracking-[.12em] text-accent">You</div>
        <h1 className="mt-1 font-display text-[28px] font-extrabold tracking-[-.02em]">
          Your body
        </h1>
        <p className="mt-2 text-[13px] leading-[1.5] text-muted">
          Weight and height, and what they mean for daily food and water.
        </p>
      </header>

      <div className="flex flex-col gap-3 px-5 py-4">
        {/* ------------------------------- inputs ------------------------------- */}
        <Card title="Measurements">
          <div className="flex flex-col gap-2.5">
            <MeasureRow
              label="Weight"
              unit="kg"
              placeholder="70"
              step={0.5}
              value={body.weightKg}
              onChange={(v) => update({ weightKg: v })}
            />
            <MeasureRow
              label="Height"
              unit="cm"
              placeholder="175"
              value={body.heightCm}
              onChange={(v) => update({ heightCm: v })}
            />
            <MeasureRow
              label="Age"
              unit="yr"
              placeholder="30"
              value={body.age}
              onChange={(v) => update({ age: v })}
            />
          </div>

          <div className="mt-4">
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
                  ["Maintenance", `${roundKcal(m.tdee)}`, "kcal"],
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
                Mifflin-St Jeor, ×{ACTIVITY[body.activity].factor} for activity. Maintenance is
                what you burn on an average day — eat that and your weight holds. It is an
                estimate: weigh yourself weekly and adjust if the trend isn&apos;t moving.
              </p>
            </Card>

            {/* ---------------------------- today's burn ---------------------------- */}
            <Card title="Burned today">
              <div className="flex items-end justify-between">
                <div className="font-display text-[40px] font-bold leading-none tabular-nums">
                  {roundKcal(burnForDay(m.bmr, burn.total))}
                  <span className="ml-1.5 text-[13px] font-semibold text-dim">kcal</span>
                </div>
                <div className="pb-1 text-right">
                  {/* Not tinted green/red: --success as 13px text measures
                      3.46:1 on the light surface, under AA. The sign carries
                      the direction on its own. */}
                  <div className="text-[13px] font-bold">
                    {vsMaintenance >= 0 ? "+" : "−"}
                    {roundKcal(Math.abs(vsMaintenance))} kcal
                  </div>
                  <div className="text-[11px] text-muted">vs maintenance</div>
                </div>
              </div>

              <div className="mt-3.5 flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[12.5px] font-medium text-dim">
                    Just being awake (×{NON_EXERCISE_FACTOR})
                  </span>
                  <span className="flex-none font-display text-[12.5px] font-bold tabular-nums text-muted">
                    {roundKcal(m.baseline)}
                  </span>
                </div>
                {burn.rows.map((r) => (
                  <div key={r.key} className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[12.5px] font-medium text-dim first-letter:uppercase">
                      {r.label}
                    </span>
                    <span className="flex-none font-display text-[12.5px] font-bold tabular-nums text-muted">
                      {roundKcal(r.kcal)}
                    </span>
                  </div>
                ))}
                {burn.rows.length === 0 && (
                  <p className="text-[12.5px] text-muted">
                    Nothing trained yet today — this is a rest-day figure.
                  </p>
                )}
              </div>

              {/* Steps tracker — logged here because walking is the burn the
                  session list never sees. Feeds the total above. */}
              <div className="mt-4 border-t border-line pt-3.5">
                <MeasureRow
                  label="Steps today"
                  unit="steps"
                  placeholder="0"
                  step={500}
                  value={steps > 0 ? steps : null}
                  onChange={(v) => setSteps(v ?? 0)}
                />
                <p className="mt-2 text-[11px] leading-[1.5] text-mute">
                  From your phone or watch, once a day is enough. Costed like walking —
                  about {body.weightKg ? roundKcal(0.53 * body.weightKg * 7.6) : 300} kcal
                  per 10,000 at your weight.
                </p>

                {/* Live pedometer, phones only. The web can't count in the
                    background like a tracker, so this is per-walk: start it,
                    pocket the phone, stop when you're back. */}
                {ped.state === "counting" ? (
                  <div className="mt-3 rounded-card border border-accent2 bg-accent-ghost px-4 py-3.5 text-center">
                    <div className="text-[10.5px] font-extrabold uppercase tracking-[.08em] text-accent-text">
                      Counting steps…
                    </div>
                    <div className="mt-1 font-display text-[38px] font-bold leading-none tabular-nums">
                      {ped.steps.toLocaleString()}
                    </div>
                    <p className="mt-1.5 text-[11px] text-mute">
                      Keep the app open — the screen stays awake while this runs.
                    </p>
                    <button
                      onClick={() => {
                        const n = ped.stop();
                        if (n > 0) setSteps(steps + n);
                      }}
                      className="press mt-3 w-full rounded-field bg-accent py-2.5 text-[13px] font-bold text-on-accent"
                    >
                      Stop &amp; add to today
                    </button>
                  </div>
                ) : ped.state !== "unsupported" ? (
                  <>
                    <button
                      onClick={ped.start}
                      className="press mt-3 w-full rounded-field border border-dashed border-line py-2.5 text-[13px] font-semibold text-muted transition hover:border-accent hover:text-text"
                    >
                      🚶 Count a walk with this phone
                    </button>
                    {ped.state === "denied" && (
                      <p className="mt-2 text-[11px] leading-[1.5] text-mute">
                        Motion access was declined. Allow motion &amp; orientation for this
                        site in your browser settings, then try again.
                      </p>
                    )}
                  </>
                ) : null}
              </div>

              <p className="mt-3 text-[11.5px] leading-[1.5] text-muted">
                Two routes to the same number, so don&apos;t add them together. Maintenance
                guesses your training from the activity setting above; this counts the sessions
                you actually logged. On a rest day it lands below maintenance, on a hard day
                above — which is the useful part.
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
