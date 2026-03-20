import type { HoverInfo, PendingAnnotationState } from "../hooks/useInteractionLifecycle";
import styles from "../styles.module.scss";

type HoverHighlightProps = {
  hoverInfo: HoverInfo | null;
  pendingAnnotation: PendingAnnotationState | null;
  isScrolling: boolean;
  isDragging: boolean;
  annotationColor: string;
};

export function HoverHighlight({
  hoverInfo,
  pendingAnnotation,
  isScrolling,
  isDragging,
  annotationColor,
}: HoverHighlightProps): JSX.Element | null {
  if (!hoverInfo?.rect || pendingAnnotation || isScrolling || isDragging) {
    return null;
  }

  return (
    <div
      className={`${styles.hoverHighlight} ${styles.enter}`}
      style={{
        left: hoverInfo.rect.left,
        top: hoverInfo.rect.top,
        width: hoverInfo.rect.width,
        height: hoverInfo.rect.height,
        borderColor: `${annotationColor}80`,
        backgroundColor: `${annotationColor}0A`,
        ...(hoverInfo.isPiercing ? { borderStyle: "dashed" } : {}),
      }}
    />
  );
}
