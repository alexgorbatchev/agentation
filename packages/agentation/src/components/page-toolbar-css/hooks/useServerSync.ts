import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { Annotation } from "../../../types";
import {
  clearSessionId,
  loadAllAnnotations,
  loadAnnotations,
  loadSessionId,
  saveAnnotationsWithSyncMarker,
  saveSessionId,
} from "../../../utils/storage";
import {
  buildProjectScopedUrl,
  createSession,
  getSession,
  syncAnnotation,
} from "../../../utils/sync";
import type { ComponentEditor } from "../../../utils/component-inspector";

const NEOVIM_HEARTBEAT_INTERVAL_MS = 5000;
const NEOVIM_CONNECTION_TIMEOUT_MS = 15000;

type ConnectionStatus = "disconnected" | "connecting" | "connected";

type UseServerSyncParams = {
  resolvedEndpoint: string;
  mounted: boolean;
  pathname: string;
  projectId?: string;
  initialSessionId?: string;
  onSessionCreated?: (sessionId: string) => void;
  setAnnotations: Dispatch<SetStateAction<Annotation[]>>;
  componentEditor: ComponentEditor;
  normalizedNeovimBridgeUrl: string;
  neovimProjectId?: string;
};

type UseServerSyncResult = {
  currentSessionId: string | null;
  connectionStatus: ConnectionStatus;
  neovimConnectionStatus: ConnectionStatus;
};

