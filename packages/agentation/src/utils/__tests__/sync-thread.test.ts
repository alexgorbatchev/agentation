/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { postThreadReply } from "../sync";

const ENDPOINT = "https://api.example.com";

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
// postThreadReply
// =============================================================================

describe("postThreadReply", () => {
  it("sends POST with role and content to annotation thread endpoint", async () => {
    const updatedAnnotation = {
      id: "a1",
      thread: [{ id: "t1", role: "human", content: "my reply", timestamp: 123 }],
    };
    mockFetchResponse(updatedAnnotation);
    const result = await postThreadReply(ENDPOINT, "a1", "my reply");

    expect(fetchSpy).toHaveBeenCalledWith(`${ENDPOINT}/annotations/a1/thread`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "human", content: "my reply" }),
    });
    expect(result).toEqual(updatedAnnotation);
  });

  it("adds projectId query parameter when provided", async () => {
    mockFetchResponse({ id: "a1", thread: [] });

    await postThreadReply(ENDPOINT, "a1", "my reply", "project-alpha");

    expect(fetchSpy).toHaveBeenCalledWith(`${ENDPOINT}/annotations/a1/thread?projectId=project-alpha`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "human", content: "my reply" }),
    });
  });

  it("always sends role as 'human'", async () => {
    mockFetchResponse({ id: "a1", thread: [] });
    await postThreadReply(ENDPOINT, "a1", "test");

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.role).toBe("human");
  });

  it("returns the full annotation from server response", async () => {
    const fullAnnotation = {
      id: "a1",
      comment: "original",
      thread: [
        { id: "t1", role: "agent", content: "hello", timestamp: 100 },
        { id: "t2", role: "human", content: "hi back", timestamp: 200 },
      ],
    };
    mockFetchResponse(fullAnnotation);
    const result = await postThreadReply(ENDPOINT, "a1", "hi back");
    expect(result.thread).toHaveLength(2);
  });

  it("throws with status code on server error", async () => {
    mockFetchError(500);
    await expect(postThreadReply(ENDPOINT, "a1", "test")).rejects.toThrow("500");
  });

  it("throws on 404 when annotation not found", async () => {
    mockFetchError(404);
    await expect(postThreadReply(ENDPOINT, "nonexistent", "test")).rejects.toThrow("404");
  });
});
