/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";

import {
  createComponentSourceUrl,
  formatComponentSourcePath,
  inspectComponentElement,
  type ComponentInspection,
} from "../component-inspector";

function attachFiber(element: HTMLElement, fiber: unknown): void {
  Object.defineProperty(element, "__reactFiber$test", {
    value: fiber,
    configurable: true,
    enumerable: true,
  });
}

describe("inspectComponentElement", () => {
  it("collects source info and scalar props from the owner chain", () => {
    const owner = {
      type: { name: "Card" },
      _debugSource: {
        fileName: "/src/Card.tsx",
        lineNumber: 12,
        columnNumber: 4,
      },
      memoizedProps: { tone: "info", count: 3, onClick: () => {} },
      _debugOwner: null,
    };

    const fiber = {
      type: { displayName: "Button" },
      _debugSource: {
        fileName: "/src/Button.tsx",
        lineNumber: 42,
        columnNumber: 8,
      },
      memoizedProps: { variant: "primary", disabled: false, child: { nested: true } },
      _debugOwner: owner,
    };

    const element = document.createElement("button");
    attachFiber(element, fiber);

    const result = inspectComponentElement(element);
    expect(result).toEqual<ComponentInspection[]>([
      {
        displayName: "Button",
        props: { variant: "primary", disabled: "false" },
        source: {
          fileName: "/src/Button.tsx",
          lineNumber: 42,
          columnNumber: 8,
          componentName: "Button",
        },
      },
      {
        displayName: "Card",
        props: { tone: "info", count: "3" },
        source: {
          fileName: "/src/Card.tsx",
          lineNumber: 12,
          columnNumber: 4,
          componentName: "Card",
        },
      },
    ]);
  });

  it("returns an empty array when no React fiber is present", () => {
    expect(inspectComponentElement(document.createElement("div"))).toEqual([]);
  });
});

describe("createComponentSourceUrl", () => {
  it("builds a Cursor URL", () => {
    expect(
      createComponentSourceUrl(
        { fileName: "/src/Button.tsx", lineNumber: 10, columnNumber: 2 },
        "cursor",
      ),
    ).toBe("cursor://open?url=file:/src/Button.tsx&line=10&column=2");
  });

  it("builds a Neovim bridge URL", () => {
    expect(
      createComponentSourceUrl(
        { fileName: "/src/Button.tsx", lineNumber: 10, columnNumber: 2 },
        "neovim",
      ),
    ).toBe("http://127.0.0.1:8777/open?path=src%2FButton.tsx&line=10&column=2");
  });

  it("builds a Neovim bridge URL with custom base URL and projectId", () => {
    expect(
      createComponentSourceUrl(
        { fileName: "/src/Button.tsx", lineNumber: 10, columnNumber: 2 },
        "neovim",
        undefined,
        "http://127.0.0.1:8787/",
        "project-123",
      ),
    ).toBe(
      "http://127.0.0.1:8787/open?path=src%2FButton.tsx&line=10&column=2&projectId=project-123",
    );
  });

  it("uses a custom editor URL factory when provided", () => {
    expect(
      createComponentSourceUrl(
        { fileName: "/src/Button.tsx", lineNumber: 10, columnNumber: 2 },
        "vscode",
        ({ path, line, column }) => `custom://${path}:${line}:${column}`,
      ),
    ).toBe("custom://src/Button.tsx:10:2");
  });

  it("formats clipboard/source paths without leading dots or slashes", () => {
    expect(
      formatComponentSourcePath({
        fileName: "/Users/alex/development/github/agentation/agentation/packages/agentation/src/Button.tsx",
        lineNumber: 10,
        columnNumber: 2,
      }),
    ).toBe("src/Button.tsx:10:2");

    expect(
      formatComponentSourcePath({
        fileName: "./app/page.tsx",
        lineNumber: 3,
        columnNumber: 1,
      }),
    ).toBe("app/page.tsx:3:1");
  });
});
