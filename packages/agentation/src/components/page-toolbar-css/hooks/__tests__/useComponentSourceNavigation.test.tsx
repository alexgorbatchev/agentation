/** @vitest-environment jsdom */

import { useEffect } from "react";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ComponentInspection } from "../../../../utils/component-inspector";
import { useComponentSourceNavigation } from "../useComponentSourceNavigation";

const componentInspectorMocks = vi.hoisted(() => ({
  createComponentSourceUrl: vi.fn(),
  formatComponentSourcePath: vi.fn(),
}));

vi.mock("../../../../utils/component-inspector", async () => {
  const actual = await vi.importActual<typeof import("../../../../utils/component-inspector")>(
    "../../../../utils/component-inspector",
  );

  return {
    ...actual,
    createComponentSourceUrl: componentInspectorMocks.createComponentSourceUrl,
    formatComponentSourcePath: componentInspectorMocks.formatComponentSourcePath,
  };
});

type HarnessProps = {
  onReady: (openComponentSource: (item: ComponentInspection) => Promise<void>) => void;
  copyComponentSourcePath: boolean;
  componentEditor: "cursor" | "neovim";
  navigateToUrl: (url: string) => void;
  closeComponentMenu: () => void;
};

function NavigationHarness({
  onReady,
  copyComponentSourcePath,
  componentEditor,
  navigateToUrl,
  closeComponentMenu,
}: HarnessProps): JSX.Element {
  const { openComponentSource } = useComponentSourceNavigation({
    copyComponentSourcePath,
    componentEditor,
    normalizedNeovimBridgeUrl: "http://127.0.0.1:8777",
    navigateToUrl,
    closeComponentMenu,
  });

  useEffect(() => {
    onReady(openComponentSource);
  }, [onReady, openComponentSource]);

  return <div />;
}

const testInspection: ComponentInspection = {
  displayName: "Button",
  props: {},
  source: {
    fileName: "src/Button.tsx",
    lineNumber: 12,
    columnNumber: 3,
    componentName: "Button",
  },
};

describe("useComponentSourceNavigation", () => {
  beforeEach(() => {
    componentInspectorMocks.createComponentSourceUrl.mockReset();
    componentInspectorMocks.formatComponentSourcePath.mockReset();

    componentInspectorMocks.formatComponentSourcePath.mockReturnValue(
      "src/Button.tsx:12:3",
    );

    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true }),
    );
  });

  it("copies source path, navigates via editor URL, and closes menu", async () => {
    componentInspectorMocks.createComponentSourceUrl.mockReturnValue(
      "cursor://open?url=file:/src/Button.tsx&line=12&column=3",
    );

    const onReady = vi.fn<(open: (item: ComponentInspection) => Promise<void>) => void>();
    const navigateToUrl = vi.fn<(url: string) => void>();
    const closeComponentMenu = vi.fn<() => void>();

    render(
      <NavigationHarness
        onReady={onReady}
        copyComponentSourcePath
        componentEditor="cursor"
        navigateToUrl={navigateToUrl}
        closeComponentMenu={closeComponentMenu}
      />,
    );

    await waitFor(() => {
      expect(onReady).toHaveBeenCalledTimes(1);
    });

    const openComponentSource = onReady.mock.calls[0][0];
    await openComponentSource(testInspection);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("src/Button.tsx:12:3");
    expect(componentInspectorMocks.createComponentSourceUrl).toHaveBeenCalledTimes(1);
    expect(navigateToUrl).toHaveBeenCalledWith(
      "cursor://open?url=file:/src/Button.tsx&line=12&column=3",
    );
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    expect(closeComponentMenu).toHaveBeenCalledTimes(1);
  });

  it("uses fetch for neovim http bridge URLs", async () => {
    componentInspectorMocks.createComponentSourceUrl.mockReturnValue(
      "http://127.0.0.1:8777/open?path=src%2FButton.tsx&line=12&column=3",
    );

    const onReady = vi.fn<(open: (item: ComponentInspection) => Promise<void>) => void>();
    const navigateToUrl = vi.fn<(url: string) => void>();
    const closeComponentMenu = vi.fn<() => void>();

    render(
      <NavigationHarness
        onReady={onReady}
        copyComponentSourcePath
        componentEditor="neovim"
        navigateToUrl={navigateToUrl}
        closeComponentMenu={closeComponentMenu}
      />,
    );

    await waitFor(() => {
      expect(onReady).toHaveBeenCalledTimes(1);
    });

    const openComponentSource = onReady.mock.calls[0][0];
    await openComponentSource(testInspection);

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      "http://127.0.0.1:8777/open?path=src%2FButton.tsx&line=12&column=3",
      {
        method: "GET",
        mode: "cors",
        keepalive: true,
      },
    );
    expect(navigateToUrl).not.toHaveBeenCalled();
    expect(closeComponentMenu).toHaveBeenCalledTimes(1);
  });

  it("continues navigation when clipboard copy fails", async () => {
    componentInspectorMocks.createComponentSourceUrl.mockReturnValue(
      "cursor://open?url=file:/src/Button.tsx&line=12&column=3",
    );
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(
      new Error("clipboard blocked"),
    );

    const onReady = vi.fn<(open: (item: ComponentInspection) => Promise<void>) => void>();
    const navigateToUrl = vi.fn<(url: string) => void>();
    const closeComponentMenu = vi.fn<() => void>();

    render(
      <NavigationHarness
        onReady={onReady}
        copyComponentSourcePath
        componentEditor="cursor"
        navigateToUrl={navigateToUrl}
        closeComponentMenu={closeComponentMenu}
      />,
    );

    await waitFor(() => {
      expect(onReady).toHaveBeenCalledTimes(1);
    });

    const openComponentSource = onReady.mock.calls[0][0];
    await openComponentSource(testInspection);

    expect(navigateToUrl).toHaveBeenCalledWith(
      "cursor://open?url=file:/src/Button.tsx&line=12&column=3",
    );
    expect(closeComponentMenu).toHaveBeenCalledTimes(1);
  });
});
