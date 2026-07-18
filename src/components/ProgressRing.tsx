"use client";

export default function ProgressRing({
  done,
  total,
  size = 66,
  stroke = 6,
  label = "DONE",
  showText = true,
}: {
  done: number;
  total: number;
  size?: number;
  stroke?: number;
  label?: string;
  showText?: boolean;
}) {
  const r = size / 2 - stroke / 2 - 2;
  const circumference = 2 * Math.PI * r;
  const frac = total > 0 ? done / total : 0;
  const complete = total > 0 && done === total;
  const color = complete ? "rgb(var(--done))" : "rgb(var(--accent))";

  return (
    <div
      className="relative flex-none"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${done} of ${total} exercises complete`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke="rgb(var(--line))"
        />
        <circle
          className="ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - frac)}
        />
      </svg>
      {showText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <b
            className={`font-display text-[15px] font-extrabold leading-none ${
              complete ? "text-done-text" : ""
            }`}
          >
            {done}/{total}
          </b>
          <span className="mt-0.5 text-[9px] tracking-[.12em] text-muted">{label}</span>
        </div>
      )}
    </div>
  );
}
