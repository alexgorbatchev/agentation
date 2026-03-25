import { useEffect, useRef } from "react";

type UseMeasureOnResizeParams = {
  measure: () => void;
  delayMs?: number;
};

export function useMeasureOnResize({ measure, delayMs = 100 }: UseMeasureOnResizeParams): void {
  const measureRef = useRef(measure);

  useEffect(() => {
    measureRef.current = measure;
  }, [measure]);

  useEffect(() => {
    const runMeasure = (): void => {
      measureRef.current();
    };

    const timer = setTimeout(runMeasure, delayMs);
    window.addEventListener("resize", runMeasure);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", runMeasure);
    };
  }, [delayMs]);
}
