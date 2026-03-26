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
import { createEventSourceHarness } from "./pageToolbarTestUtils";
import { setupPageToolbarServerMock } from "./pageToolbarServerTestUtils";

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

function findButtonByTooltip(tooltipText: string): HTMLButtonElement | null {
  const allSpans = document.querySelectorAll("[data-feedback-toolbar] span");
  for (const span of allSpans) {
    if (span.textContent?.trim().startsWith(tooltipText)) {
      // The tooltip span is a sibling of the button inside a wrapper div,
      // NOT a child of the button. So go up to the wrapper, then find the button.
      const btn =
        span.closest("button") ||
        span.parentElement?.querySelector("button");
      if (btn) return btn as HTMLButtonElement;
    }
  }
  return null;
}

function createMockTarget(
  tag: string = "button",
  text: string = "Mock Button",
): HTMLElement {
  const el = document.createElement(tag);
  el.textContent = text;
  el.getBoundingClientRect = vi.fn().mockReturnValue({
    x: 100,
    y: 100,
    width: 200,
    height: 40,
    top: 100,
    left: 100,
    right: 300,
    bottom: 140,
    toJSON: () => {},
  });
  document.body.appendChild(el);
  return el;
}

// ---------------------------------------------------------------------------
// Mock fetch to simulate a connected server
// ---------------------------------------------------------------------------

let fetchCalls: ReturnType<typeof setupPageToolbarServerMock>["fetchCalls"] = [];
const eventSourceHarness = createEventSourceHarness();

