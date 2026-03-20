import type { CSSProperties } from "react";

import { IconCheckSmall, IconClose, IconEdit, IconXmark } from "../../icons";
import type { Annotation } from "../../../types";
import styles from "../styles.module.scss";

type MarkerClickBehavior = "edit" | "delete";

type MarkersLayerProps = {
  markersVisible: boolean;
  markersExiting: boolean;
  visibleAnnotations: Annotation[];
  activeAnnotations: Annotation[];
  resolvedAnnotations: Annotation[];
  exitingAnnotationsList: Annotation[];
  annotationColor: string;
  deletingMarkerId: string | null;
  editingAnnotation: Annotation | null;
  renumberFrom: number | null;
  animatedMarkers: Set<string>;
  isClearing: boolean;
  recentlyAddedId: string | null;
  hoveredMarkerId: string | null;
  isDarkMode: boolean;
  markerClickBehavior: MarkerClickBehavior;
  getTooltipPosition: (annotation: Annotation) => CSSProperties;
  handleMarkerHover: (annotation: Annotation | null) => void;
  deleteAnnotation: (id: string) => void;
  startEditAnnotation: (annotation: Annotation) => void;
};

export function MarkersLayer({
  markersVisible,
  markersExiting,
  visibleAnnotations,
  activeAnnotations,
  resolvedAnnotations,
  exitingAnnotationsList,
  annotationColor,
  deletingMarkerId,
  editingAnnotation,
  renumberFrom,
  animatedMarkers,
  isClearing,
  recentlyAddedId,
  hoveredMarkerId,
  isDarkMode,
  markerClickBehavior,
  getTooltipPosition,
  handleMarkerHover,
  deleteAnnotation,
  startEditAnnotation,
}: MarkersLayerProps) {
  return (
    <>
      <div className={styles.markersLayer} data-feedback-toolbar>
        {markersVisible &&
          visibleAnnotations
            .filter((annotation) => !annotation.isFixed)
            .map((annotation, index) => {
              const isHovered = !markersExiting && hoveredMarkerId === annotation.id;
              const isDeleting = deletingMarkerId === annotation.id;
              const showDeleteState =
                (isHovered || isDeleting) && !editingAnnotation;
              const isMulti = annotation.isMultiSelect;
              const markerColor = isMulti ? "#34C759" : annotationColor;
              const globalIndex = activeAnnotations.findIndex(
                (activeAnnotation) => activeAnnotation.id === annotation.id,
              );
              const needsEnterAnimation = !animatedMarkers.has(annotation.id);
              const animationClass = markersExiting
                ? styles.exit
                : isClearing
                  ? styles.clearing
                  : needsEnterAnimation
                    ? styles.enter
                    : "";

              const showDeleteHover =
                showDeleteState && markerClickBehavior === "delete";

              return (
                <div
                  key={annotation.id}
                  className={`${styles.marker} ${isMulti ? styles.multiSelect : ""} ${animationClass} ${showDeleteHover ? styles.hovered : ""}`}
                  data-annotation-marker
                  style={{
                    left: `${annotation.x}%`,
                    top: annotation.y,
                    backgroundColor: showDeleteHover ? undefined : markerColor,
                    animationDelay: markersExiting
                      ? `${(visibleAnnotations.length - 1 - index) * 20}ms`
                      : `${index * 20}ms`,
                  }}
                  onMouseEnter={() =>
                    !markersExiting &&
                    annotation.id !== recentlyAddedId &&
                    handleMarkerHover(annotation)
                  }
                  onMouseLeave={() => handleMarkerHover(null)}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!markersExiting) {
                      if (markerClickBehavior === "delete") {
                        deleteAnnotation(annotation.id);
                      } else {
                        startEditAnnotation(annotation);
                      }
                    }
                  }}
                  onContextMenu={(event) => {
                    if (markerClickBehavior === "delete") {
                      event.preventDefault();
                      event.stopPropagation();
                      if (!markersExiting) {
                        startEditAnnotation(annotation);
                      }
                    }
                  }}
                >
                  {showDeleteState ? (
                    showDeleteHover ? (
                      <IconXmark size={isMulti ? 18 : 16} />
                    ) : (
                      <IconEdit size={16} />
                    )
                  ) : (
                    <span
                      className={
                        renumberFrom !== null && globalIndex >= renumberFrom
                          ? styles.renumber
                          : undefined
                      }
                    >
                      {globalIndex + 1}
                    </span>
                  )}
                  {annotation.thread &&
                    annotation.thread.length > 0 &&
                    !showDeleteState && (
                      <span className={styles.threadBadge}>
                        {annotation.thread.length}
                      </span>
                    )}
                  {isHovered && !editingAnnotation && (
                    <div
                      className={`${styles.markerTooltip} ${!isDarkMode ? styles.light : ""} ${styles.enter}`}
                      style={getTooltipPosition(annotation)}
                    >
                      <span className={styles.markerQuote}>
                        {annotation.element}
                        {annotation.selectedText &&
                          ` "${annotation.selectedText.slice(0, 30)}${annotation.selectedText.length > 30 ? "..." : ""}"`}
                      </span>
                      <span className={styles.markerNote}>{annotation.comment}</span>
                    </div>
                  )}
                </div>
              );
            })}

        {markersVisible &&
          !markersExiting &&
          resolvedAnnotations
            .filter((annotation) => !annotation.isFixed)
            .map((annotation) => (
              <div
                key={annotation.id}
                className={`${styles.marker} ${styles.resolved} ${annotation._reviewedAt ? styles.reviewed : ""} ${annotation.isMultiSelect ? styles.multiSelect : ""}`}
                data-annotation-marker
                style={{
                  left: `${annotation.x}%`,
                  top: annotation.y,
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  startEditAnnotation(annotation);
                }}
              >
                <IconCheckSmall size={12} />
              </div>
            ))}

        {markersVisible &&
          !markersExiting &&
          exitingAnnotationsList
            .filter((annotation) => !annotation.isFixed)
            .map((annotation) => {
              const isMulti = annotation.isMultiSelect;
              return (
                <div
                  key={annotation.id}
                  className={`${styles.marker} ${styles.hovered} ${isMulti ? styles.multiSelect : ""} ${styles.exit}`}
                  data-annotation-marker
                  style={{
                    left: `${annotation.x}%`,
                    top: annotation.y,
                  }}
                >
                  <IconXmark size={isMulti ? 12 : 10} />
                </div>
              );
            })}
      </div>

      <div className={styles.fixedMarkersLayer} data-feedback-toolbar>
        {markersVisible &&
          visibleAnnotations
            .filter((annotation) => annotation.isFixed)
            .map((annotation, index) => {
              const fixedAnnotations = visibleAnnotations.filter(
                (visibleAnnotation) => visibleAnnotation.isFixed,
              );
              const isHovered = !markersExiting && hoveredMarkerId === annotation.id;
              const isDeleting = deletingMarkerId === annotation.id;
              const showDeleteState =
                (isHovered || isDeleting) && !editingAnnotation;
              const isMulti = annotation.isMultiSelect;
              const markerColor = isMulti ? "#34C759" : annotationColor;
              const globalIndex = activeAnnotations.findIndex(
                (activeAnnotation) => activeAnnotation.id === annotation.id,
              );
              const needsEnterAnimation = !animatedMarkers.has(annotation.id);
              const animationClass = markersExiting
                ? styles.exit
                : isClearing
                  ? styles.clearing
                  : needsEnterAnimation
                    ? styles.enter
                    : "";

              const showDeleteHover =
                showDeleteState && markerClickBehavior === "delete";

              return (
                <div
                  key={annotation.id}
                  className={`${styles.marker} ${styles.fixed} ${isMulti ? styles.multiSelect : ""} ${animationClass} ${showDeleteHover ? styles.hovered : ""}`}
                  data-annotation-marker
                  style={{
                    left: `${annotation.x}%`,
                    top: annotation.y,
                    backgroundColor: showDeleteHover ? undefined : markerColor,
                    animationDelay: markersExiting
                      ? `${(fixedAnnotations.length - 1 - index) * 20}ms`
                      : `${index * 20}ms`,
                  }}
                  onMouseEnter={() =>
                    !markersExiting &&
                    annotation.id !== recentlyAddedId &&
                    handleMarkerHover(annotation)
                  }
                  onMouseLeave={() => handleMarkerHover(null)}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!markersExiting) {
                      if (markerClickBehavior === "delete") {
                        deleteAnnotation(annotation.id);
                      } else {
                        startEditAnnotation(annotation);
                      }
                    }
                  }}
                  onContextMenu={(event) => {
                    if (markerClickBehavior === "delete") {
                      event.preventDefault();
                      event.stopPropagation();
                      if (!markersExiting) {
                        startEditAnnotation(annotation);
                      }
                    }
                  }}
                >
                  {showDeleteState ? (
                    showDeleteHover ? (
                      <IconXmark size={isMulti ? 18 : 16} />
                    ) : (
                      <IconEdit size={16} />
                    )
                  ) : (
                    <span
                      className={
                        renumberFrom !== null && globalIndex >= renumberFrom
                          ? styles.renumber
                          : undefined
                      }
                    >
                      {globalIndex + 1}
                    </span>
                  )}
                  {annotation.thread &&
                    annotation.thread.length > 0 &&
                    !showDeleteState && (
                      <span className={styles.threadBadge}>
                        {annotation.thread.length}
                      </span>
                    )}
                  {isHovered && !editingAnnotation && (
                    <div
                      className={`${styles.markerTooltip} ${!isDarkMode ? styles.light : ""} ${styles.enter}`}
                      style={getTooltipPosition(annotation)}
                    >
                      <span className={styles.markerQuote}>
                        {annotation.element}
                        {annotation.selectedText &&
                          ` "${annotation.selectedText.slice(0, 30)}${annotation.selectedText.length > 30 ? "..." : ""}"`}
                      </span>
                      <span className={styles.markerNote}>{annotation.comment}</span>
                    </div>
                  )}
                </div>
              );
            })}

        {markersVisible &&
          !markersExiting &&
          resolvedAnnotations
            .filter((annotation) => annotation.isFixed)
            .map((annotation) => (
              <div
                key={annotation.id}
                className={`${styles.marker} ${styles.fixed} ${styles.resolved} ${annotation._reviewedAt ? styles.reviewed : ""} ${annotation.isMultiSelect ? styles.multiSelect : ""}`}
                data-annotation-marker
                style={{
                  left: `${annotation.x}%`,
                  top: annotation.y,
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  startEditAnnotation(annotation);
                }}
              >
                <IconCheckSmall size={12} />
              </div>
            ))}

        {markersVisible &&
          !markersExiting &&
          exitingAnnotationsList
            .filter((annotation) => annotation.isFixed)
            .map((annotation) => {
              const isMulti = annotation.isMultiSelect;
              return (
                <div
                  key={annotation.id}
                  className={`${styles.marker} ${styles.fixed} ${styles.hovered} ${isMulti ? styles.multiSelect : ""} ${styles.exit}`}
                  data-annotation-marker
                  style={{
                    left: `${annotation.x}%`,
                    top: annotation.y,
                  }}
                >
                  <IconClose size={isMulti ? 12 : 10} />
                </div>
              );
            })}
      </div>
    </>
  );
}
