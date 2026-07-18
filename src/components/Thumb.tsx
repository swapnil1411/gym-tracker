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
}: {
  src: string | null;
  group: MuscleGroup;
  size?: number;
  radius?: number;
  alt?: string;
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

  if (!src || failed) {
    return (
      <div
        style={{ ...style, fontSize: size * 0.5 }}
        className="flex flex-none items-center justify-center"
        aria-hidden="true"
      >
        {g.icon}
      </div>
    );
  }

  return (
    <div style={style} className="flex-none overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
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
    </div>
  );
}
