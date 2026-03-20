import type { MutableRefObject } from "react";

import styles from "../styles.module.scss";

type DragSelectionOverlayProps = {
  isDragging: boolean;
  dragRectRef: MutableRefObject<HTMLDivElement | null>;
  highlightsContainerRef: MutableRefObject<HTMLDivElement | null>;
};

export function DragSelectionOverlay({
  isDragging,
  dragRectRef,
  highlightsContainerRef,
}: DragSelectionOverlayProps): JSX.Element | null {
  if (!isDragging) {
    return null;
  }

  return (
    <>
      <div ref={dragRectRef} className={styles.dragSelection} />
      <div ref={highlightsContainerRef} className={styles.highlightsContainer} />
    </>
  );
}
