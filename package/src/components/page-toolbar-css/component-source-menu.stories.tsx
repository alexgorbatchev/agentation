import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, waitFor } from "storybook/test";

import { PageFeedbackToolbarCSS } from "./index";

type ComponentStoryProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
};

function StatusPill(): JSX.Element {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        padding: "6px 10px",
        background: "rgba(34,197,94,0.14)",
        color: "#bbf7d0",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      Live preview
    </span>
  );
}

function ActionButton(props: { label: string }): JSX.Element {
  return (
    <button
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
      {props.label}
    </button>
  );
}

function ActionRow(props: { ctaLabel: string }): JSX.Element {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <ActionButton label={props.ctaLabel} />
      <span style={{ color: "rgba(226,232,240,0.72)", fontSize: 13 }}>
        Alt+right-click the button to inspect nested React owners.
      </span>
    </div>
  );
}

function ProfileCard(props: ComponentStoryProps): JSX.Element {
  return (
    <div
      style={{
        borderRadius: 24,
        padding: 28,
        background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(30,41,59,0.94))",
        border: "1px solid rgba(148,163,184,0.18)",
        boxShadow: "0 24px 80px rgba(15,23,42,0.4)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <StatusPill />
        <div style={{ color: "rgba(226,232,240,0.56)", fontSize: 12 }}>Layer 3: ProfileCard</div>
      </div>
      <h1 style={{ margin: "20px 0 8px", fontSize: 34, color: "#f8fafc" }}>{props.title}</h1>
      <p style={{ margin: "0 0 24px", color: "#cbd5e1", fontSize: 16, lineHeight: 1.6 }}>
        {props.subtitle}
      </p>
      <ActionRow ctaLabel={props.ctaLabel} />
    </div>
  );
}

function InspectorPanel(props: ComponentStoryProps): JSX.Element {
  return (
    <section
      style={{
        width: "min(760px, 100%)",
        display: "grid",
        gap: 20,
      }}
    >
      <div style={{ color: "rgba(226,232,240,0.62)", fontSize: 12 }}>Layer 2: InspectorPanel</div>
      <ProfileCard {...props} />
    </section>
  );
}

function DashboardShell(props: ComponentStoryProps): JSX.Element {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "72px 24px 120px",
        background:
          "radial-gradient(circle at top left, rgba(14,165,233,0.18), transparent 32%), linear-gradient(180deg, #020617, #0f172a)",
      }}
    >
      <div style={{ margin: "0 auto", width: "min(960px, 100%)" }}>
        <div style={{ color: "rgba(226,232,240,0.54)", fontSize: 12, marginBottom: 18 }}>
          Layer 1: DashboardShell
        </div>
        <InspectorPanel {...props} />
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

const meta: Meta<typeof PageFeedbackToolbarCSS> = {
  title: "PageToolbar/ComponentSourceMenu",
  component: PageFeedbackToolbarCSS,
  decorators: [
    (Story) => (
      <div>
        <DashboardShell
          title="Component Source Inspector"
          subtitle="Hold Alt and right-click nested UI to open the copied click-to-component-style source picker."
          ctaLabel="Inspect this button"
        />
        <Story />
      </div>
    ),
  ],
  args: {
    componentEditor: "cursor",
  },
};

export default meta;

type Story = StoryObj<typeof PageFeedbackToolbarCSS>;

export const Ready: Story = {
  play: async (): Promise<void> => {
    await activateToolbar();
  },
};
