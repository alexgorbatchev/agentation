import type { HoverInfo, PendingAnnotationState } from "../hooks/useInteractionLifecycle";
import styles from "../styles.module.scss";

type HoverTooltipProps = {
  hoverInfo: HoverInfo | null;
  pendingAnnotation: PendingAnnotationState | null;
  isScrolling: boolean;
  isDragging: boolean;
  hoverPosition: { x: number; y: number };
};

export function HoverTooltip({
  hoverInfo,
  pendingAnnotation,
  isScrolling,
  isDragging,
  hoverPosition,
}: HoverTooltipProps): JSX.Element | null {
  if (!hoverInfo || pendingAnnotation || isScrolling || isDragging) {
    return null;
  }

  return (
    <div
      className={`${styles.hoverTooltip} ${styles.enter}`}
      style={{
        left: Math.max(8, Math.min(hoverPosition.x, window.innerWidth - 100)),
        top: Math.max(
          hoverPosition.y -
            (hoverInfo.isPiercing ? 62 : hoverInfo.reactComponents ? 48 : 32),
          8,
        ),
      }}
    >
      {hoverInfo.isPiercing && (
        <div className={styles.hoverPierceIndicator}>{"⇣ deep select"}</div>
      )}
      {hoverInfo.reactComponents && (
        <div className={styles.hoverReactPath}>{hoverInfo.reactComponents}</div>
      )}
      <div className={styles.hoverElementName}>{hoverInfo.elementName}</div>
    </div>
  );
}
