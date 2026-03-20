import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { isValidUrl } from "../utils/isValidUrl";

type SendState = "idle" | "sending" | "sent" | "failed";

type UseToolbarInteractionsParams = {
  isActive: boolean;
  setIsActive: Dispatch<SetStateAction<boolean>>;
  hasPendingAnnotation: boolean;
  hasEditingAnnotation: boolean;
  pendingMultiSelectCount: number;
  hasComponentMenu: boolean;
  annotationsCount: number;
  settingsWebhookUrl: string;
  webhookUrl?: string;
  sendState: SendState;
  sendToWebhook: () => void;
  toggleFreeze: () => void;
  copyOutput: () => void;
  clearAll: () => void;
  toggleMarkers: () => void;
  toggleReviewQueue: () => void;
  clearPendingMultiSelect: () => void;
};

type UseToolbarInteractionsResult = {
  isAltSelectionHeld: boolean;
  tooltipsHidden: boolean;
  setTooltipsHidden: Dispatch<SetStateAction<boolean>>;
  tooltipSessionActive: boolean;
  hideTooltipsUntilMouseLeave: () => void;
  showTooltipsAgain: () => void;
  handleControlsMouseEnter: () => void;
  handleControlsMouseLeave: () => void;
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  );
}

export function useToolbarInteractions({
  isActive,
  setIsActive,
  hasPendingAnnotation,
  hasEditingAnnotation,
  pendingMultiSelectCount,
  hasComponentMenu,
  annotationsCount,
  settingsWebhookUrl,
  webhookUrl,
  sendState,
  sendToWebhook,
  toggleFreeze,
  copyOutput,
  clearAll,
  toggleMarkers,
  toggleReviewQueue,
  clearPendingMultiSelect,
}: UseToolbarInteractionsParams): UseToolbarInteractionsResult {
  const [tooltipsHidden, setTooltipsHidden] = useState(false);
  const [tooltipSessionActive, setTooltipSessionActive] = useState(false);
  const tooltipSessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const isAltSelectionHeldRef = useRef(false);
  const didAltActivateToolbarRef = useRef(false);
  const [isAltSelectionHeld, setIsAltSelectionHeld] = useState(false);

  const hideTooltipsUntilMouseLeave = (): void => {
    setTooltipsHidden(true);
  };

  const showTooltipsAgain = (): void => {
    setTooltipsHidden(false);
  };

  const handleControlsMouseEnter = (): void => {
    if (!tooltipSessionActive) {
      tooltipSessionTimerRef.current = setTimeout(
        () => setTooltipSessionActive(true),
        850,
      );
    }
  };

  const handleControlsMouseLeave = (): void => {
    if (tooltipSessionTimerRef.current) {
      clearTimeout(tooltipSessionTimerRef.current);
      tooltipSessionTimerRef.current = null;
    }
    setTooltipSessionActive(false);
    showTooltipsAgain();
  };

  useEffect(() => {
    return () => {
      if (tooltipSessionTimerRef.current) {
        clearTimeout(tooltipSessionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isActive) {
      return;
    }

    isAltSelectionHeldRef.current = false;
    didAltActivateToolbarRef.current = false;
    setIsAltSelectionHeld(false);
  }, [isActive]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const isTyping = isTypingTarget(event.target);

      if (event.key === "Alt") {
        if (isTyping || event.repeat || isAltSelectionHeldRef.current) {
          return;
        }

        setTooltipsHidden(true);
        isAltSelectionHeldRef.current = true;
        didAltActivateToolbarRef.current = !isActive;
        setIsAltSelectionHeld(true);

        if (!isActive) {
          setIsActive(true);
        }
        return;
      }

      if (event.key === "Escape") {
        if (pendingMultiSelectCount > 0) {
          clearPendingMultiSelect();
          return;
        }

        if (!hasPendingAnnotation && isActive) {
          hideTooltipsUntilMouseLeave();
          setIsActive(false);
        }
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        (event.key === "f" || event.key === "F")
      ) {
        event.preventDefault();
        hideTooltipsUntilMouseLeave();
        setIsActive((prev) => !prev);
        return;
      }

      if (isTyping || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        hideTooltipsUntilMouseLeave();
        toggleFreeze();
      }

      if ((event.key === "h" || event.key === "H") && annotationsCount > 0) {
        event.preventDefault();
        hideTooltipsUntilMouseLeave();
        toggleMarkers();
      }

      if ((event.key === "c" || event.key === "C") && annotationsCount > 0) {
        event.preventDefault();
        hideTooltipsUntilMouseLeave();
        copyOutput();
      }

      if ((event.key === "x" || event.key === "X") && annotationsCount > 0) {
        event.preventDefault();
        hideTooltipsUntilMouseLeave();
        clearAll();
      }

      if (event.key === "q" || event.key === "Q") {
        event.preventDefault();
        hideTooltipsUntilMouseLeave();
        toggleReviewQueue();
      }

      if (event.key === "s" || event.key === "S") {
        const hasValidWebhook =
          isValidUrl(settingsWebhookUrl) || isValidUrl(webhookUrl || "");
        if (annotationsCount > 0 && hasValidWebhook && sendState === "idle") {
          event.preventDefault();
          hideTooltipsUntilMouseLeave();
          sendToWebhook();
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent): void => {
      if (event.key !== "Alt" || !isAltSelectionHeldRef.current) {
        return;
      }

      isAltSelectionHeldRef.current = false;
      const didAltActivateToolbar = didAltActivateToolbarRef.current;
      didAltActivateToolbarRef.current = false;
      setIsAltSelectionHeld(false);

      const shouldKeepToolbarOpen =
        hasPendingAnnotation ||
        hasEditingAnnotation ||
        pendingMultiSelectCount > 0 ||
        hasComponentMenu;

      if (shouldKeepToolbarOpen || !didAltActivateToolbar) {
        return;
      }

      setTooltipsHidden(true);
      setIsActive(false);
    };

    const handleBlur = (): void => {
      if (!isAltSelectionHeldRef.current) {
        return;
      }

      isAltSelectionHeldRef.current = false;
      const didAltActivateToolbar = didAltActivateToolbarRef.current;
      didAltActivateToolbarRef.current = false;
      setIsAltSelectionHeld(false);

      const shouldKeepToolbarOpen =
        hasPendingAnnotation ||
        hasEditingAnnotation ||
        pendingMultiSelectCount > 0 ||
        hasComponentMenu;

      if (shouldKeepToolbarOpen || !didAltActivateToolbar) {
        return;
      }

      setIsActive(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [
    annotationsCount,
    clearAll,
    clearPendingMultiSelect,
    copyOutput,
    hasComponentMenu,
    hasEditingAnnotation,
    hasPendingAnnotation,
    isActive,
    pendingMultiSelectCount,
    sendState,
    sendToWebhook,
    setIsActive,
    settingsWebhookUrl,
    toggleFreeze,
    toggleMarkers,
    toggleReviewQueue,
    webhookUrl,
  ]);

  return {
    isAltSelectionHeld,
    tooltipsHidden,
    setTooltipsHidden,
    tooltipSessionActive,
    hideTooltipsUntilMouseLeave,
    showTooltipsAgain,
    handleControlsMouseEnter,
    handleControlsMouseLeave,
  };
}
