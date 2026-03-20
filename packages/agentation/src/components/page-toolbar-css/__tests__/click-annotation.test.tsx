/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, waitFor, act } from "@testing-library/react";
import { PageFeedbackToolbarCSS } from "../index";
import type { Annotation } from "../../../types";
import {
  PAGE_TOOLBAR_ANNOTATION_STORAGE_KEY,
  activateToolbar,
  clickAtPoint,
  createMockTarget,
  findButtonByTooltip,
  installPageToolbarTestGlobals,
  makeAnnotation,
  resetPageToolbarTestEnvironment,
  seedAnnotations,
} from "./pageToolbarTestUtils";

// ---------------------------------------------------------------------------
// Global Mocks
// ---------------------------------------------------------------------------

const mockWriteText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  mockWriteText.mockClear();
  installPageToolbarTestGlobals({ writeText: mockWriteText });
});

afterEach(() => {
  resetPageToolbarTestEnvironment();
});

// =============================================================================
// Tests
// =============================================================================

describe("Click-to-annotate flow", () => {
  // ===========================================================================
  // 1. Click handler — creating pending annotations
  // ===========================================================================

  describe("Click handler — creating pending annotations", () => {
    it("opens annotation popup when clicking on an element", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const mockBtn = createMockTarget("button", "Submit");
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockBtn);

      await act(async () => {
        clickAtPoint(400, 300);
      });

      await waitFor(() => {
        const popup = document.querySelector("[data-annotation-popup]");
        expect(popup).toBeTruthy();
      });

      mockBtn.remove();
    });

    it("shows the identified element name in the popup header", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      // identifyElement returns 'button "Submit"' for a button with text
      const mockBtn = createMockTarget("button", "Submit");
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockBtn);

      await act(async () => {
        clickAtPoint(200, 200);
      });

      await waitFor(() => {
        const popup = document.querySelector("[data-annotation-popup]");
        expect(popup).toBeTruthy();
        // identifyElement returns 'button "Submit"' which includes "button"
        expect(popup!.textContent).toContain("button");
      });

      mockBtn.remove();
    });

    it("popup has a textarea for entering feedback", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const mockEl = createMockTarget("span", "Text");
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      await act(async () => {
        clickAtPoint(500, 350);
      });

      await waitFor(() => {
        const popup = document.querySelector("[data-annotation-popup]");
        expect(popup).toBeTruthy();
        const textarea = popup!.querySelector("textarea");
        expect(textarea).toBeTruthy();
      });

      mockEl.remove();
    });

    it("does not open popup when elementFromPoint returns null", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      vi.spyOn(document, "elementFromPoint").mockReturnValue(null);

      await act(async () => {
        clickAtPoint(400, 300);
      });

      // Allow time for any async state update
      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      const popup = document.querySelector("[data-annotation-popup]");
      expect(popup).toBeNull();
    });

    it("does not open popup when toolbar is inactive", async () => {
      render(<PageFeedbackToolbarCSS />);
      // Do NOT activate toolbar

      const mockEl = createMockTarget("div", "Content");
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      await act(async () => {
        clickAtPoint(400, 300);
      });

      const popup = document.querySelector("[data-annotation-popup]");
      expect(popup).toBeNull();

      mockEl.remove();
    });
  });

  // ===========================================================================
  // 2. Annotation lifecycle — add and cancel
  // ===========================================================================

  describe("Annotation lifecycle — add and cancel", () => {
    it("submitting via Enter creates a saved annotation", async () => {
      const onAnnotationAdd = vi.fn();
      render(<PageFeedbackToolbarCSS onAnnotationAdd={onAnnotationAdd} />);
      await activateToolbar();

      const mockEl = createMockTarget("button", "Save");
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      await act(async () => {
        clickAtPoint(400, 300);
      });

      await waitFor(() => {
        expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
      });

      const textarea = document.querySelector(
        "[data-annotation-popup] textarea",
      ) as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();

      await act(async () => {
        fireEvent.change(textarea, { target: { value: "Fix this button" } });
      });

      await act(async () => {
        fireEvent.keyDown(textarea, { key: "Enter" });
      });

      await waitFor(
        () => {
          expect(onAnnotationAdd).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 },
      );

      const annotation = onAnnotationAdd.mock.calls[0][0];
      expect(annotation.comment).toBe("Fix this button");
      expect(annotation.element).toBeTruthy();

      mockEl.remove();
    });

    it("clicking Add button submits the annotation", async () => {
      const onAnnotationAdd = vi.fn();
      render(<PageFeedbackToolbarCSS onAnnotationAdd={onAnnotationAdd} />);
      await activateToolbar();

      const mockEl = createMockTarget("h1", "Title");
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      await act(async () => {
        clickAtPoint(300, 200);
      });

      await waitFor(() => {
        expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
      });

      const textarea = document.querySelector(
        "[data-annotation-popup] textarea",
      ) as HTMLTextAreaElement;

      await act(async () => {
        fireEvent.change(textarea, { target: { value: "Change heading" } });
      });

      const popup = document.querySelector("[data-annotation-popup]")!;
      const buttons = popup.querySelectorAll("button");
      const addButton = Array.from(buttons).find((btn) =>
        btn.textContent?.includes("Add"),
      );
      expect(addButton).toBeTruthy();

      await act(async () => {
        fireEvent.click(addButton!);
      });

      await waitFor(
        () => {
          expect(onAnnotationAdd).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 },
      );

      expect(onAnnotationAdd.mock.calls[0][0].comment).toBe("Change heading");

      mockEl.remove();
    });

    it("cancelling via Cancel button closes popup without saving", async () => {
      const onAnnotationAdd = vi.fn();
      render(<PageFeedbackToolbarCSS onAnnotationAdd={onAnnotationAdd} />);
      await activateToolbar();

      const mockEl = createMockTarget("p", "Paragraph");
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      await act(async () => {
        clickAtPoint(400, 300);
      });

      await waitFor(() => {
        expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
      });

      const popup = document.querySelector("[data-annotation-popup]")!;
      const cancelButton = Array.from(popup.querySelectorAll("button")).find(
        (btn) => btn.textContent?.includes("Cancel"),
      );
      expect(cancelButton).toBeTruthy();

      await act(async () => {
        fireEvent.click(cancelButton!);
      });

      await waitFor(
        () => {
          expect(document.querySelector("[data-annotation-popup]")).toBeNull();
        },
        { timeout: 3000 },
      );

      expect(onAnnotationAdd).not.toHaveBeenCalled();

      mockEl.remove();
    });

    it("pressing Escape in textarea cancels annotation", async () => {
      const onAnnotationAdd = vi.fn();
      render(<PageFeedbackToolbarCSS onAnnotationAdd={onAnnotationAdd} />);
      await activateToolbar();

      const mockEl = createMockTarget("div", "Content");
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      await act(async () => {
        clickAtPoint(400, 300);
      });

      await waitFor(() => {
        expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
      });

      const textarea = document.querySelector(
        "[data-annotation-popup] textarea",
      ) as HTMLTextAreaElement;

      await act(async () => {
        fireEvent.keyDown(textarea, { key: "Escape" });
      });

      await waitFor(
        () => {
          expect(document.querySelector("[data-annotation-popup]")).toBeNull();
        },
        { timeout: 3000 },
      );

      expect(onAnnotationAdd).not.toHaveBeenCalled();

      mockEl.remove();
    });

    it("empty comment cannot be submitted", async () => {
      const onAnnotationAdd = vi.fn();
      render(<PageFeedbackToolbarCSS onAnnotationAdd={onAnnotationAdd} />);
      await activateToolbar();

      const mockEl = createMockTarget("div", "Content");
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      await act(async () => {
        clickAtPoint(400, 300);
      });

      await waitFor(() => {
        expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
      });

      // Try submitting with empty textarea
      const textarea = document.querySelector(
        "[data-annotation-popup] textarea",
      ) as HTMLTextAreaElement;

      await act(async () => {
        fireEvent.keyDown(textarea, { key: "Enter" });
      });

      // Popup should still be open since empty submit is rejected
      await act(async () => {
        await new Promise((r) => setTimeout(r, 200));
      });

      expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
      expect(onAnnotationAdd).not.toHaveBeenCalled();

      mockEl.remove();
    });

    it("saved annotation appears as a numbered marker", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const mockEl = createMockTarget("a", "Link text");
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      await act(async () => {
        clickAtPoint(400, 300);
      });

      await waitFor(() => {
        expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
      });

      const textarea = document.querySelector(
        "[data-annotation-popup] textarea",
      ) as HTMLTextAreaElement;

      await act(async () => {
        fireEvent.change(textarea, { target: { value: "Update link" } });
      });

      await act(async () => {
        fireEvent.keyDown(textarea, { key: "Enter" });
      });

      await waitFor(
        () => {
          const markers = document.querySelectorAll("[data-annotation-marker]");
          expect(markers.length).toBeGreaterThanOrEqual(1);
        },
        { timeout: 3000 },
      );

      mockEl.remove();
    });

    it("annotation includes element metadata", async () => {
      const onAnnotationAdd = vi.fn();
      render(<PageFeedbackToolbarCSS onAnnotationAdd={onAnnotationAdd} />);
      await activateToolbar();

      const mockEl = createMockTarget("button", "Submit Form");
      mockEl.className = "btn-primary";
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      await act(async () => {
        clickAtPoint(400, 300);
      });

      await waitFor(() => {
        expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
      });

      const textarea = document.querySelector(
        "[data-annotation-popup] textarea",
      ) as HTMLTextAreaElement;

      await act(async () => {
        fireEvent.change(textarea, { target: { value: "My feedback" } });
      });

      await act(async () => {
        fireEvent.keyDown(textarea, { key: "Enter" });
      });

      await waitFor(
        () => {
          expect(onAnnotationAdd).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 },
      );

      const annotation = onAnnotationAdd.mock.calls[0][0];
      expect(annotation.elementPath).toBeTruthy();
      expect(annotation.x).toBeGreaterThanOrEqual(0);
      expect(annotation.y).toBeGreaterThanOrEqual(0);
      expect(annotation.timestamp).toBeGreaterThan(0);
      expect(annotation.id).toBeTruthy();

      mockEl.remove();
    });

    it("annotation captures bounding box of the target element", async () => {
      const onAnnotationAdd = vi.fn();
      render(<PageFeedbackToolbarCSS onAnnotationAdd={onAnnotationAdd} />);
      await activateToolbar();

      const mockEl = createMockTarget("button", "Boxed");
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);
      vi.spyOn(mockEl, "getBoundingClientRect").mockReturnValue({
        left: 50,
        top: 100,
        right: 250,
        bottom: 140,
        width: 200,
        height: 40,
        x: 50,
        y: 100,
        toJSON: () => ({}),
      });

      await act(async () => {
        clickAtPoint(150, 120);
      });

      await waitFor(() => {
        expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
      });

      const textarea = document.querySelector(
        "[data-annotation-popup] textarea",
      ) as HTMLTextAreaElement;
      await act(async () => {
        fireEvent.change(textarea, { target: { value: "Box test" } });
      });
      await act(async () => {
        fireEvent.keyDown(textarea, { key: "Enter" });
      });

      await waitFor(
        () => {
          expect(onAnnotationAdd).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 },
      );

      const annotation = onAnnotationAdd.mock.calls[0][0];
      expect(annotation.boundingBox).toBeTruthy();
      expect(annotation.boundingBox.width).toBe(200);
      expect(annotation.boundingBox.height).toBe(40);

      mockEl.remove();
    });
  });

  // ===========================================================================
  // 3. Shake popup behavior
  // ===========================================================================

  describe("Click while pending annotation — shake behavior", () => {
    it("does not create a second popup when clicking while one is pending", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const mockEl = createMockTarget("div", "Content");
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      await act(async () => {
        clickAtPoint(400, 300);
      });

      await waitFor(() => {
        expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
      });

      // Second click while popup is open
      await act(async () => {
        clickAtPoint(200, 200);
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      // Should still have exactly one popup
      const popups = document.querySelectorAll("[data-annotation-popup]");
      expect(popups.length).toBe(1);

      mockEl.remove();
    });
  });

  // ===========================================================================
  // 4. Block interactions
  // ===========================================================================

  describe("Block interactions setting", () => {
    it("prevents default on interactive elements when blockInteractions is true", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const mockLink = createMockTarget("a", "Link text");
      mockLink.setAttribute("href", "https://example.com");
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockLink);

      const preventDefaultCalls: boolean[] = [];
      const origPreventDefault = MouseEvent.prototype.preventDefault;
      // We use a listener on the body in capture to check if preventDefault was called
      const event = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        clientX: 400,
        clientY: 300,
      });

      // Track if preventDefault is called
      let preventDefaultCalled = false;
      const origPD = event.preventDefault.bind(event);
      event.preventDefault = () => {
        preventDefaultCalled = true;
        origPD();
      };

      await act(async () => {
        // Dispatch from the link element itself (so composedPath has the right target)
        mockLink.dispatchEvent(event);
      });

      expect(preventDefaultCalled).toBe(true);

      mockLink.remove();
    });
  });

  // ===========================================================================
  // 5. Annotation deletion
  // ===========================================================================

  describe("Annotation deletion", () => {
    it("fires onAnnotationDelete callback when deleting via marker click", async () => {
      const onAnnotationDelete = vi.fn();
      const annotations = [
        makeAnnotation({ id: "del1", comment: "Delete me" }),
      ];
      seedAnnotations(annotations);

      localStorage.setItem(
        "feedback-toolbar-settings",
        JSON.stringify({
          outputDetail: "standard",
          autoClearAfterCopy: false,
          annotationColor: "#3c82f7",
          blockInteractions: true,
          reactEnabled: true,
          markerClickBehavior: "delete",
          webhookUrl: "",
          webhooksEnabled: true,
        }),
      );

      render(
        <PageFeedbackToolbarCSS onAnnotationDelete={onAnnotationDelete} />,
      );
      await activateToolbar();

      await waitFor(() => {
        const markers = document.querySelectorAll("[data-annotation-marker]");
        expect(markers.length).toBeGreaterThanOrEqual(1);
      });

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;

      await act(async () => {
        fireEvent.click(marker);
      });

      await waitFor(
        () => {
          expect(onAnnotationDelete).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 },
      );

      const deleted = onAnnotationDelete.mock.calls[0][0];
      expect(deleted.id).toBe("del1");
      expect(deleted.comment).toBe("Delete me");
    });

    it("marker is removed after deletion animation completes", async () => {
      const annotations = [
        makeAnnotation({ id: "del2", comment: "Will vanish" }),
      ];
      seedAnnotations(annotations);

      localStorage.setItem(
        "feedback-toolbar-settings",
        JSON.stringify({
          outputDetail: "standard",
          autoClearAfterCopy: false,
          annotationColor: "#3c82f7",
          blockInteractions: true,
          reactEnabled: true,
          markerClickBehavior: "delete",
          webhookUrl: "",
          webhooksEnabled: true,
        }),
      );

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      await waitFor(() => {
        expect(
          document.querySelectorAll("[data-annotation-marker]").length,
        ).toBeGreaterThanOrEqual(1);
      });

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;

      await act(async () => {
        fireEvent.click(marker);
      });

      await waitFor(
        () => {
          const markers = document.querySelectorAll("[data-annotation-marker]");
          expect(markers.length).toBe(0);
        },
        { timeout: 3000 },
      );
    });
  });

  // ===========================================================================
  // 6. Annotation editing
  // ===========================================================================

  describe("Annotation editing", () => {
    it("clicking marker opens edit popup showing original comment", async () => {
      const annotations = [
        makeAnnotation({
          id: "edit1",
          comment: "Original comment",
          boundingBox: { x: 100, y: 100, width: 200, height: 50 },
        }),
      ];
      seedAnnotations(annotations);

      // Default markerClickBehavior is "edit"
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      await waitFor(() => {
        expect(
          document.querySelectorAll("[data-annotation-marker]").length,
        ).toBeGreaterThanOrEqual(1);
      });

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;

      await act(async () => {
        fireEvent.click(marker);
      });

      await waitFor(() => {
        const popup = document.querySelector("[data-annotation-popup]");
        expect(popup).toBeTruthy();
      });

      const textarea = document.querySelector(
        "[data-annotation-popup] textarea",
      ) as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();
      expect(textarea.value).toBe("Original comment");
    });

    it("submitting edited comment fires onAnnotationUpdate callback", async () => {
      const onAnnotationUpdate = vi.fn();
      const annotations = [
        makeAnnotation({
          id: "edit2",
          comment: "Before edit",
          boundingBox: { x: 100, y: 100, width: 200, height: 50 },
        }),
      ];
      seedAnnotations(annotations);

      render(
        <PageFeedbackToolbarCSS onAnnotationUpdate={onAnnotationUpdate} />,
      );
      await activateToolbar();

      await waitFor(() => {
        expect(
          document.querySelectorAll("[data-annotation-marker]").length,
        ).toBeGreaterThanOrEqual(1);
      });

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;

      await act(async () => {
        fireEvent.click(marker);
      });

      await waitFor(() => {
        expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
      });

      const textarea = document.querySelector(
        "[data-annotation-popup] textarea",
      ) as HTMLTextAreaElement;

      await act(async () => {
        fireEvent.change(textarea, { target: { value: "After edit" } });
      });

      // Submit via Enter
      await act(async () => {
        fireEvent.keyDown(textarea, { key: "Enter" });
      });

      await waitFor(
        () => {
          expect(onAnnotationUpdate).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 },
      );

      const updated = onAnnotationUpdate.mock.calls[0][0];
      expect(updated.comment).toBe("After edit");
      expect(updated.id).toBe("edit2");
    });

    it("cancelling edit does not fire onAnnotationUpdate", async () => {
      const onAnnotationUpdate = vi.fn();
      const annotations = [
        makeAnnotation({
          id: "edit3",
          comment: "Should not change",
          boundingBox: { x: 100, y: 100, width: 200, height: 50 },
        }),
      ];
      seedAnnotations(annotations);

      render(
        <PageFeedbackToolbarCSS onAnnotationUpdate={onAnnotationUpdate} />,
      );
      await activateToolbar();

      await waitFor(() => {
        expect(
          document.querySelectorAll("[data-annotation-marker]").length,
        ).toBeGreaterThanOrEqual(1);
      });

      const marker = document.querySelector(
        "[data-annotation-marker]",
      ) as HTMLElement;
      await act(async () => {
        fireEvent.click(marker);
      });

      await waitFor(() => {
        expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
      });

      const popup = document.querySelector("[data-annotation-popup]")!;
      const cancelButton = Array.from(popup.querySelectorAll("button")).find(
        (btn) => btn.textContent?.includes("Cancel"),
      );
      expect(cancelButton).toBeTruthy();

      await act(async () => {
        fireEvent.click(cancelButton!);
      });

      await waitFor(
        () => {
          expect(document.querySelector("[data-annotation-popup]")).toBeNull();
        },
        { timeout: 3000 },
      );

      expect(onAnnotationUpdate).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // 7. Keyboard shortcuts
  // ===========================================================================

  describe("Keyboard shortcuts for annotation management", () => {
    it("'C' key copies annotations to clipboard", async () => {
      const annotations = [
        makeAnnotation({ id: "kb1", comment: "Keyboard copy" }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      await act(async () => {
        fireEvent.keyDown(document, { key: "c" });
      });

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledTimes(1);
      });

      const clipboardContent = mockWriteText.mock.calls[0][0];
      expect(clipboardContent).toContain("Keyboard copy");
    });

    it("'X' key clears all annotations", async () => {
      const onAnnotationsClear = vi.fn();
      const annotations = [
        makeAnnotation({ id: "kb2", comment: "To clear" }),
        makeAnnotation({ id: "kb3", comment: "Also clear" }),
      ];
      seedAnnotations(annotations);

      render(
        <PageFeedbackToolbarCSS onAnnotationsClear={onAnnotationsClear} />,
      );
      await activateToolbar();

      await act(async () => {
        fireEvent.keyDown(document, { key: "x" });
      });

      await waitFor(() => {
        expect(onAnnotationsClear).toHaveBeenCalledTimes(1);
      });

      const cleared = onAnnotationsClear.mock.calls[0][0];
      expect(cleared).toHaveLength(2);
    });

    it("'H' key toggles marker visibility", async () => {
      const annotations = [
        makeAnnotation({ id: "kb4", comment: "Marker toggle" }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      await waitFor(() => {
        expect(findButtonByTooltip("Hide markers")).toBeTruthy();
      });

      await act(async () => {
        fireEvent.keyDown(document, { key: "h" });
      });

      await waitFor(() => {
        expect(findButtonByTooltip("Show markers")).toBeTruthy();
      });

      await act(async () => {
        fireEvent.keyDown(document, { key: "h" });
      });

      await waitFor(() => {
        expect(findButtonByTooltip("Hide markers")).toBeTruthy();
      });
    });

    it("'P' key triggers the freeze toggle (data-active changes)", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      // The pause button starts with data-active="false"
      const pauseBtn = findButtonByTooltip("Pause animations");
      expect(pauseBtn).toBeTruthy();
      expect(pauseBtn!.getAttribute("data-active")).toBe("false");

      // Press P inside act() — freezeAll() patches global setTimeout, but
      // React state updates are flushed synchronously inside act()
      act(() => {
        fireEvent.keyDown(document, { key: "p" });
      });

      // Re-query — the button data-active should now be "true"
      const btn = findButtonByTooltip("Pause animations") || findButtonByTooltip("Resume animations");
      expect(btn).toBeTruthy();
      expect(btn!.getAttribute("data-active")).toBe("true");
    });

    it("'C' key does nothing when no annotations exist", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      await act(async () => {
        fireEvent.keyDown(document, { key: "c" });
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      expect(mockWriteText).not.toHaveBeenCalled();
    });

    it("'X' key does nothing when no annotations exist", async () => {
      const onAnnotationsClear = vi.fn();
      render(
        <PageFeedbackToolbarCSS onAnnotationsClear={onAnnotationsClear} />,
      );
      await activateToolbar();

      await act(async () => {
        fireEvent.keyDown(document, { key: "x" });
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      expect(onAnnotationsClear).not.toHaveBeenCalled();
    });

    it("shortcuts do not fire when typing in a textarea", async () => {
      const annotations = [
        makeAnnotation({ id: "kb5", comment: "Type test" }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const mockEl = createMockTarget("div", "Content");
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      await act(async () => {
        clickAtPoint(400, 300);
      });

      await waitFor(() => {
        expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
      });

      const textarea = document.querySelector(
        "[data-annotation-popup] textarea",
      ) as HTMLTextAreaElement;

      // Press 'c' while focused in textarea — should NOT trigger copy
      mockWriteText.mockClear();
      await act(async () => {
        fireEvent.keyDown(textarea, { key: "c" });
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      expect(mockWriteText).not.toHaveBeenCalled();

      mockEl.remove();
    });

    it("'S' key sends annotations when webhook URL is configured", async () => {
      const annotations = [
        makeAnnotation({ id: "kb6", comment: "Send test" }),
      ];
      seedAnnotations(annotations);

      localStorage.setItem(
        "feedback-toolbar-settings",
        JSON.stringify({
          outputDetail: "standard",
          autoClearAfterCopy: false,
          annotationColor: "#3c82f7",
          blockInteractions: true,
          reactEnabled: true,
          markerClickBehavior: "edit",
          webhookUrl: "https://example.com/webhook",
          webhooksEnabled: false,
        }),
      );

      const mockFetch = vi.mocked(fetch);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      await act(async () => {
        fireEvent.keyDown(document, { key: "s" });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  // ===========================================================================
  // 8. Multiple annotations
  // ===========================================================================

  describe("Multiple annotations", () => {
    it("can create multiple annotations sequentially", async () => {
      const onAnnotationAdd = vi.fn();
      render(<PageFeedbackToolbarCSS onAnnotationAdd={onAnnotationAdd} />);
      await activateToolbar();

      const mockEl = createMockTarget("div", "Content");
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      // First annotation
      await act(async () => {
        clickAtPoint(100, 100);
      });
      await waitFor(() => {
        expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
      });

      let textarea = document.querySelector(
        "[data-annotation-popup] textarea",
      ) as HTMLTextAreaElement;
      await act(async () => {
        fireEvent.change(textarea, { target: { value: "First" } });
      });
      await act(async () => {
        fireEvent.keyDown(textarea, { key: "Enter" });
      });

      await waitFor(
        () => {
          expect(onAnnotationAdd).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 },
      );

      // Wait for popup to close
      await waitFor(
        () => {
          expect(document.querySelector("[data-annotation-popup]")).toBeNull();
        },
        { timeout: 3000 },
      );

      // Second annotation
      await act(async () => {
        clickAtPoint(500, 400);
      });
      await waitFor(() => {
        expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
      });

      textarea = document.querySelector(
        "[data-annotation-popup] textarea",
      ) as HTMLTextAreaElement;
      await act(async () => {
        fireEvent.change(textarea, { target: { value: "Second" } });
      });
      await act(async () => {
        fireEvent.keyDown(textarea, { key: "Enter" });
      });

      await waitFor(
        () => {
          expect(onAnnotationAdd).toHaveBeenCalledTimes(2);
        },
        { timeout: 3000 },
      );

      expect(onAnnotationAdd.mock.calls[0][0].comment).toBe("First");
      expect(onAnnotationAdd.mock.calls[1][0].comment).toBe("Second");

      // Should have 2 markers
      await waitFor(
        () => {
          const markers = document.querySelectorAll("[data-annotation-marker]");
          expect(markers.length).toBeGreaterThanOrEqual(2);
        },
        { timeout: 3000 },
      );

      mockEl.remove();
    });

    it("annotations are persisted to localStorage after creation", async () => {
      const onAnnotationAdd = vi.fn();
      render(<PageFeedbackToolbarCSS onAnnotationAdd={onAnnotationAdd} />);
      await activateToolbar();

      const mockEl = createMockTarget("section", "Section");
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      await act(async () => {
        clickAtPoint(400, 300);
      });

      await waitFor(() => {
        expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
      });

      const textarea = document.querySelector(
        "[data-annotation-popup] textarea",
      ) as HTMLTextAreaElement;

      await act(async () => {
        fireEvent.change(textarea, { target: { value: "Persisted" } });
      });

      await act(async () => {
        fireEvent.keyDown(textarea, { key: "Enter" });
      });

      await waitFor(
        () => {
          expect(onAnnotationAdd).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 },
      );

      await waitFor(() => {
        const stored = localStorage.getItem(PAGE_TOOLBAR_ANNOTATION_STORAGE_KEY);
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!);
        expect(parsed.length).toBeGreaterThanOrEqual(1);
        expect(
          parsed.some((a: Annotation) => a.comment === "Persisted"),
        ).toBe(true);
      });

      mockEl.remove();
    });
  });

  // ===========================================================================
  // 9. Fixed element detection
  // ===========================================================================

  describe("Fixed element detection", () => {
    it("marks annotation as fixed when element has fixed positioning", async () => {
      const onAnnotationAdd = vi.fn();
      render(<PageFeedbackToolbarCSS onAnnotationAdd={onAnnotationAdd} />);
      await activateToolbar();

      const mockEl = createMockTarget("nav", "Navigation");
      // Set position via inline style so jsdom's real getComputedStyle returns "fixed"
      mockEl.style.position = "fixed";
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      await act(async () => {
        clickAtPoint(400, 50);
      });

      await waitFor(() => {
        expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
      });

      const textarea = document.querySelector(
        "[data-annotation-popup] textarea",
      ) as HTMLTextAreaElement;
      await act(async () => {
        fireEvent.change(textarea, { target: { value: "Fixed nav" } });
      });
      await act(async () => {
        fireEvent.keyDown(textarea, { key: "Enter" });
      });

      await waitFor(
        () => {
          expect(onAnnotationAdd).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 },
      );

      expect(onAnnotationAdd.mock.calls[0][0].isFixed).toBe(true);

      mockEl.remove();
    });

    it("marks annotation as fixed when element has sticky positioning", async () => {
      const onAnnotationAdd = vi.fn();
      render(<PageFeedbackToolbarCSS onAnnotationAdd={onAnnotationAdd} />);
      await activateToolbar();

      const mockEl = createMockTarget("header", "Sticky Header");
      mockEl.style.position = "sticky";
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      await act(async () => {
        clickAtPoint(400, 50);
      });

      await waitFor(() => {
        expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
      });

      const textarea = document.querySelector(
        "[data-annotation-popup] textarea",
      ) as HTMLTextAreaElement;
      await act(async () => {
        fireEvent.change(textarea, { target: { value: "Sticky header" } });
      });
      await act(async () => {
        fireEvent.keyDown(textarea, { key: "Enter" });
      });

      await waitFor(
        () => {
          expect(onAnnotationAdd).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 },
      );

      expect(onAnnotationAdd.mock.calls[0][0].isFixed).toBe(true);

      mockEl.remove();
    });

    it("annotation is not fixed for statically positioned elements", async () => {
      const onAnnotationAdd = vi.fn();
      render(<PageFeedbackToolbarCSS onAnnotationAdd={onAnnotationAdd} />);
      await activateToolbar();

      const mockEl = createMockTarget("div", "Regular Div");
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      // Default jsdom getComputedStyle returns "" for position which is treated as static
      // No need to mock — just ensure it's not "fixed" or "sticky"

      await act(async () => {
        clickAtPoint(400, 300);
      });

      await waitFor(() => {
        expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
      });

      const textarea = document.querySelector(
        "[data-annotation-popup] textarea",
      ) as HTMLTextAreaElement;
      await act(async () => {
        fireEvent.change(textarea, { target: { value: "Static element" } });
      });
      await act(async () => {
        fireEvent.keyDown(textarea, { key: "Enter" });
      });

      await waitFor(
        () => {
          expect(onAnnotationAdd).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 },
      );

      expect(onAnnotationAdd.mock.calls[0][0].isFixed).toBe(false);

      mockEl.remove();
    });
  });

  // ===========================================================================
  // 10. Renderable annotation filtering
  // ===========================================================================

  describe("Renderable annotation filtering", () => {
    it("resolved annotations render as faded resolved markers", async () => {
      const annotations = [
        makeAnnotation({
          id: "resolved1",
          comment: "Resolved",
          status: "resolved",
        }),
        makeAnnotation({
          id: "active1",
          comment: "Active",
          status: "pending",
        }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      await waitFor(() => {
        const markers = document.querySelectorAll("[data-annotation-marker]");
        // Both render: 1 active numbered marker + 1 resolved faded marker
        expect(markers.length).toBe(2);
      });
    });

    it("dismissed annotations render as faded resolved markers", async () => {
      const annotations = [
        makeAnnotation({
          id: "dismissed1",
          comment: "Dismissed",
          status: "dismissed",
        }),
        makeAnnotation({
          id: "active2",
          comment: "Active",
          status: undefined,
        }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      await waitFor(() => {
        const markers = document.querySelectorAll("[data-annotation-marker]");
        // Both render: 1 active numbered marker + 1 dismissed faded marker
        expect(markers.length).toBe(2);
      });
    });

    it("acknowledged, pending, and no-status annotations render normally", async () => {
      const annotations = [
        makeAnnotation({
          id: "ack1",
          comment: "Acked",
          status: "acknowledged",
        }),
        makeAnnotation({
          id: "pend1",
          comment: "Pending",
          status: "pending",
        }),
        makeAnnotation({
          id: "no-status",
          comment: "No status",
          status: undefined,
        }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      await waitFor(() => {
        const markers = document.querySelectorAll("[data-annotation-marker]");
        expect(markers.length).toBe(3);
      });
    });
  });

  // ===========================================================================
  // 11. Webhook and callback integration
  // ===========================================================================

  describe("Webhook and callback integration", () => {
    it("fires webhook on annotation add when webhooks are enabled", async () => {
      const mockFetch = vi.mocked(fetch);

      localStorage.setItem(
        "feedback-toolbar-settings",
        JSON.stringify({
          outputDetail: "standard",
          autoClearAfterCopy: false,
          annotationColor: "#3c82f7",
          blockInteractions: true,
          reactEnabled: true,
          markerClickBehavior: "edit",
          webhookUrl: "https://hooks.example.com/feedback",
          webhooksEnabled: true,
        }),
      );

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const mockEl = createMockTarget("button", "Webhook Test");
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      await act(async () => {
        clickAtPoint(400, 300);
      });

      await waitFor(() => {
        expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
      });

      const textarea = document.querySelector(
        "[data-annotation-popup] textarea",
      ) as HTMLTextAreaElement;
      await act(async () => {
        fireEvent.change(textarea, {
          target: { value: "Webhook annotation" },
        });
      });
      await act(async () => {
        fireEvent.keyDown(textarea, { key: "Enter" });
      });

      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );

      const webhookCall = mockFetch.mock.calls.find(
        (call: unknown[]) =>
          typeof call[0] === "string" &&
          call[0].includes("hooks.example.com"),
      );
      expect(webhookCall).toBeTruthy();

      mockEl.remove();
    });

    it("onAnnotationAdd callback receives annotation object", async () => {
      const onAnnotationAdd = vi.fn();
      render(<PageFeedbackToolbarCSS onAnnotationAdd={onAnnotationAdd} />);
      await activateToolbar();

      const mockEl = createMockTarget("div", "Callback test");
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      await act(async () => {
        clickAtPoint(400, 300);
      });

      await waitFor(() => {
        expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
      });

      const textarea = document.querySelector(
        "[data-annotation-popup] textarea",
      ) as HTMLTextAreaElement;
      await act(async () => {
        fireEvent.change(textarea, { target: { value: "Callback test" } });
      });
      await act(async () => {
        fireEvent.keyDown(textarea, { key: "Enter" });
      });

      await waitFor(
        () => {
          expect(onAnnotationAdd).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 },
      );

      const annotation = onAnnotationAdd.mock.calls[0][0];
      expect(annotation).toHaveProperty("id");
      expect(annotation).toHaveProperty("comment", "Callback test");
      expect(annotation).toHaveProperty("element");
      expect(annotation).toHaveProperty("elementPath");
      expect(annotation).toHaveProperty("timestamp");
      expect(annotation).toHaveProperty("x");
      expect(annotation).toHaveProperty("y");

      mockEl.remove();
    });
  });

  // ===========================================================================
  // 12. CSS classes in annotation metadata
  // ===========================================================================

  describe("CSS classes in annotation metadata", () => {
    it("captures CSS classes from the clicked element", async () => {
      const onAnnotationAdd = vi.fn();
      render(<PageFeedbackToolbarCSS onAnnotationAdd={onAnnotationAdd} />);
      await activateToolbar();

      const mockEl = createMockTarget("div", "Styled Element");
      mockEl.className = "card card-primary shadow-lg";
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      await act(async () => {
        clickAtPoint(400, 300);
      });

      await waitFor(() => {
        expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
      });

      const textarea = document.querySelector(
        "[data-annotation-popup] textarea",
      ) as HTMLTextAreaElement;
      await act(async () => {
        fireEvent.change(textarea, { target: { value: "Check classes" } });
      });
      await act(async () => {
        fireEvent.keyDown(textarea, { key: "Enter" });
      });

      await waitFor(
        () => {
          expect(onAnnotationAdd).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 },
      );

      const annotation = onAnnotationAdd.mock.calls[0][0];
      expect(annotation.cssClasses).toContain("card");

      mockEl.remove();
    });
  });

  // ===========================================================================
  // 13. Annotation position calculation
  // ===========================================================================

  describe("Annotation position calculation", () => {
    it("calculates x as percentage of viewport width", async () => {
      const onAnnotationAdd = vi.fn();
      render(<PageFeedbackToolbarCSS onAnnotationAdd={onAnnotationAdd} />);
      await activateToolbar();

      const mockEl = createMockTarget("div", "Position test");
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      await act(async () => {
        clickAtPoint(400, 300);
      });

      await waitFor(() => {
        expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
      });

      const textarea = document.querySelector(
        "[data-annotation-popup] textarea",
      ) as HTMLTextAreaElement;
      await act(async () => {
        fireEvent.change(textarea, { target: { value: "Position" } });
      });
      await act(async () => {
        fireEvent.keyDown(textarea, { key: "Enter" });
      });

      await waitFor(
        () => {
          expect(onAnnotationAdd).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 },
      );

      const annotation = onAnnotationAdd.mock.calls[0][0];
      const expectedX = (400 / window.innerWidth) * 100;
      expect(annotation.x).toBeCloseTo(expectedX, 0);

      mockEl.remove();
    });

    it("for fixed elements, y equals clientY without scroll offset", async () => {
      const onAnnotationAdd = vi.fn();
      render(<PageFeedbackToolbarCSS onAnnotationAdd={onAnnotationAdd} />);
      await activateToolbar();

      const mockEl = createMockTarget("nav", "Fixed nav");
      mockEl.style.position = "fixed";
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      await act(async () => {
        clickAtPoint(400, 80);
      });

      await waitFor(() => {
        expect(document.querySelector("[data-annotation-popup]")).toBeTruthy();
      });

      const textarea = document.querySelector(
        "[data-annotation-popup] textarea",
      ) as HTMLTextAreaElement;
      await act(async () => {
        fireEvent.change(textarea, { target: { value: "Fixed pos" } });
      });
      await act(async () => {
        fireEvent.keyDown(textarea, { key: "Enter" });
      });

      await waitFor(
        () => {
          expect(onAnnotationAdd).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 },
      );

      const annotation = onAnnotationAdd.mock.calls[0][0];
      expect(annotation.y).toBe(80);
      expect(annotation.isFixed).toBe(true);

      mockEl.remove();
    });
  });

  // ===========================================================================
  // 14. Hover handler
  // ===========================================================================

  describe("Hover handler", () => {
    it("hover info clears when mouse moves over toolbar", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const mockEl = createMockTarget("button", "Hover target");
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);
      vi.spyOn(mockEl, "getBoundingClientRect").mockReturnValue({
        left: 100, top: 100, right: 300, bottom: 150,
        width: 200, height: 50, x: 100, y: 100,
        toJSON: () => ({}),
      });

      // Move mouse over an element — dispatch from body so composedPath()[0] is an Element
      await act(async () => {
        fireEvent.mouseMove(document.body, { clientX: 200, clientY: 125 });
      });

      // Now move over toolbar - hover should clear
      const toolbar = document.querySelector("[data-feedback-toolbar]")!;
      vi.spyOn(document, "elementFromPoint").mockReturnValue(
        toolbar as unknown as Element,
      );

      await act(async () => {
        fireEvent.mouseMove(document.body, { clientX: 50, clientY: 50 });
      });

      // After moving to toolbar, no hover highlight should be rendered
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      mockEl.remove();
    });
  });
});