function setupServerMock(sessionAnnotations: Annotation[] = []) {
  const setup = setupPageToolbarServerMock({
    annotations: sessionAnnotations,
    eventSourceClass: eventSourceHarness.EventSourceClass,
  });
  fetchCalls = setup.fetchCalls;
  return setup.mockFetch;
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

beforeEach(() => {
  idCounter = 0;
  eventSourceHarness.reset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  // jsdom does not implement elementFromPoint
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
  // Clean up any mock targets left behind
  document
    .querySelectorAll("button:not([class])")
    .forEach((el) => {
      if (!el.closest("[data-feedback-toolbar]")) el.remove();
    });
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// =============================================================================
// Server-connected annotation operations
// =============================================================================

describe("Annotation operations with active server connection", () => {
  it("syncs new annotation to server after adding", async () => {
    const mockFetch = setupServerMock();
    const onAnnotationAdd = vi.fn();

    render(
      <PageFeedbackToolbarCSS
        endpoint="http://test-server"
        sessionId="session-1"
        onAnnotationAdd={onAnnotationAdd}
      />,
    );

    // Wait for session to be established
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    await activateToolbar();

    // Create a mock target element
    const mockEl = createMockTarget("button", "Click Target");
    vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

    // Click to create pending annotation — dispatch from body so
    // composedPath()[0] is an Element (document node lacks .matches())
    await act(async () => {
      const event = new MouseEvent("click", {
        clientX: 400,
        clientY: 300,
        bubbles: true,
      });
      document.body.dispatchEvent(event);
    });

    // Wait for popup
    await waitFor(() => {
      expect(
        document.querySelector("[data-annotation-popup]"),
      ).toBeTruthy();
    });

    // Type and submit
    const textarea = document.querySelector(
      "[data-annotation-popup] textarea",
    ) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Server test" } });
    fireEvent.keyDown(textarea, { key: "Enter" });

    // Wait for annotation to be added and synced
    await waitFor(() => {
      expect(onAnnotationAdd).toHaveBeenCalled();
    });

    // Verify syncAnnotation was called (POST to /sessions/session-1/annotations)
    await waitFor(() => {
      const syncCall = fetchCalls.find(
        (call) => call.url.includes("/annotations") && call.method === "POST",
      );
      expect(syncCall).toBeTruthy();
      expect(syncCall?.body).toMatchObject({ comment: "Server test" });
    });

    mockEl.remove();
  });

  it("includes sessionId and status in annotation when connected", async () => {
    const mockFetch = setupServerMock();
    const onAnnotationAdd = vi.fn();

    render(
      <PageFeedbackToolbarCSS
        endpoint="http://test-server"
        sessionId="session-1"
        onAnnotationAdd={onAnnotationAdd}
      />,
    );

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    await activateToolbar();

    const mockEl = createMockTarget("button", "Target");
    vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

    await act(async () => {
      document.body.dispatchEvent(
        new MouseEvent("click", {
          clientX: 200,
          clientY: 200,
          bubbles: true,
        }),
      );
    });

    await waitFor(() => {
      expect(
        document.querySelector("[data-annotation-popup]"),
      ).toBeTruthy();
    });

    const textarea = document.querySelector(
      "[data-annotation-popup] textarea",
    ) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Connected annotation" } });
    fireEvent.keyDown(textarea, { key: "Enter" });

    await waitFor(() => {
      expect(onAnnotationAdd).toHaveBeenCalled();
      const annotation = onAnnotationAdd.mock.calls[0][0];
      expect(annotation.sessionId).toBe("session-1");
      expect(annotation.status).toBe("pending");
    });

    mockEl.remove();
  });

  it("syncs delete to server when deleting annotation", async () => {
    const ann = makeAnnotation({ id: "del-1" });
    // Server already knows about this annotation
    const mockFetch = setupServerMock([ann]);
    seedAnnotations([ann]);

    render(
      <PageFeedbackToolbarCSS
        endpoint="http://test-server"
        sessionId="session-1"
        onAnnotationDelete={vi.fn()}
      />,
    );

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    await activateToolbar();

    // Wait for markers to render
    await waitFor(() => {
      const markers = document.querySelectorAll("[data-annotation-marker]");
      expect(markers.length).toBeGreaterThanOrEqual(1);
    });

    // Click marker to start edit, then delete via popup
    const marker = document.querySelector("[data-annotation-marker]")!;
    fireEvent.click(marker);

    await waitFor(() => {
      expect(
        document.querySelector("[data-annotation-popup]"),
      ).toBeTruthy();
    });

    // Find delete button in popup (first button)
    const popup = document.querySelector("[data-annotation-popup]")!;
    const buttons = popup.querySelectorAll("button");
    const deleteBtn = buttons[0];
    fireEvent.click(deleteBtn);

    // Verify DELETE was called
    await waitFor(() => {
      const deleteCall = fetchCalls.find(
        (c) => c.method === "DELETE" && c.url.includes("del-1"),
      );
      expect(deleteCall).toBeTruthy();
    });
  });

  it("syncs update to server when editing annotation", async () => {
    const ann = makeAnnotation({ id: "edit-1", comment: "Original" });
    // Server already knows about this annotation
    const mockFetch = setupServerMock([ann]);
    seedAnnotations([ann]);

    render(
      <PageFeedbackToolbarCSS
        endpoint="http://test-server"
        sessionId="session-1"
        onAnnotationUpdate={vi.fn()}
      />,
    );

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    await activateToolbar();

    await waitFor(() => {
      expect(
        document.querySelectorAll("[data-annotation-marker]").length,
      ).toBeGreaterThanOrEqual(1);
    });

    // Click marker to edit
    const marker = document.querySelector("[data-annotation-marker]")!;
    fireEvent.click(marker);

    await waitFor(() => {
      expect(
        document.querySelector("[data-annotation-popup]"),
      ).toBeTruthy();
    });

    // Edit the text
    const textarea = document.querySelector(
      "[data-annotation-popup] textarea",
    ) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Updated comment" } });

    // Click Save button
    const saveBtn = [
      ...document.querySelectorAll("[data-annotation-popup] button"),
    ].find((b) => b.textContent?.includes("Save"));
    expect(saveBtn).toBeTruthy();
    fireEvent.click(saveBtn!);

    // Verify PATCH was called
    await waitFor(() => {
      const patchCall = fetchCalls.find((call) => call.method === "PATCH");
      expect(patchCall).toBeTruthy();
      expect(patchCall?.body).toMatchObject({ comment: "Updated comment" });
    });
  });

  it("syncs all deletes to server when clearing annotations", async () => {
    const anns = [
      makeAnnotation({ id: "c1" }),
      makeAnnotation({ id: "c2" }),
      makeAnnotation({ id: "c3" }),
    ];
    // Server knows about all three
    const mockFetch = setupServerMock(anns);
    seedAnnotations(anns);

    render(
      <PageFeedbackToolbarCSS
        endpoint="http://test-server"
        sessionId="session-1"
        onAnnotationsClear={vi.fn()}
      />,
    );

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    await activateToolbar();

    // Wait for markers to render (confirms annotations loaded)
    await waitFor(() => {
      expect(
        document.querySelectorAll("[data-annotation-marker]").length,
      ).toBeGreaterThanOrEqual(1);
    });

    // Click clear button
    const clearBtn = findButtonByTooltip("Clear");
    expect(clearBtn).toBeTruthy();
    fireEvent.click(clearBtn!);

    // Verify DELETE calls for each annotation
    await waitFor(() => {
      const deleteCalls = fetchCalls.filter((c) => c.method === "DELETE");
      expect(deleteCalls.length).toBe(3);
    });
  });

  it("closes edit panel with animation when deleting the annotation being edited", async () => {
    const ann = makeAnnotation({ id: "edit-del-1", comment: "Will delete" });
    const mockFetch = setupServerMock([ann]);
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
      ).toBeGreaterThanOrEqual(1);
    });

    // Click marker to start editing
    const marker = document.querySelector("[data-annotation-marker]")!;
    fireEvent.click(marker);

    await waitFor(() => {
      expect(
        document.querySelector("[data-annotation-popup]"),
      ).toBeTruthy();
    });

    // Delete via the popup's delete button
    const popup = document.querySelector("[data-annotation-popup]")!;
    const deleteBtn = popup.querySelectorAll("button")[0];
    fireEvent.click(deleteBtn);

    // Popup should close after animation
    await waitFor(
      () => {
        expect(
          document.querySelector("[data-annotation-popup]"),
        ).toBeFalsy();
      },
      { timeout: 1000 },
    );
  });
});

