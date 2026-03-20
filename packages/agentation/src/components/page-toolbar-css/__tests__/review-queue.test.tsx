/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, waitFor, act } from "@testing-library/react";
import { PageFeedbackToolbarCSS } from "../index";
import type { Annotation } from "../../../types";
import {
  activateToolbar,
  findButtonByTooltip,
  makeAnnotation,
  resetPageToolbarTestEnvironment,
  seedAnnotations,
  stubLocalOnlyFetch,
} from "./pageToolbarTestUtils";

// ---------------------------------------------------------------------------
// Mock fetch for server connection
// ---------------------------------------------------------------------------

let fetchCalls: Array<{ url: string; method: string; body: any }>;

function setupServerMock(sessionAnnotations: Annotation[] = []) {
  fetchCalls = [];
  const mockFetch = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method || "GET";
    const body = init?.body ? JSON.parse(init.body as string) : undefined;
    fetchCalls.push({ url, method, body });

    if (url.includes("/health")) {
      return { ok: true, json: async () => ({}) };
    }
    if (url.includes("/sessions/") && method === "GET") {
      return {
        ok: true,
        json: async () => ({
          id: "session-1",
          annotations: sessionAnnotations,
        }),
      };
    }
    if (url.endsWith("/sessions") && method === "POST") {
      return {
        ok: true,
        json: async () => ({
          id: "session-1",
          annotations: sessionAnnotations,
        }),
      };
    }
    if (url.includes("/annotations") && method === "POST") {
      return {
        ok: true,
        json: async () => ({ ...(body || {}), id: body?.id || "server-id" }),
      };
    }
    if (method === "PATCH") {
      return { ok: true, json: async () => ({ ...body }) };
    }
    if (method === "DELETE") {
      return { ok: true, json: async () => ({}) };
    }
    return { ok: true, json: async () => ({}) };
  });
  vi.stubGlobal("fetch", mockFetch);
  vi.stubGlobal(
    "EventSource",
    class {
      addEventListener() {}
      removeEventListener() {}
      close() {}
    },
  );
  return mockFetch;
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

beforeEach(() => {
  stubLocalOnlyFetch();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  document.elementFromPoint = vi.fn().mockReturnValue(null);
  if (!document.elementsFromPoint) {
    (document as unknown as Record<string, unknown>).elementsFromPoint = vi
      .fn()
      .mockReturnValue([]);
  }
});

afterEach(() => {
  resetPageToolbarTestEnvironment();
});

// =============================================================================
// Resolved annotations stay visible
// =============================================================================

describe("resolved annotations stay visible as markers", () => {
  it("shows resolved annotations as markers alongside active ones", async () => {
    seedAnnotations([
      makeAnnotation({ id: "active-1", comment: "Active" }),
      makeAnnotation({ id: "resolved-1", comment: "Resolved", status: "resolved" }),
    ]);

    render(<PageFeedbackToolbarCSS />);
    await activateToolbar();

    await waitFor(() => {
      const markers = document.querySelectorAll("[data-annotation-marker]");
      expect(markers.length).toBe(2);
    });
  });

  it("shows dismissed annotations as markers alongside active ones", async () => {
    seedAnnotations([
      makeAnnotation({ id: "active-1", comment: "Active" }),
      makeAnnotation({ id: "dismissed-1", comment: "Dismissed", status: "dismissed" }),
    ]);

    render(<PageFeedbackToolbarCSS />);
    await activateToolbar();

    await waitFor(() => {
      const markers = document.querySelectorAll("[data-annotation-marker]");
      expect(markers.length).toBe(2);
    });
  });

  it("resolved markers have the resolved CSS class", async () => {
    seedAnnotations([
      makeAnnotation({ id: "resolved-1", status: "resolved" }),
    ]);

    render(<PageFeedbackToolbarCSS />);
    await activateToolbar();

    await waitFor(() => {
      const marker = document.querySelector("[data-annotation-marker]");
      expect(marker).toBeTruthy();
      expect(marker!.className).toContain("resolved");
    });
  });

  it("active annotation count badge excludes resolved annotations", async () => {
    seedAnnotations([
      makeAnnotation({ id: "active-1", comment: "Active" }),
      makeAnnotation({ id: "active-2", comment: "Active 2" }),
      makeAnnotation({ id: "resolved-1", comment: "Resolved", status: "resolved" }),
    ]);

    render(<PageFeedbackToolbarCSS />);

    // Before activating, the collapsed toolbar shows a badge
    await waitFor(() => {
      const badge = document.querySelector("[class*='badge']");
      expect(badge).toBeTruthy();
      // Should show 2 (active only), not 3
      expect(badge!.textContent).toBe("2");
    });
  });
});

