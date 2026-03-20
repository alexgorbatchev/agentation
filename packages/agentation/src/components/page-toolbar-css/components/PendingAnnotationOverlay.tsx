import type { MutableRefObject } from "react";

import {
  AnnotationPopupCSS,
  type AnnotationPopupCSSHandle,
} from "../../annotation-popup-css";
import { IconPlus } from "../../icons";
import type { PendingAnnotationState } from "../hooks/useInteractionLifecycle";
import styles from "../styles.module.scss";

type PendingAnnotationOverlayProps = {
  pendingAnnotation: PendingAnnotationState | null;
  pendingExiting: boolean;
  scrollY: number;
  annotationColor: string;
  isDarkMode: boolean;
  popupRef: MutableRefObject<AnnotationPopupCSSHandle | null>;
  addAnnotation: (comment: string) => void;
  cancelAnnotation: () => void;
};

export function PendingAnnotationOverlay({
  pendingAnnotation,
  pendingExiting,
  scrollY,
  annotationColor,
  isDarkMode,
  popupRef,
  addAnnotation,
  cancelAnnotation,
}: PendingAnnotationOverlayProps): JSX.Element | null {
  if (!pendingAnnotation) {
    return null;
  }

  const markerX = pendingAnnotation.x;
  const markerY = pendingAnnotation.isFixed
    ? pendingAnnotation.y
    : pendingAnnotation.y - scrollY;

  return (
    <>
      {pendingAnnotation.multiSelectElements?.length
        ? pendingAnnotation.multiSelectElements
            .filter((element) => document.contains(element))
            .map((element, index) => {
              const rect = element.getBoundingClientRect();
              return (
                <div
                  key={`pending-multi-${index}`}
                  className={`${styles.multiSelectOutline} ${pendingExiting ? styles.exit : styles.enter}`}
                  style={{
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                  }}
                />
              );
            })
        : pendingAnnotation.targetElement &&
            document.contains(pendingAnnotation.targetElement)
          ? (() => {
              const rect = pendingAnnotation.targetElement!.getBoundingClientRect();
              return (
                <div
                  className={`${styles.singleSelectOutline} ${pendingExiting ? styles.exit : styles.enter}`}
                  style={{
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                    borderColor: `${annotationColor}99`,
                    backgroundColor: `${annotationColor}0D`,
                  }}
                />
              );
            })()
          : pendingAnnotation.boundingBox && (
              <div
                className={`${
                  pendingAnnotation.isMultiSelect
                    ? styles.multiSelectOutline
                    : styles.singleSelectOutline
                } ${pendingExiting ? styles.exit : styles.enter}`}
                style={{
                  left: pendingAnnotation.boundingBox.x,
                  top: pendingAnnotation.boundingBox.y - scrollY,
                  width: pendingAnnotation.boundingBox.width,
                  height: pendingAnnotation.boundingBox.height,
                  ...(pendingAnnotation.isMultiSelect
                    ? {}
                    : {
                        borderColor: `${annotationColor}99`,
                        backgroundColor: `${annotationColor}0D`,
                      }),
                }}
              />
            )}

      <div
        className={`${styles.marker} ${styles.pending} ${
          pendingAnnotation.isMultiSelect ? styles.multiSelect : ""
        } ${pendingExiting ? styles.exit : styles.enter}`}
        style={{
          left: `${markerX}%`,
          top: markerY,
          backgroundColor: pendingAnnotation.isMultiSelect
            ? "#34C759"
            : annotationColor,
        }}
      >
        <IconPlus size={12} />
      </div>

      <AnnotationPopupCSS
        ref={popupRef}
        element={pendingAnnotation.element}
        selectedText={pendingAnnotation.selectedText}
        computedStyles={pendingAnnotation.computedStylesObj}
        placeholder={
          pendingAnnotation.element === "Area selection"
            ? "What should change in this area?"
            : pendingAnnotation.isMultiSelect
              ? "Feedback for this group of elements..."
              : "What should change?"
        }
        onSubmit={addAnnotation}
        onCancel={cancelAnnotation}
        isExiting={pendingExiting}
        lightMode={!isDarkMode}
        accentColor={
          pendingAnnotation.isMultiSelect ? "#34C759" : annotationColor
        }
        style={{
          left: Math.max(
            160,
            Math.min(window.innerWidth - 160, (markerX / 100) * window.innerWidth),
          ),
          ...(markerY > window.innerHeight - 290
            ? { bottom: window.innerHeight - markerY + 20 }
            : { top: markerY + 20 }),
        }}
      />
    </>
  );
}
