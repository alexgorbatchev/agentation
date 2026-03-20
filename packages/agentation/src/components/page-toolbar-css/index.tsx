"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import type { AnnotationPopupCSSHandle } from "../annotation-popup-css";
import {
  identifyElement,
  getNearbyText,
  getElementClasses,
  getDetailedComputedStyles,
  getForensicComputedStyles,
  getFullElementPath,
  getAccessibilityInfo,
  getNearbyElements,
  closestCrossingShadow,
} from "../../utils/element-identification";
import {
  saveAnnotations,
  getStorageKey,
  saveAnnotationsWithSyncMarker,
  loadToolbarHidden,
  saveToolbarHidden,
} from "../../utils/storage";
import { getReactComponentName } from "../../utils/react-detection";
import {
  getSourceLocation,
  findNearestComponentSource,
  formatSourceLocation,
} from "../../utils/source-location";
import {
  createComponentSourceUrl,
  formatComponentSourcePath,
  type ComponentEditor,
  type ComponentInspection,
  type ComponentSourceUrlParams,
} from "../../utils/component-inspector";
import {
  freeze as freezeAll,
  unfreeze as unfreezeAll,
  originalSetTimeout,
} from "../../utils/freeze-animations";

import type { Annotation } from "../../types";
import { useAnnotationActions } from "./hooks/useAnnotationActions";
import { useAnnotationPopupState } from "./hooks/useAnnotationPopupState";
import { useAnnotationState } from "./hooks/useAnnotationState";
import { useDragSelectionLifecycle } from "./hooks/useDragSelectionLifecycle";
import { useEndpointDiscovery } from "./hooks/useEndpointDiscovery";
import {
  useInteractionLifecycle,
  type ComponentMenuState,
  type HoverInfo,
  type PendingAnnotationState,
  type PendingMultiSelectElement,
} from "./hooks/useInteractionLifecycle";
import { useServerSync } from "./hooks/useServerSync";
import { useToolbarDragging } from "./hooks/useToolbarDragging";
import { useToolbarInteractions } from "./hooks/useToolbarInteractions";
import { useToolbarPreferences } from "./hooks/useToolbarPreferences";
import { useToolbarRenderTransitions } from "./hooks/useToolbarRenderTransitions";
import { InteractionOverlay } from "./components/InteractionOverlay";
import { MarkersLayer } from "./components/MarkersLayer";
import { ReviewQueuePanel } from "./components/ReviewQueuePanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { ToolbarControls } from "./components/ToolbarControls";
import { ToolbarShell } from "./components/ToolbarShell";
import { type OutputDetailLevel } from "./state/toolbar-settings";
import {
  deepElementFromPoint,
  isElementFixed,
  pierceElementFromPoint,
} from "./utils/pierceElementFromPoint";
import styles from "./styles.module.scss";

/**
 * Composes element identification with React component detection.
 * This is the boundary where we combine framework-agnostic element ID
 * with React-specific component name detection.
 */
function identifyElementWithReact(
  element: HTMLElement,
  reactMode: ReactComponentMode = "filtered",
): {
  /** Combined name for display (React path + element) */
  name: string;
  /** Raw element name without React path */
  elementName: string;
  /** DOM path */
  path: string;
  /** React component path (e.g., '<SideNav> <LinkComponent>') */
  reactComponents: string | null;
} {
  const { name: elementName, path } = identifyElement(element);

  // If React detection is off, just return element info
  if (reactMode === "off") {
    return { name: elementName, elementName, path, reactComponents: null };
  }

  const reactInfo = getReactComponentName(element, { mode: reactMode });

  return {
    name: reactInfo.path ? `${reactInfo.path} ${elementName}` : elementName,
    elementName,
    path,
    reactComponents: reactInfo.path,
  };
}

// =============================================================================
// Types
// =============================================================================

// ReactComponentMode is now derived from outputDetail when reactEnabled is true
type ReactComponentMode = "smart" | "filtered" | "all" | "off";

function normalizeNeovimBridgeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function removeLocalStorageItem(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // localStorage may be unavailable or blocked
  }
}

