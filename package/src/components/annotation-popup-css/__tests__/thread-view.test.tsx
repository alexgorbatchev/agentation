/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AnnotationPopupCSS } from "../index";
import type { ThreadMessage } from "../../../types";

const defaultProps = {
  element: "button",
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
};

function renderPopup(props: Partial<Parameters<typeof AnnotationPopupCSS>[0]> = {}) {
  return render(<AnnotationPopupCSS {...defaultProps} {...props} />);
}

const sampleThread: ThreadMessage[] = [
  { id: "t1", role: "agent", content: "I see the issue, working on it.", timestamp: 1000 },
  { id: "t2", role: "human", content: "Thanks, please also check the color.", timestamp: 2000 },
];

// =============================================================================
// Thread view rendering
// =============================================================================

describe("thread view rendering", () => {
  it("shows original comment read-only when thread has messages", () => {
    renderPopup({ initialValue: "Fix the button", thread: sampleThread });
    expect(screen.getByText("Fix the button")).toBeDefined();
    // Should NOT have a textarea with the original value (it's read-only)
    expect(screen.queryByDisplayValue("Fix the button")).toBeNull();
  });

  it("shows thread messages with role labels", () => {
    renderPopup({ initialValue: "Fix it", thread: sampleThread });
    expect(screen.getByText("Agent")).toBeDefined();
    expect(screen.getByText("You")).toBeDefined();
    expect(screen.getByText("I see the issue, working on it.")).toBeDefined();
    expect(screen.getByText("Thanks, please also check the color.")).toBeDefined();
  });

  it("does not show thread view when thread is empty", () => {
    renderPopup({ initialValue: "some text", thread: [] });
    // Should show normal edit mode with textarea
    expect(screen.getByDisplayValue("some text")).toBeDefined();
  });

  it("does not show thread view when thread is undefined", () => {
    renderPopup({ initialValue: "some text" });
    expect(screen.getByDisplayValue("some text")).toBeDefined();
  });

  it("shows reply textarea when onReply is provided", () => {
    const onReply = vi.fn();
    renderPopup({ initialValue: "Fix it", thread: sampleThread, onReply });
    expect(screen.getByPlaceholderText("Reply...")).toBeDefined();
  });

  it("does not show reply textarea when onReply is not provided", () => {
    renderPopup({ initialValue: "Fix it", thread: sampleThread });
    expect(screen.queryByPlaceholderText("Reply...")).toBeNull();
  });

  it("shows Close button instead of Cancel in thread view without onReply", () => {
    renderPopup({ initialValue: "Fix it", thread: sampleThread });
    expect(screen.getByText("Close")).toBeDefined();
    expect(screen.queryByText("Cancel")).toBeNull();
  });

  it("shows Close button in thread view with onReply", () => {
    renderPopup({ initialValue: "Fix it", thread: sampleThread, onReply: vi.fn() });
    expect(screen.getByText("Close")).toBeDefined();
  });

  it("shows Reply button when onReply is provided", () => {
    renderPopup({ initialValue: "Fix it", thread: sampleThread, onReply: vi.fn() });
    expect(screen.getByText("Reply")).toBeDefined();
  });
});

// =============================================================================
// Thread reply behavior
// =============================================================================

describe("thread reply", () => {
  it("calls onReply with trimmed text when clicking Reply", () => {
    const onReply = vi.fn();
    renderPopup({ initialValue: "Fix it", thread: sampleThread, onReply });
    const textarea = screen.getByPlaceholderText("Reply...");
    fireEvent.change(textarea, { target: { value: "  looks good now  " } });
    fireEvent.click(screen.getByText("Reply"));
    expect(onReply).toHaveBeenCalledWith("looks good now");
  });

  it("does not call onReply when reply text is empty", () => {
    const onReply = vi.fn();
    renderPopup({ initialValue: "Fix it", thread: sampleThread, onReply });
    fireEvent.click(screen.getByText("Reply"));
    expect(onReply).not.toHaveBeenCalled();
  });

  it("Reply button is disabled when reply text is empty", () => {
    renderPopup({ initialValue: "Fix it", thread: sampleThread, onReply: vi.fn() });
    const replyBtn = screen.getByText("Reply");
    expect(replyBtn.hasAttribute("disabled")).toBe(true);
  });

  it("Reply button is enabled when reply text is entered", () => {
    renderPopup({ initialValue: "Fix it", thread: sampleThread, onReply: vi.fn() });
    const textarea = screen.getByPlaceholderText("Reply...");
    fireEvent.change(textarea, { target: { value: "hello" } });
    const replyBtn = screen.getByText("Reply");
    expect(replyBtn.hasAttribute("disabled")).toBe(false);
  });

  it("submits reply on Enter key", () => {
    const onReply = vi.fn();
    renderPopup({ initialValue: "Fix it", thread: sampleThread, onReply });
    const textarea = screen.getByPlaceholderText("Reply...");
    fireEvent.change(textarea, { target: { value: "enter reply" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(onReply).toHaveBeenCalledWith("enter reply");
  });

  it("does not submit on Shift+Enter", () => {
    const onReply = vi.fn();
    renderPopup({ initialValue: "Fix it", thread: sampleThread, onReply });
    const textarea = screen.getByPlaceholderText("Reply...");
    fireEvent.change(textarea, { target: { value: "text" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(onReply).not.toHaveBeenCalled();
  });

  it("cancels on Escape from reply textarea", async () => {
    const onCancel = vi.fn();
    renderPopup({ initialValue: "Fix it", thread: sampleThread, onReply: vi.fn(), onCancel });
    const textarea = screen.getByPlaceholderText("Reply...");
    fireEvent.keyDown(textarea, { key: "Escape" });
    await waitFor(() => expect(onCancel).toHaveBeenCalledOnce(), { timeout: 500 });
  });

  it("clears reply text after sending", () => {
    const onReply = vi.fn();
    renderPopup({ initialValue: "Fix it", thread: sampleThread, onReply });
    const textarea = screen.getByPlaceholderText("Reply...") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "my reply" } });
    fireEvent.click(screen.getByText("Reply"));
    expect(textarea.value).toBe("");
  });
});

// =============================================================================
// Reply sending state
// =============================================================================

describe("reply sending state", () => {
  it("shows 'Sending...' when isReplySending is true", () => {
    renderPopup({
      initialValue: "Fix it",
      thread: sampleThread,
      onReply: vi.fn(),
      isReplySending: true,
    });
    expect(screen.getByText("Sending...")).toBeDefined();
  });

  it("Reply button is disabled when isReplySending is true", () => {
    renderPopup({
      initialValue: "Fix it",
      thread: sampleThread,
      onReply: vi.fn(),
      isReplySending: true,
    });
    const btn = screen.getByText("Sending...");
    expect(btn.hasAttribute("disabled")).toBe(true);
  });
});

// =============================================================================
// Normal mode unchanged
// =============================================================================

describe("normal mode still works with thread props", () => {
  it("renders normal edit mode when thread is undefined", () => {
    renderPopup({ initialValue: "edit me", submitLabel: "Save" });
    expect(screen.getByDisplayValue("edit me")).toBeDefined();
    expect(screen.getByText("Save")).toBeDefined();
    expect(screen.getByText("Cancel")).toBeDefined();
  });

  it("renders normal edit mode when thread is empty array", () => {
    renderPopup({ initialValue: "edit me", thread: [], submitLabel: "Save" });
    expect(screen.getByDisplayValue("edit me")).toBeDefined();
    expect(screen.getByText("Save")).toBeDefined();
  });
});
