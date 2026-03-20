/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, waitFor, act } from "@testing-library/react";
import { PageFeedbackToolbarCSS } from "../index";
import type { Annotation } from "../../../types";
import {
  activateToolbar,
  createEventSourceHarness,
  installPageToolbarTestGlobals,
  makeAnnotation,
  resetPageToolbarTestEnvironment,
  seedAnnotations,
} from "./pageToolbarTestUtils";
import { setupPageToolbarServerMock } from "./pageToolbarServerTestUtils";

const eventSourceHarness = createEventSourceHarness();
const mockWriteText = vi.fn().mockResolvedValue(undefined);

// ---------------------------------------------------------------------------
// Mock fetch for server connection
// ---------------------------------------------------------------------------

let fetchCalls: ReturnType<typeof setupPageToolbarServerMock>["fetchCalls"];

function setupServerMock(sessionAnnotations: Annotation[] = []) {
  const setup = setupPageToolbarServerMock({
    annotations: sessionAnnotations,
    includeThreadReplies: true,
  });
  fetchCalls = setup.fetchCalls;
  return setup.mockFetch;
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

beforeEach(() => {
  eventSourceHarness.reset();
  mockWriteText.mockClear();
  installPageToolbarTestGlobals({
    writeText: mockWriteText,
    includeElementsFromPoint: true,
    eventSourceClass: eventSourceHarness.EventSourceClass,
    fetchMode: "none",
  });
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  resetPageToolbarTestEnvironment();
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
      expect(eventSourceHarness.getListeners("thread.message").length).toBeGreaterThan(0);
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
      expect(eventSourceHarness.getListeners("thread.message").length).toBeGreaterThan(0);
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
      eventSourceHarness.emit("thread.message", {
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
        (call) => call.url.includes("/thread") && call.method === "POST",
      );
      expect(threadCall).toBeTruthy();
      expect(threadCall?.body).toMatchObject({
        content: "Thanks for fixing!",
        role: "human",
      });
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
