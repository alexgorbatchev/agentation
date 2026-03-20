/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";

import { PageFeedbackToolbarCSS } from "../index";
import { resetPageToolbarTestEnvironment } from "./pageToolbarTestUtils";

afterEach(() => {
  resetPageToolbarTestEnvironment();
});

describe("PageFeedbackToolbarCSS localStorage guards", () => {
  it("does not crash when localStorage.setItem throws during toolbar persistence", async () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("setItem blocked");
      });

    render(<PageFeedbackToolbarCSS />);

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalled();
    });

    expect(document.querySelector("[data-feedback-toolbar]")).toBeTruthy();
  });

  it("does not crash when localStorage.removeItem throws during annotation persistence", async () => {
    const removeItemSpy = vi
      .spyOn(Storage.prototype, "removeItem")
      .mockImplementation(() => {
        throw new Error("removeItem blocked");
      });

    render(<PageFeedbackToolbarCSS />);

    await waitFor(() => {
      expect(removeItemSpy).toHaveBeenCalled();
    });

    expect(document.querySelector("[data-feedback-toolbar]")).toBeTruthy();
  });

  it("does not crash when localStorage.getItem throws during toolbar hydration", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("getItem blocked");
    });

    expect(() => {
      render(<PageFeedbackToolbarCSS />);
    }).not.toThrow();

    expect(document.querySelector("[data-feedback-toolbar]")).toBeTruthy();
  });
});
