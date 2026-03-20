import { vi, type Mock } from "vitest";

import type { Annotation } from "../../../types";

export type PageToolbarServerFetchCall = {
  url: string;
  method: string;
  body: unknown;
};

type JsonRecord = Record<string, unknown>;

type MockJsonResponse<T> = {
  ok: boolean;
  status?: number;
  json: () => Promise<T>;
};

type EventSourceConstructor = new (url: string) => unknown;

type SetupPageToolbarServerMockOptions = {
  annotations?: Annotation[];
  sessionId?: string;
  eventSourceClass?: EventSourceConstructor;
  includeThreadReplies?: boolean;
  healthOk?: boolean;
  healthResponses?: boolean[];
  allowWebhookPosts?: boolean;
  syncIdPrefix?: string;
  syncedToSessionId?: string;
};

export type PageToolbarServerFetchMock = Mock<
  (url: string, init?: RequestInit) => Promise<unknown>
>;

type SetupPageToolbarServerMockResult = {
  mockFetch: PageToolbarServerFetchMock;
  fetchCalls: PageToolbarServerFetchCall[];
};

type SessionPayload = {
  id: string;
  url: string;
  status: "active";
  createdAt: string;
  annotations: Annotation[];
};

type ThreadReplyBody = {
  role?: string;
  content?: string;
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function parseRequestBody(body: BodyInit | null | undefined): unknown {
  if (typeof body !== "string") {
    return undefined;
  }

  const parsed: unknown = JSON.parse(body);
  return parsed;
}

function buildSessionPayload(sessionId: string, annotations: Annotation[] = []): SessionPayload {
  return {
    id: sessionId,
    url: "http://localhost:3000/",
    status: "active",
    createdAt: new Date().toISOString(),
    annotations,
  };
}

export function mockCreateSessionResponse(
  sessionId: string,
  annotations: Annotation[] = [],
): MockJsonResponse<SessionPayload> {
  return {
    ok: true,
    json: async () => buildSessionPayload(sessionId, annotations),
  };
}

export function mockGetSessionResponse(
  sessionId: string,
  annotations: Annotation[] = [],
): MockJsonResponse<SessionPayload> {
  return {
    ok: true,
    json: async () => buildSessionPayload(sessionId, annotations),
  };
}

export function mockHealthResponse(ok = true): { ok: boolean } {
  return { ok };
}

export function mockSyncAnnotationResponse(
  annotation: Annotation,
  syncedToSessionId?: string,
): MockJsonResponse<Annotation & { _syncedTo?: string }> {
  return {
    ok: true,
    json: async () => ({
      ...annotation,
      ...(syncedToSessionId ? { _syncedTo: syncedToSessionId } : {}),
    }),
  };
}

export function mockFailedResponse(
  status = 500,
): MockJsonResponse<{ error: string }> {
  return {
    ok: false,
    status,
    json: async () => ({ error: "Server error" }),
  };
}

export function mockNetworkError(): Promise<never> {
  return Promise.reject(new Error("Network error"));
}

export function setupPageToolbarServerMock({
  annotations = [],
  sessionId = "session-1",
  eventSourceClass,
  includeThreadReplies = false,
  healthOk = true,
  healthResponses,
  allowWebhookPosts = false,
  syncIdPrefix = "server-sync-",
  syncedToSessionId,
}: SetupPageToolbarServerMockOptions = {}): SetupPageToolbarServerMockResult {
  const fetchCalls: PageToolbarServerFetchCall[] = [];
  let syncIdCounter = 0;
  let healthResponseIndex = 0;

  const mockFetch: PageToolbarServerFetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const body = parseRequestBody(init?.body);
    fetchCalls.push({ url, method, body });

    if (url.includes("/health")) {
      const healthStatus = healthResponses?.[healthResponseIndex] ?? healthOk;
      healthResponseIndex += 1;
      return mockHealthResponse(healthStatus);
    }

    if (url.match(/\/sessions\/[\w-]+$/) && method === "GET") {
      return mockGetSessionResponse(sessionId, annotations);
    }

    if (url.endsWith("/sessions") && method === "POST") {
      return mockCreateSessionResponse(sessionId, annotations);
    }

    if (includeThreadReplies && url.match(/\/annotations\/[^/]+\/thread$/) && method === "POST") {
      const annotationId = url.match(/annotations\/([^/]+)\/thread$/)?.[1] ?? "unknown";
      const matchingAnnotation = annotations.find((annotation) => annotation.id === annotationId);
      const threadBody = isRecord(body) ? (body as ThreadReplyBody) : {};
      const nextThread = [
        ...(matchingAnnotation?.thread ?? []),
        {
          id: `t-${Date.now()}`,
          role: threadBody.role ?? "human",
          content: threadBody.content ?? "",
          timestamp: Date.now(),
        },
      ];

      return {
        ok: true,
        json: async () => ({
          ...matchingAnnotation,
          id: annotationId,
          thread: nextThread,
        }),
      };
    }

    if (url.match(/\/sessions\/[\w-]+\/annotations$/) && method === "POST") {
      const parsedAnnotation = isRecord(body) ? body : {};
      const annotation = {
        ...parsedAnnotation,
        id:
          typeof parsedAnnotation.id === "string"
            ? parsedAnnotation.id
            : `${syncIdPrefix}${++syncIdCounter}`,
      } as Annotation;
      return mockSyncAnnotationResponse(annotation, syncedToSessionId);
    }

    if (method === "PATCH") {
      return {
        ok: true,
        json: async () => (isRecord(body) ? body : {}),
      };
    }

    if (method === "DELETE") {
      return {
        ok: true,
        json: async () => ({}),
      };
    }

    if (allowWebhookPosts && method === "POST" && !url.includes("/sessions")) {
      return { ok: true };
    }

    return mockFailedResponse(404);
  });

  vi.stubGlobal("fetch", mockFetch);

  if (eventSourceClass) {
    vi.stubGlobal("EventSource", eventSourceClass);
  }

  return { mockFetch, fetchCalls };
}
