"use client";

import { useMemo, useState } from "react";
import { formatDayLabel, formatKg, type SessionPoint } from "@/lib/history";

const W = 300;
const H = 96;
const PAD = { l: 30, r: 10, t: 12, b: 20 };

/**
 * Working weight over time for one exercise.
 *
 * A stat tile with a trend rather than a bare chart: the number you're chasing
 * is "what am I on now, and is it moving", so the current value and the change
 * since last session lead, and the line is supporting context.
 *
 * Reads only logged completions — never the workout template — so it shows what
 * was actually lifted on each date, not what is currently planned.
 */
export default function ProgressChart({
  points,
  unit = "kg",
}: {
  points: SessionPoint[];
  unit?: string;
}) {
  // Enough to show a trend without turning into a smear on a phone.
  const data = useMemo(() => points.slice(-24), [points]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const geometry = useMemo(() => {
    if (data.length === 0) return null;

    const times = data.map((p) => new Date(p.on + "T00:00:00").getTime());
    const tMin = times[0];
    const tMax = times[times.length - 1];
    const span = tMax - tMin || 1;

    const kgs = data.map((p) => p.kg);
    let lo = Math.min(...kgs);
    let hi = Math.max(...kgs);
    // A flat series would divide by zero and draw off-canvas; give it a band.
    if (hi === lo) {
      lo = Math.max(0, lo - 1);
      hi = hi + 1;
    } else {
      const headroom = (hi - lo) * 0.15;
      lo = Math.max(0, lo - headroom);
      hi = hi + headroom;
    }

    const plotW = W - PAD.l - PAD.r;
    const plotH = H - PAD.t - PAD.b;

    const xy = data.map((p, i) => ({
      // Spaced by real elapsed time, not by index: a three-week gap should look
      // like a gap, otherwise the chart implies a cadence you didn't keep.
      x: PAD.l + ((times[i] - tMin) / span) * plotW,
      y: PAD.t + (1 - (p.kg - lo) / (hi - lo)) * plotH,
      p,
    }));

    return { xy, lo, hi };
  }, [data]);

  if (!geometry || data.length === 0) return null;

  const { xy, lo, hi } = geometry;
  const last = data[data.length - 1];
  const prev = data.length > 1 ? data[data.length - 2] : null;
  const delta = prev ? last.kg - prev.kg : null;

  const line = xy.map((d, i) => `${i === 0 ? "M" : "L"}${d.x} ${d.y}`).join(" ");
  const area =
    xy.length > 1
      ? `${line} L${xy[xy.length - 1].x} ${H - PAD.b} L${xy[0].x} ${H - PAD.b} Z`
      : "";

  const shown = activeIdx !== null ? data[activeIdx] : last;

  /** Nearest point to wherever the finger is — the marks are too small to hit. */
  const inspect = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestD = Infinity;
    xy.forEach((d, i) => {
      const dist = Math.abs(d.x - x);
      if (dist < bestD) {
        bestD = dist;
        best = i;
      }
    });
    setActiveIdx(best);
  };

  return (
    <div className="rounded-card bg-raised p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-label font-bold uppercase tracking-[.1em] text-muted">
          Working weight
        </span>
        <span className="text-[11px] text-muted">
          {data.length} {data.length === 1 ? "session" : "sessions"}
        </span>
      </div>

      {/* value + change since last time */}
      <div className="mt-1.5 flex items-baseline gap-2.5">
        <span className="font-display text-[32px] font-black leading-none text-text">
          {formatKg(shown.kg)}
          <span className="ml-1 text-[15px] font-bold text-muted">{unit}</span>
        </span>
        {delta !== null && activeIdx === null && (
          <span
            className={`text-[13px] font-bold ${
              delta > 0 ? "text-done-text" : delta < 0 ? "text-muted" : "text-muted"
            }`}
          >
            {delta > 0 ? "+" : ""}
            {formatKg(delta)}
            {unit}
            <span className="ml-1 font-medium text-muted">since last</span>
          </span>
        )}
      </div>
      <div className="mt-1 text-[12px] text-muted">
        {formatDayLabel(shown.on)}
        {shown.sets > 0 && (
          <>
            {" · "}
            {shown.sets} × {shown.reps}
          </>
        )}
      </div>

      {data.length > 1 && (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mt-2 w-full touch-none"
          style={{ height: "auto" }}
          role="img"
          aria-label={`Working weight over ${data.length} sessions, from ${formatKg(
            data[0].kg
          )}${unit} to ${formatKg(last.kg)}${unit}`}
          onPointerDown={inspect}
          onPointerMove={(e) => e.buttons && inspect(e)}
          onPointerLeave={() => setActiveIdx(null)}
        >
          <defs>
            <linearGradient id="pcFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.22" />
              <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* recessive scale: just the band edges, so the truncated baseline is stated */}
          {[hi, lo].map((v, i) => {
            const y = PAD.t + i * (H - PAD.t - PAD.b);
            return (
              <g key={v}>
                <line
                  x1={PAD.l}
                  x2={W - PAD.r}
                  y1={y}
                  y2={y}
                  stroke="rgb(var(--line))"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={PAD.l - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-muted"
                  style={{ fontSize: 9, fontVariantNumeric: "tabular-nums" }}
                >
                  {formatKg(v)}
                </text>
              </g>
            );
          })}

          <path d={area} fill="url(#pcFill)" />
          <path
            d={line}
            fill="none"
            stroke="rgb(var(--accent))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {activeIdx !== null && (
            <line
              x1={xy[activeIdx].x}
              x2={xy[activeIdx].x}
              y1={PAD.t}
              y2={H - PAD.b}
              stroke="rgb(var(--accent))"
              strokeWidth="1"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {xy.map((d, i) => {
            const on = activeIdx === i || (activeIdx === null && i === xy.length - 1);
            return (
              <circle
                key={d.p.on}
                cx={d.x}
                cy={d.y}
                r={on ? 4.5 : 2.5}
                fill={on ? "rgb(var(--accent))" : "rgb(var(--raised))"}
                stroke="rgb(var(--accent))"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {/* only the ends are labelled — a number on every point is noise */}
          <text
            x={PAD.l}
            y={H - 6}
            textAnchor="start"
            className="fill-muted"
            style={{ fontSize: 9 }}
          >
            {formatDayLabel(data[0].on)}
          </text>
          <text
            x={W - PAD.r}
            y={H - 6}
            textAnchor="end"
            className="fill-muted"
            style={{ fontSize: 9 }}
          >
            {formatDayLabel(last.on)}
          </text>
        </svg>
      )}

      {data.length === 1 && (
        <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
          One session logged. The trend appears once you&apos;ve done this again.
        </p>
      )}
    </div>
  );
}
