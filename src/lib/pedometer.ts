"use client";

/**
 * A live pedometer on the phone's accelerometer, the way trackers do it:
 * gravity is tracked out of the signal with a slow low-pass, the residual is
 * smoothed, and a step is a peak that crosses a threshold at a human cadence.
 *
 * The honest limits, stated because they shape the UI: the web only delivers
 * `devicemotion` while the page is foreground with the screen on — there is no
 * background pedometer API, so this counts *walks you take with the app open*,
 * not the whole day. A screen wake lock is held while counting so the phone
 * doesn't sleep mid-walk. iOS additionally requires an explicit permission
 * prompt, which must be triggered from a tap.
 *
 * Like real trackers, counting starts *deferred*: nothing is credited until a
 * few peaks arrive at a walking rhythm (250–2000 ms apart), then the run is
 * credited retroactively. That is what stops picking the phone up, or one
 * pothole in a car, from scoring steps.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/** Minimum ms between peaks — anything faster than ~4 steps/s is jitter. */
const REFRACTORY_MS = 250;
/** A gap longer than this breaks the rhythm; the run must re-qualify. */
const MAX_GAP_MS = 2000;
/** Peaks needed at a steady cadence before a run starts counting. */
const QUALIFY_STEPS = 5;
/** m/s² above the gravity baseline that counts as a step peak. */
const THRESHOLD = 1.1;

export type PedometerState = "idle" | "counting" | "denied" | "unsupported";

interface IOSDeviceMotion {
  requestPermission?: () => Promise<"granted" | "denied">;
}

export function usePedometer() {
  const [state, setState] = useState<PedometerState>(() =>
    typeof window !== "undefined" && "DeviceMotionEvent" in window ? "idle" : "unsupported"
  );
  const [steps, setSteps] = useState(0);

  // Filter internals live in refs — they update at sensor rate (~60 Hz) and
  // must not re-render the component on every sample.
  const gravity = useRef(0);
  const smooth = useRef(0);
  const above = useRef(false);
  const lastPeakAt = useRef(0);
  const pending = useRef(0);
  const locked = useRef(false);
  const count = useRef(0);
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const listening = useRef(false);

  const onMotion = useCallback((e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity;
    if (!a) return;
    const mag = Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0);

    // Slow low-pass tracks gravity + posture; the residual is the step signal.
    gravity.current = gravity.current === 0 ? mag : gravity.current * 0.96 + mag * 0.04;
    smooth.current = smooth.current * 0.6 + (mag - gravity.current) * 0.4;

    const now = performance.now();
    const isAbove = smooth.current > THRESHOLD;
    const rising = isAbove && !above.current;
    above.current = isAbove;
    if (!rising || now - lastPeakAt.current < REFRACTORY_MS) return;

    const gap = now - lastPeakAt.current;
    lastPeakAt.current = now;

    if (gap > MAX_GAP_MS) {
      // Rhythm broken — start a fresh qualification run.
      locked.current = false;
      pending.current = 1;
      return;
    }
    if (locked.current) {
      count.current += 1;
    } else {
      pending.current += 1;
      if (pending.current >= QUALIFY_STEPS) {
        // A real walk: credit the qualifying steps retroactively.
        locked.current = true;
        count.current += pending.current;
        pending.current = 0;
      }
    }
    setSteps(count.current);
  }, []);

  const stop = useCallback((): number => {
    if (listening.current) {
      window.removeEventListener("devicemotion", onMotion);
      listening.current = false;
    }
    wakeLock.current?.release().catch(() => {});
    wakeLock.current = null;
    const total = count.current;
    setState((s) => (s === "counting" ? "idle" : s));
    return total;
  }, [onMotion]);

  const start = useCallback(async () => {
    // iOS: permission must be requested inside the tap that called this.
    const iosPerm = (DeviceMotionEvent as unknown as IOSDeviceMotion).requestPermission;
    if (iosPerm) {
      try {
        if ((await iosPerm()) !== "granted") {
          setState("denied");
          return;
        }
      } catch {
        setState("denied");
        return;
      }
    }

    gravity.current = 0;
    smooth.current = 0;
    above.current = false;
    lastPeakAt.current = 0;
    pending.current = 0;
    locked.current = false;
    count.current = 0;
    setSteps(0);

    window.addEventListener("devicemotion", onMotion);
    listening.current = true;
    setState("counting");

    // Best-effort: keep the screen on so the sensors keep flowing. Denial is
    // fine — counting still works until the phone sleeps on its own.
    try {
      wakeLock.current = (await navigator.wakeLock?.request("screen")) ?? null;
    } catch {
      wakeLock.current = null;
    }
  }, [onMotion]);

  // The wake lock is released by the OS when the tab is hidden; take it back
  // when the walk returns to the foreground mid-count.
  useEffect(() => {
    const revive = () => {
      if (document.visibilityState === "visible" && listening.current && !wakeLock.current) {
        navigator.wakeLock
          ?.request("screen")
          .then((l) => (wakeLock.current = l))
          .catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", revive);
    return () => document.removeEventListener("visibilitychange", revive);
  }, []);

  // Never leave the sensor or the wake lock running past unmount.
  useEffect(() => () => void stop(), [stop]);

  return { state, steps, start, stop };
}
