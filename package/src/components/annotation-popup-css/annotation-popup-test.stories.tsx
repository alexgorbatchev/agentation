import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, fireEvent, userEvent, waitFor, within } from "storybook/test";
import { AnnotationPopupCSS } from "./index";
import type { ThreadMessage } from "../../types";

const meta: Meta<typeof AnnotationPopupCSS> = {
  title: "Tests/AnnotationPopup",
  component: AnnotationPopupCSS,
  args: {
    element: "button",
    onSubmit: fn(),
    onCancel: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: 300, minWidth: 360, position: "relative" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof AnnotationPopupCSS>;

const sampleThread: ThreadMessage[] = [
  { id: "t1", role: "agent", content: "I see the issue, working on it.", timestamp: 1000 },
  { id: "t2", role: "human", content: "Thanks, please also check the color.", timestamp: 2000 },
];

// =============================================================================
// Rendering assertions
// =============================================================================

export const RendersElementName: Story = {
  args: { element: "Submit Button" },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Submit Button")).toBeTruthy();
  },
};

export const WithTimestamp: Story = {
  args: { timestamp: "@ 1.23s" },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("@ 1.23s")).toBeTruthy();
  },
};

export const WithSelectedText: Story = {
  args: { selectedText: "highlighted words" },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/highlighted words/)).toBeTruthy();
  },
};

export const CustomPlaceholder: Story = {
  args: { placeholder: "Describe the issue..." },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByPlaceholderText("Describe the issue...")
    ).toBeTruthy();
  },
};

export const InitialValue: Story = {
  args: { initialValue: "existing comment" },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByDisplayValue("existing comment")
    ).toBeTruthy();
  },
};

export const CustomSubmitLabel: Story = {
  args: { submitLabel: "Save" },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Save")).toBeTruthy();
  },
};

export const DefaultSubmitLabel: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Add")).toBeTruthy();
    await expect(within(canvasElement).getByText("Cancel")).toBeTruthy();
  },
};

export const AccentColor: Story = {
  args: { accentColor: "#ff0000", initialValue: "text" },
  play: async ({ canvasElement }) => {
    const submitBtn = within(canvasElement).getByText("Add");
    // Browser normalizes hex to rgb
    await expect(submitBtn.style.backgroundColor).toBe("rgb(255, 0, 0)");
  },
};

// =============================================================================
// Delete button
// =============================================================================

export const DeleteButtonVisible: Story = {
  args: { onDelete: fn() },
  play: async ({ canvasElement }) => {
    const buttons = canvasElement.querySelectorAll("button");
    // 3 buttons: delete, cancel, submit
    await expect(buttons.length).toBe(3);
  },
};

export const DeleteButtonHidden: Story = {
  play: async ({ canvasElement }) => {
    const buttons = canvasElement.querySelectorAll("button");
    // 2 buttons: cancel, submit
    await expect(buttons.length).toBe(2);
  },
};

export const DeleteButtonClick: Story = {
  args: { onDelete: fn() },
  play: async ({ canvasElement, args }) => {
    const buttons = canvasElement.querySelectorAll("button");
    await userEvent.click(buttons[0]);
    await expect(args.onDelete).toHaveBeenCalledOnce();
  },
};

// =============================================================================
// Submit behavior
// =============================================================================

export const SubmitWithText: Story = {
  args: { initialValue: "  fix the color  " },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByText("Add"));
    await expect(args.onSubmit).toHaveBeenCalledWith("fix the color");
  },
};

export const SubmitEmptyBlocked: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByText("Add"));
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

export const SubmitDisabledWhenEmpty: Story = {
  play: async ({ canvasElement }) => {
    const submitBtn = within(canvasElement).getByText("Add");
    await expect(submitBtn.hasAttribute("disabled")).toBe(true);
  },
};

export const SubmitOpacity: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 16 }}>
      <div data-testid="empty-popup">
        <AnnotationPopupCSS element="btn" onSubmit={fn()} onCancel={fn()} />
      </div>
      <div data-testid="filled-popup">
        <AnnotationPopupCSS
          element="btn"
          onSubmit={fn()}
          onCancel={fn()}
          initialValue="text"
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const emptyWrapper = canvas.getByTestId("empty-popup");
    const filledWrapper = canvas.getByTestId("filled-popup");

    const emptySubmit = within(emptyWrapper).getByText("Add");
    await expect(emptySubmit.style.opacity).toBe("0.4");

    const filledSubmit = within(filledWrapper).getByText("Add");
    await expect(filledSubmit.style.opacity).toBe("1");
  },
};

