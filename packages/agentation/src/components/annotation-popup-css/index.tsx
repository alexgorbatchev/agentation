"use client";

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import styles from "./styles.module.scss";
import { IconTrash } from "../icons";
import { originalSetTimeout } from "../../utils/freeze-animations";
import type { ThreadMessage } from "../../types";

// =============================================================================
// Helpers
// =============================================================================

/** Focus an element while temporarily blocking focus-trap libraries (e.g. Radix
 *  FocusScope) from reclaiming focus via focusin/focusout handlers. */
function focusBypassingTraps(el: HTMLElement | null) {
  if (!el) return;
  const trap = (e: Event) => e.stopImmediatePropagation();
  document.addEventListener("focusin", trap, true);
  document.addEventListener("focusout", trap, true);
  try {
    el.focus();
  } finally {
    document.removeEventListener("focusin", trap, true);
    document.removeEventListener("focusout", trap, true);
  }
}

// =============================================================================
// Types
// =============================================================================

export interface AnnotationPopupCSSProps {
  /** Element name to display in header */
  element: string;
  /** Optional timestamp display (e.g., "@ 1.23s" for animation feedback) */
  timestamp?: string;
  /** Optional selected/highlighted text */
  selectedText?: string;
  /** Placeholder text for the textarea */
  placeholder?: string;
  /** Initial value for textarea (for edit mode) */
  initialValue?: string;
  /** Label for submit button (default: "Add") */
  submitLabel?: string;
  /** Called when annotation is submitted with text */
  onSubmit: (text: string) => void;
  /** Called when popup is cancelled/dismissed */
  onCancel: () => void;
  /** Called when delete button is clicked (only shown if provided) */
  onDelete?: () => void;
  /** Position styles (left, top) */
  style?: React.CSSProperties;
  /** Custom color for submit button and textarea focus (hex) */
  accentColor?: string;
  /** External exit state (parent controls exit animation) */
  isExiting?: boolean;
  /** Light mode styling */
  lightMode?: boolean;
  /** Computed styles for the selected element */
  computedStyles?: Record<string, string>;
  /** Thread messages for this annotation */
  thread?: ThreadMessage[];
  /** Called when user sends a reply in the thread */
  onReply?: (content: string) => void;
  /** Whether a reply is currently being sent */
  isReplySending?: boolean;
}

export interface AnnotationPopupCSSHandle {
  /** Shake the popup (e.g., when user clicks outside) */
  shake: () => void;
}

// =============================================================================
// Component
// =============================================================================

