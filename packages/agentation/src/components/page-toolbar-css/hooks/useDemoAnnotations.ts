import { useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { Annotation } from "../../../types";
import { getElementClasses, getNearbyText, identifyElement } from "../../../utils/element-identification";
import { originalSetTimeout } from "../../../utils/freeze-animations";
import type { DemoAnnotation } from "../types";

type UseDemoAnnotationsParams = {
  enableDemoMode: boolean;
  mounted: boolean;
  demoAnnotations?: DemoAnnotation[];
  demoDelay: number;
  hasAnnotations: boolean;
  setIsActive: Dispatch<SetStateAction<boolean>>;
  setAnnotations: Dispatch<SetStateAction<Annotation[]>>;
};

export function useDemoAnnotations({
  enableDemoMode,
  mounted,
  demoAnnotations,
  demoDelay,
  hasAnnotations,
  setIsActive,
  setAnnotations,
}: UseDemoAnnotationsParams): void {
  const hadAnnotationsOnMountRef = useRef<boolean>(hasAnnotations);

  useEffect(() => {
    if (!enableDemoMode) {
      return;
    }
    if (!mounted || !demoAnnotations || demoAnnotations.length === 0) {
      return;
    }
    if (hadAnnotationsOnMountRef.current) {
      return;
    }

    const timeoutIds: ReturnType<typeof originalSetTimeout>[] = [];
    const initialActivationDelay = Math.max(0, demoDelay - 200);

    timeoutIds.push(
      originalSetTimeout(() => {
        setIsActive(true);
      }, initialActivationDelay),
    );

    demoAnnotations.forEach((demoAnnotation, index) => {
      const annotationDelay = demoDelay + index * 300;

      timeoutIds.push(
        originalSetTimeout(() => {
          const element = document.querySelector(demoAnnotation.selector) as HTMLElement;
          if (!element) {
            return;
          }

          const rect = element.getBoundingClientRect();
          const { name, path } = identifyElement(element);

          const newAnnotation: Annotation = {
            id: `demo-${Date.now()}-${index}`,
            x: ((rect.left + rect.width / 2) / window.innerWidth) * 100,
            y: rect.top + rect.height / 2 + window.scrollY,
            comment: demoAnnotation.comment,
            element: name,
            elementPath: path,
            timestamp: Date.now(),
            selectedText: demoAnnotation.selectedText,
            boundingBox: {
              x: rect.left,
              y: rect.top + window.scrollY,
              width: rect.width,
              height: rect.height,
            },
            nearbyText: getNearbyText(element),
            cssClasses: getElementClasses(element),
          };

          setAnnotations((previousAnnotations) => [
            ...previousAnnotations,
            newAnnotation,
          ]);
        }, annotationDelay),
      );
    });

    return () => {
      timeoutIds.forEach(window.clearTimeout);
    };
  }, [demoAnnotations, demoDelay, enableDemoMode, mounted, setAnnotations, setIsActive]);
}
