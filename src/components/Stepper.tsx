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
  size = "sm",
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  suffix?: string;
  /**
   * "sm" is the inline control that sits inside an exercise row while editing.
   * "lg" is the Ergonomic design's logging control: 44px targets, minus on a
   * plain surface and plus on the accent, because during a set you're aiming
   * with one thumb and "add" is the one you want to hit without looking.
   */
  size?: "sm" | "lg";
}) {
  // Round to the step grid to keep floating-point drift out of 2.5kg jumps.
  const clamp = (n: number) =>
    Math.min(max, Math.max(min, Math.round(n / step) * step));

  // 60 not 60.0, but 62.5 keeps its half.
  const shown = Number.isInteger(value) ? value : value.toFixed(1);

  const lg = size === "lg";

  return (
    <div
      className={
        lg
          ? "flex items-center gap-3.5"
          : "flex items-center gap-1.5 rounded-field bg-raised px-1.5 py-1"
      }
    >
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          onChange(clamp(value - step));
        }}
        disabled={value <= min}
        className={
          lg
            ? "press flex h-11 w-11 flex-none items-center justify-center rounded-xl border border-line bg-surface text-[24px] leading-none text-dim disabled:opacity-30"
            : "flex h-6 w-6 items-center justify-center rounded-md text-base leading-none text-muted transition hover:text-text disabled:opacity-30"
        }
      >
        −
      </button>
      <span
        className={
          lg
            ? "min-w-[4.6rem] text-center font-display text-[17px] font-extrabold tabular-nums"
            : "min-w-[3.1rem] text-center font-display text-[13px] font-bold tabular-nums"
        }
      >
        {shown}
        {suffix ? <span className={lg ? "text-mute" : "text-muted"}>{suffix}</span> : null}
      </span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          onChange(clamp(value + step));
        }}
        disabled={value >= max}
        className={
          lg
            ? "press flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-accent text-[24px] leading-none text-on-accent disabled:opacity-30"
            : "flex h-6 w-6 items-center justify-center rounded-md text-base leading-none text-muted transition hover:text-text disabled:opacity-30"
        }
      >
        +
      </button>
    </div>
  );
}
