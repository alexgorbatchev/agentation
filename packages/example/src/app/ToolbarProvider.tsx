"use client";

import { useEffect, useState, type JSX } from "react";
import { Agentation } from "@alexgorbatchev/agentation";

type ProbeWindow = Window & typeof globalThis & {
  __AGENTATION_ENABLE_UNSAFE_SOURCE_PROBE__?: boolean;
  __AGENTATION_UNSAFE_SOURCE_PROBE_ALLOWLIST__?: string[];
};

export function ToolbarProvider(): JSX.Element | null {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = (): void => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const probeWindow: ProbeWindow = window;
    const previousProbeEnabled = probeWindow.__AGENTATION_ENABLE_UNSAFE_SOURCE_PROBE__;
    const previousProbeAllowlist = probeWindow.__AGENTATION_UNSAFE_SOURCE_PROBE_ALLOWLIST__;

    probeWindow.__AGENTATION_ENABLE_UNSAFE_SOURCE_PROBE__ = true;
    probeWindow.__AGENTATION_UNSAFE_SOURCE_PROBE_ALLOWLIST__ = [
      window.location.hostname,
      window.location.origin,
    ];

    return () => {
      probeWindow.__AGENTATION_ENABLE_UNSAFE_SOURCE_PROBE__ = previousProbeEnabled;
      probeWindow.__AGENTATION_UNSAFE_SOURCE_PROBE_ALLOWLIST__ = previousProbeAllowlist;
    };
  }, []);

  if (isMobile) {
    return null;
  }

  const endpoint = process.env.NODE_ENV === "development"
    ? "http://localhost:4747"
    : undefined;

  return <Agentation endpoint={endpoint} projectId="agentation-docs" />;
}
