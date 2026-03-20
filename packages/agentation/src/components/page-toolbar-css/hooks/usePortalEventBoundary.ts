import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";

export function usePortalEventBoundary(): MutableRefObject<HTMLDivElement | null> {
  const portalWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stop = (event: Event): void => {
      const wrapper = portalWrapperRef.current;
      if (wrapper && wrapper.contains(event.target as Node)) {
        event.stopPropagation();
      }
    };

    const events = ["mousedown", "click", "pointerdown"] as const;
    events.forEach((eventName) => {
      document.body.addEventListener(eventName, stop);
    });

    return () => {
      events.forEach((eventName) => {
        document.body.removeEventListener(eventName, stop);
      });
    };
  }, []);

  return portalWrapperRef;
}
