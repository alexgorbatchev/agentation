/**
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it } from "vitest";
import { getSourceLocation } from "./source-location";

interface MockFiber {
  _debugSource?: { fileName: string; lineNumber: number; columnNumber?: number } | null;
  _debugOwner?: MockFiber | null;
  return?: MockFiber | null;
  type?: string | Function | { displayName?: string; name?: string } | null;
  elementType?: unknown;
  tag?: number;
  memoizedProps?: Record<string, unknown>;
}

const probeFlagKey = "__AGENTATION_ENABLE_UNSAFE_SOURCE_PROBE__";

function attachFiber(element: HTMLElement, fiber: MockFiber, prefix = "__reactFiber$abc"): void {
  const elementWithFiber = element as HTMLElement & Record<string, unknown>;
  elementWithFiber[prefix] = fiber;
}

afterEach(() => {
  const globalRecord = globalThis as Record<string, unknown>;
  delete globalRecord[probeFlagKey];
});

describe("source-location fallback probing safety", () => {
  it("does not invoke user component functions by default", () => {
    let invocationCount = 0;

    function UserComponent() {
      invocationCount += 1;
      return null;
    }

    const fiber: MockFiber = {
      _debugSource: null,
      _debugOwner: null,
      return: null,
      type: UserComponent,
      tag: 0,
    };

    const div = document.createElement("div");
    attachFiber(div, fiber);

    const result = getSourceLocation(div);

    expect(invocationCount).toBe(0);
    expect(result.found).toBe(false);
    expect(result.reason).toBe("no-debug-source");
  });

  it("only invokes probing when explicitly opted in", () => {
    let invocationCount = 0;

    function UserComponent() {
      invocationCount += 1;
      return null;
    }

    const fiber: MockFiber = {
      _debugSource: null,
      _debugOwner: null,
      return: null,
      type: UserComponent,
      tag: 0,
    };

    const globalRecord = globalThis as Record<string, unknown>;
    globalRecord[probeFlagKey] = true;

    const div = document.createElement("div");
    attachFiber(div, fiber);

    getSourceLocation(div);

    expect(invocationCount).toBe(1);
  });
});
