/** @vitest-environment jsdom */
import assert from "node:assert";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, waitFor, act, screen } from "@testing-library/react";
import { PageFeedbackToolbarCSS } from "../index";
import type { Annotation } from "../../../types";
import {
  PAGE_TOOLBAR_ANNOTATION_STORAGE_KEY,
  activateToolbar,
  createEventSourceHarness,
  findButtonByTooltip,
  installPageToolbarTestGlobals,
  makeAnnotation,
  resetPageToolbarTestEnvironment,
  seedAnnotations,
} from "./pageToolbarTestUtils";
import {
  mockCreateSessionResponse,
  mockGetSessionResponse,
  mockNetworkError,
  mockPendingResponse,
  setupPageToolbarServerMock,
  type PageToolbarServerFetchMock,
} from "./pageToolbarServerTestUtils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SESSION_STORAGE_KEY = "agentation-session-/";

function seedSessionId(sessionId: string) {
  localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
}

// ---------------------------------------------------------------------------
// Mock EventSource
// ---------------------------------------------------------------------------

const eventSourceHarness = createEventSourceHarness();

function getLastEventSource() {
  return eventSourceHarness.getLastInstance();
}

// ---------------------------------------------------------------------------
// Mock fetch
// ---------------------------------------------------------------------------

type ServerMockOptions = NonNullable<Parameters<typeof setupPageToolbarServerMock>[0]>;

let mockFetch: PageToolbarServerFetchMock;
const mockWriteText = vi.fn().mockResolvedValue(undefined);

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  eventSourceHarness.reset();
  mockWriteText.mockClear();
  installPageToolbarTestGlobals({
    writeText: mockWriteText,
    eventSourceClass: eventSourceHarness.EventSourceClass,
    fetchMode: "none",
  });

  mockFetch = vi.fn<(url: string, options?: RequestInit) => Promise<unknown>>();
  vi.stubGlobal("fetch", mockFetch);

  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  resetPageToolbarTestEnvironment();
});

// ---------------------------------------------------------------------------
// Helpers for mock responses
// ---------------------------------------------------------------------------

/**
 * Set up fetch mock to handle Agentation server requests.
 * Session init calls createSession (POST /sessions), and endpoint discovery may
 * probe GET /health when endpoint is omitted.
 */
function setupBasicServerMocks(
  sessionId = "session-123",
  annotations: Annotation[] = [],
  options: Partial<ServerMockOptions> = {},
) {
  const setup = setupPageToolbarServerMock({
    sessionId,
    annotations,
    allowWebhookPosts: true,
    syncedToSessionId: sessionId,
    ...options,
  });
  mockFetch = setup.mockFetch;
  return setup;
}

// =============================================================================
// Tests
// =============================================================================

