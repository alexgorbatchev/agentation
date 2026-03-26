import { useEffect, useRef, useState } from "react";

import type { Annotation } from "../../../types";
import { originalSetTimeout } from "../../../utils/freeze-animations";

const ACKNOWLEDGEMENT_NOTIFICATION_DURATION_MS = 5000;
const COMMENT_PREVIEW_MAX_LENGTH = 72;
const MISSING_STATUS = "__missing__";

export type AcknowledgementNotification = {
  annotationId: string;
  detail: string;
};

type UseAcknowledgementNotificationParams = {
  annotations: Annotation[];
};

type UseAcknowledgementNotificationResult = {
  activeNotification: AcknowledgementNotification | null;
};

function getTrackedStatus(status: Annotation["status"]): string {
  return status ?? MISSING_STATUS;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function formatNotificationDetail(annotation: Annotation): string {
  const trimmedComment = annotation.comment.trim();
  if (trimmedComment !== "") {
    return truncateText(trimmedComment, COMMENT_PREVIEW_MAX_LENGTH);
  }

  const trimmedElement = annotation.element.trim();
  if (trimmedElement !== "") {
    return `Element: ${trimmedElement}`;
  }

  return "An annotation moved into the work queue.";
}

export function useAcknowledgementNotification({
  annotations,
}: UseAcknowledgementNotificationParams): UseAcknowledgementNotificationResult {
  const [activeNotification, setActiveNotification] =
    useState<AcknowledgementNotification | null>(null);
  const [queuedNotifications, setQueuedNotifications] = useState<
    AcknowledgementNotification[]
  >([]);
  const hasInitializedRef = useRef(false);
  const previousStatusesRef = useRef<Map<string, string>>(new Map());
  const timeoutIdRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutIdRef.current !== null) {
        window.clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const nextStatuses = new Map<string, string>();
    const notifications: AcknowledgementNotification[] = [];

    for (const annotation of annotations) {
      const nextStatus = getTrackedStatus(annotation.status);
      nextStatuses.set(annotation.id, nextStatus);

      if (!hasInitializedRef.current) {
        continue;
      }

      const previousStatus =
        previousStatusesRef.current.get(annotation.id) ?? MISSING_STATUS;
      if (previousStatus === "acknowledged" || nextStatus !== "acknowledged") {
        continue;
      }

      notifications.push({
        annotationId: annotation.id,
        detail: formatNotificationDetail(annotation),
      });
    }

    previousStatusesRef.current = nextStatuses;
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      return;
    }

    if (notifications.length > 0) {
      setQueuedNotifications((currentNotifications) => {
        return [...currentNotifications, ...notifications];
      });
    }
  }, [annotations]);

  useEffect(() => {
    if (activeNotification !== null || queuedNotifications.length === 0) {
      return;
    }

    const [nextNotification, ...remainingNotifications] = queuedNotifications;
    setActiveNotification(nextNotification ?? null);
    setQueuedNotifications(remainingNotifications);
  }, [activeNotification, queuedNotifications]);

  useEffect(() => {
    if (activeNotification === null) {
      return;
    }

    timeoutIdRef.current = originalSetTimeout(() => {
      setActiveNotification(null);
      timeoutIdRef.current = null;
    }, ACKNOWLEDGEMENT_NOTIFICATION_DURATION_MS);

    return () => {
      if (timeoutIdRef.current !== null) {
        window.clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, [activeNotification]);

  return {
    activeNotification,
  };
}
