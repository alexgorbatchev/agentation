/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  listSessions,
  createSession,
  getSession,
  syncAnnotation,
  updateAnnotation,
  deleteAnnotation,
  requestAction,
} from "../sync";
import type { Annotation } from "../../types";

const ENDPOINT = "https://api.example.com";

// We capture the real fetch calls and verify URL/method/body — the sync module's
// job is to build the right requests and interpret responses correctly.
let fetchSpy: ReturnType<typeof vi.fn>;

function mockFetchResponse(body: unknown, status = 200) {
  fetchSpy.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

function mockFetchError(status: number) {
  fetchSpy.mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve({}),
  });
}

beforeEach(() => {
  fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// =============================================================================
// listSessions
// =============================================================================

describe("listSessions", () => {
  it("calls GET /sessions and returns parsed array", async () => {
    const sessions = [{ id: "s1", url: "/", status: "active", createdAt: "2024-01-01" }];
    mockFetchResponse(sessions);
    const result = await listSessions(ENDPOINT);
    expect(fetchSpy).toHaveBeenCalledWith(`${ENDPOINT}/sessions`);
    expect(result).toEqual(sessions);
  });

  it("throws with status code on failure", async () => {
    mockFetchError(500);
    await expect(listSessions(ENDPOINT)).rejects.toThrow("500");
  });
});

// =============================================================================
// createSession
// =============================================================================

describe("createSession", () => {
  it("sends POST with url in body and returns session", async () => {
    const session = { id: "s1", url: "/page", status: "active", createdAt: "2024-01-01" };
    mockFetchResponse(session);
    const result = await createSession(ENDPOINT, "/page");

    expect(fetchSpy).toHaveBeenCalledWith(`${ENDPOINT}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "/page" }),
    });
    expect(result).toEqual(session);
  });

  it("includes projectId in body when provided", async () => {
    const session = {
      id: "s1",
      url: "/page",
      status: "active",
      createdAt: "2024-01-01",
      projectId: "project-alpha",
    };
    mockFetchResponse(session);

    await createSession(ENDPOINT, "/page", "project-alpha");

    expect(fetchSpy).toHaveBeenCalledWith(`${ENDPOINT}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "/page", projectId: "project-alpha" }),
    });
  });

  it("throws on 409 conflict", async () => {
    mockFetchError(409);
    await expect(createSession(ENDPOINT, "/page")).rejects.toThrow("409");
  });
});

// =============================================================================
// getSession
// =============================================================================

describe("getSession", () => {
  it("calls GET /sessions/:id and returns session with annotations", async () => {
    const sessionWithAnnotations = {
      id: "s1",
      url: "/",
      status: "active",
      createdAt: "2024-01-01",
      annotations: [],
    };
    mockFetchResponse(sessionWithAnnotations);
    const result = await getSession(ENDPOINT, "s1");
    expect(fetchSpy).toHaveBeenCalledWith(`${ENDPOINT}/sessions/s1`);
    expect(result).toEqual(sessionWithAnnotations);
    expect(result.annotations).toEqual([]);
  });

  it("throws on 404", async () => {
    mockFetchError(404);
    await expect(getSession(ENDPOINT, "nonexistent")).rejects.toThrow("404");
  });
});

// =============================================================================
// syncAnnotation
// =============================================================================

describe("syncAnnotation", () => {
  const annotation: Annotation = {
    id: "a1",
    x: 10,
    y: 20,
    comment: "fix this",
    element: "button",
    elementPath: "div > button",
    timestamp: Date.now(),
  };

  it("sends POST with annotation body to session endpoint", async () => {
    mockFetchResponse({ ...annotation, sessionId: "s1" });
    const result = await syncAnnotation(ENDPOINT, "s1", annotation);

    expect(fetchSpy).toHaveBeenCalledWith(
      `${ENDPOINT}/sessions/s1/annotations`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(annotation),
      }
    );
    expect(result.sessionId).toBe("s1");
  });

  it("throws on server error", async () => {
    mockFetchError(503);
    await expect(syncAnnotation(ENDPOINT, "s1", annotation)).rejects.toThrow("503");
  });
});

// =============================================================================
// updateAnnotation
// =============================================================================

describe("updateAnnotation", () => {
  it("sends PATCH with partial data to annotation endpoint", async () => {
    const update = { comment: "updated comment" };
    mockFetchResponse({ id: "a1", ...update });
    await updateAnnotation(ENDPOINT, "a1", update);

    expect(fetchSpy).toHaveBeenCalledWith(`${ENDPOINT}/annotations/a1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
  });

  it("throws on 403 forbidden", async () => {
    mockFetchError(403);
    await expect(updateAnnotation(ENDPOINT, "a1", {})).rejects.toThrow("403");
  });
});

// =============================================================================
// deleteAnnotation
// =============================================================================

describe("deleteAnnotation", () => {
  it("sends DELETE with no body", async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true, status: 204 });
    await deleteAnnotation(ENDPOINT, "a1");

    expect(fetchSpy).toHaveBeenCalledWith(`${ENDPOINT}/annotations/a1`, {
      method: "DELETE",
    });
    // Verify no body was sent
    const callArgs = fetchSpy.mock.calls[0][1];
    expect(callArgs.body).toBeUndefined();
  });

  it("throws on 404", async () => {
    mockFetchError(404);
    await expect(deleteAnnotation(ENDPOINT, "a1")).rejects.toThrow("404");
  });
});

// =============================================================================
// requestAction
// =============================================================================

describe("requestAction", () => {
  it("sends POST with output string and returns delivery info", async () => {
    const actionResponse = {
      success: true,
      annotationCount: 3,
      delivered: { sseListeners: 1, webhooks: 0, total: 1 },
    };
    mockFetchResponse(actionResponse);
    const result = await requestAction(ENDPOINT, "s1", "fix the button color");

    expect(fetchSpy).toHaveBeenCalledWith(`${ENDPOINT}/sessions/s1/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ output: "fix the button color" }),
    });
    expect(result.success).toBe(true);
    expect(result.delivered.total).toBe(1);
  });

  it("throws on server error with status code in message", async () => {
    mockFetchError(502);
    await expect(requestAction(ENDPOINT, "s1", "test")).rejects.toThrow("502");
  });
});
