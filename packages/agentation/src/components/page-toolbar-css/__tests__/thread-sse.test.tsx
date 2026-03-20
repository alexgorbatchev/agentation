/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from "@testing-library/react";
import { PageFeedbackToolbarCSS } from "../index";
import type { Annotation } from "../../../types";
import { unfreeze as unfreezeAll } from "../../../utils/freeze-animations";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let idCounter = 0;

function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: `test-${++idCounter}`,
    x: 50,
    y: 200,
    comment: "Test feedback",
    element: "Button",
    elementPath: "body > div > button",
    timestamp: Date.now(),
    ...overrides,
  };
}

const STORAGE_KEY = "feedback-annotations-/";

function seedAnnotations(annotations: Annotation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(annotations));
}

async function activateToolbar() {
  const activateButton = screen.getByTitle("Start feedback mode");
  fireEvent.click(activateButton);
  await waitFor(() => {
    expect(document.querySelector("[data-feedback-toolbar]")).toBeTruthy();
  });
}

// ---------------------------------------------------------------------------
// Mock EventSource that captures listeners
// ---------------------------------------------------------------------------

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
  const listeners = sseListeners[event] || [];
  const messageEvent = new MessageEvent("message", {
    data: JSON.stringify({ payload }),
  });
  for (const listener of listeners) {
    listener(messageEvent);
  }
}

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
    // Thread reply
    if (url.includes("/thread") && method === "POST") {
      const annotationId = url.match(/annotations\/([^/]+)\/thread/)?.[1];
      const matchingAnn = sessionAnnotations.find((a) => a.id === annotationId);
      const newThread = [
        ...(matchingAnn?.thread || []),
        { id: `t-${Date.now()}`, role: body?.role, content: body?.content, timestamp: Date.now() },
      ];
      return {
        ok: true,
        json: async () => ({
          ...matchingAnn,
          id: annotationId,
          thread: newThread,
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
  vi.stubGlobal("EventSource", MockEventSource);
  return mockFetch;
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

beforeEach(() => {
  idCounter = 0;
  sseListeners = {};
  vi.spyOn(console, "warn").mockImplementation(() => {});
  document.elementFromPoint = vi.fn().mockReturnValue(null);
  if (!document.elementsFromPoint) {
    (document as unknown as Record<string, unknown>).elementsFromPoint = vi
      .fn()
      .mockReturnValue([]);
  }
});

afterEach(() => {
  unfreezeAll();
  cleanup();
  document
    .querySelectorAll("[data-feedback-toolbar]")
    .forEach((el) => el.remove());
  document
    .querySelectorAll("[data-annotation-marker]")
    .forEach((el) => el.remove());
  document
    .querySelectorAll("[data-annotation-popup]")
    .forEach((el) => el.remove());
  document.getElementById("feedback-cursor-styles")?.remove();
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// =============================================================================
// SSE thread.message listener
// =============================================================================

describe("SSE thread.message listener", () => {
  it("registers a listener for thread.message events", async () => {
    setupServerMock();

    render(
      <PageFeedbackToolbarCSS
        endpoint="http://test-server"
        sessionId="session-1"
      />,
    );

    await waitFor(() => {
      expect(sseListeners["thread.message"]).toBeDefined();
      expect(sseListeners["thread.message"].length).toBeGreaterThan(0);
    });
  });

  it("updates annotation thread when thread.message SSE is received", async () => {
    const ann = makeAnnotation({ id: "sse-1", comment: "Bug here" });
    setupServerMock([ann]);
    seedAnnotations([ann]);

    render(
      <PageFeedbackToolbarCSS
        endpoint="http://test-server"
        sessionId="session-1"
      />,
    );

    await waitFor(() => {
      expect(sseListeners["thread.message"]).toBeDefined();
    });

    await activateToolbar();

    // Wait for markers
    await waitFor(() => {
      expect(
        document.querySelectorAll("[data-annotation-marker]").length,
      ).toBeGreaterThanOrEqual(1);
    });

    // Emit a thread.message SSE event with the full annotation
    await act(async () => {
      emitSSE("thread.message", {
        id: "sse-1",
        thread: [
          { id: "t1", role: "agent", content: "On it!", timestamp: 123 },
        ],
      });
    });

    // Thread badge should appear on the marker
    await waitFor(() => {
      const badges = document.querySelectorAll("[class*='threadBadge']");
      expect(badges.length).toBeGreaterThan(0);
      expect(badges[0].textContent).toBe("1");
    });
  });
});

// =============================================================================
// Thread badge on markers
// =============================================================================

describe("thread badge on markers", () => {
  it("shows thread badge with count on markers that have threads", async () => {
    const ann = makeAnnotation({
      id: "badge-1",
      thread: [
        { id: "t1", role: "agent", content: "msg1", timestamp: 100 },
        { id: "t2", role: "human", content: "msg2", timestamp: 200 },
      ],
    });
    setupServerMock([ann]);
    seedAnnotations([ann]);

    render(
      <PageFeedbackToolbarCSS
        endpoint="http://test-server"
        sessionId="session-1"
      />,
    );

    await activateToolbar();

    await waitFor(() => {
      expect(
        document.querySelectorAll("[data-annotation-marker]").length,
      ).toBeGreaterThanOrEqual(1);
    });

    // Should show badge with "2"
    await waitFor(() => {
      const badges = document.querySelectorAll("[class*='threadBadge']");
      expect(badges.length).toBe(1);
      expect(badges[0].textContent).toBe("2");
    });
  });

  it("does not show thread badge on markers without threads", async () => {
    const ann = makeAnnotation({ id: "no-badge-1" });
    setupServerMock([ann]);
    seedAnnotations([ann]);

    render(
      <PageFeedbackToolbarCSS
        endpoint="http://test-server"
        sessionId="session-1"
      />,
    );

    await activateToolbar();

    await waitFor(() => {
      expect(
        document.querySelectorAll("[data-annotation-marker]").length,
      ).toBeGreaterThanOrEqual(1);
    });

    const badges = document.querySelectorAll("[class*='threadBadge']");
    expect(badges.length).toBe(0);
  });
});

// =============================================================================
// Thread reply via popup
// =============================================================================

describe("thread reply from edit popup", () => {
  it("sends thread reply to server when replying from popup", async () => {
    const ann = makeAnnotation({
      id: "reply-1",
      comment: "Fix the layout",
      thread: [
        { id: "t1", role: "agent", content: "Working on it", timestamp: 100 },
      ],
    });
    setupServerMock([ann]);
    seedAnnotations([ann]);

    render(
      <PageFeedbackToolbarCSS
        endpoint="http://test-server"
        sessionId="session-1"
      />,
    );

    await activateToolbar();

    // Wait for markers
    await waitFor(() => {
      expect(
        document.querySelectorAll("[data-annotation-marker]").length,
      ).toBeGreaterThanOrEqual(1);
    }, { timeout: 1500 });

    // Click marker to edit
    const marker = document.querySelector("[data-annotation-marker]")!;
    fireEvent.click(marker);

    // Wait for popup
    await waitFor(() => {
      expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
    });

    // Should show thread view with reply textarea
    await waitFor(() => {
      expect(
        document.querySelector("[data-annotation-popup] [placeholder='Reply...']"),
      ).toBeTruthy();
    });

    // Type and send a reply
    const replyTextarea = document.querySelector(
      "[data-annotation-popup] [placeholder='Reply...']",
    ) as HTMLTextAreaElement;
    fireEvent.change(replyTextarea, { target: { value: "Thanks for fixing!" } });

    const replyBtn = [...document.querySelectorAll("[data-annotation-popup] button")]
      .find((b) => b.textContent === "Reply");
    expect(replyBtn).toBeTruthy();
    fireEvent.click(replyBtn!);

    // Verify POST to /annotations/reply-1/thread
    await waitFor(() => {
      const threadCall = fetchCalls.find(
        (c) => c.url.includes("/thread") && c.method === "POST",
      );
      expect(threadCall).toBeTruthy();
      expect(threadCall!.body.content).toBe("Thanks for fixing!");
      expect(threadCall!.body.role).toBe("human");
    });
  });

  it("shows original comment read-only in thread view", async () => {
    const ann = makeAnnotation({
      id: "readonly-1",
      comment: "Original feedback text",
      thread: [
        { id: "t1", role: "agent", content: "Noted", timestamp: 100 },
      ],
    });
    setupServerMock([ann]);
    seedAnnotations([ann]);

    render(
      <PageFeedbackToolbarCSS
        endpoint="http://test-server"
        sessionId="session-1"
      />,
    );

    await activateToolbar();

    await waitFor(() => {
      expect(
        document.querySelectorAll("[data-annotation-marker]").length,
      ).toBeGreaterThanOrEqual(1);
    });

    const marker = document.querySelector("[data-annotation-marker]")!;
    fireEvent.click(marker);

    await waitFor(() => {
      expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
    });

    // Original comment should be visible as text, not in a textarea
    const popup = document.querySelector("[data-annotation-popup]")!;
    expect(popup.textContent).toContain("Original feedback text");
    // Should not be editable (no textarea with this value)
    const textareas = popup.querySelectorAll("textarea");
    for (const ta of textareas) {
      expect(ta.value).not.toBe("Original feedback text");
    }
  });
});
