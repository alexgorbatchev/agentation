import type { CSSProperties, Ref } from "react";

import {
  ToolbarControlsView,
  type ConnectionStatus,
  type SendState,
  type ToolbarButtonRefs,
} from "./ToolbarControlsView";
import styles from "../styles.module.scss";

export type { ConnectionStatus, SendState, ToolbarButtonId, ToolbarButtonRefs } from "./ToolbarControlsView";

const noop = (): void => {};

export type PageFeedbackToolbarPreviewProps = {
  className?: string;
  style?: CSSProperties;
  containerClassName?: string;
  containerRef?: Ref<HTMLDivElement>;
  isActive: boolean;
  isDarkMode?: boolean;
  annotationCount: number;
  annotationColor?: string;
  showEntranceAnimation?: boolean;
  isFrozen?: boolean;
  showMarkers?: boolean;
  copied?: boolean;
  hasSendButton?: boolean;
  sendState?: SendState;
  reviewCount?: number;
  hasResolvedAnnotations?: boolean;
  showReviewQueue?: boolean;
  resolvedEndpoint?: string;
  connectionStatus?: ConnectionStatus;
  buttonRefs?: ToolbarButtonRefs;
  onActivate?: () => void;
  onDeactivate?: () => void;
};

export function PageFeedbackToolbarPreview({
  className,
  style,
  containerClassName,
  containerRef,
  isActive,
  isDarkMode = true,
  annotationCount,
  annotationColor = "#3c82f7",
  showEntranceAnimation = false,
  isFrozen = false,
  showMarkers = true,
  copied = false,
  hasSendButton = true,
  sendState = "idle",
  reviewCount = 0,
  hasResolvedAnnotations = false,
  showReviewQueue = false,
  resolvedEndpoint = "",
  connectionStatus = "connected",
  buttonRefs,
  onActivate,
  onDeactivate,
}: PageFeedbackToolbarPreviewProps): JSX.Element {
  const hasAnnotations = annotationCount > 0;
  const toolbarContainerClassName = `${styles.toolbarContainer} ${
    !isDarkMode ? styles.light : ""
  } ${isActive ? styles.expanded : styles.collapsed} ${
    showEntranceAnimation ? styles.entrance : ""
  } ${hasSendButton ? styles.serverConnected : ""}${containerClassName ? ` ${containerClassName}` : ""}`;

  return (
    <div
      className={`${styles.toolbar}${className ? ` ${className}` : ""}`}
      style={{
        position: "absolute",
        width: "auto",
        zIndex: "auto",
        ...style,
      }}
    >
      <div
        ref={containerRef}
        className={toolbarContainerClassName}
        onClick={!isActive ? onActivate : undefined}
        role={!isActive ? "button" : undefined}
        tabIndex={!isActive ? 0 : -1}
        title={!isActive ? "Start feedback mode" : undefined}
      >
        <ToolbarControlsView
          isActive={isActive}
          isDarkMode={isDarkMode}
          annotationCount={annotationCount}
          showEntranceAnimation={showEntranceAnimation}
          annotationColor={annotationColor}
          toolbarPosition={null}
          tooltipsHidden={true}
          showSettings={false}
          showReviewQueue={showReviewQueue}
          tooltipSessionActive={false}
          handleControlsMouseEnter={noop}
          handleControlsMouseLeave={noop}
          isFrozen={isFrozen}
          hideTooltipsUntilMouseLeave={noop}
          toggleFreeze={noop}
          hasAnnotations={hasAnnotations}
          showMarkers={showMarkers}
          onToggleMarkers={noop}
          copied={copied}
          copyOutput={noop}
          webhooksEnabled={!hasSendButton}
          settingsWebhookUrl={hasSendButton ? "https://example.com/webhook" : ""}
          sendState={sendState}
          sendToWebhook={noop}
          clearAll={noop}
          resolvedAnnotationsCount={hasResolvedAnnotations ? 1 : 0}
          unreviewedCount={reviewCount}
          onToggleReviewQueue={noop}
          resolvedEndpoint={resolvedEndpoint}
          connectionStatus={connectionStatus}
          onToggleSettings={noop}
          onDeactivate={onDeactivate ?? noop}
          buttonRefs={buttonRefs}
        />
      </div>
    </div>
  );
}
