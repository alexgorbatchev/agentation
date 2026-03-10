/**
 * Tests that verify agents can discover human thread replies.
 *
 * Problem: When a human replies to an annotation thread, the agent cannot see it because:
 * 1. The SSE watcher (agentation_watch_annotations) only listens for "annotation.created" events,
 *    ignoring "thread.message" events entirely.
 * 2. agentation_get_pending filters by status="pending", so once an annotation is acknowledged,
 *    the human's reply to the thread is invisible to the agent.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createServer, type Server as HttpServer } from "http";
import {
  createSession,
  addAnnotation,
  addThreadMessage,
  clearAll,
  getAnnotationsNeedingAttention,
} from "../server/store.js";
import { eventBus } from "../server/events.js";
import { handleTool, setHttpBaseUrl } from "../server/mcp.js";
import type { Annotation, AFSEvent } from "../types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let httpServer: HttpServer;
let baseUrl: string;

/**
 * Minimal HTTP server that serves just what the MCP tools need.
 * We re-use the real store + eventBus so that SSE events fire naturally.
 */
function startTestServer(): Promise<{ server: HttpServer; port: number }> {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const url = new URL(req.url || "/", "http://localhost");
      const pathname = url.pathname;
      const method = req.method || "GET";

      // CORS
      res.setHeader("Access-Control-Allow-Origin", "*");

      // Parse body helper
      const parseBody = (): Promise<Record<string, unknown>> =>
        new Promise((resolve) => {
          let body = "";
          req.on("data", (chunk: Buffer) => (body += chunk));
          req.on("end", () => resolve(body ? JSON.parse(body) : {}));
        });

      // GET /sessions/:id/pending
      const pendingMatch = pathname.match(/^\/sessions\/([^/]+)\/pending$/);
      if (method === "GET" && pendingMatch) {
        const pending = getAnnotationsNeedingAttention(pendingMatch[1]);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ count: pending.length, annotations: pending }));
        return;
      }

      // GET /pending (all pending)
      if (method === "GET" && pathname === "/pending") {
        const { listSessions } = await import("../server/store.js");
        const sessions = listSessions();
        const allPending = sessions.flatMap((s) => getAnnotationsNeedingAttention(s.id));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ count: allPending.length, annotations: allPending }));
        return;
      }

      // GET /sessions/:id/events (SSE)
      const eventsMatch = pathname.match(/^\/sessions\/([^/]+)\/events$/);
      if (method === "GET" && eventsMatch) {
        const sessionId = eventsMatch[1];
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });
        res.write(": connected\n\n");

        const unsubscribe = eventBus.subscribeToSession(sessionId, (event: AFSEvent) => {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        });

        req.on("close", () => unsubscribe());
        return;
      }

      // GET /events (global SSE)
      if (method === "GET" && pathname === "/events") {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });
        res.write(": connected\n\n");

        const unsubscribe = eventBus.subscribe((event: AFSEvent) => {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        });

        req.on("close", () => unsubscribe());
        return;
      }

      // PATCH /annotations/:id
      const patchMatch = pathname.match(/^\/annotations\/([^/]+)$/);
      if (method === "PATCH" && patchMatch) {
        const { updateAnnotation, getAnnotation } = await import("../server/store.js");
        const body = await parseBody();
        const annotation = updateAnnotation(patchMatch[1], body);
        if (!annotation) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Not found" }));
          return;
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(annotation));
        return;
      }

      // POST /annotations/:id/thread
      const threadMatch = pathname.match(/^\/annotations\/([^/]+)\/thread$/);
      if (method === "POST" && threadMatch) {
        const body = await parseBody();
        const annotation = addThreadMessage(
          threadMatch[1],
          body.role as "human" | "agent",
          body.content as string
        );
        if (!annotation) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Not found" }));
          return;
        }
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify(annotation));
        return;
      }

      // GET /sessions/:id
      const sessionMatch = pathname.match(/^\/sessions\/([^/]+)$/);
      if (method === "GET" && sessionMatch) {
        const { getSessionWithAnnotations } = await import("../server/store.js");
        const session = getSessionWithAnnotations(sessionMatch[1]);
        if (!session) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Not found" }));
          return;
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(session));
        return;
      }

      res.writeHead(404);
      res.end();
    });

    server.listen(0, () => {
      const addr = server.address() as { port: number };
      resolve({ server, port: addr.port });
    });
  });
}

/**
 * Parse the JSON content from a tool result.
 */