// =============================================================================
// Review queue button visibility
// =============================================================================

describe("review queue button", () => {
  it("is disabled when there are no resolved annotations", async () => {
    seedAnnotations([
      makeAnnotation({ id: "active-1", comment: "Active" }),
    ]);

    render(<PageFeedbackToolbarCSS />);
    await activateToolbar();

    const reviewBtn = findButtonByTooltip("Review queue");
    expect(reviewBtn).toBeTruthy();
    expect(reviewBtn!.disabled).toBe(true);
  });

  it("is enabled when resolved annotations exist", async () => {
    seedAnnotations([
      makeAnnotation({ id: "resolved-1", status: "resolved" }),
    ]);

    render(<PageFeedbackToolbarCSS />);
    await activateToolbar();

    await waitFor(() => {
      const reviewBtn = findButtonByTooltip("Review queue");
      expect(reviewBtn).toBeTruthy();
      expect(reviewBtn!.disabled).toBe(false);
    });
  });

  it("shows unreviewed count badge on the button", async () => {
    seedAnnotations([
      makeAnnotation({ id: "resolved-1", status: "resolved" }),
      makeAnnotation({ id: "resolved-2", status: "dismissed" }),
    ]);

    render(<PageFeedbackToolbarCSS />);
    await activateToolbar();

    await waitFor(() => {
      const reviewBtn = findButtonByTooltip("Review queue");
      const badge = reviewBtn!.querySelector("[class*='buttonBadge']");
      expect(badge).toBeTruthy();
      expect(badge!.textContent).toBe("2");
    });
  });
});

// =============================================================================
// Review queue panel
// =============================================================================

describe("review queue panel", () => {
  it("opens when clicking the review queue button", async () => {
    seedAnnotations([
      makeAnnotation({ id: "resolved-1", comment: "Fix this", status: "resolved", element: "Header" }),
    ]);

    render(<PageFeedbackToolbarCSS />);
    await activateToolbar();

    await waitFor(() => {
      expect(findButtonByTooltip("Review queue")).toBeTruthy();
    });

    const reviewBtn = findButtonByTooltip("Review queue")!;
    fireEvent.click(reviewBtn);

    await waitFor(() => {
      const panel = document.querySelector("[class*='reviewQueuePanel']");
      expect(panel).toBeTruthy();
      expect(panel!.className).toContain("enter");
    });
  });

  it("shows annotation details in the panel", async () => {
    seedAnnotations([
      makeAnnotation({
        id: "resolved-1",
        comment: "Fix the button alignment",
        element: "SubmitButton",
        status: "resolved",
        thread: [
          { id: "t1", role: "agent", content: "Fixed the alignment issue.", timestamp: Date.now() },
        ],
      }),
    ]);

    render(<PageFeedbackToolbarCSS />);
    await activateToolbar();

    await waitFor(() => {
      expect(findButtonByTooltip("Review queue")).toBeTruthy();
    });

    fireEvent.click(findButtonByTooltip("Review queue")!);

    await waitFor(() => {
      const panel = document.querySelector("[class*='reviewQueuePanel']");
      expect(panel).toBeTruthy();
      // Shows element name
      expect(panel!.textContent).toContain("SubmitButton");
      // Shows original comment
      expect(panel!.textContent).toContain("Fix the button alignment");
      // Shows agent reply
      expect(panel!.textContent).toContain("Fixed the alignment issue.");
      // Shows status
      expect(panel!.textContent).toContain("resolved");
    });
  });

  it("displays review counter as reviewed/total", async () => {
    seedAnnotations([
      makeAnnotation({ id: "r1", status: "resolved" }),
      makeAnnotation({ id: "r2", status: "resolved" }),
      makeAnnotation({ id: "r3", status: "dismissed" }),
    ]);

    render(<PageFeedbackToolbarCSS />);
    await activateToolbar();

    await waitFor(() => {
      expect(findButtonByTooltip("Review queue")).toBeTruthy();
    });

    fireEvent.click(findButtonByTooltip("Review queue")!);

    await waitFor(() => {
      const counter = document.querySelector("[class*='reviewQueueCount']");
      expect(counter).toBeTruthy();
      expect(counter!.textContent).toBe("0/3");
    });
  });

  it("closes settings panel when opening review queue", async () => {
    seedAnnotations([
      makeAnnotation({ id: "resolved-1", status: "resolved" }),
    ]);

    render(<PageFeedbackToolbarCSS />);
    await activateToolbar();

    // Open settings first
    const settingsBtn = findButtonByTooltip("Settings")!;
    fireEvent.click(settingsBtn);

    await waitFor(() => {
      const settingsPanel = document.querySelector("[class*='settingsPanel']");
      expect(settingsPanel!.className).toContain("enter");
    });

    // Now open review queue
    const reviewBtn = findButtonByTooltip("Review queue")!;
    fireEvent.click(reviewBtn);

    await waitFor(() => {
      const settingsPanel = document.querySelector("[class*='settingsPanel']");
      // Settings should be exiting
      expect(settingsPanel!.className).toContain("exit");
      const reviewPanel = document.querySelector("[class*='reviewQueuePanel']");
      expect(reviewPanel!.className).toContain("enter");
    });
  });
});

