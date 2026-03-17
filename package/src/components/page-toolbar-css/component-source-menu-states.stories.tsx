import type { Meta, StoryObj } from "@storybook/react";
import { fireEvent, userEvent, waitFor } from "storybook/test";

import { PageFeedbackToolbarCSS } from "./index";

type FiberSource = {
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
};

type FiberNode = {
  name: string;
  source: FiberSource;
  props?: Record<string, unknown>;
};

type ReactFiber = {
  type?: {
    displayName?: string;
    name?: string;
  };
  _debugSource?: FiberSource | null;
  memoizedProps?: Record<string, unknown>;
  _debugOwner?: ReactFiber | null;
};

function makeFiberChain(nodes: FiberNode[]): ReactFiber {
  let owner: ReactFiber | null = null;

  for (let index = nodes.length - 1; index >= 0; index -= 1) {
    const node = nodes[index];
    owner = {
      type: { displayName: node.name },
      _debugSource: node.source,
      memoizedProps: node.props,
      _debugOwner: owner,
    };
  }

  if (!owner) {
    throw new Error("Fiber node chain must include at least one node");
  }

  return owner;
}

function attachFiber(target: HTMLElement, fiber: ReactFiber): void {
  Object.defineProperty(target, "__reactFiber$storybook", {
    value: fiber,
    configurable: true,
    enumerable: true,
  });
}

function DemoSurface(): JSX.Element {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "72px 24px 140px",
        background:
          "radial-gradient(circle at top left, rgba(14,165,233,0.18), transparent 32%), linear-gradient(180deg, #020617, #0f172a)",
      }}
    >
      <div
        style={{
          margin: "0 auto",
          width: "min(900px, 100%)",
          borderRadius: 20,
          padding: 28,
          border: "1px solid rgba(148,163,184,0.2)",
          background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(30,41,59,0.94))",
          color: "#e2e8f0",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Component source menu state playground</h2>
        <p style={{ color: "#cbd5e1", marginBottom: 18 }}>
          Stories in this file open the component menu automatically with deterministic fiber payloads.
        </p>
        <button
          data-component-source-target
          style={{
            border: "none",
            borderRadius: 999,
            padding: "12px 18px",
            background: "linear-gradient(135deg, #f97316, #ef4444)",
            color: "white",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 12px 24px rgba(239,68,68,0.25)",
          }}
        >
          Open source menu target
        </button>
      </div>
    </div>
  );
}

async function activateToolbar(): Promise<void> {
  await waitFor(
    () => {
      const button = document.querySelector<HTMLElement>('[title="Start feedback mode"]');
      if (!button) {
        throw new Error("Toolbar not found");
      }
      return button;
    },
    { timeout: 5000 },
  );

  const button = document.querySelector<HTMLElement>('[title="Start feedback mode"]');
  if (!button) {
    throw new Error("Toolbar not found");
  }

  await userEvent.click(button);
  button.blur();
}

async function openMenuForFiber(fiber: ReactFiber): Promise<void> {
  await activateToolbar();

  const target = document.querySelector<HTMLElement>("[data-component-source-target]");
  if (!target) {
    throw new Error("Component source target not found");
  }

  attachFiber(target, fiber);

  const originalElementFromPoint = document.elementFromPoint;
  Object.defineProperty(document, "elementFromPoint", {
    value: () => target,
    configurable: true,
  });

  const rect = target.getBoundingClientRect();
  fireEvent.contextMenu(target, {
    altKey: true,
    clientX: rect.left + 8,
    clientY: rect.top + 8,
  });

  Object.defineProperty(document, "elementFromPoint", {
    value: originalElementFromPoint,
    configurable: true,
  });

  await waitFor(() => {
    const menu = document.querySelector("[data-component-source-menu]");
    if (!menu) {
      throw new Error("Component source menu not rendered");
    }
  });
}

const meta: Meta<typeof PageFeedbackToolbarCSS> = {
  title: "PageToolbar/ComponentSourceMenuStates",
  component: PageFeedbackToolbarCSS,
  decorators: [
    (Story) => (
      <div>
        <DemoSurface />
        <Story />
      </div>
    ),
  ],
  args: {
    componentEditor: "neovim",
    neovimBridgeUrl: "http://127.0.0.1:8787",
  },
};

export default meta;

type Story = StoryObj<typeof PageFeedbackToolbarCSS>;

export const SingleOption: Story = {
  play: async (): Promise<void> => {
    await openMenuForFiber(
      makeFiberChain([
        {
          name: "PrimaryButton",
          source: {
            fileName: "/src/components/PrimaryButton.tsx",
            lineNumber: 48,
            columnNumber: 9,
          },
          props: { variant: "danger", disabled: false },
        },
      ]),
    );
  },
};

export const OwnerChain: Story = {
  play: async (): Promise<void> => {
    await openMenuForFiber(
      makeFiberChain([
        {
          name: "ActionButton",
          source: {
            fileName: "/src/components/toolbar/ActionButton.tsx",
            lineNumber: 18,
            columnNumber: 3,
          },
          props: { tone: "critical" },
        },
        {
          name: "ActionRow",
          source: {
            fileName: "/src/components/toolbar/ActionRow.tsx",
            lineNumber: 44,
            columnNumber: 5,
          },
          props: { size: "md" },
        },
        {
          name: "InspectorPanel",
          source: {
            fileName: "/src/components/InspectorPanel.tsx",
            lineNumber: 72,
            columnNumber: 7,
          },
        },
      ]),
    );
  },
};

export const LongFilePaths: Story = {
  play: async (): Promise<void> => {
    await openMenuForFiber(
      makeFiberChain([
        {
          name: "ExtremelyDetailedTelemetryAndDiagnosticsPanel",
          source: {
            fileName:
              "/Users/alex/development/github/agentation/agentation/package/src/components/page-toolbar-css/states/ExtremelyDetailedTelemetryAndDiagnosticsPanel.tsx",
            lineNumber: 138,
            columnNumber: 17,
          },
          props: {
            releaseChannel: "canary",
            showDiagnosticsTimeline: true,
          },
        },
        {
          name: "AutomationSettingsContainer",
          source: {
            fileName:
              "/Users/alex/development/github/agentation/agentation/package/src/components/page-toolbar-css/states/AutomationSettingsContainer.tsx",
            lineNumber: 42,
            columnNumber: 11,
          },
        },
      ]),
    );
  },
};
