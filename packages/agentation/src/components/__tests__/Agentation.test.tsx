/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

type PageFeedbackToolbarCSSMockProps = {
  projectId: string;
};

function MockPageFeedbackToolbarCSS(props: PageFeedbackToolbarCSSMockProps): JSX.Element {
  return (
    <div
      data-project-id={props.projectId}
      data-testid="page-feedback-toolbar-css"
    />
  );
}

describe("Agentation", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("renders the toolbar even when NODE_ENV is production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.doMock("../page-toolbar-css", () => ({
      PageFeedbackToolbarCSS: MockPageFeedbackToolbarCSS,
    }));

    const { Agentation } = await import("../Agentation");

    render(<Agentation projectId="my-project" />);

    expect(
      screen.getByTestId("page-feedback-toolbar-css").getAttribute("data-project-id")
    ).toBe("my-project");
  });
});
