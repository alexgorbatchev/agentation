import { useMemo } from "react";

import type { Annotation } from "../../../types";

type UseAnnotationViewModelParams = {
  annotations: Annotation[];
  exitingMarkers: Set<string>;
};

type UseAnnotationViewModelResult = {
  activeAnnotations: Annotation[];
  resolvedAnnotations: Annotation[];
  unreviewedCount: number;
  hasAnnotations: boolean;
  visibleAnnotations: Annotation[];
  exitingAnnotationsList: Annotation[];
};

const isResolvedAnnotation = (annotation: Annotation): boolean =>
  annotation.status === "resolved" || annotation.status === "dismissed";

export function useAnnotationViewModel({
  annotations,
  exitingMarkers,
}: UseAnnotationViewModelParams): UseAnnotationViewModelResult {
  const activeAnnotations = useMemo(
    () =>
      annotations.filter(
        (annotation) =>
          !exitingMarkers.has(annotation.id) && !isResolvedAnnotation(annotation),
      ),
    [annotations, exitingMarkers],
  );

  const resolvedAnnotations = useMemo(
    () => annotations.filter(isResolvedAnnotation),
    [annotations],
  );

  const exitingAnnotationsList = useMemo(
    () => annotations.filter((annotation) => exitingMarkers.has(annotation.id)),
    [annotations, exitingMarkers],
  );

  const unreviewedCount = useMemo(
    () => resolvedAnnotations.filter((annotation) => !annotation._reviewedAt).length,
    [resolvedAnnotations],
  );

  const hasAnnotations = activeAnnotations.length > 0 || resolvedAnnotations.length > 0;

  return {
    activeAnnotations,
    resolvedAnnotations,
    unreviewedCount,
    hasAnnotations,
    visibleAnnotations: activeAnnotations,
    exitingAnnotationsList,
  };
}