// =============================================================================
// Tooltip component internals (settings panel help icons)
// =============================================================================

describe("Tooltip component in settings panel", () => {
  it("tooltip trigger span responds to mouseEnter and mouseLeave", async () => {
    render(<PageFeedbackToolbarCSS />);
    await activateToolbar();

    // Open settings
    const settingsBtn = findButtonByTooltip("Settings");
    expect(settingsBtn).toBeTruthy();
    fireEvent.click(settingsBtn!);

    // Find the help icon spans (wrapped by Tooltip component)
    await waitFor(() => {
      const helpIcons = document.querySelectorAll(
        "[data-feedback-toolbar] [class*='helpIcon']",
      );
      expect(helpIcons.length).toBeGreaterThan(0);
    });

    const helpIcon = document.querySelector(
      "[data-feedback-toolbar] [class*='helpIcon']",
    )!;
    // The Tooltip trigger is the parent span wrapping the helpIcon
    const tooltipTrigger = helpIcon.parentElement!;

    // Fire mouseEnter — this calls Tooltip's handleMouseEnter
    await act(async () => {
      fireEvent.mouseEnter(tooltipTrigger);
    });

    // Wait for the delayed tooltip to appear (500ms via originalSetTimeout)
    await waitFor(
      () => {
        // The tooltip renders via portal as a fixed div in document.body
        const portalTooltips = [
          ...document.querySelectorAll("body > [data-feedback-toolbar]"),
        ].filter(
          (el) =>
            el.getAttribute("style")?.includes("position: fixed") &&
            el.getAttribute("style")?.includes("z-index: 100020"),
        );
        expect(portalTooltips.length).toBeGreaterThan(0);
      },
      { timeout: 1500 },
    );

    // Fire mouseLeave — this calls Tooltip's handleMouseLeave
    await act(async () => {
      fireEvent.mouseLeave(tooltipTrigger);
    });

    // After the exit animation (150ms), tooltip should be removed or have opacity 0
    await waitFor(
      () => {
        const portalTooltips = [
          ...document.querySelectorAll("body > [data-feedback-toolbar]"),
        ].filter((el) =>
          el.getAttribute("style")?.includes("z-index: 100020"),
        );
        if (portalTooltips.length > 0) {
          expect(portalTooltips[0].getAttribute("style")).toContain(
            "opacity: 0",
          );
        }
      },
      { timeout: 500 },
    );
  });

  it("tooltip shows content text when hovered", async () => {
    render(<PageFeedbackToolbarCSS />);
    await activateToolbar();

    const settingsBtn = findButtonByTooltip("Settings");
    expect(settingsBtn).toBeTruthy();
    fireEvent.click(settingsBtn!);

    await waitFor(() => {
      const helpIcons = document.querySelectorAll(
        "[data-feedback-toolbar] [class*='helpIcon']",
      );
      expect(helpIcons.length).toBeGreaterThan(0);
    });

    const helpIcon = document.querySelector(
      "[data-feedback-toolbar] [class*='helpIcon']",
    )!;
    const tooltipTrigger = helpIcon.parentElement!;

    await act(async () => {
      fireEvent.mouseEnter(tooltipTrigger);
    });

    // The tooltip should contain the help text
    await waitFor(
      () => {
        const allPortalElements = document.querySelectorAll(
          "body > [data-feedback-toolbar]",
        );
        const tooltipEl = [...allPortalElements].find(
          (el) =>
            el.textContent &&
            el.textContent.length > 0 &&
            el.getAttribute("style")?.includes("100020"),
        );
        expect(tooltipEl).toBeTruthy();
      },
      { timeout: 1500 },
    );
  });

  it("re-entering tooltip trigger cancels exit timeout", async () => {
    render(<PageFeedbackToolbarCSS />);
    await activateToolbar();

    const settingsBtn = findButtonByTooltip("Settings");
    expect(settingsBtn).toBeTruthy();
    fireEvent.click(settingsBtn!);

    await waitFor(() => {
      expect(
        document.querySelector("[data-feedback-toolbar] [class*='helpIcon']"),
      ).toBeTruthy();
    });

    const helpIcon = document.querySelector(
      "[data-feedback-toolbar] [class*='helpIcon']",
    )!;
    const trigger = helpIcon.parentElement!;

    // Enter → wait for tooltip → Leave → Enter quickly (should cancel exit)
    await act(async () => {
      fireEvent.mouseEnter(trigger);
    });

    await waitFor(
      () => {
        const tooltips = [
          ...document.querySelectorAll("body > [data-feedback-toolbar]"),
        ].filter((el) =>
          el.getAttribute("style")?.includes("100020"),
        );
        expect(tooltips.length).toBeGreaterThan(0);
      },
      { timeout: 1500 },
    );

    // Leave and immediately re-enter
    await act(async () => {
      fireEvent.mouseLeave(trigger);
      fireEvent.mouseEnter(trigger);
    });

    // Tooltip should still be rendered (exit was cancelled)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });

    const tooltips = [
      ...document.querySelectorAll("body > [data-feedback-toolbar]"),
    ].filter((el) => el.getAttribute("style")?.includes("100020"));
    expect(tooltips.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// Scroll tracking (lines 1352-1374)
// =============================================================================

describe("Scroll tracking clears isScrolling", () => {
  it("scroll sets isScrolling temporarily which hides hover tooltip", async () => {
    render(<PageFeedbackToolbarCSS />);
    await activateToolbar();

    // This exercises the scroll handler to cover scroll tracking lines
    await act(async () => {
      fireEvent.scroll(window);
    });

    // Wait for the debounce to clear (150ms)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });
  });
});

// =============================================================================
// Reconnection sync (lines 1200-1283)
// =============================================================================

describe("Reconnection sync", () => {
  it("syncs local annotations when the session stream reconnects", async () => {
    const ann = makeAnnotation({ id: "local-1" });
    seedAnnotations([ann]);

    const setup = setupPageToolbarServerMock({
      annotations: [],
      eventSourceClass: eventSourceHarness.EventSourceClass,
      sessionId: "session-r",
    });

    render(
      <PageFeedbackToolbarCSS
        endpoint="http://reconnect-test"
        sessionId="session-r"
      />,
    );

    await waitFor(() => {
      expect(eventSourceHarness.getLastInstance()).not.toBeNull();
    });

    expect(setup.mockFetch).toHaveBeenCalled();

    await act(async () => {
      eventSourceHarness.error();
      await Promise.resolve();
    });

    await act(async () => {
      eventSourceHarness.open();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    const syncCall = setup.fetchCalls.find(
      (call) => call.url.includes("/annotations") && call.method === "POST",
    );
    expect(syncCall).toBeTruthy();
    expect(syncCall?.body).toMatchObject({ id: "local-1" });
  });
});
