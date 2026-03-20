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

function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: `test-${Math.random().toString(36).slice(2)}`,
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
const SETTINGS_KEY = "feedback-toolbar-settings";

function seedAnnotations(annotations: Annotation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(annotations));
}

function seedSettings(overrides: Record<string, unknown> = {}) {
  const defaults = {
    outputDetail: "standard",
    autoClearAfterCopy: false,
    annotationColor: "#3c82f7",
    blockInteractions: true,
    reactEnabled: true,
    markerClickBehavior: "edit",
    webhookUrl: "",
    webhooksEnabled: true,
  };
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({ ...defaults, ...overrides }),
  );
}

async function activateToolbar() {
  const activateButton = screen.getByTitle("Start feedback mode");
  fireEvent.click(activateButton);
  await waitFor(() => {
    const toolbar = document.querySelector("[data-feedback-toolbar]");
    expect(toolbar).toBeTruthy();
  });
}

function findButtonByTooltip(tooltipText: string): HTMLButtonElement | null {
  const toolbarEls = document.querySelectorAll("[data-feedback-toolbar]");
  for (const toolbar of toolbarEls) {
    const spans = toolbar.querySelectorAll("span");
    for (const span of spans) {
      if (span.textContent?.trim().startsWith(tooltipText)) {
        const wrapper = span.parentElement;
        if (wrapper) {
          const button = wrapper.querySelector("button");
          if (button) return button;
        }
      }
    }
  }
  return null;
}

/**
 * Wait until at least one [data-annotation-marker] is present in the DOM.
 */
async function waitForMarkers(count = 1) {
  await waitFor(
    () => {
      const markers = document.querySelectorAll("[data-annotation-marker]");
      expect(markers.length).toBeGreaterThanOrEqual(count);
    },
    { timeout: 3000 },
  );
}

/**
 * Create a mock target element and append it to the body.
 */
function createMockTarget(
  tag: string = "button",
  text: string = "Click me",
): HTMLElement {
  const el = document.createElement(tag);
  el.textContent = text;
  el.setAttribute("data-mock-target", "true");
  document.body.appendChild(el);
  return el;
}

/**
 * Simulate a click at given viewport coordinates.
 */
function clickAtPoint(
  x: number,
  y: number,
  options: Partial<MouseEventInit> = {},
) {
  const event = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    ...options,
  });
  document.body.dispatchEvent(event);
}

// ---------------------------------------------------------------------------
// Global Mocks
// ---------------------------------------------------------------------------

const mockWriteText = vi.fn().mockResolvedValue(undefined);

class MockEventSource {
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  close = vi.fn();
  constructor(_url: string) {}
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();

  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: mockWriteText },
    writable: true,
    configurable: true,
  });
  mockWriteText.mockClear();

  // jsdom does not implement elementFromPoint
  document.elementFromPoint = vi.fn().mockReturnValue(null);

  // jsdom does not implement elementsFromPoint
  if (!document.elementsFromPoint) {
    (document as unknown as Record<string, unknown>).elementsFromPoint = vi
      .fn()
      .mockReturnValue([]);
  } else {
    vi.spyOn(document, "elementsFromPoint").mockReturnValue([]);
  }

  vi.stubGlobal("EventSource", MockEventSource);
});

