import { useEffect, useRef } from "react";

import { delay } from "./delay";

export type DemoAnimationContext = {
  isCancelled: () => boolean;
  wait: (ms: number) => Promise<boolean>;
};

type UseDemoAnimationLoopParams = {
  intervalMs?: number;
  restartDelayMs?: number;
  onVisibilityRestart?: () => void;
};

export function useDemoAnimationLoop(
  runAnimation: (context: DemoAnimationContext) => Promise<void>,
  { intervalMs, restartDelayMs = 100, onVisibilityRestart }: UseDemoAnimationLoopParams,
): void {
  const runAnimationRef = useRef(runAnimation);
  const onVisibilityRestartRef = useRef(onVisibilityRestart);

  useEffect(() => {
    runAnimationRef.current = runAnimation;
    onVisibilityRestartRef.current = onVisibilityRestart;
  }, [onVisibilityRestart, runAnimation]);

  useEffect(() => {
    let generation = 0;
    let interval: ReturnType<typeof setInterval> | null = null;
    let restartTimer: ReturnType<typeof setTimeout> | null = null;

    const stopCurrentRun = (): void => {
      generation += 1;

      if (interval) {
        clearInterval(interval);
        interval = null;
      }

      if (restartTimer) {
        clearTimeout(restartTimer);
        restartTimer = null;
      }
    };

    const runOnce = (): void => {
      const runGeneration = generation;
      const context: DemoAnimationContext = {
        isCancelled: (): boolean => runGeneration !== generation,
        wait: async (ms: number): Promise<boolean> => {
          await delay(ms);
          return runGeneration === generation;
        },
      };

      void runAnimationRef.current(context);
    };

    const startLoop = (): void => {
      runOnce();

      if (typeof intervalMs === "number") {
        interval = setInterval(runOnce, intervalMs);
      }
    };

    const handleVisibilityChange = (): void => {
      if (document.visibilityState !== "visible") {
        return;
      }

      stopCurrentRun();
      onVisibilityRestartRef.current?.();
      restartTimer = setTimeout(startLoop, restartDelayMs);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    startLoop();

    return () => {
      stopCurrentRun();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [intervalMs, restartDelayMs]);
}
