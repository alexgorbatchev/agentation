import { useCallback, useEffect } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { Annotation } from "../../../types";
import {
  deleteAnnotation as deleteAnnotationFromServer,
  postThreadReply,
  syncAnnotation,
  updateAnnotation as updateAnnotationOnServer,
} from "../../../utils/sync";
import { originalSetTimeout } from "../../../utils/freeze-animations";
import type { PendingAnnotationState } from "./useInteractionLifecycle";

type FireWebhook = (
  event: string,
  payload: Record<string, unknown>,
  force?: boolean,
) => Promise<boolean>;

type UseAnnotationPopupStateParams = {
  annotations: Annotation[];
  setAnnotations: Dispatch<SetStateAction<Annotation[]>>;
  pendingAnnotation: PendingAnnotationState | null;
  setPendingAnnotation: Dispatch<SetStateAction<PendingAnnotationState | null>>;
  setPendingExiting: Dispatch<SetStateAction<boolean>>;
  setEditingAnnotation: Dispatch<SetStateAction<Annotation | null>>;
  editingAnnotation: Annotation | null;
  setEditingTargetElement: Dispatch<SetStateAction<HTMLElement | null>>;
  setEditingTargetElements: Dispatch<SetStateAction<HTMLElement[]>>;
  setHoveredMarkerId: Dispatch<SetStateAction<string | null>>;
  setHoveredTargetElement: Dispatch<SetStateAction<HTMLElement | null>>;
  setHoveredTargetElements: Dispatch<SetStateAction<HTMLElement[]>>;
  setDeletingMarkerId: Dispatch<SetStateAction<string | null>>;
  setExitingMarkers: Dispatch<SetStateAction<Set<string>>>;
  setRenumberFrom: Dispatch<SetStateAction<number | null>>;
  setAnimatedMarkers: Dispatch<SetStateAction<Set<string>>>;
  setEditExiting: Dispatch<SetStateAction<boolean>>;
  setIsReplySending: Dispatch<SetStateAction<boolean>>;
  currentSessionId: string | null;
  resolvedEndpoint: string;
  fireWebhook: FireWebhook;
  deepElementFromPoint: (x: number, y: number) => HTMLElement | null;
  recentlyAddedIdRef: MutableRefObject<string | null>;
  onAnnotationAdd?: (annotation: Annotation) => void;
  onAnnotationDelete?: (annotation: Annotation) => void;
  onAnnotationUpdate?: (annotation: Annotation) => void;
};

type UseAnnotationPopupStateResult = {
  addAnnotation: (comment: string) => void;
  cancelAnnotation: () => void;
  deleteAnnotation: (id: string) => void;
  startEditAnnotation: (annotation: Annotation) => void;
  handleMarkerHover: (annotation: Annotation | null) => void;
  updateAnnotation: (newComment: string) => void;
  handleThreadReply: (content: string) => Promise<void>;
  cancelEditAnnotation: () => void;
};

function closeEditPopup(
  setEditExiting: Dispatch<SetStateAction<boolean>>,
  setEditingAnnotation: Dispatch<SetStateAction<Annotation | null>>,
  setEditingTargetElement: Dispatch<SetStateAction<HTMLElement | null>>,
  setEditingTargetElements: Dispatch<SetStateAction<HTMLElement[]>>,
): void {
  setEditExiting(true);
  originalSetTimeout(() => {
    setEditingAnnotation(null);
    setEditingTargetElement(null);
    setEditingTargetElements([]);
    setEditExiting(false);
  }, 150);
}

