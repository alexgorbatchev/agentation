import type { Dispatch, SetStateAction } from "react";

import { IconCheckSmall } from "../../icons";
import type { Annotation } from "../../../types";
import styles from "../styles.module.scss";

type ReviewQueuePanelProps = {
  isDarkMode: boolean;
  showReviewQueueVisible: boolean;
  toolbarPosition: { x: number; y: number } | null;
  resolvedAnnotations: Annotation[];
  toggleReviewed: (id: string) => void;
  setAnnotations: Dispatch<SetStateAction<Annotation[]>>;
  handleClearReviewedAnnotations: () => void;
};

export function ReviewQueuePanel({
  isDarkMode,
  showReviewQueueVisible,
  toolbarPosition,
  resolvedAnnotations,
  toggleReviewed,
  setAnnotations,
  handleClearReviewedAnnotations,
}: ReviewQueuePanelProps): JSX.Element {
  return (
    <div
      className={`${styles.reviewQueuePanel} ${isDarkMode ? styles.dark : styles.light} ${showReviewQueueVisible ? styles.enter : styles.exit}`}
      onClick={(event) => event.stopPropagation()}
      style={
        toolbarPosition && toolbarPosition.y < 230
          ? {
              bottom: "auto",
              top: "calc(100% + 0.5rem)",
            }
          : undefined
      }
    >
      <div className={styles.reviewQueueHeader}>
        <span className={styles.reviewQueueTitle}>Review Queue</span>
        <span className={styles.reviewQueueCount}>
          {resolvedAnnotations.filter((annotation) => annotation._reviewedAt).length}/
          {resolvedAnnotations.length}
        </span>
      </div>
      <div className={styles.reviewQueueList}>
        {resolvedAnnotations.map((annotation) => {
          const agentReply = annotation.thread?.find(
            (message) => message.role === "agent",
          );
          return (
            <label
              key={annotation.id}
              className={`${styles.reviewQueueItem} ${annotation._reviewedAt ? styles.checked : ""}`}
            >
              <input
                type="checkbox"
                checked={!!annotation._reviewedAt}
                onChange={() => toggleReviewed(annotation.id)}
              />
              <span
                className={`${styles.customCheckbox} ${annotation._reviewedAt ? styles.checked : ""}`}
              >
                {annotation._reviewedAt && <IconCheckSmall size={14} />}
              </span>
              <div className={styles.reviewQueueItemContent}>
                <span className={styles.reviewQueueItemElement}>
                  {annotation.element}
                </span>
                <span className={styles.reviewQueueItemComment}>
                  {annotation.comment}
                </span>
                {agentReply && (
                  <span className={styles.reviewQueueItemReply}>
                    {agentReply.content}
                  </span>
                )}
                <span
                  className={`${styles.reviewQueueItemStatus} ${styles[annotation.status || "resolved"]}`}
                >
                  {annotation.status}
                </span>
              </div>
            </label>
          );
        })}
      </div>
      <div className={styles.reviewQueueFooter}>
        <button
          className={`${styles.reviewQueueFooterButton} ${!isDarkMode ? styles.light : ""}`}
          disabled={
            resolvedAnnotations.length === 0 ||
            resolvedAnnotations.every((annotation) => annotation._reviewedAt)
          }
          onClick={() => {
            setAnnotations((currentAnnotations) =>
              currentAnnotations.map((annotation) =>
                (annotation.status === "resolved" ||
                  annotation.status === "dismissed") &&
                !annotation._reviewedAt
                  ? { ...annotation, _reviewedAt: Date.now() }
                  : annotation,
              ),
            );
          }}
        >
          Select All
        </button>
        <button
          className={`${styles.reviewQueueFooterButton} ${!isDarkMode ? styles.light : ""}`}
          disabled={!resolvedAnnotations.some((annotation) => annotation._reviewedAt)}
          onClick={handleClearReviewedAnnotations}
        >
          Clear Selected
        </button>
      </div>
    </div>
  );
}
