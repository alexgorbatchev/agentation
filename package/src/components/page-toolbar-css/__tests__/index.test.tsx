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

function seedAnnotations(annotations: Annotation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(annotations));
}

async function flushAsyncEffects(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

/**
 * Activate the toolbar by clicking the collapsed container.
 */
async function activateToolbar() {
  const activateButton = screen.getByTitle("Start feedback mode");
  fireEvent.click(activateButton);
  // Wait for the active state to render control buttons
  await waitFor(() => {
    const toolbar = document.querySelector("[data-feedback-toolbar]");
    expect(toolbar).toBeTruthy();
  });
}

/**
 * Find a control button by the text content of its sibling tooltip span.
 */
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

// ---------------------------------------------------------------------------
// Global Mocks
// ---------------------------------------------------------------------------

// Mock clipboard API
const mockWriteText = vi.fn().mockResolvedValue(undefined);

// Mock EventSource (used by component for SSE)
class MockEventSource {
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  close = vi.fn();
  constructor(_url: string) {}
}

beforeEach(() => {
  // Clear storage
  localStorage.clear();
  sessionStorage.clear();

  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({
        id: "test-session",
        annotations: [],
        status: "active",
      }),
    })),
  );

  // Mock clipboard
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: mockWriteText },
    writable: true,
    configurable: true,
  });
  mockWriteText.mockClear();

  // Mock elementFromPoint (jsdom doesn't implement it)
  document.elementFromPoint = vi.fn().mockReturnValue(null);

  // Mock EventSource
  vi.stubGlobal("EventSource", MockEventSource);
});

afterEach(() => {
  // Let React Testing Library cleanup first (unmounts components properly)
  cleanup();

  // Then clean up any leftover portal elements from document.body
  // without nuking the whole body (which breaks React portal cleanup)
  const portalElements = document.querySelectorAll("[data-feedback-toolbar]");
  portalElements.forEach((el) => el.remove());

  // Clean up cursor styles injected into head
  const cursorStyle = document.getElementById("feedback-cursor-styles");
  if (cursorStyle) cursorStyle.remove();

  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
});

// =============================================================================
// 1. Rendering
// =============================================================================

