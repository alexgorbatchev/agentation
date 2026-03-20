export type OutputDetailLevel = "compact" | "standard" | "detailed" | "forensic";

export type MarkerClickBehavior = "edit" | "delete";

export type ToolbarSettings = {
  outputDetail: OutputDetailLevel;
  autoClearAfterCopy: boolean;
  annotationColor: string;
  blockInteractions: boolean;
  reactEnabled: boolean;
  markerClickBehavior: MarkerClickBehavior;
  webhookUrl: string;
  webhooksEnabled: boolean;
};

export type ToolbarPosition = {
  x: number;
  y: number;
};

export const TOOLBAR_SETTINGS_STORAGE_KEY = "feedback-toolbar-settings";
export const TOOLBAR_THEME_STORAGE_KEY = "feedback-toolbar-theme";
export const TOOLBAR_POSITION_STORAGE_KEY = "feedback-toolbar-position";

export const DEFAULT_TOOLBAR_SETTINGS: ToolbarSettings = {
  outputDetail: "standard",
  autoClearAfterCopy: false,
  annotationColor: "#3c82f7",
  blockInteractions: true,
  reactEnabled: true,
  markerClickBehavior: "edit",
  webhookUrl: "",
  webhooksEnabled: true,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseOutputDetailLevel(value: unknown): OutputDetailLevel | null {
  if (
    value === "compact" ||
    value === "standard" ||
    value === "detailed" ||
    value === "forensic"
  ) {
    return value;
  }

  return null;
}

function parseMarkerClickBehavior(value: unknown): MarkerClickBehavior | null {
  if (value === "edit" || value === "delete") {
    return value;
  }

  return null;
}

export function parseToolbarSettings(raw: string | null): ToolbarSettings {
  if (!raw) {
    return { ...DEFAULT_TOOLBAR_SETTINGS };
  }

  try {
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return { ...DEFAULT_TOOLBAR_SETTINGS };
    }

    const outputDetail = parseOutputDetailLevel(parsed.outputDetail);
    const markerClickBehavior = parseMarkerClickBehavior(parsed.markerClickBehavior);

    return {
      outputDetail: outputDetail ?? DEFAULT_TOOLBAR_SETTINGS.outputDetail,
      autoClearAfterCopy:
        typeof parsed.autoClearAfterCopy === "boolean"
          ? parsed.autoClearAfterCopy
          : DEFAULT_TOOLBAR_SETTINGS.autoClearAfterCopy,
      annotationColor:
        typeof parsed.annotationColor === "string"
          ? parsed.annotationColor
          : DEFAULT_TOOLBAR_SETTINGS.annotationColor,
      blockInteractions:
        typeof parsed.blockInteractions === "boolean"
          ? parsed.blockInteractions
          : DEFAULT_TOOLBAR_SETTINGS.blockInteractions,
      reactEnabled:
        typeof parsed.reactEnabled === "boolean"
          ? parsed.reactEnabled
          : DEFAULT_TOOLBAR_SETTINGS.reactEnabled,
      markerClickBehavior:
        markerClickBehavior ?? DEFAULT_TOOLBAR_SETTINGS.markerClickBehavior,
      webhookUrl:
        typeof parsed.webhookUrl === "string"
          ? parsed.webhookUrl
          : DEFAULT_TOOLBAR_SETTINGS.webhookUrl,
      webhooksEnabled:
        typeof parsed.webhooksEnabled === "boolean"
          ? parsed.webhooksEnabled
          : DEFAULT_TOOLBAR_SETTINGS.webhooksEnabled,
    };
  } catch {
    return { ...DEFAULT_TOOLBAR_SETTINGS };
  }
}

export function serializeToolbarSettings(settings: ToolbarSettings): string {
  return JSON.stringify(settings);
}

export function parseToolbarTheme(rawTheme: string | null): boolean {
  if (rawTheme === "light") {
    return false;
  }

  if (rawTheme === "dark") {
    return true;
  }

  return true;
}

export function serializeToolbarTheme(isDarkMode: boolean): string {
  return isDarkMode ? "dark" : "light";
}

export function parseToolbarPosition(rawPosition: string | null): ToolbarPosition | null {
  if (!rawPosition) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawPosition);
    if (
      isRecord(parsed) &&
      typeof parsed.x === "number" &&
      Number.isFinite(parsed.x) &&
      typeof parsed.y === "number" &&
      Number.isFinite(parsed.y)
    ) {
      return { x: parsed.x, y: parsed.y };
    }

    return null;
  } catch {
    return null;
  }
}

export function serializeToolbarPosition(position: ToolbarPosition): string {
  return JSON.stringify(position);
}
