"use client";

import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { AnnotationPopupCSSHandle } from "../annotation-popup-css";
import { saveToolbarHidden } from "../../utils/storage";
import {
  freeze as freezeAll,
  originalSetTimeout,
  unfreeze as unfreezeAll,
} from "../../utils/freeze-animations";

import { COLOR_OPTIONS, OUTPUT_DETAIL_OPTIONS, OUTPUT_TO_REACT_MODE } from "./constants";
import { AgentationNotificationToast } from "./components/AgentationNotificationToast";
import { InteractionOverlay } from "./components/InteractionOverlay";
import { MarkersLayer } from "./components/MarkersLayer";
import { ReviewQueuePanel } from "./components/ReviewQueuePanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { ToolbarControls } from "./components/ToolbarControls";
import { ToolbarShell } from "./components/ToolbarShell";
import { useAnnotationActions } from "./hooks/useAnnotationActions";
import { useAnnotationPersistence } from "./hooks/useAnnotationPersistence";
import { useAnnotationPopupState } from "./hooks/useAnnotationPopupState";
import { useAcknowledgementNotification } from "./hooks/useAcknowledgementNotification";
import { useAnnotationState } from "./hooks/useAnnotationState";
import { useAnnotationViewModel } from "./hooks/useAnnotationViewModel";
import { useComponentSourceNavigation } from "./hooks/useComponentSourceNavigation";
import { useDemoAnnotations } from "./hooks/useDemoAnnotations";
import { useDragSelectionLifecycle } from "./hooks/useDragSelectionLifecycle";
import { useEndpointDiscovery } from "./hooks/useEndpointDiscovery";
import { useInteractionLifecycle } from "./hooks/useInteractionLifecycle";
import { useInteractionOverlayModel } from "./hooks/useInteractionOverlayModel";
import { useInteractionSelectionState } from "./hooks/useInteractionSelectionState";
import { useMarkerAnimationState } from "./hooks/useMarkerAnimationState";
import { usePendingMultiSelectAnnotation } from "./hooks/usePendingMultiSelectAnnotation";
import { usePortalEventBoundary } from "./hooks/usePortalEventBoundary";
import { useScrollState } from "./hooks/useScrollState";
import { useServerSync } from "./hooks/useServerSync";
import { useToolbarActiveLifecycle } from "./hooks/useToolbarActiveLifecycle";
import { useToolbarDragging } from "./hooks/useToolbarDragging";
import { useToolbarInteractions } from "./hooks/useToolbarInteractions";
import { useToolbarPreferences } from "./hooks/useToolbarPreferences";
import { useToolbarRenderTransitions } from "./hooks/useToolbarRenderTransitions";
import { useToolbarUiState } from "./hooks/useToolbarUiState";
import type { PageFeedbackToolbarCSSProps, ReactComponentMode } from "./types";
import {
  deepElementFromPoint,
  isElementFixed,
  pierceElementFromPoint,
} from "./utils/pierceElementFromPoint";
import { detectSourceFile } from "./utils/detectSourceFile";
import { getTooltipPosition } from "./utils/getTooltipPosition";
import { identifyElementWithReact } from "./utils/identifyElementWithReact";
import { isValidUrl } from "./utils/isValidUrl";
import { normalizeNeovimBridgeUrl } from "./utils/normalizeNeovimBridgeUrl";
import { removeLocalStorageItem } from "./utils/removeLocalStorageItem";
import styles from "./styles.module.scss";

