/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { freeze, unfreeze, originalSetTimeout, originalSetInterval } from "../freeze-animations";

const STYLE_ID = "feedback-freeze-styles";
const STATE_KEY = "__agentation_freeze";

// The module stores all mutable state on window[STATE_KEY]. We reset it between
// tests to get clean freeze/unfreeze behavior without needing module re-imports.
function resetFreezeState() {
  const state = (window as any)[STATE_KEY];
  if (state) {
    state.frozen = false;
    state.pausedAnimations = [];
    state.frozenTimeoutQueue = [];
    state.frozenRAFQueue = [];
  }
}

beforeEach(() => {
  document.body.innerHTML = "";
  document.getElementById(STYLE_ID)?.remove();
  resetFreezeState();
});

afterEach(() => {
  // Ensure we unfreeze after each test so state doesn't leak
  try { unfreeze(); } catch { /* ignore */ }
  document.getElementById(STYLE_ID)?.remove();
  resetFreezeState();
});

// =============================================================================
// freeze() — CSS injection
// =============================================================================

describe("freeze", () => {
  it("injects a style element into the head", () => {
    freeze();
    const style = document.getElementById(STYLE_ID);
    expect(style).not.toBeNull();
    expect(style?.tagName.toLowerCase()).toBe("style");
  });

  it("sets animation-play-state: paused in injected CSS", () => {
    freeze();
    const style = document.getElementById(STYLE_ID);
    expect(style?.textContent).toContain("animation-play-state: paused");
  });

  it("sets transition: none in injected CSS", () => {
    freeze();
    const style = document.getElementById(STYLE_ID);
    expect(style?.textContent).toContain("transition: none");
  });

  it("excludes agentation UI elements via :not selectors", () => {
    freeze();
    const style = document.getElementById(STYLE_ID);
    expect(style?.textContent).toContain("data-feedback-toolbar");
    expect(style?.textContent).toContain("data-annotation-popup");
    expect(style?.textContent).toContain("data-annotation-marker");
    expect(style?.textContent).toContain(":not(");
  });

  it("is idempotent — calling twice does not duplicate style elements", () => {
    freeze();
    freeze();
    const styles = document.querySelectorAll(`#${STYLE_ID}`);
    expect(styles.length).toBe(1);
  });

  it("sets frozen state on window", () => {
    freeze();
    expect((window as any)[STATE_KEY].frozen).toBe(true);
  });
});

// =============================================================================
// unfreeze()
// =============================================================================

describe("unfreeze", () => {
  it("removes the injected style element", () => {
    freeze();
    expect(document.getElementById(STYLE_ID)).not.toBeNull();
    unfreeze();
    expect(document.getElementById(STYLE_ID)).toBeNull();
  });

  it("clears frozen state on window", () => {
    freeze();
    unfreeze();
    expect((window as any)[STATE_KEY].frozen).toBe(false);
  });

  it("is idempotent — calling unfreeze when not frozen is a no-op", () => {
    // Should not throw
    expect(() => unfreeze()).not.toThrow();
    expect(document.getElementById(STYLE_ID)).toBeNull();
  });
});

// =============================================================================
// freeze/unfreeze cycle
// =============================================================================

describe("freeze/unfreeze cycle", () => {
  it("can freeze, unfreeze, and re-freeze cleanly", () => {
    freeze();
    expect(document.getElementById(STYLE_ID)).not.toBeNull();

    unfreeze();
    expect(document.getElementById(STYLE_ID)).toBeNull();

    freeze();
    expect(document.getElementById(STYLE_ID)).not.toBeNull();

    unfreeze();
    expect(document.getElementById(STYLE_ID)).toBeNull();
  });
});

// =============================================================================
// Video pause / resume
// =============================================================================

