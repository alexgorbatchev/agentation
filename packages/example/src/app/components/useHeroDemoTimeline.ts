import { useEffect, useRef, useState, type RefObject } from "react";

import {
  HERO_COMPONENT_MENU_MAX_WIDTH,
  HERO_COMPONENT_MENU_SCALE,
  HERO_FEEDBACK_TEXTS,
  HERO_HEADER_TEXT,
} from "./heroDemoConstants";

type Point = {
  x: number;
  y: number;
};

type Bounds = Point & {
  width: number;
  height: number;
};

type Box = Bounds & {
  visible: boolean;
};

type TextSelection = {
  visible: boolean;
  x: number;
  y: number;
  width: number;
};

type HeroDemoBaseState = {
  typedText: string;
  cursorPos: Point;
  isToolbarExpanded: boolean;
  isToolbarHovered: boolean;
  isToolbarClicking: boolean;
  showHighlight: boolean;
  showPopup: boolean;
  showNewMarker: boolean;
  isCrosshair: boolean;
  btnPos: Bounds;
  dragBox: Box;
  isDragging: boolean;
  areaOutline: Box;
  showGreenMarker: boolean;
  greenMarkerPos: Point;
  copyClicked: boolean;
  copyHovered: boolean;
  showTerminal: boolean;
  terminalText: string;
  popupHeader: string;
  popupPos: Point;
  textSelection: TextSelection;
  showOrangeMarker: boolean;
  orangeMarkerPos: Point;
  isIBeam: boolean;
  isMobileView: boolean;
  selectedSidebarIcons: number[];
  selectedMetrics: number[];
  showComponentMenu: boolean;
  componentMenuPos: Point;
  hoveredComponentMenuIndex: number | null;
  showAltShortcut: boolean;
};

export type HeroDemoSceneState = HeroDemoBaseState & {
  annotationCount: number;
};

export type HeroDemoSceneRefs = {
  btnRef: RefObject<HTMLDivElement>;
  timeRef: RefObject<HTMLSpanElement>;
  contentRef: RefObject<HTMLDivElement>;
  metricsRef: RefObject<HTMLDivElement>;
  toolbarContainerRef: RefObject<HTMLDivElement>;
  sidebarIconsRef: RefObject<HTMLDivElement>;
  copyButtonRef: RefObject<HTMLButtonElement>;
  componentMenuItemRefs: [
    RefObject<HTMLButtonElement>,
    RefObject<HTMLButtonElement>,
    RefObject<HTMLButtonElement>,
  ];
};

export type HeroDemoTimelineResult = {
  state: HeroDemoSceneState;
  refs: HeroDemoSceneRefs;
};

const DEFAULT_BUTTON_POS: Bounds = { x: 20, y: 82, width: 68, height: 33 };
const DEFAULT_METRICS_POS: Bounds = { x: 0, y: 26, width: 175, height: 58 };
const DEFAULT_TOOLBAR_POS: Point = { x: 280, y: 210 };
const DEFAULT_SIDEBAR_ICONS_POS: Bounds = { x: 10, y: 40, width: 24, height: 70 };
const DEFAULT_TIME_POS: Bounds = { x: 0, y: 0, width: 0, height: 0 };
const EMPTY_BOX: Box = { visible: false, x: 0, y: 0, width: 0, height: 0 };
const EMPTY_TEXT_SELECTION: TextSelection = { visible: false, x: 0, y: 0, width: 0 };

