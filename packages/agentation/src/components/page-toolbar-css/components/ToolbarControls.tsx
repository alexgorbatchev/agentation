import type { Annotation } from "../../../types";
import {
  ToolbarControlsView,
  type ConnectionStatus,
  type SendState,
} from "./ToolbarControlsView";

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
  return (
    <ToolbarControlsView
      isActive={isActive}
      isDarkMode={isDarkMode}
      annotationCount={activeAnnotations.length}
      showEntranceAnimation={showEntranceAnimation}
      annotationColor={annotationColor}
      toolbarPosition={toolbarPosition}
      tooltipsHidden={tooltipsHidden}
      showSettings={showSettings}
      showReviewQueue={showReviewQueue}
      tooltipSessionActive={tooltipSessionActive}
      handleControlsMouseEnter={handleControlsMouseEnter}
      handleControlsMouseLeave={handleControlsMouseLeave}
      isFrozen={isFrozen}
      hideTooltipsUntilMouseLeave={hideTooltipsUntilMouseLeave}
      toggleFreeze={toggleFreeze}
      hasAnnotations={hasAnnotations}
      showMarkers={showMarkers}
      onToggleMarkers={onToggleMarkers}
      copied={copied}
      copyOutput={copyOutput}
      webhooksEnabled={webhooksEnabled}
      settingsWebhookUrl={settingsWebhookUrl}
      webhookUrl={webhookUrl}
      sendState={sendState}
      sendToWebhook={sendToWebhook}
      clearAll={clearAll}
      resolvedAnnotationsCount={resolvedAnnotationsCount}
      unreviewedCount={unreviewedCount}
      onToggleReviewQueue={onToggleReviewQueue}
      resolvedEndpoint={resolvedEndpoint}
      connectionStatus={connectionStatus}
      onToggleSettings={onToggleSettings}
      onDeactivate={onDeactivate}
    />
  );
}