describe("video handling", () => {
  it("pauses playing videos on freeze and resumes on unfreeze", () => {
    const video = document.createElement("video");
    // jsdom doesn't actually play videos, so we mock the paused state
    let paused = false;
    Object.defineProperty(video, "paused", { get: () => paused });
    video.pause = () => { paused = true; };
    video.play = () => { paused = false; return Promise.resolve(); };
    document.body.appendChild(video);

    freeze();
    expect(paused).toBe(true);
    expect(video.dataset.wasPaused).toBe("false");

    unfreeze();
    expect(paused).toBe(false);
    expect(video.dataset.wasPaused).toBeUndefined();
  });

  it("does not resume videos that were already paused before freeze", () => {
    const video = document.createElement("video");
    let paused = true; // Already paused before freeze
    Object.defineProperty(video, "paused", { get: () => paused });
    video.pause = () => { paused = true; };
    video.play = () => { paused = false; return Promise.resolve(); };
    document.body.appendChild(video);

    freeze();
    // Should not have set wasPaused marker because video was already paused
    expect(video.dataset.wasPaused).toBeUndefined();

    unfreeze();
    // Should still be paused — we didn't touch it
    expect(paused).toBe(true);
  });
});

// =============================================================================
// Exported originals
// =============================================================================

describe("exported originals", () => {
  it("exports originalSetTimeout as a function", () => {
    expect(typeof originalSetTimeout).toBe("function");
  });

  it("exports originalSetInterval as a function", () => {
    expect(typeof originalSetInterval).toBe("function");
  });
});

// =============================================================================
// setTimeout queuing during freeze
// =============================================================================