function createInitialState(isMobileView: boolean): HeroDemoBaseState {
  return {
    typedText: "",
    cursorPos: { x: 400, y: 180 },
    isToolbarExpanded: false,
    isToolbarHovered: false,
    isToolbarClicking: false,
    showHighlight: false,
    showPopup: false,
    showNewMarker: false,
    isCrosshair: false,
    btnPos: DEFAULT_BUTTON_POS,
    dragBox: EMPTY_BOX,
    isDragging: false,
    areaOutline: EMPTY_BOX,
    showGreenMarker: false,
    greenMarkerPos: { x: 0, y: 0 },
    copyClicked: false,
    copyHovered: false,
    showTerminal: false,
    terminalText: "",
    popupHeader: "button.submit-btn",
    popupPos: { x: 0, y: 0 },
    textSelection: EMPTY_TEXT_SELECTION,
    showOrangeMarker: false,
    orangeMarkerPos: { x: 0, y: 0 },
    isIBeam: false,
    isMobileView,
    selectedSidebarIcons: [],
    selectedMetrics: [],
    showComponentMenu: false,
    componentMenuPos: { x: 0, y: 0 },
    hoveredComponentMenuIndex: null,
    showAltShortcut: false,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTerminalOutput(isMobileView: boolean): string {
  return isMobileView
    ? `## Page Feedback

### 1. button.export-btn
${HERO_FEEDBACK_TEXTS.primary}

### 2. Metrics cards
${HERO_FEEDBACK_TEXTS.secondary}

### 3. "${HERO_HEADER_TEXT}"
${HERO_FEEDBACK_TEXTS.tertiary}`
    : `## Page Feedback

### 1. button.export-btn
${HERO_FEEDBACK_TEXTS.primary}

### 2. Sidebar icons
${HERO_FEEDBACK_TEXTS.secondary}

### 3. "${HERO_HEADER_TEXT}"
${HERO_FEEDBACK_TEXTS.tertiary}`;
}

export function useHeroDemoTimeline(): HeroDemoTimelineResult {
  const [state, setState] = useState<HeroDemoBaseState>(() => createInitialState(false));

  const btnRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const copyButtonRef = useRef<HTMLButtonElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);
  const toolbarContainerRef = useRef<HTMLDivElement>(null);
  const sidebarIconsRef = useRef<HTMLDivElement>(null);
  const componentMenuItemRefs: [
    RefObject<HTMLButtonElement>,
    RefObject<HTMLButtonElement>,
    RefObject<HTMLButtonElement>,
  ] = [
    useRef<HTMLButtonElement>(null),
    useRef<HTMLButtonElement>(null),
    useRef<HTMLButtonElement>(null),
  ];

  const timePosRef = useRef<Bounds>(DEFAULT_TIME_POS);
  const btnPosRef = useRef<Bounds>(DEFAULT_BUTTON_POS);
  const metricsPosRef = useRef<Bounds>(DEFAULT_METRICS_POS);
  const toolbarPosRef = useRef<Point>(DEFAULT_TOOLBAR_POS);
  const sidebarIconsPosRef = useRef<Bounds>(DEFAULT_SIDEBAR_ICONS_POS);

  const patchState = (patch: Partial<HeroDemoBaseState>): void => {
    setState((currentState) => ({ ...currentState, ...patch }));
  };

  const getRelativeCenter = (element: HTMLElement | null): Point | null => {
    if (!element || !contentRef.current) {
      return null;
    }

    const elementRect = element.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();

    return {
      x: elementRect.left - contentRect.left + elementRect.width / 2,
      y: elementRect.top - contentRect.top + elementRect.height / 2,
    };
  };

  const measure = (): void => {
    if (btnRef.current && contentRef.current) {
      const buttonRect = btnRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      const nextButtonPos: Bounds = {
        x: buttonRect.left - contentRect.left,
        y: buttonRect.top - contentRect.top,
        width: buttonRect.width,
        height: buttonRect.height,
      };
      btnPosRef.current = nextButtonPos;
      patchState({ btnPos: nextButtonPos });
    }

    if (metricsRef.current && contentRef.current) {
      const metricsRect = metricsRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      metricsPosRef.current = {
        x: metricsRect.left - contentRect.left,
        y: metricsRect.top - contentRect.top,
        width: metricsRect.width * 0.72,
        height: metricsRect.height,
      };
    }

    if (toolbarContainerRef.current && contentRef.current) {
      const toolbarRect = toolbarContainerRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      toolbarPosRef.current = {
        x: toolbarRect.left - contentRect.left + toolbarRect.width / 2,
        y: toolbarRect.top - contentRect.top + toolbarRect.height / 2,
      };
    }

    if (sidebarIconsRef.current && contentRef.current) {
      const iconsRect = sidebarIconsRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      sidebarIconsPosRef.current = {
        x: iconsRect.left - contentRect.left,
        y: iconsRect.top - contentRect.top,
        width: iconsRect.width,
        height: iconsRect.height,
      };
    }

    if (timeRef.current && contentRef.current) {
      const titleRect = timeRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      timePosRef.current = {
        x: titleRect.left - contentRect.left,
        y: titleRect.top - contentRect.top,
        width: titleRect.width,
        height: titleRect.height,
      };
    }
  };

  useEffect(() => {
    const timer = setTimeout(measure, 100);
    window.addEventListener("resize", measure);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    if (!copyButtonRef.current || state.copyClicked) {
      return;
    }

    copyButtonRef.current.style.background = state.copyHovered
      ? "rgba(255, 255, 255, 0.1)"
      : "transparent";
  }, [state.copyClicked, state.copyHovered]);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval>;

    const wait = async (ms: number): Promise<boolean> => {
      await delay(ms);
      return !cancelled;
    };

    const typeFeedback = async (text: string, speed: number): Promise<boolean> => {
      for (let index = 0; index <= text.length; index += 1) {
        if (cancelled) {
          return false;
        }

        patchState({ typedText: text.slice(0, index) });
        await delay(speed);
      }

      return !cancelled;
    };

    const resetState = (): void => {
      setState({
        ...createInitialState(window.innerWidth <= 640),
        btnPos: btnPosRef.current,
      });
    };

    const openToolbarSequence = async (): Promise<Bounds | null> => {
      if (!(await wait(600))) {
        return null;
      }

      patchState({ cursorPos: toolbarPosRef.current });
      if (!(await wait(400))) {
        return null;
      }

      patchState({ isToolbarHovered: true });
      if (!(await wait(300))) {
        return null;
      }

      patchState({ isToolbarClicking: true });
      if (!(await wait(100))) {
        return null;
      }

      patchState({
        isToolbarClicking: false,
        isToolbarHovered: false,
        isToolbarExpanded: true,
      });
      if (!(await wait(400))) {
        return null;
      }

      patchState({ isCrosshair: true });
      if (!(await wait(200))) {
        return null;
      }

      const buttonPos = btnPosRef.current;
      patchState({
        cursorPos: { x: buttonPos.x + buttonPos.width / 2, y: buttonPos.y + buttonPos.height / 2 },
      });
      if (!(await wait(500))) {
        return null;
      }

      return buttonPos;
    };

    const annotatePrimaryButtonSequence = async (buttonPos: Bounds): Promise<boolean> => {
      patchState({ showHighlight: true });
      if (!(await wait(400))) {
        return false;
      }

      const containerWidth = contentRef.current?.offsetWidth || 300;
      const cursorX = buttonPos.x + buttonPos.width / 2;
      const popupX = Math.min(Math.max(100, cursorX - 80), containerWidth - 100);

      patchState({
        showHighlight: false,
        popupPos: { x: popupX, y: buttonPos.y + buttonPos.height + 7 },
      });
      if (!(await wait(100))) {
        return false;
      }

      patchState({ showPopup: true });
      if (!(await wait(300))) {
        return false;
      }

      if (!(await typeFeedback(HERO_FEEDBACK_TEXTS.primary, 35))) {
        return false;
      }
      if (!(await wait(300))) {
        return false;
      }

      patchState({ showPopup: false });
      if (!(await wait(200))) {
        return false;
      }

      patchState({ showNewMarker: true });
      return wait(600);
    };

    const inspectComponentSequence = async (
      buttonPos: Bounds,
      isMobileView: boolean,
    ): Promise<boolean> => {
      const componentTarget = {
        x: buttonPos.x + buttonPos.width / 2,
        y: buttonPos.y + buttonPos.height / 2,
      };
      const menuContainerWidth = contentRef.current?.offsetWidth || 300;
      const componentMenuScale = isMobileView
        ? HERO_COMPONENT_MENU_SCALE.mobile
        : HERO_COMPONENT_MENU_SCALE.desktop;
      const menuPreviewWidth = Math.ceil(HERO_COMPONENT_MENU_MAX_WIDTH * componentMenuScale);
      const menuX = Math.max(12, Math.min(componentTarget.x + 24, menuContainerWidth - menuPreviewWidth));
      const menuY = Math.max(18, buttonPos.y - 8);
      const componentMenuItemIndex = 1;

      patchState({
        isCrosshair: false,
        cursorPos: componentTarget,
        showAltShortcut: true,
        showHighlight: true,
      });
      if (!(await wait(450))) {
        return false;
      }

      patchState({
        componentMenuPos: { x: menuX, y: menuY },
        showComponentMenu: true,
      });
      if (!(await wait(300))) {
        return false;
      }

      const componentMenuItemCenter = getRelativeCenter(
        componentMenuItemRefs[componentMenuItemIndex]?.current,
      );
      patchState({
        cursorPos: componentMenuItemCenter || {
          x: componentTarget.x + 72,
          y: componentTarget.y + 80,
        },
      });
      if (!(await wait(220))) {
        return false;
      }

      patchState({ hoveredComponentMenuIndex: componentMenuItemIndex });
      if (!(await wait(2000))) {
        return false;
      }

      patchState({
        showComponentMenu: false,
        hoveredComponentMenuIndex: null,
        showHighlight: false,
        showAltShortcut: false,
        isCrosshair: true,
      });

      return wait(220);
    };

    const runDesktopDragSequence = async (): Promise<boolean> => {
      const sidebarPos = sidebarIconsPosRef.current;
      const dragStartX = sidebarPos.x + sidebarPos.width + 2;
      const dragStartY = sidebarPos.y + sidebarPos.height + 2;
      const dragEndX = sidebarPos.x - 2;
      const dragEndY = sidebarPos.y - 2;

      patchState({ cursorPos: { x: dragStartX, y: dragStartY } });
      if (!(await wait(500))) {
        return false;
      }

      patchState({
        isDragging: true,
        dragBox: { visible: true, x: dragStartX, y: dragStartY, width: 0, height: 0 },
      });

      const steps = 16;
      for (let step = 1; step <= steps; step += 1) {
        if (cancelled) {
          return false;
        }

        const progress = step / steps;
        const currentX = dragStartX + (dragEndX - dragStartX) * progress;
        const currentY = dragStartY + (dragEndY - dragStartY) * progress;
        const selectedSidebarIcons: number[] = [];
        if (progress > 0.75) {
          selectedSidebarIcons.push(0);
        }
        if (progress > 0.5) {
          selectedSidebarIcons.push(1);
        }
        if (progress > 0.25) {
          selectedSidebarIcons.push(2);
        }

        patchState({
          cursorPos: { x: currentX, y: currentY },
          dragBox: {
            visible: true,
            x: Math.min(dragStartX, currentX),
            y: Math.min(dragStartY, currentY),
            width: Math.abs(currentX - dragStartX),
            height: Math.abs(currentY - dragStartY),
          },
          selectedSidebarIcons,
        });

        await delay(25);
      }

      if (!(await wait(200))) {
        return false;
      }

      patchState({
        isDragging: false,
        dragBox: EMPTY_BOX,
        selectedSidebarIcons: [],
        areaOutline: {
          visible: true,
          x: Math.min(dragStartX, dragEndX),
          y: Math.min(dragStartY, dragEndY),
          width: Math.abs(dragEndX - dragStartX),
          height: Math.abs(dragEndY - dragStartY),
        },
        popupHeader: "Sidebar icons",
        typedText: "",
        popupPos: { x: dragEndX + 110, y: (dragStartY + dragEndY) / 2 - 40 },
        showPopup: true,
      });
      if (!(await wait(300))) {
        return false;
      }

      if (!(await typeFeedback(HERO_FEEDBACK_TEXTS.secondary, 35))) {
        return false;
      }
      if (!(await wait(300))) {
        return false;
      }

      patchState({ showPopup: false });
      if (!(await wait(200))) {
        return false;
      }

      patchState({
        greenMarkerPos: { x: dragStartX, y: dragEndY },
        showGreenMarker: true,
      });

      return wait(400);
    };

    const runMobileDragSequence = async (): Promise<boolean> => {
      const metricsPos = metricsPosRef.current;
      const dragStartX = metricsPos.x - 2;
      const dragStartY = metricsPos.y + metricsPos.height / 2;
      const dragEndX = metricsPos.x + metricsPos.width;
      const dragEndY = metricsPos.y + metricsPos.height + 2;

      patchState({ cursorPos: { x: dragStartX, y: dragStartY } });
      if (!(await wait(400))) {
        return false;
      }

      patchState({
        isDragging: true,
        dragBox: { visible: true, x: dragStartX, y: metricsPos.y - 2, width: 0, height: 0 },
      });

      const steps = 12;
      for (let step = 1; step <= steps; step += 1) {
        if (cancelled) {
          return false;
        }

        const progress = step / steps;
        const currentX = dragStartX + (dragEndX - dragStartX) * progress;
        const selectedMetrics: number[] = [];
        if (progress > 0.2) {
          selectedMetrics.push(0);
        }
        if (progress > 0.5) {
          selectedMetrics.push(1);
        }
        if (progress > 0.8) {
          selectedMetrics.push(2);
        }

        patchState({
          cursorPos: { x: currentX, y: dragStartY },
          dragBox: {
            visible: true,
            x: metricsPos.x - 2,
            y: metricsPos.y - 2,
            width: currentX - dragStartX,
            height: metricsPos.height + 4,
          },
          selectedMetrics,
        });

        await delay(25);
      }

      if (!(await wait(150))) {
        return false;
      }

      const containerWidth = contentRef.current?.offsetWidth || 300;
      patchState({
        isDragging: false,
        dragBox: EMPTY_BOX,
        selectedMetrics: [],
        areaOutline: {
          visible: true,
          x: metricsPos.x - 2,
          y: metricsPos.y - 2,
          width: metricsPos.width + 2,
          height: metricsPos.height + 4,
        },
        popupHeader: "Metrics cards",
        typedText: "",
        popupPos: {
          x: Math.min(metricsPos.x + metricsPos.width / 2, containerWidth - 100),
          y: dragEndY + 7,
        },
        showPopup: true,
      });
      if (!(await wait(250))) {
        return false;
      }

      if (!(await typeFeedback(HERO_FEEDBACK_TEXTS.secondary, 30))) {
        return false;
      }
      if (!(await wait(250))) {
        return false;
      }

      patchState({ showPopup: false });
      if (!(await wait(150))) {
        return false;
      }

      patchState({
        greenMarkerPos: { x: dragEndX, y: metricsPos.y + metricsPos.height / 2 },
        showGreenMarker: true,
      });

      return wait(300);
    };

    const annotateHeaderTextSequence = async (): Promise<boolean> => {
      const timePos = timePosRef.current;
      const textStartX = timePos.x;
      const textEndX = timePos.x + timePos.width;
      const textY = timePos.y + timePos.height / 2;

      patchState({
        isCrosshair: false,
        isIBeam: true,
        cursorPos: { x: textStartX, y: textY },
      });
      if (!(await wait(500))) {
        return false;
      }

      patchState({
        isDragging: true,
        textSelection: { visible: true, x: textStartX, y: timePos.y, width: 0 },
      });

      const textSteps = 12;
      for (let step = 1; step <= textSteps; step += 1) {
        if (cancelled) {
          return false;
        }

        const progress = step / textSteps;
        const currentX = textStartX + (textEndX - textStartX) * progress;
        patchState({
          cursorPos: { x: currentX, y: textY },
          textSelection: {
            visible: true,
            x: textStartX,
            y: timePos.y - 2,
            width: currentX - textStartX,
          },
        });
        await delay(30);
      }

      if (!(await wait(200))) {
        return false;
      }

      const containerWidth = contentRef.current?.offsetWidth || 300;
      const popupX = Math.min(Math.max(100, (textStartX + textEndX) / 2), containerWidth - 100);
      patchState({
        isDragging: false,
        popupHeader: `"${HERO_HEADER_TEXT}"`,
        typedText: "",
        popupPos: { x: popupX, y: timePos.y + timePos.height + 7 },
        showPopup: true,
      });
      if (!(await wait(300))) {
        return false;
      }

      if (!(await typeFeedback(HERO_FEEDBACK_TEXTS.tertiary, 35))) {
        return false;
      }
      if (!(await wait(300))) {
        return false;
      }

      patchState({ showPopup: false });
      if (!(await wait(200))) {
        return false;
      }

      patchState({
        orangeMarkerPos: { x: textEndX + 2, y: timePos.y + timePos.height / 2 },
        showOrangeMarker: true,
        textSelection: EMPTY_TEXT_SELECTION,
        isIBeam: false,
      });

      return wait(300);
    };

    const copyOutputSequence = async (isMobileView: boolean): Promise<boolean> => {
      const copyButtonCenter = getRelativeCenter(copyButtonRef.current);

      patchState({
        cursorPos: copyButtonCenter || { x: 400, y: 222 },
        isCrosshair: false,
      });
      if (!(await wait(350))) {
        return false;
      }

      patchState({ copyHovered: true });
      if (!(await wait(400))) {
        return false;
      }

      patchState({ copyHovered: false, copyClicked: true });
      if (!(await wait(400))) {
        return false;
      }

      patchState({ showTerminal: true });
      if (!(await wait(600))) {
        return false;
      }

      const terminalOutput = getTerminalOutput(isMobileView);
      const lines = terminalOutput.split("\n");
      let nextTerminalText = "";
      for (const line of lines) {
        if (cancelled) {
          return false;
        }

        nextTerminalText += `${line}\n`;
        patchState({ terminalText: nextTerminalText.trim() });
        await delay(80);
      }

      return wait(800);
    };

    const closeLoopSequence = async (): Promise<boolean> => {
      patchState({
        showNewMarker: false,
        showGreenMarker: false,
        showOrangeMarker: false,
        areaOutline: EMPTY_BOX,
        copyClicked: false,
        copyHovered: false,
        showTerminal: false,
        isToolbarExpanded: false,
        isCrosshair: false,
      });

      return wait(400);
    };

    const runAnimation = async (): Promise<void> => {
      resetState();
      const isMobileView = window.innerWidth <= 640;
      patchState({ isMobileView });

      const buttonPos = await openToolbarSequence();
      if (!buttonPos) {
        return;
      }
      if (!(await annotatePrimaryButtonSequence(buttonPos))) {
        return;
      }
      if (!(await inspectComponentSequence(buttonPos, isMobileView))) {
        return;
      }
      if (!(await (isMobileView ? runMobileDragSequence() : runDesktopDragSequence()))) {
        return;
      }
      if (!(await annotateHeaderTextSequence())) {
        return;
      }
      if (!(await copyOutputSequence(isMobileView))) {
        return;
      }
      await closeLoopSequence();
    };

    const startAnimation = (): void => {
      cancelled = false;
      void runAnimation();
      const loopInterval = window.innerWidth <= 640 ? 17800 : 20000;
      interval = setInterval(() => {
        void runAnimation();
      }, loopInterval);
    };

    const handleVisibility = (): void => {
      if (document.visibilityState !== "visible") {
        return;
      }

      cancelled = true;
      clearInterval(interval);
      resetState();
      setTimeout(() => {
        startAnimation();
      }, 100);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    startAnimation();

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const annotationCount =
    2 + Number(state.showNewMarker) + Number(state.showGreenMarker) + Number(state.showOrangeMarker);

  return {
    state: {
      ...state,
      annotationCount,
    },
    refs: {
      btnRef,
      timeRef,
      contentRef,
      metricsRef,
      toolbarContainerRef,
      sidebarIconsRef,
      copyButtonRef,
      componentMenuItemRefs,
    },
  };
}