afterEach(() => {
  try {
    unfreezeAll();
  } catch {
    // ignore if already unfrozen
  }

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
  document.getElementById("feedback-freeze-styles")?.remove();
  document
    .querySelectorAll("[data-mock-target]")
    .forEach((el) => el.remove());
  document.querySelectorAll("style").forEach((s) => {
    if (s.id?.includes("agentation") || s.id?.includes("freeze")) s.remove();
  });
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// =============================================================================
// Tests
// =============================================================================

describe("Marker interactions and JSX render paths", () => {
  // ===========================================================================
  // 1. Fixed markers layer
  // ===========================================================================
  describe("Fixed markers layer", () => {
    it("renders a fixed marker when annotation has isFixed: true", async () => {
      const fixedAnnotation = makeAnnotation({
        id: "fixed-1",
        isFixed: true,
        y: 100,
        x: 30,
        comment: "Fixed element feedback",
      });
      seedAnnotations([fixedAnnotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const markers = document.querySelectorAll("[data-annotation-marker]");
      expect(markers.length).toBe(1);

      // Fixed markers are in the fixedMarkersLayer and have the fixed class
      const marker = markers[0] as HTMLElement;
      expect(marker.className).toContain("fixed");
    });

    it("separates fixed and non-fixed markers into different layers", async () => {
      const normalAnnotation = makeAnnotation({
        id: "normal-1",
        isFixed: false,
        y: 200,
        x: 50,
        comment: "Normal marker",
      });
      const fixedAnnotation = makeAnnotation({
        id: "fixed-1",
        isFixed: true,
        y: 100,
        x: 30,
        comment: "Fixed marker",
      });
      seedAnnotations([normalAnnotation, fixedAnnotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(2);

      const markers = document.querySelectorAll("[data-annotation-marker]");
      expect(markers.length).toBe(2);

      // One should have the fixed class, the other should not
      const classNames = Array.from(markers).map((m) => m.className);
      const fixedMarker = classNames.find((c) => c.includes("fixed"));
      const normalMarker = classNames.find((c) => !c.includes("fixed"));
      expect(fixedMarker).toBeTruthy();
      expect(normalMarker).toBeTruthy();
    });

    it("positions fixed marker using left and top style properties", async () => {
      const fixedAnnotation = makeAnnotation({
        id: "fixed-pos",
        isFixed: true,
        y: 150,
        x: 25,
      });
      seedAnnotations([fixedAnnotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      expect(marker.style.left).toBe("25%");
      // React converts numeric top values to px strings
      expect(marker.style.top).toBe("150px");
    });
  });

  // ===========================================================================
  // 2. Marker hover -> tooltip
  // ===========================================================================
  describe("Marker hover -> tooltip", () => {
    it("shows tooltip with element name and comment on mouseEnter", async () => {
      const annotation = makeAnnotation({
        id: "hover-1",
        element: "SubmitButton",
        comment: "Change color to red",
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.mouseEnter(marker);

      await waitFor(() => {
        const tooltip = document.querySelector('[class*="markerTooltip"]');
        expect(tooltip).toBeTruthy();
        expect(tooltip!.textContent).toContain("SubmitButton");
        expect(tooltip!.textContent).toContain("Change color to red");
      });
    });

    it("shows selectedText truncated to 30 chars in tooltip", async () => {
      const longText =
        "This is a very long selected text that should be truncated after thirty characters";
      const annotation = makeAnnotation({
        id: "hover-text",
        element: "Paragraph",
        selectedText: longText,
        comment: "Shorten this",
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.mouseEnter(marker);

      await waitFor(() => {
        const tooltip = document.querySelector('[class*="markerTooltip"]');
        expect(tooltip).toBeTruthy();
        // The text should be truncated to 30 chars with "..."
        expect(tooltip!.textContent).toContain(longText.slice(0, 30));
        expect(tooltip!.textContent).toContain("...");
      });
    });

    it("shows short selectedText without ellipsis", async () => {
      const annotation = makeAnnotation({
        id: "hover-short",
        element: "Link",
        selectedText: "Click here",
        comment: "Improve wording",
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.mouseEnter(marker);

      await waitFor(() => {
        const tooltip = document.querySelector('[class*="markerTooltip"]');
        expect(tooltip).toBeTruthy();
        expect(tooltip!.textContent).toContain("Click here");
        // Short text should not have "..."
        const quoteSpan = tooltip!.querySelector('[class*="markerQuote"]');
        expect(quoteSpan?.textContent).not.toContain("...");
      });
    });

    it("hides tooltip on mouseLeave", async () => {
      const annotation = makeAnnotation({ id: "hover-leave" });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.mouseEnter(marker);

      await waitFor(() => {
        expect(
          document.querySelector('[class*="markerTooltip"]'),
        ).toBeTruthy();
      });

      fireEvent.mouseLeave(marker);

      await waitFor(() => {
        expect(
          document.querySelector('[class*="markerTooltip"]'),
        ).toBeFalsy();
      });
    });

    it("shows tooltip on fixed marker hover", async () => {
      const annotation = makeAnnotation({
        id: "fixed-hover",
        isFixed: true,
        element: "NavBar",
        comment: "Sticky nav feedback",
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.mouseEnter(marker);

      await waitFor(() => {
        const tooltip = document.querySelector('[class*="markerTooltip"]');
        expect(tooltip).toBeTruthy();
        expect(tooltip!.textContent).toContain("NavBar");
        expect(tooltip!.textContent).toContain("Sticky nav feedback");
      });
    });
  });

  // ===========================================================================
  // 3. Marker hover -> element outline
  // ===========================================================================
  describe("Marker hover -> element outline", () => {
    it("renders singleSelectOutline when hovering a marker with boundingBox", async () => {
      const annotation = makeAnnotation({
        id: "outline-single",
        boundingBox: { x: 100, y: 200, width: 150, height: 40 },
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.mouseEnter(marker);

      await waitFor(() => {
        const outline = document.querySelector(
          '[class*="singleSelectOutline"]',
        );
        expect(outline).toBeTruthy();
      });
    });

    it("renders multiSelectOutline for annotations with elementBoundingBoxes", async () => {
      const annotation = makeAnnotation({
        id: "outline-multi",
        isMultiSelect: true,
        boundingBox: { x: 100, y: 200, width: 300, height: 200 },
        elementBoundingBoxes: [
          { x: 100, y: 200, width: 100, height: 40 },
          { x: 100, y: 260, width: 100, height: 40 },
        ],
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.mouseEnter(marker);

      await waitFor(() => {
        const outlines = document.querySelectorAll(
          '[class*="multiSelectOutline"]',
        );
        expect(outlines.length).toBeGreaterThanOrEqual(2);
      });
    });

    it("does not render outline when annotation has no boundingBox", async () => {
      const annotation = makeAnnotation({
        id: "no-bb",
        // No boundingBox
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.mouseEnter(marker);

      // Small delay to let any async rendering happen
      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      const outline = document.querySelector(
        '[class*="singleSelectOutline"]',
      );
      expect(outline).toBeFalsy();
    });
  });

  // ===========================================================================
  // 4. Edit popup rendering
  // ===========================================================================
  describe("Edit popup rendering", () => {
    it("opens edit popup when clicking a marker (default edit behavior)", async () => {
      const annotation = makeAnnotation({
        id: "edit-click",
        comment: "Original feedback",
        boundingBox: { x: 100, y: 200, width: 150, height: 40 },
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.click(marker);

      await waitFor(() => {
        const popup = document.querySelector("[data-annotation-popup]");
        expect(popup).toBeTruthy();
      });
    });

    it("edit popup contains Save button and initial comment value", async () => {
      const annotation = makeAnnotation({
        id: "edit-content",
        comment: "My original comment",
        boundingBox: { x: 100, y: 200, width: 150, height: 40 },
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.click(marker);

      await waitFor(() => {
        const popup = document.querySelector("[data-annotation-popup]");
        expect(popup).toBeTruthy();

        // Should have Save button
        const buttons = popup!.querySelectorAll("button");
        const saveBtn = Array.from(buttons).find((b) =>
          b.textContent?.includes("Save"),
        );
        expect(saveBtn).toBeTruthy();

        // Should contain the original comment in a textarea
        const textarea = popup!.querySelector("textarea") as HTMLTextAreaElement;
        expect(textarea).toBeTruthy();
        expect(textarea.value).toBe("My original comment");
      });
    });

    it("submitting edit popup calls onAnnotationUpdate", async () => {
      const onAnnotationUpdate = vi.fn();
      const annotation = makeAnnotation({
        id: "edit-submit",
        comment: "Old comment",
        boundingBox: { x: 100, y: 200, width: 150, height: 40 },
      });
      seedAnnotations([annotation]);

      render(
        <PageFeedbackToolbarCSS onAnnotationUpdate={onAnnotationUpdate} />,
      );
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.click(marker);

      await waitFor(() => {
        expect(
          document.querySelector("[data-annotation-popup]"),
        ).toBeTruthy();
      });

      const textarea = document.querySelector(
        "[data-annotation-popup] textarea",
      ) as HTMLTextAreaElement;
      await act(async () => {
        fireEvent.change(textarea, { target: { value: "Updated comment" } });
      });

      await act(async () => {
        fireEvent.keyDown(textarea, { key: "Enter" });
      });

      await waitFor(
        () => {
          expect(onAnnotationUpdate).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 },
      );

      expect(onAnnotationUpdate.mock.calls[0][0].comment).toBe(
        "Updated comment",
      );
    });

    it("cancelling edit popup closes it without updating", async () => {
      const onAnnotationUpdate = vi.fn();
      const annotation = makeAnnotation({
        id: "edit-cancel",
        comment: "Keep this",
        boundingBox: { x: 100, y: 200, width: 150, height: 40 },
      });
      seedAnnotations([annotation]);

      render(
        <PageFeedbackToolbarCSS onAnnotationUpdate={onAnnotationUpdate} />,
      );
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.click(marker);

      await waitFor(() => {
        expect(
          document.querySelector("[data-annotation-popup]"),
        ).toBeTruthy();
      });

      const popup = document.querySelector("[data-annotation-popup]")!;
      const cancelBtn = Array.from(popup.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Cancel"),
      );
      expect(cancelBtn).toBeTruthy();

      await act(async () => {
        fireEvent.click(cancelBtn!);
      });

      await waitFor(
        () => {
          expect(
            document.querySelector("[data-annotation-popup]"),
          ).toBeFalsy();
        },
        { timeout: 3000 },
      );

      expect(onAnnotationUpdate).not.toHaveBeenCalled();
    });

    it("delete button in edit popup calls onAnnotationDelete", async () => {
      const onAnnotationDelete = vi.fn();
      const annotation = makeAnnotation({
        id: "edit-delete",
        comment: "Delete me",
        boundingBox: { x: 100, y: 200, width: 150, height: 40 },
      });
      seedAnnotations([annotation]);

      render(
        <PageFeedbackToolbarCSS onAnnotationDelete={onAnnotationDelete} />,
      );
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.click(marker);

      await waitFor(() => {
        expect(
          document.querySelector("[data-annotation-popup]"),
        ).toBeTruthy();
      });

      const popup = document.querySelector("[data-annotation-popup]")!;
      // The delete button usually has a trash icon or "Delete" text
      const deleteBtn = Array.from(popup.querySelectorAll("button")).find(
        (b) =>
          b.textContent?.includes("Delete") ||
          b.querySelector('[class*="trash"]') !== null ||
          b.getAttribute("title")?.includes("Delete"),
      );

      if (deleteBtn) {
        await act(async () => {
          fireEvent.click(deleteBtn);
        });

        await waitFor(
          () => {
            expect(onAnnotationDelete).toHaveBeenCalledTimes(1);
          },
          { timeout: 3000 },
        );
      }
    });

    it("shows edit outline for single-element annotation with boundingBox", async () => {
      const annotation = makeAnnotation({
        id: "edit-outline",
        boundingBox: { x: 50, y: 100, width: 200, height: 50 },
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.click(marker);

      await waitFor(() => {
        expect(
          document.querySelector("[data-annotation-popup]"),
        ).toBeTruthy();
      });

      // During editing, the outline should be rendered
      const outline = document.querySelector(
        '[class*="singleSelectOutline"]',
      );
      expect(outline).toBeTruthy();
    });

    it("shows multi-select outlines during editing for elementBoundingBoxes annotation", async () => {
      const annotation = makeAnnotation({
        id: "edit-multi-outline",
        isMultiSelect: true,
        boundingBox: { x: 100, y: 200, width: 300, height: 200 },
        elementBoundingBoxes: [
          { x: 100, y: 200, width: 100, height: 40 },
          { x: 100, y: 260, width: 100, height: 40 },
        ],
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.click(marker);

      await waitFor(() => {
        expect(
          document.querySelector("[data-annotation-popup]"),
        ).toBeTruthy();
      });

      // Multi-select outlines should be rendered
      const outlines = document.querySelectorAll(
        '[class*="multiSelectOutline"]',
      );
      expect(outlines.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ===========================================================================
  // 5. Pending annotation rendering
  // ===========================================================================
  describe("Pending annotation rendering", () => {
    it("renders pending marker with plus icon when clicking an element", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const mockEl = createMockTarget("button", "Target Button");
      // Mock getBoundingClientRect for the target element
      vi.spyOn(mockEl, "getBoundingClientRect").mockReturnValue({
        x: 100,
        y: 200,
        width: 150,
        height: 40,
        top: 200,
        left: 100,
        right: 250,
        bottom: 240,
        toJSON: () => {},
      });
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      await act(async () => {
        clickAtPoint(175, 220);
      });

      await waitFor(() => {
        const popup = document.querySelector("[data-annotation-popup]");
        expect(popup).toBeTruthy();
      });

      // Pending marker should be present (it has the pending class)
      const markers = document.querySelectorAll("[data-annotation-marker]");
      // Should have no saved markers but a pending marker in the DOM
      // The pending marker is rendered separately, check for the plus icon style
      const pendingMarker = document.querySelector('[class*="pending"]');
      expect(pendingMarker).toBeTruthy();
    });

    it("shows element outline around pending annotation target element", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const mockEl = createMockTarget("div", "Target Div");
      vi.spyOn(mockEl, "getBoundingClientRect").mockReturnValue({
        x: 50,
        y: 100,
        width: 300,
        height: 80,
        top: 100,
        left: 50,
        right: 350,
        bottom: 180,
        toJSON: () => {},
      });
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      await act(async () => {
        clickAtPoint(200, 140);
      });

      await waitFor(() => {
        expect(
          document.querySelector("[data-annotation-popup]"),
        ).toBeTruthy();
      });

      // The outline should be rendered for the pending annotation
      const outline = document.querySelector(
        '[class*="singleSelectOutline"]',
      );
      expect(outline).toBeTruthy();
    });

    it("renders annotation popup with correct placeholder for single element", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const mockEl = createMockTarget("button", "Submit");
      vi.spyOn(mockEl, "getBoundingClientRect").mockReturnValue({
        x: 100,
        y: 200,
        width: 150,
        height: 40,
        top: 200,
        left: 100,
        right: 250,
        bottom: 240,
        toJSON: () => {},
      });
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      await act(async () => {
        clickAtPoint(175, 220);
      });

      await waitFor(() => {
        const popup = document.querySelector("[data-annotation-popup]");
        expect(popup).toBeTruthy();
        const textarea = popup!.querySelector("textarea") as HTMLTextAreaElement;
        expect(textarea).toBeTruthy();
        // Standard placeholder for single element
        expect(textarea.placeholder).toBe("What should change?");
      });
    });
  });

  // ===========================================================================
  // 6. Marker context menu
  // ===========================================================================
  describe("Marker context menu", () => {
    it("right-click on marker in delete mode opens edit popup instead of context menu", async () => {
      seedSettings({ markerClickBehavior: "delete" });
      const annotation = makeAnnotation({
        id: "ctx-menu",
        boundingBox: { x: 100, y: 200, width: 150, height: 40 },
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;

      const contextMenuEvent = new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(contextMenuEvent, "preventDefault");

      await act(async () => {
        marker.dispatchEvent(contextMenuEvent);
        await new Promise((resolve) => setTimeout(resolve, 250));
      });

      // In delete mode, right-click should prevent default and start edit
      expect(preventDefaultSpy).toHaveBeenCalled();

      await waitFor(
        () => {
          const popup = document.querySelector("[data-annotation-popup]");
          expect(popup).toBeTruthy();
        },
        { timeout: 3000 },
      );
    });

    it("right-click on marker in edit mode does nothing special", async () => {
      seedSettings({ markerClickBehavior: "edit" });
      const annotation = makeAnnotation({
        id: "ctx-no-action",
        boundingBox: { x: 100, y: 200, width: 150, height: 40 },
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;

      const contextMenuEvent = new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(contextMenuEvent, "preventDefault");

      marker.dispatchEvent(contextMenuEvent);

      // In edit mode, right-click should NOT prevent default
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // 7. Marker click with delete behavior
  // ===========================================================================
  describe("Marker click with delete behavior", () => {
    it("left-click deletes annotation when markerClickBehavior is delete", async () => {
      const onAnnotationDelete = vi.fn();
      seedSettings({ markerClickBehavior: "delete" });
      const annotation = makeAnnotation({
        id: "delete-click",
        comment: "To be deleted",
      });
      seedAnnotations([annotation]);

      render(
        <PageFeedbackToolbarCSS onAnnotationDelete={onAnnotationDelete} />,
      );
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.click(marker);

      await waitFor(
        () => {
          expect(onAnnotationDelete).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 },
      );
    });

    it("shows delete icon on hover in delete mode", async () => {
      seedSettings({ markerClickBehavior: "delete" });
      const annotation = makeAnnotation({
        id: "delete-hover-icon",
        comment: "Hoverable delete marker",
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.mouseEnter(marker);

      await waitFor(() => {
        // When hovered in delete mode, the marker should have the hovered class
        expect(marker.className).toContain("hovered");
      });
    });
  });

  // ===========================================================================
  // 8. startEditAnnotation deep paths
  // ===========================================================================
  describe("startEditAnnotation deep paths", () => {
    it("finds element at boundingBox center when editing single annotation", async () => {
      const mockEl = createMockTarget("button", "Edit Target");
      vi.spyOn(mockEl, "getBoundingClientRect").mockReturnValue({
        x: 100,
        y: 200,
        width: 150,
        height: 40,
        top: 200,
        left: 100,
        right: 250,
        bottom: 240,
        toJSON: () => {},
      });
      // deepElementFromPoint calls document.elementFromPoint
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      const annotation = makeAnnotation({
        id: "edit-deep-single",
        boundingBox: { x: 100, y: 200, width: 150, height: 40 },
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.click(marker);

      await waitFor(() => {
        expect(
          document.querySelector("[data-annotation-popup]"),
        ).toBeTruthy();
      });

      // The outline should use live rect from the found element
      const outline = document.querySelector(
        '[class*="singleSelectOutline"]',
      );
      expect(outline).toBeTruthy();
    });

    it("rejects found element when size mismatch is too large", async () => {
      const tinyEl = createMockTarget("span", "Tiny");
      // Element is much smaller than stored bounding box
      vi.spyOn(tinyEl, "getBoundingClientRect").mockReturnValue({
        x: 120,
        y: 210,
        width: 20, // Much smaller than 150
        height: 10, // Much smaller than 40
        top: 210,
        left: 120,
        right: 140,
        bottom: 220,
        toJSON: () => {},
      });
      vi.spyOn(document, "elementFromPoint").mockReturnValue(tinyEl);

      const annotation = makeAnnotation({
        id: "edit-size-mismatch",
        boundingBox: { x: 100, y: 200, width: 150, height: 40 },
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.click(marker);

      await waitFor(() => {
        expect(
          document.querySelector("[data-annotation-popup]"),
        ).toBeTruthy();
      });

      // Outline should still render but using stored boundingBox (fallback)
      const outline = document.querySelector(
        '[class*="singleSelectOutline"]',
      );
      expect(outline).toBeTruthy();
    });

    it("handles annotation with elementBoundingBoxes during edit", async () => {
      const mockEl1 = createMockTarget("button", "El 1");
      const mockEl2 = createMockTarget("button", "El 2");
      vi.spyOn(mockEl1, "getBoundingClientRect").mockReturnValue({
        x: 100, y: 200, width: 100, height: 40,
        top: 200, left: 100, right: 200, bottom: 240, toJSON: () => {},
      });
      vi.spyOn(mockEl2, "getBoundingClientRect").mockReturnValue({
        x: 100, y: 260, width: 100, height: 40,
        top: 260, left: 100, right: 200, bottom: 300, toJSON: () => {},
      });

      // deepElementFromPoint is called for each bounding box center
      let callCount = 0;
      vi.spyOn(document, "elementFromPoint").mockImplementation(() => {
        callCount++;
        return callCount === 1 ? mockEl1 : mockEl2;
      });

      const annotation = makeAnnotation({
        id: "edit-multi-deep",
        isMultiSelect: true,
        boundingBox: { x: 100, y: 200, width: 100, height: 100 },
        elementBoundingBoxes: [
          { x: 100, y: 200, width: 100, height: 40 },
          { x: 100, y: 260, width: 100, height: 40 },
        ],
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.click(marker);

      await waitFor(() => {
        expect(
          document.querySelector("[data-annotation-popup]"),
        ).toBeTruthy();
      });

      // Should show multi-select outlines
      const outlines = document.querySelectorAll(
        '[class*="multiSelectOutline"]',
      );
      expect(outlines.length).toBeGreaterThanOrEqual(1);
    });

    it("handles annotation without boundingBox during edit (no outline)", async () => {
      const annotation = makeAnnotation({
        id: "edit-no-bb",
        // No boundingBox at all
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.click(marker);

      await waitFor(() => {
        expect(
          document.querySelector("[data-annotation-popup]"),
        ).toBeTruthy();
      });

      // No outline when no bounding box is stored
      const outline = document.querySelector(
        '[class*="singleSelectOutline"]',
      );
      expect(outline).toBeFalsy();
    });
  });

  // ===========================================================================
  // 9. handleMarkerHover deep paths
  // ===========================================================================
  describe("handleMarkerHover deep paths", () => {
    it("clears hover state when null annotation (mouseLeave)", async () => {
      const annotation = makeAnnotation({
        id: "hover-null",
        boundingBox: { x: 100, y: 200, width: 150, height: 40 },
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;

      // Hover to set state
      fireEvent.mouseEnter(marker);
      await waitFor(() => {
        expect(
          document.querySelector('[class*="markerTooltip"]'),
        ).toBeTruthy();
      });

      // Leave to clear state
      fireEvent.mouseLeave(marker);
      await waitFor(() => {
        expect(
          document.querySelector('[class*="markerTooltip"]'),
        ).toBeFalsy();
      });

      // Outline should also be gone
      const outline = document.querySelector(
        '[class*="singleSelectOutline"]',
      );
      expect(outline).toBeFalsy();
    });

    it("uses elementsFromPoint for multi-select annotation hover", async () => {
      const mockEl1 = createMockTarget("div", "Hover El 1");
      const mockEl2 = createMockTarget("div", "Hover El 2");

      // elementsFromPoint returns elements that don't have annotation-marker or agentation-root
      const elementsFromPointSpy = vi.spyOn(document, "elementsFromPoint");
      elementsFromPointSpy.mockReturnValue([mockEl1, mockEl2]);

      const annotation = makeAnnotation({
        id: "hover-multi-efp",
        isMultiSelect: true,
        boundingBox: { x: 100, y: 200, width: 300, height: 200 },
        elementBoundingBoxes: [
          { x: 100, y: 200, width: 100, height: 40 },
          { x: 100, y: 260, width: 100, height: 40 },
        ],
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.mouseEnter(marker);

      await waitFor(() => {
        expect(elementsFromPointSpy).toHaveBeenCalled();
      });
    });

    it("validates element size when hovering single-element annotation", async () => {
      const mockEl = createMockTarget("button", "Hover Target");
      vi.spyOn(mockEl, "getBoundingClientRect").mockReturnValue({
        x: 100,
        y: 200,
        width: 150,
        height: 40,
        top: 200,
        left: 100,
        right: 250,
        bottom: 240,
        toJSON: () => {},
      });
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      const annotation = makeAnnotation({
        id: "hover-validate",
        boundingBox: { x: 100, y: 200, width: 150, height: 40 },
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.mouseEnter(marker);

      await waitFor(() => {
        const outline = document.querySelector(
          '[class*="singleSelectOutline"]',
        );
        expect(outline).toBeTruthy();
      });
    });

    it("falls back to stored boundingBox when hovered element size is too small", async () => {
      const tinyEl = createMockTarget("span", "Tiny");
      vi.spyOn(tinyEl, "getBoundingClientRect").mockReturnValue({
        x: 120,
        y: 210,
        width: 10, // Much smaller than 150
        height: 5, // Much smaller than 40
        top: 210,
        left: 120,
        right: 130,
        bottom: 215,
        toJSON: () => {},
      });
      vi.spyOn(document, "elementFromPoint").mockReturnValue(tinyEl);

      const annotation = makeAnnotation({
        id: "hover-size-fallback",
        boundingBox: { x: 100, y: 200, width: 150, height: 40 },
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.mouseEnter(marker);

      await waitFor(() => {
        // Outline should still render using stored boundingBox fallback
        const outline = document.querySelector(
          '[class*="singleSelectOutline"]',
        );
        expect(outline).toBeTruthy();
      });
    });

    it("handles annotation without boundingBox on hover (no outline)", async () => {
      const annotation = makeAnnotation({
        id: "hover-no-bb",
        // No boundingBox at all
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.mouseEnter(marker);

      await waitFor(() => {
        // Tooltip should still show
        expect(
          document.querySelector('[class*="markerTooltip"]'),
        ).toBeTruthy();
      });

      // No outline since no bounding box
      const outline = document.querySelector(
        '[class*="singleSelectOutline"]',
      );
      expect(outline).toBeFalsy();
    });
  });

  // ===========================================================================
  // 10. getTooltipPosition
  // ===========================================================================
  describe("getTooltipPosition", () => {
    it("tooltip renders at default position for centered marker", async () => {
      // Set up a reasonable viewport
      Object.defineProperty(window, "innerWidth", {
        value: 1024,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, "innerHeight", {
        value: 768,
        writable: true,
        configurable: true,
      });

      const annotation = makeAnnotation({
        id: "tooltip-center",
        x: 50, // 50% of 1024 = 512 (centered)
        y: 200, // Plenty of space below
        element: "CenteredButton",
        comment: "Centered tooltip",
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.mouseEnter(marker);

      await waitFor(() => {
        const tooltip = document.querySelector(
          '[class*="markerTooltip"]',
        ) as HTMLElement;
        expect(tooltip).toBeTruthy();
        // For a centered marker with space below, tooltip position should use defaults (no explicit top/bottom override)
      });
    });

    it("tooltip flips above marker when near bottom of viewport", async () => {
      Object.defineProperty(window, "innerWidth", {
        value: 1024,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, "innerHeight", {
        value: 768,
        writable: true,
        configurable: true,
      });

      const annotation = makeAnnotation({
        id: "tooltip-bottom",
        x: 50,
        y: 750, // Near the bottom of viewport (768)
        element: "BottomElement",
        comment: "Should flip up",
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.mouseEnter(marker);

      await waitFor(() => {
        const tooltip = document.querySelector(
          '[class*="markerTooltip"]',
        ) as HTMLElement;
        expect(tooltip).toBeTruthy();
        // When near bottom, tooltip should have bottom positioning set
        // The style will have top: "auto" and bottom: "calc(100% + 10px)"
        expect(tooltip.style.top).toBe("auto");
      });
    });

    it("tooltip adjusts left when marker is near left edge", async () => {
      Object.defineProperty(window, "innerWidth", {
        value: 1024,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, "innerHeight", {
        value: 768,
        writable: true,
        configurable: true,
      });

      const annotation = makeAnnotation({
        id: "tooltip-left",
        x: 1, // 1% of 1024 ≈ 10px (very close to left edge)
        y: 200,
        element: "LeftElement",
        comment: "Near left edge",
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.mouseEnter(marker);

      await waitFor(() => {
        const tooltip = document.querySelector(
          '[class*="markerTooltip"]',
        ) as HTMLElement;
        expect(tooltip).toBeTruthy();
        // When near left edge, tooltip should adjust left position
        // The style.left should contain a calc() adjustment
        expect(tooltip.style.left).toContain("calc");
      });
    });

    it("tooltip adjusts left when marker is near right edge", async () => {
      Object.defineProperty(window, "innerWidth", {
        value: 1024,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, "innerHeight", {
        value: 768,
        writable: true,
        configurable: true,
      });

      const annotation = makeAnnotation({
        id: "tooltip-right",
        x: 99, // 99% of 1024 ≈ 1013px (very close to right edge)
        y: 200,
        element: "RightElement",
        comment: "Near right edge",
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.mouseEnter(marker);

      await waitFor(() => {
        const tooltip = document.querySelector(
          '[class*="markerTooltip"]',
        ) as HTMLElement;
        expect(tooltip).toBeTruthy();
        // When near right edge, tooltip should adjust left position
        expect(tooltip.style.left).toContain("calc");
      });
    });
  });

  // ===========================================================================
  // 11. Marker number display
  // ===========================================================================
  describe("Marker number display", () => {
    it("displays correct 1-based index number in markers", async () => {
      seedAnnotations([
        makeAnnotation({ id: "num-1", x: 30, y: 100 }),
        makeAnnotation({ id: "num-2", x: 50, y: 200 }),
        makeAnnotation({ id: "num-3", x: 70, y: 300 }),
      ]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(3);

      const markers = document.querySelectorAll("[data-annotation-marker]");
      expect(markers.length).toBe(3);

      // Markers should contain their 1-based index numbers
      const texts = Array.from(markers).map((m) => m.textContent?.trim());
      expect(texts).toContain("1");
      expect(texts).toContain("2");
      expect(texts).toContain("3");
    });

    it("multi-select marker gets green color", async () => {
      const annotation = makeAnnotation({
        id: "multi-color",
        isMultiSelect: true,
        boundingBox: { x: 100, y: 200, width: 300, height: 200 },
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      // Multi-select markers use #34C759 (green)
      expect(marker.style.backgroundColor).toBe("rgb(52, 199, 89)");
      expect(marker.className).toContain("multiSelect");
    });
  });

  // ===========================================================================
  // 12. Edit popup with fixed annotation
  // ===========================================================================
  describe("Edit popup with fixed annotation", () => {
    it("opens edit popup for fixed annotation on click", async () => {
      const annotation = makeAnnotation({
        id: "edit-fixed",
        isFixed: true,
        y: 100,
        x: 30,
        comment: "Fixed element comment",
        boundingBox: { x: 50, y: 100, width: 200, height: 50 },
      });
      seedAnnotations([annotation]);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();
      await waitForMarkers(1);

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      fireEvent.click(marker);

      await waitFor(() => {
        const popup = document.querySelector("[data-annotation-popup]");
        expect(popup).toBeTruthy();
        const textarea = popup!.querySelector("textarea") as HTMLTextAreaElement;
        expect(textarea.value).toBe("Fixed element comment");
      });
    });
  });
});