describe("PageFeedbackToolbarCSS", () => {
  describe("Rendering", () => {
    it("renders the toolbar container into the DOM", () => {
      render(<PageFeedbackToolbarCSS />);
      const toolbar = document.querySelector("[data-feedback-toolbar]");
      expect(toolbar).toBeTruthy();
    });

    it("has the data-feedback-toolbar attribute", () => {
      render(<PageFeedbackToolbarCSS />);
      const toolbars = document.querySelectorAll("[data-feedback-toolbar]");
      expect(toolbars.length).toBeGreaterThanOrEqual(1);
    });

    it("renders collapsed initially with a toggle button", () => {
      render(<PageFeedbackToolbarCSS />);
      const activateButton = screen.getByTitle("Start feedback mode");
      expect(activateButton).toBeTruthy();
      expect(activateButton.getAttribute("role")).toBe("button");
    });

    it("renders with the collapsed state (role=button, tabIndex=0)", () => {
      render(<PageFeedbackToolbarCSS />);
      const activateButton = screen.getByTitle("Start feedback mode");
      expect(activateButton.getAttribute("tabindex")).toBe("0");
    });

    it("applies a custom className when provided", () => {
      render(<PageFeedbackToolbarCSS className="my-custom-class" />);
      const toolbar = document.querySelector("[data-feedback-toolbar]");
      expect(toolbar?.className).toContain("my-custom-class");
    });
  });

  // =============================================================================
  // 2. Activation / Deactivation
  // =============================================================================

  describe("Activation / Deactivation", () => {
    it("activates on click of the collapsed toolbar container", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      // After activation, the role=button element should be gone (active state)
      const activateButton = screen.queryByTitle("Start feedback mode");
      expect(activateButton).toBeNull();
    });

    it("shows control buttons when active", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      // Should find buttons in the toolbar
      const toolbarButtons = document.querySelectorAll(
        "[data-feedback-toolbar] button"
      );
      expect(toolbarButtons.length).toBeGreaterThanOrEqual(5);
    });

    it("shows tooltip text for buttons: Copy, Clear, Settings, Exit", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const copyBtn = findButtonByTooltip("Copy feedback");
      const clearBtn = findButtonByTooltip("Clear all");
      const settingsBtn = findButtonByTooltip("Settings");
      const exitBtn = findButtonByTooltip("Exit");

      expect(copyBtn).toBeTruthy();
      expect(clearBtn).toBeTruthy();
      expect(settingsBtn).toBeTruthy();
      expect(exitBtn).toBeTruthy();
    });

    it("deactivates on close button click", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const exitBtn = findButtonByTooltip("Exit");
      expect(exitBtn).toBeTruthy();
      fireEvent.click(exitBtn!);

      await waitFor(() => {
        const activateButton = screen.getByTitle("Start feedback mode");
        expect(activateButton).toBeTruthy();
      });
    });

    it("deactivates on Escape key press", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      // Verify active state
      expect(screen.queryByTitle("Start feedback mode")).toBeNull();

      fireEvent.keyDown(document, { key: "Escape" });

      await waitFor(() => {
        const activateButton = screen.getByTitle("Start feedback mode");
        expect(activateButton).toBeTruthy();
      });
    });
  });

  // =============================================================================
  // 3. Annotations from localStorage
  // =============================================================================

  describe("Annotations from localStorage", () => {
    it("loads pre-seeded annotations from localStorage", async () => {
      const annotations = [
        makeAnnotation({ id: "a1", comment: "First" }),
        makeAnnotation({ id: "a2", comment: "Second" }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      // Copy button should be enabled (not disabled) since annotations loaded
      const copyBtn = findButtonByTooltip("Copy feedback");
      expect(copyBtn).toBeTruthy();
      expect(copyBtn!.disabled).toBe(false);
    });

    it("shows annotation count badge when annotations exist", async () => {
      const annotations = [
        makeAnnotation({ id: "a1", comment: "First" }),
        makeAnnotation({ id: "a2", comment: "Second" }),
        makeAnnotation({ id: "a3", comment: "Third" }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);

      // Before activation, the badge shows count on collapsed state
      await waitFor(() => {
        const bodyText = document.body.textContent || "";
        expect(bodyText).toContain("3");
      });
    });

    it("renders markers when active and markers visible", async () => {
      const annotations = [
        makeAnnotation({ id: "m1", comment: "Marker 1" }),
        makeAnnotation({ id: "m2", comment: "Marker 2" }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      await waitFor(() => {
        const markers = document.querySelectorAll("[data-annotation-marker]");
        expect(markers.length).toBeGreaterThanOrEqual(2);
      });
    });

    it("filters out resolved and dismissed annotations", async () => {
      const annotations = [
        makeAnnotation({ id: "active1", comment: "Active", status: undefined }),
        makeAnnotation({
          id: "resolved1",
          comment: "Resolved",
          status: "resolved",
        }),
        makeAnnotation({
          id: "dismissed1",
          comment: "Dismissed",
          status: "dismissed",
        }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      // Only 1 renderable annotation
      const clearBtn = findButtonByTooltip("Clear all");
      expect(clearBtn).toBeTruthy();
      expect(clearBtn!.disabled).toBe(false);

      const copyBtn = findButtonByTooltip("Copy feedback");
      expect(copyBtn!.disabled).toBe(false);
    });
  });

  // =============================================================================
  // 4. Copy Functionality
  // =============================================================================

  describe("Copy functionality", () => {
    it("copies to clipboard when copy button is clicked", async () => {
      const annotations = [
        makeAnnotation({ id: "c1", comment: "Copy me", element: "Div" }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const copyBtn = findButtonByTooltip("Copy feedback");
      expect(copyBtn).toBeTruthy();

      await act(async () => {
        fireEvent.click(copyBtn!);
      });

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledTimes(1);
      });

      const clipboardContent = mockWriteText.mock.calls[0][0];
      expect(clipboardContent).toContain("Copy me");
      expect(clipboardContent).toContain("Div");
    });

    it("calls onCopy callback with markdown output", async () => {
      const onCopy = vi.fn();
      const annotations = [
        makeAnnotation({
          id: "cb1",
          comment: "Callback test",
          element: "Span",
        }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS onCopy={onCopy} />);
      await activateToolbar();

      const copyBtn = findButtonByTooltip("Copy feedback");
      await act(async () => {
        fireEvent.click(copyBtn!);
      });

      await waitFor(() => {
        expect(onCopy).toHaveBeenCalledTimes(1);
      });

      const markdown = onCopy.mock.calls[0][0];
      expect(typeof markdown).toBe("string");
      expect(markdown).toContain("Callback test");
      expect(markdown).toContain("Span");
    });

    it("does NOT copy to clipboard when copyToClipboard is false", async () => {
      const onCopy = vi.fn();
      const annotations = [
        makeAnnotation({ id: "nc1", comment: "No clipboard" }),
      ];
      seedAnnotations(annotations);

      render(
        <PageFeedbackToolbarCSS copyToClipboard={false} onCopy={onCopy} />
      );
      await activateToolbar();

      const copyBtn = findButtonByTooltip("Copy feedback");
      await act(async () => {
        fireEvent.click(copyBtn!);
      });

      await waitFor(() => {
        expect(onCopy).toHaveBeenCalledTimes(1);
      });

      // Clipboard should NOT have been called
      expect(mockWriteText).not.toHaveBeenCalled();
    });

    it("generates markdown output containing Page Feedback header", async () => {
      const onCopy = vi.fn();
      const annotations = [
        makeAnnotation({
          id: "md1",
          comment: "Markdown test",
          element: "Link",
        }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS onCopy={onCopy} />);
      await activateToolbar();

      const copyBtn = findButtonByTooltip("Copy feedback");
      await act(async () => {
        fireEvent.click(copyBtn!);
      });

      await waitFor(() => {
        expect(onCopy).toHaveBeenCalled();
      });

      const output = onCopy.mock.calls[0][0];
      expect(output).toContain("## Page Feedback");
      expect(output).toContain("Link");
      expect(output).toContain("Markdown test");
    });
  });

  // =============================================================================
  // 5. Clear Functionality
  // =============================================================================

  describe("Clear functionality", () => {
    it("clears all annotations when clear button is clicked", async () => {
      const annotations = [
        makeAnnotation({ id: "cl1", comment: "Clear me" }),
        makeAnnotation({ id: "cl2", comment: "Clear me too" }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const clearBtn = findButtonByTooltip("Clear all");
      expect(clearBtn!.disabled).toBe(false);

      await act(async () => {
        fireEvent.click(clearBtn!);
      });

      // After clearing animation, copy button should become disabled
      await waitFor(
        () => {
          const copyBtn = findButtonByTooltip("Copy feedback");
          expect(copyBtn!.disabled).toBe(true);
        },
        { timeout: 3000 }
      );
    });

    it("calls onAnnotationsClear callback with all annotations", async () => {
      const onAnnotationsClear = vi.fn();
      const annotations = [
        makeAnnotation({ id: "clr1", comment: "Cleared 1" }),
        makeAnnotation({ id: "clr2", comment: "Cleared 2" }),
      ];
      seedAnnotations(annotations);

      render(
        <PageFeedbackToolbarCSS onAnnotationsClear={onAnnotationsClear} />
      );
      await activateToolbar();

      const clearBtn = findButtonByTooltip("Clear all");
      await act(async () => {
        fireEvent.click(clearBtn!);
      });

      await waitFor(() => {
        expect(onAnnotationsClear).toHaveBeenCalledTimes(1);
      });

      const clearedAnnotations = onAnnotationsClear.mock.calls[0][0];
      expect(clearedAnnotations).toHaveLength(2);
      expect(clearedAnnotations[0].id).toBe("clr1");
      expect(clearedAnnotations[1].id).toBe("clr2");
    });

    it("clear button is disabled when there are no annotations", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const clearBtn = findButtonByTooltip("Clear all");
      expect(clearBtn).toBeTruthy();
      expect(clearBtn!.disabled).toBe(true);
    });
  });

  // =============================================================================
  // 6. Settings Panel
  // =============================================================================

  describe("Settings panel", () => {
    it("opens settings panel when settings button is clicked", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const settingsBtn = findButtonByTooltip("Settings");
      expect(settingsBtn).toBeTruthy();

      fireEvent.click(settingsBtn!);

      await waitFor(() => {
        const bodyText = document.body.textContent || "";
        expect(bodyText).toContain("Output Detail");
      });
    });

    it("shows agentation branding and version in settings", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const settingsBtn = findButtonByTooltip("Settings");
      fireEvent.click(settingsBtn!);

      await waitFor(() => {
        const bodyText = document.body.textContent || "";
        expect(bodyText).toContain("agentation");
        // Version is from vitest.config.ts: __VERSION__ = "test"
        expect(bodyText).toContain("vtest");
      });
    });

    it("cycles output detail levels when clicking the cycle button", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const settingsBtn = findButtonByTooltip("Settings");
      fireEvent.click(settingsBtn!);

      await waitFor(() => {
        const bodyText = document.body.textContent || "";
        expect(bodyText).toContain("Standard");
      });

      // Find the cycle button containing "Standard"
      const cycleButtons = Array.from(
        document.querySelectorAll("[data-feedback-toolbar] button")
      ).filter((btn) => btn.textContent?.includes("Standard"));
      expect(cycleButtons.length).toBeGreaterThanOrEqual(1);

      // Click to cycle: Standard -> Detailed
      fireEvent.click(cycleButtons[0]);

      await waitFor(() => {
        const bodyText = document.body.textContent || "";
        expect(bodyText).toContain("Detailed");
      });

      // Click again: Detailed -> Forensic
      fireEvent.click(cycleButtons[0]);

      await waitFor(() => {
        const bodyText = document.body.textContent || "";
        expect(bodyText).toContain("Forensic");
      });

      // Click again: Forensic -> Compact
      fireEvent.click(cycleButtons[0]);

      await waitFor(() => {
        const bodyText = document.body.textContent || "";
        expect(bodyText).toContain("Compact");
      });
    });

    it("toggles dark/light mode when theme button is clicked", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const settingsBtn = findButtonByTooltip("Settings");
      fireEvent.click(settingsBtn!);

      // Initially dark mode => "Switch to light mode"
      await waitFor(() => {
        const themeBtn = document.querySelector(
          'button[title="Switch to light mode"]'
        );
        expect(themeBtn).toBeTruthy();
      });

      const themeBtn = document.querySelector(
        'button[title="Switch to light mode"]'
      ) as HTMLButtonElement;
      fireEvent.click(themeBtn);

      // After clicking, should show "Switch to dark mode"
      await waitFor(() => {
        const darkBtn = document.querySelector(
          'button[title="Switch to dark mode"]'
        );
        expect(darkBtn).toBeTruthy();
      });

      // Verify theme is saved to localStorage
      expect(localStorage.getItem("feedback-toolbar-theme")).toBe("light");
    });

    it("changes annotation color when a color swatch is clicked", async () => {
      const annotations = [
        makeAnnotation({ id: "color1", comment: "Color test" }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const settingsBtn = findButtonByTooltip("Settings");
      fireEvent.click(settingsBtn!);

      // Find Purple color option by title
      await waitFor(() => {
        const purpleOption = document.querySelector('[title="Purple"]');
        expect(purpleOption).toBeTruthy();
      });

      const purpleOption = document.querySelector(
        '[title="Purple"]'
      ) as HTMLElement;
      // The color option is inside a ring div with role="button"
      const ring = purpleOption.parentElement;
      fireEvent.click(ring!);

      await waitFor(() => {
        const stored = localStorage.getItem("feedback-toolbar-settings");
        expect(stored).toBeTruthy();
        const settings = JSON.parse(stored!);
        expect(settings.annotationColor).toBe("#AF52DE");
      });
    });

    it("shows MCP indicator when endpoint is provided and connected", async () => {
      // Mock fetch to succeed for both health check and session creation
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) => {
          if (url.includes("/health")) {
            return Promise.resolve({ ok: true });
          }
          // Session creation
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                id: "test-session",
                annotations: [],
              }),
          });
        })
      );

      render(<PageFeedbackToolbarCSS endpoint="http://localhost:4747" />);
      await activateToolbar();

      // The MCP indicator should be present near the settings button
      await waitFor(() => {
        const indicators = document.querySelectorAll(
          "[data-feedback-toolbar] [title*='MCP']"
        );
        expect(indicators.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // =============================================================================
  // 7. Keyboard Shortcuts
  // =============================================================================

  describe("Keyboard shortcuts", () => {
    it("Escape key deactivates the toolbar", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      expect(screen.queryByTitle("Start feedback mode")).toBeNull();

      fireEvent.keyDown(document, { key: "Escape" });

      await waitFor(() => {
        expect(screen.getByTitle("Start feedback mode")).toBeTruthy();
      });
    });

    it("Cmd+Shift+F toggles the toolbar active state", async () => {
      render(<PageFeedbackToolbarCSS />);

      expect(screen.getByTitle("Start feedback mode")).toBeTruthy();

      // Toggle on
      fireEvent.keyDown(document, {
        key: "f",
        metaKey: true,
        shiftKey: true,
      });

      await waitFor(() => {
        expect(screen.queryByTitle("Start feedback mode")).toBeNull();
      });

      // Toggle off
      fireEvent.keyDown(document, {
        key: "f",
        metaKey: true,
        shiftKey: true,
      });

      await waitFor(() => {
        expect(screen.getByTitle("Start feedback mode")).toBeTruthy();
      });
    });

    it("Ctrl+Shift+F also toggles the toolbar", async () => {
      render(<PageFeedbackToolbarCSS />);

      fireEvent.keyDown(document, {
        key: "F",
        ctrlKey: true,
        shiftKey: true,
      });

      await waitFor(() => {
        expect(screen.queryByTitle("Start feedback mode")).toBeNull();
      });
    });
  });

  // =============================================================================
  // 8. Show/Hide Toolbar
  // =============================================================================

  describe("Show/Hide toolbar", () => {
    it("toolbar is initially visible", () => {
      render(<PageFeedbackToolbarCSS />);
      const toolbar = document.querySelector("[data-feedback-toolbar]");
      expect(toolbar).toBeTruthy();
    });

    it("toolbar is not rendered when loadToolbarHidden returns true", () => {
      // Simulate the toolbar having been previously hidden by the user.
      // The component reads this on mount: useState(() => loadToolbarHidden())
      // and if true, returns null early.
      // Uses sessionStorage with key "agentation-session-toolbar-hidden" = "1"
      sessionStorage.setItem("agentation-session-toolbar-hidden", "1");

      render(<PageFeedbackToolbarCSS />);

      const toolbar = document.querySelector("[data-feedback-toolbar]");
      expect(toolbar).toBeNull();
    });
  });

  // =============================================================================
  // 9. Props
  // =============================================================================

  describe("Props", () => {
    it("accepts all callback props without errors", () => {
      const onAnnotationAdd = vi.fn();
      const onAnnotationDelete = vi.fn();
      const onAnnotationUpdate = vi.fn();
      const onAnnotationsClear = vi.fn();
      const onCopy = vi.fn();
      const onSubmit = vi.fn();

      expect(() =>
        render(
          <PageFeedbackToolbarCSS
            onAnnotationAdd={onAnnotationAdd}
            onAnnotationDelete={onAnnotationDelete}
            onAnnotationUpdate={onAnnotationUpdate}
            onAnnotationsClear={onAnnotationsClear}
            onCopy={onCopy}
            onSubmit={onSubmit}
          />
        )
      ).not.toThrow();
    });

    it("renders with endpoint and sessionId props", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
      vi.spyOn(console, "warn").mockImplementation(() => {});

      render(
        <PageFeedbackToolbarCSS
          endpoint="http://localhost:4747"
          sessionId="test-session-123"
        />
      );

      await flushAsyncEffects();

      const toolbar = document.querySelector("[data-feedback-toolbar]");
      expect(toolbar).toBeTruthy();
    });

    it("renders with webhookUrl prop", () => {
      expect(() =>
        render(
          <PageFeedbackToolbarCSS webhookUrl="https://example.com/webhook" />
        )
      ).not.toThrow();
    });

    it("renders with enableDemoMode prop", () => {
      expect(() =>
        render(<PageFeedbackToolbarCSS enableDemoMode={true} />)
      ).not.toThrow();
    });
  });

  // =============================================================================
  // 10. generateOutput (via copy) - 4 Detail Levels
  // =============================================================================

  describe("generateOutput via copy at different detail levels", () => {
    it("compact: produces numbered list format", async () => {
      const onCopy = vi.fn();
      const annotations = [
        makeAnnotation({
          id: "cpt1",
          comment: "Fix alignment",
          element: "Header",
          selectedText: "Hello world",
        }),
      ];
      seedAnnotations(annotations);

      localStorage.setItem(
        "feedback-toolbar-settings",
        JSON.stringify({
          outputDetail: "compact",
          autoClearAfterCopy: false,
          annotationColor: "#3c82f7",
          blockInteractions: true,
          reactEnabled: true,
          markerClickBehavior: "edit",
          webhookUrl: "",
          webhooksEnabled: true,
        })
      );

      render(<PageFeedbackToolbarCSS onCopy={onCopy} />);
      await activateToolbar();

      const copyBtn = findButtonByTooltip("Copy feedback");
      await act(async () => {
        fireEvent.click(copyBtn!);
      });

      await waitFor(() => {
        expect(onCopy).toHaveBeenCalled();
      });

      const output = onCopy.mock.calls[0][0];
      // Compact uses "1. **Element**: comment"
      expect(output).toContain("1. **Header**");
      expect(output).toContain("Fix alignment");
      expect(output).toContain("Hello world");
      // Compact does NOT use ### headers
      expect(output).not.toContain("### 1.");
    });

    it("standard: produces markdown with headers and location", async () => {
      const onCopy = vi.fn();
      const annotations = [
        makeAnnotation({
          id: "std1",
          comment: "Needs padding",
          element: "Card",
          elementPath: "body > main > div.card",
        }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS onCopy={onCopy} />);
      await activateToolbar();

      const copyBtn = findButtonByTooltip("Copy feedback");
      await act(async () => {
        fireEvent.click(copyBtn!);
      });

      await waitFor(() => {
        expect(onCopy).toHaveBeenCalled();
      });

      const output = onCopy.mock.calls[0][0];
      expect(output).toContain("### 1. Card");
      expect(output).toContain("**Location:**");
      expect(output).toContain("**Feedback:** Needs padding");
      expect(output).toContain("**Viewport:**");
    });

    it("detailed: includes CSS classes, position, and context", async () => {
      const onCopy = vi.fn();
      const annotations = [
        makeAnnotation({
          id: "dtl1",
          comment: "Check styles",
          element: "Nav",
          elementPath: "body > nav",
          cssClasses: "nav nav-primary",
          boundingBox: { x: 10, y: 20, width: 300, height: 50 },
          nearbyText: "Some nearby context text",
        }),
      ];
      seedAnnotations(annotations);

      localStorage.setItem(
        "feedback-toolbar-settings",
        JSON.stringify({
          outputDetail: "detailed",
          autoClearAfterCopy: false,
          annotationColor: "#3c82f7",
          blockInteractions: true,
          reactEnabled: true,
          markerClickBehavior: "edit",
          webhookUrl: "",
          webhooksEnabled: true,
        })
      );

      render(<PageFeedbackToolbarCSS onCopy={onCopy} />);
      await activateToolbar();

      const copyBtn = findButtonByTooltip("Copy feedback");
      await act(async () => {
        fireEvent.click(copyBtn!);
      });

      await waitFor(() => {
        expect(onCopy).toHaveBeenCalled();
      });

      const output = onCopy.mock.calls[0][0];
      expect(output).toContain("### 1. Nav");
      expect(output).toContain("**Classes:** nav nav-primary");
      expect(output).toContain("**Position:**");
      expect(output).toContain("300");
      expect(output).toContain("**Context:**");
      expect(output).toContain("Some nearby context");
    });

    it("forensic: includes full environment info, computed styles, accessibility", async () => {
      const onCopy = vi.fn();
      const annotations = [
        makeAnnotation({
          id: "for1",
          comment: "Deep analysis",
          element: "Footer",
          fullPath: "html > body > footer#main-footer",
          cssClasses: "footer footer-dark",
          boundingBox: { x: 0, y: 900, width: 1024, height: 100 },
          computedStyles: "color: white; background: black",
          accessibility: "role=contentinfo",
          nearbyElements: "div, span, a",
          sourceFile: "src/components/Footer.tsx",
          reactComponents: "<App> <Layout> <Footer>",
        }),
      ];
      seedAnnotations(annotations);

      localStorage.setItem(
        "feedback-toolbar-settings",
        JSON.stringify({
          outputDetail: "forensic",
          autoClearAfterCopy: false,
          annotationColor: "#3c82f7",
          blockInteractions: true,
          reactEnabled: true,
          markerClickBehavior: "edit",
          webhookUrl: "",
          webhooksEnabled: true,
        })
      );

      render(<PageFeedbackToolbarCSS onCopy={onCopy} />);
      await activateToolbar();

      const copyBtn = findButtonByTooltip("Copy feedback");
      await act(async () => {
        fireEvent.click(copyBtn!);
      });

      await waitFor(() => {
        expect(onCopy).toHaveBeenCalled();
      });

      const output = onCopy.mock.calls[0][0];
      expect(output).toContain("**Environment:**");
      expect(output).toContain("Viewport:");
      expect(output).toContain("User Agent:");
      expect(output).toContain("### 1. Footer");
      expect(output).toContain("**Full DOM Path:**");
      expect(output).toContain("**CSS Classes:** footer footer-dark");
      expect(output).toContain("**Computed Styles:**");
      expect(output).toContain("**Accessibility:** role=contentinfo");
      expect(output).toContain("**Nearby Elements:**");
      expect(output).toContain("**Source:** src/components/Footer.tsx");
      expect(output).toContain("**React:** <App> <Layout> <Footer>");
      expect(output).toContain("**Feedback:** Deep analysis");
    });
  });

  // =============================================================================
  // 11. Eye Toggle (Show/Hide Markers)
  // =============================================================================

  describe("Eye toggle (show/hide markers)", () => {
    it("shows marker visibility tooltip when markers are visible", async () => {
      const annotations = [
        makeAnnotation({ id: "eye1", comment: "Marker vis test" }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const hideBtn = findButtonByTooltip("Hide markers");
      expect(hideBtn).toBeTruthy();
    });

    it("toggles marker visibility after clicking eye button", async () => {
      const annotations = [
        makeAnnotation({ id: "eye2", comment: "Toggle test" }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const eyeBtn = findButtonByTooltip("Hide markers");
      expect(eyeBtn).toBeTruthy();

      fireEvent.click(eyeBtn!);

      await waitFor(() => {
        const showBtn = findButtonByTooltip("Show markers");
        expect(showBtn).toBeTruthy();
      });
    });

    it("eye toggle button is disabled when no annotations exist", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const hideBtn = findButtonByTooltip("Hide markers");
      expect(hideBtn).toBeTruthy();
      expect(hideBtn!.disabled).toBe(true);
    });
  });

  // =============================================================================
  // 12. localStorage Persistence
  // =============================================================================

  describe("localStorage persistence", () => {
    it("saves settings to localStorage when changed", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const settingsBtn = findButtonByTooltip("Settings");
      fireEvent.click(settingsBtn!);

      await waitFor(() => {
        expect(document.body.textContent).toContain("Output Detail");
      });

      // Click cycle button to change output detail
      const cycleButtons = Array.from(
        document.querySelectorAll("[data-feedback-toolbar] button")
      ).filter((btn) => btn.textContent?.includes("Standard"));
      if (cycleButtons.length > 0) {
        fireEvent.click(cycleButtons[0]);
      }

      await waitFor(() => {
        const stored = localStorage.getItem("feedback-toolbar-settings");
        expect(stored).toBeTruthy();
        const settings = JSON.parse(stored!);
        expect(settings.outputDetail).toBe("detailed");
      });
    });

    it("saves theme preference to localStorage", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const settingsBtn = findButtonByTooltip("Settings");
      fireEvent.click(settingsBtn!);

      await waitFor(() => {
        const themeBtn = document.querySelector(
          'button[title="Switch to light mode"]'
        );
        expect(themeBtn).toBeTruthy();
      });

      const themeBtn = document.querySelector(
        'button[title="Switch to light mode"]'
      ) as HTMLButtonElement;
      fireEvent.click(themeBtn);

      await waitFor(() => {
        expect(localStorage.getItem("feedback-toolbar-theme")).toBe("light");
      });
    });

    it("loads saved settings from localStorage on mount", async () => {
      localStorage.setItem(
        "feedback-toolbar-settings",
        JSON.stringify({
          outputDetail: "forensic",
          autoClearAfterCopy: false,
          annotationColor: "#FF3B30",
          blockInteractions: true,
          reactEnabled: true,
          markerClickBehavior: "edit",
          webhookUrl: "",
          webhooksEnabled: true,
        })
      );

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const settingsBtn = findButtonByTooltip("Settings");
      fireEvent.click(settingsBtn!);

      await waitFor(() => {
        const bodyText = document.body.textContent || "";
        expect(bodyText).toContain("Forensic");
      });
    });

    it("loads saved theme from localStorage on mount", async () => {
      localStorage.setItem("feedback-toolbar-theme", "light");

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const settingsBtn = findButtonByTooltip("Settings");
      fireEvent.click(settingsBtn!);

      await waitFor(() => {
        const darkBtn = document.querySelector(
          'button[title="Switch to dark mode"]'
        );
        expect(darkBtn).toBeTruthy();
      });
    });
  });

  // =============================================================================
  // 13. Annotation Count & Badge
  // =============================================================================

  describe("Annotation count and badge", () => {
    it("badge shows correct count in collapsed state", async () => {
      const annotations = [
        makeAnnotation({ id: "b1" }),
        makeAnnotation({ id: "b2" }),
        makeAnnotation({ id: "b3" }),
        makeAnnotation({ id: "b4" }),
        makeAnnotation({ id: "b5" }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);

      await waitFor(() => {
        const bodyText = document.body.textContent || "";
        expect(bodyText).toContain("5");
      });
    });

    it("copy button is disabled when there are zero annotations", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const copyBtn = findButtonByTooltip("Copy feedback");
      expect(copyBtn).toBeTruthy();
      expect(copyBtn!.disabled).toBe(true);
    });
  });

  // =============================================================================
  // 14. Send Button
  // =============================================================================

  describe("Send button", () => {
    it("send button is present when webhookUrl is configured in settings", async () => {
      const annotations = [
        makeAnnotation({ id: "s1", comment: "Send test" }),
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
        })
      );

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const sendBtn = findButtonByTooltip("Send Annotations");
      expect(sendBtn).toBeTruthy();
    });

    it("calls onSubmit callback when send button is clicked", async () => {
      const onSubmit = vi.fn();
      const annotations = [
        makeAnnotation({ id: "sub1", comment: "Submit test" }),
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
        })
      );

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: true })
      );

      render(<PageFeedbackToolbarCSS onSubmit={onSubmit} />);
      await activateToolbar();

      const sendBtn = findButtonByTooltip("Send Annotations");
      expect(sendBtn).toBeTruthy();

      await act(async () => {
        fireEvent.click(sendBtn!);
      });

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      const [output, submittedAnnotations] = onSubmit.mock.calls[0];
      expect(typeof output).toBe("string");
      expect(output).toContain("Submit test");
      expect(submittedAnnotations).toHaveLength(1);
    });
  });

  // =============================================================================
  // 15. Edge Cases
  // =============================================================================

  describe("Edge cases", () => {
    it("handles empty comment in annotation gracefully", async () => {
      const onCopy = vi.fn();
      const annotations = [
        makeAnnotation({
          id: "empty1",
          comment: "",
          element: "EmptyButton",
        }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS onCopy={onCopy} />);
      await activateToolbar();

      const copyBtn = findButtonByTooltip("Copy feedback");
      await act(async () => {
        fireEvent.click(copyBtn!);
      });

      await waitFor(() => {
        expect(onCopy).toHaveBeenCalled();
      });

      const output = onCopy.mock.calls[0][0];
      expect(output).toContain("EmptyButton");
    });

    it("renders correctly when localStorage has corrupted annotation data", () => {
      localStorage.setItem(STORAGE_KEY, "not-valid-json{{{");

      expect(() => render(<PageFeedbackToolbarCSS />)).not.toThrow();

      const toolbar = document.querySelector("[data-feedback-toolbar]");
      expect(toolbar).toBeTruthy();
    });

    it("handles corrupted settings in localStorage gracefully", () => {
      localStorage.setItem(
        "feedback-toolbar-settings",
        "corrupted{not json"
      );

      expect(() => render(<PageFeedbackToolbarCSS />)).not.toThrow();
    });

    it("renders when both endpoint and webhookUrl are provided", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
      vi.spyOn(console, "warn").mockImplementation(() => {});

      render(
        <PageFeedbackToolbarCSS
          endpoint="http://localhost:4747"
          webhookUrl="https://example.com/webhook"
        />
      );

      await flushAsyncEffects();

      const toolbar = document.querySelector("[data-feedback-toolbar]");
      expect(toolbar).toBeTruthy();
    });
  });

  // =============================================================================
  // 16. Pause/Freeze Button
  // =============================================================================

  describe("Pause/Freeze button", () => {
    it("shows pause animations tooltip by default", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const pauseBtn = findButtonByTooltip("Pause animations");
      expect(pauseBtn).toBeTruthy();
    });

    it("button has data-active=false initially and true after clicking", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const pauseBtn = findButtonByTooltip("Pause animations");
      expect(pauseBtn).toBeTruthy();
      // Initially not frozen
      expect(pauseBtn!.getAttribute("data-active")).toBe("false");

      // Click to freeze - this calls freeze() which patches setTimeout,
      // but we can check the attribute synchronously
      fireEvent.click(pauseBtn!);

      // The button's data-active should now be true
      expect(pauseBtn!.getAttribute("data-active")).toBe("true");

      // Click again to unfreeze (restore setTimeout)
      fireEvent.click(pauseBtn!);
      expect(pauseBtn!.getAttribute("data-active")).toBe("false");
    });
  });

  // =============================================================================
  // 17. Settings Checkboxes
  // =============================================================================

  describe("Settings checkboxes", () => {
    it("toggles Clear on copy/send checkbox", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const settingsBtn = findButtonByTooltip("Settings");
      fireEvent.click(settingsBtn!);

      await waitFor(() => {
        expect(document.body.textContent).toContain("Clear on copy/send");
      });

      const checkbox = document.querySelector(
        "#autoClearAfterCopy"
      ) as HTMLInputElement;
      expect(checkbox).toBeTruthy();
      expect(checkbox.checked).toBe(false);

      fireEvent.click(checkbox);

      await waitFor(() => {
        const stored = localStorage.getItem("feedback-toolbar-settings");
        expect(stored).toBeTruthy();
        const settings = JSON.parse(stored!);
        expect(settings.autoClearAfterCopy).toBe(true);
      });
    });

    it("toggles Block page interactions checkbox", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const settingsBtn = findButtonByTooltip("Settings");
      fireEvent.click(settingsBtn!);

      await waitFor(() => {
        expect(document.body.textContent).toContain("Block page interactions");
      });

      const checkbox = document.querySelector(
        "#blockInteractions"
      ) as HTMLInputElement;
      expect(checkbox).toBeTruthy();
      expect(checkbox.checked).toBe(true);

      fireEvent.click(checkbox);

      await waitFor(() => {
        const stored = localStorage.getItem("feedback-toolbar-settings");
        expect(stored).toBeTruthy();
        const settings = JSON.parse(stored!);
        expect(settings.blockInteractions).toBe(false);
      });
    });
  });
});
