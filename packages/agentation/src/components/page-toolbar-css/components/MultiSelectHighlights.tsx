import type { PendingMultiSelectElement } from "../hooks/useInteractionLifecycle";
import styles from "../styles.module.scss";

type MultiSelectHighlightsProps = {
  pendingMultiSelectElements: PendingMultiSelectElement[];
  annotationColor: string;
};

export function MultiSelectHighlights({
  pendingMultiSelectElements,
  annotationColor,
}: MultiSelectHighlightsProps): JSX.Element {
  return (
    <>
      {pendingMultiSelectElements
        .filter((item) => document.contains(item.element))
        .map((item, index) => {
          const rect = item.element.getBoundingClientRect();
          const isMulti = pendingMultiSelectElements.length > 1;

          return (
            <div
              key={index}
              className={isMulti ? styles.multiSelectOutline : styles.singleSelectOutline}
              style={{
                position: "fixed",
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
                ...(isMulti
                  ? {}
                  : {
                      borderColor: `${annotationColor}99`,
                      backgroundColor: `${annotationColor}0D`,
                    }),
              }}
            />
          );
        })}
    </>
  );
}
