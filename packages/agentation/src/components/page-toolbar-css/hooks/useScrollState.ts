import { useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";

import { originalSetTimeout } from "../../../utils/freeze-animations";

type UseScrollStateParams = {
  setScrollY: Dispatch<SetStateAction<number>>;
  setIsScrolling: Dispatch<SetStateAction<boolean>>;
};

export function useScrollState({
  setScrollY,
  setIsScrolling,
}: UseScrollStateParams): void {
  const scrollTimeoutRef = useRef<ReturnType<typeof originalSetTimeout> | null>(null);

  useEffect(() => {
    setScrollY(window.scrollY);
  }, [setScrollY]);

  useEffect(() => {
    const handleScroll = (): void => {
      setScrollY(window.scrollY);
      setIsScrolling(true);

      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = originalSetTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [setIsScrolling, setScrollY]);
}
