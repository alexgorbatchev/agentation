import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, fireEvent, userEvent, waitFor, within } from "storybook/test";
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

const STORYBOOK_ACK_ENDPOINT = "http://localhost:4747";
const STORYBOOK_ACK_SESSION_ID = "storybook-ack-session";
const STORYBOOK_ACK_ANNOTATION_ID = "storybook-ack-annotation";
const STORYBOOK_ACK_COMMENT = "Button spacing needs fixing";

const originalFetch = globalThis.fetch;
const originalEventSource = globalThis.EventSource;

type EventSourceListener = (event: MessageEvent) => void;
type StoryEventSourceState = {
  instance: {
    listenersByType: Map<string, EventSourceListener[]>;
    url: string;
  } | null;
};

const storyEventSourceState: StoryEventSourceState = {
  instance: null,
};

function getStorageKey(): string {
  return `feedback-annotations-${window.location.pathname}`;
}

function seedAnnotations(annotations: Annotation[]): void {
  localStorage.setItem(getStorageKey(), JSON.stringify(annotations));
}

function restoreStoryGlobals(): void {
  globalThis.fetch = originalFetch;
  globalThis.EventSource = originalEventSource;
  storyEventSourceState.instance = null;
}

function makeAcknowledgementAnnotation(): Annotation {
  return makeAnnotation({
    id: STORYBOOK_ACK_ANNOTATION_ID,
    comment: STORYBOOK_ACK_COMMENT,
    element: "Primary button",
  });
}

function installAcknowledgementStoryMocks(): void {
  const pendingAnnotation = makeAcknowledgementAnnotation();

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input.toString();
    const method = init?.method ?? "GET";

    if (url === `${STORYBOOK_ACK_ENDPOINT}/health` && method === "GET") {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (
      url === `${STORYBOOK_ACK_ENDPOINT}/sessions/${STORYBOOK_ACK_SESSION_ID}` &&
      method === "GET"
    ) {
      return new Response(
        JSON.stringify({
          annotations: [pendingAnnotation],
          createdAt: Date.now(),
          id: STORYBOOK_ACK_SESSION_ID,
          status: "active",
          url: "http://localhost:6006/iframe.html",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  };

  class StoryEventSource {
    static readonly CLOSED = 2;
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;

    listenersByType = new Map<string, EventSourceListener[]>();
    url: string;

    constructor(url: string) {
      this.url = url;
      storyEventSourceState.instance = {
        listenersByType: this.listenersByType,
        url,
      };
    }

    addEventListener(type: string, listener: EventSourceListener): void {
      const listeners = this.listenersByType.get(type) ?? [];
      this.listenersByType.set(type, [...listeners, listener]);
    }

    removeEventListener(type: string, listener: EventSourceListener): void {
      const listeners = this.listenersByType.get(type) ?? [];
      this.listenersByType.set(
        type,
        listeners.filter((candidate) => candidate !== listener),
      );
    }

    close(): void {
      storyEventSourceState.instance = null;
    }
  }

  Object.defineProperty(globalThis, "EventSource", {
    configurable: true,
    value: StoryEventSource,
    writable: true,
  });
}

function emitAcknowledgementEvent(): void {
  const eventSourceInstance = storyEventSourceState.instance;
  if (eventSourceInstance === null) {
    throw new Error("Expected EventSource instance to exist before emitting acknowledgement event.");
  }

  const listeners = eventSourceInstance.listenersByType.get("annotation.updated") ?? [];
  const eventMessage = new MessageEvent("message", {
    data: JSON.stringify({
      payload: {
        id: STORYBOOK_ACK_ANNOTATION_ID,
        status: "acknowledged",
      },
    }),
  });

  for (const listener of listeners) {
    listener(eventMessage);
  }
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
  args: {
    componentEditor: "neovim",
    neovimBridgeUrl: "http://127.0.0.1:8787",
  },
  beforeEach: () => {
    restoreStoryGlobals();
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

export const AcknowledgementNotification: Story = {
  args: {
    endpoint: STORYBOOK_ACK_ENDPOINT,
    sessionId: STORYBOOK_ACK_SESSION_ID,
  },
  beforeEach: () => {
    localStorage.clear();
    sessionStorage.clear();
    installAcknowledgementStoryMocks();
  },
  play: async () => {
    await clickToolbar();

    await waitFor(() => {
      const pendingMarker = document.querySelector(
        '[data-annotation-status="pending"]',
      );
      expect(pendingMarker).toBeTruthy();
    });

    await waitFor(() => {
      expect(storyEventSourceState.instance).toBeTruthy();
    });

    emitAcknowledgementEvent();

    const body = within(document.body);
    await waitFor(() => {
      expect(body.getByText("agentation ack")).toBeTruthy();
      expect(body.getByText(STORYBOOK_ACK_COMMENT)).toBeTruthy();
    });

    const acknowledgedMarker = document.querySelector(
      '[data-annotation-status="acknowledged"]',
    );
    await expect(acknowledgedMarker?.getAttribute("title")).toBe(
      "Agent is working on this feedback",
    );
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
