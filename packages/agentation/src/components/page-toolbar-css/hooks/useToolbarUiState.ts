import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { loadToolbarHidden } from "../../../utils/storage";

type SettingsPage = "main" | "automations";

type UseToolbarUiStateResult = {
  isActive: boolean;
  setIsActive: Dispatch<SetStateAction<boolean>>;
  showMarkers: boolean;
  setShowMarkers: Dispatch<SetStateAction<boolean>>;
  isToolbarHidden: boolean;
  setIsToolbarHidden: Dispatch<SetStateAction<boolean>>;
  isToolbarHiding: boolean;
  setIsToolbarHiding: Dispatch<SetStateAction<boolean>>;
  markersVisible: boolean;
  setMarkersVisible: Dispatch<SetStateAction<boolean>>;
  markersExiting: boolean;
  setMarkersExiting: Dispatch<SetStateAction<boolean>>;
  showSettings: boolean;
  setShowSettings: Dispatch<SetStateAction<boolean>>;
  showSettingsVisible: boolean;
  setShowSettingsVisible: Dispatch<SetStateAction<boolean>>;
  showReviewQueue: boolean;
  setShowReviewQueue: Dispatch<SetStateAction<boolean>>;
  showReviewQueueVisible: boolean;
  setShowReviewQueueVisible: Dispatch<SetStateAction<boolean>>;
  settingsPage: SettingsPage;
  setSettingsPage: Dispatch<SetStateAction<SettingsPage>>;
  isTransitioning: boolean;
  setIsTransitioning: Dispatch<SetStateAction<boolean>>;
};

export function useToolbarUiState(): UseToolbarUiStateResult {
  const [isActive, setIsActive] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const [isToolbarHidden, setIsToolbarHidden] = useState(() => loadToolbarHidden());
  const [isToolbarHiding, setIsToolbarHiding] = useState(false);

  const [markersVisible, setMarkersVisible] = useState(false);
  const [markersExiting, setMarkersExiting] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [showSettingsVisible, setShowSettingsVisible] = useState(false);
  const [showReviewQueue, setShowReviewQueue] = useState(false);
  const [showReviewQueueVisible, setShowReviewQueueVisible] = useState(false);

  const [settingsPage, setSettingsPage] = useState<SettingsPage>("main");
  const [isTransitioning, setIsTransitioning] = useState(false);

  return {
    isActive,
    setIsActive,
    showMarkers,
    setShowMarkers,
    isToolbarHidden,
    setIsToolbarHidden,
    isToolbarHiding,
    setIsToolbarHiding,
    markersVisible,
    setMarkersVisible,
    markersExiting,
    setMarkersExiting,
    showSettings,
    setShowSettings,
    showSettingsVisible,
    setShowSettingsVisible,
    showReviewQueue,
    setShowReviewQueue,
    showReviewQueueVisible,
    setShowReviewQueueVisible,
    settingsPage,
    setSettingsPage,
    isTransitioning,
    setIsTransitioning,
  };
}
