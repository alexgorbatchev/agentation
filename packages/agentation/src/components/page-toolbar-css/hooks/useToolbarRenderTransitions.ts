import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";

import { originalSetTimeout } from "../../../utils/freeze-animations";
import type { Annotation } from "../../../types";

type UseToolbarRenderTransitionsParams = {
  isActive: boolean;
  showMarkers: boolean;
  annotations: Annotation[];
  markersVisible: boolean;
  showSettings: boolean;
  showReviewQueue: boolean;
  settingsPage: "main" | "automations";
  setMarkersVisible: Dispatch<SetStateAction<boolean>>;
  setMarkersExiting: Dispatch<SetStateAction<boolean>>;
  setAnimatedMarkers: Dispatch<SetStateAction<Set<string>>>;
  setShowSettingsVisible: Dispatch<SetStateAction<boolean>>;
  setShowReviewQueueVisible: Dispatch<SetStateAction<boolean>>;
  setShowReviewQueue: Dispatch<SetStateAction<boolean>>;
  setShowSettings: Dispatch<SetStateAction<boolean>>;
  setTooltipsHidden: Dispatch<SetStateAction<boolean>>;
  setSettingsPage: Dispatch<SetStateAction<"main" | "automations">>;
  setIsTransitioning: Dispatch<SetStateAction<boolean>>;
};

export function useToolbarRenderTransitions({
  isActive,
  showMarkers,
  annotations,
  markersVisible,
  showSettings,
  showReviewQueue,
  settingsPage,
  setMarkersVisible,
  setMarkersExiting,
  setAnimatedMarkers,
  setShowSettingsVisible,
  setShowReviewQueueVisible,
  setShowReviewQueue,
  setShowSettings,
  setTooltipsHidden,
  setSettingsPage,
  setIsTransitioning,
}: UseToolbarRenderTransitionsParams): void {
  useEffect(() => {
    if (showSettings) {
      setShowSettingsVisible(true);
      setShowReviewQueue(false);
      return;
    }

    setTooltipsHidden(false);
    setSettingsPage("main");
    const timer = originalSetTimeout(() => setShowSettingsVisible(false), 0);
    return () => clearTimeout(timer);
  }, [
    setSettingsPage,
    setShowReviewQueue,
    setShowSettingsVisible,
    setTooltipsHidden,
    showSettings,
  ]);

  useEffect(() => {
    if (showReviewQueue) {
      setShowReviewQueueVisible(true);
      setShowSettings(false);
      return;
    }

    const timer = originalSetTimeout(() => setShowReviewQueueVisible(false), 0);
    return () => clearTimeout(timer);
  }, [
    setShowReviewQueueVisible,
    setShowSettings,
    showReviewQueue,
  ]);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = originalSetTimeout(() => setIsTransitioning(false), 350);
    return () => clearTimeout(timer);
  }, [setIsTransitioning, settingsPage]);

  const shouldShowMarkers = isActive && showMarkers;
  useEffect(() => {
    if (shouldShowMarkers) {
      setMarkersExiting(false);
      setMarkersVisible(true);
      setAnimatedMarkers(new Set());
      const timer = originalSetTimeout(() => {
        setAnimatedMarkers((prev) => {
          const next = new Set(prev);
          annotations.forEach((annotation) => next.add(annotation.id));
          return next;
        });
      }, 350);
      return () => clearTimeout(timer);
    }

    if (markersVisible) {
      setMarkersExiting(true);
      const timer = originalSetTimeout(() => {
        setMarkersVisible(false);
        setMarkersExiting(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [
    annotations,
    markersVisible,
    setAnimatedMarkers,
    setMarkersExiting,
    setMarkersVisible,
    shouldShowMarkers,
  ]);
}
