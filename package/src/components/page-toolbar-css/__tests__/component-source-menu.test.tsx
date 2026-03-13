/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const hooks = vi.hoisted(() => ({
  createUrl: vi.fn(() => "cursor://open?url=file:/src/Button.tsx&line=42&column=8"),
  inspect: vi.fn(() => [
    {
      displayName: "Button",
      props: { variant: "primary" },
      source: {
        fileName: "/src/Button.tsx",
        lineNumber: 42,
        columnNumber: 8,
        componentName: "Button",
      },
    },
  ]),
}));

vi.mock("../../../utils/component-inspector", async () => {
  const actual = await vi.importActual<typeof import("../../../utils/component-inspector")>(
    "../../../utils/component-inspector",
  );
  return {
    ...actual,
    createComponentSourceUrl: hooks.createUrl,
    inspectComponentElement: hooks.inspect,
  };
});

import { PageFeedbackToolbarCSS } from "../index";

async function activateToolbar(): Promise<void> {
  fireEvent.click(screen.getByTitle("Start feedback mode"));
  await waitFor(() => {
    expect(screen.queryByTitle("Start feedback mode")).toBeNull();
  });
}

describe("component source menu", () => {
  beforeEach(() => {
    hooks.createUrl.mockClear();
    hooks.inspect.mockClear();
    document.elementFromPoint = vi.fn();
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
    });
    Object.defineProperty(Location.prototype, "assign", {
      value: vi.fn(),
      configurable: true,
    });
  });

  it("opens a component menu on alt+right-click and navigates on selection", async () => {
    render(<PageFeedbackToolbarCSS componentEditor="cursor" />);
    await activateToolbar();

    const target = document.createElement("button");
    target.textContent = "Target";
    document.body.appendChild(target);
    vi.mocked(document.elementFromPoint).mockReturnValue(target);

    fireEvent.contextMenu(target, {
      altKey: true,
      clientX: 120,
      clientY: 180,
    });

    expect(await screen.findByText("<Button>")).toBeTruthy();
    expect(screen.getByText("src/Button.tsx:42:8")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /<Button>/ }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("src/Button.tsx:42:8");
    });
    expect(hooks.inspect).toHaveBeenCalledWith(target);
    expect(hooks.createUrl).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByText("<Button>")).toBeNull();
    });
  });

  it("can skip clipboard copying when disabled", async () => {
    render(<PageFeedbackToolbarCSS componentEditor="cursor" copyComponentSourcePath={false} />);
    await activateToolbar();

    const target = document.createElement("button");
    document.body.appendChild(target);
    vi.mocked(document.elementFromPoint).mockReturnValue(target);

    fireEvent.contextMenu(target, {
      altKey: true,
      clientX: 120,
      clientY: 180,
    });

    fireEvent.click(await screen.findByRole("button", { name: /<Button>/ }));

    await waitFor(() => {
      expect(hooks.createUrl).toHaveBeenCalled();
    });
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });
});
