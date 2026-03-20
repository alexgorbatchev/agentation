import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";

import type {
  ComponentMenuState,
  HoverInfo,
  PendingAnnotationState,
  PendingMultiSelectElement,
} from "./useInteractionLifecycle";
import type { Annotation } from "../../../types";

type UseToolbarActiveLifecycleParams = {
  isActive: boolean;
  isFrozen: boolean;
  unfreezeAnimations: () => void;
  cleanupUnfreeze: () => void;
  setComponentMenu: Dispatch<SetStateAction<ComponentMenuState | null>>;
  setHoveredComponentMenuIndex: Dispatch<SetStateAction<number | null>>;
  setPendingAnnotation: Dispatch<SetStateAction<PendingAnnotationState | null>>;
  setEditingAnnotation: Dispatch<SetStateAction<Annotation | null>>;
  setEditingTargetElement: Dispatch<SetStateAction<HTMLElement | null>>;
  setEditingTargetElements: Dispatch<SetStateAction<HTMLElement[]>>;
  setHoverInfo: Dispatch<SetStateAction<HoverInfo | null>>;
  setShowSettings: Dispatch<SetStateAction<boolean>>;
  setShowReviewQueue: Dispatch<SetStateAction<boolean>>;
  setPendingMultiSelectElements: Dispatch<SetStateAction<PendingMultiSelectElement[]>>;
};

export function useToolbarActiveLifecycle({
  isActive,
  isFrozen,
  unfreezeAnimations,
  cleanupUnfreeze,
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
}: UseToolbarActiveLifecycleParams): void {
  useEffect(() => {
    if (isActive) {
      return;
    }

    setComponentMenu(null);
    setHoveredComponentMenuIndex(null);
    setPendingAnnotation(null);
    setEditingAnnotation(null);
    setEditingTargetElement(null);
    setEditingTargetElements([]);
    setHoverInfo(null);
    setShowSettings(false);
    setShowReviewQueue(false);
    setPendingMultiSelectElements([]);

    if (isFrozen) {
      unfreezeAnimations();
    }
  }, [
    isActive,
    isFrozen,
    unfreezeAnimations,
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
  ]);

  useEffect(() => {
    return () => {
      cleanupUnfreeze();
    };
  }, [cleanupUnfreeze]);
}