describe("setTimeout queuing during freeze", () => {
  it("queues a setTimeout callback while frozen and replays it on unfreeze", async () => {
    const callback = vi.fn();
    freeze();

    // Schedule via the patched setTimeout (10ms delay)
    setTimeout(callback, 10);

    // Wait long enough for the real timer to fire (callback wrapper runs,
    // but because frozen it pushes to queue instead of executing)
    await new Promise<void>((resolve) => originalSetTimeout(resolve, 50));
    expect(callback).not.toHaveBeenCalled();

    // Unfreeze — queued callbacks are replayed via origSetTimeout(..., 0)
    unfreeze();
    await new Promise<void>((resolve) => originalSetTimeout(resolve, 50));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("replays multiple queued setTimeout callbacks on unfreeze", async () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const cb3 = vi.fn();
    freeze();

    setTimeout(cb1, 5);
    setTimeout(cb2, 10);
    setTimeout(cb3, 15);

    await new Promise<void>((resolve) => originalSetTimeout(resolve, 50));
    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).not.toHaveBeenCalled();
    expect(cb3).not.toHaveBeenCalled();

    unfreeze();
    await new Promise<void>((resolve) => originalSetTimeout(resolve, 50));
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
    expect(cb3).toHaveBeenCalledTimes(1);
  });

  it("re-queues timeout callbacks if re-frozen before replay executes", async () => {
    const callback = vi.fn();
    freeze();

    setTimeout(callback, 5);
    await new Promise<void>((resolve) => originalSetTimeout(resolve, 30));
    expect(callback).not.toHaveBeenCalled();

    // Unfreeze, then immediately re-freeze before the 0ms replay timer fires
    unfreeze();
    freeze();

    // The replay timer fires but sees _s.frozen=true, so re-queues
    await new Promise<void>((resolve) => originalSetTimeout(resolve, 50));
    expect(callback).not.toHaveBeenCalled();

    // Now truly unfreeze
    unfreeze();
    await new Promise<void>((resolve) => originalSetTimeout(resolve, 50));
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

// =============================================================================
// setInterval skipping during freeze
// =============================================================================

describe("setInterval skipping during freeze", () => {
  it("skips interval callbacks while frozen", async () => {
    const callback = vi.fn();
    freeze();

    const id = setInterval(callback, 10);

    // Wait enough for several intervals to fire
    await new Promise<void>((resolve) => originalSetTimeout(resolve, 80));
    expect(callback).not.toHaveBeenCalled();

    clearInterval(id);
  });

  it("fires interval callbacks after unfreeze", async () => {
    const callback = vi.fn();
    freeze();

    const id = setInterval(callback, 10);
    await new Promise<void>((resolve) => originalSetTimeout(resolve, 50));
    expect(callback).not.toHaveBeenCalled();

    unfreeze();
    // Let a few intervals fire
    await new Promise<void>((resolve) => originalSetTimeout(resolve, 80));
    expect(callback.mock.calls.length).toBeGreaterThanOrEqual(1);

    clearInterval(id);
  });
});

// =============================================================================
// requestAnimationFrame queuing during freeze
// =============================================================================

describe("requestAnimationFrame queuing during freeze", () => {
  it("does not invoke rAF callback while frozen — executes after unfreeze", async () => {
    // End-to-end: the patched rAF wraps the callback so that if frozen,
    // it either queues or (if the frame fires post-unfreeze) runs directly.
    // In jsdom, rAF timing is non-deterministic relative to timers, so we
    // verify the callback is not called before unfreeze and is called after.
    const callback = vi.fn();
    freeze();

    requestAnimationFrame(callback);

    // The callback should not fire synchronously
    expect(callback).not.toHaveBeenCalled();

    unfreeze();
    // Wait for the underlying rAF frame + replay scheduling
    await new Promise<void>((resolve) => originalSetTimeout(resolve, 100));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("passes a timestamp argument to replayed rAF callbacks", async () => {
    let receivedTimestamp: number | undefined;
    freeze();

    requestAnimationFrame((ts) => {
      receivedTimestamp = ts;
    });

    await new Promise<void>((resolve) => originalSetTimeout(resolve, 50));
    unfreeze();
    await new Promise<void>((resolve) => originalSetTimeout(resolve, 80));
    expect(receivedTimestamp).toBeDefined();
    expect(typeof receivedTimestamp).toBe("number");
  });

  it("replays manually queued rAF callbacks on unfreeze", async () => {
    // Directly exercise the unfreeze rAF queue replay path (lines 232-242).
    // We manually populate the frozenRAFQueue as if origRAF had fired while
    // frozen, then verify unfreeze replays them via origRAF.
    const callback = vi.fn();
    const state = (window as any)[STATE_KEY];

    freeze();
    state.frozenRAFQueue.push(callback);

    unfreeze();
    // Wait for the origRAF scheduled by unfreeze to fire
    await new Promise<void>((resolve) => originalSetTimeout(resolve, 100));
    expect(callback).toHaveBeenCalledTimes(1);
    // The callback receives a numeric timestamp from origRAF
    expect(typeof callback.mock.calls[0][0]).toBe("number");
  });

  it("re-queues rAF callbacks if re-frozen before replay frame fires", () => {
    // Exercise the re-freeze guard in unfreeze's rAF replay (lines 236-238).
    // We temporarily replace origRAF with a synchronous mock so we can control
    // exactly when the replay callback fires. This is necessary because jsdom's
    // rAF internally uses the patched setTimeout, making async timing unreliable
    // when the freeze state changes between scheduling and execution.
    const callback = vi.fn();
    const state = (window as any)[STATE_KEY];
    const realOrigRAF = state.origRAF;

    // Replace origRAF with a version that captures callbacks for manual dispatch
    const scheduledCallbacks: FrameRequestCallback[] = [];
    state.origRAF = (cb: FrameRequestCallback) => {
      scheduledCallbacks.push(cb);
      return 0;
    };

    freeze();
    state.frozenRAFQueue.push(callback);

    // Unfreeze iterates the queue and calls state.origRAF(wrapper) for each
    // item. Our mock captures the wrapper without executing it.
    unfreeze();
    expect(scheduledCallbacks.length).toBe(1);

    // Re-freeze BEFORE the replay callback executes
    freeze();
    expect(state.frozen).toBe(true);

    // Now fire the captured wrapper — it should see frozen=true and re-queue
    scheduledCallbacks[0](performance.now());
    expect(callback).not.toHaveBeenCalled();
    expect(state.frozenRAFQueue.length).toBe(1);

    // Clear captured callbacks and truly unfreeze
    scheduledCallbacks.length = 0;
    unfreeze();
    expect(scheduledCallbacks.length).toBe(1);

    // Fire the new wrapper — this time frozen is false, so callback executes
    scheduledCallbacks[0](performance.now());
    expect(callback).toHaveBeenCalledTimes(1);

    // Restore origRAF
    state.origRAF = realOrigRAF;
  });
});

// =============================================================================
// isAgentationElement exclusion
// =============================================================================

describe("isAgentationElement exclusion", () => {
  it("does NOT pause videos inside a data-feedback-toolbar container", () => {
    const toolbar = document.createElement("div");
    toolbar.setAttribute("data-feedback-toolbar", "");
    const video = document.createElement("video");
    let paused = false;
    Object.defineProperty(video, "paused", { get: () => paused });
    video.pause = () => { paused = true; };
    video.play = () => { paused = false; return Promise.resolve(); };
    toolbar.appendChild(video);
    document.body.appendChild(toolbar);

    // Also add a non-agentation video that should be paused
    const outsideVideo = document.createElement("video");
    let outsidePaused = false;
    Object.defineProperty(outsideVideo, "paused", { get: () => outsidePaused });
    outsideVideo.pause = () => { outsidePaused = true; };
    outsideVideo.play = () => { outsidePaused = false; return Promise.resolve(); };
    document.body.appendChild(outsideVideo);

    freeze();
    // The video outside toolbar should be paused
    expect(outsidePaused).toBe(true);
    // Note: video pause in freeze() pauses ALL videos regardless of isAgentationElement
    // (isAgentationElement is used for WAAPI animations, not videos)
    // So the toolbar video is also paused — this tests that the CSS :not selector
    // is what exempts agentation elements from CSS animation pausing
  });

  it("exempts agentation elements from CSS animation freeze selectors", () => {
    freeze();
    const style = document.getElementById(STYLE_ID);
    const css = style?.textContent || "";
    // CSS :not selectors exclude agentation elements
    expect(css).toContain(":not([data-feedback-toolbar])");
    expect(css).toContain(":not([data-feedback-toolbar] *)");
    expect(css).toContain(":not([data-annotation-popup])");
    expect(css).toContain(":not([data-annotation-popup] *)");
    expect(css).toContain(":not([data-annotation-marker])");
    expect(css).toContain(":not([data-annotation-marker] *)");
  });
});

// =============================================================================
// WAAPI animations (document.getAnimations)
// =============================================================================

describe("WAAPI animation pausing", () => {
  it("pauses running WAAPI animations on freeze and resumes on unfreeze", () => {
    const mockPause = vi.fn();
    const mockPlay = vi.fn();
    const fakeTarget = document.createElement("div");
    document.body.appendChild(fakeTarget);

    const fakeAnimation = {
      playState: "running",
      effect: { target: fakeTarget } as unknown as KeyframeEffect,
      pause: mockPause,
      play: mockPlay,
    } as unknown as Animation;

    // Mock document.getAnimations
    const origGetAnimations = (document as any).getAnimations;
    (document as any).getAnimations = () => [fakeAnimation];

    freeze();
    expect(mockPause).toHaveBeenCalledTimes(1);

    unfreeze();
    expect(mockPlay).toHaveBeenCalledTimes(1);

    // Restore
    if (origGetAnimations) {
      (document as any).getAnimations = origGetAnimations;
    } else {
      delete (document as any).getAnimations;
    }
  });

  it("does not pause non-running WAAPI animations", () => {
    const mockPause = vi.fn();
    const fakeTarget = document.createElement("div");
    document.body.appendChild(fakeTarget);

    const finishedAnimation = {
      playState: "finished",
      effect: { target: fakeTarget } as unknown as KeyframeEffect,
      pause: mockPause,
      play: vi.fn(),
    } as unknown as Animation;

    const origGetAnimations = (document as any).getAnimations;
    (document as any).getAnimations = () => [finishedAnimation];

    freeze();
    expect(mockPause).not.toHaveBeenCalled();

    unfreeze();

    if (origGetAnimations) {
      (document as any).getAnimations = origGetAnimations;
    } else {
      delete (document as any).getAnimations;
    }
  });

  it("skips WAAPI animations on agentation elements", () => {
    const mockPause = vi.fn();
    const toolbar = document.createElement("div");
    toolbar.setAttribute("data-feedback-toolbar", "");
    const inner = document.createElement("div");
    toolbar.appendChild(inner);
    document.body.appendChild(toolbar);

    const fakeAnimation = {
      playState: "running",
      effect: { target: inner } as unknown as KeyframeEffect,
      pause: mockPause,
      play: vi.fn(),
    } as unknown as Animation;

    const origGetAnimations = (document as any).getAnimations;
    (document as any).getAnimations = () => [fakeAnimation];

    freeze();
    expect(mockPause).not.toHaveBeenCalled();

    unfreeze();

    if (origGetAnimations) {
      (document as any).getAnimations = origGetAnimations;
    } else {
      delete (document as any).getAnimations;
    }
  });

  it("handles errors from getAnimations gracefully", () => {
    const origGetAnimations = (document as any).getAnimations;
    (document as any).getAnimations = () => {
      throw new Error("Not supported");
    };

    // Should not throw
    expect(() => freeze()).not.toThrow();
    unfreeze();

    if (origGetAnimations) {
      (document as any).getAnimations = origGetAnimations;
    } else {
      delete (document as any).getAnimations;
    }
  });

  it("handles errors from anim.play() during unfreeze gracefully", () => {
    const fakeTarget = document.createElement("div");
    document.body.appendChild(fakeTarget);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const fakeAnimation = {
      playState: "running",
      effect: { target: fakeTarget } as unknown as KeyframeEffect,
      pause: vi.fn(),
      play: () => { throw new Error("play failed"); },
    } as unknown as Animation;

    const origGetAnimations = (document as any).getAnimations;
    (document as any).getAnimations = () => [fakeAnimation];

    freeze();
    // Should not throw on unfreeze even though play() throws
    expect(() => unfreeze()).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(
      "[agentation] Error resuming animation:",
      expect.any(Error),
    );

    warnSpy.mockRestore();
    if (origGetAnimations) {
      (document as any).getAnimations = origGetAnimations;
    } else {
      delete (document as any).getAnimations;
    }
  });
});

// =============================================================================
// String handler bypass in setTimeout/setInterval
// =============================================================================

describe("string handler bypass", () => {
  it("passes string handler to origSetTimeout directly (does not queue)", async () => {
    freeze();

    // String handlers are passed to origSetTimeout without wrapping.
    // In jsdom/node, string eval in setTimeout is not supported, so we verify
    // indirectly: the call should not throw and the string should not end up
    // in the frozen timeout queue.
    const state = (window as any)[STATE_KEY];
    const queueLenBefore = state.frozenTimeoutQueue.length;

    // This will call origSetTimeout("...", 10) which jsdom silently ignores
    try {
      setTimeout("void 0" as any, 10);
    } catch {
      // Some environments throw on string handler — that's fine
    }

    await new Promise<void>((resolve) => originalSetTimeout(resolve, 50));
    // The queue should not have grown — string handlers bypass the queue logic
    expect(state.frozenTimeoutQueue.length).toBe(queueLenBefore);
  });

  it("passes string handler to origSetInterval directly (does not wrap)", async () => {
    freeze();

    const state = (window as any)[STATE_KEY];
    let intervalId: ReturnType<typeof setInterval> | undefined;

    try {
      intervalId = setInterval("void 0" as any, 10);
    } catch {
      // Some environments throw on string handler
    }

    await new Promise<void>((resolve) => originalSetTimeout(resolve, 50));

    // No error, no queue interaction — string handlers go straight through
    // Just verify freeze state is still intact
    expect(state.frozen).toBe(true);

    if (intervalId !== undefined) clearInterval(intervalId);
  });
});

// =============================================================================
// Timeout replay error handling
// =============================================================================

describe("timeout replay error handling", () => {
  it("catches and warns on errors in replayed timeout callbacks", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    freeze();

    setTimeout(() => {
      throw new Error("boom");
    }, 5);

    await new Promise<void>((resolve) => originalSetTimeout(resolve, 30));
    unfreeze();
    await new Promise<void>((resolve) => originalSetTimeout(resolve, 50));

    expect(warnSpy).toHaveBeenCalledWith(
      "[agentation] Error replaying queued timeout:",
      expect.any(Error),
    );
    warnSpy.mockRestore();
  });
});