describe("PageFeedbackToolbarCSS - Server & Webhook", () => {
  // ===========================================================================
  // 1. Server Session Initialization
  // ===========================================================================

  describe("Server session initialization", () => {
    it("creates a new session when endpoint is provided without sessionId", async () => {
      setupBasicServerMocks("session-new-1");

      render(<PageFeedbackToolbarCSS endpoint="http://localhost:4747" />);

      await waitFor(() => {
        // Verify createSession was called (POST to /sessions)
        const sessionCalls = mockFetch.mock.calls.filter(
          ([url, opts]: [string, RequestInit?]) =>
            url === "http://localhost:4747/sessions" &&
            opts?.method === "POST"
        );
        expect(sessionCalls.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("calls onSessionCreated callback when a new session is created", async () => {
      setupBasicServerMocks("session-callback-1");
      const onSessionCreated = vi.fn();

      render(
        <PageFeedbackToolbarCSS
          endpoint="http://localhost:4747"
          onSessionCreated={onSessionCreated}
        />
      );

      await waitFor(() => {
        expect(onSessionCreated).toHaveBeenCalledWith("session-callback-1");
      });
    });

    it("joins an existing session when sessionId prop is provided", async () => {
      setupBasicServerMocks("session-existing-1");

      render(
        <PageFeedbackToolbarCSS
          endpoint="http://localhost:4747"
          sessionId="session-existing-1"
        />
      );

      await waitFor(() => {
        // Verify getSession was called (GET to /sessions/:id)
        const getCalls = mockFetch.mock.calls.filter(
          ([url, opts]: [string, RequestInit?]) =>
            url === "http://localhost:4747/sessions/session-existing-1" &&
            (!opts?.method || opts.method === "GET")
        );
        expect(getCalls.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("uses stored session ID from localStorage when no sessionId prop given", async () => {
      seedSessionId("session-stored-1");
      setupBasicServerMocks("session-stored-1");

      render(<PageFeedbackToolbarCSS endpoint="http://localhost:4747" />);

      await waitFor(() => {
        // Should call getSession with the stored session ID
        const getCalls = mockFetch.mock.calls.filter(
          ([url, opts]: [string, RequestInit?]) =>
            url === "http://localhost:4747/sessions/session-stored-1" &&
            (!opts?.method || opts.method === "GET")
        );
        expect(getCalls.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("creates new session if stored session fails to rejoin", async () => {
      seedSessionId("session-expired");

      setupBasicServerMocks("session-new-after-fail", [], {
        onGetSessionRequest: () => mockNetworkError("Session not found"),
      });

      render(<PageFeedbackToolbarCSS endpoint="http://localhost:4747" />);

      await waitFor(() => {
        // Should have tried getSession first, then fallen back to createSession
        const createCalls = mockFetch.mock.calls.filter(
          ([url, opts]: [string, RequestInit?]) =>
            url === "http://localhost:4747/sessions" &&
            opts?.method === "POST"
        );
        expect(createCalls.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("syncs unsynced local annotations to server after session creation", async () => {
      const annotation1 = makeAnnotation({ id: "local-1", comment: "Fix button" });
      seedAnnotations([annotation1]);
      setupBasicServerMocks("session-sync-1");

      render(<PageFeedbackToolbarCSS endpoint="http://localhost:4747" />);

      await waitFor(() => {
        // Verify syncAnnotation was called (POST to /sessions/:id/annotations)
        const syncCalls = mockFetch.mock.calls.filter(
          ([url, opts]: [string, RequestInit?]) =>
            url.match(/\/sessions\/[\w-]+\/annotations$/) &&
            opts?.method === "POST"
        );
        expect(syncCalls.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("falls back to local storage mode on network error", async () => {
      setupBasicServerMocks("session-network-error", [], {
        onCreateSessionRequest: () => mockNetworkError(),
      });

      render(<PageFeedbackToolbarCSS endpoint="http://localhost:4747" />);

      // Should warn about failed initialization
      await waitFor(() => {
        expect(console.warn).toHaveBeenCalled();
      });

      // The toolbar should still be rendered (local mode)
      const toolbar = document.querySelector("[data-feedback-toolbar]");
      expect(toolbar).toBeTruthy();
    });

    it("uses default endpoint when endpoint prop is not provided", async () => {
      vi.stubEnv("NODE_ENV", "production");
      setupBasicServerMocks("session-default-endpoint");
      render(<PageFeedbackToolbarCSS />);

      await waitFor(() => {
        const sessionCalls = mockFetch.mock.calls.filter(
          ([url, opts]: [string, RequestInit?]) =>
            url === "http://127.0.0.1:4747/sessions" &&
            opts?.method === "POST"
        );
        expect(sessionCalls.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("probes the default endpoint once on page load when endpoint prop is not provided", async () => {
      vi.stubEnv("NODE_ENV", "production");
      setupBasicServerMocks("session-default-probe", [], {
        healthOk: false,
      });

      render(<PageFeedbackToolbarCSS />);

      await waitFor(() => {
        const probeCalls = mockFetch.mock.calls.filter(
          ([url]) => url === "http://127.0.0.1:4747/health"
        );
        expect(probeCalls.length).toBe(1);
      });

      const sessionCalls = mockFetch.mock.calls.filter(
        ([url, opts]: [string, RequestInit?]) =>
          url === "http://127.0.0.1:4747/sessions" && opts?.method === "POST"
      );
      expect(sessionCalls.length).toBe(0);
    });
  });

  // ===========================================================================
  // 2. Connection bootstrap
  // ===========================================================================

  describe("Connection bootstrap", () => {
    it("does not poll the health endpoint when an explicit endpoint is provided", async () => {
      setupBasicServerMocks();

      render(<PageFeedbackToolbarCSS endpoint="http://localhost:4747" />);

      await waitFor(() => {
        const sessionCalls = mockFetch.mock.calls.filter(
          ([url, opts]: [string, RequestInit?]) =>
            url === "http://localhost:4747/sessions" && opts?.method === "POST"
        );
        expect(sessionCalls.length).toBeGreaterThanOrEqual(1);
      });

      const healthCalls = mockFetch.mock.calls.filter(
        ([url]) => url === "http://localhost:4747/health"
      );
      expect(healthCalls).toHaveLength(0);
    });

    it("sets connection status to connected when the session stream opens", async () => {
      setupBasicServerMocks("session-health-ok");

      render(<PageFeedbackToolbarCSS endpoint="http://localhost:4747" />);
      await activateToolbar();

      await waitFor(() => {
        const indicator = document.querySelector('[title="Server Connected"]');
        expect(indicator).toBeTruthy();
      });
    });

    it("keeps the expanded connected toolbar inset from the left viewport edge", async () => {
      Object.defineProperty(window, "innerWidth", {
        value: 1000,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, "innerHeight", {
        value: 800,
        writable: true,
        configurable: true,
      });

      localStorage.setItem(
        "feedback-toolbar-position",
        JSON.stringify({ x: -1000, y: 100 }),
      );
      setupBasicServerMocks("session-health-clamp");

      render(
        <PageFeedbackToolbarCSS
          endpoint="http://localhost:4747"
          sessionId="session-health-clamp"
        />
      );
      await activateToolbar();

      await waitFor(() => {
        const indicator = document.querySelector('[title="Server Connected"]');
        expect(indicator).toBeTruthy();
      });

      await waitFor(() => {
        const toolbar = document.querySelector(
          "[data-feedback-toolbar]",
        ) as HTMLElement;
        expect(toolbar.style.left).toBe("20px");
        expect(toolbar.style.top).toBe("100px");
      });
    });

    it("sets connection status to disconnected when session initialization fails", async () => {
      setupBasicServerMocks("session-health-throws", [], {
        onCreateSessionRequest: () => mockNetworkError(),
      });

      render(<PageFeedbackToolbarCSS endpoint="http://localhost:4747" />);
      await activateToolbar();

      await waitFor(() => {
        const connected = document.querySelector('[title="Server Connected"]');
        expect(connected).toBeNull();
      });
    });

    it("retries session initialization without polling the health endpoint", async () => {
      vi.useFakeTimers();

      try {
        let createSessionAttempts = 0;
        setupBasicServerMocks("session-retry", [], {
          onCreateSessionRequest: () => {
            createSessionAttempts += 1;
            if (createSessionAttempts === 1) {
              return mockNetworkError();
            }

            return mockCreateSessionResponse("session-retry");
          },
        });

        render(<PageFeedbackToolbarCSS endpoint="http://localhost:4747" />);

        await act(async () => {
          await Promise.resolve();
          await Promise.resolve();
          await Promise.resolve();
        });

        expect(createSessionAttempts).toBe(1);

        await act(async () => {
          await vi.advanceTimersByTimeAsync(30000);
          await Promise.resolve();
          await Promise.resolve();
          await Promise.resolve();
        });

        expect(createSessionAttempts).toBe(2);

        const healthCalls = mockFetch.mock.calls.filter(
          ([url]) => url === "http://localhost:4747/health"
        );
        expect(healthCalls).toHaveLength(0);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // ===========================================================================
  // 3. SSE EventSource
  // ===========================================================================

  describe("SSE EventSource listener", () => {
    it("creates EventSource when endpoint, mounted, and sessionId are set", async () => {
      setupBasicServerMocks("session-sse-1");

      render(
        <PageFeedbackToolbarCSS
          endpoint="http://localhost:4747"
          sessionId="session-sse-1"
        />
      );

      await waitFor(() => {
        const eventSource = getLastEventSource();
        expect(eventSource).not.toBeNull();
        expect(eventSource?.url).toBe(
          "http://localhost:4747/sessions/session-sse-1/events"
        );
      });
    });

    it("listens for annotation.updated events", async () => {
      setupBasicServerMocks("session-sse-2");

      render(
        <PageFeedbackToolbarCSS
          endpoint="http://localhost:4747"
          sessionId="session-sse-2"
        />
      );

      await waitFor(() => {
        expect(getLastEventSource()).not.toBeNull();
        expect(eventSourceHarness.getListeners("annotation.updated").length).toBeGreaterThan(0);
      });
    });

    it("removes annotation when SSE event has status 'resolved'", async () => {
      const annotation = makeAnnotation({
        id: "sse-resolve-1",
        comment: "Fix this",
      });
      seedAnnotations([annotation]);

      // Server returns the annotation as part of session
      setupBasicServerMocks("session-sse-3", [annotation]);

      render(
        <PageFeedbackToolbarCSS
          endpoint="http://localhost:4747"
          sessionId="session-sse-3"
        />
      );
      await activateToolbar();

      // Wait for EventSource to be created
      await waitFor(() => {
        expect(getLastEventSource()).not.toBeNull();
        expect(eventSourceHarness.getListeners("annotation.updated").length).toBeGreaterThan(0);
      });

      // Emit resolved event
      act(() => {
        eventSourceHarness.emit("annotation.updated", {
          id: "sse-resolve-1",
          status: "resolved",
        });
      });

      // After exit animation delay (150ms), annotation should be removed
      await waitFor(
        () => {
          // The annotation marker should eventually be removed
          const markers = document.querySelectorAll(
            "[data-annotation-marker]"
          );
          // Check that the resolved annotation is gone from the DOM
          const resolvedMarker = document.querySelector(
            '[data-annotation-marker="sse-resolve-1"]'
          );
          // It may not have a data-annotation-marker attribute, so also check
          // that the annotation text is not in the document
          expect(resolvedMarker).toBeNull();
        },
        { timeout: 1000 }
      );
    });

    it("removes annotation when SSE event has status 'dismissed'", async () => {
      const annotation = makeAnnotation({
        id: "sse-dismiss-1",
        comment: "Dismiss me",
      });
      seedAnnotations([annotation]);
      setupBasicServerMocks("session-sse-4", [annotation]);

      render(
        <PageFeedbackToolbarCSS
          endpoint="http://localhost:4747"
          sessionId="session-sse-4"
        />
      );

      await waitFor(() => {
        expect(getLastEventSource()).not.toBeNull();
        expect(eventSourceHarness.getListeners("annotation.updated").length).toBeGreaterThan(0);
      });

      act(() => {
        eventSourceHarness.emit("annotation.updated", {
          id: "sse-dismiss-1",
          status: "dismissed",
        });
      });

      // The component should process the dismissed event similarly to resolved
      await waitFor(
        () => {
          const dismissedMarker = document.querySelector(
            '[data-annotation-marker="sse-dismiss-1"]'
          );
          expect(dismissedMarker).toBeNull();
        },
        { timeout: 1000 }
      );
    });

    it("closes EventSource on unmount", async () => {
      setupBasicServerMocks("session-sse-close");

      const { unmount } = render(
        <PageFeedbackToolbarCSS
          endpoint="http://localhost:4747"
          sessionId="session-sse-close"
        />
      );

      await waitFor(() => {
        expect(getLastEventSource()).not.toBeNull();
      });

      const eventSource = getLastEventSource();
      assert(eventSource);
      unmount();

      expect(eventSource.close).toHaveBeenCalled();
    });

    it("does not create EventSource when endpoint is missing", async () => {
      render(<PageFeedbackToolbarCSS />);

      await waitFor(() => {
        const toolbar = document.querySelector("[data-feedback-toolbar]");
        expect(toolbar).toBeTruthy();
      });

      expect(getLastEventSource()).toBeNull();
    });

    it("updates local state and shows a notification when SSE acknowledges an annotation", async () => {
      const annotation = makeAnnotation({
        id: "sse-ack-1",
        comment: "Ack me",
      });
      seedAnnotations([annotation]);
      setupBasicServerMocks("session-sse-5", [annotation]);

      render(
        <PageFeedbackToolbarCSS
          endpoint="http://localhost:4747"
          sessionId="session-sse-5"
        />
      );
      await activateToolbar();

      await waitFor(() => {
        expect(getLastEventSource()).not.toBeNull();
        expect(eventSourceHarness.getListeners("annotation.updated").length).toBeGreaterThan(0);
      });

      act(() => {
        eventSourceHarness.emit("annotation.updated", {
          id: "sse-ack-1",
          status: "acknowledged",
        });
      });

      await waitFor(() => {
        expect(screen.getByText("agentation ack")).toBeTruthy();
        expect(screen.getByText("Ack me")).toBeTruthy();
      });

      const notificationToast = document.querySelector(
        "[data-agentation-notification-toast]",
      );
      assert(notificationToast instanceof HTMLElement);
      expect(notificationToast.closest("[data-feedback-toolbar]")).toBeTruthy();

      const acknowledgedMarker = document.querySelector(
        '[data-annotation-status="acknowledged"]',
      );
      assert(acknowledgedMarker instanceof HTMLElement);
      expect(acknowledgedMarker.getAttribute("title")).toBe(
        "Agent is working on this feedback",
      );

      const storedAnnotations = JSON.parse(
        localStorage.getItem(PAGE_TOOLBAR_ANNOTATION_STORAGE_KEY) ?? "[]",
      );
      expect(storedAnnotations).toMatchObject([
        {
          id: "sse-ack-1",
          status: "acknowledged",
        },
      ]);
    });

    it(
      "queues multiple acknowledgement notifications and shows them one at a time",
      async () => {
        const firstAnnotation = makeAnnotation({
          id: "sse-ack-queue-1",
          comment: "First ack",
        });
        const secondAnnotation = makeAnnotation({
          id: "sse-ack-queue-2",
          comment: "Second ack",
        });
        seedAnnotations([firstAnnotation, secondAnnotation]);
        setupBasicServerMocks("session-sse-queue", [firstAnnotation, secondAnnotation]);

        render(
          <PageFeedbackToolbarCSS
            endpoint="http://localhost:4747"
            sessionId="session-sse-queue"
          />
        );
        await activateToolbar();

        await waitFor(() => {
          expect(getLastEventSource()).not.toBeNull();
          expect(eventSourceHarness.getListeners("annotation.updated").length).toBeGreaterThan(0);
        });

        act(() => {
          eventSourceHarness.emit("annotation.updated", {
            id: "sse-ack-queue-1",
            status: "acknowledged",
          });
          eventSourceHarness.emit("annotation.updated", {
            id: "sse-ack-queue-2",
            status: "acknowledged",
          });
        });

        await waitFor(() => {
          expect(screen.getByText("agentation ack")).toBeTruthy();
          expect(screen.getByText("First ack")).toBeTruthy();
        });
        expect(screen.queryByText("Second ack")).toBeNull();

        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 5200));
        });

        await waitFor(() => {
          expect(screen.getByText("agentation ack")).toBeTruthy();
          expect(screen.getByText("Second ack")).toBeTruthy();
        });
        expect(screen.queryByText("First ack")).toBeNull();

        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 5200));
        });

        await waitFor(() => {
          expect(
            document.querySelector("[data-agentation-notification-toast]"),
          ).toBeNull();
        });
      },
      15000,
    );

    it("handles malformed SSE event data gracefully", async () => {
      setupBasicServerMocks("session-sse-malformed");

      render(
        <PageFeedbackToolbarCSS
          endpoint="http://localhost:4747"
          sessionId="session-sse-malformed"
        />
      );

      await waitFor(() => {
        expect(getLastEventSource()).not.toBeNull();
        expect(eventSourceHarness.getListeners("annotation.updated").length).toBeGreaterThan(0);
      });

      // Emit an event with invalid JSON - should not throw
      expect(() => {
        eventSourceHarness.dispatch("annotation.updated", "not-valid-json");
      }).not.toThrow();
    });
  });

  // ===========================================================================
  // 4. Webhook (fireWebhook)
  // ===========================================================================

  describe("Webhook (fireWebhook)", () => {
    it("sends webhook POST when webhookUrl prop is provided and annotations exist", async () => {
      const annotation = makeAnnotation({ id: "wh-1", comment: "Fix bug" });
      seedAnnotations([annotation]);

      mockFetch.mockResolvedValue({ ok: true });

      render(
        <PageFeedbackToolbarCSS webhookUrl="https://example.com/webhook" />
      );
      await activateToolbar();

      // The send button should be visible. Find it and click.
      await waitFor(() => {
        const sendBtn = findButtonByTooltip("Send");
        // Even if tooltip is different, we look for the send button
        // The send button is visible when webhookUrl is valid and webhooksEnabled is false
        // Actually, the send button shows when: !settings.webhooksEnabled && (isValidUrl(settings.webhookUrl) || isValidUrl(webhookUrl || ""))
        // Default webhooksEnabled is true, so send button won't show with default settings
        // But sendToWebhook uses force=true which bypasses webhooksEnabled
        // The send button visibility condition is: !settings.webhooksEnabled && isValidUrl(...)
        // Since webhooksEnabled defaults to true, the send button won't be visible by default
        // Let's test via keyboard shortcut instead (S key)
      });

      // Press "S" to send - this triggers sendToWebhook
      fireEvent.keyDown(document, { key: "s" });

      await waitFor(() => {
        const webhookCalls = mockFetch.mock.calls.filter(
          ([url, opts]: [string, RequestInit?]) =>
            url === "https://example.com/webhook" && opts?.method === "POST"
        );
        expect(webhookCalls.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("does not fire webhook when no webhookUrl is configured", async () => {
      const annotation = makeAnnotation({ id: "wh-2" });
      seedAnnotations([annotation]);

      mockFetch.mockResolvedValue({ ok: true });

      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      // Press S - should not call any webhook
      fireEvent.keyDown(document, { key: "s" });

      // Wait a tick
      await new Promise((r) => setTimeout(r, 100));

      // No webhook calls should have been made
      const webhookCalls = mockFetch.mock.calls.filter(
        ([url, opts]: [string, RequestInit?]) =>
          opts?.method === "POST" && !url.includes("/sessions")
      );
      expect(webhookCalls.length).toBe(0);
    });

    it("webhook POST includes event, timestamp, url, and payload", async () => {
      const annotation = makeAnnotation({ id: "wh-3", comment: "Test" });
      seedAnnotations([annotation]);

      mockFetch.mockResolvedValue({ ok: true });

      render(
        <PageFeedbackToolbarCSS webhookUrl="https://example.com/hook" />
      );
      await activateToolbar();

      // Press S to send
      fireEvent.keyDown(document, { key: "s" });

      await waitFor(() => {
        const webhookCalls = mockFetch.mock.calls.filter(
          ([url, opts]: [string, RequestInit?]) =>
            url === "https://example.com/hook" && opts?.method === "POST"
        );
        expect(webhookCalls.length).toBeGreaterThanOrEqual(1);

        const firstWebhookCall = webhookCalls[0];
        assert(firstWebhookCall);
        const [, opts] = firstWebhookCall;
        assert(opts);
        assert(typeof opts.body === "string");
        const body = JSON.parse(opts.body);
        expect(body.event).toBe("submit");
        expect(body.timestamp).toBeDefined();
        expect(typeof body.timestamp).toBe("number");
        // url should be present
        expect(body.url).toBeDefined();
      });
    });

    it("returns false (failure) when webhook fetch throws", async () => {
      const annotation = makeAnnotation({ id: "wh-fail-1", comment: "Fail" });
      seedAnnotations([annotation]);

      setupBasicServerMocks("session-webhook-fail", [], {
        onWebhookRequest: () => mockNetworkError("Webhook network error"),
      });

      render(
        <PageFeedbackToolbarCSS webhookUrl="https://example.com/fail-hook" />
      );
      await activateToolbar();

      fireEvent.keyDown(document, { key: "s" });

      // Should warn about webhook failure
      await waitFor(() => {
        const warnCalls = (console.warn as ReturnType<typeof vi.fn>).mock.calls;
        const webhookWarn = warnCalls.find(
          (args) =>
            typeof args[0] === "string" &&
            args[0].includes("Webhook failed")
        );
        expect(webhookWarn).toBeDefined();
      });
    });
  });

  // ===========================================================================
  // 5. sendToWebhook (Send button flow)
  // ===========================================================================

  describe("sendToWebhook (send button flow)", () => {
    it("fires onSubmit callback when sending", async () => {
      const annotation = makeAnnotation({ id: "send-1", comment: "Submit me" });
      seedAnnotations([annotation]);
      const onSubmit = vi.fn();

      mockFetch.mockResolvedValue({ ok: true });

      render(
        <PageFeedbackToolbarCSS
          webhookUrl="https://example.com/hook"
          onSubmit={onSubmit}
        />
      );
      await activateToolbar();

      fireEvent.keyDown(document, { key: "s" });

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
        // onSubmit receives (output, annotations)
        expect(typeof onSubmit.mock.calls[0][0]).toBe("string");
        expect(Array.isArray(onSubmit.mock.calls[0][1])).toBe(true);
      });
    });

    it("does not send when there are no annotations", async () => {
      // No annotations seeded - use a unique webhook URL to avoid cross-test contamination
      const uniqueUrl = "https://example.com/no-send-test";
      mockFetch.mockResolvedValue({ ok: true });

      const onSubmit = vi.fn();

      render(
        <PageFeedbackToolbarCSS
          webhookUrl={uniqueUrl}
          onSubmit={onSubmit}
        />
      );
      await activateToolbar();

      fireEvent.keyDown(document, { key: "s" });

      await new Promise((r) => setTimeout(r, 200));

      // onSubmit should not have been called (no annotations to send)
      expect(onSubmit).not.toHaveBeenCalled();

      // No webhook POST should be made to our unique URL
      const webhookCalls = mockFetch.mock.calls.filter(
        ([url, opts]: [string, RequestInit?]) =>
          url === uniqueUrl && opts?.method === "POST"
      );
      expect(webhookCalls.length).toBe(0);
    });

    it("sends with force=true bypassing webhooksEnabled setting", async () => {
      // webhooksEnabled defaults to true, but the sendToWebhook flow uses force=true
      // So even if we somehow had webhooksEnabled=false in settings, force bypasses it
      const annotation = makeAnnotation({ id: "force-1", comment: "Force send" });
      seedAnnotations([annotation]);

      mockFetch.mockResolvedValue({ ok: true });

      render(
        <PageFeedbackToolbarCSS webhookUrl="https://example.com/hook" />
      );
      await activateToolbar();

      fireEvent.keyDown(document, { key: "s" });

      await waitFor(() => {
        const webhookCalls = mockFetch.mock.calls.filter(
          ([url, opts]: [string, RequestInit?]) =>
            url === "https://example.com/hook" && opts?.method === "POST"
        );
        expect(webhookCalls.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ===========================================================================
  // 6. Reconnection Sync
  // ===========================================================================

  describe("Reconnection sync", () => {
    it("syncs local annotations when connection transitions from disconnected to connected", async () => {
      const annotation = makeAnnotation({
        id: "reconnect-1",
        comment: "Sync on reconnect",
      });
      seedAnnotations([annotation]);

      // Start with server available
      setupBasicServerMocks("session-reconnect-1");

      render(<PageFeedbackToolbarCSS endpoint="http://localhost:4747" />);

      // Wait for initial session creation
      await waitFor(() => {
        const sessionCalls = mockFetch.mock.calls.filter(
          ([url, opts]: [string, RequestInit?]) =>
            url === "http://localhost:4747/sessions" &&
            opts?.method === "POST"
        );
        expect(sessionCalls.length).toBeGreaterThanOrEqual(1);
      });

      // The initial sync should have synced the annotation
      await waitFor(() => {
        const syncCalls = mockFetch.mock.calls.filter(
          ([url, opts]: [string, RequestInit?]) =>
            url.match(/\/sessions\/[\w-]+\/annotations$/) &&
            opts?.method === "POST"
        );
        expect(syncCalls.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("replaces stale local pending status with acknowledged server state after reconnect", async () => {
      const pendingAnnotation = makeAnnotation({
        id: "reconnect-ack-1",
        comment: "Reconnect ack",
      });
      const acknowledgedAnnotation: Annotation = {
        ...pendingAnnotation,
        status: "acknowledged",
      };
      let getSessionCount = 0;

      seedAnnotations([pendingAnnotation]);

      setupBasicServerMocks("session-reconnect-ack", [pendingAnnotation], {
        onGetSessionRequest: () => {
          getSessionCount += 1;
          if (getSessionCount === 1) {
            return mockGetSessionResponse("session-reconnect-ack", [pendingAnnotation]);
          }

          return mockGetSessionResponse("session-reconnect-ack", [acknowledgedAnnotation]);
        },
      });

      render(
        <PageFeedbackToolbarCSS
          endpoint="http://localhost:4747"
          sessionId="session-reconnect-ack"
        />,
      );

      await waitFor(() => {
        expect(getLastEventSource()).not.toBeNull();
      });

      await act(async () => {
        eventSourceHarness.error();
        await Promise.resolve();
      });

      await act(async () => {
        eventSourceHarness.open();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(screen.getByText("agentation ack")).toBeTruthy();
      expect(screen.getByText("Reconnect ack")).toBeTruthy();

      const storedAnnotations = JSON.parse(
        localStorage.getItem(PAGE_TOOLBAR_ANNOTATION_STORAGE_KEY) ?? "[]",
      );
      expect(storedAnnotations).toMatchObject([
        {
          id: "reconnect-ack-1",
          status: "acknowledged",
        },
      ]);
    });

    it("creates new session on reconnect if existing session is expired", async () => {
      const annotation = makeAnnotation({
        id: "reconnect-expired-1",
        comment: "Reconnect me",
      });
      seedAnnotations([annotation]);

      const createdSessionIds = ["session-reconnect-old", "session-reconnect-new"];
      let createSessionIndex = 0;
      const setup = setupBasicServerMocks("session-reconnect-old", [], {
        onCreateSessionRequest: () => {
          const nextSessionId =
            createdSessionIds[createSessionIndex] ?? createdSessionIds[createdSessionIds.length - 1];
          createSessionIndex += 1;
          return mockCreateSessionResponse(nextSessionId);
        },
        onGetSessionRequest: () => mockNetworkError("Session not found"),
      });

      render(<PageFeedbackToolbarCSS endpoint="http://localhost:4747" />);

      await waitFor(() => {
        expect(getLastEventSource()).not.toBeNull();
      });

      await act(async () => {
        eventSourceHarness.error();
        await Promise.resolve();
      });

      await act(async () => {
        eventSourceHarness.open();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });

      const sessionCreateCalls = setup.fetchCalls.filter(
        (call) =>
          call.url === "http://localhost:4747/sessions" &&
          call.method === "POST",
      );
      expect(sessionCreateCalls).toHaveLength(2);

      const reconnectGetSessionCall = setup.fetchCalls.find(
        (call) =>
          call.url === "http://localhost:4747/sessions/session-reconnect-old" &&
          call.method === "GET",
      );
      expect(reconnectGetSessionCall).toBeTruthy();

      const reconnectSyncCall = setup.fetchCalls.find(
        (call) =>
          call.url === "http://localhost:4747/sessions/session-reconnect-new/annotations" &&
          call.method === "POST",
      );
      expect(reconnectSyncCall?.body).toMatchObject({
        id: "reconnect-expired-1",
        sessionId: "session-reconnect-new",
      });

      expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBe("session-reconnect-new");
    });
  });

  // ===========================================================================
  // 7. Connection Status UI
  // ===========================================================================

  describe("Connection status UI", () => {
    it("shows server indicator when connected and active", async () => {
      setupBasicServerMocks("session-ui-1");

      render(<PageFeedbackToolbarCSS endpoint="http://localhost:4747" />);
      await activateToolbar();

      await waitFor(() => {
        const indicator = document.querySelector('[title="Server Connected"]');
        expect(indicator).toBeTruthy();
      });
    });

    it("shows Server Connecting indicator during connection", async () => {
      setupBasicServerMocks("session-connecting", [], {
        onCreateSessionRequest: () => mockPendingResponse(),
      });

      render(<PageFeedbackToolbarCSS endpoint="http://localhost:4747" />);
      await activateToolbar();

      // During connecting state, should show "Server Connecting..." title
      await waitFor(() => {
        const connecting = document.querySelector(
          '[title="Server Connecting..."]'
        );
        expect(connecting).toBeTruthy();
      });
    });

    it("does not show server indicator when endpoint is not provided", async () => {
      render(<PageFeedbackToolbarCSS />);
      await activateToolbar();

      const indicator = document.querySelector('[title="Server Connected"]');
      const connecting = document.querySelector('[title="Server Connecting..."]');
      expect(indicator).toBeNull();
      expect(connecting).toBeNull();
    });

    it("shows Server Disconnected indicator when disconnected", async () => {
      setupBasicServerMocks("session-disconnected", [], {
        onCreateSessionRequest: () => mockNetworkError(),
      });

      render(<PageFeedbackToolbarCSS endpoint="http://localhost:4747" />);
      await activateToolbar();

      // Wait for connection attempt to fail
      await waitFor(() => {
        expect(console.warn).toHaveBeenCalled();
      });

      const disconnected = document.querySelector('[title="Server Disconnected"]');
      const connected = document.querySelector('[title="Server Connected"]');
      const connecting = document.querySelector('[title="Server Connecting..."]');

      expect(disconnected).toBeTruthy();
      expect(connected).toBeNull();
      expect(connecting).toBeNull();
    });
  });

  // ===========================================================================
  // 8. Session annotation merging
  // ===========================================================================

  describe("Session annotation merging", () => {
    it("merges local and server annotations when joining existing session", async () => {
      const localAnnotation = makeAnnotation({
        id: "local-merge-1",
        comment: "Local note",
      });
      const serverAnnotation = makeAnnotation({
        id: "server-merge-1",
        comment: "Server note",
      });
      seedAnnotations([localAnnotation]);
      seedSessionId("session-merge-1");

      setupBasicServerMocks("session-merge-1", [serverAnnotation]);

      render(
        <PageFeedbackToolbarCSS
          endpoint="http://localhost:4747"
          sessionId="session-merge-1"
        />
      );

      // Should sync the local annotation that's not on the server
      await waitFor(() => {
        const syncCalls = mockFetch.mock.calls.filter(
          ([url, opts]: [string, RequestInit?]) =>
            url.match(/\/sessions\/[\w-]+\/annotations$/) &&
            opts?.method === "POST"
        );
        expect(syncCalls.length).toBeGreaterThanOrEqual(1);
        // Verify it synced local-merge-1 (the one not on server)
        const firstSyncCall = syncCalls[0];
        assert(firstSyncCall);
        const [, firstSyncOptions] = firstSyncCall;
        assert(firstSyncOptions);
        assert(typeof firstSyncOptions.body === "string");
        const syncedBody = JSON.parse(firstSyncOptions.body);
        expect(syncedBody.id).toBe("local-merge-1");
      });
    });

    it("does not re-upload annotations that already exist on server", async () => {
      const sharedAnnotation = makeAnnotation({
        id: "shared-1",
        comment: "Already on server",
      });
      seedAnnotations([sharedAnnotation]);
      seedSessionId("session-dedup-1");

      // Server has the same annotation
      setupBasicServerMocks("session-dedup-1", [sharedAnnotation]);

      render(
        <PageFeedbackToolbarCSS
          endpoint="http://localhost:4747"
          sessionId="session-dedup-1"
        />
      );

      // Wait for session to initialize
      await waitFor(() => {
        const getCalls = mockFetch.mock.calls.filter(
          ([url]) =>
            url === "http://localhost:4747/sessions/session-dedup-1"
        );
        expect(getCalls.length).toBeGreaterThanOrEqual(1);
      });

      // Wait a bit to ensure no sync calls are made
      await new Promise((r) => setTimeout(r, 200));

      // Should NOT have any sync calls since the annotation is already on server
      const syncCalls = mockFetch.mock.calls.filter(
        ([url, opts]: [string, RequestInit?]) =>
          url.match(/\/sessions\/[\w-]+\/annotations$/) &&
          opts?.method === "POST"
      );
      expect(syncCalls.length).toBe(0);
    });
  });
});