export const AnnotationPopupCSS = forwardRef<AnnotationPopupCSSHandle, AnnotationPopupCSSProps>(
  function AnnotationPopupCSS(
    {
      element,
      timestamp,
      selectedText,
      placeholder = "What should change?",
      initialValue = "",
      submitLabel = "Add",
      onSubmit,
      onCancel,
      onDelete,
      style,
      accentColor = "#3c82f7",
      isExiting = false,
      lightMode = false,
      computedStyles,
      thread,
      onReply,
      isReplySending = false,
    },
    ref
  ) {
    const hasThread = thread && thread.length > 0;
    const [text, setText] = useState(hasThread ? "" : initialValue);
    const [isShaking, setIsShaking] = useState(false);
    const [animState, setAnimState] = useState<"initial" | "enter" | "entered" | "exit">("initial");
    const [isFocused, setIsFocused] = useState(false);
    const [isStylesExpanded, setIsStylesExpanded] = useState(false); // Computed styles accordion state
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
    const threadMessagesRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const cancelTimerRef = useRef<ReturnType<typeof originalSetTimeout> | null>(null);
    const shakeTimerRef = useRef<ReturnType<typeof originalSetTimeout> | null>(null);
    const [replyText, setReplyText] = useState("");

    // Sync with parent exit state
    useEffect(() => {
      if (isExiting && animState !== "exit") {
        setAnimState("exit");
      }
    }, [isExiting, animState]);

    // Animate in on mount and focus textarea
    useEffect(() => {
      // Start enter animation (use originalSetTimeout to bypass freeze patch)
      originalSetTimeout(() => {
        setAnimState("enter");
      }, 0);
      // Transition to entered state after animation completes
      const enterTimer = originalSetTimeout(() => {
        setAnimState("entered");
      }, 200); // Match animation duration
      const focusTimer = originalSetTimeout(() => {
        const target = hasThread ? replyTextareaRef.current : textareaRef.current;
        if (target) {
          focusBypassingTraps(target);
          target.selectionStart = target.selectionEnd = target.value.length;
          target.scrollTop = target.scrollHeight;
        }
      }, 50);
      return () => {
        window.clearTimeout(enterTimer);
        window.clearTimeout(focusTimer);
        if (cancelTimerRef.current) window.clearTimeout(cancelTimerRef.current);
        if (shakeTimerRef.current) window.clearTimeout(shakeTimerRef.current);
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-scroll thread to bottom on new messages
    useEffect(() => {
      if (threadMessagesRef.current) {
        threadMessagesRef.current.scrollTop = threadMessagesRef.current.scrollHeight;
      }
    }, [thread?.length]);

    // Shake animation
    const shake = useCallback(() => {
      if (shakeTimerRef.current) window.clearTimeout(shakeTimerRef.current);
      setIsShaking(true);
      shakeTimerRef.current = originalSetTimeout(() => {
        setIsShaking(false);
        focusBypassingTraps(textareaRef.current);
      }, 250);
    }, []);

    // Expose shake to parent via ref
    useImperativeHandle(ref, () => ({
      shake,
    }), [shake]);

    // Handle cancel with exit animation
    const handleCancel = useCallback(() => {
      setAnimState("exit");
      cancelTimerRef.current = originalSetTimeout(() => {
        onCancel();
      }, 150); // Match exit animation duration
    }, [onCancel]);

    // Handle submit
    const handleSubmit = useCallback(() => {
      if (!text.trim()) return;
      onSubmit(text.trim());
    }, [text, onSubmit]);

    // Handle reply
    const handleReply = useCallback(() => {
      if (!replyText.trim() || !onReply) return;
      onReply(replyText.trim());
      setReplyText("");
    }, [replyText, onReply]);

    // Handle keyboard
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        e.stopPropagation();
        if (e.nativeEvent.isComposing) return;
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
        }
        if (e.key === "Escape") {
          handleCancel();
        }
      },
      [handleSubmit, handleCancel]
    );

    // Handle reply keyboard
    const handleReplyKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        e.stopPropagation();
        if (e.nativeEvent.isComposing) return;
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleReply();
        }
        if (e.key === "Escape") {
          handleCancel();
        }
      },
      [handleReply, handleCancel]
    );

    const popupClassName = [
      styles.popup,
      lightMode ? styles.light : "",
      animState === "enter" ? styles.enter : "",
      animState === "entered" ? styles.entered : "",
      animState === "exit" ? styles.exit : "",
      isShaking ? styles.shake : "",
    ].filter(Boolean).join(" ");

    return (
      <div
        ref={popupRef}
        className={popupClassName}
        data-annotation-popup
        style={style}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          {computedStyles && Object.keys(computedStyles).length > 0 ? (
            <button
              className={styles.headerToggle}
              onClick={() => {
                const wasExpanded = isStylesExpanded;
                setIsStylesExpanded(!isStylesExpanded);
                if (wasExpanded) {
                  // Refocus textarea when closing
                  originalSetTimeout(() => focusBypassingTraps(textareaRef.current), 0);
                }
              }}
              type="button"
            >
              <svg
                className={`${styles.chevron} ${isStylesExpanded ? styles.expanded : ""}`}
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.5 10.25L9 7.25L5.75 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className={styles.element}>{element}</span>
            </button>
          ) : (
            <span className={styles.element}>{element}</span>
          )}
          {timestamp && <span className={styles.timestamp}>{timestamp}</span>}
        </div>

        {/* Collapsible computed styles section - uses grid-template-rows for smooth animation */}
        {computedStyles && Object.keys(computedStyles).length > 0 && (
          <div className={`${styles.stylesWrapper} ${isStylesExpanded ? styles.expanded : ""}`}>
            <div className={styles.stylesInner}>
              <div className={styles.stylesBlock}>
                {Object.entries(computedStyles).map(([key, value]) => (
                  <div key={key} className={styles.styleLine}>
                    <span className={styles.styleProperty}>
                      {key.replace(/([A-Z])/g, "-$1").toLowerCase()}
                    </span>
                    : <span className={styles.styleValue}>{value}</span>;
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {hasThread ? (
          <>
            {/* Thread view: original comment read-only, messages, reply input */}
            <div className={styles.threadOriginal}>{initialValue}</div>

            <div ref={threadMessagesRef} className={styles.threadMessages}>
              {thread.map((msg) => (
                <div
                  key={msg.id}
                  className={`${styles.threadMessage} ${msg.role === "agent" ? styles.agent : styles.human}`}
                >
                  <div className={styles.threadRole}>
                    {msg.role === "agent" ? "Agent" : "You"}
                  </div>
                  <div className={styles.threadContent}>{msg.content}</div>
                </div>
              ))}
            </div>

            {onReply && (
              <div className={styles.threadReplySection}>
                <textarea
                  ref={replyTextareaRef}
                  className={styles.textarea}
                  style={{ borderColor: isFocused ? accentColor : undefined }}
                  placeholder="Reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  rows={2}
                  onKeyDown={handleReplyKeyDown}
                />
                <div className={styles.actions}>
                  <button className={styles.cancel} onClick={handleCancel}>
                    Close
                  </button>
                  <button
                    className={styles.submit}
                    style={{
                      backgroundColor: accentColor,
                      opacity: replyText.trim() && !isReplySending ? 1 : 0.4,
                    }}
                    onClick={handleReply}
                    disabled={!replyText.trim() || isReplySending}
                  >
                    {isReplySending ? "Sending..." : "Reply"}
                  </button>
                </div>
              </div>
            )}

            {!onReply && (
              <div className={styles.actions}>
                <button className={styles.cancel} onClick={handleCancel}>
                  Close
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {selectedText && (
              <div className={styles.quote}>
                &ldquo;{selectedText.slice(0, 80)}
                {selectedText.length > 80 ? "..." : ""}&rdquo;
              </div>
            )}

            <textarea
              ref={textareaRef}
              className={styles.textarea}
              style={{ borderColor: isFocused ? accentColor : undefined }}
              placeholder={placeholder}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              rows={2}
              onKeyDown={handleKeyDown}
            />

            <div className={styles.actions}>
              {onDelete && (
                <div className={styles.deleteWrapper}>
                  <button
                    aria-label="Delete annotation"
                    className={styles.deleteButton}
                    onClick={onDelete}
                    type="button"
                  >
                    <IconTrash size={22} />
                  </button>
                </div>
              )}
              <button className={styles.cancel} onClick={handleCancel}>
                Cancel
              </button>
              <button
                className={styles.submit}
                style={{
                  backgroundColor: accentColor,
                  opacity: text.trim() ? 1 : 0.4,
                }}
                onClick={handleSubmit}
                disabled={!text.trim()}
              >
                {submitLabel}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
);

export default AnnotationPopupCSS;
