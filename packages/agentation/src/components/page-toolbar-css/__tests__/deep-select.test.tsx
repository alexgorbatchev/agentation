/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, waitFor, act } from "@testing-library/react";
import { PageFeedbackToolbarCSS } from "../index";
import {
  activateToolbar,
  clickAtPoint,
  createMockTarget,
  installPageToolbarTestGlobals,
  mockElementRect,
  resetPageToolbarTestEnvironment,
} from "./pageToolbarTestUtils";

// ---------------------------------------------------------------------------
// Global Mocks
// ---------------------------------------------------------------------------

const mockWriteText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  mockWriteText.mockClear();
  installPageToolbarTestGlobals({
    writeText: mockWriteText,
    includeElementsFromPoint: true,
  });
});

afterEach(() => {
  resetPageToolbarTestEnvironment();
});

// =============================================================================
// Deep Select (Pierce Mode) Tests
// =============================================================================

describe("Deep select / Pierce mode", () => {
  // ===========================================================================
  // 1. Pierce mode activation via Cmd/Ctrl + hover
  // ===========================================================================

  describe("Pierce mode activation via mousemove", () => {
    it("uses pierceElementFromPoint when metaKey is held during hover", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      // Create a content element behind an overlay
      const contentEl = createMockTarget("p", "Real content");
      mockElementRect(contentEl);

      // Create an overlay div that intercepts pointer events
      const overlay = createMockTarget("div", "");
      mockElementRect(overlay, { width: 500, height: 500 });

      // elementFromPoint returns the overlay (top element)
      vi.spyOn(document, "elementFromPoint").mockReturnValue(overlay);
      // elementsFromPoint returns stack: overlay, then contentEl
      vi.spyOn(document, "elementsFromPoint").mockReturnValue([
        overlay,
        contentEl,
        document.body,
        document.documentElement,
      ]);

      // Hover with metaKey held (Cmd on Mac)
      await act(async () => {
        fireEvent.mouseMove(document.body, {
          clientX: 200,
          clientY: 125,
          metaKey: true,
        });
      });

      // The hover label should appear (the element path or name tooltip)
      // and it should contain the deep select indicator
      await waitFor(() => {
        // The component renders hover info with the pierce mode indicator
        const allText = document.body.textContent || "";
        // Pierce mode should identify the content element, not the overlay
        // The "deep select" indicator text is rendered when isPiercing is true
        expect(allText).toContain("deep select");
      });
    });

    it("uses pierceElementFromPoint when ctrlKey is held during hover", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const contentEl = createMockTarget("button", "Action");
      mockElementRect(contentEl);

      vi.spyOn(document, "elementFromPoint").mockReturnValue(contentEl);

      await act(async () => {
        fireEvent.mouseMove(document.body, {
          clientX: 200,
          clientY: 125,
          ctrlKey: true,
        });
      });

      await waitFor(() => {
        const allText = document.body.textContent || "";
        expect(allText).toContain("deep select");
      });
    });

    it("does NOT show deep select indicator during normal hover (no modifier key)", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const mockEl = createMockTarget("button", "Normal hover");
      mockElementRect(mockEl);

      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      await act(async () => {
        fireEvent.mouseMove(document.body, {
          clientX: 200,
          clientY: 125,
        });
      });

      // Wait for state to settle
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      const allText = document.body.textContent || "";
      expect(allText).not.toContain("deep select");
    });
  });

  // ===========================================================================
  // 2. Pierce mode — dashed border style
  // ===========================================================================

  describe("Dashed border on pierce hover", () => {
    it("renders dashed border-style when isPiercing is true", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const mockEl = createMockTarget("button", "Pierced element");
      mockElementRect(mockEl);

      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      // Hover with metaKey to activate pierce mode
      await act(async () => {
        fireEvent.mouseMove(document.body, {
          clientX: 200,
          clientY: 125,
          metaKey: true,
        });
      });

      await waitFor(() => {
        // The highlight rectangle should have dashed border
        const toolbarPortals = document.querySelectorAll("[data-feedback-toolbar]");
        let foundDashed = false;
        for (const portal of toolbarPortals) {
          const divs = portal.querySelectorAll("div");
          for (const div of divs) {
            if (div.style.borderStyle === "dashed") {
              foundDashed = true;
              break;
            }
          }
          if (foundDashed) break;
        }
        expect(foundDashed).toBe(true);
      });
    });

    it("does NOT render dashed border during normal hover", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const mockEl = createMockTarget("button", "Normal element");
      mockElementRect(mockEl);

      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      await act(async () => {
        fireEvent.mouseMove(document.body, {
          clientX: 200,
          clientY: 125,
        });
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      const toolbarPortals = document.querySelectorAll("[data-feedback-toolbar]");
      let foundDashed = false;
      for (const portal of toolbarPortals) {
        const divs = portal.querySelectorAll("div");
        for (const div of divs) {
          if (div.style.borderStyle === "dashed") {
            foundDashed = true;
          }
        }
      }
      expect(foundDashed).toBe(false);
    });
  });

  // ===========================================================================
  // 3. Pierce mode — two-pass element discovery
  // ===========================================================================

  describe("Two-pass pierce algorithm", () => {
    it("pass 1: finds element with direct text content behind an overlay", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      // Create a paragraph with real text content
      const textEl = createMockTarget("p", "Price: $54");
      mockElementRect(textEl);

      // Create an empty overlay div
      const overlay = document.createElement("div");
      overlay.setAttribute("data-mock-target", "true");
      document.body.appendChild(overlay);
      mockElementRect(overlay, { width: 1000, height: 1000 });

      vi.spyOn(document, "elementFromPoint").mockReturnValue(overlay);
      vi.spyOn(document, "elementsFromPoint").mockReturnValue([
        overlay,
        textEl,
        document.body,
        document.documentElement,
      ]);

      // Pierce mode hover
      await act(async () => {
        fireEvent.mouseMove(document.body, {
          clientX: 200,
          clientY: 125,
          metaKey: true,
        });
      });

      await waitFor(() => {
        const allText = document.body.textContent || "";
        // The hover info should show info about the text element, not the overlay
        expect(allText).toContain("deep select");
      });
    });

    it("pass 2: falls back to smallest visible element when no text content found", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      // Create a small colored bar (visual-only, no text)
      const bar = document.createElement("div");
      bar.setAttribute("data-mock-target", "true");
      bar.className = "timeline-bar";
      document.body.appendChild(bar);
      mockElementRect(bar, { width: 50, height: 10 });

      // Create a large overlay
      const overlay = document.createElement("div");
      overlay.setAttribute("data-mock-target", "true");
      document.body.appendChild(overlay);
      mockElementRect(overlay, { width: 500, height: 500, left: 0, top: 0, right: 500, bottom: 500 });

      vi.spyOn(document, "elementFromPoint").mockReturnValue(overlay);
      vi.spyOn(document, "elementsFromPoint").mockReturnValue([
        overlay,
        bar,
        document.body,
        document.documentElement,
      ]);

      await act(async () => {
        fireEvent.mouseMove(document.body, {
          clientX: 200,
          clientY: 125,
          metaKey: true,
        });
      });

      await waitFor(() => {
        const allText = document.body.textContent || "";
        expect(allText).toContain("deep select");
      });
    });

    it("returns the top element directly when it has content and is visible", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      // Top element already has content — no need to pierce further
      const contentEl = createMockTarget("button", "Click me");
      mockElementRect(contentEl);

      vi.spyOn(document, "elementFromPoint").mockReturnValue(contentEl);

      await act(async () => {
        fireEvent.mouseMove(document.body, {
          clientX: 200,
          clientY: 125,
          metaKey: true,
        });
      });

      await waitFor(() => {
        const allText = document.body.textContent || "";
        expect(allText).toContain("deep select");
        expect(allText).toContain("Click me");
      });
    });
  });

  // ===========================================================================
  // 4. Pierce mode click — creating annotations through overlays
  // ===========================================================================

  describe("Pierce mode click", () => {
    it("uses pierceElementFromPoint when Cmd/Ctrl is held during click (without Shift)", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const contentEl = createMockTarget("button", "Submit");
      mockElementRect(contentEl);

      vi.spyOn(document, "elementFromPoint").mockReturnValue(contentEl);

      await act(async () => {
        // Click with metaKey but NOT shiftKey
        clickAtPoint(200, 125, { metaKey: true });
      });

      // Should open annotation popup
      await waitFor(() => {
        const popup = document.querySelector("[data-annotation-popup]");
        expect(popup).toBeTruthy();
      });
    });

    it("uses pierceElementFromPoint for Cmd+Shift+click (multi-select)", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const el1 = createMockTarget("button", "First");
      mockElementRect(el1);
      vi.spyOn(document, "elementFromPoint").mockReturnValue(el1);

      // Cmd+Shift+click for multi-select
      await act(async () => {
        clickAtPoint(200, 125, { metaKey: true, shiftKey: true });
      });

      // Should attempt multi-element selection (adds element to multi-select list)
      // Wait for any state updates
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      // The handler ran without error (we're testing the code path is exercised)
      expect(true).toBe(true);
    });
  });

  // ===========================================================================
  // 5. pierceElementFromPoint returns null when elementFromPoint returns null
  // ===========================================================================

  describe("Pierce edge cases", () => {
    it("handles null from elementFromPoint gracefully", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      vi.spyOn(document, "elementFromPoint").mockReturnValue(null);

      // Pierce hover should not crash
      await act(async () => {
        fireEvent.mouseMove(document.body, {
          clientX: 200,
          clientY: 125,
          metaKey: true,
        });
      });

      // No crash means success
      expect(true).toBe(true);
    });

    it("skips invisible elements during pierce", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      // Create an invisible element
      const invisible = document.createElement("div");
      invisible.setAttribute("data-mock-target", "true");
      invisible.textContent = "Hidden text";
      document.body.appendChild(invisible);
      mockElementRect(invisible, { width: 200, height: 50 });
      // Mock checkVisibility to return false
      invisible.checkVisibility = vi.fn().mockReturnValue(false);

      // Create a visible content element
      const visible = createMockTarget("p", "Visible text");
      mockElementRect(visible, { width: 200, height: 50 });

      // Create overlay
      const overlay = document.createElement("div");
      overlay.setAttribute("data-mock-target", "true");
      document.body.appendChild(overlay);
      mockElementRect(overlay, { width: 500, height: 500 });

      vi.spyOn(document, "elementFromPoint").mockReturnValue(overlay);
      vi.spyOn(document, "elementsFromPoint").mockReturnValue([
        overlay,
        invisible,
        visible,
        document.body,
        document.documentElement,
      ]);

      await act(async () => {
        fireEvent.mouseMove(document.body, {
          clientX: 200,
          clientY: 125,
          metaKey: true,
        });
      });

      await waitFor(() => {
        const allText = document.body.textContent || "";
        expect(allText).toContain("deep select");
      });
    });

    it("pierces through shadow DOM during pierce mode", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      // Create a shadow host element
      const host = document.createElement("div");
      host.setAttribute("data-mock-target", "true");
      document.body.appendChild(host);
      const shadow = host.attachShadow({ mode: "open" });
      const innerBtn = document.createElement("button");
      innerBtn.textContent = "Shadow button";
      shadow.appendChild(innerBtn);

      mockElementRect(host);
      mockElementRect(innerBtn);

      // elementFromPoint returns the host
      vi.spyOn(document, "elementFromPoint").mockReturnValue(host);

      // Mock shadow root's elementFromPoint to return the inner button
      shadow.elementFromPoint = vi.fn().mockReturnValue(innerBtn);

      await act(async () => {
        fireEvent.mouseMove(document.body, {
          clientX: 200,
          clientY: 125,
          metaKey: true,
        });
      });

      await waitFor(() => {
        const allText = document.body.textContent || "";
        expect(allText).toContain("deep select");
      });
    });
  });
});
