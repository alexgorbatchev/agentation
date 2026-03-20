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

type PageToolbarServerMockResult = Promise<unknown> | unknown;

type PageToolbarServerMockRequest = {
  url: string;
  method: string;
  body: unknown;
  fetchCalls: PageToolbarServerFetchCall[];
};

type PageToolbarServerHealthRequest = PageToolbarServerMockRequest & {
  healthCallIndex: number;
};

type PageToolbarServerSessionRequest = PageToolbarServerMockRequest & {
  requestedSessionId: string;
};

type PageToolbarServerSyncRequest = PageToolbarServerMockRequest & {
  annotation: Annotation;
};

type PageToolbarServerMockRouteOverrides = {
  onHealthRequest?: (
    request: PageToolbarServerHealthRequest,
  ) => PageToolbarServerMockResult | undefined;
  onGetSessionRequest?: (
    request: PageToolbarServerSessionRequest,
  ) => PageToolbarServerMockResult | undefined;
  onCreateSessionRequest?: (
    request: PageToolbarServerMockRequest,
  ) => PageToolbarServerMockResult | undefined;
  onSyncAnnotationRequest?: (
    request: PageToolbarServerSyncRequest,
  ) => PageToolbarServerMockResult | undefined;
  onWebhookRequest?: (
    request: PageToolbarServerMockRequest,
  ) => PageToolbarServerMockResult | undefined;
  onUnhandledRequest?: (
    request: PageToolbarServerMockRequest,
  ) => PageToolbarServerMockResult | undefined;
};

type SetupPageToolbarServerMockOptions = PageToolbarServerMockRouteOverrides & {
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

export function mockNetworkError(message = "Network error"): Promise<never> {
  return Promise.reject(new Error(message));
}

export function mockPendingResponse(): Promise<never> {
  return new Promise(() => {});
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
  onHealthRequest,
  onGetSessionRequest,
  onCreateSessionRequest,
  onSyncAnnotationRequest,
  onWebhookRequest,
  onUnhandledRequest,
}: SetupPageToolbarServerMockOptions = {}): SetupPageToolbarServerMockResult {
  const fetchCalls: PageToolbarServerFetchCall[] = [];
  let syncIdCounter = 0;
  let healthResponseIndex = 0;

  const mockFetch: PageToolbarServerFetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const body = parseRequestBody(init?.body);
    const request: PageToolbarServerMockRequest = { url, method, body, fetchCalls };
    fetchCalls.push({ url, method, body });

    if (url.includes("/health")) {
      const overrideResponse = await onHealthRequest?.({
        ...request,
        healthCallIndex: healthResponseIndex,
      });
      healthResponseIndex += 1;
      if (overrideResponse !== undefined) {
        return overrideResponse;
      }

      const healthStatus = healthResponses?.[healthResponseIndex - 1] ?? healthOk;
      return mockHealthResponse(healthStatus);
    }

    if (url.match(/\/sessions\/([\w-]+)$/) && method === "GET") {
      const requestedSessionId = url.match(/\/sessions\/([\w-]+)$/)?.[1] ?? sessionId;
      const overrideResponse = await onGetSessionRequest?.({
        ...request,
        requestedSessionId,
      });
      if (overrideResponse !== undefined) {
        return overrideResponse;
      }

      return mockGetSessionResponse(requestedSessionId, annotations);
    }

    if (url.endsWith("/sessions") && method === "POST") {
      const overrideResponse = await onCreateSessionRequest?.(request);
      if (overrideResponse !== undefined) {
        return overrideResponse;
      }

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
      const overrideResponse = await onSyncAnnotationRequest?.({
        ...request,
        annotation,
      });
      if (overrideResponse !== undefined) {
        return overrideResponse;
      }

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
      const overrideResponse = await onWebhookRequest?.(request);
      if (overrideResponse !== undefined) {
        return overrideResponse;
      }

      return { ok: true };
    }

    const overrideResponse = await onUnhandledRequest?.(request);
    if (overrideResponse !== undefined) {
      return overrideResponse;
    }

    return mockFailedResponse(404);
  });

  vi.stubGlobal("fetch", mockFetch);

  if (eventSourceClass) {
    vi.stubGlobal("EventSource", eventSourceClass);
  }

  return { mockFetch, fetchCalls };
}
