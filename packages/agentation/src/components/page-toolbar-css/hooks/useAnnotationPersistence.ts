import { useEffect } from "react";

import type { Annotation } from "../../../types";
import {
  getStorageKey,
  saveAnnotations,
  saveAnnotationsWithSyncMarker,
} from "../../../utils/storage";

type UseAnnotationPersistenceParams = {
  mounted: boolean;
  annotations: Annotation[];
  pathname: string;
  currentSessionId: string | null;
  removeLocalStorageItem: (key: string) => void;
};

export function useAnnotationPersistence({
  mounted,
  annotations,
  pathname,
  currentSessionId,
  removeLocalStorageItem,
}: UseAnnotationPersistenceParams): void {
  useEffect(() => {
    if (mounted && annotations.length > 0) {
      if (currentSessionId) {
        saveAnnotationsWithSyncMarker(pathname, annotations, currentSessionId);
      } else {
        saveAnnotations(pathname, annotations);
      }
      return;
    }

    if (mounted && annotations.length === 0) {
      removeLocalStorageItem(getStorageKey(pathname));
    }
  }, [annotations, currentSessionId, mounted, pathname, removeLocalStorageItem]);
}