export type {
  AgentationProps,
  DemoAnnotation,
  PageFeedbackToolbarCSSProps,
} from "./types";

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
  const {
    isActive,
    setIsActive,
    showMarkers,
    setShowMarkers,
    isToolbarHidden,
    setIsToolbarHidden,
    isToolbarHiding,
    setIsToolbarHiding,
    markersVisible,
    setMarkersVisible,
    markersExiting,
    setMarkersExiting,
    showSettings,
    setShowSettings,
    showSettingsVisible,
    setShowSettingsVisible,
    showReviewQueue,
    setShowReviewQueue,
    showReviewQueueVisible,
    setShowReviewQueueVisible,
    settingsPage,
    setSettingsPage,
    isTransitioning,
    setIsTransitioning,
  } = useToolbarUiState();

  const {
    hoverInfo,
    setHoverInfo,
    hoverPosition,
    setHoverPosition,
    pendingAnnotation,
    setPendingAnnotation,
    hoveredMarkerId,
    setHoveredMarkerId,
    hoveredTargetElement,
    setHoveredTargetElement,
    hoveredTargetElements,
    setHoveredTargetElements,
    editingAnnotation,
    setEditingAnnotation,
    editingTargetElement,
    setEditingTargetElement,
    editingTargetElements,
    setEditingTargetElements,
    componentMenu,
    setComponentMenu,
    hoveredComponentMenuIndex,
    setHoveredComponentMenuIndex,
    pendingMultiSelectElements,
    setPendingMultiSelectElements,
    isReplySending,
    setIsReplySending,
    scrollY,
    setScrollY,
    isScrolling,
    setIsScrolling,
  } = useInteractionSelectionState();

  const {
    animatedMarkers,
    setAnimatedMarkers,
    exitingMarkers,
    setExitingMarkers,
    pendingExiting,
    setPendingExiting,
    editExiting,
    setEditExiting,
    deletingMarkerId,
    setDeletingMarkerId,
    renumberFrom,
    setRenumberFrom,
    isClearing,
    setIsClearing,
    recentlyAddedIdRef,
  } = useMarkerAnimationState();

  const [isFrozen, setIsFrozen] = useState(false);

  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "/";

  const resolvedEndpoint = useEndpointDiscovery(endpoint, projectId);
  const portalWrapperRef = usePortalEventBoundary();

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

  const popupRef = useRef<AnnotationPopupCSSHandle>(null);
  const editPopupRef = useRef<AnnotationPopupCSSHandle>(null);

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

  useScrollState({
    setScrollY,
    setIsScrolling,
  });

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

  useDemoAnnotations({
    enableDemoMode,
    mounted,
    demoAnnotations,
    demoDelay,
    hasAnnotations: annotations.length > 0,
    setIsActive,
    setAnnotations,
  });

  useAnnotationPersistence({
    mounted,
    annotations,
    pathname,
    currentSessionId,
    removeLocalStorageItem,
  });

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

  const { createMultiSelectPendingAnnotation } = usePendingMultiSelectAnnotation({
    pendingMultiSelectElements,
    setPendingAnnotation,
    setHoverInfo,
    setPendingMultiSelectElements,
    isElementFixed,
    detectSourceFile,
  });

  useToolbarActiveLifecycle({
    isActive,
    isFrozen,
    unfreezeAnimations,
    cleanupUnfreeze: unfreezeAll,
    setComponentMenu,
    setHoveredComponentMenuIndex,
    setPendingAnnotation,
    setEditingAnnotation,
    setEditingTargetElement,
    setEditingTargetElements,
    setHoverInfo,
    setShowSettings,
    setShowReviewQueue,
    setPendingMultiSelectElements,
  });

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
    projectId,
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
    projectId,
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

  const { openComponentSource } = useComponentSourceNavigation({
    copyComponentSourcePath,
    componentEditor,
    getComponentEditorUrl,
    normalizedNeovimBridgeUrl,
    neovimProjectId,
    navigateToUrl,
    closeComponentMenu: () => {
      setComponentMenu(null);
      setHoveredComponentMenuIndex(null);
    },
  });

  const {
    activeAnnotations,
    resolvedAnnotations,
    unreviewedCount,
    hasAnnotations,
    visibleAnnotations,
    exitingAnnotationsList,
  } = useAnnotationViewModel({
    annotations,
    exitingMarkers,
  });

  const { activeNotification } = useAcknowledgementNotification({
    annotations,
  });

  const interactionOverlayModel = useInteractionOverlayModel({
    isActive,
    pendingAnnotation,
    editingAnnotation,
    hoverInfo,
    isScrolling,
    isDragging,
    annotationColor: settings.annotationColor,
    pendingMultiSelectElements,
    hoveredMarkerId,
    annotations,
    hoveredTargetElement,
    hoveredTargetElements,
    scrollY,
    hoverPosition,
    componentMenu,
    isDarkMode,
    hoveredComponentMenuIndex,
    pendingExiting,
    editingTargetElement,
    editingTargetElements,
    editExiting,
    resolvedEndpoint,
    isReplySending,
    setHoveredComponentMenuIndex,
    openComponentSource,
    addAnnotation,
    cancelAnnotation,
    updateAnnotation,
    cancelEditAnnotation,
    deleteAnnotation,
    handleThreadReply,
    popupRef,
    editPopupRef,
    dragRectRef,
    highlightsContainerRef,
  });

  if (!mounted) return null;
  if (isToolbarHidden) return null;

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

        <AgentationNotificationToast
          notification={activeNotification}
          isDarkMode={isDarkMode}
        />
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

      <InteractionOverlay {...interactionOverlayModel} />
    </div>,
    document.body,
  );
}

export default PageFeedbackToolbarCSS;