// =============================================================================
// Checking off reviewed items
// =============================================================================

describe("reviewing annotations", () => {
  it("can check off an annotation as reviewed", async () => {
    seedAnnotations([
      makeAnnotation({ id: "r1", comment: "Review me", status: "resolved" }),
    ]);

    render(<PageFeedbackToolbarCSS />);
    await activateToolbar();

    await waitFor(() => {
      expect(findButtonByTooltip("Review queue")).toBeTruthy();
    });

    fireEvent.click(findButtonByTooltip("Review queue")!);

    await waitFor(() => {
      const panel = document.querySelector("[class*='reviewQueuePanel']");
      expect(panel).toBeTruthy();
    });

    // Click the checkbox
    const checkbox = document.querySelector(
      "[class*='reviewQueuePanel'] input[type='checkbox']",
    ) as HTMLInputElement;
    expect(checkbox).toBeTruthy();
    fireEvent.click(checkbox.closest("label")!);

    // Counter should update
    await waitFor(() => {
      const counter = document.querySelector("[class*='reviewQueueCount']");
      expect(counter!.textContent).toBe("1/1");
    });
  });

  it("can uncheck a reviewed annotation", async () => {
    seedAnnotations([
      makeAnnotation({ id: "r1", comment: "Review me", status: "resolved" }),
    ]);

    render(<PageFeedbackToolbarCSS />);
    await activateToolbar();

    await waitFor(() => {
      expect(findButtonByTooltip("Review queue")).toBeTruthy();
    });

    fireEvent.click(findButtonByTooltip("Review queue")!);

    await waitFor(() => {
      expect(
        document.querySelector("[class*='reviewQueuePanel']"),
      ).toBeTruthy();
    });

    const label = document.querySelector(
      "[class*='reviewQueueItem']",
    ) as HTMLLabelElement;

    // Check
    fireEvent.click(label);

    await waitFor(() => {
      const counter = document.querySelector("[class*='reviewQueueCount']");
      expect(counter!.textContent).toBe("1/1");
    });

    // Uncheck
    fireEvent.click(label);

    await waitFor(() => {
      const counter = document.querySelector("[class*='reviewQueueCount']");
      expect(counter!.textContent).toBe("0/1");
    });
  });

  it("reviewed markers get the reviewed CSS class", async () => {
    seedAnnotations([
      makeAnnotation({ id: "r1", status: "resolved" }),
    ]);

    render(<PageFeedbackToolbarCSS />);
    await activateToolbar();

    await waitFor(() => {
      expect(findButtonByTooltip("Review queue")).toBeTruthy();
    });

    fireEvent.click(findButtonByTooltip("Review queue")!);

    await waitFor(() => {
      expect(
        document.querySelector("[class*='reviewQueuePanel']"),
      ).toBeTruthy();
    });

    // Check off the item
    const label = document.querySelector(
      "[class*='reviewQueueItem']",
    ) as HTMLLabelElement;
    fireEvent.click(label);

    // The resolved marker should now also have .reviewed class
    await waitFor(() => {
      const marker = document.querySelector(
        "[data-annotation-marker][class*='resolved']",
      );
      expect(marker).toBeTruthy();
      expect(marker!.className).toContain("reviewed");
    });
  });
});

