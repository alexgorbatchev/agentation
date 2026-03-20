import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import {
  closestCrossingShadow,
  getAccessibilityInfo,
  getDetailedComputedStyles,
  getElementClasses,
  getForensicComputedStyles,
  getFullElementPath,
  getNearbyElements,
  getNearbyText,
  identifyElement,
} from "../../../utils/element-identification";
import type {
  HoverInfo,
  PendingAnnotationState,
} from "./useInteractionLifecycle";

type UseDragSelectionLifecycleParams = {
  isActive: boolean;
  pendingAnnotation: PendingAnnotationState | null;
  detectSourceFile: (element: HTMLElement) => string | undefined;
  setPendingAnnotation: Dispatch<SetStateAction<PendingAnnotationState | null>>;
  setHoverInfo: Dispatch<SetStateAction<HoverInfo | null>>;
  selectedElementHighlightClassName: string;
};

type UseDragSelectionLifecycleResult = {
  isDragging: boolean;
  dragRectRef: MutableRefObject<HTMLDivElement | null>;
  highlightsContainerRef: MutableRefObject<HTMLDivElement | null>;
  consumeJustFinishedDrag: () => boolean;
};

const DRAG_THRESHOLD = 8;
const ELEMENT_UPDATE_THROTTLE = 50;

const TEXT_TAGS = new Set([
  "P",
  "SPAN",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "LI",
  "TD",
  "TH",
  "LABEL",
  "BLOCKQUOTE",
  "FIGCAPTION",
  "CAPTION",
  "LEGEND",
  "DT",
  "DD",
  "PRE",
  "CODE",
  "EM",
  "STRONG",
  "B",
  "I",
  "U",
  "S",
  "A",
  "TIME",
  "ADDRESS",
  "CITE",
  "Q",
  "ABBR",
  "DFN",
  "MARK",
  "SMALL",
  "SUB",
  "SUP",
]);

const MEANINGFUL_TAGS = new Set([
  "BUTTON",
  "A",
  "INPUT",
  "IMG",
  "P",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "LI",
  "LABEL",
  "TD",
  "TH",
  "SECTION",
  "ARTICLE",
  "ASIDE",
  "NAV",
]);

