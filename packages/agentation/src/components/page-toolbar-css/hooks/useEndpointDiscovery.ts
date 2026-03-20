import { useEffect, useState } from "react";

const DEFAULT_AGENTATION_ENDPOINT = "http://127.0.0.1:4747";

export function useEndpointDiscovery(endpoint?: string): string {
  const [autoDiscoveredEndpoint, setAutoDiscoveredEndpoint] = useState("");

  const hasExplicitEndpoint =
    typeof endpoint === "string" && endpoint.trim() !== "";
  const canProbeDefaultEndpoint =
    !hasExplicitEndpoint && typeof fetch === "function";

  const resolvedEndpoint = hasExplicitEndpoint
    ? endpoint.trim()
    : autoDiscoveredEndpoint;

  useEffect(() => {
    if (!canProbeDefaultEndpoint || autoDiscoveredEndpoint) {
      return;
    }

    let cancelled = false;

    const probeDefaultEndpoint = async (): Promise<void> => {
      try {
        const response = await fetch(`${DEFAULT_AGENTATION_ENDPOINT}/health`);
        if (!cancelled && response.ok) {
          setAutoDiscoveredEndpoint(DEFAULT_AGENTATION_ENDPOINT);
        }
      } catch {
        // Ignore probe failures and keep local-only mode.
      }
    };

    void probeDefaultEndpoint();

    return () => {
      cancelled = true;
    };
  }, [autoDiscoveredEndpoint, canProbeDefaultEndpoint]);

  return resolvedEndpoint;
}