// Simple URL validation - checks for valid http(s) URL format
const isValidUrl = (url: string): boolean => {
  if (!url || !url.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

// Maps output detail level to React detection mode
const OUTPUT_TO_REACT_MODE: Record<OutputDetailLevel, ReactComponentMode> = {
  compact: "off",
  standard: "filtered",
  detailed: "smart",
  forensic: "all",
};

const OUTPUT_DETAIL_OPTIONS: { value: OutputDetailLevel; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "standard", label: "Standard" },
  { value: "detailed", label: "Detailed" },
  { value: "forensic", label: "Forensic" },
];

const COLOR_OPTIONS = [
  { value: "#AF52DE", label: "Purple" },
  { value: "#3c82f7", label: "Blue" },
  { value: "#5AC8FA", label: "Cyan" },
  { value: "#34C759", label: "Green" },
  { value: "#FFD60A", label: "Yellow" },
  { value: "#FF9500", label: "Orange" },
  { value: "#FF3B30", label: "Red" },
];

// =============================================================================
// Utils
// =============================================================================

function isRenderableAnnotation(_annotation: Annotation): boolean {
  return true; // All annotations are renderable — resolved ones show as faded checkmarks
}

function detectSourceFile(element: Element): string | undefined {
  const result = getSourceLocation(element as HTMLElement);
  const loc = result.found ? result : findNearestComponentSource(element as HTMLElement);
  if (loc.found && loc.source) {
    return formatSourceLocation(loc.source, "path");
  }
  return undefined;
}

// =============================================================================
// Types for Props
// =============================================================================

export type DemoAnnotation = {
  selector: string;
  comment: string;
  selectedText?: string;
};

export type PageFeedbackToolbarCSSProps = {
  demoAnnotations?: DemoAnnotation[];
  demoDelay?: number;
  enableDemoMode?: boolean;
  /** Callback fired when an annotation is added. */
  onAnnotationAdd?: (annotation: Annotation) => void;
  /** Callback fired when an annotation is deleted. */
  onAnnotationDelete?: (annotation: Annotation) => void;
  /** Callback fired when an annotation comment is edited. */
  onAnnotationUpdate?: (annotation: Annotation) => void;
  /** Callback fired when all annotations are cleared. Receives the annotations that were cleared. */
  onAnnotationsClear?: (annotations: Annotation[]) => void;
  /** Callback fired when the copy button is clicked. Receives the markdown output. */
  onCopy?: (markdown: string) => void;
  /** Callback fired when "Send to Agent" is clicked. Receives the markdown output and annotations. */
  onSubmit?: (output: string, annotations: Annotation[]) => void;
  /** Whether to copy to clipboard when the copy button is clicked. Defaults to true. */
  copyToClipboard?: boolean;
  /** Server URL for sync (e.g., "http://127.0.0.1:4747"). Optional; if omitted, Agentation probes the local endpoint once on page load. */
  endpoint?: string;
  /** Project identifier used to scope server sessions for multi-project agent loops. */
  projectId?: string;
  /** Pre-existing session ID to join. If not provided, creates or rejoins a project-scoped session. */
  sessionId?: string;
  /** Called when a new session is created. */
  onSessionCreated?: (sessionId: string) => void;
  /** Webhook URL to receive annotation events. */
  webhookUrl?: string;
  /** Custom class name applied to the toolbar container. Use to adjust positioning or z-index. */
  className?: string;
  /** Editor protocol used for alt+right-click component navigation. */
  componentEditor?: ComponentEditor;
  /** Override editor URL generation for alt+right-click component navigation. */
  getComponentEditorUrl?: (params: ComponentSourceUrlParams) => string;
  /** Override navigation side effects for opening component sources. */
  navigateToUrl?: (url: string) => void;
  /** Base URL for the Neovim bridge/router when using componentEditor="neovim". */
  neovimBridgeUrl?: string;
  /** Optional project ID used by the Neovim router to resolve the target session. */
  neovimProjectId?: string;
  /** Copy the component source path to the clipboard when opening it. */
  copyComponentSourcePath?: boolean;
};

/** Public Agentation props require project scoping. */
export type AgentationProps = Omit<PageFeedbackToolbarCSSProps, "projectId"> & {
  projectId: string;
};

// =============================================================================
// Component
// =============================================================================

export function PageFeedbackToolbarCSS({
  demoAnnotations,
  demoDelay = 1000,
  enableDemoMode = false,
  onAnnotationAdd,
  onAnnotationDelete,
  onAnnotationUpdate,
  onAnnotationsClear,
  onCopy,
  onSubmit,
  copyToClipboard = true,
  endpoint,
  projectId,
  sessionId: initialSessionId,
  onSessionCreated,
  webhookUrl,
  className: userClassName,
  componentEditor = "vscode",
  getComponentEditorUrl,
  navigateToUrl = (url: string): void => {
    window.location.assign(url);
  },
  neovimBridgeUrl = "http://127.0.0.1:8777",
  neovimProjectId,
  copyComponentSourcePath = true,
}: PageFeedbackToolbarCSSProps = {}) {
  const [isActive, setIsActive] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const [isToolbarHidden, setIsToolbarHidden] = useState(() => loadToolbarHidden());
  const [isToolbarHiding, setIsToolbarHiding] = useState(false);

  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "/";

  const resolvedEndpoint = useEndpointDiscovery(endpoint);

  // Stop native events from bubbling past document.body when they originate
  // inside the toolbar portal. Without this, clicks on the toolbar propagate to
  // document-level listeners, triggering "click outside" handlers that close
  // modals, dropdowns, and drawers. We attach to body (not a wrapper div) so
  // React's synthetic event delegation (which also listens on body/root) still
  // works — we only block propagation from body → document/window.
  const portalWrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stop = (e: Event) => {
      const wrapper = portalWrapperRef.current;
      if (wrapper && wrapper.contains(e.target as Node)) {
        e.stopPropagation();
      }
    };
    const events = ["mousedown", "click", "pointerdown"] as const;
    events.forEach((evt) => document.body.addEventListener(evt, stop));
    return () => {
      events.forEach((evt) => document.body.removeEventListener(evt, stop));
    };
  }, []);

  // Unified marker visibility state - controls both toolbar and eye toggle
  const [markersVisible, setMarkersVisible] = useState(false);
  const [markersExiting, setMarkersExiting] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [pendingAnnotation, setPendingAnnotation] =
    useState<PendingAnnotationState | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [hoveredTargetElement, setHoveredTargetElement] =
    useState<HTMLElement | null>(null);
  const [hoveredTargetElements, setHoveredTargetElements] = useState<
    HTMLElement[]
  >([]);
  const [deletingMarkerId, setDeletingMarkerId] = useState<string | null>(null);
  const [renumberFrom, setRenumberFrom] = useState<number | null>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(
    null,
  );
  const [isReplySending, setIsReplySending] = useState(false);
  const [editingTargetElement, setEditingTargetElement] =
    useState<HTMLElement | null>(null);
  const [editingTargetElements, setEditingTargetElements] = useState<
    HTMLElement[]
  >([]);
  const [scrollY, setScrollY] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSettingsVisible, setShowSettingsVisible] = useState(false);
  const [showReviewQueue, setShowReviewQueue] = useState(false);
  const [showReviewQueueVisible, setShowReviewQueueVisible] = useState(false);
  const [componentMenu, setComponentMenu] = useState<ComponentMenuState | null>(
    null,
  );
  const [hoveredComponentMenuIndex, setHoveredComponentMenuIndex] = useState<
    number | null
  >(null);
  const [settingsPage, setSettingsPage] = useState<"main" | "automations">(
    "main",
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Cmd+shift+click multi-select state
  const [pendingMultiSelectElements, setPendingMultiSelectElements] = useState<
    PendingMultiSelectElement[]
  >([]);

  const {
    settings,
    setSettings,
    isDarkMode,
    setIsDarkMode,
    toolbarPosition,
    setToolbarPosition,
    mounted,
    showEntranceAnimation,
  } = useToolbarPreferences({ pathname });

  const {
    annotations,
    setAnnotations,
    toggleReviewed,
    clearReviewedAnnotations,
  } = useAnnotationState({
    pathname,
    resolvedEndpoint,
  });

  // Check if running in development mode - React detection only works in development mode
  const isDevMode = process.env.NODE_ENV === "development";

  // Effective React mode - derived from outputDetail when enabled
  const effectiveReactMode: ReactComponentMode =
    isDevMode && settings.reactEnabled
      ? OUTPUT_TO_REACT_MODE[settings.outputDetail]
      : "off";

  const normalizedNeovimBridgeUrl = normalizeNeovimBridgeUrl(neovimBridgeUrl);

  const {
    currentSessionId,
    connectionStatus,
    neovimConnectionStatus,
  } = useServerSync({
    resolvedEndpoint,
    mounted,
    pathname,
    projectId,
    initialSessionId,
    onSessionCreated,
    setAnnotations,
    isRenderableAnnotation,
    componentEditor,
    normalizedNeovimBridgeUrl,
    neovimProjectId,
  });

  const {
    isDraggingToolbar,
    dragRotation,
    handleToolbarMouseDown,
    consumeJustFinishedToolbarDrag,
  } = useToolbarDragging({
    toolbarPosition,
    setToolbarPosition,
    isActive,
    connectionStatus,
    settingsPanelClassName: styles.settingsPanel,
    mounted,
  });

  // For animations - track which markers have animated in and which are exiting
  const [animatedMarkers, setAnimatedMarkers] = useState<Set<string>>(
    new Set(),
  );
  const [exitingMarkers, setExitingMarkers] = useState<Set<string>>(new Set());
  const [pendingExiting, setPendingExiting] = useState(false);
  const [editExiting, setEditExiting] = useState(false);

  const recentlyAddedIdRef = useRef<string | null>(null);

  const popupRef = useRef<AnnotationPopupCSSHandle>(null);
  const editPopupRef = useRef<AnnotationPopupCSSHandle>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof originalSetTimeout> | null>(null);

  const {
    isDragging,
    dragRectRef,
    highlightsContainerRef,
    consumeJustFinishedDrag,
  } = useDragSelectionLifecycle({
    isActive,
    pendingAnnotation,
    detectSourceFile,
    setPendingAnnotation,
    setHoverInfo,
    selectedElementHighlightClassName: styles.selectedElementHighlight,
  });

  useEffect(() => {
    setScrollY(window.scrollY);
  }, []);

  const handleClearReviewedAnnotations = useCallback(() => {
    clearReviewedAnnotations(() => setShowReviewQueue(false));
  }, [clearReviewedAnnotations]);

  const hideToolbarTemporarily = useCallback(() => {
    if (isToolbarHiding) return;
    setIsToolbarHiding(true);
    setShowSettings(false);
    setShowReviewQueue(false);
    setIsActive(false);
    originalSetTimeout(() => {
      saveToolbarHidden(true);
      setIsToolbarHidden(true);
      setIsToolbarHiding(false);
    }, 400);
  }, [isToolbarHiding]);

  // Demo annotations
  useEffect(() => {
    if (!enableDemoMode) return;
    if (!mounted || !demoAnnotations || demoAnnotations.length === 0) return;
    if (annotations.length > 0) return;

    const timeoutIds: ReturnType<typeof originalSetTimeout>[] = [];
    const initialActivationDelay = Math.max(0, demoDelay - 200);

    timeoutIds.push(
      originalSetTimeout(() => {
        setIsActive(true);
      }, initialActivationDelay),
    );

    demoAnnotations.forEach((demo, index) => {
      const annotationDelay = demoDelay + index * 300;

      timeoutIds.push(
        originalSetTimeout(() => {
          const element = document.querySelector(demo.selector) as HTMLElement;
          if (!element) return;

          const rect = element.getBoundingClientRect();
          const { name, path } = identifyElement(element);

          const newAnnotation: Annotation = {
            id: `demo-${Date.now()}-${index}`,
            x: ((rect.left + rect.width / 2) / window.innerWidth) * 100,
            y: rect.top + rect.height / 2 + window.scrollY,
            comment: demo.comment,
            element: name,
            elementPath: path,
            timestamp: Date.now(),
            selectedText: demo.selectedText,
            boundingBox: {
              x: rect.left,
              y: rect.top + window.scrollY,
              width: rect.width,
              height: rect.height,
            },
            nearbyText: getNearbyText(element),
            cssClasses: getElementClasses(element),
          };

          setAnnotations((prev) => [...prev, newAnnotation]);
        }, annotationDelay),
      );
    });

    return () => {
      timeoutIds.forEach(clearTimeout);
    };
  }, [enableDemoMode, mounted, demoAnnotations, demoDelay]);

  // Track scroll
  useEffect(() => {
    const handleScroll = () => {
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
  }, []);

  // Save annotations (preserving sync markers if connected to a session)
  useEffect(() => {
    if (mounted && annotations.length > 0) {
      if (currentSessionId) {
        // Connected to session - save with sync marker to prevent re-upload on refresh
        saveAnnotationsWithSyncMarker(pathname, annotations, currentSessionId);
      } else {
        // Not connected - save without markers (will sync when connected)
        saveAnnotations(pathname, annotations);
      }
    } else if (mounted && annotations.length === 0) {
      removeLocalStorageItem(getStorageKey(pathname));
    }
  }, [annotations, pathname, mounted, currentSessionId]);

  // Freeze animations (delegates to freeze-animations utility)
  const freezeAnimations = useCallback(() => {
    if (isFrozen) return;
    freezeAll();
    setIsFrozen(true);
  }, [isFrozen]);

  const unfreezeAnimations = useCallback(() => {
    if (!isFrozen) return;
    unfreezeAll();
    setIsFrozen(false);
  }, [isFrozen]);

  const toggleFreeze = useCallback(() => {
    if (isFrozen) {
      unfreezeAnimations();
    } else {
      freezeAnimations();
    }
  }, [isFrozen, freezeAnimations, unfreezeAnimations]);

  // Create pending annotation from cmd+shift+click multi-select
  const createMultiSelectPendingAnnotation = useCallback(() => {
    if (pendingMultiSelectElements.length === 0) return;

    const firstItem = pendingMultiSelectElements[0];
    const firstEl = firstItem.element;
    const isMulti = pendingMultiSelectElements.length > 1;

    // Get fresh rects for all elements
    const freshRects = pendingMultiSelectElements.map((item) =>
      item.element.getBoundingClientRect(),
    );

    if (!isMulti) {
      // Single element - treat as regular annotation (not multi-select)
      const rect = freshRects[0];
      const isFixed = isElementFixed(firstEl);

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
        fullPath: getFullElementPath(firstEl),
        accessibility: getAccessibilityInfo(firstEl),
        computedStyles: getForensicComputedStyles(firstEl),
        computedStylesObj: getDetailedComputedStyles(firstEl),
        nearbyElements: getNearbyElements(firstEl),
        cssClasses: getElementClasses(firstEl),
        nearbyText: getNearbyText(firstEl),
        reactComponents: firstItem.reactComponents,
        sourceFile: detectSourceFile(firstEl),
      });
    } else {
      // Multiple elements - multi-select annotation
      const bounds = {
        left: Math.min(...freshRects.map((r) => r.left)),
        top: Math.min(...freshRects.map((r) => r.top)),
        right: Math.max(...freshRects.map((r) => r.right)),
        bottom: Math.max(...freshRects.map((r) => r.bottom)),
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

      // Position marker near the last selected element (most recent click)
      const lastItem = pendingMultiSelectElements[pendingMultiSelectElements.length - 1];
      const lastEl = lastItem.element;
      const lastRect = freshRects[freshRects.length - 1];
      const lastCenterX = lastRect.left + lastRect.width / 2;
      const lastCenterY = lastRect.top + lastRect.height / 2;
      const lastIsFixed = isElementFixed(lastEl);

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
        targetElement: lastEl, // Anchor marker/popup to last clicked element
        fullPath: getFullElementPath(firstEl),
        accessibility: getAccessibilityInfo(firstEl),
        computedStyles: getForensicComputedStyles(firstEl),
        computedStylesObj: getDetailedComputedStyles(firstEl),
        nearbyElements: getNearbyElements(firstEl),
        cssClasses: getElementClasses(firstEl),
        nearbyText: getNearbyText(firstEl),
        sourceFile: detectSourceFile(firstEl),
      });
    }

    setPendingMultiSelectElements([]);
    setHoverInfo(null);
  }, [pendingMultiSelectElements]);

  // Reset state when deactivating
  useEffect(() => {
    if (!isActive) {
      setComponentMenu(null);
      setHoveredComponentMenuIndex(null);
      setPendingAnnotation(null);
      setEditingAnnotation(null);
      setEditingTargetElement(null);
      setEditingTargetElements([]);
      setHoverInfo(null);
      setShowSettings(false); // Close settings when toolbar closes
      setShowReviewQueue(false); // Close review queue when toolbar closes
      setPendingMultiSelectElements([]); // Clear multi-select
      if (isFrozen) {
        unfreezeAnimations();
      }
    }
  }, [isActive, isFrozen, unfreezeAnimations]);

  // Unmount safety — if component is removed while frozen, unfreeze the page
  useEffect(() => {
    return () => {
      unfreezeAll();
    };
  }, []);

  const {
    copied,
    sendState,
    fireWebhook,
    clearAll,
    copyOutput,
    sendToWebhook,
  } = useAnnotationActions({
    annotations,
    pathname,
    settings,
    effectiveReactMode,
    copyToClipboard,
    resolvedEndpoint,
    webhookUrl,
    onAnnotationsClear,
    onCopy,
    onSubmit,
    setAnnotations,
    setAnimatedMarkers,
    setIsClearing,
    removeLocalStorageItem,
  });

  const {
    addAnnotation,
    cancelAnnotation,
    deleteAnnotation,
    startEditAnnotation,
    handleMarkerHover,
    updateAnnotation,
    handleThreadReply,
    cancelEditAnnotation,
  } = useAnnotationPopupState({
    annotations,
    setAnnotations,
    pendingAnnotation,
    setPendingAnnotation,
    setPendingExiting,
    setEditingAnnotation,
    editingAnnotation,
    setEditingTargetElement,
    setEditingTargetElements,
    setHoveredMarkerId,
    setHoveredTargetElement,
    setHoveredTargetElements,
    setDeletingMarkerId,
    setExitingMarkers,
    setRenumberFrom,
    setAnimatedMarkers,
    setEditExiting,
    setIsReplySending,
    currentSessionId,
    resolvedEndpoint,
    fireWebhook,
    deepElementFromPoint,
    recentlyAddedIdRef,
    onAnnotationAdd,
    onAnnotationDelete,
    onAnnotationUpdate,
  });

  const {
    isAltSelectionHeld,
    tooltipsHidden,
    setTooltipsHidden,
    tooltipSessionActive,
    hideTooltipsUntilMouseLeave,
    handleControlsMouseEnter,
    handleControlsMouseLeave,
  } = useToolbarInteractions({
    isActive,
    setIsActive,
    hasPendingAnnotation: pendingAnnotation !== null,
    hasEditingAnnotation: editingAnnotation !== null,
    pendingMultiSelectCount: pendingMultiSelectElements.length,
    hasComponentMenu: componentMenu !== null,
    annotationsCount: annotations.length,
    settingsWebhookUrl: settings.webhookUrl,
    webhookUrl,
    sendState,
    sendToWebhook,
    toggleFreeze,
    copyOutput,
    clearAll,
    toggleMarkers: () => setShowMarkers((prev) => !prev),
    toggleReviewQueue: () => setShowReviewQueue((prev) => !prev),
    clearPendingMultiSelect: () => setPendingMultiSelectElements([]),
  });

  useToolbarRenderTransitions({
    isActive,
    showMarkers,
    annotations,
    markersVisible,
    showSettings,
    showReviewQueue,
    settingsPage,
    setMarkersVisible,
    setMarkersExiting,
    setAnimatedMarkers,
    setShowSettingsVisible,
    setShowReviewQueueVisible,
    setShowReviewQueue,
    setShowSettings,
    setTooltipsHidden,
    setSettingsPage,
    setIsTransitioning,
  });

  useInteractionLifecycle({
    isActive,
    isAltSelectionHeld,
    pendingAnnotation,
    setPendingAnnotation,
    editingAnnotation,
    settingsBlockInteractions: settings.blockInteractions,
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
  });

  if (!mounted) return null;
  if (isToolbarHidden) return null;

  const isResolvedAnnotation = (a: Annotation) =>
    a.status === "resolved" || a.status === "dismissed";

  const activeAnnotations = annotations.filter(
    (a) => !exitingMarkers.has(a.id) && !isResolvedAnnotation(a),
  );
  const resolvedAnnotations = annotations.filter(isResolvedAnnotation);
  const unreviewedCount = resolvedAnnotations.filter((a) => !a._reviewedAt).length;
  const hasAnnotations = activeAnnotations.length > 0 || resolvedAnnotations.length > 0;

  // visibleAnnotations = active only (for numbered markers + existing logic)
  const visibleAnnotations = activeAnnotations;
  const exitingAnnotationsList = annotations.filter((a) =>
    exitingMarkers.has(a.id),
  );

  // Helper function to calculate viewport-aware tooltip positioning
  // Helper function to calculate viewport-aware tooltip positioning
  const getTooltipPosition = (annotation: Annotation): React.CSSProperties => {
    // Tooltip dimensions (from CSS)
    const tooltipMaxWidth = 200;
    const tooltipEstimatedHeight = 80; // Estimated max height
    const markerSize = 22;
    const gap = 10;

    // Convert percentage-based x to pixels
    const markerX = (annotation.x / 100) * window.innerWidth;
    const markerY =
      typeof annotation.y === "string"
        ? parseFloat(annotation.y)
        : annotation.y;

    const styles: React.CSSProperties = {};

    // Vertical positioning: flip if near bottom
    const spaceBelow = window.innerHeight - markerY - markerSize - gap;
    if (spaceBelow < tooltipEstimatedHeight) {
      // Show above marker
      styles.top = "auto";
      styles.bottom = `calc(100% + ${gap}px)`;
    }
    // If enough space below, use default CSS (top: calc(100% + 10px))

    // Horizontal positioning: adjust if near edges
    const centerX = markerX - tooltipMaxWidth / 2;
    const edgePadding = 10;

    if (centerX < edgePadding) {
      // Too close to left edge
      const offset = edgePadding - centerX;
      styles.left = `calc(50% + ${offset}px)`;
    } else if (centerX + tooltipMaxWidth > window.innerWidth - edgePadding) {
      // Too close to right edge
      const overflow =
        centerX + tooltipMaxWidth - (window.innerWidth - edgePadding);
      styles.left = `calc(50% - ${overflow}px)`;
    }
    // If centered position is fine, use default CSS (left: 50%)

    return styles;
  };

  async function openComponentSource(item: ComponentInspection): Promise<void> {
    const sourcePath = formatComponentSourcePath(item.source);

    if (copyComponentSourcePath) {
      try {
        await navigator.clipboard.writeText(sourcePath);
      } catch {
        // Ignore clipboard failures and still attempt editor navigation.
      }
    }

    const url = createComponentSourceUrl(
      item.source,
      componentEditor,
      getComponentEditorUrl,
      normalizedNeovimBridgeUrl,
      neovimProjectId,
    );

    if (
      componentEditor === "neovim" &&
      /^https?:\/\//.test(url) &&
      typeof fetch === "function"
    ) {
      try {
        await fetch(url, {
          method: "GET",
          mode: "cors",
          keepalive: true,
        });
      } catch {
        // Ignore local bridge failures and keep the menu behavior predictable.
      }
    } else {
      navigateToUrl(url);
    }

    setComponentMenu(null);
    setHoveredComponentMenuIndex(null);
  }

  const toolbarContainerClassName = `${styles.toolbarContainer} ${
    !isDarkMode ? styles.light : ""
  } ${isActive ? styles.expanded : styles.collapsed} ${
    showEntranceAnimation ? styles.entrance : ""
  } ${isToolbarHiding ? styles.hiding : ""} ${
    isDraggingToolbar ? styles.dragging : ""
  } ${
    !settings.webhooksEnabled &&
    (isValidUrl(settings.webhookUrl) || isValidUrl(webhookUrl || ""))
      ? styles.serverConnected
      : ""
  }`;

  return createPortal(
    <div ref={portalWrapperRef} style={{ display: "contents" }}>
      {/* Toolbar */}
      <ToolbarShell className={userClassName} toolbarPosition={toolbarPosition}>
        {/* Morphing container */}
        <div
          className={toolbarContainerClassName}
          onClick={
            !isActive
              ? (event) => {
                  if (consumeJustFinishedToolbarDrag()) {
                    event.preventDefault();
                    return;
                  }
                  setIsActive(true);
                }
              : undefined
          }
          onMouseDown={handleToolbarMouseDown}
          role={!isActive ? "button" : undefined}
          tabIndex={!isActive ? 0 : -1}
          title={!isActive ? "Start feedback mode" : undefined}
          style={{
            ...(isDraggingToolbar && {
              transform: `scale(1.05) rotate(${dragRotation}deg)`,
              cursor: "grabbing",
            }),
          }}
        >
          <ToolbarControls
            isActive={isActive}
            isDarkMode={isDarkMode}
            activeAnnotations={activeAnnotations}
            showEntranceAnimation={showEntranceAnimation}
            annotationColor={settings.annotationColor}
            toolbarPosition={toolbarPosition}
            tooltipsHidden={tooltipsHidden}
            showSettings={showSettings}
            showReviewQueue={showReviewQueue}
            tooltipSessionActive={tooltipSessionActive}
            handleControlsMouseEnter={handleControlsMouseEnter}
            handleControlsMouseLeave={handleControlsMouseLeave}
            isFrozen={isFrozen}
            hideTooltipsUntilMouseLeave={hideTooltipsUntilMouseLeave}
            toggleFreeze={toggleFreeze}
            hasAnnotations={hasAnnotations}
            showMarkers={showMarkers}
            onToggleMarkers={() => setShowMarkers((previous) => !previous)}
            copied={copied}
            copyOutput={copyOutput}
            webhooksEnabled={settings.webhooksEnabled}
            settingsWebhookUrl={settings.webhookUrl}
            webhookUrl={webhookUrl}
            sendState={sendState}
            sendToWebhook={sendToWebhook}
            clearAll={clearAll}
            resolvedAnnotationsCount={resolvedAnnotations.length}
            unreviewedCount={unreviewedCount}
            onToggleReviewQueue={() => setShowReviewQueue((previous) => !previous)}
            resolvedEndpoint={resolvedEndpoint}
            connectionStatus={connectionStatus}
            onToggleSettings={() => setShowSettings((previous) => !previous)}
            onDeactivate={() => setIsActive(false)}
            isValidUrl={isValidUrl}
          />

          <SettingsPanel
            isDarkMode={isDarkMode}
            showSettingsVisible={showSettingsVisible}
            isTransitioning={isTransitioning}
            toolbarPosition={toolbarPosition}
            settingsPage={settingsPage}
            setSettingsPage={setSettingsPage}
            settings={settings}
            setSettings={setSettings}
            setIsDarkMode={setIsDarkMode}
            isDevMode={isDevMode}
            projectId={projectId}
            resolvedEndpoint={resolvedEndpoint}
            connectionStatus={connectionStatus}
            neovimConnectionStatus={neovimConnectionStatus}
            componentEditor={componentEditor}
            hideToolbarTemporarily={hideToolbarTemporarily}
            outputDetailOptions={OUTPUT_DETAIL_OPTIONS}
            colorOptions={COLOR_OPTIONS}
          />

          <ReviewQueuePanel
            isDarkMode={isDarkMode}
            showReviewQueueVisible={showReviewQueueVisible}
            toolbarPosition={toolbarPosition}
            resolvedAnnotations={resolvedAnnotations}
            toggleReviewed={toggleReviewed}
            setAnnotations={setAnnotations}
            handleClearReviewedAnnotations={handleClearReviewedAnnotations}
          />
        </div>
      </ToolbarShell>

      <MarkersLayer
        markersVisible={markersVisible}
        markersExiting={markersExiting}
        visibleAnnotations={visibleAnnotations}
        activeAnnotations={activeAnnotations}
        resolvedAnnotations={resolvedAnnotations}
        exitingAnnotationsList={exitingAnnotationsList}
        annotationColor={settings.annotationColor}
        deletingMarkerId={deletingMarkerId}
        editingAnnotation={editingAnnotation}
        renumberFrom={renumberFrom}
        animatedMarkers={animatedMarkers}
        isClearing={isClearing}
        recentlyAddedId={recentlyAddedIdRef.current}
        hoveredMarkerId={hoveredMarkerId}
        isDarkMode={isDarkMode}
        markerClickBehavior={settings.markerClickBehavior}
        getTooltipPosition={getTooltipPosition}
        handleMarkerHover={handleMarkerHover}
        deleteAnnotation={deleteAnnotation}
        startEditAnnotation={startEditAnnotation}
      />

      <InteractionOverlay
        isActive={isActive}
        pendingAnnotation={pendingAnnotation}
        editingAnnotation={editingAnnotation}
        hoverInfo={hoverInfo}
        isScrolling={isScrolling}
        isDragging={isDragging}
        annotationColor={settings.annotationColor}
        pendingMultiSelectElements={pendingMultiSelectElements}
        hoveredMarkerId={hoveredMarkerId}
        annotations={annotations}
        hoveredTargetElement={hoveredTargetElement}
        hoveredTargetElements={hoveredTargetElements}
        scrollY={scrollY}
        hoverPosition={hoverPosition}
        componentMenu={componentMenu}
        isDarkMode={isDarkMode}
        hoveredComponentMenuIndex={hoveredComponentMenuIndex}
        setHoveredComponentMenuIndex={setHoveredComponentMenuIndex}
        openComponentSource={openComponentSource}
        pendingExiting={pendingExiting}
        popupRef={popupRef}
        addAnnotation={addAnnotation}
        cancelAnnotation={cancelAnnotation}
        editingTargetElement={editingTargetElement}
        editingTargetElements={editingTargetElements}
        editPopupRef={editPopupRef}
        updateAnnotation={updateAnnotation}
        cancelEditAnnotation={cancelEditAnnotation}
        deleteAnnotation={deleteAnnotation}
        editExiting={editExiting}
        resolvedEndpoint={resolvedEndpoint}
        handleThreadReply={handleThreadReply}
        isReplySending={isReplySending}
        dragRectRef={dragRectRef}
        highlightsContainerRef={highlightsContainerRef}
      />
    </div>,
    document.body,
  );
}

export default PageFeedbackToolbarCSS;
