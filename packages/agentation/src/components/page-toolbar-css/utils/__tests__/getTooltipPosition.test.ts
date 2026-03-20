/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";

import type { Annotation } from "../../../../types";
import { getTooltipPosition } from "../getTooltipPosition";

function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: "annotation-1",
    x: 50,
    y: 200,
    comment: "comment",
    element: "button",
    elementPath: "div > button",
    timestamp: 1,
    ...overrides,
  };
}

function setViewport(width: number, height: number): void {
  Object.defineProperty(window, "innerWidth", {
    value: width,
    configurable: true,
  });

  Object.defineProperty(window, "innerHeight", {
    value: height,
    configurable: true,
  });
}

describe("getTooltipPosition", () => {
  it("returns default styles when marker has enough space", () => {
    setViewport(1000, 800);

    expect(getTooltipPosition(makeAnnotation({ x: 50, y: 200 }))).toEqual({});
  });

  it("flips tooltip above marker near viewport bottom", () => {
    setViewport(1000, 800);

    expect(getTooltipPosition(makeAnnotation({ x: 50, y: 760 }))).toEqual({
      top: "auto",
      bottom: "calc(100% + 10px)",
    });
  });

  it("nudges tooltip right when marker is near left edge", () => {
    setViewport(1000, 800);

    expect(getTooltipPosition(makeAnnotation({ x: 1, y: 200 }))).toEqual({
      left: "calc(50% + 100px)",
    });
  });

  it("nudges tooltip left when marker is near right edge", () => {
    setViewport(1000, 800);

    expect(getTooltipPosition(makeAnnotation({ x: 99, y: 200 }))).toEqual({
      left: "calc(50% - 100px)",
    });
  });
});
