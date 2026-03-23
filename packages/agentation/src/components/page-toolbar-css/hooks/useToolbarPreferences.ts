import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import {
  DEFAULT_TOOLBAR_SETTINGS,
  parseToolbarPosition,
  parseToolbarSettings,
  parseToolbarTheme,
  serializeToolbarSettings,
  serializeToolbarTheme,
  TOOLBAR_POSITION_STORAGE_KEY,
  TOOLBAR_SETTINGS_STORAGE_KEY,
  TOOLBAR_THEME_STORAGE_KEY,
  type ToolbarSettings,
} from "../state/toolbar-settings";
import { originalSetTimeout } from "../../../utils/freeze-animations";

let hasPlayedEntranceAnimation = false;

function getLocalStorageItem(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setLocalStorageItem(key: string, value: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // localStorage may be unavailable or blocked
  }
}

type UseToolbarPreferencesParams = {
  pathname: string;
};

type UseToolbarPreferencesResult = {
  settings: ToolbarSettings;
  setSettings: Dispatch<SetStateAction<ToolbarSettings>>;
  isDarkMode: boolean;
  setIsDarkMode: Dispatch<SetStateAction<boolean>>;
  toolbarPosition: { x: number; y: number } | null;
  setToolbarPosition: Dispatch<SetStateAction<{ x: number; y: number } | null>>;
  mounted: boolean;
  showEntranceAnimation: boolean;
};

export function useToolbarPreferences({
  pathname,
}: UseToolbarPreferencesParams): UseToolbarPreferencesResult {
  const [settings, setSettings] = useState<ToolbarSettings>(
    DEFAULT_TOOLBAR_SETTINGS,
  );
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [toolbarPosition, setToolbarPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showEntranceAnimation, setShowEntranceAnimation] = useState(false);

  useEffect(() => {
    setMounted(true);

    let entranceTimer: number | null = null;
    if (!hasPlayedEntranceAnimation) {
      setShowEntranceAnimation(true);
      hasPlayedEntranceAnimation = true;
      entranceTimer = originalSetTimeout(() => {
        setShowEntranceAnimation(false);
      }, 750);
    }

    const storedSettings = getLocalStorageItem(TOOLBAR_SETTINGS_STORAGE_KEY);
    setSettings(parseToolbarSettings(storedSettings));

    const savedTheme = getLocalStorageItem(TOOLBAR_THEME_STORAGE_KEY);
    setIsDarkMode(parseToolbarTheme(savedTheme));

    const savedPosition = getLocalStorageItem(TOOLBAR_POSITION_STORAGE_KEY);
    setToolbarPosition(parseToolbarPosition(savedPosition));

    return () => {
      if (entranceTimer !== null) {
        window.clearTimeout(entranceTimer);
      }
    };
  }, [pathname]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    setLocalStorageItem(
      TOOLBAR_SETTINGS_STORAGE_KEY,
      serializeToolbarSettings(settings),
    );
  }, [settings, mounted]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    setLocalStorageItem(
      TOOLBAR_THEME_STORAGE_KEY,
      serializeToolbarTheme(isDarkMode),
    );
  }, [isDarkMode, mounted]);

  return {
    settings,
    setSettings,
    isDarkMode,
    setIsDarkMode,
    toolbarPosition,
    setToolbarPosition,
    mounted,
    showEntranceAnimation,
  };
}
