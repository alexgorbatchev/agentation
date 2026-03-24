import type { AcknowledgementNotification } from "../hooks/useAcknowledgementNotification";
import styles from "../styles.module.scss";

type AgentationNotificationToastProps = {
  notification: AcknowledgementNotification | null;
  isDarkMode: boolean;
};

export function AgentationNotificationToast({
  notification,
  isDarkMode,
}: AgentationNotificationToastProps): JSX.Element | null {
  if (notification === null) {
    return null;
  }

  return (
    <div className={styles.notificationToastContainer}>
      <div
        className={`${styles.notificationToast} ${!isDarkMode ? styles.light : ""}`}
        role="status"
        aria-live="polite"
        data-agentation-notification-toast
        data-annotation-id={notification.annotationId}
      >
        <span className={styles.notificationToastTitle}>Agent started work</span>
        <span className={styles.notificationToastDetail}>{notification.detail}</span>
      </div>
    </div>
  );
}
