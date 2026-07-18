"use client";

/** Compact − / + control for sets, reps and weight. */
export default function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
  step = 1,
  label,
  suffix,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  suffix?: string;
}) {
  // Round to the step grid to keep floating-point drift out of 2.5kg jumps.
  const clamp = (n: number) =>
    Math.min(max, Math.max(min, Math.round(n / step) * step));

  // 60 not 60.0, but 62.5 keeps its half.
  const shown = Number.isInteger(value) ? value : value.toFixed(1);

  return (
    <div className="flex items-center gap-1.5 rounded-field bg-raised px-1.5 py-1">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          onChange(clamp(value - step));
        }}
        disabled={value <= min}
        className="flex h-6 w-6 items-center justify-center rounded-md text-base leading-none text-muted transition hover:text-text disabled:opacity-30"
      >
        −
      </button>
      <span className="min-w-[3.1rem] text-center font-display text-[13px] font-bold tabular-nums">
        {shown}
        {suffix ? <span className="text-muted">{suffix}</span> : null}
      </span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          onChange(clamp(value + step));
        }}
        disabled={value >= max}
        className="flex h-6 w-6 items-center justify-center rounded-md text-base leading-none text-muted transition hover:text-text disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}
