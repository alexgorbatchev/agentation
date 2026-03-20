import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { AnnotationPopupCSSHandle } from "../../annotation-popup-css";
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

export type InteractionOverlayState = {
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
  pendingExiting: boolean;
  editingTargetElement: HTMLElement | null;
  editingTargetElements: HTMLElement[];
  editExiting: boolean;
  resolvedEndpoint: string;
  isReplySending: boolean;
};

export type InteractionOverlayActions = {
  setHoveredComponentMenuIndex: Dispatch<SetStateAction<number | null>>;
  openComponentSource: (item: ComponentInspection) => Promise<void>;
  addAnnotation: (comment: string) => void;
  cancelAnnotation: () => void;
  updateAnnotation: (newComment: string) => void;
  cancelEditAnnotation: () => void;
  deleteAnnotation: (id: string) => void;
  handleThreadReply: (content: string) => Promise<void>;
};

export type InteractionOverlayRefs = {
  popupRef: MutableRefObject<AnnotationPopupCSSHandle | null>;
  editPopupRef: MutableRefObject<AnnotationPopupCSSHandle | null>;
  dragRectRef: MutableRefObject<HTMLDivElement | null>;
  highlightsContainerRef: MutableRefObject<HTMLDivElement | null>;
};

type InteractionOverlayProps = {
  state: InteractionOverlayState;
  actions: InteractionOverlayActions;
  refs: InteractionOverlayRefs;
};

export function InteractionOverlay({
  state,
  actions,
  refs,
}: InteractionOverlayProps): JSX.Element | null {
  if (!state.isActive) {
    return null;
  }

  return (
    <div
      className={styles.overlay}
      data-feedback-toolbar
      style={state.pendingAnnotation || state.editingAnnotation ? { zIndex: 99999 } : undefined}
    >
      <HoverHighlight
        hoverInfo={state.hoverInfo}
        pendingAnnotation={state.pendingAnnotation}
        isScrolling={state.isScrolling}
        isDragging={state.isDragging}
        annotationColor={state.annotationColor}
      />

      <MultiSelectHighlights
        pendingMultiSelectElements={state.pendingMultiSelectElements}
        annotationColor={state.annotationColor}
      />

      <MarkerHoverOutline
        hoveredMarkerId={state.hoveredMarkerId}
        pendingAnnotation={state.pendingAnnotation}
        annotations={state.annotations}
        hoveredTargetElement={state.hoveredTargetElement}
        hoveredTargetElements={state.hoveredTargetElements}
        scrollY={state.scrollY}
        annotationColor={state.annotationColor}
      />

      <HoverTooltip
        hoverInfo={state.hoverInfo}
        pendingAnnotation={state.pendingAnnotation}
        isScrolling={state.isScrolling}
        isDragging={state.isDragging}
        hoverPosition={state.hoverPosition}
      />

      <ComponentSourceMenu
        componentMenu={state.componentMenu}
        isDarkMode={state.isDarkMode}
        hoveredComponentMenuIndex={state.hoveredComponentMenuIndex}
        setHoveredComponentMenuIndex={actions.setHoveredComponentMenuIndex}
        openComponentSource={actions.openComponentSource}
      />

      <PendingAnnotationOverlay
        pendingAnnotation={state.pendingAnnotation}
        pendingExiting={state.pendingExiting}
        scrollY={state.scrollY}
        annotationColor={state.annotationColor}
        isDarkMode={state.isDarkMode}
        popupRef={refs.popupRef}
        addAnnotation={actions.addAnnotation}
        cancelAnnotation={actions.cancelAnnotation}
      />

      <EditAnnotationOverlay
        editingAnnotation={state.editingAnnotation}
        editingTargetElement={state.editingTargetElement}
        editingTargetElements={state.editingTargetElements}
        scrollY={state.scrollY}
        annotationColor={state.annotationColor}
        isDarkMode={state.isDarkMode}
        editPopupRef={refs.editPopupRef}
        updateAnnotation={actions.updateAnnotation}
        cancelEditAnnotation={actions.cancelEditAnnotation}
        deleteAnnotation={actions.deleteAnnotation}
        editExiting={state.editExiting}
        resolvedEndpoint={state.resolvedEndpoint}
        handleThreadReply={actions.handleThreadReply}
        isReplySending={state.isReplySending}
      />

      <DragSelectionOverlay
        isDragging={state.isDragging}
        dragRectRef={refs.dragRectRef}
        highlightsContainerRef={refs.highlightsContainerRef}
      />
    </div>
  );
}
