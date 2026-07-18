"use client";

import { useEffect, useState } from "react";
import { GROUPS, hexA } from "@/lib/groups";
import type { MuscleGroup } from "@/types";

/**
 * Exercise thumbnail. Falls back to the prototype's coloured icon tile when the
 * image 404s or the entry has no image at all (seeded mobility moves).
 */
export default function Thumb({
  src,
  group,
  size = 52,
  radius = 12,
  alt = "",
  onPress,
  pressLabel,
}: {
  src: string | null;
  group: MuscleGroup;
  size?: number;
  radius?: number;
  alt?: string;
  /** When set the tile becomes a button — used to open the full exercise view. */
  onPress?: () => void;
  pressLabel?: string;
}) {
  const g = GROUPS[group];
  const [failed, setFailed] = useState(false);

  // A new src deserves a fresh attempt, otherwise recycled rows stay broken.
  useEffect(() => setFailed(false), [src]);

  const style = {
    width: size,
    height: size,
    borderRadius: radius,
    background: hexA(g.color, 0.16),
    boxShadow: `inset 0 0 0 1px ${hexA(g.color, 0.35)}`,
  };

  const inner =
    !src || failed ? (
      <span
        style={{ fontSize: size * 0.5 }}
        className="flex h-full w-full items-center justify-center"
        aria-hidden="true"
      >
        {g.icon}
      </span>
    ) : (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
        style={{ borderRadius: radius }}
      />
    );

  if (!onPress) {
    return (
      <div style={style} className="flex-none overflow-hidden">
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={pressLabel ?? "View exercise"}
      style={style}
      className="relative flex-none overflow-hidden press"
    >
      {inner}
      {/* Small affordance so the tile reads as tappable rather than decorative. */}
      <span
        aria-hidden="true"
        className="absolute bottom-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-tl-md bg-black/60 text-[8px] leading-none text-white"
      >
        ⤢
      </span>
    </button>
  );
}
