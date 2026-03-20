/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";

// =============================================================================
// Barrel re-export coverage
// =============================================================================
// These tests import through the barrel index files (src/index.ts,
// src/utils/index.ts, src/components/index.ts) to exercise the re-export
// statements and bring their coverage above 0%.

describe("src/index.ts barrel exports", () => {
  it("exports main component", async () => {
    const mod = await import("../index");
    expect(mod.Agentation).toBeDefined();
    expect(mod.PageFeedbackToolbarCSS).toBeDefined();
  });

  it("exports AnnotationPopupCSS", async () => {
    const mod = await import("../index");
    expect(mod.AnnotationPopupCSS).toBeDefined();
  });

  it("exports utility functions", async () => {
    const mod = await import("../index");
    expect(mod.identifyElement).toBeTypeOf("function");
    expect(mod.getElementPath).toBeTypeOf("function");
    expect(mod.getNearbyText).toBeTypeOf("function");
    expect(mod.getElementClasses).toBeTypeOf("function");
    expect(mod.isInShadowDOM).toBeTypeOf("function");
    expect(mod.getShadowHost).toBeTypeOf("function");
    expect(mod.closestCrossingShadow).toBeTypeOf("function");
  });

  it("exports storage functions", async () => {
    const mod = await import("../index");
    expect(mod.loadAnnotations).toBeTypeOf("function");
    expect(mod.saveAnnotations).toBeTypeOf("function");
    expect(mod.getStorageKey).toBeTypeOf("function");
  });

  it("exports icon components", async () => {
    const mod = await import("../index");
    expect(mod.IconClose).toBeDefined();
    expect(mod.IconPlus).toBeDefined();
    expect(mod.IconCheck).toBeDefined();
  });
});

describe("src/utils/index.ts barrel exports", () => {
  it("re-exports element-identification utilities", async () => {
    const mod = await import("../utils/index");
    expect(mod.identifyElement).toBeTypeOf("function");
    expect(mod.getElementPath).toBeTypeOf("function");
    expect(mod.identifyAnimationElement).toBeTypeOf("function");
  });

  it("re-exports storage utilities", async () => {
    const mod = await import("../utils/index");
    expect(mod.loadAnnotations).toBeTypeOf("function");
    expect(mod.saveAnnotations).toBeTypeOf("function");
  });

  it("re-exports source-location utilities", async () => {
    const mod = await import("../utils/index");
    expect(mod.getSourceLocation).toBeTypeOf("function");
    expect(mod.formatSourceLocation).toBeTypeOf("function");
  });

  it("re-exports sync utilities", async () => {
    const mod = await import("../utils/index");
    expect(mod.listSessions).toBeTypeOf("function");
    expect(mod.createSession).toBeTypeOf("function");
  });
});

describe("src/components/index.ts barrel exports", () => {
  it("re-exports icon components", async () => {
    const mod = await import("../components/index");
    expect(mod.IconClose).toBeDefined();
    expect(mod.IconPlus).toBeDefined();
    expect(mod.AnimatedBunny).toBeDefined();
  });
});
