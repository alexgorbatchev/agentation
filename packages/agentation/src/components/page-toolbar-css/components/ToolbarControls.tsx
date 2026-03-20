import {
  IconCheckmarkCircle,
  IconCopyAnimated,
  IconEyeAnimated,
  IconGear,
  IconListSparkle,
  IconPausePlayAnimated,
  IconSendArrow,
  IconTrashAlt,
  IconXmarkLarge,
} from "../../icons";
import type { Annotation } from "../../../types";
import { isValidUrl } from "../utils/isValidUrl";
import styles from "../styles.module.scss";

type ConnectionStatus = "disconnected" | "connecting" | "connected";

type SendState = "idle" | "sending" | "sent" | "failed";

type ToolbarControlsProps = {
  isActive: boolean;
  isDarkMode: boolean;
  activeAnnotations: Annotation[];
  showEntranceAnimation: boolean;
  annotationColor: string;
  toolbarPosition: { x: number; y: number } | null;
  tooltipsHidden: boolean;
  showSettings: boolean;
  showReviewQueue: boolean;
  tooltipSessionActive: boolean;
  handleControlsMouseEnter: () => void;
  handleControlsMouseLeave: () => void;
  isFrozen: boolean;
  hideTooltipsUntilMouseLeave: () => void;
  toggleFreeze: () => void;
  hasAnnotations: boolean;
  showMarkers: boolean;
  onToggleMarkers: () => void;
  copied: boolean;
  copyOutput: () => void;
  webhooksEnabled: boolean;
  settingsWebhookUrl: string;
  webhookUrl?: string;
  sendState: SendState;
  sendToWebhook: () => void;
  clearAll: () => void;
  resolvedAnnotationsCount: number;
  unreviewedCount: number;
  onToggleReviewQueue: () => void;
  resolvedEndpoint: string;
  connectionStatus: ConnectionStatus;
  onToggleSettings: () => void;
  onDeactivate: () => void;
};