function parseResult(result: { content: Array<{ type: string; text: string }>; isError?: boolean }) {
  return JSON.parse(result.content[0].text);
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(async () => {
  // Force in-memory store
  process.env.AGENTATION_STORE = "memory";

  // Clear store state between tests
  clearAll();

  // Start test HTTP server
  const { server, port } = await startTestServer();
  httpServer = server;
  baseUrl = `http://localhost:${port}`;
  setHttpBaseUrl(baseUrl);
});

afterEach(async () => {
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  clearAll();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("agent visibility of human thread replies", () => {
  it("human reply to acknowledged annotation is visible via get_pending or a dedicated tool", async () => {
    // Setup: create a session and annotation
    const session = createSession("http://example.com");
    const annotation = addAnnotation(session.id, {
      x: 10,
      y: 20,
      comment: "Fix this button",
      element: "button",
      elementPath: "body > button",
      timestamp: Date.now(),
    })!;

    // Agent acknowledges the annotation
    await handleTool("agentation_acknowledge", { annotationId: annotation.id });

    // Human replies to the acknowledged annotation
    addThreadMessage(annotation.id, "human", "Actually, also fix the color");

    // The agent should be able to discover this reply.
    // Currently: get_pending only returns status="pending" annotations, so it misses this.
    // After fix: there should be a way for the agent to see annotations with unread human replies.
    const result = await handleTool("agentation_get_pending", { sessionId: session.id });
    const data = parseResult(result);

    // The annotation has an unread human reply - it should appear in the results
    // even though its status is "acknowledged" (not "pending")
    const hasAnnotationWithReply = data.annotations.some(
      (a: Annotation) => a.id === annotation.id
    );

    expect(hasAnnotationWithReply).toBe(true);
  });

  it("watch_annotations detects thread.message events from humans", { timeout: 15000 }, async () => {
    // Setup: create a session and an acknowledged annotation
    const session = createSession("http://example.com");
    const annotation = addAnnotation(session.id, {
      x: 10,
      y: 20,
      comment: "Fix this button",
      element: "button",
      elementPath: "body > button",
      timestamp: Date.now(),
    })!;

    // Acknowledge the annotation first
    await handleTool("agentation_acknowledge", { annotationId: annotation.id });

    // Start watching - use a short timeout so test doesn't hang
    const watchPromise = handleTool("agentation_watch_annotations", {
      sessionId: session.id,
      batchWindowSeconds: 1,
      timeoutSeconds: 3,
    });

    // Wait for SSE connection to establish
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Human replies to the thread
    addThreadMessage(annotation.id, "human", "Please also fix the hover state");

    // The watcher should pick up the thread.message event
    const result = await watchPromise;
    const data = parseResult(result);

    // Should NOT have timed out - should have detected the thread reply
    expect(data.timeout).not.toBe(true);
  });

  it("human reply to acknowledged annotation includes thread messages in response", async () => {
    // Setup: create session, annotation, acknowledge it, then human replies
    const session = createSession("http://example.com");
    const annotation = addAnnotation(session.id, {
      x: 10,
      y: 20,
      comment: "Fix this button",
      element: "button",
      elementPath: "body > button",
      timestamp: Date.now(),
    })!;

    await handleTool("agentation_acknowledge", { annotationId: annotation.id });
    addThreadMessage(annotation.id, "human", "Wait, also fix the color");

    // Agent should be able to see the annotation with thread via get_session
    const sessionResult = await handleTool("agentation_get_session", {
      sessionId: session.id,
    });
    const sessionData = parseResult(sessionResult);

    // The thread messages should be visible on the annotation
    const ann = sessionData.annotations.find((a: Annotation) => a.id === annotation.id);
    expect(ann).toBeDefined();
    expect(ann.thread).toBeDefined();
    expect(ann.thread.length).toBeGreaterThanOrEqual(1);
    expect(ann.thread.some((m: { role: string; content: string }) => m.role === "human")).toBe(true);
  });

  it("multiple human replies all surface to the agent", async () => {
    const session = createSession("http://example.com");
    const annotation = addAnnotation(session.id, {
      x: 10,
      y: 20,
      comment: "Fix this button",
      element: "button",
      elementPath: "body > button",
      timestamp: Date.now(),
    })!;

    // Agent acknowledges
    await handleTool("agentation_acknowledge", { annotationId: annotation.id });

    // Human sends multiple replies
    addThreadMessage(annotation.id, "human", "First follow-up");
    addThreadMessage(annotation.id, "human", "Second follow-up");

    // Agent should discover the annotation has unread replies
    const result = await handleTool("agentation_get_pending", { sessionId: session.id });
    const data = parseResult(result);

    const ann = data.annotations.find((a: Annotation) => a.id === annotation.id);
    expect(ann).toBeDefined();
  });

  it("agent reply does not re-surface annotation as needing attention", async () => {
    const session = createSession("http://example.com");
    const annotation = addAnnotation(session.id, {
      x: 10,
      y: 20,
      comment: "Fix this button",
      element: "button",
      elementPath: "body > button",
      timestamp: Date.now(),
    })!;

    // Agent acknowledges, then agent replies (not human)
    await handleTool("agentation_acknowledge", { annotationId: annotation.id });
    addThreadMessage(annotation.id, "agent", "Working on it");

    // Agent's own reply should NOT make this appear as needing attention
    const result = await handleTool("agentation_get_pending", { sessionId: session.id });
    const data = parseResult(result);

    const ann = data.annotations.find((a: Annotation) => a.id === annotation.id);
    expect(ann).toBeUndefined();
  });

  it("resolved annotation with human reply resurfaces for agent attention", async () => {
    const session = createSession("http://example.com");
    const annotation = addAnnotation(session.id, {
      x: 10,
      y: 20,
      comment: "Fix this button",
      element: "button",
      elementPath: "body > button",
      timestamp: Date.now(),
    })!;

    // Agent resolves the annotation
    await handleTool("agentation_resolve", {
      annotationId: annotation.id,
      summary: "Fixed the button",
    });

    // Human replies after resolution (disagreeing or adding context)
    addThreadMessage(annotation.id, "human", "This still doesn't look right");

    // The annotation should resurface for agent attention
    const result = await handleTool("agentation_get_pending", { sessionId: session.id });
    const data = parseResult(result);

    const ann = data.annotations.find((a: Annotation) => a.id === annotation.id);
    expect(ann).toBeDefined();
  });
});
