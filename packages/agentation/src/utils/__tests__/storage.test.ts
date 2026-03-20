/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  getStorageKey,
  loadAnnotations,
  saveAnnotations,
  clearAnnotations,
  loadAllAnnotations,
  saveAnnotationsWithSyncMarker,
  getUnsyncedAnnotations,
  clearSyncMarkers,
  getSessionStorageKey,
  loadSessionId,
  saveSessionId,
  clearSessionId,
  loadToolbarHidden,
  saveToolbarHidden,
} from "../storage";
import type { Annotation } from "../../types";

function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: "ann-1",
    x: 50,
    y: 100,
    comment: "test comment",
    element: "button",
    elementPath: "div > button",
    timestamp: Date.now(),
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// =============================================================================
// Key generation
// =============================================================================

describe("getStorageKey", () => {
  it("prefixes pathname with storage prefix", () => {
    expect(getStorageKey("/home")).toBe("feedback-annotations-/home");
  });

  it("handles empty pathname", () => {
    expect(getStorageKey("")).toBe("feedback-annotations-");
  });

  it("preserves complex pathnames", () => {
    expect(getStorageKey("/app/settings?tab=2")).toBe(
      "feedback-annotations-/app/settings?tab=2"
    );
  });
});

describe("getSessionStorageKey", () => {
  it("prefixes pathname with session prefix", () => {
    expect(getSessionStorageKey("/home")).toBe("agentation-session-/home");
  });
});

// =============================================================================
// Annotation CRUD — uses real localStorage
// =============================================================================

describe("saveAnnotations + loadAnnotations", () => {
  it("round-trips annotations through localStorage", () => {
    const annotations = [makeAnnotation({ id: "a" }), makeAnnotation({ id: "b" })];
    saveAnnotations("/page", annotations);
    const loaded = loadAnnotations("/page");
    expect(loaded).toHaveLength(2);
    expect(loaded[0].id).toBe("a");
    expect(loaded[1].id).toBe("b");
  });

  it("returns empty array when nothing stored", () => {
    expect(loadAnnotations("/empty")).toEqual([]);
  });

  it("returns empty array for malformed JSON", () => {
    localStorage.setItem(getStorageKey("/bad"), "not-json{{{");
    expect(loadAnnotations("/bad")).toEqual([]);
  });

  it("filters out annotations older than 7 days", () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    const recent = makeAnnotation({ id: "recent", timestamp: Date.now() });
    const old = makeAnnotation({ id: "old", timestamp: eightDaysAgo });
    saveAnnotations("/page", [recent, old]);
    const loaded = loadAnnotations("/page");
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe("recent");
  });

  it("keeps annotations without a timestamp (no timestamp means no expiry)", () => {
    const noTs = makeAnnotation({ id: "no-ts" });
    delete (noTs as any).timestamp;
    saveAnnotations("/page", [noTs]);
    const loaded = loadAnnotations("/page");
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe("no-ts");
  });

  it("survives localStorage quota exceeded on save", () => {
    // Fill localStorage to capacity using a large value
    const huge = "x".repeat(5 * 1024 * 1024);
    try {
      localStorage.setItem("filler", huge);
    } catch {
      // already full or quota limit varies
    }
    // saveAnnotations should not throw even if storage is full
    expect(() => saveAnnotations("/page", [makeAnnotation()])).not.toThrow();
  });
});

describe("clearAnnotations", () => {
  it("removes stored annotations for a pathname", () => {
    saveAnnotations("/page", [makeAnnotation()]);
    expect(loadAnnotations("/page")).toHaveLength(1);
    clearAnnotations("/page");
    expect(loadAnnotations("/page")).toEqual([]);
  });

  it("does not affect other pathnames", () => {
    saveAnnotations("/a", [makeAnnotation({ id: "a" })]);
    saveAnnotations("/b", [makeAnnotation({ id: "b" })]);
    clearAnnotations("/a");
    expect(loadAnnotations("/b")).toHaveLength(1);
  });
});

// =============================================================================
// loadAllAnnotations
// =============================================================================

describe("loadAllAnnotations", () => {
  it("returns annotations from all pages keyed by pathname", () => {
    saveAnnotations("/page1", [makeAnnotation({ id: "p1" })]);
    saveAnnotations("/page2", [makeAnnotation({ id: "p2" })]);
    const all = loadAllAnnotations();
    expect(all.size).toBe(2);
    expect(all.get("/page1")?.[0].id).toBe("p1");
    expect(all.get("/page2")?.[0].id).toBe("p2");
  });

  it("ignores non-annotation localStorage keys", () => {
    localStorage.setItem("unrelated-key", "value");
    saveAnnotations("/page", [makeAnnotation()]);
    const all = loadAllAnnotations();
    expect(all.size).toBe(1);
    expect(all.has("/page")).toBe(true);
  });

  it("filters out expired annotations and omits empty pages", () => {
    const expired = makeAnnotation({
      id: "old",
      timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000,
    });
    saveAnnotations("/stale", [expired]);
    const all = loadAllAnnotations();
    expect(all.has("/stale")).toBe(false);
  });
});

