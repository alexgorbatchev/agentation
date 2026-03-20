import type { MutableRefObject } from "react";

import {
  AnnotationPopupCSS,
  type AnnotationPopupCSSHandle,
} from "../../annotation-popup-css";
import type { Annotation } from "../../../types";
import { parseComputedStylesString } from "../../../utils/element-identification";
import styles from "../styles.module.scss";

type EditAnnotationOverlayProps = {
  editingAnnotation: Annotation | null;
  editingTargetElement: HTMLElement | null;
  editingTargetElements: HTMLElement[];
  scrollY: number;
  annotationColor: string;
  isDarkMode: boolean;
  editPopupRef: MutableRefObject<AnnotationPopupCSSHandle | null>;
  updateAnnotation: (newComment: string) => void;
  cancelEditAnnotation: () => void;
  deleteAnnotation: (id: string) => void;
  editExiting: boolean;
  resolvedEndpoint: string;
  handleThreadReply: (content: string) => Promise<void>;
  isReplySending: boolean;
};

export function EditAnnotationOverlay({
  editingAnnotation,
  editingTargetElement,
  editingTargetElements,
  scrollY,
  annotationColor,
  isDarkMode,
  editPopupRef,
  updateAnnotation,
  cancelEditAnnotation,
  deleteAnnotation,
  editExiting,
  resolvedEndpoint,
  handleThreadReply,
  isReplySending,
}: EditAnnotationOverlayProps): JSX.Element | null {
  if (!editingAnnotation) {
    return null;
  }

  const markerY = editingAnnotation.isFixed
    ? editingAnnotation.y
    : editingAnnotation.y - scrollY;

  return (
    <>
      {editingAnnotation.elementBoundingBoxes?.length
        ? (() => {
            if (editingTargetElements.length > 0) {
              return editingTargetElements
                .filter((element) => document.contains(element))
                .map((element, index) => {
                  const rect = element.getBoundingClientRect();
                  return (
                    <div
                      key={`edit-multi-live-${index}`}
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

            return editingAnnotation.elementBoundingBoxes!.map(
              (boundingBox, index) => (
                <div
                  key={`edit-multi-${index}`}
                  className={`${styles.multiSelectOutline} ${styles.enter}`}
                  style={{
                    left: boundingBox.x,
                    top: boundingBox.y - scrollY,
                    width: boundingBox.width,
                    height: boundingBox.height,
                  }}
                />
              ),
            );
          })()
        : (() => {
            const rect =
              editingTargetElement && document.contains(editingTargetElement)
                ? editingTargetElement.getBoundingClientRect()
                : null;

            const boundingBox = rect
              ? { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
              : editingAnnotation.boundingBox
                ? {
                    x: editingAnnotation.boundingBox.x,
                    y: editingAnnotation.isFixed
                      ? editingAnnotation.boundingBox.y
                      : editingAnnotation.boundingBox.y - scrollY,
                    width: editingAnnotation.boundingBox.width,
                    height: editingAnnotation.boundingBox.height,
                  }
                : null;

            if (!boundingBox) {
              return null;
            }

            return (
              <div
                className={`${
                  editingAnnotation.isMultiSelect
                    ? styles.multiSelectOutline
                    : styles.singleSelectOutline
                } ${styles.enter}`}
                style={{
                  left: boundingBox.x,
                  top: boundingBox.y,
                  width: boundingBox.width,
                  height: boundingBox.height,
                  ...(editingAnnotation.isMultiSelect
                    ? {}
                    : {
                        borderColor: `${annotationColor}99`,
                        backgroundColor: `${annotationColor}0D`,
                      }),
                }}
              />
            );
          })()}

      <AnnotationPopupCSS
        ref={editPopupRef}
        element={editingAnnotation.element}
        selectedText={editingAnnotation.selectedText}
        computedStyles={parseComputedStylesString(editingAnnotation.computedStyles)}
        placeholder="Edit your feedback..."
        initialValue={editingAnnotation.comment}
        submitLabel="Save"
        onSubmit={updateAnnotation}
        onCancel={cancelEditAnnotation}
        onDelete={() => deleteAnnotation(editingAnnotation.id)}
        isExiting={editExiting}
        lightMode={!isDarkMode}
        thread={editingAnnotation.thread}
        onReply={resolvedEndpoint ? handleThreadReply : undefined}
        isReplySending={isReplySending}
        accentColor={
          editingAnnotation.isMultiSelect ? "#34C759" : annotationColor
        }
        style={{
          left: Math.max(
            160,
            Math.min(
              window.innerWidth - 160,
              (editingAnnotation.x / 100) * window.innerWidth,
            ),
          ),
          ...(markerY > window.innerHeight - 290
            ? { bottom: window.innerHeight - markerY + 20 }
            : { top: markerY + 20 }),
        }}
      />
    </>
  );
}
