import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { Annotation } from "../../../types";
import type { ToolbarSettings } from "../state/toolbar-settings";
import { deleteAnnotation as deleteAnnotationFromServer } from "../../../utils/sync";
import { getStorageKey } from "../../../utils/storage";
import { originalSetTimeout } from "../../../utils/freeze-animations";
import type { ReactComponentMode } from "../types";
import { generateOutput } from "../utils/generateOutput";

type SendState = "idle" | "sending" | "sent" | "failed";

type UseAnnotationActionsParams = {
  annotations: Annotation[];
  pathname: string;
  settings: ToolbarSettings;
  effectiveReactMode: ReactComponentMode;
  copyToClipboard: boolean;
  resolvedEndpoint: string;
  projectId?: string;
  webhookUrl?: string;
  onAnnotationsClear?: (annotations: Annotation[]) => void;
  onCopy?: (markdown: string) => void;
  onSubmit?: (output: string, annotations: Annotation[]) => void;
  setAnnotations: Dispatch<SetStateAction<Annotation[]>>;
  setAnimatedMarkers: Dispatch<SetStateAction<Set<string>>>;
  setIsClearing: Dispatch<SetStateAction<boolean>>;
  removeLocalStorageItem: (key: string) => void;
};

type UseAnnotationActionsResult = {
  copied: boolean;
  sendState: SendState;
  fireWebhook: (
    event: string,
    payload: Record<string, unknown>,
    force?: boolean,
  ) => Promise<boolean>;
  clearAll: () => void;
  copyOutput: () => Promise<void>;
  sendToWebhook: () => Promise<void>;
};

export function useAnnotationActions({
  annotations,
  pathname,
  settings,
  effectiveReactMode,
  copyToClipboard,
  resolvedEndpoint,
  projectId,
  webhookUrl,
  onAnnotationsClear,
  onCopy,
  onSubmit,
  setAnnotations,
  setAnimatedMarkers,
  setIsClearing,
  removeLocalStorageItem,
}: UseAnnotationActionsParams): UseAnnotationActionsResult {
  const [copied, setCopied] = useState(false);
  const [sendState, setSendState] = useState<SendState>("idle");
  const isMountedRef = useRef(true);
  const timeoutIdsRef = useRef<number[]>([]);

  const scheduleTimeout = useCallback((callback: () => void, delayMs: number) => {
    const timeoutId = originalSetTimeout(() => {
      timeoutIdsRef.current = timeoutIdsRef.current.filter(
        (entry) => entry !== timeoutId,
      );

      if (!isMountedRef.current) {
        return;
      }

      callback();
    }, delayMs);

    timeoutIdsRef.current.push(timeoutId);
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      for (const timeoutId of timeoutIdsRef.current) {
        window.clearTimeout(timeoutId);
      }
      timeoutIdsRef.current = [];
    };
  }, []);

  const fireWebhook = useCallback(
    async (
      event: string,
      payload: Record<string, unknown>,
      force?: boolean,
    ): Promise<boolean> => {
      const targetUrl = settings.webhookUrl || webhookUrl;
      if (!targetUrl || (!settings.webhooksEnabled && !force)) {
        return false;
      }

      try {
        const response = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event,
            timestamp: Date.now(),
            url: typeof window !== "undefined" ? window.location.href : undefined,
            ...payload,
          }),
        });
        return response.ok;
      } catch (error) {
        console.warn("[Agentation] Webhook failed:", error);
        return false;
      }
    },
    [webhookUrl, settings.webhookUrl, settings.webhooksEnabled],
  );

  const clearAll = useCallback((): void => {
    const count = annotations.length;
    if (count === 0) {
      return;
    }

    onAnnotationsClear?.(annotations);
    void fireWebhook("annotations.clear", { annotations });

    if (resolvedEndpoint) {
      void Promise.all(
        annotations.map((annotation) =>
          deleteAnnotationFromServer(resolvedEndpoint, annotation.id, projectId).catch((error) => {
            console.warn(
              "[Agentation] Failed to delete annotation from server:",
              error,
            );
          }),
        ),
      );
    }

    setIsClearing(true);

    const totalAnimationTime = count * 30 + 200;
    scheduleTimeout(() => {
      setAnnotations([]);
      setAnimatedMarkers(new Set());
      removeLocalStorageItem(getStorageKey(pathname));
      setIsClearing(false);
    }, totalAnimationTime);
  }, [
    pathname,
    annotations,
    onAnnotationsClear,
    fireWebhook,
    projectId,
    resolvedEndpoint,
    setIsClearing,
    setAnnotations,
    setAnimatedMarkers,
    removeLocalStorageItem,
    scheduleTimeout,
  ]);

  const copyOutput = useCallback(async (): Promise<void> => {
    const displayUrl =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search + window.location.hash
        : pathname;

    const output = generateOutput(
      annotations,
      displayUrl,
      settings.outputDetail,
      effectiveReactMode,
    );

    if (!output) {
      return;
    }

    if (copyToClipboard) {
      try {
        await navigator.clipboard.writeText(output);
      } catch {
        // Clipboard may fail (permissions, not HTTPS, etc.) - continue anyway
      }
    }

    onCopy?.(output);

    setCopied(true);
    scheduleTimeout(() => {
      setCopied(false);
    }, 2000);

    if (settings.autoClearAfterCopy) {
      scheduleTimeout(() => {
        clearAll();
      }, 500);
    }
  }, [
    annotations,
    pathname,
    settings.outputDetail,
    effectiveReactMode,
    settings.autoClearAfterCopy,
    clearAll,
    copyToClipboard,
    onCopy,
    scheduleTimeout,
  ]);

  const sendToWebhook = useCallback(async (): Promise<void> => {
    const displayUrl =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search + window.location.hash
        : pathname;

    const output = generateOutput(
      annotations,
      displayUrl,
      settings.outputDetail,
      effectiveReactMode,
    );

    if (!output) {
      return;
    }

    onSubmit?.(output, annotations);

    setSendState("sending");
    await new Promise<void>((resolve) => {
      originalSetTimeout(resolve, 150);
    });

    const success = await fireWebhook("submit", { output, annotations }, true);
    if (!isMountedRef.current) {
      return;
    }

    setSendState(success ? "sent" : "failed");
    scheduleTimeout(() => {
      setSendState("idle");
    }, 2500);

    if (success && settings.autoClearAfterCopy) {
      scheduleTimeout(() => {
        clearAll();
      }, 500);
    }
  }, [
    onSubmit,
    fireWebhook,
    annotations,
    pathname,
    settings.outputDetail,
    effectiveReactMode,
    settings.autoClearAfterCopy,
    clearAll,
    scheduleTimeout,
  ]);

  return {
    copied,
    sendState,
    fireWebhook,
    clearAll,
    copyOutput,
    sendToWebhook,
  };
}
