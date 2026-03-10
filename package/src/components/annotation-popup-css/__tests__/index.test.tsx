/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { AnnotationPopupCSS } from "../index";
import type { AnnotationPopupCSSHandle } from "../index";

// Note: We do NOT use fake timers globally because the component uses
// `originalSetTimeout` from freeze-animations (captured before fake timers install).
// Tests that need timing use waitFor() instead.

const defaultProps = {
  element: "button",
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
};

function renderPopup(props: Partial<Parameters<typeof AnnotationPopupCSS>[0]> = {}) {
  return render(<AnnotationPopupCSS {...defaultProps} {...props} />);
}

// =============================================================================
// Rendering
// =============================================================================

describe("rendering", () => {
  it("renders the element name in the header", () => {
    renderPopup({ element: "Submit Button" });
    expect(screen.getByText("Submit Button")).toBeDefined();
  });

  it("renders timestamp when provided", () => {
    renderPopup({ timestamp: "@ 1.23s" });
    expect(screen.getByText("@ 1.23s")).toBeDefined();
  });

  it("does not render timestamp when not provided", () => {
    renderPopup();
    expect(screen.queryByText(/@ /)).toBeNull();
  });

  it("renders selected text in a quote", () => {
    renderPopup({ selectedText: "highlighted words" });
    expect(screen.getByText(/highlighted words/)).toBeDefined();
  });

  it("truncates long selected text with ellipsis", () => {
    const longText = "A".repeat(100);
    renderPopup({ selectedText: longText });
    expect(screen.getByText(/\.\.\./)).toBeDefined();
  });

  it("renders textarea with custom placeholder", () => {
    renderPopup({ placeholder: "Describe the issue..." });
    expect(screen.getByPlaceholderText("Describe the issue...")).toBeDefined();
  });

  it("renders textarea with default placeholder", () => {
    renderPopup();
    expect(screen.getByPlaceholderText("What should change?")).toBeDefined();
  });

  it("renders initial value in textarea", () => {
    renderPopup({ initialValue: "existing comment" });
    expect(screen.getByDisplayValue("existing comment")).toBeDefined();
  });

  it("renders custom submit label", () => {
    renderPopup({ submitLabel: "Save" });
    expect(screen.getByText("Save")).toBeDefined();
  });

  it("renders default submit label 'Add'", () => {
    renderPopup();
    expect(screen.getByText("Add")).toBeDefined();
  });

  it("renders Cancel button", () => {
    renderPopup();
    expect(screen.getByText("Cancel")).toBeDefined();
  });

  it("sets data-annotation-popup attribute", () => {
    const { container } = renderPopup();
    expect(container.querySelector("[data-annotation-popup]")).not.toBeNull();
  });

  it("applies custom accent color to submit button", () => {
    renderPopup({ accentColor: "#ff0000", initialValue: "text" });
    const submitBtn = screen.getByText("Add");
    // jsdom normalizes hex to rgb
    expect(submitBtn.style.backgroundColor).toBe("rgb(255, 0, 0)");
  });
});

// =============================================================================
// Delete button
// =============================================================================

describe("delete button", () => {
  it("shows delete button when onDelete is provided", () => {
    const onDelete = vi.fn();
    const { container } = renderPopup({ onDelete });
    // The delete button contains an SVG icon, find it by role or container
    const deleteButtons = container.querySelectorAll("button");
    // Should have 3 buttons: delete, cancel, submit
    expect(deleteButtons.length).toBe(3);
  });

  it("does not show delete button when onDelete is not provided", () => {
    const { container } = renderPopup();
    const buttons = container.querySelectorAll("button");
    // Should have 2 buttons: cancel, submit
    expect(buttons.length).toBe(2);
  });

  it("calls onDelete when delete button is clicked", () => {
    const onDelete = vi.fn();
    const { container } = renderPopup({ onDelete });
    // Delete button is the first button (before Cancel and Submit)
    const buttons = container.querySelectorAll("button");
    fireEvent.click(buttons[0]);
    expect(onDelete).toHaveBeenCalledOnce();
  });
});

// =============================================================================
// Submit behavior
// =============================================================================

