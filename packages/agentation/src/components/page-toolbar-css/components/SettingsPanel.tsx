import type { CSSProperties, Dispatch, SetStateAction } from "react";

import {
  IconCheckSmallAnimated,
  IconChevronLeft,
  IconHelp,
  IconMoon,
  IconSun,
} from "../../icons";
import type { ComponentEditor } from "../../../utils/component-inspector";
import type {
  OutputDetailLevel,
  ToolbarSettings,
} from "../state/toolbar-settings";
import styles from "../styles.module.scss";
import { TooltipPortal } from "./TooltipPortal";

type ConnectionStatus = "disconnected" | "connecting" | "connected";

type OutputDetailOption = {
  value: OutputDetailLevel;
  label: string;
};

type ColorOption = {
  value: string;
  label: string;
};

type SettingsPanelProps = {
  isDarkMode: boolean;
  showSettingsVisible: boolean;
  isTransitioning: boolean;
  toolbarPosition: { x: number; y: number } | null;
  settingsPage: "main" | "automations";
  setSettingsPage: Dispatch<SetStateAction<"main" | "automations">>;
  settings: ToolbarSettings;
  setSettings: Dispatch<SetStateAction<ToolbarSettings>>;
  setIsDarkMode: Dispatch<SetStateAction<boolean>>;
  isDevMode: boolean;
  projectId?: string;
  resolvedEndpoint: string;
  connectionStatus: ConnectionStatus;
  neovimConnectionStatus: ConnectionStatus;
  componentEditor: ComponentEditor;
  hideToolbarTemporarily: () => void;
  outputDetailOptions: OutputDetailOption[];
  colorOptions: ColorOption[];
};

