/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";

import type { Annotation } from "../../../../types";
import { generateOutput } from "../generateOutput";

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

describe("generateOutput", () => {
  it("falls back to an unknown forensic location when persisted coordinates are missing", () => {
    const annotation = makeAnnotation({
      comment: "Deep analysis",
      fullPath: "html > body > footer",
    });

    Reflect.set(annotation, "x", undefined);
    Reflect.set(annotation, "y", undefined);

    const output = generateOutput([annotation], "/test", "forensic");

    expect(output).toContain("**Annotation at:** unknown");
    expect(output).toContain("**Feedback:** Deep analysis");
  });
});