// =============================================================================
// Select All and Clear Selected
// =============================================================================

describe("Select All and Clear Selected", () => {
  it("Select All checks all items at once", async () => {
    seedAnnotations([
      makeAnnotation({ id: "r1", comment: "First", status: "resolved" }),
      makeAnnotation({ id: "r2", comment: "Second", status: "dismissed" }),
    ]);

    render(<PageFeedbackToolbarCSS />);
    await activateToolbar();

    await waitFor(() => {
      expect(findButtonByTooltip("Review queue")).toBeTruthy();
    });

    fireEvent.click(findButtonByTooltip("Review queue")!);

    await waitFor(() => {
      expect(
        document.querySelector("[class*='reviewQueuePanel']"),
      ).toBeTruthy();
    });

    // Click Select All
    const buttons = document.querySelectorAll(
      "[class*='reviewQueueFooter'] button",
    );
    const selectAllBtn = [...buttons].find(
      (b) => b.textContent === "Select All",
    )!;
    fireEvent.click(selectAllBtn);

    await waitFor(() => {
      const counter = document.querySelector("[class*='reviewQueueCount']");
      expect(counter!.textContent).toBe("2/2");
    });
  });

  it("Select All is disabled when all items are already checked", async () => {
    seedAnnotations([
      makeAnnotation({ id: "r1", status: "resolved" }),
    ]);

    render(<PageFeedbackToolbarCSS />);
    await activateToolbar();

    await waitFor(() => {
      expect(findButtonByTooltip("Review queue")).toBeTruthy();
    });

    fireEvent.click(findButtonByTooltip("Review queue")!);

    await waitFor(() => {
      expect(
        document.querySelector("[class*='reviewQueuePanel']"),
      ).toBeTruthy();
    });

    // Check the item manually
    const label = document.querySelector(
      "[class*='reviewQueueItem']",
    ) as HTMLLabelElement;
    fireEvent.click(label);

    await waitFor(() => {
      const buttons = document.querySelectorAll(
        "[class*='reviewQueueFooter'] button",
      );
      const selectAllBtn = [...buttons].find(
        (b) => b.textContent === "Select All",
      ) as HTMLButtonElement;
      expect(selectAllBtn.disabled).toBe(true);
    });
  });

  it("Clear Selected is disabled when nothing is checked", async () => {
    seedAnnotations([
      makeAnnotation({ id: "r1", status: "resolved" }),
    ]);

    render(<PageFeedbackToolbarCSS />);
    await activateToolbar();

    await waitFor(() => {
      expect(findButtonByTooltip("Review queue")).toBeTruthy();
    });

    fireEvent.click(findButtonByTooltip("Review queue")!);

    await waitFor(() => {
      const buttons = document.querySelectorAll(
        "[class*='reviewQueueFooter'] button",
      );
      const clearBtn = [...buttons].find(
        (b) => b.textContent === "Clear Selected",
      ) as HTMLButtonElement;
      expect(clearBtn.disabled).toBe(true);
    });
  });

  it("Clear Selected removes checked items from the panel and markers", async () => {
    seedAnnotations([
      makeAnnotation({ id: "active-1", comment: "Still active" }),
      makeAnnotation({ id: "r1", comment: "Resolved one", status: "resolved" }),
      makeAnnotation({ id: "r2", comment: "Resolved two", status: "resolved" }),
    ]);

    render(<PageFeedbackToolbarCSS />);
    await activateToolbar();

    // 3 markers total (1 active + 2 resolved)
    await waitFor(() => {
      expect(
        document.querySelectorAll("[data-annotation-marker]").length,
      ).toBe(3);
    });

    fireEvent.click(findButtonByTooltip("Review queue")!);

    await waitFor(() => {
      expect(
        document.querySelector("[class*='reviewQueuePanel']"),
      ).toBeTruthy();
    });

    // Select All then Clear
    const buttons = document.querySelectorAll(
      "[class*='reviewQueueFooter'] button",
    );
    const selectAllBtn = [...buttons].find(
      (b) => b.textContent === "Select All",
    )!;
    const clearBtn = [...buttons].find(
      (b) => b.textContent === "Clear Selected",
    )!;

    fireEvent.click(selectAllBtn);

    await waitFor(() => {
      expect((clearBtn as HTMLButtonElement).disabled).toBe(false);
    });

    fireEvent.click(clearBtn);

    // Only the active marker should remain
    await waitFor(() => {
      expect(
        document.querySelectorAll("[data-annotation-marker]").length,
      ).toBe(1);
    });
  });

  it("Clear Selected only removes checked items, not unchecked ones", async () => {
    seedAnnotations([
      makeAnnotation({ id: "r1", comment: "Check me", status: "resolved" }),
      makeAnnotation({ id: "r2", comment: "Leave me", status: "resolved" }),
    ]);

    render(<PageFeedbackToolbarCSS />);
    await activateToolbar();

    await waitFor(() => {
      expect(
        document.querySelectorAll("[data-annotation-marker]").length,
      ).toBe(2);
    });

    fireEvent.click(findButtonByTooltip("Review queue")!);

    await waitFor(() => {
      expect(
        document.querySelector("[class*='reviewQueuePanel']"),
      ).toBeTruthy();
    });

    // Check only the first item
    const labels = document.querySelectorAll("[class*='reviewQueueItem']");
    fireEvent.click(labels[0]);

    await waitFor(() => {
      const counter = document.querySelector("[class*='reviewQueueCount']");
      expect(counter!.textContent).toBe("1/2");
    });

    // Clear
    const buttons = document.querySelectorAll(
      "[class*='reviewQueueFooter'] button",
    );
    const clearBtn = [...buttons].find(
      (b) => b.textContent === "Clear Selected",
    )!;
    fireEvent.click(clearBtn);

    // One resolved marker should remain
    await waitFor(() => {
      expect(
        document.querySelectorAll("[data-annotation-marker]").length,
      ).toBe(1);
    });
  });
});

