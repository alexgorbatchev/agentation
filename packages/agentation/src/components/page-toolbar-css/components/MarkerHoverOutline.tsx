import type { Annotation } from "../../../types";
import type { PendingAnnotationState } from "../hooks/useInteractionLifecycle";
import styles from "../styles.module.scss";

type MarkerHoverOutlineProps = {
  hoveredMarkerId: string | null;
  pendingAnnotation: PendingAnnotationState | null;
  annotations: Annotation[];
  hoveredTargetElement: HTMLElement | null;
  hoveredTargetElements: HTMLElement[];
  scrollY: number;
  annotationColor: string;
};

export function MarkerHoverOutline({
  hoveredMarkerId,
  pendingAnnotation,
  annotations,
  hoveredTargetElement,
  hoveredTargetElements,
  scrollY,
  annotationColor,
}: MarkerHoverOutlineProps): JSX.Element | JSX.Element[] | null {
  if (!hoveredMarkerId || pendingAnnotation) {
    return null;
  }

  const hoveredAnnotation = annotations.find(
    (annotation) => annotation.id === hoveredMarkerId,
  );
  if (!hoveredAnnotation?.boundingBox) {
    return null;
  }

  if (hoveredAnnotation.elementBoundingBoxes?.length) {
    if (hoveredTargetElements.length > 0) {
      return hoveredTargetElements
        .filter((element) => document.contains(element))
        .map((element, index) => {
          const rect = element.getBoundingClientRect();
          return (
            <div
              key={`hover-outline-live-${index}`}
              className={`${styles.multiSelectOutline} ${styles.enter}`}
              style={{
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
              }}
            />
          );
        });
    }

    return hoveredAnnotation.elementBoundingBoxes.map((boundingBox, index) => (
      <div
        key={`hover-outline-${index}`}
        className={`${styles.multiSelectOutline} ${styles.enter}`}
        style={{
          left: boundingBox.x,
          top: boundingBox.y - scrollY,
          width: boundingBox.width,
          height: boundingBox.height,
        }}
      />
    ));
  }

  const rect =
    hoveredTargetElement && document.contains(hoveredTargetElement)
      ? hoveredTargetElement.getBoundingClientRect()
      : null;

  const boundingBox = rect
    ? { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
    : {
        x: hoveredAnnotation.boundingBox.x,
        y: hoveredAnnotation.isFixed
          ? hoveredAnnotation.boundingBox.y
          : hoveredAnnotation.boundingBox.y - scrollY,
        width: hoveredAnnotation.boundingBox.width,
        height: hoveredAnnotation.boundingBox.height,
      };

  const isMulti = hoveredAnnotation.isMultiSelect;

  return (
    <div
      className={`${isMulti ? styles.multiSelectOutline : styles.singleSelectOutline} ${styles.enter}`}
      style={{
        left: boundingBox.x,
        top: boundingBox.y,
        width: boundingBox.width,
        height: boundingBox.height,
        ...(isMulti
          ? {}
          : {
              borderColor: `${annotationColor}99`,
              backgroundColor: `${annotationColor}0D`,
            }),
      }}
    />
  );
}
