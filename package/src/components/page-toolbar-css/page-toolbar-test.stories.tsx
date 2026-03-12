import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, fireEvent, userEvent, waitFor } from "storybook/test";
import { PageFeedbackToolbarCSS } from "./index";
import type { Annotation } from "../../types";

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

function getStorageKey() {
  return `feedback-annotations-${window.location.pathname}`;
}

function seedAnnotations(annotations: Annotation[]) {
  localStorage.setItem(getStorageKey(), JSON.stringify(annotations));
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

async function clickToolbar() {
  await waitFor(
    () => {
      const btn = document.querySelector<HTMLElement>(
        '[title="Start feedback mode"]'
      );
      if (!btn) throw new Error("Toolbar not found");
      return btn;
    },
    { timeout: 5000 }
  );
  const btn = document.querySelector<HTMLElement>(
    '[title="Start feedback mode"]'
  )!;
  await userEvent.click(btn);
  btn.blur();
}

const meta: Meta<typeof PageFeedbackToolbarCSS> = {
  title: "Tests/PageToolbar",
  component: PageFeedbackToolbarCSS,
  beforeEach: () => {
    localStorage.clear();
    sessionStorage.clear();
  },
  decorators: [
    (Story) => (
      <div>
        <div style={{ maxWidth: 600, margin: "0 auto", color: "#e0e0e0" }}>
          <h1 style={{ fontSize: 24, marginBottom: 16 }}>Sample Page</h1>
          <p style={{ marginBottom: 12, lineHeight: 1.6 }}>
            Sample content for toolbar annotation tests.
          </p>
          <button
            style={{
              padding: "8px 16px",
              background: "#3c82f7",
              color: "white",
              border: "none",
              borderRadius: 6,
            }}
          >
            Submit Button
          </button>
        </div>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof PageFeedbackToolbarCSS>;

// =============================================================================
// Rendering
// =============================================================================

export const RendersCollapsed: Story = {
  play: async () => {
    const toolbar = document.querySelector("[data-feedback-toolbar]");
    await expect(toolbar).toBeTruthy();

    const btn = document.querySelector('[title="Start feedback mode"]');
    await expect(btn).toBeTruthy();
    await expect(btn!.getAttribute("role")).toBe("button");
    await expect(btn!.getAttribute("tabindex")).toBe("0");
  },
};

// =============================================================================
// Activation / Deactivation
// =============================================================================

export const ActivatesOnClick: Story = {
  play: async () => {
    await clickToolbar();
    const btn = document.querySelector('[title="Start feedback mode"]');
    await expect(btn).toBeNull();

    const toolbarButtons = document.querySelectorAll(
      "[data-feedback-toolbar] button"
    );
    await expect(toolbarButtons.length).toBeGreaterThanOrEqual(5);

    await expect(findButtonByTooltip("Copy feedback")).toBeTruthy();
    await expect(findButtonByTooltip("Clear all")).toBeTruthy();
    await expect(findButtonByTooltip("Settings")).toBeTruthy();
    await expect(findButtonByTooltip("Exit")).toBeTruthy();
  },
};

export const DeactivatesOnEscape: Story = {
  play: async () => {
    await clickToolbar();
    await expect(
      document.querySelector('[title="Start feedback mode"]')
    ).toBeNull();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      const btn = document.querySelector('[title="Start feedback mode"]');
      expect(btn).toBeTruthy();
    });
  },
};

// =============================================================================
// Annotations from localStorage
// =============================================================================

export const WithAnnotations: Story = {
  beforeEach: () => {
    localStorage.clear();
    sessionStorage.clear();
    seedAnnotations([
      makeAnnotation({ id: "a1", comment: "First" }),
      makeAnnotation({ id: "a2", comment: "Second" }),
      makeAnnotation({ id: "a3", comment: "Third" }),
    ]);
  },
  play: async () => {
    await clickToolbar();
    const copyBtn = findButtonByTooltip("Copy feedback");
    await expect(copyBtn).toBeTruthy();
    await expect(copyBtn!.disabled).toBe(false);
  },
};

export const AnnotationCount: Story = {
  beforeEach: () => {
    localStorage.clear();
    sessionStorage.clear();
    seedAnnotations([
      makeAnnotation({ id: "a1" }),
      makeAnnotation({ id: "a2" }),
      makeAnnotation({ id: "a3" }),
    ]);
  },
  play: async () => {
    await waitFor(() => {
      const bodyText = document.body.textContent || "";
      expect(bodyText).toContain("3");
    });
  },
};

// =============================================================================
// Eye Toggle (Show/Hide Markers)
// =============================================================================

export const EyeToggle: Story = {
  beforeEach: () => {
    localStorage.clear();
    sessionStorage.clear();
    seedAnnotations([
      makeAnnotation({ id: "eye1", comment: "Marker test" }),
    ]);
  },
  play: async () => {
    await clickToolbar();

    const hideBtn = findButtonByTooltip("Hide markers");
    await expect(hideBtn).toBeTruthy();

    await userEvent.click(hideBtn!);

    await waitFor(() => {
      const showBtn = findButtonByTooltip("Show markers");
      expect(showBtn).toBeTruthy();
    });
  },
};

// =============================================================================
// Pause/Freeze
// =============================================================================

export const PauseFreeze: Story = {
  play: async () => {
    await clickToolbar();

    // Verify the pause button exists (don't click — freeze-animations
    // monkey-patches global timers which breaks waitFor/vitest internals)
    const pauseBtn = findButtonByTooltip("Pause animations");
    await expect(pauseBtn).toBeTruthy();
    await expect(pauseBtn!.disabled).toBe(false);
  },
};

// =============================================================================
// Copy to Clipboard
// =============================================================================

export const CopyToClipboard: Story = {
  args: {
    onCopy: fn(),
    copyToClipboard: false,
  },
  beforeEach: () => {
    localStorage.clear();
    sessionStorage.clear();
    seedAnnotations([
      makeAnnotation({ id: "c1", comment: "Copy me", element: "Div" }),
    ]);
  },
  play: async ({ args }) => {
    await clickToolbar();

    // Wait for annotations to load and copy button to become enabled
    await waitFor(() => {
      const copyBtn = findButtonByTooltip("Copy feedback");
      expect(copyBtn).toBeTruthy();
      expect(copyBtn!.disabled).toBe(false);
    });

    const copyBtn = findButtonByTooltip("Copy feedback")!;
    await userEvent.click(copyBtn);

    await waitFor(() => {
      expect(args.onCopy).toHaveBeenCalledTimes(1);
    });

    const markdown = (args.onCopy as ReturnType<typeof fn>).mock.calls[0][0];
    await expect(markdown).toContain("Copy me");
    await expect(markdown).toContain("## Page Feedback");
  },
};

// =============================================================================
// Clear All
// =============================================================================

export const ClearAll: Story = {
  args: {
    onAnnotationsClear: fn(),
  },
  beforeEach: () => {
    localStorage.clear();
    sessionStorage.clear();
    seedAnnotations([
      makeAnnotation({ id: "cl1", comment: "Clear me" }),
      makeAnnotation({ id: "cl2", comment: "Clear me too" }),
    ]);
  },
  play: async ({ args }) => {
    await clickToolbar();

    const clearBtn = findButtonByTooltip("Clear all");
    await expect(clearBtn!.disabled).toBe(false);
    await userEvent.click(clearBtn!);

    await waitFor(() => {
      expect(args.onAnnotationsClear).toHaveBeenCalledTimes(1);
    });

    await waitFor(
      () => {
        const copyBtn = findButtonByTooltip("Copy feedback");
        expect(copyBtn!.disabled).toBe(true);
      },
      { timeout: 3000 }
    );
  },
};

// =============================================================================
// Settings Panel
// =============================================================================

export const SettingsPanel: Story = {
  play: async () => {
    await clickToolbar();

    const settingsBtn = findButtonByTooltip("Settings");
    await userEvent.click(settingsBtn!);

    await waitFor(() => {
      const bodyText = document.body.textContent || "";
      expect(bodyText).toContain("Output Detail");
      expect(bodyText).toContain("agentation");
      expect(bodyText).toContain("vtest");
    });

    const cycleButtons = Array.from(
      document.querySelectorAll("[data-feedback-toolbar] button")
    ).filter((btn) => btn.textContent?.includes("Standard"));
    await expect(cycleButtons.length).toBeGreaterThanOrEqual(1);

    await userEvent.click(cycleButtons[0]);
    await waitFor(() => {
      expect(document.body.textContent).toContain("Detailed");
    });
  },
};

// =============================================================================
// Keyboard Shortcuts
// =============================================================================

export const KeyboardShortcuts: Story = {
  play: async () => {
    await expect(
      document.querySelector('[title="Start feedback mode"]')
    ).toBeTruthy();

    fireEvent.keyDown(document, {
      key: "f",
      metaKey: true,
      shiftKey: true,
    });

    await waitFor(() => {
      expect(
        document.querySelector('[title="Start feedback mode"]')
      ).toBeNull();
    });

    fireEvent.keyDown(document, {
      key: "f",
      metaKey: true,
      shiftKey: true,
    });

    await waitFor(() => {
      expect(
        document.querySelector('[title="Start feedback mode"]')
      ).toBeTruthy();
    });
  },
};