// =============================================================================
// Sync marker utilities
// =============================================================================

describe("saveAnnotationsWithSyncMarker", () => {
  it("adds _syncedTo field to every annotation", () => {
    const annotations = [makeAnnotation({ id: "a" }), makeAnnotation({ id: "b" })];
    saveAnnotationsWithSyncMarker("/page", annotations, "session-123");
    const raw = JSON.parse(localStorage.getItem(getStorageKey("/page"))!);
    expect(raw[0]._syncedTo).toBe("session-123");
    expect(raw[1]._syncedTo).toBe("session-123");
  });

  it("does not mutate the original annotations array", () => {
    const annotations = [makeAnnotation({ id: "a" })];
    saveAnnotationsWithSyncMarker("/page", annotations, "s1");
    expect((annotations[0] as any)._syncedTo).toBeUndefined();
  });
});

describe("getUnsyncedAnnotations", () => {
  it("returns annotations that have no sync marker", () => {
    saveAnnotations("/page", [makeAnnotation({ id: "unsynced" })]);
    const unsynced = getUnsyncedAnnotations("/page");
    expect(unsynced).toHaveLength(1);
    expect(unsynced[0].id).toBe("unsynced");
  });

  it("excludes annotations already synced to the given session", () => {
    saveAnnotationsWithSyncMarker("/page", [makeAnnotation({ id: "synced" })], "s1");
    const unsynced = getUnsyncedAnnotations("/page", "s1");
    expect(unsynced).toHaveLength(0);
  });

  it("includes annotations synced to a different session", () => {
    saveAnnotationsWithSyncMarker("/page", [makeAnnotation({ id: "synced" })], "s1");
    const unsynced = getUnsyncedAnnotations("/page", "s2");
    expect(unsynced).toHaveLength(1);
    expect(unsynced[0].id).toBe("synced");
  });

  it("with no sessionId, returns only annotations without any marker", () => {
    const markedRaw = { ...makeAnnotation({ id: "marked" }), _syncedTo: "s1" };
    const unmarked = makeAnnotation({ id: "unmarked" });
    saveAnnotations("/page", [markedRaw, unmarked]);
    const unsynced = getUnsyncedAnnotations("/page");
    expect(unsynced).toHaveLength(1);
    expect(unsynced[0].id).toBe("unmarked");
  });
});

describe("clearSyncMarkers", () => {
  it("strips _syncedTo from all annotations", () => {
    saveAnnotationsWithSyncMarker(
      "/page",
      [makeAnnotation({ id: "a" }), makeAnnotation({ id: "b" })],
      "s1"
    );
    clearSyncMarkers("/page");
    const raw = JSON.parse(localStorage.getItem(getStorageKey("/page"))!);
    expect(raw[0]._syncedTo).toBeUndefined();
    expect(raw[1]._syncedTo).toBeUndefined();
  });

  it("preserves all other annotation fields", () => {
    const annotation = makeAnnotation({ id: "a", comment: "keep me" });
    saveAnnotationsWithSyncMarker("/page", [annotation], "s1");
    clearSyncMarkers("/page");
    const loaded = loadAnnotations("/page");
    expect(loaded[0].comment).toBe("keep me");
    expect(loaded[0].id).toBe("a");
  });
});

// =============================================================================
// Session ID storage
// =============================================================================

describe("session ID persistence", () => {
  it("saves and loads session ID", () => {
    saveSessionId("/page", "sess-abc");
    expect(loadSessionId("/page")).toBe("sess-abc");
  });

  it("returns null when no session stored", () => {
    expect(loadSessionId("/unknown")).toBeNull();
  });

  it("clears session ID", () => {
    saveSessionId("/page", "sess-abc");
    clearSessionId("/page");
    expect(loadSessionId("/page")).toBeNull();
  });

  it("isolates session IDs per pathname", () => {
    saveSessionId("/a", "sess-a");
    saveSessionId("/b", "sess-b");
    expect(loadSessionId("/a")).toBe("sess-a");
    expect(loadSessionId("/b")).toBe("sess-b");
  });
});

// =============================================================================
// Toolbar visibility (sessionStorage)
// =============================================================================

describe("toolbar hidden state", () => {
  it("defaults to false when nothing stored", () => {
    expect(loadToolbarHidden()).toBe(false);
  });

  it("returns true after saving hidden=true", () => {
    saveToolbarHidden(true);
    expect(loadToolbarHidden()).toBe(true);
  });

  it("returns false after saving hidden=false (removes key)", () => {
    saveToolbarHidden(true);
    saveToolbarHidden(false);
    expect(loadToolbarHidden()).toBe(false);
    // Verify key is actually removed, not just set to "0"
    expect(sessionStorage.getItem("agentation-session-toolbar-hidden")).toBeNull();
  });

  it("uses sessionStorage, not localStorage", () => {
    saveToolbarHidden(true);
    // Verify nothing leaked to localStorage
    expect(localStorage.length).toBe(0);
    // Verify it's in sessionStorage
    expect(sessionStorage.length).toBe(1);
  });
});
