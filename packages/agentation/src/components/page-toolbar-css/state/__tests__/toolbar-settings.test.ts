import { describe, expect, it } from "vitest";

import {
  DEFAULT_TOOLBAR_SETTINGS,
  parseToolbarPosition,
  parseToolbarSettings,
  parseToolbarTheme,
  serializeToolbarPosition,
  serializeToolbarSettings,
  serializeToolbarTheme,
} from "../toolbar-settings";

describe("parseToolbarSettings", () => {
  it("returns defaults when storage value is null", () => {
    expect(parseToolbarSettings(null)).toEqual(DEFAULT_TOOLBAR_SETTINGS);
  });

  it("returns defaults when storage value is invalid json", () => {
    expect(parseToolbarSettings("{invalid")).toEqual(DEFAULT_TOOLBAR_SETTINGS);
  });

  it("merges valid persisted values with defaults", () => {
    const parsed = parseToolbarSettings(
      JSON.stringify({
        outputDetail: "forensic",
        autoClearAfterCopy: true,
        annotationColor: "#ff0000",
        blockInteractions: false,
        reactEnabled: false,
        markerClickBehavior: "delete",
        webhookUrl: "https://example.com/hook",
        webhooksEnabled: false,
      }),
    );

    expect(parsed).toEqual({
      outputDetail: "forensic",
      autoClearAfterCopy: true,
      annotationColor: "#ff0000",
      blockInteractions: false,
      reactEnabled: false,
      markerClickBehavior: "delete",
      webhookUrl: "https://example.com/hook",
      webhooksEnabled: false,
    });
  });

  it("falls back to defaults for invalid field types", () => {
    const parsed = parseToolbarSettings(
      JSON.stringify({
        outputDetail: "invalid",
        autoClearAfterCopy: "yes",
        annotationColor: 1,
        blockInteractions: "no",
        reactEnabled: "no",
        markerClickBehavior: "invalid",
        webhookUrl: 1,
        webhooksEnabled: "no",
      }),
    );

    expect(parsed).toEqual(DEFAULT_TOOLBAR_SETTINGS);
  });
});

describe("serializeToolbarSettings", () => {
  it("serializes settings as stable json", () => {
    const serialized = serializeToolbarSettings(DEFAULT_TOOLBAR_SETTINGS);
    expect(serialized).toMatchInlineSnapshot(
      `"{\"outputDetail\":\"standard\",\"autoClearAfterCopy\":false,\"annotationColor\":\"#3c82f7\",\"blockInteractions\":true,\"reactEnabled\":true,\"markerClickBehavior\":\"edit\",\"webhookUrl\":\"\",\"webhooksEnabled\":true}"`,
    );
  });
});

describe("toolbar theme persistence", () => {
  it("parses dark theme", () => {
    expect(parseToolbarTheme("dark")).toBe(true);
  });

  it("parses light theme", () => {
    expect(parseToolbarTheme("light")).toBe(false);
  });

  it("defaults to dark for unknown theme", () => {
    expect(parseToolbarTheme("system")).toBe(true);
  });

  it("serializes dark theme", () => {
    expect(serializeToolbarTheme(true)).toBe("dark");
  });

  it("serializes light theme", () => {
    expect(serializeToolbarTheme(false)).toBe("light");
  });
});

describe("toolbar position persistence", () => {
  it("returns null when position is missing", () => {
    expect(parseToolbarPosition(null)).toBeNull();
  });

  it("returns null when position json is invalid", () => {
    expect(parseToolbarPosition("{invalid")).toBeNull();
  });

  it("returns null when position values are invalid", () => {
    expect(parseToolbarPosition(JSON.stringify({ x: "10", y: 20 }))).toBeNull();
  });

  it("parses valid toolbar position", () => {
    expect(parseToolbarPosition(JSON.stringify({ x: 10, y: 20 }))).toEqual({ x: 10, y: 20 });
  });

  it("serializes toolbar position", () => {
    expect(serializeToolbarPosition({ x: 10, y: 20 })).toBe('{"x":10,"y":20}');
  });
});