export function useAnnotationPopupState({
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
}: UseAnnotationPopupStateParams): UseAnnotationPopupStateResult {
  useEffect(() => {
    if (!editingAnnotation) {
      return;
    }

    const updated = annotations.find(
      (annotation) => annotation.id === editingAnnotation.id,
    );
    if (!updated?.thread) {
      return;
    }

    setEditingAnnotation((prev) => {
      if (!prev || prev.id !== updated.id) {
        return prev;
      }

      if (prev.thread === updated.thread) {
        return prev;
      }

      return { ...prev, thread: updated.thread };
    });
  }, [annotations, editingAnnotation, setEditingAnnotation]);

  const addAnnotation = useCallback(
    (comment: string) => {
      if (!pendingAnnotation) {
        return;
      }

      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        x: pendingAnnotation.x,
        y: pendingAnnotation.y,
        comment,
        element: pendingAnnotation.element,
        elementPath: pendingAnnotation.elementPath,
        timestamp: Date.now(),
        selectedText: pendingAnnotation.selectedText,
        boundingBox: pendingAnnotation.boundingBox,
        nearbyText: pendingAnnotation.nearbyText,
        cssClasses: pendingAnnotation.cssClasses,
        isMultiSelect: pendingAnnotation.isMultiSelect,
        isFixed: pendingAnnotation.isFixed,
        fullPath: pendingAnnotation.fullPath,
        accessibility: pendingAnnotation.accessibility,
        computedStyles: pendingAnnotation.computedStyles,
        nearbyElements: pendingAnnotation.nearbyElements,
        reactComponents: pendingAnnotation.reactComponents,
        sourceFile: pendingAnnotation.sourceFile,
        elementBoundingBoxes: pendingAnnotation.elementBoundingBoxes,
        ...(currentSessionId
          ? {
              sessionId: currentSessionId,
              url:
                typeof window !== "undefined"
                  ? window.location.href
                  : undefined,
              status: "pending" as const,
            }
          : {}),
      };

      setAnnotations((prev) => [...prev, newAnnotation]);
      recentlyAddedIdRef.current = newAnnotation.id;
      originalSetTimeout(() => {
        recentlyAddedIdRef.current = null;
      }, 300);
      originalSetTimeout(() => {
        setAnimatedMarkers((prev) => new Set(prev).add(newAnnotation.id));
      }, 250);

      onAnnotationAdd?.(newAnnotation);
      void fireWebhook("annotation.add", { annotation: newAnnotation });

      setPendingExiting(true);
      originalSetTimeout(() => {
        setPendingAnnotation(null);
        setPendingExiting(false);
      }, 150);

      window.getSelection()?.removeAllRanges();

      if (currentSessionId) {
        syncAnnotation(resolvedEndpoint, currentSessionId, newAnnotation)
          .then((serverAnnotation) => {
            if (serverAnnotation.id !== newAnnotation.id) {
              setAnnotations((prev) =>
                prev.map((annotation) =>
                  annotation.id === newAnnotation.id
                    ? { ...annotation, id: serverAnnotation.id }
                    : annotation,
                ),
              );
              setAnimatedMarkers((prev) => {
                const next = new Set(prev);
                next.delete(newAnnotation.id);
                next.add(serverAnnotation.id);
                return next;
              });
            }
          })
          .catch((error) => {
            console.warn("[Agentation] Failed to sync annotation:", error);
          });
      }
    },
    [
      currentSessionId,
      fireWebhook,
      onAnnotationAdd,
      pendingAnnotation,
      recentlyAddedIdRef,
      resolvedEndpoint,
      setAnimatedMarkers,
      setAnnotations,
      setPendingAnnotation,
      setPendingExiting,
    ],
  );

  const cancelAnnotation = useCallback(() => {
    setPendingExiting(true);
    originalSetTimeout(() => {
      setPendingAnnotation(null);
      setPendingExiting(false);
    }, 150);
  }, [setPendingAnnotation, setPendingExiting]);

  const deleteAnnotation = useCallback(
    (id: string) => {
      const deletedIndex = annotations.findIndex((annotation) => annotation.id === id);
      const deletedAnnotation = annotations[deletedIndex];

      if (editingAnnotation?.id === id) {
        closeEditPopup(
          setEditExiting,
          setEditingAnnotation,
          setEditingTargetElement,
          setEditingTargetElements,
        );
      }

      setDeletingMarkerId(id);
      setExitingMarkers((prev) => new Set(prev).add(id));

      if (deletedAnnotation) {
        onAnnotationDelete?.(deletedAnnotation);
        void fireWebhook("annotation.delete", { annotation: deletedAnnotation });
      }

      if (resolvedEndpoint) {
        deleteAnnotationFromServer(resolvedEndpoint, id).catch((error) => {
          console.warn(
            "[Agentation] Failed to delete annotation from server:",
            error,
          );
        });
      }

      originalSetTimeout(() => {
        setAnnotations((prev) => prev.filter((annotation) => annotation.id !== id));
        setExitingMarkers((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setDeletingMarkerId(null);

        if (deletedIndex < annotations.length - 1) {
          setRenumberFrom(deletedIndex);
          originalSetTimeout(() => setRenumberFrom(null), 200);
        }
      }, 150);
    },
    [
      annotations,
      editingAnnotation,
      fireWebhook,
      onAnnotationDelete,
      resolvedEndpoint,
      setAnnotations,
      setDeletingMarkerId,
      setEditExiting,
      setEditingAnnotation,
      setEditingTargetElement,
      setEditingTargetElements,
      setExitingMarkers,
      setRenumberFrom,
    ],
  );

  const startEditAnnotation = useCallback(
    (annotation: Annotation) => {
      setEditingAnnotation(annotation);
      setHoveredMarkerId(null);
      setHoveredTargetElement(null);
      setHoveredTargetElements([]);

      if (annotation.elementBoundingBoxes?.length) {
        const elements: HTMLElement[] = [];
        for (const boundingBox of annotation.elementBoundingBoxes) {
          const centerX = boundingBox.x + boundingBox.width / 2;
          const centerY = boundingBox.y + boundingBox.height / 2 - window.scrollY;
          const element = deepElementFromPoint(centerX, centerY);
          if (element) {
            elements.push(element);
          }
        }
        setEditingTargetElements(elements);
        setEditingTargetElement(null);
        return;
      }

      if (annotation.boundingBox) {
        const boundingBox = annotation.boundingBox;
        const centerX = boundingBox.x + boundingBox.width / 2;
        const centerY = annotation.isFixed
          ? boundingBox.y + boundingBox.height / 2
          : boundingBox.y + boundingBox.height / 2 - window.scrollY;
        const element = deepElementFromPoint(centerX, centerY);

        if (element) {
          const elementRect = element.getBoundingClientRect();
          const widthRatio = elementRect.width / boundingBox.width;
          const heightRatio = elementRect.height / boundingBox.height;
          if (widthRatio < 0.5 || heightRatio < 0.5) {
            setEditingTargetElement(null);
          } else {
            setEditingTargetElement(element);
          }
        } else {
          setEditingTargetElement(null);
        }

        setEditingTargetElements([]);
        return;
      }

      setEditingTargetElement(null);
      setEditingTargetElements([]);
    },
    [
      deepElementFromPoint,
      setEditingAnnotation,
      setEditingTargetElement,
      setEditingTargetElements,
      setHoveredMarkerId,
      setHoveredTargetElement,
      setHoveredTargetElements,
    ],
  );

  const handleMarkerHover = useCallback(
    (annotation: Annotation | null) => {
      if (!annotation) {
        setHoveredMarkerId(null);
        setHoveredTargetElement(null);
        setHoveredTargetElements([]);
        return;
      }

      setHoveredMarkerId(annotation.id);

      if (annotation.elementBoundingBoxes?.length) {
        const elements: HTMLElement[] = [];
        for (const boundingBox of annotation.elementBoundingBoxes) {
          const centerX = boundingBox.x + boundingBox.width / 2;
          const centerY = boundingBox.y + boundingBox.height / 2 - window.scrollY;
          const allElements = document.elementsFromPoint(centerX, centerY);
          const element = allElements.find(
            (entry) =>
              !entry.closest("[data-annotation-marker]") &&
              !entry.closest("[data-agentation-root]"),
          ) as HTMLElement | undefined;
          if (element) {
            elements.push(element);
          }
        }
        setHoveredTargetElements(elements);
        setHoveredTargetElement(null);
        return;
      }

      if (annotation.boundingBox) {
        const boundingBox = annotation.boundingBox;
        const centerX = boundingBox.x + boundingBox.width / 2;
        const centerY = annotation.isFixed
          ? boundingBox.y + boundingBox.height / 2
          : boundingBox.y + boundingBox.height / 2 - window.scrollY;
        const element = deepElementFromPoint(centerX, centerY);

        if (element) {
          const elementRect = element.getBoundingClientRect();
          const widthRatio = elementRect.width / boundingBox.width;
          const heightRatio = elementRect.height / boundingBox.height;
          if (widthRatio < 0.5 || heightRatio < 0.5) {
            setHoveredTargetElement(null);
          } else {
            setHoveredTargetElement(element);
          }
        } else {
          setHoveredTargetElement(null);
        }
        setHoveredTargetElements([]);
        return;
      }

      setHoveredTargetElement(null);
      setHoveredTargetElements([]);
    },
    [
      deepElementFromPoint,
      setHoveredMarkerId,
      setHoveredTargetElement,
      setHoveredTargetElements,
    ],
  );

  const updateAnnotation = useCallback(
    (newComment: string) => {
      if (!editingAnnotation) {
        return;
      }

      const updatedAnnotation = { ...editingAnnotation, comment: newComment };

      setAnnotations((prev) =>
        prev.map((annotation) =>
          annotation.id === editingAnnotation.id ? updatedAnnotation : annotation,
        ),
      );

      onAnnotationUpdate?.(updatedAnnotation);
      void fireWebhook("annotation.update", { annotation: updatedAnnotation });

      if (resolvedEndpoint) {
        updateAnnotationOnServer(resolvedEndpoint, editingAnnotation.id, {
          comment: newComment,
        }).catch((error) => {
          console.warn(
            "[Agentation] Failed to update annotation on server:",
            error,
          );
        });
      }

      closeEditPopup(
        setEditExiting,
        setEditingAnnotation,
        setEditingTargetElement,
        setEditingTargetElements,
      );
    },
    [
      editingAnnotation,
      fireWebhook,
      onAnnotationUpdate,
      resolvedEndpoint,
      setAnnotations,
      setEditExiting,
      setEditingAnnotation,
      setEditingTargetElement,
      setEditingTargetElements,
    ],
  );

  const handleThreadReply = useCallback(
    async (content: string) => {
      if (!editingAnnotation || !resolvedEndpoint) {
        return;
      }

      setIsReplySending(true);
      try {
        const updated = await postThreadReply(
          resolvedEndpoint,
          editingAnnotation.id,
          content,
        );
        setAnnotations((prev) =>
          prev.map((annotation) =>
            annotation.id === updated.id
              ? { ...annotation, thread: updated.thread }
              : annotation,
          ),
        );
        setEditingAnnotation((prev) =>
          prev && prev.id === updated.id
            ? { ...prev, thread: updated.thread }
            : prev,
        );
      } catch (error) {
        console.warn("[Agentation] Failed to post thread reply:", error);
      } finally {
        setIsReplySending(false);
      }
    },
    [
      editingAnnotation,
      resolvedEndpoint,
      setAnnotations,
      setEditingAnnotation,
      setIsReplySending,
    ],
  );

  const cancelEditAnnotation = useCallback(() => {
    closeEditPopup(
      setEditExiting,
      setEditingAnnotation,
      setEditingTargetElement,
      setEditingTargetElements,
    );
  }, [
    setEditExiting,
    setEditingAnnotation,
    setEditingTargetElement,
    setEditingTargetElements,
  ]);

  return {
    addAnnotation,
    cancelAnnotation,
    deleteAnnotation,
    startEditAnnotation,
    handleMarkerHover,
    updateAnnotation,
    handleThreadReply,
    cancelEditAnnotation,
  };
}
