import { useCallback, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { Annotation } from "../../../types";
import { loadAnnotations } from "../../../utils/storage";
import { deleteAnnotation as deleteAnnotationFromServer } from "../../../utils/sync";

type UseAnnotationStateParams = {
  pathname: string;
  resolvedEndpoint: string;
};

type UseAnnotationStateResult = {
  annotations: Annotation[];
  setAnnotations: Dispatch<SetStateAction<Annotation[]>>;
  toggleReviewed: (id: string) => void;
  clearReviewedAnnotations: (onCleared?: () => void) => void;
};

export function useAnnotationState({
  pathname,
  resolvedEndpoint,
}: UseAnnotationStateParams): UseAnnotationStateResult {
  const [annotations, setAnnotations] = useState<Annotation[]>(() =>
    loadAnnotations<Annotation>(pathname),
  );

  useEffect(() => {
    setAnnotations(loadAnnotations<Annotation>(pathname));
  }, [pathname]);

  const toggleReviewed = useCallback((id: string) => {
    setAnnotations((prev) =>
      prev.map((annotation) =>
        annotation.id === id
          ? {
              ...annotation,
              _reviewedAt: annotation._reviewedAt ? undefined : Date.now(),
            }
          : annotation,
      ),
    );
  }, []);

  const clearReviewedAnnotations = useCallback(
    (onCleared?: () => void) => {
      const toClear = annotations.filter((annotation) => annotation._reviewedAt);
      if (toClear.length === 0) {
        return;
      }

      if (resolvedEndpoint) {
        Promise.all(
          toClear.map((annotation) =>
            deleteAnnotationFromServer(resolvedEndpoint, annotation.id).catch((error) => {
              console.warn(
                "[Agentation] Failed to delete reviewed annotation:",
                error,
              );
            }),
          ),
        );
      }

      setAnnotations((prev) => prev.filter((annotation) => !annotation._reviewedAt));
      onCleared?.();
    },
    [annotations, resolvedEndpoint],
  );

  return {
    annotations,
    setAnnotations,
    toggleReviewed,
    clearReviewedAnnotations,
  };
}
