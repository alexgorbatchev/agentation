import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";

import {
  getAccessibilityInfo,
  getDetailedComputedStyles,
  getElementClasses,
  getForensicComputedStyles,
  getFullElementPath,
  getNearbyElements,
  getNearbyText,
} from "../../../utils/element-identification";
import type {
  HoverInfo,
  PendingAnnotationState,
  PendingMultiSelectElement,
} from "./useInteractionLifecycle";

type UsePendingMultiSelectAnnotationParams = {
  pendingMultiSelectElements: PendingMultiSelectElement[];
  setPendingAnnotation: Dispatch<SetStateAction<PendingAnnotationState | null>>;
  setHoverInfo: Dispatch<SetStateAction<HoverInfo | null>>;
  setPendingMultiSelectElements: Dispatch<SetStateAction<PendingMultiSelectElement[]>>;
  isElementFixed: (element: HTMLElement) => boolean;
  detectSourceFile: (element: HTMLElement) => string | undefined;
};

type UsePendingMultiSelectAnnotationResult = {
  createMultiSelectPendingAnnotation: () => void;
};

export function usePendingMultiSelectAnnotation({
  pendingMultiSelectElements,
  setPendingAnnotation,
  setHoverInfo,
  setPendingMultiSelectElements,
  isElementFixed,
  detectSourceFile,
}: UsePendingMultiSelectAnnotationParams): UsePendingMultiSelectAnnotationResult {
  const createMultiSelectPendingAnnotation = useCallback((): void => {
    if (pendingMultiSelectElements.length === 0) {
      return;
    }

    const firstItem = pendingMultiSelectElements[0];
    const firstElement = firstItem.element;
    const isMulti = pendingMultiSelectElements.length > 1;

    const freshRects = pendingMultiSelectElements.map((item) =>
      item.element.getBoundingClientRect(),
    );

    if (!isMulti) {
      const rect = freshRects[0];
      const isFixed = isElementFixed(firstElement);

      setPendingAnnotation({
        x: (rect.left / window.innerWidth) * 100,
        y: isFixed ? rect.top : rect.top + window.scrollY,
        clientY: rect.top,
        element: firstItem.name,
        elementPath: firstItem.path,
        boundingBox: {
          x: rect.left,
          y: isFixed ? rect.top : rect.top + window.scrollY,
          width: rect.width,
          height: rect.height,
        },
        isFixed,
        fullPath: getFullElementPath(firstElement),
        accessibility: getAccessibilityInfo(firstElement),
        computedStyles: getForensicComputedStyles(firstElement),
        computedStylesObj: getDetailedComputedStyles(firstElement),
        nearbyElements: getNearbyElements(firstElement),
        cssClasses: getElementClasses(firstElement),
        nearbyText: getNearbyText(firstElement),
        reactComponents: firstItem.reactComponents,
        sourceFile: detectSourceFile(firstElement),
      });

      setPendingMultiSelectElements([]);
      setHoverInfo(null);
      return;
    }

    const bounds = {
      left: Math.min(...freshRects.map((rect) => rect.left)),
      top: Math.min(...freshRects.map((rect) => rect.top)),
      right: Math.max(...freshRects.map((rect) => rect.right)),
      bottom: Math.max(...freshRects.map((rect) => rect.bottom)),
    };

    const names = pendingMultiSelectElements
      .slice(0, 5)
      .map((item) => item.name)
      .join(", ");
    const suffix =
      pendingMultiSelectElements.length > 5
        ? ` +${pendingMultiSelectElements.length - 5} more`
        : "";

    const elementBoundingBoxes = freshRects.map((rect) => ({
      x: rect.left,
      y: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height,
    }));

    const lastItem =
      pendingMultiSelectElements[pendingMultiSelectElements.length - 1];
    const lastElement = lastItem.element;
    const lastRect = freshRects[freshRects.length - 1];
    const lastCenterX = lastRect.left + lastRect.width / 2;
    const lastCenterY = lastRect.top + lastRect.height / 2;
    const lastIsFixed = isElementFixed(lastElement);

    setPendingAnnotation({
      x: (lastCenterX / window.innerWidth) * 100,
      y: lastIsFixed ? lastCenterY : lastCenterY + window.scrollY,
      clientY: lastCenterY,
      element: `${pendingMultiSelectElements.length} elements: ${names}${suffix}`,
      elementPath: "multi-select",
      boundingBox: {
        x: bounds.left,
        y: bounds.top + window.scrollY,
        width: bounds.right - bounds.left,
        height: bounds.bottom - bounds.top,
      },
      isMultiSelect: true,
      isFixed: lastIsFixed,
      elementBoundingBoxes,
      multiSelectElements: pendingMultiSelectElements.map((item) => item.element),
      targetElement: lastElement,
      fullPath: getFullElementPath(firstElement),
      accessibility: getAccessibilityInfo(firstElement),
      computedStyles: getForensicComputedStyles(firstElement),
      computedStylesObj: getDetailedComputedStyles(firstElement),
      nearbyElements: getNearbyElements(firstElement),
      cssClasses: getElementClasses(firstElement),
      nearbyText: getNearbyText(firstElement),
      sourceFile: detectSourceFile(firstElement),
    });

    setPendingMultiSelectElements([]);
    setHoverInfo(null);
  }, [
    pendingMultiSelectElements,
    setPendingAnnotation,
    setHoverInfo,
    setPendingMultiSelectElements,
    isElementFixed,
    detectSourceFile,
  ]);

  return { createMultiSelectPendingAnnotation };
}
