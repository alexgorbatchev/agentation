/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  getReactComponentName,
  isReactPage,
  clearReactDetectionCache,
  DEFAULT_SKIP_EXACT,
  DEFAULT_SKIP_PATTERNS,
} from "../react-detection";

// Define the mock fiber type
type MockFiber = {
  tag: number;
  type: { name: string; displayName: string };
  elementType: { name: string; displayName: string };
  return: MockFiber | null;
};

// Helper to create a mock fiber
function createMockFiber(
  name: string,
  parent?: MockFiber,
  options: { tag?: number } = {},
): MockFiber {
  return {
    tag: options.tag ?? 0, // FunctionComponent
    type: { name, displayName: name },
    elementType: { name, displayName: name },
    return: parent || null,
  };
}

// Helper to attach fiber to an element
function attachFiber(element: HTMLElement, fiber: unknown) {
  (element as unknown as Record<string, unknown>)["__reactFiber$test"] = fiber;
}

// Helper to create element with fiber attached
function createElementWithFiber(
  fiber: MockFiber,
  options: { className?: string } = {},
) {
  const element = document.createElement("div");
  if (options.className) {
    element.className = options.className;
  }
  attachFiber(element, fiber);
  document.body.appendChild(element);
  return element;
}

describe("react-detection", () => {
  beforeEach(() => {
    clearReactDetectionCache();
    document.body.innerHTML = "";
  });

  describe("isReactPage", () => {
    it("returns false for non-React pages", () => {
      expect(isReactPage()).toBe(false);
    });

    it("returns true when React fiber is on body", () => {
      attachFiber(document.body, createMockFiber("App"));
      expect(isReactPage()).toBe(true);
    });

    it("returns true when React fiber is on #root", () => {
      const root = document.createElement("div");
      root.id = "root";
      attachFiber(root, createMockFiber("App"));
      document.body.appendChild(root);
      expect(isReactPage()).toBe(true);
    });

    it("returns true when React fiber is on #__next", () => {
      const next = document.createElement("div");
      next.id = "__next";
      attachFiber(next, createMockFiber("App"));
      document.body.appendChild(next);
      expect(isReactPage()).toBe(true);
    });

    it("returns true when React fiber is on immediate child of body", () => {
      const child = document.createElement("div");
      attachFiber(child, createMockFiber("App"));
      document.body.appendChild(child);
      expect(isReactPage()).toBe(true);
    });

    it("caches the result", () => {
      attachFiber(document.body, createMockFiber("App"));
      expect(isReactPage()).toBe(true);
      // Remove the fiber
      delete (document.body as unknown as Record<string, unknown>)["__reactFiber$test"];
      // Should still return true due to cache
      expect(isReactPage()).toBe(true);
    });
  });

  describe("clearReactDetectionCache", () => {
    it("resets the detection cache", () => {
      attachFiber(document.body, createMockFiber("App"));
      expect(isReactPage()).toBe(true);
      delete (document.body as unknown as Record<string, unknown>)["__reactFiber$test"];
      clearReactDetectionCache();
      expect(isReactPage()).toBe(false);
    });
  });

  describe("getReactComponentName", () => {
    it("returns empty result for non-React elements", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);
      const result = getReactComponentName(element);
      expect(result.path).toBeNull();
      expect(result.components).toEqual([]);
    });

    it("extracts single component name", () => {
      const fiber = createMockFiber("Button");
      const element = createElementWithFiber(fiber);
      const result = getReactComponentName(element);
      expect(result.components).toContain("Button");
      expect(result.path).toContain("<Button>");
    });

    it("extracts component hierarchy", () => {
      const app = createMockFiber("App");
      const layout = createMockFiber("Layout", app);
      const button = createMockFiber("Button", layout);
      const element = createElementWithFiber(button);

      const result = getReactComponentName(element, { mode: "all" });
      expect(result.components).toContain("Button");
      expect(result.components).toContain("Layout");
      expect(result.components).toContain("App");
      // Path should be outermost to innermost
      expect(result.path).toBe("<App> <Layout> <Button>");
    });

    it("uses displayName when available", () => {
      const fiber = {
        tag: 0,
        type: { displayName: "MyDisplayName", name: "InternalName" },
        elementType: { displayName: "MyDisplayName", name: "InternalName" },
        return: null,
      };
      const element = createElementWithFiber(fiber as ReturnType<typeof createMockFiber>);
      const result = getReactComponentName(element);
      expect(result.components).toContain("MyDisplayName");
    });

    it("respects maxComponents config", () => {
      const c1 = createMockFiber("Component1");
      const c2 = createMockFiber("Component2", c1);
      const c3 = createMockFiber("Component3", c2);
      const c4 = createMockFiber("Component4", c3);
      const element = createElementWithFiber(c4);

      const result = getReactComponentName(element, {
        mode: "all",
        maxComponents: 2,
      });
      expect(result.components.length).toBeLessThanOrEqual(2);
    });

    it("caches results per element in 'all' mode", () => {
      const fiber = createMockFiber("CachedComponent");
      const element = createElementWithFiber(fiber);

      // Cache only works in "all" mode
      const result1 = getReactComponentName(element, { mode: "all" });
      // Modify the fiber (shouldn't affect cached result)
      fiber.type.name = "ModifiedName";
      const result2 = getReactComponentName(element, { mode: "all" });

      expect(result1).toBe(result2); // Same reference = cached
    });
  });

  describe("filter modes", () => {
    it("mode: filtered skips DEFAULT_SKIP_EXACT names", () => {
      const fragment = createMockFiber("Fragment");
      const app = createMockFiber("App", fragment);
      const element = createElementWithFiber(app);

      const result = getReactComponentName(element, { mode: "filtered" });
      expect(result.components).not.toContain("Fragment");
      expect(result.components).toContain("App");
    });

    it("mode: filtered skips Provider patterns", () => {
      const provider = createMockFiber("ThemeProvider");
      const app = createMockFiber("App", provider);
      const element = createElementWithFiber(app);

      const result = getReactComponentName(element, { mode: "filtered" });
      expect(result.components).not.toContain("ThemeProvider");
    });

    // Deep select feature: video framework internals filtered out
    it("mode: filtered skips video framework exact names (SeriesSequence, AbsoluteFill)", () => {
      const series = createMockFiber("SeriesSequence");
      const fill = createMockFiber("AbsoluteFill", series);
      const app = createMockFiber("App", fill);
      const element = createElementWithFiber(app);

      const result = getReactComponentName(element, { mode: "filtered" });
      expect(result.components).not.toContain("SeriesSequence");
      expect(result.components).not.toContain("AbsoluteFill");
      expect(result.components).toContain("App");
    });

    it("mode: filtered skips Remotion-prefixed patterns", () => {
      const remotion = createMockFiber("RemotionPlayer");
      const app = createMockFiber("App", remotion);
      const element = createElementWithFiber(app);

      const result = getReactComponentName(element, { mode: "filtered" });
      expect(result.components).not.toContain("RemotionPlayer");
      expect(result.components).toContain("App");
    });

    it("mode: filtered skips TransitionSeries patterns", () => {
      const transition = createMockFiber("TransitionSeriesSequence");
      const app = createMockFiber("App", transition);
      const element = createElementWithFiber(app);

      const result = getReactComponentName(element, { mode: "filtered" });
      expect(result.components).not.toContain("TransitionSeriesSequence");
      expect(result.components).toContain("App");
    });

    it("mode: filtered skips RefForwarding patterns", () => {
      const ref = createMockFiber("RefForwardingComponent");
      const app = createMockFiber("App", ref);
      const element = createElementWithFiber(app);

      const result = getReactComponentName(element, { mode: "filtered" });
      expect(result.components).not.toContain("RefForwardingComponent");
      expect(result.components).toContain("App");
    });

    it("mode: all includes more components", () => {
      const app = createMockFiber("App");
      const layout = createMockFiber("Layout", app);
      const element = createElementWithFiber(layout);

      const allResult = getReactComponentName(element, { mode: "all" });
      clearReactDetectionCache();
      const filteredResult = getReactComponentName(element, { mode: "filtered" });

      // All mode should generally include at least as many components
      expect(allResult.components.length).toBeGreaterThanOrEqual(
        filteredResult.components.length,
      );
    });
  });

  describe("DEFAULT_SKIP_EXACT", () => {
    it("includes React internals", () => {
      expect(DEFAULT_SKIP_EXACT.has("Fragment")).toBe(true);
      expect(DEFAULT_SKIP_EXACT.has("Suspense")).toBe(true);
      expect(DEFAULT_SKIP_EXACT.has("StrictMode")).toBe(true);
    });

    it("includes routing internals", () => {
      expect(DEFAULT_SKIP_EXACT.has("Routes")).toBe(true);
      expect(DEFAULT_SKIP_EXACT.has("Route")).toBe(true);
      expect(DEFAULT_SKIP_EXACT.has("Outlet")).toBe(true);
    });

    // Deep select feature: video framework internals
    it("includes video framework internals", () => {
      expect(DEFAULT_SKIP_EXACT.has("SeriesSequence")).toBe(true);
      expect(DEFAULT_SKIP_EXACT.has("AbsoluteFill")).toBe(true);
    });
  });

  describe("DEFAULT_SKIP_PATTERNS", () => {
    it("matches Boundary patterns", () => {
      const matches = DEFAULT_SKIP_PATTERNS.some((p) => p.test("ErrorBoundary"));
      expect(matches).toBe(true);
    });

    it("matches Provider patterns", () => {
      const matches = DEFAULT_SKIP_PATTERNS.some((p) => p.test("ThemeProvider"));
      expect(matches).toBe(true);
    });

    it("matches Router patterns", () => {
      const matches = DEFAULT_SKIP_PATTERNS.some((p) => p.test("BrowserRouter"));
      expect(matches).toBe(true);
    });

    it("does not match user components", () => {
      const matches = DEFAULT_SKIP_PATTERNS.some((p) => p.test("UserProfile"));
      expect(matches).toBe(false);
    });

    it("does not match ServerStatus (avoid false positives)", () => {
      const matches = DEFAULT_SKIP_PATTERNS.some((p) => p.test("ServerStatus"));
      expect(matches).toBe(false);
    });

    it("does not match ClientProfile (avoid false positives)", () => {
      const matches = DEFAULT_SKIP_PATTERNS.some((p) => p.test("ClientProfile"));
      expect(matches).toBe(false);
    });

    // Deep select feature: video framework and React internal patterns
    it("matches RefForwarding patterns (React.forwardRef wrappers)", () => {
      const matches = DEFAULT_SKIP_PATTERNS.some((p) => p.test("RefForwardingComponent"));
      expect(matches).toBe(true);
    });

    it("matches Remotion-prefixed internals", () => {
      expect(DEFAULT_SKIP_PATTERNS.some((p) => p.test("RemotionPlayer"))).toBe(true);
      expect(DEFAULT_SKIP_PATTERNS.some((p) => p.test("RemotionRoot"))).toBe(true);
    });

    it("matches TransitionSeries wrappers", () => {
      expect(DEFAULT_SKIP_PATTERNS.some((p) => p.test("TransitionSeriesSequence"))).toBe(true);
      expect(DEFAULT_SKIP_PATTERNS.some((p) => p.test("TransitionSeries"))).toBe(true);
    });

    it("does not match user components with similar names", () => {
      // Should not false-positive on user components
      expect(DEFAULT_SKIP_PATTERNS.some((p) => p.test("VideoPlayer"))).toBe(false);
      expect(DEFAULT_SKIP_PATTERNS.some((p) => p.test("Timeline"))).toBe(false);
    });
  });

  describe("smart mode", () => {
    it("includes components that match CSS classes", () => {
      const fiber = createMockFiber("SideNav");
      const element = createElementWithFiber(fiber, { className: "side-nav" });

      const result = getReactComponentName(element, { mode: "smart" });
      expect(result.components).toContain("SideNav");
    });

    it("includes components matching user patterns (e.g., Page suffix)", () => {
      const fiber = createMockFiber("HomePage");
      const element = createElementWithFiber(fiber);

      const result = getReactComponentName(element, { mode: "smart" });
      expect(result.components).toContain("HomePage");
    });

    it("excludes components that do not correlate with DOM", () => {
      const inner = createMockFiber("InternalWrapper");
      const button = createMockFiber("SubmitButton", inner);
      const element = createElementWithFiber(button, { className: "btn" });

      const result = getReactComponentName(element, { mode: "smart" });
      // SubmitButton matches user pattern (Button$), InternalWrapper does not
      expect(result.components).toContain("SubmitButton");
      expect(result.components).not.toContain("InternalWrapper");
    });

    it("matches partial class names", () => {
      const fiber = createMockFiber("NavigationMenu");
      const element = createElementWithFiber(fiber, { className: "main-navigation" });

      const result = getReactComponentName(element, { mode: "smart" });
      expect(result.components).toContain("NavigationMenu");
    });
  });

  describe("minified name filtering", () => {
    it("filters single letter names", () => {
      const minified = createMockFiber("e");
      const app = createMockFiber("App", minified);
      const element = createElementWithFiber(app);

      const result = getReactComponentName(element, { mode: "all" });
      expect(result.components).not.toContain("e");
      expect(result.components).toContain("App");
    });

    it("filters two letter names", () => {
      const minified = createMockFiber("Zt");
      const app = createMockFiber("App", minified);
      const element = createElementWithFiber(app);

      const result = getReactComponentName(element, { mode: "all" });
      expect(result.components).not.toContain("Zt");
    });
  });

  describe("cache behavior with different modes", () => {
    it("caches separately per mode", () => {
      // Use a component that passes all filters but only correlates with DOM in smart mode
      const helper = createMockFiber("HelperUtil");
      const card = createMockFiber("ProductCard", helper);
      const element = createElementWithFiber(card, { className: "product-card" });

      // First call with filtered mode
      const filteredResult = getReactComponentName(element, { mode: "filtered" });
      // Then call with smart mode on same element
      const domResult = getReactComponentName(element, { mode: "smart" });

      // Both should include ProductCard
      expect(filteredResult.components).toContain("ProductCard");
      expect(domResult.components).toContain("ProductCard");

      // Filtered includes HelperUtil, smart does not (doesn't match DOM or patterns)
      expect(filteredResult.components).toContain("HelperUtil");
      expect(domResult.components).not.toContain("HelperUtil");
    });
  });

  describe("error handling", () => {
    it("returns empty result for corrupted fiber", () => {
      const element = document.createElement("div");
      // Attach a corrupted fiber that will throw when accessed
      Object.defineProperty(element, "__reactFiber$test", {
        get() {
          throw new Error("Corrupted fiber");
        },
      });
      document.body.appendChild(element);
      attachFiber(document.body, createMockFiber("App")); // Make it a React page

      const result = getReactComponentName(element);
      expect(result.path).toBeNull();
      expect(result.components).toEqual([]);
    });
  });

  describe("resolveConfig with custom skipExact", () => {
    it("merges custom skipExact Set with defaults", () => {
      const fiber = createMockFiber("CustomSkipped");
      const app = createMockFiber("App", fiber);
      const element = createElementWithFiber(app);
      attachFiber(document.body, createMockFiber("App"));

      const result = getReactComponentName(element, {
        mode: "filtered",
        skipExact: new Set(["CustomSkipped"]),
      });
      expect(result.components).not.toContain("CustomSkipped");
      expect(result.components).toContain("App");
    });

    it("merges custom skipExact array with defaults", () => {
      const fiber = createMockFiber("AnotherSkipped");
      const app = createMockFiber("App", fiber);
      const element = createElementWithFiber(app);
      attachFiber(document.body, createMockFiber("App"));

      const result = getReactComponentName(element, {
        mode: "filtered",
        skipExact: ["AnotherSkipped"],
      });
      expect(result.components).not.toContain("AnotherSkipped");
      expect(result.components).toContain("App");
    });

    it("still skips default exact names when custom ones are added", () => {
      const fragment = createMockFiber("Fragment");
      const custom = createMockFiber("MyCustomSkip");
      const app = createMockFiber("App", custom);
      custom.return = fragment;
      fragment.return = null;
      app.return = custom;
      const element = createElementWithFiber(app);
      attachFiber(document.body, createMockFiber("App"));

      const result = getReactComponentName(element, {
        mode: "filtered",
        skipExact: new Set(["MyCustomSkip"]),
      });
      expect(result.components).not.toContain("Fragment");
      expect(result.components).not.toContain("MyCustomSkip");
      expect(result.components).toContain("App");
    });
  });

  describe("resolveConfig with custom skipPatterns", () => {
    it("merges custom skipPatterns with defaults", () => {
      const fiber = createMockFiber("MySpecialThing");
      const app = createMockFiber("App", fiber);
      const element = createElementWithFiber(app);
      attachFiber(document.body, createMockFiber("App"));

      const result = getReactComponentName(element, {
        mode: "filtered",
        skipPatterns: [/Special/],
      });
      expect(result.components).not.toContain("MySpecialThing");
      expect(result.components).toContain("App");
    });

    it("still applies default patterns when custom ones are added", () => {
      const provider = createMockFiber("ThemeProvider");
      const special = createMockFiber("CustomSpecial");
      const app = createMockFiber("App", special);
      special.return = provider;
      provider.return = null;
      app.return = special;
      const element = createElementWithFiber(app);
      attachFiber(document.body, createMockFiber("App"));

      const result = getReactComponentName(element, {
        mode: "filtered",
        skipPatterns: [/Special$/],
      });
      expect(result.components).not.toContain("ThemeProvider");
      expect(result.components).not.toContain("CustomSpecial");
      expect(result.components).toContain("App");
    });
  });

  describe("shouldIncludeComponent with custom filter function", () => {
    it("uses custom filter function instead of mode-based filtering", () => {
      const fiber = createMockFiber("Fragment");
      const app = createMockFiber("App", fiber);
      const element = createElementWithFiber(app);
      attachFiber(document.body, createMockFiber("App"));

      // Custom filter that includes everything
      const result = getReactComponentName(element, {
        mode: "filtered",
        filter: () => true,
      });
      // Fragment would normally be skipped in filtered mode, but custom filter includes it
      expect(result.components).toContain("Fragment");
      expect(result.components).toContain("App");
    });

    it("custom filter can exclude based on depth", () => {
      const grandparent = createMockFiber("GrandParent");
      const parent = createMockFiber("Parent", grandparent);
      const child = createMockFiber("Child", parent);
      const element = createElementWithFiber(child);
      attachFiber(document.body, createMockFiber("App"));

      // Only include components at depth 0
      const result = getReactComponentName(element, {
        mode: "filtered",
        filter: (_name, depth) => depth === 0,
      });
      expect(result.components).toEqual(["Child"]);
    });

    it("custom filter can exclude by name", () => {
      const secret = createMockFiber("SecretInternal");
      const app = createMockFiber("App", secret);
      const element = createElementWithFiber(app);
      attachFiber(document.body, createMockFiber("App"));

      const result = getReactComponentName(element, {
        mode: "all",
        filter: (name) => !name.startsWith("Secret"),
      });
      expect(result.components).not.toContain("SecretInternal");
      expect(result.components).toContain("App");
    });
  });

  describe("isReactPage via __reactProps$ prefix", () => {
    it("detects React via __reactProps$ key on body", () => {
      (document.body as unknown as Record<string, unknown>)[
        "__reactProps$abc123"
      ] = { children: null };
      expect(isReactPage()).toBe(true);
    });

    it("detects React via __reactProps$ key on #root", () => {
      const root = document.createElement("div");
      root.id = "root";
      (root as unknown as Record<string, unknown>)["__reactProps$xyz"] = {};
      document.body.appendChild(root);
      expect(isReactPage()).toBe(true);
    });
  });

  describe("isReactPage via #app selector", () => {
    it("detects React via fiber on #app", () => {
      const app = document.createElement("div");
      app.id = "app";
      attachFiber(app, createMockFiber("App"));
      document.body.appendChild(app);
      expect(isReactPage()).toBe(true);
    });

    it("detects React via [data-reactroot] selector", () => {
      const el = document.createElement("div");
      el.setAttribute("data-reactroot", "");
      attachFiber(el, createMockFiber("App"));
      document.body.appendChild(el);
      expect(isReactPage()).toBe(true);
    });
  });

  describe("getComponentNameFromFiber for special tags", () => {
    // Helper to attach a special fiber to an element and retrieve the component name
    function getNameForFiber(fiber: Record<string, unknown>): string[] {
      const element = document.createElement("div");
      (element as unknown as Record<string, unknown>)["__reactFiber$test"] =
        fiber;
      document.body.appendChild(element);
      attachFiber(document.body, createMockFiber("App"));
      clearReactDetectionCache();
      const result = getReactComponentName(element, { mode: "all" });
      return result.components;
    }

    it("returns null for HostComponent (tag 5)", () => {
      const components = getNameForFiber({
        tag: 5,
        type: "div",
        elementType: "div",
        return: null,
      });
      expect(components).toEqual([]);
    });

    it("returns null for HostText (tag 6)", () => {
      const components = getNameForFiber({
        tag: 6,
        type: null,
        elementType: null,
        return: null,
      });
      expect(components).toEqual([]);
    });

    it("returns null for Fragment (tag 7)", () => {
      const components = getNameForFiber({
        tag: 7,
        type: null,
        elementType: null,
        return: null,
      });
      expect(components).toEqual([]);
    });

    it("returns null for Mode (tag 8)", () => {
      const components = getNameForFiber({
        tag: 8,
        type: null,
        elementType: null,
        return: null,
      });
      expect(components).toEqual([]);
    });

    it("returns null for HostRoot (tag 3)", () => {
      const components = getNameForFiber({
        tag: 3,
        type: null,
        elementType: null,
        return: null,
      });
      expect(components).toEqual([]);
    });

    it("returns null for HostPortal (tag 4)", () => {
      const components = getNameForFiber({
        tag: 4,
        type: null,
        elementType: null,
        return: null,
      });
      expect(components).toEqual([]);
    });

    it("returns null for ScopeComponent (tag 21)", () => {
      const components = getNameForFiber({
        tag: 21,
        type: null,
        elementType: null,
        return: null,
      });
      expect(components).toEqual([]);
    });

    it("returns null for OffscreenComponent (tag 22)", () => {
      const components = getNameForFiber({
        tag: 22,
        type: null,
        elementType: null,
        return: null,
      });
      expect(components).toEqual([]);
    });

    it("returns null for SuspenseComponent (tag 13)", () => {
      const components = getNameForFiber({
        tag: 13,
        type: null,
        elementType: null,
        return: null,
      });
      expect(components).toEqual([]);
    });

    it("returns null for SuspenseListComponent (tag 19)", () => {
      const components = getNameForFiber({
        tag: 19,
        type: null,
        elementType: null,
        return: null,
      });
      expect(components).toEqual([]);
    });

    it("extracts name from ForwardRef (tag 11) via elementType.render", () => {
      const components = getNameForFiber({
        tag: 11,
        type: { name: "FallbackName" },
        elementType: {
          render: { name: "ForwardRefInner", displayName: undefined },
        },
        return: null,
      });
      expect(components).toContain("ForwardRefInner");
    });

    it("extracts displayName from ForwardRef (tag 11) via elementType.render.displayName", () => {
      const components = getNameForFiber({
        tag: 11,
        type: { name: "FallbackName" },
        elementType: {
          render: { name: "InternalName", displayName: "ForwardRefDisplay" },
        },
        return: null,
      });
      expect(components).toContain("ForwardRefDisplay");
    });

    it("falls back to elementType.displayName for ForwardRef (tag 11)", () => {
      const components = getNameForFiber({
        tag: 11,
        type: { name: "TypeFallback" },
        elementType: {
          displayName: "MyForwardRef",
          render: undefined,
        },
        return: null,
      });
      expect(components).toContain("MyForwardRef");
    });

    it("falls back to type.name for ForwardRef (tag 11) when no render or displayName", () => {
      const components = getNameForFiber({
        tag: 11,
        type: { name: "TypeFallbackName" },
        elementType: {},
        return: null,
      });
      expect(components).toContain("TypeFallbackName");
    });

    it("extracts name from MemoComponent (tag 14) via elementType.type", () => {
      const components = getNameForFiber({
        tag: 14,
        type: { name: "FallbackMemo" },
        elementType: {
          type: { name: "MemoInner", displayName: undefined },
        },
        return: null,
      });
      expect(components).toContain("MemoInner");
    });

    it("extracts displayName from MemoComponent (tag 14) via elementType.type.displayName", () => {
      const components = getNameForFiber({
        tag: 14,
        type: { name: "FallbackMemo" },
        elementType: {
          type: { name: "InternalName", displayName: "MemoDisplay" },
        },
        return: null,
      });
      expect(components).toContain("MemoDisplay");
    });

    it("falls back to elementType.displayName for MemoComponent (tag 14)", () => {
      const components = getNameForFiber({
        tag: 14,
        type: { name: "TypeFallback" },
        elementType: {
          displayName: "MyMemo",
          type: undefined,
        },
        return: null,
      });
      expect(components).toContain("MyMemo");
    });

    it("extracts name from SimpleMemoComponent (tag 15) via elementType.type", () => {
      const components = getNameForFiber({
        tag: 15,
        type: { name: "SimpleMemoFallback" },
        elementType: {
          type: { name: "SimpleMemoInner" },
        },
        return: null,
      });
      expect(components).toContain("SimpleMemoInner");
    });

    it("extracts displayName from ContextProvider (tag 10)", () => {
      const components = getNameForFiber({
        tag: 10,
        type: { _context: { displayName: "MyContext" } },
        elementType: null,
        return: null,
      });
      expect(components).toContain("MyContext.Provider");
    });

    it("returns null for ContextProvider (tag 10) without displayName", () => {
      const components = getNameForFiber({
        tag: 10,
        type: { _context: {} },
        elementType: null,
        return: null,
      });
      expect(components).toEqual([]);
    });

    it("extracts displayName from ContextConsumer (tag 9)", () => {
      const components = getNameForFiber({
        tag: 9,
        type: { displayName: "ThemeContext" },
        elementType: null,
        return: null,
      });
      expect(components).toContain("ThemeContext.Consumer");
    });

    it("returns null for ContextConsumer (tag 9) without displayName", () => {
      const components = getNameForFiber({
        tag: 9,
        type: {},
        elementType: null,
        return: null,
      });
      expect(components).toEqual([]);
    });

    it("extracts name from resolved LazyComponent (tag 16)", () => {
      const components = getNameForFiber({
        tag: 16,
        type: null,
        elementType: {
          _status: 1,
          _result: { name: "LazyComp", displayName: undefined },
        },
        return: null,
      });
      expect(components).toContain("LazyComp");
    });

    it("extracts displayName from resolved LazyComponent (tag 16)", () => {
      const components = getNameForFiber({
        tag: 16,
        type: null,
        elementType: {
          _status: 1,
          _result: { name: "InternalLazy", displayName: "LazyDisplay" },
        },
        return: null,
      });
      expect(components).toContain("LazyDisplay");
    });

    it("returns null for unresolved LazyComponent (tag 16, _status !== 1)", () => {
      const components = getNameForFiber({
        tag: 16,
        type: null,
        elementType: {
          _status: 0,
          _result: { name: "LazyComp" },
        },
        return: null,
      });
      expect(components).toEqual([]);
    });

    it("returns null for LazyComponent (tag 16) without _result", () => {
      const components = getNameForFiber({
        tag: 16,
        type: null,
        elementType: {
          _status: 1,
          _result: null,
        },
        return: null,
      });
      expect(components).toEqual([]);
    });

    it("extracts name from IncompleteClassComponent (tag 17)", () => {
      const components = getNameForFiber({
        tag: 17,
        type: { name: "BrokenClassComponent" },
        elementType: null,
        return: null,
      });
      expect(components).toContain("BrokenClassComponent");
    });

    it("extracts name from IncompleteFunctionComponent (tag 28)", () => {
      const components = getNameForFiber({
        tag: 28,
        type: { name: "BrokenFunctionComponent" },
        elementType: null,
        return: null,
      });
      expect(components).toContain("BrokenFunctionComponent");
    });

    it("returns null for HostHoistable (tag 26)", () => {
      const components = getNameForFiber({
        tag: 26,
        type: "link",
        elementType: "link",
        return: null,
      });
      expect(components).toEqual([]);
    });

    it("returns null for HostSingleton (tag 27)", () => {
      const components = getNameForFiber({
        tag: 27,
        type: "html",
        elementType: "html",
        return: null,
      });
      expect(components).toEqual([]);
    });

    it("returns null for DehydratedFragment (tag 18)", () => {
      const components = getNameForFiber({
        tag: 18,
        type: null,
        elementType: null,
        return: null,
      });
      expect(components).toEqual([]);
    });

    it("returns null for Throw (tag 29)", () => {
      const components = getNameForFiber({
        tag: 29,
        type: null,
        elementType: null,
        return: null,
      });
      expect(components).toEqual([]);
    });

    it("returns null for ViewTransitionComponent (tag 30)", () => {
      const components = getNameForFiber({
        tag: 30,
        type: null,
        elementType: null,
        return: null,
      });
      expect(components).toEqual([]);
    });

    it("returns null for ActivityComponent (tag 31)", () => {
      const components = getNameForFiber({
        tag: 31,
        type: null,
        elementType: null,
        return: null,
      });
      expect(components).toEqual([]);
    });

    it("returns null for LegacyHiddenComponent (tag 23)", () => {
      const components = getNameForFiber({
        tag: 23,
        type: null,
        elementType: null,
        return: null,
      });
      expect(components).toEqual([]);
    });

    it("returns null for CacheComponent (tag 24)", () => {
      const components = getNameForFiber({
        tag: 24,
        type: null,
        elementType: null,
        return: null,
      });
      expect(components).toEqual([]);
    });

    it("returns null for TracingMarkerComponent (tag 25)", () => {
      const components = getNameForFiber({
        tag: 25,
        type: null,
        elementType: null,
        return: null,
      });
      expect(components).toEqual([]);
    });
  });

  describe("isMinifiedName", () => {
    it("filters three-letter all-lowercase names", () => {
      const fiber = createMockFiber("abc");
      const app = createMockFiber("App", fiber);
      const element = createElementWithFiber(app);
      attachFiber(document.body, createMockFiber("App"));

      const result = getReactComponentName(element, { mode: "all" });
      expect(result.components).not.toContain("abc");
      expect(result.components).toContain("App");
    });

    it("does not filter three-letter names with uppercase", () => {
      const fiber = createMockFiber("Nav");
      const element = createElementWithFiber(fiber);
      attachFiber(document.body, createMockFiber("App"));

      const result = getReactComponentName(element, { mode: "all" });
      expect(result.components).toContain("Nav");
    });

    it("does not filter four-letter lowercase names", () => {
      const fiber = createMockFiber("menu");
      const element = createElementWithFiber(fiber);
      attachFiber(document.body, createMockFiber("App"));

      const result = getReactComponentName(element, { mode: "all" });
      expect(result.components).toContain("menu");
    });
  });

  describe("getReactComponentName cache for 'all' mode empty result", () => {
    it("caches empty result when no components are found in 'all' mode", () => {
      attachFiber(document.body, createMockFiber("App"));

      // Create an element with a fiber that has only a HostComponent (tag 5)
      const element = document.createElement("div");
      (element as unknown as Record<string, unknown>)["__reactFiber$test"] = {
        tag: 5, // HostComponent - returns null name
        type: "div",
        elementType: "div",
        return: null,
      };
      document.body.appendChild(element);

      const result1 = getReactComponentName(element, { mode: "all" });
      expect(result1.path).toBeNull();
      expect(result1.components).toEqual([]);

      // Second call should return cached empty result (same reference)
      const result2 = getReactComponentName(element, { mode: "all" });
      expect(result2).toBe(result1);
    });

    it("caches non-empty result in 'all' mode", () => {
      attachFiber(document.body, createMockFiber("App"));

      const fiber = createMockFiber("ValidComponent");
      const element = createElementWithFiber(fiber);

      const result1 = getReactComponentName(element, { mode: "all" });
      expect(result1.components).toContain("ValidComponent");

      // Mutate the fiber to prove cache is being used
      fiber.type.name = "ChangedName";
      fiber.type.displayName = "ChangedName";
      const result2 = getReactComponentName(element, { mode: "all" });
      expect(result2).toBe(result1);
      expect(result2.components).toContain("ValidComponent");
    });
  });

  describe("isReactPage via __reactInternalInstance$ prefix", () => {
    it("detects React via __reactInternalInstance$ key", () => {
      const root = document.createElement("div");
      root.id = "root";
      (root as unknown as Record<string, unknown>)[
        "__reactInternalInstance$abc"
      ] = {};
      document.body.appendChild(root);
      expect(isReactPage()).toBe(true);
    });
  });

  describe("ClassComponent and IndeterminateComponent fiber tags", () => {
    it("extracts name from ClassComponent (tag 1)", () => {
      attachFiber(document.body, createMockFiber("App"));
      const fiber = createMockFiber("MyClassComp", undefined, { tag: 1 });
      const element = createElementWithFiber(fiber);

      const result = getReactComponentName(element, { mode: "all" });
      expect(result.components).toContain("MyClassComp");
    });

    it("extracts name from IndeterminateComponent (tag 2)", () => {
      attachFiber(document.body, createMockFiber("App"));
      const fiber = createMockFiber("IndeterminateComp", undefined, {
        tag: 2,
      });
      const element = createElementWithFiber(fiber);

      const result = getReactComponentName(element, { mode: "all" });
      expect(result.components).toContain("IndeterminateComp");
    });
  });
});
