import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import {
  type AnnotationPopupCSSHandle,
} from "../../annotation-popup-css";
import type { Annotation } from "../../../types";
import type { ComponentInspection } from "../../../utils/component-inspector";
import type {
  ComponentMenuState,
  HoverInfo,
  PendingAnnotationState,
  PendingMultiSelectElement,
} from "../hooks/useInteractionLifecycle";
import { ComponentSourceMenu } from "./ComponentSourceMenu";
import { DragSelectionOverlay } from "./DragSelectionOverlay";
import { EditAnnotationOverlay } from "./EditAnnotationOverlay";
import { HoverHighlight } from "./HoverHighlight";
import { HoverTooltip } from "./HoverTooltip";
import { MarkerHoverOutline } from "./MarkerHoverOutline";
import { MultiSelectHighlights } from "./MultiSelectHighlights";
import { PendingAnnotationOverlay } from "./PendingAnnotationOverlay";
import styles from "../styles.module.scss";

type InteractionOverlayProps = {
  isActive: boolean;
  pendingAnnotation: PendingAnnotationState | null;
  editingAnnotation: Annotation | null;
  hoverInfo: HoverInfo | null;
  isScrolling: boolean;
  isDragging: boolean;
  annotationColor: string;
  pendingMultiSelectElements: PendingMultiSelectElement[];
  hoveredMarkerId: string | null;
  annotations: Annotation[];
  hoveredTargetElement: HTMLElement | null;
  hoveredTargetElements: HTMLElement[];
  scrollY: number;
  hoverPosition: { x: number; y: number };
  componentMenu: ComponentMenuState | null;
  isDarkMode: boolean;
  hoveredComponentMenuIndex: number | null;
  setHoveredComponentMenuIndex: Dispatch<SetStateAction<number | null>>;
  openComponentSource: (item: ComponentInspection) => Promise<void>;
  pendingExiting: boolean;
  popupRef: MutableRefObject<AnnotationPopupCSSHandle | null>;
  addAnnotation: (comment: string) => void;
  cancelAnnotation: () => void;
  editingTargetElement: HTMLElement | null;
  editingTargetElements: HTMLElement[];
  editPopupRef: MutableRefObject<AnnotationPopupCSSHandle | null>;
  updateAnnotation: (newComment: string) => void;
  cancelEditAnnotation: () => void;
  deleteAnnotation: (id: string) => void;
  editExiting: boolean;
  resolvedEndpoint: string;
  handleThreadReply: (content: string) => Promise<void>;
  isReplySending: boolean;
  dragRectRef: MutableRefObject<HTMLDivElement | null>;
  highlightsContainerRef: MutableRefObject<HTMLDivElement | null>;
};

export function InteractionOverlay({
  isActive,
  pendingAnnotation,
  editingAnnotation,
  hoverInfo,
  isScrolling,
  isDragging,
  annotationColor,
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
  setHoveredComponentMenuIndex,
  openComponentSource,
  pendingExiting,
  popupRef,
  addAnnotation,
  cancelAnnotation,
  editingTargetElement,
  editingTargetElements,
  editPopupRef,
  updateAnnotation,
  cancelEditAnnotation,
  deleteAnnotation,
  editExiting,
  resolvedEndpoint,
  handleThreadReply,
  isReplySending,
  dragRectRef,
  highlightsContainerRef,
}: InteractionOverlayProps): JSX.Element | null {
  if (!isActive) {
    return null;
  }

  return (
    <div
      className={styles.overlay}
      data-feedback-toolbar
      style={pendingAnnotation || editingAnnotation ? { zIndex: 99999 } : undefined}
    >
      <HoverHighlight
        hoverInfo={hoverInfo}
        pendingAnnotation={pendingAnnotation}
        isScrolling={isScrolling}
        isDragging={isDragging}
        annotationColor={annotationColor}
      />

      <MultiSelectHighlights
        pendingMultiSelectElements={pendingMultiSelectElements}
        annotationColor={annotationColor}
      />

      <MarkerHoverOutline
        hoveredMarkerId={hoveredMarkerId}
        pendingAnnotation={pendingAnnotation}
        annotations={annotations}
        hoveredTargetElement={hoveredTargetElement}
        hoveredTargetElements={hoveredTargetElements}
        scrollY={scrollY}
        annotationColor={annotationColor}
      />

      <HoverTooltip
        hoverInfo={hoverInfo}
        pendingAnnotation={pendingAnnotation}
        isScrolling={isScrolling}
        isDragging={isDragging}
        hoverPosition={hoverPosition}
      />

      <ComponentSourceMenu
        componentMenu={componentMenu}
        isDarkMode={isDarkMode}
        hoveredComponentMenuIndex={hoveredComponentMenuIndex}
        setHoveredComponentMenuIndex={setHoveredComponentMenuIndex}
        openComponentSource={openComponentSource}
      />

      <PendingAnnotationOverlay
        pendingAnnotation={pendingAnnotation}
        pendingExiting={pendingExiting}
        scrollY={scrollY}
        annotationColor={annotationColor}
        isDarkMode={isDarkMode}
        popupRef={popupRef}
        addAnnotation={addAnnotation}
        cancelAnnotation={cancelAnnotation}
      />

      <EditAnnotationOverlay
        editingAnnotation={editingAnnotation}
        editingTargetElement={editingTargetElement}
        editingTargetElements={editingTargetElements}
        scrollY={scrollY}
        annotationColor={annotationColor}
        isDarkMode={isDarkMode}
        editPopupRef={editPopupRef}
        updateAnnotation={updateAnnotation}
        cancelEditAnnotation={cancelEditAnnotation}
        deleteAnnotation={deleteAnnotation}
        editExiting={editExiting}
        resolvedEndpoint={resolvedEndpoint}
        handleThreadReply={handleThreadReply}
        isReplySending={isReplySending}
      />

      <DragSelectionOverlay
        isDragging={isDragging}
        dragRectRef={dragRectRef}
        highlightsContainerRef={highlightsContainerRef}
      />
    </div>
  );
}
