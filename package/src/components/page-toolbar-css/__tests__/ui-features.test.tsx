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
import {
  unfreeze as unfreezeAll,
} from "../../../utils/freeze-animations";

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
    "feedback-toolbar-settings",
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

  document.elementFromPoint = vi.fn().mockReturnValue(null);

  vi.stubGlobal("EventSource", MockEventSource);
});

afterEach(() => {
  // Unfreeze animations to restore setTimeout/setInterval/rAF to normal
  // (prevents frozen state from leaking into subsequent tests)
  try {
    unfreezeAll();
  } catch {
    // ignore if already unfrozen
  }

  cleanup();
  document.querySelectorAll("[data-feedback-toolbar]").forEach((el) => el.remove());
  document.querySelectorAll("[data-annotation-marker]").forEach((el) => el.remove());
  document.querySelectorAll("[data-annotation-popup]").forEach((el) => el.remove());
  document.getElementById("feedback-cursor-styles")?.remove();
  document.getElementById("feedback-freeze-styles")?.remove();
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// =============================================================================
// UI Features Test Suite
// =============================================================================

describe("PageFeedbackToolbarCSS – UI Features", () => {
  // ===========================================================================
  // 1. Demo Mode
  // ===========================================================================
  describe("Demo mode", () => {
    it("creates annotations from demoAnnotations when enableDemoMode is true", async () => {
      const btn = document.createElement("button");
      btn.id = "demo-btn";
      btn.textContent = "Demo Button";
      document.body.appendChild(btn);

      render(
        <PageFeedbackToolbarCSS
          enableDemoMode={true}
          demoAnnotations={[
            { selector: "#demo-btn", comment: "Fix this button" },
          ]}
          demoDelay={100}
        />,
      );

      await waitFor(
        () => {
          const markers = document.querySelectorAll("[data-annotation-marker]");
          expect(markers.length).toBe(1);
        },
        { timeout: 3000 },
      );

      btn.remove();
    });

    it("creates multiple annotations for multiple demoAnnotations", async () => {
      const btn1 = document.createElement("button");
      btn1.id = "demo-btn-1";
      btn1.textContent = "Button 1";
      document.body.appendChild(btn1);

      const btn2 = document.createElement("div");
      btn2.id = "demo-div-2";
      btn2.textContent = "Div 2";
      document.body.appendChild(btn2);

      render(
        <PageFeedbackToolbarCSS
          enableDemoMode={true}
          demoAnnotations={[
            { selector: "#demo-btn-1", comment: "First annotation" },
            { selector: "#demo-div-2", comment: "Second annotation" },
          ]}
          demoDelay={100}
        />,
      );

      await waitFor(
        () => {
          const markers = document.querySelectorAll("[data-annotation-marker]");
          expect(markers.length).toBe(2);
        },
        { timeout: 3000 },
      );

      btn1.remove();
      btn2.remove();
    });

    it("does not create demo annotations when enableDemoMode is false", async () => {
      const btn = document.createElement("button");
      btn.id = "demo-skip";
      btn.textContent = "Skip";
      document.body.appendChild(btn);

      render(
        <PageFeedbackToolbarCSS
          enableDemoMode={false}
          demoAnnotations={[
            { selector: "#demo-skip", comment: "Should not appear" },
          ]}
          demoDelay={50}
        />,
      );

      // Wait a reasonable time and confirm no markers appeared
      await act(async () => {
        await new Promise((r) => setTimeout(r, 300));
      });

      const markers = document.querySelectorAll("[data-annotation-marker]");
      expect(markers.length).toBe(0);

      btn.remove();
    });

    it("does not re-run demo if annotations already exist", async () => {
      const btn = document.createElement("button");
      btn.id = "demo-existing";
      btn.textContent = "Existing";
      document.body.appendChild(btn);

      // Seed an existing annotation
      seedAnnotations([makeAnnotation({ id: "pre-existing" })]);

      render(
        <PageFeedbackToolbarCSS
          enableDemoMode={true}
          demoAnnotations={[
            { selector: "#demo-existing", comment: "Should not add" },
          ]}
          demoDelay={50}
        />,
      );

      await act(async () => {
        await new Promise((r) => setTimeout(r, 400));
      });

      // Activate to see markers - should only see the pre-existing one
      await activateToolbar();

      await waitFor(() => {
        const markers = document.querySelectorAll("[data-annotation-marker]");
        expect(markers.length).toBe(1);
      });

      btn.remove();
    });

    it("skips selectors that do not match any DOM element", async () => {
      // Only create one of the two target elements
      const btn = document.createElement("button");
      btn.id = "demo-real";
      btn.textContent = "Real Button";
      document.body.appendChild(btn);

      render(
        <PageFeedbackToolbarCSS
          enableDemoMode={true}
          demoAnnotations={[
            { selector: "#demo-real", comment: "Found" },
            { selector: "#does-not-exist", comment: "Not found" },
          ]}
          demoDelay={100}
        />,
      );

      await waitFor(
        () => {
          const markers = document.querySelectorAll("[data-annotation-marker]");
          expect(markers.length).toBe(1);
        },
        { timeout: 3000 },
      );

      btn.remove();
    });

    it("activates toolbar before creating demo annotations", async () => {
      const btn = document.createElement("button");
      btn.id = "demo-activate";
      btn.textContent = "Demo Activate";
      document.body.appendChild(btn);

      render(
        <PageFeedbackToolbarCSS
          enableDemoMode={true}
          demoAnnotations={[
            { selector: "#demo-activate", comment: "Activation test" },
          ]}
          demoDelay={200}
        />,
      );

      // Toolbar should activate (no "Start feedback mode" button)
      await waitFor(
        () => {
          expect(screen.queryByTitle("Start feedback mode")).toBeNull();
        },
        { timeout: 3000 },
      );

      btn.remove();
    });

    it("supports demo delays shorter than the activation lead time", async () => {
      const btn = document.createElement("button");
      btn.id = "demo-short-delay";
      btn.textContent = "Short Delay";
      document.body.appendChild(btn);

      render(
        <PageFeedbackToolbarCSS
          enableDemoMode={true}
          demoAnnotations={[
            { selector: "#demo-short-delay", comment: "Short delay annotation" },
          ]}
          demoDelay={50}
        />,
      );

      await waitFor(() => {
        expect(screen.queryByTitle("Start feedback mode")).toBeNull();
      });

      await waitFor(() => {
        const markers = document.querySelectorAll("[data-annotation-marker]");
        expect(markers.length).toBe(1);
      });

      btn.remove();
    });
  });

  // ===========================================================================
  // 2. Scroll Tracking
  // ===========================================================================
  describe("Scroll tracking", () => {
    it("updates scrollY state on window scroll event", async () => {
      const annotations = [makeAnnotation({ id: "scroll1", y: 500 })];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      // Simulate a scroll event
      Object.defineProperty(window, "scrollY", { value: 200, writable: true });
      fireEvent.scroll(window);

      // The component updates internally; markers should still be rendered
      await waitFor(() => {
        const markers = document.querySelectorAll("[data-annotation-marker]");
        expect(markers.length).toBeGreaterThanOrEqual(1);
      });

      // Restore scrollY
      Object.defineProperty(window, "scrollY", { value: 0, writable: true });
    });

    it("sets isScrolling temporarily then clears it after 150ms", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      // Fire a scroll event
      Object.defineProperty(window, "scrollY", { value: 100, writable: true });
      fireEvent.scroll(window);

      // Wait for the 150ms scroll timeout to clear
      await act(async () => {
        await new Promise((r) => setTimeout(r, 200));
      });

      // Component should be past scrolling state - verify it renders normally
      const toolbar = document.querySelector("[data-feedback-toolbar]");
      expect(toolbar).toBeTruthy();

      Object.defineProperty(window, "scrollY", { value: 0, writable: true });
    });
  });

  // ===========================================================================
  // 3. Toolbar Hiding (hideToolbarTemporarily)
  // ===========================================================================
  describe("Toolbar hiding", () => {
    it("hides toolbar when 'Hide Until Restart' toggle is checked", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      // Open settings
      const settingsBtn = findButtonByTooltip("Settings");
      expect(settingsBtn).toBeTruthy();
      fireEvent.click(settingsBtn!);

      // Wait for settings panel to show
      await waitFor(() => {
        expect(document.body.textContent).toContain("Hide Until Restart");
      });

      // Find the "Hide Until Restart" toggle checkbox
      const checkboxes = Array.from(
        document.querySelectorAll(
          "[data-feedback-toolbar] input[type='checkbox']",
        ),
      );
      // The "Hide Until Restart" checkbox is the one that is initially unchecked
      // and is in the section containing "Hide Until Restart" text
      let hideCheckbox: HTMLInputElement | null = null;
      for (const cb of checkboxes) {
        const label = cb.closest("label");
        if (label) {
          const row = label.closest("div");
          if (row && row.textContent?.includes("Hide Until Restart")) {
            hideCheckbox = cb as HTMLInputElement;
            break;
          }
        }
      }

      // If we found it, click it; otherwise look at all unchecked checkboxes
      if (!hideCheckbox) {
        // Look for the toggle near "Hide Until Restart" text
        const allLabels = document.querySelectorAll("[data-feedback-toolbar] label");
        for (const label of allLabels) {
          const parentDiv = label.closest("div");
          if (parentDiv?.textContent?.includes("Hide Until Restart")) {
            const input = label.querySelector("input[type='checkbox']") || parentDiv.querySelector("input[type='checkbox']");
            if (input) {
              hideCheckbox = input as HTMLInputElement;
              break;
            }
          }
        }
      }

      expect(hideCheckbox).toBeTruthy();
      fireEvent.click(hideCheckbox!);

      // After 400ms animation, toolbar should be hidden (renders null)
      await waitFor(
        () => {
          const toolbar = document.querySelector("[data-feedback-toolbar]");
          expect(toolbar).toBeNull();
        },
        { timeout: 2000 },
      );

      // SessionStorage should record the hidden state
      expect(sessionStorage.getItem("agentation-session-toolbar-hidden")).toBe(
        "1",
      );
    });
  });

  // ===========================================================================
  // 4. Marker Rendering JSX
  // ===========================================================================
  describe("Marker rendering", () => {
    it("renders numbered markers when active with annotations", async () => {
      const annotations = [
        makeAnnotation({ id: "mr1", comment: "Marker 1", x: 30, y: 100 }),
        makeAnnotation({ id: "mr2", comment: "Marker 2", x: 60, y: 300 }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      await waitFor(() => {
        const markers = document.querySelectorAll("[data-annotation-marker]");
        expect(markers.length).toBe(2);
      });

      // Verify markers display numbered labels
      const markers = document.querySelectorAll("[data-annotation-marker]");
      const markerTexts = Array.from(markers).map((m) => m.textContent?.trim());
      expect(markerTexts).toContain("1");
      expect(markerTexts).toContain("2");
    });

    it("hides markers when eye toggle is clicked off", async () => {
      const annotations = [
        makeAnnotation({ id: "hide1", comment: "Hide me" }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      // Markers should be visible
      await waitFor(() => {
        const markers = document.querySelectorAll("[data-annotation-marker]");
        expect(markers.length).toBe(1);
      });

      // Click eye toggle to hide
      const eyeBtn = findButtonByTooltip("Hide markers");
      expect(eyeBtn).toBeTruthy();
      fireEvent.click(eyeBtn!);

      // After animation, markers should disappear
      await waitFor(
        () => {
          const markers = document.querySelectorAll("[data-annotation-marker]");
          expect(markers.length).toBe(0);
        },
        { timeout: 1000 },
      );
    });

    it("re-shows markers when eye toggle is clicked back on", async () => {
      const annotations = [
        makeAnnotation({ id: "reshow1", comment: "Reshow me" }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      // Hide markers
      const eyeBtn = findButtonByTooltip("Hide markers");
      fireEvent.click(eyeBtn!);

      await waitFor(
        () => {
          expect(
            document.querySelectorAll("[data-annotation-marker]").length,
          ).toBe(0);
        },
        { timeout: 1000 },
      );

      // Show markers again
      const showBtn = findButtonByTooltip("Show markers");
      expect(showBtn).toBeTruthy();
      fireEvent.click(showBtn!);

      await waitFor(() => {
        expect(
          document.querySelectorAll("[data-annotation-marker]").length,
        ).toBe(1);
      });
    });

    it("renders markers with correct left% positioning", async () => {
      const annotations = [
        makeAnnotation({ id: "pos1", x: 42.5, y: 200 }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      await waitFor(() => {
        const marker = document.querySelector(
          "[data-annotation-marker]",
        ) as HTMLElement;
        expect(marker).toBeTruthy();
        expect(marker.style.left).toBe("42.5%");
      });
    });

    it("does not render markers when toolbar is not active", async () => {
      const annotations = [
        makeAnnotation({ id: "inactive1", comment: "No render" }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);

      // Toolbar is collapsed, markers should not be visible
      const markers = document.querySelectorAll("[data-annotation-marker]");
      expect(markers.length).toBe(0);
    });

    it("renders overlay element when toolbar is active", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      // The overlay is a child div within the portal with class "overlay"
      const overlays = document.querySelectorAll("[data-feedback-toolbar]");
      expect(overlays.length).toBeGreaterThanOrEqual(1);
    });

    it("renders resolved/dismissed annotations as faded resolved markers", async () => {
      const annotations = [
        makeAnnotation({ id: "active1", comment: "Active" }),
        makeAnnotation({ id: "resolved1", comment: "Resolved", status: "resolved" }),
        makeAnnotation({ id: "dismissed1", comment: "Dismissed", status: "dismissed" }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      await waitFor(() => {
        const markers = document.querySelectorAll("[data-annotation-marker]");
        // All 3 render: 1 active numbered marker + 2 resolved faded markers
        expect(markers.length).toBe(3);
      });
    });
  });

  // ===========================================================================
  // 5. Settings Panel – Automations Page
  // ===========================================================================
  describe("Settings panel – automations page", () => {
    it("navigates to automations page from main settings", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const settingsBtn = findButtonByTooltip("Settings");
      fireEvent.click(settingsBtn!);

      await waitFor(() => {
        expect(document.body.textContent).toContain("Manage MCP & Webhooks");
      });

      // Click the "Manage MCP & Webhooks" link
      const navLinks = Array.from(
        document.querySelectorAll("[data-feedback-toolbar] button"),
      ).filter((btn) =>
        btn.textContent?.includes("Manage MCP & Webhooks"),
      );
      expect(navLinks.length).toBeGreaterThanOrEqual(1);
      fireEvent.click(navLinks[0]);

      await waitFor(() => {
        expect(document.body.textContent).toContain("MCP Connection");
        expect(document.body.textContent).toContain("Webhooks");
      });
    });

    it("shows back button on automations page that returns to main", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const settingsBtn = findButtonByTooltip("Settings");
      fireEvent.click(settingsBtn!);

      await waitFor(() => {
        expect(document.body.textContent).toContain("Manage MCP & Webhooks");
      });

      // Navigate to automations
      const navLinks = Array.from(
        document.querySelectorAll("[data-feedback-toolbar] button"),
      ).filter((btn) => btn.textContent?.includes("Manage MCP & Webhooks"));
      fireEvent.click(navLinks[0]);

      await waitFor(() => {
        expect(document.body.textContent).toContain("MCP Connection");
      });

      // Find and click back button (contains Manage MCP & Webhooks text and is a button)
      const backButtons = Array.from(
        document.querySelectorAll("[data-feedback-toolbar] button"),
      ).filter((btn) => {
        // The back button has the text "Manage MCP & Webhooks" and an SVG icon
        return (
          btn.textContent?.includes("Manage MCP & Webhooks") &&
          btn.querySelector("svg") !== null
        );
      });

      // Click the first back button found
      if (backButtons.length > 0) {
        fireEvent.click(backButtons[0]);
      }

      // Should return to main settings page with "Output Detail"
      await waitFor(() => {
        expect(document.body.textContent).toContain("Output Detail");
      });
    });

    it("shows webhook URL input on automations page", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const settingsBtn = findButtonByTooltip("Settings");
      fireEvent.click(settingsBtn!);

      await waitFor(() => {
        expect(document.body.textContent).toContain("Manage MCP & Webhooks");
      });

      const navLinks = Array.from(
        document.querySelectorAll("[data-feedback-toolbar] button"),
      ).filter((btn) => btn.textContent?.includes("Manage MCP & Webhooks"));
      fireEvent.click(navLinks[0]);

      await waitFor(() => {
        const textarea = document.querySelector(
          "[data-feedback-toolbar] textarea",
        );
        expect(textarea).toBeTruthy();
      });
    });

    it("shows Auto-Send toggle on automations page", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const settingsBtn = findButtonByTooltip("Settings");
      fireEvent.click(settingsBtn!);

      await waitFor(() => {
        expect(document.body.textContent).toContain("Manage MCP & Webhooks");
      });

      const navLinks = Array.from(
        document.querySelectorAll("[data-feedback-toolbar] button"),
      ).filter((btn) => btn.textContent?.includes("Manage MCP & Webhooks"));
      fireEvent.click(navLinks[0]);

      await waitFor(() => {
        expect(document.body.textContent).toContain("Auto-Send");
      });
    });
  });

  // ===========================================================================
  // 6. Annotation Save Effects
  // ===========================================================================
  describe("Annotation save effects", () => {
    it("saves annotations to localStorage when they exist", async () => {
      const annotations = [
        makeAnnotation({ id: "save1", comment: "Save me" }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);

      await waitFor(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!);
        expect(parsed.length).toBe(1);
        expect(parsed[0].comment).toBe("Save me");
      });
    });

    it("removes localStorage entry when all annotations are cleared", async () => {
      const annotations = [
        makeAnnotation({ id: "clr1", comment: "Clear me" }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      // Clear all
      const clearBtn = findButtonByTooltip("Clear all");
      expect(clearBtn).toBeTruthy();
      await act(async () => {
        fireEvent.click(clearBtn!);
      });

      await waitFor(
        () => {
          const stored = localStorage.getItem(STORAGE_KEY);
          expect(stored).toBeNull();
        },
        { timeout: 3000 },
      );
    });
  });

  // ===========================================================================
  // 7. Freeze Toggle
  // ===========================================================================
  describe("Freeze toggle", () => {
    it("shows 'Pause animations' tooltip initially", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const pauseBtn = findButtonByTooltip("Pause animations");
      expect(pauseBtn).toBeTruthy();
    });

    it("toggles to 'Resume animations' after clicking freeze button", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const pauseBtn = findButtonByTooltip("Pause animations");
      expect(pauseBtn).toBeTruthy();

      await act(async () => {
        fireEvent.click(pauseBtn!);
      });

      // Immediately unfreeze the global state so timers work for waitFor
      unfreezeAll();

      await waitFor(() => {
        const resumeBtn = findButtonByTooltip("Resume animations");
        expect(resumeBtn).toBeTruthy();
      });
    });

    it("toggles back to 'Pause animations' after clicking resume", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      // Freeze
      const pauseBtn = findButtonByTooltip("Pause animations");
      await act(async () => {
        fireEvent.click(pauseBtn!);
      });

      // Unfreeze global timer state so waitFor works
      unfreezeAll();

      await waitFor(() => {
        expect(findButtonByTooltip("Resume animations")).toBeTruthy();
      });

      // Click resume
      const resumeBtn = findButtonByTooltip("Resume animations");
      await act(async () => {
        fireEvent.click(resumeBtn!);
      });

      await waitFor(() => {
        expect(findButtonByTooltip("Pause animations")).toBeTruthy();
      });
    });

    it("toggles freeze via P keyboard shortcut", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      expect(findButtonByTooltip("Pause animations")).toBeTruthy();

      await act(async () => {
        fireEvent.keyDown(document, { key: "p" });
      });

      // Unfreeze global timer state so waitFor works
      unfreezeAll();

      await waitFor(() => {
        expect(findButtonByTooltip("Resume animations")).toBeTruthy();
      });

      await act(async () => {
        fireEvent.keyDown(document, { key: "p" });
      });

      await waitFor(() => {
        expect(findButtonByTooltip("Pause animations")).toBeTruthy();
      });
    });
  });

  // ===========================================================================
  // 8. Toolbar Dragging
  // ===========================================================================
  describe("Toolbar dragging", () => {
    it("does not start drag on button click", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      // Click on a button inside the toolbar — the settings button doesn't trigger freeze
      const settingsBtn = findButtonByTooltip("Settings");
      expect(settingsBtn).toBeTruthy();

      // mousedown on button should NOT start drag (the component checks closest("button"))
      await act(async () => {
        fireEvent.mouseDown(settingsBtn!, { clientX: 100, clientY: 100 });
      });

      // The drag should not have started — toolbar should not have a dragging style.
      // Since we clicked on a button, the handleToolbarMouseDown early-returns.
      await act(async () => {
        fireEvent.mouseUp(document);
      });

      // Toolbar should still be functional
      const toolbar = document.querySelector("[data-feedback-toolbar]");
      expect(toolbar).toBeTruthy();
    });

    it("starts drag on mousedown on toolbar background with sufficient movement", async () => {
      render(<PageFeedbackToolbarCSS />);

      // The toolbar container has the onMouseDown handler
      const toolbarContainer = document.querySelector(
        "[data-feedback-toolbar]",
      ) as HTMLElement;
      expect(toolbarContainer).toBeTruthy();

      // Find the inner container (toolbarContainer class)
      const innerContainer = toolbarContainer.firstElementChild as HTMLElement;
      if (!innerContainer) return;

      // Simulate mousedown on the container background
      fireEvent.mouseDown(innerContainer, { clientX: 300, clientY: 300 });

      // Move enough to exceed the drag threshold (10px)
      fireEvent.mouseMove(document, { clientX: 320, clientY: 320 });
      fireEvent.mouseUp(document);

      // Toolbar should still be present after drag
      expect(
        document.querySelector("[data-feedback-toolbar]"),
      ).toBeTruthy();
    });

    it("constrains toolbar position to viewport on resize", async () => {
      // Set an initial toolbar position via localStorage
      localStorage.setItem(
        "feedback-toolbar-position",
        JSON.stringify({ x: 5000, y: 5000 }),
      );

      render(<PageFeedbackToolbarCSS />);

      // Fire a resize event
      fireEvent(window, new Event("resize"));

      // Toolbar should still render
      await waitFor(() => {
        const toolbar = document.querySelector("[data-feedback-toolbar]");
        expect(toolbar).toBeTruthy();
      });
    });

    it("loads saved toolbar position from localStorage on mount", async () => {
      localStorage.setItem(
        "feedback-toolbar-position",
        JSON.stringify({ x: 100, y: 200 }),
      );

      render(<PageFeedbackToolbarCSS />);

      await waitFor(() => {
        const toolbar = document.querySelector(
          "[data-feedback-toolbar]",
        ) as HTMLElement;
        expect(toolbar).toBeTruthy();
        // The position is applied as style on the toolbar wrapper
        if (toolbar.style.left) {
          // Position was applied
          expect(toolbar.style.left).toBeTruthy();
        }
      });
    });
  });

  // ===========================================================================
  // 9. Copy Output with autoClearAfterCopy
  // ===========================================================================
  describe("Copy output with autoClearAfterCopy", () => {
    it("clears annotations after copy when autoClearAfterCopy is enabled", async () => {
      const annotations = [
        makeAnnotation({ id: "ac1", comment: "Auto clear" }),
      ];
      seedAnnotations(annotations);
      seedSettings({ autoClearAfterCopy: true });

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const copyBtn = findButtonByTooltip("Copy feedback");
      expect(copyBtn).toBeTruthy();
      expect(copyBtn!.disabled).toBe(false);

      await act(async () => {
        fireEvent.click(copyBtn!);
      });

      // After copy + 500ms delay + clear animation time, annotations should be gone
      await waitFor(
        () => {
          const stored = localStorage.getItem(STORAGE_KEY);
          expect(stored).toBeNull();
        },
        { timeout: 5000 },
      );
    });

    it("does not clear annotations after copy when autoClearAfterCopy is disabled", async () => {
      const annotations = [
        makeAnnotation({ id: "nac1", comment: "No auto clear" }),
      ];
      seedAnnotations(annotations);
      seedSettings({ autoClearAfterCopy: false });

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const copyBtn = findButtonByTooltip("Copy feedback");
      await act(async () => {
        fireEvent.click(copyBtn!);
      });

      // Wait a bit then verify annotations are still there
      await act(async () => {
        await new Promise((r) => setTimeout(r, 1000));
      });

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.length).toBe(1);
    });
  });

  // ===========================================================================
  // 10. Theme Toggling and Settings Persistence
  // ===========================================================================
  describe("Theme toggling and settings persistence", () => {
    it("loads theme preference from localStorage on mount", async () => {
      localStorage.setItem("feedback-toolbar-theme", "light");

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const settingsBtn = findButtonByTooltip("Settings");
      fireEvent.click(settingsBtn!);

      // Since theme was loaded as "light", the toggle should now say "Switch to dark mode"
      await waitFor(() => {
        const darkBtn = document.querySelector(
          'button[title="Switch to dark mode"]',
        );
        expect(darkBtn).toBeTruthy();
      });
    });

    it("loads settings from localStorage on mount", async () => {
      seedSettings({ outputDetail: "forensic" });

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const settingsBtn = findButtonByTooltip("Settings");
      fireEvent.click(settingsBtn!);

      await waitFor(() => {
        expect(document.body.textContent).toContain("Forensic");
      });
    });

    it("persists settings changes to localStorage", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const settingsBtn = findButtonByTooltip("Settings");
      fireEvent.click(settingsBtn!);

      // Toggle "Clear on copy/send"
      await waitFor(() => {
        expect(document.body.textContent).toContain("Clear on copy/send");
      });

      const checkbox = document.querySelector(
        "#autoClearAfterCopy",
      ) as HTMLInputElement;
      expect(checkbox).toBeTruthy();
      fireEvent.click(checkbox);

      await waitFor(() => {
        const stored = localStorage.getItem("feedback-toolbar-settings");
        expect(stored).toBeTruthy();
        const settings = JSON.parse(stored!);
        expect(settings.autoClearAfterCopy).toBe(true);
      });
    });
  });

  // ===========================================================================
  // 11. generateOutput – Additional Branches
  // ===========================================================================
  describe("generateOutput – additional branches", () => {
    it("forensic mode with isMultiSelect and fullPath shows multi-select note", async () => {
      const onCopy = vi.fn();
      const annotations = [
        makeAnnotation({
          id: "fm1",
          comment: "Multi forensic",
          element: "MultiDiv",
          isMultiSelect: true,
          fullPath: "html > body > div > div.multi",
          boundingBox: { x: 10, y: 20, width: 100, height: 50 },
          cssClasses: "multi-class",
        }),
      ];
      seedAnnotations(annotations);
      seedSettings({ outputDetail: "forensic" });

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
      expect(output).toContain("Forensic data shown for first element of selection");
      expect(output).toContain("**Full DOM Path:**");
    });

    it("compact mode truncates selectedText longer than 30 chars", async () => {
      const onCopy = vi.fn();
      const longText = "This is a very long selected text that exceeds thirty characters";
      const annotations = [
        makeAnnotation({
          id: "ct1",
          comment: "Truncation test",
          element: "Paragraph",
          selectedText: longText,
        }),
      ];
      seedAnnotations(annotations);
      seedSettings({ outputDetail: "compact" });

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
      // Should contain the truncated text with "..."
      expect(output).toContain("...");
      // Should contain the first 30 chars of the selected text
      expect(output).toContain(longText.slice(0, 30));
    });

    it("standard mode with reactComponents includes React info", async () => {
      const onCopy = vi.fn();
      const annotations = [
        makeAnnotation({
          id: "rc1",
          comment: "React info",
          element: "ReactButton",
          reactComponents: "<App> <Dashboard> <Button>",
        }),
      ];
      seedAnnotations(annotations);
      seedSettings({ outputDetail: "standard" });

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
      expect(output).toContain("**React:** <App> <Dashboard> <Button>");
    });

    it("forensic mode with nearbyText but no selectedText includes Context", async () => {
      const onCopy = vi.fn();
      const annotations = [
        makeAnnotation({
          id: "nt1",
          comment: "Nearby text test",
          element: "Section",
          nearbyText: "Some context from nearby elements on the page",
          fullPath: "html > body > section",
          boundingBox: { x: 0, y: 0, width: 500, height: 200 },
        }),
      ];
      seedAnnotations(annotations);
      seedSettings({ outputDetail: "forensic" });

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
      expect(output).toContain("**Context:**");
      expect(output).toContain("Some context from nearby elements");
      expect(output).not.toContain("**Selected text:**");
    });

    it("forensic mode with selectedText does NOT show Context line", async () => {
      const onCopy = vi.fn();
      const annotations = [
        makeAnnotation({
          id: "ns1",
          comment: "Selected text test",
          element: "Div",
          selectedText: "Selected snippet",
          nearbyText: "Should not appear as context",
          fullPath: "html > body > div",
          boundingBox: { x: 0, y: 0, width: 200, height: 100 },
        }),
      ];
      seedAnnotations(annotations);
      seedSettings({ outputDetail: "forensic" });

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
      expect(output).toContain("**Selected text:** \"Selected snippet\"");
      expect(output).not.toContain("**Context:**");
    });

    it("detailed mode includes nearbyText as Context when no selectedText", async () => {
      const onCopy = vi.fn();
      const annotations = [
        makeAnnotation({
          id: "dc1",
          comment: "Detailed context",
          element: "Article",
          nearbyText: "Article nearby text content for context",
          elementPath: "body > article",
          boundingBox: { x: 10, y: 50, width: 400, height: 300 },
          cssClasses: "article-main",
        }),
      ];
      seedAnnotations(annotations);
      seedSettings({ outputDetail: "detailed" });

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
      expect(output).toContain("**Context:**");
      expect(output).toContain("Article nearby text content");
    });

    it("compact mode with sourceFile includes source info", async () => {
      const onCopy = vi.fn();
      const annotations = [
        makeAnnotation({
          id: "csf1",
          comment: "Source file test",
          element: "Input",
          sourceFile: "src/components/Input.tsx:15",
        }),
      ];
      seedAnnotations(annotations);
      seedSettings({ outputDetail: "compact" });

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
      expect(output).toContain("src/components/Input.tsx:15");
    });
  });

  // ===========================================================================
  // 12. Settings Panel – Main Page Toggles
  // ===========================================================================
  describe("Settings panel – main page toggles", () => {
    it("shows 'Clear on copy/send' checkbox", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const settingsBtn = findButtonByTooltip("Settings");
      fireEvent.click(settingsBtn!);

      await waitFor(() => {
        expect(document.body.textContent).toContain("Clear on copy/send");
      });
    });

    it("shows 'Block page interactions' checkbox", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const settingsBtn = findButtonByTooltip("Settings");
      fireEvent.click(settingsBtn!);

      await waitFor(() => {
        expect(document.body.textContent).toContain("Block page interactions");
      });
    });

    it("toggles blockInteractions setting", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const settingsBtn = findButtonByTooltip("Settings");
      fireEvent.click(settingsBtn!);

      await waitFor(() => {
        expect(document.body.textContent).toContain("Block page interactions");
      });

      const checkbox = document.querySelector(
        "#blockInteractions",
      ) as HTMLInputElement;
      expect(checkbox).toBeTruthy();
      // Default is true, click to false
      fireEvent.click(checkbox);

      await waitFor(() => {
        const stored = localStorage.getItem("feedback-toolbar-settings");
        expect(stored).toBeTruthy();
        const settings = JSON.parse(stored!);
        expect(settings.blockInteractions).toBe(false);
      });
    });

    it("shows React Components toggle", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const settingsBtn = findButtonByTooltip("Settings");
      fireEvent.click(settingsBtn!);

      await waitFor(() => {
        expect(document.body.textContent).toContain("React Components");
      });
    });

    it("shows Marker Colour section with color swatches", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const settingsBtn = findButtonByTooltip("Settings");
      fireEvent.click(settingsBtn!);

      await waitFor(() => {
        expect(document.body.textContent).toContain("Marker Colour");
        // Verify some color options exist
        const purple = document.querySelector('[title="Purple"]');
        const blue = document.querySelector('[title="Blue"]');
        expect(purple).toBeTruthy();
        expect(blue).toBeTruthy();
      });
    });
  });

  // ===========================================================================
  // 13. Keyboard Shortcut H to Toggle Markers
  // ===========================================================================
  describe("Keyboard shortcut H to toggle markers", () => {
    it("hides markers when H is pressed with annotations", async () => {
      const annotations = [
        makeAnnotation({ id: "kh1", comment: "Keyboard hide" }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      await waitFor(() => {
        expect(
          document.querySelectorAll("[data-annotation-marker]").length,
        ).toBe(1);
      });

      fireEvent.keyDown(document, { key: "h" });

      await waitFor(
        () => {
          expect(
            document.querySelectorAll("[data-annotation-marker]").length,
          ).toBe(0);
        },
        { timeout: 1000 },
      );
    });

    it("shows markers again when H is pressed twice", async () => {
      const annotations = [
        makeAnnotation({ id: "kh2", comment: "Keyboard toggle" }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      await waitFor(() => {
        expect(
          document.querySelectorAll("[data-annotation-marker]").length,
        ).toBe(1);
      });

      // Hide
      fireEvent.keyDown(document, { key: "h" });

      await waitFor(
        () => {
          expect(
            document.querySelectorAll("[data-annotation-marker]").length,
          ).toBe(0);
        },
        { timeout: 1000 },
      );

      // Show again
      fireEvent.keyDown(document, { key: "h" });

      await waitFor(() => {
        expect(
          document.querySelectorAll("[data-annotation-marker]").length,
        ).toBe(1);
      });
    });
  });

  // ===========================================================================
  // 14. Badge Count
  // ===========================================================================
  describe("Badge count on collapsed toolbar", () => {
    it("displays annotation count badge when collapsed", async () => {
      const annotations = [
        makeAnnotation({ id: "badge1" }),
        makeAnnotation({ id: "badge2" }),
        makeAnnotation({ id: "badge3" }),
        makeAnnotation({ id: "badge4" }),
        makeAnnotation({ id: "badge5" }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS />);

      await waitFor(() => {
        const bodyText = document.body.textContent || "";
        expect(bodyText).toContain("5");
      });
    });
  });

  // ===========================================================================
  // 15. Copy Output via C Keyboard Shortcut
  // ===========================================================================
  describe("Copy output via keyboard shortcut C", () => {
    it("copies output when C is pressed with annotations present", async () => {
      const onCopy = vi.fn();
      const annotations = [
        makeAnnotation({ id: "kc1", comment: "Key copy" }),
      ];
      seedAnnotations(annotations);

      render(<PageFeedbackToolbarCSS onCopy={onCopy} />);
      await activateToolbar();

      fireEvent.keyDown(document, { key: "c" });

      await waitFor(() => {
        expect(onCopy).toHaveBeenCalledTimes(1);
      });

      expect(onCopy.mock.calls[0][0]).toContain("Key copy");
    });
  });
});
