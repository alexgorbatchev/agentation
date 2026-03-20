import { useEffect, useRef } from "react";
import type {
  Dispatch,
  MutableRefObject,
  SetStateAction,
} from "react";

import type { Annotation } from "../../../types";
import {
  closestCrossingShadow,
  getAccessibilityInfo,
  getDetailedComputedStyles,
  getElementClasses,
  getForensicComputedStyles,
  getFullElementPath,
  getNearbyElements,
  getNearbyText,
} from "../../../utils/element-identification";
import { type AnnotationPopupCSSHandle } from "../../annotation-popup-css";
import {
  inspectComponentElement,
  type ComponentInspection,
} from "../../../utils/component-inspector";

export type HoverInfo = {
  element: string;
  elementName: string;
  elementPath: string;
  rect: DOMRect | null;
  reactComponents?: string | null;
  isPiercing?: boolean;
};

export type PendingAnnotationState = {
  x: number;
  y: number;
  clientY: number;
  element: string;
  elementPath: string;
  selectedText?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  nearbyText?: string;
  cssClasses?: string;
  isMultiSelect?: boolean;
  isFixed?: boolean;
  fullPath?: string;
  accessibility?: string;
  computedStyles?: string;
  computedStylesObj?: Record<string, string>;
  nearbyElements?: string;
  reactComponents?: string;
  sourceFile?: string;
  elementBoundingBoxes?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  multiSelectElements?: HTMLElement[];
  targetElement?: HTMLElement;
};

export type PendingMultiSelectElement = {
  element: HTMLElement;
  rect: DOMRect;
  name: string;
  path: string;
  reactComponents?: string;
};

export type ComponentMenuState = {
  items: ComponentInspection[];
  x: number;
  y: number;
};

type ReactComponentMode = "smart" | "filtered" | "all" | "off";

type IdentifyElementWithReactResult = {
  name: string;
  elementName: string;
  path: string;
  reactComponents: string | null;
};

type UseInteractionLifecycleParams = {
  isActive: boolean;
  isAltSelectionHeld: boolean;
  pendingAnnotation: PendingAnnotationState | null;
  setPendingAnnotation: Dispatch<SetStateAction<PendingAnnotationState | null>>;
  editingAnnotation: Annotation | null;
  settingsBlockInteractions: boolean;
  effectiveReactMode: ReactComponentMode;
  pendingMultiSelectElements: PendingMultiSelectElement[];
  setPendingMultiSelectElements: Dispatch<SetStateAction<PendingMultiSelectElement[]>>;
  createMultiSelectPendingAnnotation: () => void;
  setHoverInfo: Dispatch<SetStateAction<HoverInfo | null>>;
  setHoverPosition: Dispatch<SetStateAction<{ x: number; y: number }>>;
  componentMenu: ComponentMenuState | null;
  setComponentMenu: Dispatch<SetStateAction<ComponentMenuState | null>>;
  setHoveredComponentMenuIndex: Dispatch<SetStateAction<number | null>>;
  popupRef: MutableRefObject<AnnotationPopupCSSHandle | null>;
  editPopupRef: MutableRefObject<AnnotationPopupCSSHandle | null>;
  consumeJustFinishedDrag: () => boolean;
  identifyElementWithReact: (
    element: HTMLElement,
    reactMode: ReactComponentMode,
  ) => IdentifyElementWithReactResult;
  detectSourceFile: (element: HTMLElement) => string | undefined;
  isElementFixed: (element: HTMLElement) => boolean;
  deepElementFromPoint: (x: number, y: number) => HTMLElement | null;
  pierceElementFromPoint: (x: number, y: number) => HTMLElement | null;
};

