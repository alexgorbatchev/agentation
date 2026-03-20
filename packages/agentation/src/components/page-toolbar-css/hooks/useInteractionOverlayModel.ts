import { useMemo } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { AnnotationPopupCSSHandle } from "../../annotation-popup-css";
import type { Annotation } from "../../../types";
import type { ComponentInspection } from "../../../utils/component-inspector";
import type {
  InteractionOverlayActions,
  InteractionOverlayRefs,
  InteractionOverlayState,
} from "../components/InteractionOverlay";
import type {
  ComponentMenuState,
  HoverInfo,
  PendingAnnotationState,
  PendingMultiSelectElement,
} from "./useInteractionLifecycle";

type UseInteractionOverlayModelParams = {
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
  setHoveredComponentMenuIndex: Dispatch<SetStateAction<number | null>>;
  openComponentSource: (item: ComponentInspection) => Promise<void>;
  addAnnotation: (comment: string) => void;
  cancelAnnotation: () => void;
  updateAnnotation: (newComment: string) => void;
  cancelEditAnnotation: () => void;
  deleteAnnotation: (id: string) => void;
  handleThreadReply: (content: string) => Promise<void>;
  popupRef: MutableRefObject<AnnotationPopupCSSHandle | null>;
  editPopupRef: MutableRefObject<AnnotationPopupCSSHandle | null>;
  dragRectRef: MutableRefObject<HTMLDivElement | null>;
  highlightsContainerRef: MutableRefObject<HTMLDivElement | null>;
};

type UseInteractionOverlayModelResult = {
  state: InteractionOverlayState;
  actions: InteractionOverlayActions;
  refs: InteractionOverlayRefs;
};

export function useInteractionOverlayModel({
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
}: UseInteractionOverlayModelParams): UseInteractionOverlayModelResult {
  const state = useMemo(
    () => ({
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
      pendingExiting,
      editingTargetElement,
      editingTargetElements,
      editExiting,
      resolvedEndpoint,
      isReplySending,
    }),
    [
      annotationColor,
      annotations,
      componentMenu,
      editExiting,
      editingAnnotation,
      editingTargetElement,
      editingTargetElements,
      hoverInfo,
      hoverPosition,
      hoveredComponentMenuIndex,
      hoveredMarkerId,
      hoveredTargetElement,
      hoveredTargetElements,
      isActive,
      isDarkMode,
      isDragging,
      isReplySending,
      isScrolling,
      pendingAnnotation,
      pendingExiting,
      pendingMultiSelectElements,
      resolvedEndpoint,
      scrollY,
    ],
  );

  const actions = useMemo(
    () => ({
      setHoveredComponentMenuIndex,
      openComponentSource,
      addAnnotation,
      cancelAnnotation,
      updateAnnotation,
      cancelEditAnnotation,
      deleteAnnotation,
      handleThreadReply,
    }),
    [
      addAnnotation,
      cancelAnnotation,
      cancelEditAnnotation,
      deleteAnnotation,
      handleThreadReply,
      openComponentSource,
      setHoveredComponentMenuIndex,
      updateAnnotation,
    ],
  );

  const refs = useMemo(
    () => ({
      popupRef,
      editPopupRef,
      dragRectRef,
      highlightsContainerRef,
    }),
    [dragRectRef, editPopupRef, highlightsContainerRef, popupRef],
  );

  return {
    state,
    actions,
    refs,
  };
}
