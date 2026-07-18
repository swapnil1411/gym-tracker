"use client";

/** Compact − / + control for sets and reps. */
export default function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label,
  suffix,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  label: string;
  suffix?: string;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-line bg-raised px-1.5 py-1">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          onChange(clamp(value - 1));
        }}
        disabled={value <= min}
        className="flex h-6 w-6 items-center justify-center rounded-md text-base leading-none text-muted transition hover:text-text disabled:opacity-30"
      >
        −
      </button>
      <span className="min-w-[2.6rem] text-center font-display text-[13px] font-bold tabular-nums">
        {value}
        {suffix ? <span className="text-muted">{suffix}</span> : null}
      </span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          onChange(clamp(value + 1));
        }}
        disabled={value >= max}
        className="flex h-6 w-6 items-center justify-center rounded-md text-base leading-none text-muted transition hover:text-text disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}
