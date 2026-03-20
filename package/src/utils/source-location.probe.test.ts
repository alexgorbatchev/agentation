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
const probeAllowlistKey = "__AGENTATION_UNSAFE_SOURCE_PROBE_ALLOWLIST__";

function attachFiber(element: HTMLElement, fiber: MockFiber, prefix = "__reactFiber$abc"): void {
  const elementWithFiber = element as HTMLElement & Record<string, unknown>;
  elementWithFiber[prefix] = fiber;
}

function createProbeableFiber(invocationCounter: { count: number }): MockFiber {
  function UserComponent() {
    invocationCounter.count += 1;
    return null;
  }

  return {
    _debugSource: null,
    _debugOwner: null,
    return: null,
    type: UserComponent,
    tag: 0,
  };
}

afterEach(() => {
  const globalRecord = globalThis as Record<string, unknown>;
  delete globalRecord[probeFlagKey];
  delete globalRecord[probeAllowlistKey];
});

describe("source-location fallback probing safety", () => {
  it("does not invoke user component functions by default", () => {
    const invocationCounter = { count: 0 };
    const fiber = createProbeableFiber(invocationCounter);

    const div = document.createElement("div");
    attachFiber(div, fiber);

    const result = getSourceLocation(div);

    expect(invocationCounter.count).toBe(0);
    expect(result.found).toBe(false);
    expect(result.reason).toBe("no-debug-source");
  });

  it("does not probe when allowlist is missing", () => {
    const invocationCounter = { count: 0 };
    const fiber = createProbeableFiber(invocationCounter);

    const globalRecord = globalThis as Record<string, unknown>;
    globalRecord[probeFlagKey] = true;

    const div = document.createElement("div");
    attachFiber(div, fiber);

    const result = getSourceLocation(div);

    expect(invocationCounter.count).toBe(0);
    expect(result.found).toBe(false);
    expect(result.reason).toBe("no-debug-source");
  });

  it("does not probe when allowlist validation fails", () => {
    const invocationCounter = { count: 0 };
    const fiber = createProbeableFiber(invocationCounter);

    const globalRecord = globalThis as Record<string, unknown>;
    globalRecord[probeFlagKey] = true;
    globalRecord[probeAllowlistKey] = ["localhost", 42];

    const div = document.createElement("div");
    attachFiber(div, fiber);

    const result = getSourceLocation(div);

    expect(invocationCounter.count).toBe(0);
    expect(result.found).toBe(false);
    expect(result.reason).toBe("no-debug-source");
  });

  it("probes only when explicitly opted in and allowlisted", () => {
    const invocationCounter = { count: 0 };
    const fiber = createProbeableFiber(invocationCounter);

    const globalRecord = globalThis as Record<string, unknown>;
    globalRecord[probeFlagKey] = true;
    globalRecord[probeAllowlistKey] = ["localhost", "http://localhost"];

    const div = document.createElement("div");
    attachFiber(div, fiber);

    getSourceLocation(div);

    expect(invocationCounter.count).toBe(1);
  });
});
