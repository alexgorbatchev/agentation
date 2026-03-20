import type { CSSProperties } from "react";

import type { Annotation } from "../../../types";

export function getTooltipPosition(annotation: Annotation): CSSProperties {
  const tooltipMaxWidth = 200;
  const tooltipEstimatedHeight = 80;
  const markerSize = 22;
  const gap = 10;

  const markerX = (annotation.x / 100) * window.innerWidth;
  const markerY =
    typeof annotation.y === "string"
      ? Number.parseFloat(annotation.y)
      : annotation.y;

  const styles: CSSProperties = {};

  const spaceBelow = window.innerHeight - markerY - markerSize - gap;
  if (spaceBelow < tooltipEstimatedHeight) {
    styles.top = "auto";
    styles.bottom = `calc(100% + ${gap}px)`;
  }

  const centeredLeft = markerX - tooltipMaxWidth / 2;
  const edgePadding = 10;

  if (centeredLeft < edgePadding) {
    const offset = edgePadding - centeredLeft;
    styles.left = `calc(50% + ${offset}px)`;
  } else if (centeredLeft + tooltipMaxWidth > window.innerWidth - edgePadding) {
    const overflow = centeredLeft + tooltipMaxWidth - (window.innerWidth - edgePadding);
    styles.left = `calc(50% - ${overflow}px)`;
  }

  return styles;
}