describe("submit", () => {
  it("calls onSubmit with trimmed text when clicking submit", () => {
    const onSubmit = vi.fn();
    renderPopup({ onSubmit, initialValue: "  fix the color  " });
    fireEvent.click(screen.getByText("Add"));
    expect(onSubmit).toHaveBeenCalledWith("fix the color");
  });

  it("does not call onSubmit when text is empty", () => {
    const onSubmit = vi.fn();
    renderPopup({ onSubmit });
    fireEvent.click(screen.getByText("Add"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not call onSubmit when text is only whitespace", () => {
    const onSubmit = vi.fn();
    renderPopup({ onSubmit, initialValue: "   " });
    fireEvent.click(screen.getByText("Add"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submit button is disabled when text is empty", () => {
    renderPopup();
    const submitBtn = screen.getByText("Add");
    expect(submitBtn.hasAttribute("disabled")).toBe(true);
  });

  it("submit button is enabled when text is entered", () => {
    renderPopup({ initialValue: "something" });
    const submitBtn = screen.getByText("Add");
    expect(submitBtn.hasAttribute("disabled")).toBe(false);
  });

  it("submit button has reduced opacity when empty", () => {
    renderPopup();
    const submitBtn = screen.getByText("Add");
    expect(submitBtn.style.opacity).toBe("0.4");
  });

  it("submit button has full opacity when text entered", () => {
    renderPopup({ initialValue: "text" });
    const submitBtn = screen.getByText("Add");
    expect(submitBtn.style.opacity).toBe("1");
  });
});

// =============================================================================
// Cancel behavior
// =============================================================================

describe("cancel", () => {
  it("calls onCancel after exit animation delay when clicking Cancel", async () => {
    const onCancel = vi.fn();
    renderPopup({ onCancel });
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).not.toHaveBeenCalled(); // Not called immediately
    await waitFor(() => expect(onCancel).toHaveBeenCalledOnce(), { timeout: 500 });
  });
});

// =============================================================================
// Keyboard events
// =============================================================================

describe("keyboard", () => {
  it("submits on Enter key (without Shift)", () => {
    const onSubmit = vi.fn();
    renderPopup({ onSubmit, initialValue: "keyboard submit" });
    const textarea = screen.getByPlaceholderText("What should change?");
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(onSubmit).toHaveBeenCalledWith("keyboard submit");
  });

  it("does not submit on Shift+Enter (allows newline)", () => {
    const onSubmit = vi.fn();
    renderPopup({ onSubmit, initialValue: "text" });
    const textarea = screen.getByPlaceholderText("What should change?");
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("cancels on Escape key", async () => {
    const onCancel = vi.fn();
    renderPopup({ onCancel });
    const textarea = screen.getByPlaceholderText("What should change?");
    fireEvent.keyDown(textarea, { key: "Escape" });
    await waitFor(() => expect(onCancel).toHaveBeenCalledOnce(), { timeout: 500 });
  });
});

// =============================================================================
// Textarea interaction
// =============================================================================

describe("textarea", () => {
  it("updates text value on change", () => {
    renderPopup();
    const textarea = screen.getByPlaceholderText("What should change?") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "new text" } });
    expect(textarea.value).toBe("new text");
  });
});

// =============================================================================
// Computed styles accordion
// =============================================================================

describe("computed styles", () => {
  it("renders computed styles toggle when styles provided", () => {
    renderPopup({ computedStyles: { color: "red", fontSize: "16px" } });
    // Should render style properties
    expect(screen.getByText("color")).toBeDefined();
    expect(screen.getByText("red")).toBeDefined();
  });

  it("converts camelCase property names to kebab-case", () => {
    renderPopup({ computedStyles: { fontSize: "16px" } });
    expect(screen.getByText("font-size")).toBeDefined();
  });

  it("does not render styles section when computedStyles is empty", () => {
    const { container } = renderPopup({ computedStyles: {} });
    // When no styles, element name is a plain span, not a button toggle
    const headerButtons = container.querySelectorAll("button");
    // Only Cancel and Submit buttons, no toggle
    expect(headerButtons.length).toBe(2);
  });

  it("does not render styles section when computedStyles is undefined", () => {
    const { container } = renderPopup();
    const headerButtons = container.querySelectorAll("button");
    expect(headerButtons.length).toBe(2);
  });
});

// =============================================================================
// Imperative handle (shake)
// =============================================================================

describe("shake via ref", () => {
  it("exposes shake method via ref", () => {
    const ref = createRef<AnnotationPopupCSSHandle>();
    render(
      <AnnotationPopupCSS
        ref={ref}
        element="button"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(ref.current).not.toBeNull();
    expect(typeof ref.current?.shake).toBe("function");
  });

  it("calling shake does not throw", () => {
    const ref = createRef<AnnotationPopupCSSHandle>();
    render(
      <AnnotationPopupCSS
        ref={ref}
        element="button"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(() => ref.current?.shake()).not.toThrow();
  });
});

// =============================================================================
// Click propagation
// =============================================================================

describe("click isolation", () => {
  it("stops click propagation on the popup container", () => {
    const outerClick = vi.fn();
    const { container } = render(
      <div onClick={outerClick}>
        <AnnotationPopupCSS {...defaultProps} />
      </div>
    );
    const popup = container.querySelector("[data-annotation-popup]")!;
    fireEvent.click(popup);
    expect(outerClick).not.toHaveBeenCalled();
  });
});