// =============================================================================
// Clear Selected deletes from server
// =============================================================================

describe("Clear Selected deletes from server", () => {
  it("sends DELETE requests to server for cleared annotations", async () => {
    const resolved1 = makeAnnotation({ id: "r1", status: "resolved" });
    const resolved2 = makeAnnotation({ id: "r2", status: "dismissed" });
    const mockFetch = setupServerMock([resolved1, resolved2]);
    seedAnnotations([resolved1, resolved2]);

    render(
      <PageFeedbackToolbarCSS
        endpoint="http://test-server"
        sessionId="session-1"
      />,
    );

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    await activateToolbar();

    await waitFor(() => {
      expect(findButtonByTooltip("Review queue")).toBeTruthy();
    });

    fireEvent.click(findButtonByTooltip("Review queue")!);

    await waitFor(() => {
      expect(
        document.querySelector("[class*='reviewQueuePanel']"),
      ).toBeTruthy();
    });

    // Select All then Clear
    const buttons = document.querySelectorAll(
      "[class*='reviewQueueFooter'] button",
    );
    fireEvent.click([...buttons].find((b) => b.textContent === "Select All")!);

    await waitFor(() => {
      expect(
        ([...buttons].find((b) => b.textContent === "Clear Selected") as HTMLButtonElement).disabled,
      ).toBe(false);
    });

    // Clear fetchCalls to isolate DELETE calls
    fetchCalls.length = 0;

    fireEvent.click(
      [...buttons].find((b) => b.textContent === "Clear Selected")!,
    );

    await waitFor(() => {
      const deleteCalls = fetchCalls.filter((c) => c.method === "DELETE");
      expect(deleteCalls.length).toBe(2);
      const deletedUrls = deleteCalls.map((c) => c.url);
      expect(deletedUrls).toContain("http://test-server/annotations/r1");
      expect(deletedUrls).toContain("http://test-server/annotations/r2");
    });
  });
});

