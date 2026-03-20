import { useRef, useState } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";

type UseMarkerAnimationStateResult = {
  animatedMarkers: Set<string>;
  setAnimatedMarkers: Dispatch<SetStateAction<Set<string>>>;
  exitingMarkers: Set<string>;
  setExitingMarkers: Dispatch<SetStateAction<Set<string>>>;
  pendingExiting: boolean;
  setPendingExiting: Dispatch<SetStateAction<boolean>>;
  editExiting: boolean;
  setEditExiting: Dispatch<SetStateAction<boolean>>;
  deletingMarkerId: string | null;
  setDeletingMarkerId: Dispatch<SetStateAction<string | null>>;
  renumberFrom: number | null;
  setRenumberFrom: Dispatch<SetStateAction<number | null>>;
  isClearing: boolean;
  setIsClearing: Dispatch<SetStateAction<boolean>>;
  recentlyAddedIdRef: MutableRefObject<string | null>;
};

export function useMarkerAnimationState(): UseMarkerAnimationStateResult {
  const [animatedMarkers, setAnimatedMarkers] = useState<Set<string>>(
    new Set(),
  );
  const [exitingMarkers, setExitingMarkers] = useState<Set<string>>(new Set());
  const [pendingExiting, setPendingExiting] = useState(false);
  const [editExiting, setEditExiting] = useState(false);

  const [deletingMarkerId, setDeletingMarkerId] = useState<string | null>(null);
  const [renumberFrom, setRenumberFrom] = useState<number | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const recentlyAddedIdRef = useRef<string | null>(null);

  return {
    animatedMarkers,
    setAnimatedMarkers,
    exitingMarkers,
    setExitingMarkers,
    pendingExiting,
    setPendingExiting,
    editExiting,
    setEditExiting,
    deletingMarkerId,
    setDeletingMarkerId,
    renumberFrom,
    setRenumberFrom,
    isClearing,
    setIsClearing,
    recentlyAddedIdRef,
  };
}
