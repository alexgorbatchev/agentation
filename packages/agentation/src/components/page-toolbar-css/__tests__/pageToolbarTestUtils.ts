import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { expect, vi } from "vitest";

import type { Annotation } from "../../../types";
import { unfreeze as unfreezeAll } from "../../../utils/freeze-animations";

export const PAGE_TOOLBAR_ANNOTATION_STORAGE_KEY = "feedback-annotations-/";
const DEFAULT_AGENTATION_ENDPOINT = "http://127.0.0.1:4747";
const SETTINGS_STORAGE_KEY = "feedback-toolbar-settings";

type MockTargetOptions = {
  tag?: string;
  text?: string;
  rect?: Partial<DOMRect>;
};

type EventSourceConstructor = new (url: string) => unknown;

type InstallPageToolbarTestGlobalsOptions = {
  writeText: (text: string) => Promise<void>;
  includeElementsFromPoint?: boolean;
  eventSourceClass?: EventSourceConstructor;
  fetchMode?: "local-only" | "none";
};

export class MockEventSource {
  addEventListener: (type?: string, listener?: EventListenerOrEventListenerObject | null) => void = vi.fn();
  removeEventListener: (type?: string, listener?: EventListenerOrEventListenerObject | null) => void = vi.fn();
  close: () => void = vi.fn();

  constructor(_url: string) {}
}

function resolveFetchUrl(input: string | URL | Request): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function resolveMockTargetOptions(
  tagOrOptions: string | MockTargetOptions,
  text?: string,
  rect?: Partial<DOMRect>,
): MockTargetOptions {
  if (typeof tagOrOptions === "string") {
    return {
      tag: tagOrOptions,
      text,
      rect,
    };
  }

  return tagOrOptions;
}

export function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
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

export function seedAnnotations(
  annotations: Annotation[],
  storageKey: string = PAGE_TOOLBAR_ANNOTATION_STORAGE_KEY,
): void {
  localStorage.setItem(storageKey, JSON.stringify(annotations));
}

export function seedSettings(overrides: Record<string, unknown> = {}): void {
  const defaultSettings = {
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
    SETTINGS_STORAGE_KEY,
    JSON.stringify({ ...defaultSettings, ...overrides }),
  );
}

export function stubLocalOnlyFetch(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request) => {
      const url = resolveFetchUrl(input);

      if (url.startsWith(DEFAULT_AGENTATION_ENDPOINT)) {
        return new Response("not found", { status: 404 });
      }

      return new Response("ok", { status: 200 });
    }),
  );
}

export function installPageToolbarTestGlobals({
  writeText,
  includeElementsFromPoint = false,
  eventSourceClass = MockEventSource,
  fetchMode = "local-only",
}: InstallPageToolbarTestGlobalsOptions): void {
  localStorage.clear();
  sessionStorage.clear();
  if (fetchMode === "local-only") {
    stubLocalOnlyFetch();
  }

  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    writable: true,
    configurable: true,
  });

  document.elementFromPoint = vi.fn().mockReturnValue(null);

  if (includeElementsFromPoint) {
    if (!document.elementsFromPoint) {
      (document as unknown as Record<string, unknown>).elementsFromPoint = vi
        .fn()
        .mockReturnValue([]);
    } else {
      vi.spyOn(document, "elementsFromPoint").mockReturnValue([]);
    }
  }

  vi.stubGlobal("EventSource", eventSourceClass);
}

export async function activateToolbar(): Promise<void> {
  fireEvent.click(screen.getByTitle("Start feedback mode"));
  await waitFor(() => {
    expect(screen.queryByTitle("Start feedback mode")).toBeNull();
  });
}

export function findButtonByTooltip(tooltipText: string): HTMLButtonElement | null {
  const toolbarElements = document.querySelectorAll("[data-feedback-toolbar]");
  for (const toolbarElement of toolbarElements) {
    const spans = toolbarElement.querySelectorAll("span");
    for (const span of spans) {
      if (span.textContent?.trim().startsWith(tooltipText)) {
        const button = span.closest("button") ?? span.parentElement?.querySelector("button");
        if (button instanceof HTMLButtonElement) {
          return button;
        }
      }
    }
  }

  return null;
}

export function createMockTarget(
  tagOrOptions: string | MockTargetOptions = {},
  text?: string,
  rect?: Partial<DOMRect>,
): HTMLElement {
  const {
    tag = "button",
    text: resolvedText = "Click me",
    rect: resolvedRect,
  } = resolveMockTargetOptions(tagOrOptions, text, rect);

  const element = document.createElement(tag);
  element.textContent = resolvedText;
  element.setAttribute("data-mock-target", "true");
  document.body.appendChild(element);

  if (resolvedRect) {
    mockElementRect(element, resolvedRect);
  }

  return element;
}

export function mockElementRect(
  element: HTMLElement,
  rect: Partial<DOMRect> = {},
): void {
  const left = rect.left ?? rect.x ?? 0;
  const top = rect.top ?? rect.y ?? 0;
  const width = rect.width ?? 100;
  const height = rect.height ?? 30;

  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    x: rect.x ?? left,
    y: rect.y ?? top,
    width,
    height,
    left,
    top,
    right: rect.right ?? left + width,
    bottom: rect.bottom ?? top + height,
    toJSON: () => ({}),
  } as DOMRect);
}

export function clickAtPoint(
  x: number,
  y: number,
  options: Partial<MouseEventInit> = {},
): void {
  const event = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    ...options,
  });

  document.body.dispatchEvent(event);
}

export async function waitForMarkers(count = 1): Promise<void> {
  await waitFor(
    () => {
      const markers = document.querySelectorAll("[data-annotation-marker]");
      expect(markers.length).toBeGreaterThanOrEqual(count);
    },
    { timeout: 3000 },
  );
}

export function resetPageToolbarTestEnvironment(): void {
  try {
    unfreezeAll();
  } catch {
    // Ignore cases where animations were never frozen.
  }

  cleanup();
  document.querySelectorAll("[data-feedback-toolbar]").forEach((element) => {
    element.remove();
  });
  document.querySelectorAll("[data-annotation-marker]").forEach((element) => {
    element.remove();
  });
  document.querySelectorAll("[data-annotation-popup]").forEach((element) => {
    element.remove();
  });
  document.querySelectorAll("[data-mock-target]").forEach((element) => {
    element.remove();
  });
  document.getElementById("feedback-cursor-styles")?.remove();
  document.getElementById("feedback-freeze-styles")?.remove();
  document.querySelectorAll("style").forEach((element) => {
    if (element.id.includes("agentation") || element.id.includes("freeze")) {
      element.remove();
    }
  });
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
}