// =============================================================================
// SSE resolution keeps annotation visible
// =============================================================================

describe("SSE annotation.resolved keeps annotation visible", () => {
  // Mock EventSource that captures listeners
  type SSEListener = (e: MessageEvent) => void;
  let sseListeners: Record<string, SSEListener[]>;

  class MockEventSource {
    addEventListener(event: string, handler: SSEListener) {
      if (!sseListeners[event]) sseListeners[event] = [];
      sseListeners[event].push(handler);
    }
    removeEventListener(event: string, handler: SSEListener) {
      if (sseListeners[event]) {
        sseListeners[event] = sseListeners[event].filter((h) => h !== handler);
      }
    }
    close() {}
  }

  function emitSSE(event: string, payload: unknown) {
    for (const listener of sseListeners[event] || []) {
      listener(
        new MessageEvent("message", {
          data: JSON.stringify({ payload }),
        }),
      );
    }
  }

  function setupServerMockWithSSE(sessionAnnotations: Annotation[] = []) {
    fetchCalls = [];
    const mockFetch = vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method || "GET";
      const body = init?.body ? JSON.parse(init.body as string) : undefined;
      fetchCalls.push({ url, method, body });

      if (url.includes("/health")) {
        return { ok: true, json: async () => ({}) };
      }
      if (url.includes("/sessions/") && method === "GET") {
        return {
          ok: true,
          json: async () => ({ id: "session-1", annotations: sessionAnnotations }),
        };
      }
      if (url.endsWith("/sessions") && method === "POST") {
        return {
          ok: true,
          json: async () => ({ id: "session-1", annotations: sessionAnnotations }),
        };
      }
      if (url.includes("/annotations") && method === "POST") {
        return {
          ok: true,
          json: async () => ({ ...(body || {}), id: body?.id || "server-id" }),
        };
      }
      if (method === "DELETE") {
        return { ok: true, json: async () => ({}) };
      }
      return { ok: true, json: async () => ({}) };
    });
    vi.stubGlobal("fetch", mockFetch);
    vi.stubGlobal("EventSource", MockEventSource);
    return mockFetch;
  }

  beforeEach(() => {
    sseListeners = {};
  });

  it("annotation stays visible after server resolves it via SSE", async () => {
    const ann = makeAnnotation({ id: "sse-resolve-1", comment: "Fix this" });
    const mockFetch = setupServerMockWithSSE([ann]);
    seedAnnotations([ann]);

    render(
      <PageFeedbackToolbarCSS
        endpoint="http://test-server"
        sessionId="session-1"
      />,
    );

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    await activateToolbar();

    await waitFor(() => {
      expect(
        document.querySelectorAll("[data-annotation-marker]").length,
      ).toBe(1);
    });

    // Simulate server resolving the annotation via SSE
    await act(async () => {
      emitSSE("annotation.updated", {
        id: "sse-resolve-1",
        status: "resolved",
        thread: [
          { id: "t1", role: "agent", content: "Done!", timestamp: Date.now() },
        ],
      });
    });

    // Marker should still be visible (not removed) and have resolved class
    await waitFor(() => {
      const markers = document.querySelectorAll("[data-annotation-marker]");
      expect(markers.length).toBe(1);
      // CSS modules hash the class name, so check with partial match
      expect(markers[0].className).toMatch(/resolved/);
    });

    // Review queue button should now be enabled
    await waitFor(() => {
      const reviewBtn = findButtonByTooltip("Review queue");
      expect(reviewBtn).toBeTruthy();
      expect(reviewBtn!.disabled).toBe(false);
    });
  });
});