export function useInteractionLifecycle({
  isActive,
  isAltSelectionHeld,
  pendingAnnotation,
  setPendingAnnotation,
  editingAnnotation,
  settingsBlockInteractions,
  effectiveReactMode,
  pendingMultiSelectElements,
  setPendingMultiSelectElements,
  createMultiSelectPendingAnnotation,
  setHoverInfo,
  setHoverPosition,
  componentMenu,
  setComponentMenu,
  setHoveredComponentMenuIndex,
  popupRef,
  editPopupRef,
  consumeJustFinishedDrag,
  identifyElementWithReact,
  detectSourceFile,
  isElementFixed,
  deepElementFromPoint,
  pierceElementFromPoint,
}: UseInteractionLifecycleParams): void {
  const modifiersHeldRef = useRef({ cmd: false, shift: false });

  useEffect(() => {
    if (!isActive) {
      modifiersHeldRef.current = { cmd: false, shift: false };
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const style = document.createElement("style");
    style.id = "feedback-cursor-styles";
    style.textContent = `
      body * {
        cursor: crosshair !important;
      }
      ${
        isAltSelectionHeld
          ? ""
          : `body p, body span, body h1, body h2, body h3, body h4, body h5, body h6,
      body li, body td, body th, body label, body blockquote, body figcaption,
      body caption, body legend, body dt, body dd, body pre, body code,
      body em, body strong, body b, body i, body u, body s, body a,
      body time, body address, body cite, body q, body abbr, body dfn,
      body mark, body small, body sub, body sup, body [contenteditable],
      body p *, body span *, body h1 *, body h2 *, body h3 *, body h4 *,
      body h5 *, body h6 *, body li *, body a *, body label *, body pre *,
      body code *, body blockquote *, body [contenteditable] * {
        cursor: text !important;
      }`
      }
      [data-feedback-toolbar], [data-feedback-toolbar] * {
        cursor: default !important;
      }
      [data-feedback-toolbar] textarea,
      [data-feedback-toolbar] input[type="text"],
      [data-feedback-toolbar] input[type="url"] {
        cursor: text !important;
      }
      [data-feedback-toolbar] button,
      [data-feedback-toolbar] button *,
      [data-feedback-toolbar] label,
      [data-feedback-toolbar] label *,
      [data-feedback-toolbar] a,
      [data-feedback-toolbar] a *,
      [data-feedback-toolbar] [role="button"],
      [data-feedback-toolbar] [role="button"] * {
        cursor: pointer !important;
      }
      [data-annotation-marker], [data-annotation-marker] * {
        cursor: pointer !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById("feedback-cursor-styles");
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [isActive, isAltSelectionHeld]);

  useEffect(() => {
    if (!isActive || pendingAnnotation) {
      return;
    }

    const handleMouseMove = (event: MouseEvent): void => {
      const target = (event.composedPath()[0] || event.target) as HTMLElement;
      if (closestCrossingShadow(target, "[data-feedback-toolbar]")) {
        setHoverInfo(null);
        return;
      }

      const isPiercing = event.metaKey || event.ctrlKey;
      const elementUnder = isPiercing
        ? pierceElementFromPoint(event.clientX, event.clientY)
        : deepElementFromPoint(event.clientX, event.clientY);

      if (!elementUnder || closestCrossingShadow(elementUnder, "[data-feedback-toolbar]")) {
        setHoverInfo(null);
        return;
      }

      const { name, elementName, path, reactComponents } = identifyElementWithReact(
        elementUnder,
        effectiveReactMode,
      );
      const rect = elementUnder.getBoundingClientRect();

      setHoverInfo({
        element: name,
        elementName,
        elementPath: path,
        rect,
        reactComponents,
        isPiercing,
      });
      setHoverPosition({ x: event.clientX, y: event.clientY });
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [
    deepElementFromPoint,
    effectiveReactMode,
    identifyElementWithReact,
    isActive,
    pendingAnnotation,
    pierceElementFromPoint,
    setHoverInfo,
    setHoverPosition,
  ]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handleClick = (event: MouseEvent): void => {
      if (consumeJustFinishedDrag()) {
        return;
      }

      const target = (event.composedPath()[0] || event.target) as HTMLElement;
      if (closestCrossingShadow(target, "[data-feedback-toolbar]")) {
        return;
      }
      if (closestCrossingShadow(target, "[data-annotation-popup]")) {
        return;
      }
      if (closestCrossingShadow(target, "[data-annotation-marker]")) {
        return;
      }

      if (event.metaKey && event.shiftKey && !pendingAnnotation && !editingAnnotation) {
        event.preventDefault();
        event.stopPropagation();

        const elementUnder = pierceElementFromPoint(event.clientX, event.clientY);
        if (!elementUnder) {
          return;
        }

        const rect = elementUnder.getBoundingClientRect();
        const { name, path, reactComponents } = identifyElementWithReact(
          elementUnder,
          effectiveReactMode,
        );

        const existingIndex = pendingMultiSelectElements.findIndex(
          (item) => item.element === elementUnder,
        );

        if (existingIndex >= 0) {
          setPendingMultiSelectElements((prev) =>
            prev.filter((_, index) => index !== existingIndex),
          );
          return;
        }

        setPendingMultiSelectElements((prev) => [
          ...prev,
          {
            element: elementUnder,
            rect,
            name,
            path,
            reactComponents: reactComponents ?? undefined,
          },
        ]);
        return;
      }

      const isInteractive = closestCrossingShadow(
        target,
        "button, a, input, select, textarea, [role='button'], [onclick]",
      );

      if (settingsBlockInteractions && isInteractive) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (pendingAnnotation) {
        if (isInteractive && !settingsBlockInteractions) {
          return;
        }
        event.preventDefault();
        popupRef.current?.shake();
        return;
      }

      if (editingAnnotation) {
        if (isInteractive && !settingsBlockInteractions) {
          return;
        }
        event.preventDefault();
        editPopupRef.current?.shake();
        return;
      }

      event.preventDefault();

      const isPiercing = (event.metaKey || event.ctrlKey) && !event.shiftKey;
      const elementUnder = isPiercing
        ? pierceElementFromPoint(event.clientX, event.clientY)
        : deepElementFromPoint(event.clientX, event.clientY);
      if (!elementUnder) {
        return;
      }

      const { name, path, reactComponents } = identifyElementWithReact(
        elementUnder,
        effectiveReactMode,
      );
      const rect = elementUnder.getBoundingClientRect();
      const x = (event.clientX / window.innerWidth) * 100;

      const elementIsFixed = isElementFixed(elementUnder);
      const y = elementIsFixed ? event.clientY : event.clientY + window.scrollY;

      const selection = window.getSelection();
      let selectedText: string | undefined;
      if (selection && selection.toString().trim().length > 0) {
        selectedText = selection.toString().trim().slice(0, 500);
      }

      const computedStylesObj = getDetailedComputedStyles(elementUnder);
      const computedStylesStr = getForensicComputedStyles(elementUnder);

      setPendingAnnotation({
        x,
        y,
        clientY: event.clientY,
        element: name,
        elementPath: path,
        selectedText,
        boundingBox: {
          x: rect.left,
          y: elementIsFixed ? rect.top : rect.top + window.scrollY,
          width: rect.width,
          height: rect.height,
        },
        nearbyText: getNearbyText(elementUnder),
        cssClasses: getElementClasses(elementUnder),
        isFixed: elementIsFixed,
        fullPath: getFullElementPath(elementUnder),
        accessibility: getAccessibilityInfo(elementUnder),
        computedStyles: computedStylesStr,
        computedStylesObj,
        nearbyElements: getNearbyElements(elementUnder),
        reactComponents: reactComponents ?? undefined,
        sourceFile: detectSourceFile(elementUnder),
        targetElement: elementUnder,
      });
      setHoverInfo(null);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [
    consumeJustFinishedDrag,
    deepElementFromPoint,
    detectSourceFile,
    editPopupRef,
    editingAnnotation,
    effectiveReactMode,
    identifyElementWithReact,
    isActive,
    isElementFixed,
    pendingAnnotation,
    pendingMultiSelectElements,
    pierceElementFromPoint,
    popupRef,
    setHoverInfo,
    setPendingAnnotation,
    setPendingMultiSelectElements,
    settingsBlockInteractions,
  ]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handleContextMenu = (event: MouseEvent): void => {
      const target = (event.composedPath()[0] || event.target) as HTMLElement;

      if (closestCrossingShadow(target, "[data-feedback-toolbar]")) {
        return;
      }
      if (closestCrossingShadow(target, "[data-annotation-popup]")) {
        return;
      }
      if (closestCrossingShadow(target, "[data-annotation-marker]")) {
        return;
      }

      if (!event.altKey) {
        setComponentMenu(null);
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const isPiercing = event.metaKey || event.ctrlKey;
      const elementUnder = isPiercing
        ? pierceElementFromPoint(event.clientX, event.clientY)
        : deepElementFromPoint(event.clientX, event.clientY);
      if (!elementUnder) {
        setComponentMenu(null);
        return;
      }

      const items = inspectComponentElement(elementUnder);
      if (items.length === 0) {
        setComponentMenu(null);
        return;
      }

      setComponentMenu({ items, x: event.clientX, y: event.clientY });
      setHoverInfo(null);
    };

    document.addEventListener("contextmenu", handleContextMenu, true);
    return () => document.removeEventListener("contextmenu", handleContextMenu, true);
  }, [
    deepElementFromPoint,
    isActive,
    pierceElementFromPoint,
    setComponentMenu,
    setHoverInfo,
  ]);

  useEffect(() => {
    if (!componentMenu) {
      return;
    }

    const handlePointerDown = (event: MouseEvent): void => {
      const target = event.target as HTMLElement | null;
      if (target && closestCrossingShadow(target, "[data-component-source-menu]")) {
        return;
      }
      setComponentMenu(null);
      setHoveredComponentMenuIndex(null);
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") {
        return;
      }

      setComponentMenu(null);
      setHoveredComponentMenuIndex(null);
    };

    document.addEventListener("mousedown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [componentMenu, setComponentMenu, setHoveredComponentMenuIndex]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Meta") {
        modifiersHeldRef.current.cmd = true;
      }

      if (event.key === "Shift") {
        modifiersHeldRef.current.shift = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent): void => {
      const wasHoldingBoth =
        modifiersHeldRef.current.cmd && modifiersHeldRef.current.shift;

      if (event.key === "Meta") {
        modifiersHeldRef.current.cmd = false;
      }

      if (event.key === "Shift") {
        modifiersHeldRef.current.shift = false;
      }

      const nowHoldingBoth =
        modifiersHeldRef.current.cmd && modifiersHeldRef.current.shift;

      if (wasHoldingBoth && !nowHoldingBoth && pendingMultiSelectElements.length > 0) {
        createMultiSelectPendingAnnotation();
      }
    };

    const handleBlur = (): void => {
      modifiersHeldRef.current = { cmd: false, shift: false };
      setPendingMultiSelectElements([]);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [
    createMultiSelectPendingAnnotation,
    isActive,
    pendingMultiSelectElements,
    setPendingMultiSelectElements,
  ]);
}