export function useServerSync({
  resolvedEndpoint,
  mounted,
  pathname,
  projectId,
  initialSessionId,
  onSessionCreated,
  setAnnotations,
  componentEditor,
  normalizedNeovimBridgeUrl,
  neovimProjectId,
}: UseServerSyncParams): UseServerSyncResult {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    initialSessionId ?? null,
  );
  const sessionInitializedRef = useRef(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    "disconnected",
  );
  const [neovimConnectionStatus, setNeovimConnectionStatus] =
    useState<ConnectionStatus>(
      componentEditor === "neovim" ? "connecting" : "disconnected",
    );
  const prevConnectionStatusRef = useRef<ConnectionStatus | null>(null);

  useEffect(() => {
    if (!resolvedEndpoint || !mounted || sessionInitializedRef.current) {
      return;
    }

    sessionInitializedRef.current = true;
    setConnectionStatus("connecting");

    const initSession = async (): Promise<void> => {
      try {
        const storedSessionId = loadSessionId(pathname);
        const sessionIdToJoin = initialSessionId || storedSessionId;
        let sessionEstablished = false;

        if (sessionIdToJoin) {
          try {
            const session = await getSession(resolvedEndpoint, sessionIdToJoin, projectId);
            setCurrentSessionId(session.id);
            setConnectionStatus("connected");
            saveSessionId(pathname, session.id);
            sessionEstablished = true;

            const allLocalAnnotations = loadAnnotations<Annotation>(pathname);
            const serverIds = new Set(session.annotations.map((annotation) => annotation.id));
            const localToMerge = allLocalAnnotations.filter(
              (annotation) => !serverIds.has(annotation.id),
            );

            if (localToMerge.length > 0) {
              const baseUrl =
                typeof window !== "undefined" ? window.location.origin : "";
              const pageUrl = `${baseUrl}${pathname}`;

              const results = await Promise.allSettled(
                localToMerge.map((annotation) =>
                  syncAnnotation(
                    resolvedEndpoint,
                    session.id,
                    {
                      ...annotation,
                      sessionId: session.id,
                      url: pageUrl,
                    },
                    projectId,
                  ),
                ),
              );

              const syncedAnnotations = results.map((result, index) => {
                if (result.status === "fulfilled") {
                  return result.value;
                }

                console.warn(
                  "[Agentation] Failed to sync annotation:",
                  result.reason,
                );
                return localToMerge[index];
              });

              const allAnnotations = [...session.annotations, ...syncedAnnotations];
              setAnnotations(allAnnotations);
              saveAnnotationsWithSyncMarker(pathname, allAnnotations, session.id);
            } else {
              setAnnotations(session.annotations);
              saveAnnotationsWithSyncMarker(
                pathname,
                session.annotations,
                session.id,
              );
            }
          } catch (joinError) {
            console.warn(
              "[Agentation] Could not join session, creating new:",
              joinError,
            );
            clearSessionId(pathname);
          }
        }

        if (!sessionEstablished) {
          const currentUrl =
            typeof window !== "undefined" ? window.location.href : "/";
          const session = await createSession(
            resolvedEndpoint,
            currentUrl,
            projectId,
          );

          setCurrentSessionId(session.id);
          setConnectionStatus("connected");
          saveSessionId(pathname, session.id);
          onSessionCreated?.(session.id);

          const allAnnotations = loadAllAnnotations<Annotation>();
          const baseUrl =
            typeof window !== "undefined" ? window.location.origin : "";

          const syncPromises: Promise<void>[] = [];
          for (const [pagePath, annotations] of allAnnotations) {
            const unsyncedAnnotations = annotations.filter(
              (annotation) => !(annotation as Annotation & { _syncedTo?: string })._syncedTo,
            );
            if (unsyncedAnnotations.length === 0) {
              continue;
            }

            const pageUrl = `${baseUrl}${pagePath}`;
            const isCurrentPage = pagePath === pathname;

            syncPromises.push(
              (async () => {
                try {
                  const targetSession = isCurrentPage
                    ? session
                    : await createSession(resolvedEndpoint, pageUrl, projectId);

                  const results = await Promise.allSettled(
                    unsyncedAnnotations.map((annotation) =>
                      syncAnnotation(
                        resolvedEndpoint,
                        targetSession.id,
                        {
                          ...annotation,
                          sessionId: targetSession.id,
                          url: pageUrl,
                        },
                        projectId,
                      ),
                    ),
                  );

                  const syncedAnnotations = results.map((result, index) => {
                    if (result.status === "fulfilled") {
                      return result.value;
                    }

                    console.warn(
                      "[Agentation] Failed to sync annotation:",
                      result.reason,
                    );
                    return unsyncedAnnotations[index];
                  });

                  saveAnnotationsWithSyncMarker(
                    pagePath,
                    syncedAnnotations,
                    targetSession.id,
                  );

                  if (isCurrentPage) {
                    const originalIds = new Set(
                      unsyncedAnnotations.map((annotation) => annotation.id),
                    );
                    setAnnotations((prev) => {
                      const newDuringSync = prev.filter(
                        (annotation) => !originalIds.has(annotation.id),
                      );
                      return [...syncedAnnotations, ...newDuringSync];
                    });
                  }
                } catch (error) {
                  console.warn(
                    `[Agentation] Failed to sync annotations for ${pagePath}:`,
                    error,
                  );
                }
              })(),
            );
          }

          await Promise.allSettled(syncPromises);
        }
      } catch (error) {
        setConnectionStatus("disconnected");
        console.warn(
          "[Agentation] Failed to initialize session, using local storage:",
          error,
        );
      }
    };

    void initSession();
  }, [
    initialSessionId,
    mounted,
    onSessionCreated,
    pathname,
    projectId,
    resolvedEndpoint,
    setAnnotations,
  ]);

  useEffect(() => {
    if (!resolvedEndpoint || !mounted) {
      return;
    }

    const checkHealth = async (): Promise<void> => {
      try {
        const response = await fetch(buildProjectScopedUrl(`${resolvedEndpoint}/health`, projectId));
        setConnectionStatus(response.ok ? "connected" : "disconnected");
      } catch {
        setConnectionStatus("disconnected");
      }
    };

    void checkHealth();
    const interval = window.setInterval(() => {
      void checkHealth();
    }, 10000);
    return () => {
      window.clearInterval(interval);
    };
  }, [mounted, projectId, resolvedEndpoint]);

  useEffect(() => {
    if (
      !resolvedEndpoint ||
      !mounted ||
      !currentSessionId ||
      typeof EventSource === "undefined"
    ) {
      return;
    }

    const eventSource = new EventSource(
      buildProjectScopedUrl(`${resolvedEndpoint}/sessions/${currentSessionId}/events`, projectId),
    );

    const removedStatuses = ["resolved", "dismissed"];

    const annotationUpdatedHandler = (eventMessage: MessageEvent): void => {
      try {
        const event = JSON.parse(eventMessage.data);
        if (!removedStatuses.includes(event.payload?.status)) {
          return;
        }

        const { id, status, thread, resolvedAt, resolvedBy } = event.payload;
        setAnnotations((prev) =>
          prev.map((annotation) =>
            annotation.id === id
              ? {
                  ...annotation,
                  status,
                  thread: thread ?? annotation.thread,
                  resolvedAt,
                  resolvedBy,
                }
              : annotation,
          ),
        );
      } catch {
        // Ignore parse errors.
      }
    };

    const threadHandler = (eventMessage: MessageEvent): void => {
      try {
        const event = JSON.parse(eventMessage.data);
        const updated = event.payload as Annotation;
        if (!updated?.id || !updated?.thread) {
          return;
        }

        setAnnotations((prev) =>
          prev.map((annotation) =>
            annotation.id === updated.id
              ? { ...annotation, thread: updated.thread }
              : annotation,
          ),
        );
      } catch {
        // Ignore parse errors.
      }
    };

    eventSource.addEventListener("annotation.updated", annotationUpdatedHandler);
    eventSource.addEventListener("thread.message", threadHandler);

    return () => {
      eventSource.removeEventListener(
        "annotation.updated",
        annotationUpdatedHandler,
      );
      eventSource.removeEventListener("thread.message", threadHandler);
      eventSource.close();
    };
  }, [currentSessionId, mounted, projectId, resolvedEndpoint, setAnnotations]);

  useEffect(() => {
    if (!resolvedEndpoint || !mounted) {
      return;
    }

    const wasDisconnected = prevConnectionStatusRef.current === "disconnected";
    const isNowConnected = connectionStatus === "connected";
    prevConnectionStatusRef.current = connectionStatus;

    if (!wasDisconnected || !isNowConnected) {
      return;
    }

    const syncLocalAnnotations = async (): Promise<void> => {
      try {
        const localAnnotations = loadAnnotations<Annotation>(pathname);
        if (localAnnotations.length === 0) {
          return;
        }

        const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
        const pageUrl = `${baseUrl}${pathname}`;

        let sessionId = currentSessionId;
        let serverAnnotations: Annotation[] = [];

        if (sessionId) {
          try {
            const session = await getSession(resolvedEndpoint, sessionId, projectId);
            serverAnnotations = session.annotations;
          } catch {
            sessionId = null;
          }
        }

        if (!sessionId) {
          const newSession = await createSession(resolvedEndpoint, pageUrl, projectId);
          sessionId = newSession.id;
          setCurrentSessionId(sessionId);
          saveSessionId(pathname, sessionId);
        }

        const serverIds = new Set(serverAnnotations.map((annotation) => annotation.id));
        const unsyncedLocal = localAnnotations.filter(
          (annotation) => !serverIds.has(annotation.id),
        );

        if (unsyncedLocal.length > 0) {
          const results = await Promise.allSettled(
            unsyncedLocal.map((annotation) =>
              syncAnnotation(
                resolvedEndpoint,
                sessionId!,
                {
                  ...annotation,
                  sessionId: sessionId!,
                  url: pageUrl,
                },
                projectId,
              ),
            ),
          );

          const syncedAnnotations = results.map((result, index) => {
            if (result.status === "fulfilled") {
              return result.value;
            }
            console.warn(
              "[Agentation] Failed to sync annotation on reconnect:",
              result.reason,
            );
            return unsyncedLocal[index];
          });

          const allAnnotations = [...serverAnnotations, ...syncedAnnotations];
          setAnnotations(allAnnotations);
          saveAnnotationsWithSyncMarker(pathname, allAnnotations, sessionId!);
        }
      } catch (error) {
        console.warn("[Agentation] Failed to sync on reconnect:", error);
      }
    };

    void syncLocalAnnotations();
  }, [
    connectionStatus,
    currentSessionId,
    mounted,
    pathname,
    projectId,
    resolvedEndpoint,
    setAnnotations,
  ]);

  useEffect(() => {
    if (componentEditor !== "neovim" || typeof fetch !== "function") {
      setNeovimConnectionStatus("disconnected");
      return;
    }

    let isDisposed = false;
    let timeoutId: number | null = null;

    const markDisconnected = (): void => {
      setNeovimConnectionStatus("disconnected");
    };

    const scheduleDisconnect = (): void => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(markDisconnected, NEOVIM_CONNECTION_TIMEOUT_MS);
    };

    let pingUrl: URL;
    try {
      pingUrl = new URL(`${normalizedNeovimBridgeUrl}/ping`);
    } catch {
      setNeovimConnectionStatus("disconnected");
      return;
    }

    if (neovimProjectId) {
      pingUrl.searchParams.set("projectId", neovimProjectId);
    }

    if (typeof window !== "undefined" && window.location.origin) {
      pingUrl.searchParams.set("origin", window.location.origin);
    }

    async function pingBridge(): Promise<void> {
      if (isDisposed) {
        return;
      }

      setNeovimConnectionStatus((current) =>
        current === "connected" ? current : "connecting",
      );

      try {
        const response = await fetch(pingUrl.toString(), {
          method: "GET",
          mode: "cors",
          keepalive: true,
        });

        if (!response.ok) {
          throw new Error(
            `Neovim bridge ping failed with status ${response.status}`,
          );
        }

        if (!isDisposed) {
          setNeovimConnectionStatus("connected");
          scheduleDisconnect();
        }
      } catch {
        if (!isDisposed) {
          setNeovimConnectionStatus("disconnected");
        }
      }
    }

    void pingBridge();
    const interval = window.setInterval(() => {
      void pingBridge();
    }, NEOVIM_HEARTBEAT_INTERVAL_MS);

    return () => {
      isDisposed = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      window.clearInterval(interval);
    };
  }, [componentEditor, neovimProjectId, normalizedNeovimBridgeUrl]);

  return {
    currentSessionId,
    connectionStatus,
    neovimConnectionStatus,
  };
}