export function useDragSelectionLifecycle({
  isActive,
  pendingAnnotation,
  detectSourceFile,
  setPendingAnnotation,
  setHoverInfo,
  selectedElementHighlightClassName,
}: UseDragSelectionLifecycleParams): UseDragSelectionLifecycleResult {
  const [isDragging, setIsDragging] = useState(false);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragRectRef = useRef<HTMLDivElement | null>(null);
  const highlightsContainerRef = useRef<HTMLDivElement | null>(null);
  const justFinishedDragRef = useRef(false);
  const lastElementUpdateRef = useRef(0);

  const consumeJustFinishedDrag = useCallback((): boolean => {
    if (!justFinishedDragRef.current) {
      return false;
    }

    justFinishedDragRef.current = false;
    return true;
  }, []);

  useEffect(() => {
    if (!isActive || pendingAnnotation) {
      return;
    }

    const handleMouseDown = (event: MouseEvent): void => {
      const target = (event.composedPath()[0] || event.target) as HTMLElement;

      if (closestCrossingShadow(target, "[data-feedback-toolbar]")) {
        return;
      }
      if (closestCrossingShadow(target, "[data-annotation-marker]")) {
        return;
      }
      if (closestCrossingShadow(target, "[data-annotation-popup]")) {
        return;
      }

      if (TEXT_TAGS.has(target.tagName) || target.isContentEditable) {
        return;
      }

      mouseDownPosRef.current = { x: event.clientX, y: event.clientY };
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isActive, pendingAnnotation]);

  useEffect(() => {
    if (!isActive || pendingAnnotation) {
      return;
    }

    const handleMouseMove = (event: MouseEvent): void => {
      if (!mouseDownPosRef.current) {
        return;
      }

      const dx = event.clientX - mouseDownPosRef.current.x;
      const dy = event.clientY - mouseDownPosRef.current.y;
      const distance = dx * dx + dy * dy;
      const thresholdSq = DRAG_THRESHOLD * DRAG_THRESHOLD;

      if (!isDragging && distance >= thresholdSq) {
        dragStartRef.current = mouseDownPosRef.current;
        setIsDragging(true);
      }

      if ((isDragging || distance >= thresholdSq) && dragStartRef.current) {
        if (dragRectRef.current) {
          const left = Math.min(dragStartRef.current.x, event.clientX);
          const top = Math.min(dragStartRef.current.y, event.clientY);
          const width = Math.abs(event.clientX - dragStartRef.current.x);
          const height = Math.abs(event.clientY - dragStartRef.current.y);
          dragRectRef.current.style.transform = `translate(${left}px, ${top}px)`;
          dragRectRef.current.style.width = `${width}px`;
          dragRectRef.current.style.height = `${height}px`;
        }

        const now = Date.now();
        if (now - lastElementUpdateRef.current < ELEMENT_UPDATE_THROTTLE) {
          return;
        }
        lastElementUpdateRef.current = now;

        const startX = dragStartRef.current.x;
        const startY = dragStartRef.current.y;
        const left = Math.min(startX, event.clientX);
        const top = Math.min(startY, event.clientY);
        const right = Math.max(startX, event.clientX);
        const bottom = Math.max(startY, event.clientY);
        const midX = (left + right) / 2;
        const midY = (top + bottom) / 2;

        const candidateElements = new Set<HTMLElement>();
        const points = [
          [left, top],
          [right, top],
          [left, bottom],
          [right, bottom],
          [midX, midY],
          [midX, top],
          [midX, bottom],
          [left, midY],
          [right, midY],
        ];

        for (const [x, y] of points) {
          const elements = document.elementsFromPoint(x, y);
          for (const element of elements) {
            if (element instanceof HTMLElement) {
              candidateElements.add(element);
            }
          }
        }

        const nearbyElements = document.querySelectorAll(
          "button, a, input, img, p, h1, h2, h3, h4, h5, h6, li, label, td, th, div, span, section, article, aside, nav",
        );
        for (const element of nearbyElements) {
          if (element instanceof HTMLElement) {
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const centerInside =
              centerX >= left &&
              centerX <= right &&
              centerY >= top &&
              centerY <= bottom;

            const overlapX =
              Math.min(rect.right, right) - Math.max(rect.left, left);
            const overlapY =
              Math.min(rect.bottom, bottom) - Math.max(rect.top, top);
            const overlapArea =
              overlapX > 0 && overlapY > 0 ? overlapX * overlapY : 0;
            const elementArea = rect.width * rect.height;
            const overlapRatio = elementArea > 0 ? overlapArea / elementArea : 0;

            if (centerInside || overlapRatio > 0.5) {
              candidateElements.add(element);
            }
          }
        }

        const allMatching: DOMRect[] = [];

        for (const element of candidateElements) {
          if (
            closestCrossingShadow(element, "[data-feedback-toolbar]") ||
            closestCrossingShadow(element, "[data-annotation-marker]")
          ) {
            continue;
          }

          const rect = element.getBoundingClientRect();
          if (
            rect.width > window.innerWidth * 0.8 &&
            rect.height > window.innerHeight * 0.5
          ) {
            continue;
          }
          if (rect.width < 10 || rect.height < 10) {
            continue;
          }

          if (
            rect.left < right &&
            rect.right > left &&
            rect.top < bottom &&
            rect.bottom > top
          ) {
            const tagName = element.tagName;
            let shouldInclude = MEANINGFUL_TAGS.has(tagName);

            if (!shouldInclude && (tagName === "DIV" || tagName === "SPAN")) {
              const hasText =
                element.textContent && element.textContent.trim().length > 0;
              const isInteractive =
                element.onclick !== null ||
                element.getAttribute("role") === "button" ||
                element.getAttribute("role") === "link" ||
                element.classList.contains("clickable") ||
                element.hasAttribute("data-clickable");

              if (
                (hasText || isInteractive) &&
                !element.querySelector("p, h1, h2, h3, h4, h5, h6, button, a")
              ) {
                shouldInclude = true;
              }
            }

            if (shouldInclude) {
              let dominated = false;
              for (const existingRect of allMatching) {
                if (
                  existingRect.left <= rect.left &&
                  existingRect.right >= rect.right &&
                  existingRect.top <= rect.top &&
                  existingRect.bottom >= rect.bottom
                ) {
                  dominated = true;
                  break;
                }
              }
              if (!dominated) {
                allMatching.push(rect);
              }
            }
          }
        }

        if (highlightsContainerRef.current) {
          const container = highlightsContainerRef.current;
          while (container.children.length > allMatching.length) {
            container.removeChild(container.lastChild!);
          }
          allMatching.forEach((rect, index) => {
            let div = container.children[index] as HTMLDivElement;
            if (!div) {
              div = document.createElement("div");
              div.className = selectedElementHighlightClassName;
              container.appendChild(div);
            }
            div.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
            div.style.width = `${rect.width}px`;
            div.style.height = `${rect.height}px`;
          });
        }
      }
    };

    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [
    isActive,
    isDragging,
    pendingAnnotation,
    selectedElementHighlightClassName,
  ]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handleMouseUp = (event: MouseEvent): void => {
      const wasDragging = isDragging;
      const dragStart = dragStartRef.current;

      if (isDragging && dragStart) {
        justFinishedDragRef.current = true;

        const left = Math.min(dragStart.x, event.clientX);
        const top = Math.min(dragStart.y, event.clientY);
        const right = Math.max(dragStart.x, event.clientX);
        const bottom = Math.max(dragStart.y, event.clientY);

        const allMatching: { element: HTMLElement; rect: DOMRect }[] = [];
        const selector =
          "button, a, input, img, p, h1, h2, h3, h4, h5, h6, li, label, td, th";

        document.querySelectorAll(selector).forEach((entry) => {
          if (!(entry instanceof HTMLElement)) {
            return;
          }
          if (
            closestCrossingShadow(entry, "[data-feedback-toolbar]") ||
            closestCrossingShadow(entry, "[data-annotation-marker]")
          ) {
            return;
          }

          const rect = entry.getBoundingClientRect();
          if (
            rect.width > window.innerWidth * 0.8 &&
            rect.height > window.innerHeight * 0.5
          ) {
            return;
          }
          if (rect.width < 10 || rect.height < 10) {
            return;
          }

          if (
            rect.left < right &&
            rect.right > left &&
            rect.top < bottom &&
            rect.bottom > top
          ) {
            allMatching.push({ element: entry, rect });
          }
        });

        const finalElements = allMatching.filter(
          ({ element }) =>
            !allMatching.some(
              ({ element: other }) => other !== element && element.contains(other),
            ),
        );

        const x = (event.clientX / window.innerWidth) * 100;
        const y = event.clientY + window.scrollY;

        if (finalElements.length > 0) {
          const bounds = finalElements.reduce(
            (accumulator, { rect }) => ({
              left: Math.min(accumulator.left, rect.left),
              top: Math.min(accumulator.top, rect.top),
              right: Math.max(accumulator.right, rect.right),
              bottom: Math.max(accumulator.bottom, rect.bottom),
            }),
            {
              left: Infinity,
              top: Infinity,
              right: -Infinity,
              bottom: -Infinity,
            },
          );

          const elementNames = finalElements
            .slice(0, 5)
            .map(({ element }) => identifyElement(element).name)
            .join(", ");
          const suffix =
            finalElements.length > 5
              ? ` +${finalElements.length - 5} more`
              : "";

          const firstElement = finalElements[0].element;
          const firstElementComputedStyles = getDetailedComputedStyles(firstElement);
          const firstElementComputedStylesStr = getForensicComputedStyles(firstElement);

          setPendingAnnotation({
            x,
            y,
            clientY: event.clientY,
            element: `${finalElements.length} elements: ${elementNames}${suffix}`,
            elementPath: "multi-select",
            boundingBox: {
              x: bounds.left,
              y: bounds.top + window.scrollY,
              width: bounds.right - bounds.left,
              height: bounds.bottom - bounds.top,
            },
            isMultiSelect: true,
            fullPath: getFullElementPath(firstElement),
            accessibility: getAccessibilityInfo(firstElement),
            computedStyles: firstElementComputedStylesStr,
            computedStylesObj: firstElementComputedStyles,
            nearbyElements: getNearbyElements(firstElement),
            cssClasses: getElementClasses(firstElement),
            nearbyText: getNearbyText(firstElement),
            sourceFile: detectSourceFile(firstElement),
          });
        } else {
          const width = Math.abs(right - left);
          const height = Math.abs(bottom - top);

          if (width > 20 && height > 20) {
            setPendingAnnotation({
              x,
              y,
              clientY: event.clientY,
              element: "Area selection",
              elementPath: `region at (${Math.round(left)}, ${Math.round(top)})`,
              boundingBox: {
                x: left,
                y: top + window.scrollY,
                width,
                height,
              },
              isMultiSelect: true,
            });
          }
        }

        setHoverInfo(null);
      } else if (wasDragging) {
        justFinishedDragRef.current = true;
      }

      mouseDownPosRef.current = null;
      dragStartRef.current = null;
      setIsDragging(false);

      if (highlightsContainerRef.current) {
        highlightsContainerRef.current.innerHTML = "";
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [
    detectSourceFile,
    isActive,
    isDragging,
    setHoverInfo,
    setPendingAnnotation,
  ]);

  useEffect(() => {
    if (!isActive && highlightsContainerRef.current) {
      highlightsContainerRef.current.innerHTML = "";
    }
  }, [isActive]);

  return {
    isDragging,
    dragRectRef,
    highlightsContainerRef,
    consumeJustFinishedDrag,
  };
}