export function ToolbarControls({
  isActive,
  isDarkMode,
  activeAnnotations,
  showEntranceAnimation,
  annotationColor,
  toolbarPosition,
  tooltipsHidden,
  showSettings,
  showReviewQueue,
  tooltipSessionActive,
  handleControlsMouseEnter,
  handleControlsMouseLeave,
  isFrozen,
  hideTooltipsUntilMouseLeave,
  toggleFreeze,
  hasAnnotations,
  showMarkers,
  onToggleMarkers,
  copied,
  copyOutput,
  webhooksEnabled,
  settingsWebhookUrl,
  webhookUrl,
  sendState,
  sendToWebhook,
  clearAll,
  resolvedAnnotationsCount,
  unreviewedCount,
  onToggleReviewQueue,
  resolvedEndpoint,
  connectionStatus,
  onToggleSettings,
  onDeactivate,
}: ToolbarControlsProps): JSX.Element {
  const hasWebhookUrl =
    isValidUrl(settingsWebhookUrl) || isValidUrl(webhookUrl || "");

  return (
    <>
      <div
        className={`${styles.toggleContent} ${!isActive ? styles.visible : styles.hidden}`}
      >
        <IconListSparkle size={24} />
        {activeAnnotations.length > 0 && (
          <span
            className={`${styles.badge} ${isActive ? styles.fadeOut : ""} ${showEntranceAnimation ? styles.entrance : ""}`}
            style={{ backgroundColor: annotationColor }}
          >
            {activeAnnotations.length}
          </span>
        )}
      </div>

      <div
        className={`${styles.controlsContent} ${isActive ? styles.visible : styles.hidden} ${
          toolbarPosition && toolbarPosition.y < 100
            ? styles.tooltipBelow
            : ""
        } ${tooltipsHidden || showSettings || showReviewQueue ? styles.tooltipsHidden : ""} ${tooltipSessionActive ? styles.tooltipsInSession : ""}`}
        onMouseEnter={handleControlsMouseEnter}
        onMouseLeave={handleControlsMouseLeave}
      >
        <div
          className={`${styles.buttonWrapper} ${
            toolbarPosition && toolbarPosition.x < 120
              ? styles.buttonWrapperAlignLeft
              : ""
          }`}
        >
          <button
            className={`${styles.controlButton} ${!isDarkMode ? styles.light : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              hideTooltipsUntilMouseLeave();
              toggleFreeze();
            }}
            data-active={isFrozen}
          >
            <IconPausePlayAnimated size={24} isPaused={isFrozen} />
          </button>
          <span className={styles.buttonTooltip}>
            {isFrozen ? "Resume animations" : "Pause animations"}
            <span className={styles.shortcut}>P</span>
          </span>
        </div>

        <div className={styles.buttonWrapper}>
          <button
            className={`${styles.controlButton} ${!isDarkMode ? styles.light : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              hideTooltipsUntilMouseLeave();
              onToggleMarkers();
            }}
            disabled={!hasAnnotations}
          >
            <IconEyeAnimated size={24} isOpen={showMarkers} />
          </button>
          <span className={styles.buttonTooltip}>
            {showMarkers ? "Hide markers" : "Show markers"}
            <span className={styles.shortcut}>H</span>
          </span>
        </div>

        <div className={styles.buttonWrapper}>
          <button
            className={`${styles.controlButton} ${!isDarkMode ? styles.light : ""} ${copied ? styles.statusShowing : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              hideTooltipsUntilMouseLeave();
              copyOutput();
            }}
            disabled={!hasAnnotations}
            data-active={copied}
          >
            <IconCopyAnimated size={24} copied={copied} />
          </button>
          <span className={styles.buttonTooltip}>
            Copy feedback
            <span className={styles.shortcut}>C</span>
          </span>
        </div>

        <div
          className={`${styles.buttonWrapper} ${styles.sendButtonWrapper} ${isActive && !webhooksEnabled && hasWebhookUrl ? styles.sendButtonVisible : ""}`}
        >
          <button
            className={`${styles.controlButton} ${!isDarkMode ? styles.light : ""} ${sendState === "sent" || sendState === "failed" ? styles.statusShowing : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              hideTooltipsUntilMouseLeave();
              sendToWebhook();
            }}
            disabled={!hasAnnotations || !hasWebhookUrl || sendState === "sending"}
            data-no-hover={sendState === "sent" || sendState === "failed"}
            tabIndex={hasWebhookUrl ? 0 : -1}
          >
            <IconSendArrow size={24} state={sendState} />
            {activeAnnotations.length > 0 && sendState === "idle" && (
              <span
                className={`${styles.buttonBadge} ${!isDarkMode ? styles.light : ""}`}
                style={{ backgroundColor: annotationColor }}
              >
                {activeAnnotations.length}
              </span>
            )}
          </button>
          <span className={styles.buttonTooltip}>
            Send Annotations
            <span className={styles.shortcut}>S</span>
          </span>
        </div>

        <div className={styles.buttonWrapper}>
          <button
            className={`${styles.controlButton} ${!isDarkMode ? styles.light : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              hideTooltipsUntilMouseLeave();
              clearAll();
            }}
            disabled={!hasAnnotations}
            data-danger
          >
            <IconTrashAlt size={24} />
          </button>
          <span className={styles.buttonTooltip}>
            Clear all
            <span className={styles.shortcut}>X</span>
          </span>
        </div>

        <div className={`${styles.buttonWrapper} ${styles.reviewQueueButtonWrapper}`}>
          <button
            className={`${styles.controlButton} ${!isDarkMode ? styles.light : ""}`}
            disabled={resolvedAnnotationsCount === 0}
            onClick={(event) => {
              event.stopPropagation();
              hideTooltipsUntilMouseLeave();
              onToggleReviewQueue();
            }}
            data-active={showReviewQueue}
          >
            <IconCheckmarkCircle size={24} />
            {unreviewedCount > 0 && (
              <span
                className={`${styles.buttonBadge} ${!isDarkMode ? styles.light : ""}`}
                style={{ backgroundColor: "#34C759" }}
              >
                {unreviewedCount}
              </span>
            )}
          </button>
          <span className={styles.buttonTooltip}>
            Review queue
            <span className={styles.shortcut}>Q</span>
          </span>
        </div>

        <div className={styles.buttonWrapper}>
          <button
            className={`${styles.controlButton} ${!isDarkMode ? styles.light : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              hideTooltipsUntilMouseLeave();
              onToggleSettings();
            }}
          >
            <IconGear size={24} />
          </button>
          {resolvedEndpoint && (
            <span
              className={`${styles.mcpIndicator} ${!isDarkMode ? styles.light : ""} ${styles[connectionStatus]} ${showSettings ? styles.hidden : ""}`}
              title={
                connectionStatus === "connected"
                  ? "MCP Connected"
                  : connectionStatus === "connecting"
                    ? "MCP Connecting..."
                    : "MCP Disconnected"
              }
            />
          )}
          <span className={styles.buttonTooltip}>Settings</span>
        </div>

        <div className={`${styles.divider} ${!isDarkMode ? styles.light : ""}`} />

        <div
          className={`${styles.buttonWrapper} ${
            toolbarPosition &&
            typeof window !== "undefined" &&
            toolbarPosition.x > window.innerWidth - 120
              ? styles.buttonWrapperAlignRight
              : ""
          }`}
        >
          <button
            className={`${styles.controlButton} ${!isDarkMode ? styles.light : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              hideTooltipsUntilMouseLeave();
              onDeactivate();
            }}
          >
            <IconXmarkLarge size={24} />
          </button>
          <span className={styles.buttonTooltip}>
            Exit
            <span className={styles.shortcut}>Esc</span>
          </span>
        </div>
      </div>
    </>
  );
}