export function SettingsPanel({
  isDarkMode,
  showSettingsVisible,
  isTransitioning,
  toolbarPosition,
  settingsPage,
  setSettingsPage,
  settings,
  setSettings,
  setIsDarkMode,
  isDevMode,
  projectId,
  resolvedEndpoint,
  connectionStatus,
  neovimConnectionStatus,
  componentEditor,
  hideToolbarTemporarily,
  outputDetailOptions,
  colorOptions,
}: SettingsPanelProps): JSX.Element {
  return (
    <div
      className={`${styles.settingsPanel} ${isDarkMode ? styles.dark : styles.light} ${showSettingsVisible ? styles.enter : styles.exit}`}
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
      <div
        className={`${styles.settingsPanelContainer} ${isTransitioning ? styles.transitioning : ""}`}
      >
        <div
          className={`${styles.settingsPage} ${settingsPage === "automations" ? styles.slideLeft : ""}`}
        >
          <div className={styles.settingsHeader}>
            <span className={styles.settingsBrand}>
              <span
                className={styles.settingsBrandSlash}
                style={{
                  color: settings.annotationColor,
                  transition: "color 0.2s ease",
                }}
              >
                /
              </span>
              agentation
            </span>
            <span className={styles.settingsVersion}>v{__VERSION__}</span>
            <button
              className={styles.themeToggle}
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className={styles.themeIconWrapper}>
                <span
                  key={isDarkMode ? "sun" : "moon"}
                  className={styles.themeIcon}
                >
                  {isDarkMode ? <IconSun size={20} /> : <IconMoon size={20} />}
                </span>
              </span>
            </button>
          </div>

          <div className={styles.settingsSection}>
            <div className={styles.settingsRow}>
              <div
                className={`${styles.settingsLabel} ${!isDarkMode ? styles.light : ""}`}
              >
                Project ID
              </div>
              <span
                className={`${styles.settingsValue} ${!isDarkMode ? styles.light : ""}`}
              >
                {typeof projectId === "string" && projectId.trim() !== ""
                  ? projectId.trim()
                  : "Not set"}
              </span>
            </div>

            <div
              className={`${styles.settingsRow} ${styles.settingsRowMarginTop}`}
            >
              <div
                className={`${styles.settingsLabel} ${!isDarkMode ? styles.light : ""}`}
              >
                Output Detail
                <TooltipPortal
                  content="Controls how much detail is included in the copied output"
                  isTransitioning={isTransitioning}
                >
                  <span className={styles.helpIcon}>
                    <IconHelp size={20} />
                  </span>
                </TooltipPortal>
              </div>
              <button
                className={`${styles.cycleButton} ${!isDarkMode ? styles.light : ""}`}
                onClick={() => {
                  const currentIndex = outputDetailOptions.findIndex(
                    (option) => option.value === settings.outputDetail,
                  );
                  const nextIndex =
                    (currentIndex + 1) % outputDetailOptions.length;
                  setSettings((currentSettings) => ({
                    ...currentSettings,
                    outputDetail: outputDetailOptions[nextIndex].value,
                  }));
                }}
              >
                <span
                  key={settings.outputDetail}
                  className={styles.cycleButtonText}
                >
                  {
                    outputDetailOptions.find(
                      (option) => option.value === settings.outputDetail,
                    )?.label
                  }
                </span>
                <span className={styles.cycleDots}>
                  {outputDetailOptions.map((option) => (
                    <span
                      key={option.value}
                      className={`${styles.cycleDot} ${!isDarkMode ? styles.light : ""} ${settings.outputDetail === option.value ? styles.active : ""}`}
                    />
                  ))}
                </span>
              </button>
            </div>

            <div
              className={`${styles.settingsRow} ${styles.settingsRowMarginTop} ${!isDevMode ? styles.settingsRowDisabled : ""}`}
            >
              <div
                className={`${styles.settingsLabel} ${!isDarkMode ? styles.light : ""}`}
              >
                React Components
                <TooltipPortal
                  content={
                    !isDevMode
                      ? "Disabled — production builds minify component names, making detection unreliable. Use in development mode."
                      : "Include React component names in annotations"
                  }
                  isTransitioning={isTransitioning}
                >
                  <span className={styles.helpIcon}>
                    <IconHelp size={20} />
                  </span>
                </TooltipPortal>
              </div>
              <label
                className={`${styles.toggleSwitch} ${!isDevMode ? styles.disabled : ""}`}
              >
                <input
                  type="checkbox"
                  checked={isDevMode && settings.reactEnabled}
                  disabled={!isDevMode}
                  onChange={() =>
                    setSettings((currentSettings) => ({
                      ...currentSettings,
                      reactEnabled: !currentSettings.reactEnabled,
                    }))
                  }
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>

            <div className={`${styles.settingsRow} ${styles.settingsRowMarginTop}`}>
              <div
                className={`${styles.settingsLabel} ${!isDarkMode ? styles.light : ""}`}
              >
                Hide Until Restart
                <TooltipPortal
                  content="Hides the toolbar until you open a new tab"
                  isTransitioning={isTransitioning}
                >
                  <span className={styles.helpIcon}>
                    <IconHelp size={20} />
                  </span>
                </TooltipPortal>
              </div>
              <label className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  checked={false}
                  onChange={(event) => {
                    if (event.target.checked) {
                      hideToolbarTemporarily();
                    }
                  }}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
          </div>

          <div className={styles.settingsSection}>
            <div
              className={`${styles.settingsLabel} ${styles.settingsLabelMarker} ${!isDarkMode ? styles.light : ""}`}
            >
              Marker Colour
            </div>
            <div className={styles.colorOptions}>
              {colorOptions.map((color) => (
                <div
                  key={color.value}
                  role="button"
                  onClick={() =>
                    setSettings((currentSettings) => ({
                      ...currentSettings,
                      annotationColor: color.value,
                    }))
                  }
                  style={{
                    borderColor:
                      settings.annotationColor === color.value
                        ? color.value
                        : "transparent",
                  }}
                  className={`${styles.colorOptionRing} ${settings.annotationColor === color.value ? styles.selected : ""}`}
                >
                  <div
                    className={`${styles.colorOption} ${settings.annotationColor === color.value ? styles.selected : ""}`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.settingsSection}>
            <label className={styles.settingsToggle} htmlFor="autoClearAfterCopy">
              <input
                type="checkbox"
                id="autoClearAfterCopy"
                checked={settings.autoClearAfterCopy}
                onChange={(event) =>
                  setSettings((currentSettings) => ({
                    ...currentSettings,
                    autoClearAfterCopy: event.target.checked,
                  }))
                }
              />
              <span
                className={`${styles.customCheckbox} ${settings.autoClearAfterCopy ? styles.checked : ""}`}
              >
                {settings.autoClearAfterCopy && <IconCheckSmallAnimated size={14} />}
              </span>
              <span
                className={`${styles.toggleLabel} ${!isDarkMode ? styles.light : ""}`}
              >
                Clear on copy/send
                <TooltipPortal
                  content="Automatically clear annotations after copying"
                  isTransitioning={isTransitioning}
                >
                  <span className={`${styles.helpIcon} ${styles.helpIconNudge2}`}>
                    <IconHelp size={20} />
                  </span>
                </TooltipPortal>
              </span>
            </label>
            <label
              className={`${styles.settingsToggle} ${styles.settingsToggleMarginBottom}`}
              htmlFor="blockInteractions"
            >
              <input
                type="checkbox"
                id="blockInteractions"
                checked={settings.blockInteractions}
                onChange={(event) =>
                  setSettings((currentSettings) => ({
                    ...currentSettings,
                    blockInteractions: event.target.checked,
                  }))
                }
              />
              <span
                className={`${styles.customCheckbox} ${settings.blockInteractions ? styles.checked : ""}`}
              >
                {settings.blockInteractions && <IconCheckSmallAnimated size={14} />}
              </span>
              <span
                className={`${styles.toggleLabel} ${!isDarkMode ? styles.light : ""}`}
              >
                Block page interactions
              </span>
            </label>
          </div>

          <div
            className={`${styles.settingsSection} ${styles.settingsSectionExtraPadding}`}
          >
            <button
              className={`${styles.settingsNavLink} ${!isDarkMode ? styles.light : ""}`}
              onClick={() => setSettingsPage("automations")}
            >
              <span>Manage Connections</span>
              <span className={styles.settingsNavLinkRight}>
                {resolvedEndpoint && (
                  <span
                    className={`${styles.serverNavIndicator} ${styles[connectionStatus]}`}
                  />
                )}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.5 12.5L12 8L7.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>

        <div
          className={`${styles.settingsPage} ${styles.automationsPage} ${settingsPage === "automations" ? styles.slideIn : ""}`}
        >
          <button
            className={`${styles.settingsBackButton} ${!isDarkMode ? styles.light : ""}`}
            onClick={() => setSettingsPage("main")}
          >
            <IconChevronLeft size={16} />
            <span>Manage Connections</span>
          </button>

          <div className={styles.settingsSection}>
            <div className={styles.settingsRow}>
              <span
                className={`${styles.automationHeader} ${!isDarkMode ? styles.light : ""}`}
              >
                Server Connection
                <TooltipPortal
                  content="Connect to an Agentation server to let AI agents like Claude Code receive annotations in real-time."
                  isTransitioning={isTransitioning}
                >
                  <span
                    className={`${styles.helpIcon} ${styles.helpIconNudgeDown}`}
                  >
                    <IconHelp size={20} />
                  </span>
                </TooltipPortal>
              </span>
              {resolvedEndpoint && (
                <div
                  className={`${styles.serverStatusDot} ${styles[connectionStatus]}`}
                  title={
                    connectionStatus === "connected"
                      ? "Connected"
                      : connectionStatus === "connecting"
                        ? "Connecting..."
                        : "Disconnected"
                  }
                />
              )}
            </div>
            <p
              className={`${styles.automationDescription} ${!isDarkMode ? styles.light : ""}`}
              style={{ paddingBottom: 6 }}
            >
              Server connection allows agents to receive and act on annotations.{" "}
              <a
                href="https://agentation.dev/server"
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.learnMoreLink} ${!isDarkMode ? styles.light : ""}`}
              >
                Learn more
              </a>
            </p>

            {componentEditor === "neovim" && (
              <>
                <div className={styles.settingsRow}>
                  <span
                    className={`${styles.automationHeader} ${!isDarkMode ? styles.light : ""}`}
                  >
                    Neovim Bridge
                  </span>
                  <div
                    className={`${styles.serverStatusDot} ${styles[neovimConnectionStatus]}`}
                    title={
                      neovimConnectionStatus === "connected"
                        ? "Connected"
                        : neovimConnectionStatus === "connecting"
                          ? "Connecting..."
                          : "Disconnected"
                    }
                  />
                </div>
                <p
                  className={`${styles.automationDescription} ${!isDarkMode ? styles.light : ""}`}
                  style={{ paddingBottom: 6 }}
                >
                  {neovimConnectionStatus === "connected"
                    ? "Web page connected to Neovim."
                    : neovimConnectionStatus === "connecting"
                      ? "Connecting to Neovim bridge..."
                      : "Neovim bridge not detected."}
                </p>
              </>
            )}
          </div>

          <div className={`${styles.settingsSection} ${styles.settingsSectionGrow}`}>
            <div className={styles.settingsRow}>
              <span
                className={`${styles.automationHeader} ${!isDarkMode ? styles.light : ""}`}
              >
                Webhooks
                <TooltipPortal
                  content="Send annotation data to any URL endpoint when annotations change. Useful for custom integrations."
                  isTransitioning={isTransitioning}
                >
                  <span className={`${styles.helpIcon} ${styles.helpIconNoNudge}`}>
                    <IconHelp size={20} />
                  </span>
                </TooltipPortal>
              </span>
              <div className={styles.autoSendRow}>
                <span
                  className={`${styles.autoSendLabel} ${!isDarkMode ? styles.light : ""} ${settings.webhooksEnabled ? styles.active : ""}`}
                >
                  Auto-Send
                </span>
                <label
                  className={`${styles.toggleSwitch} ${!settings.webhookUrl ? styles.disabled : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={settings.webhooksEnabled}
                    disabled={!settings.webhookUrl}
                    onChange={() =>
                      setSettings((currentSettings) => ({
                        ...currentSettings,
                        webhooksEnabled: !currentSettings.webhooksEnabled,
                      }))
                    }
                  />
                  <span className={styles.toggleSlider} />
                </label>
              </div>
            </div>
            <p
              className={`${styles.automationDescription} ${!isDarkMode ? styles.light : ""}`}
            >
              The webhook URL will receive live annotation changes and annotation
              data.
            </p>
            <textarea
              className={`${styles.webhookUrlInput} ${!isDarkMode ? styles.light : ""}`}
              placeholder="Webhook URL"
              value={settings.webhookUrl}
              style={{
                "--marker-color": settings.annotationColor,
              } as CSSProperties}
              onKeyDown={(event) => event.stopPropagation()}
              onChange={(event) =>
                setSettings((currentSettings) => ({
                  ...currentSettings,
                  webhookUrl: event.target.value,
                }))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