// =============================================================================
// Cancel & Keyboard
// =============================================================================

export const CancelWithDelay: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByText("Cancel"));
    // Not called immediately (exit animation)
    await expect(args.onCancel).not.toHaveBeenCalled();
    await waitFor(() => expect(args.onCancel).toHaveBeenCalledOnce(), {
      timeout: 500,
    });
  },
};

export const KeyboardEnterSubmit: Story = {
  args: { initialValue: "keyboard submit" },
  play: async ({ canvasElement, args }) => {
    const textarea = within(canvasElement).getByPlaceholderText(
      "What should change?"
    );
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    await expect(args.onSubmit).toHaveBeenCalledWith("keyboard submit");
  },
};

export const KeyboardShiftEnterNoSubmit: Story = {
  args: { initialValue: "text" },
  play: async ({ canvasElement, args }) => {
    const textarea = within(canvasElement).getByPlaceholderText(
      "What should change?"
    );
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

export const KeyboardEscapeCancel: Story = {
  play: async ({ canvasElement, args }) => {
    const textarea = within(canvasElement).getByPlaceholderText(
      "What should change?"
    );
    fireEvent.keyDown(textarea, { key: "Escape" });
    await waitFor(() => expect(args.onCancel).toHaveBeenCalledOnce(), {
      timeout: 500,
    });
  },
};

// =============================================================================
// Computed styles
// =============================================================================

export const WithComputedStyles: Story = {
  args: { computedStyles: { color: "red", fontSize: "16px" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("color")).toBeTruthy();
    await expect(canvas.getByText("red")).toBeTruthy();
  },
};

export const ComputedStylesCamelToKebab: Story = {
  args: { computedStyles: { fontSize: "16px" } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("font-size")).toBeTruthy();
  },
};

// =============================================================================
// Thread view
// =============================================================================

export const ThreadReadOnly: Story = {
  args: { initialValue: "Fix the button", thread: sampleThread },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Fix the button")).toBeTruthy();
    // Original comment is read-only, not in a textarea
    await expect(canvas.queryByDisplayValue("Fix the button")).toBeNull();
  },
};

export const ThreadWithRoles: Story = {
  args: { initialValue: "Fix it", thread: sampleThread },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Agent")).toBeTruthy();
    await expect(canvas.getByText("You")).toBeTruthy();
    await expect(
      canvas.getByText("I see the issue, working on it.")
    ).toBeTruthy();
    await expect(
      canvas.getByText("Thanks, please also check the color.")
    ).toBeTruthy();
  },
};

export const ThreadEmptyShowsEdit: Story = {
  args: { initialValue: "some text", thread: [] },
  play: async ({ canvasElement }) => {
    // Empty thread shows normal edit mode
    await expect(
      within(canvasElement).getByDisplayValue("some text")
    ).toBeTruthy();
  },
};

export const ThreadReplyVisible: Story = {
  args: {
    initialValue: "Fix it",
    thread: sampleThread,
    onReply: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByPlaceholderText("Reply...")).toBeTruthy();
    await expect(canvas.getByText("Reply")).toBeTruthy();
    await expect(canvas.getByText("Close")).toBeTruthy();
  },
};

export const ThreadReplySubmit: Story = {
  args: {
    initialValue: "Fix it",
    thread: sampleThread,
    onReply: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const textarea = within(canvasElement).getByPlaceholderText("Reply...");
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "  looks good now  ");
    await userEvent.click(within(canvasElement).getByText("Reply"));
    await expect(args.onReply).toHaveBeenCalledWith("looks good now");
  },
};

export const ThreadReplyEmpty: Story = {
  args: {
    initialValue: "Fix it",
    thread: sampleThread,
    onReply: fn(),
  },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByText("Reply"));
    await expect(args.onReply).not.toHaveBeenCalled();

    const replyBtn = within(canvasElement).getByText("Reply");
    await expect(replyBtn.hasAttribute("disabled")).toBe(true);
  },
};

export const ThreadReplyEnter: Story = {
  args: {
    initialValue: "Fix it",
    thread: sampleThread,
    onReply: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const textarea = within(canvasElement).getByPlaceholderText("Reply...");
    await userEvent.type(textarea, "enter reply");
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    await expect(args.onReply).toHaveBeenCalledWith("enter reply");
  },
};

export const ThreadReplySending: Story = {
  args: {
    initialValue: "Fix it",
    thread: sampleThread,
    onReply: fn(),
    isReplySending: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Sending...")).toBeTruthy();
    const btn = canvas.getByText("Sending...");
    await expect(btn.hasAttribute("disabled")).toBe(true);
  },
};
