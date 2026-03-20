/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Annotation } from "../../../../types";
import { useAnnotationViewModel } from "../useAnnotationViewModel";

type HarnessProps = {
  annotations: Annotation[];
  exitingIds: string[];
};

type ViewModelSnapshot = {
  activeIds: string[];
  resolvedIds: string[];
  exitingIds: string[];
  visibleIds: string[];
  unreviewedCount: number;
  hasAnnotations: boolean;
};

function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: "annotation-1",
    x: 50,
    y: 100,
    comment: "comment",
    element: "button",
    elementPath: "div > button",
    timestamp: 1,
    ...overrides,
  };
}

function AnnotationViewModelHarness({
  annotations,
  exitingIds,
}: HarnessProps): JSX.Element {
  const model = useAnnotationViewModel({
    annotations,
    exitingMarkers: new Set(exitingIds),
  });

  const snapshot: ViewModelSnapshot = {
    activeIds: model.activeAnnotations.map((annotation) => annotation.id),
    resolvedIds: model.resolvedAnnotations.map((annotation) => annotation.id),
    exitingIds: model.exitingAnnotationsList.map((annotation) => annotation.id),
    visibleIds: model.visibleAnnotations.map((annotation) => annotation.id),
    unreviewedCount: model.unreviewedCount,
    hasAnnotations: model.hasAnnotations,
  };

  return <pre data-testid="snapshot">{JSON.stringify(snapshot)}</pre>;
}

function readSnapshot(): ViewModelSnapshot {
  return JSON.parse(screen.getByTestId("snapshot").textContent as string) as ViewModelSnapshot;
}

describe("useAnnotationViewModel", () => {
  it("splits active, resolved, and exiting annotations", () => {
    const annotations: Annotation[] = [
      makeAnnotation({ id: "active-1" }),
      makeAnnotation({ id: "active-2" }),
      makeAnnotation({ id: "resolved-unreviewed", status: "resolved" }),
      makeAnnotation({ id: "dismissed-reviewed", status: "dismissed", _reviewedAt: 123 }),
    ];

    render(
      <AnnotationViewModelHarness
        annotations={annotations}
        exitingIds={["active-2"]}
      />,
    );

    expect(readSnapshot()).toEqual({
      activeIds: ["active-1"],
      resolvedIds: ["resolved-unreviewed", "dismissed-reviewed"],
      exitingIds: ["active-2"],
      visibleIds: ["active-1"],
      unreviewedCount: 1,
      hasAnnotations: true,
    });
  });

  it("reports no annotations when input is empty", () => {
    render(
      <AnnotationViewModelHarness
        annotations={[]}
        exitingIds={[]}
      />,
    );

    expect(readSnapshot()).toEqual({
      activeIds: [],
      resolvedIds: [],
      exitingIds: [],
      visibleIds: [],
      unreviewedCount: 0,
      hasAnnotations: false,
    });
  });
});
