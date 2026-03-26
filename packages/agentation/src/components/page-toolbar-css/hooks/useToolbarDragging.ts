import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, MouseEvent, SetStateAction } from "react";

import {
  serializeToolbarPosition,
  TOOLBAR_POSITION_STORAGE_KEY,
} from "../state/toolbar-settings";

type ConnectionStatus = "disconnected" | "connecting" | "connected";

type UseToolbarDraggingParams = {
  toolbarPosition: { x: number; y: number } | null;
  setToolbarPosition: Dispatch<SetStateAction<{ x: number; y: number } | null>>;
  isActive: boolean;
  connectionStatus: ConnectionStatus;
  settingsPanelClassName: string;
  mounted: boolean;
};

type UseToolbarDraggingResult = {
  isDraggingToolbar: boolean;
  dragRotation: number;
  handleToolbarMouseDown: (event: MouseEvent) => void;
  consumeJustFinishedToolbarDrag: () => boolean;
};

type DragStartPosition = {
  x: number;
  y: number;
  toolbarX: number;
  toolbarY: number;
};

const TOOLBAR_VIEWPORT_PADDING_PX = 20;
const TOOLBAR_WRAPPER_WIDTH_PX = 331;
const TOOLBAR_ACTIVE_WIDTH_PX = 291;
const TOOLBAR_CONNECTED_WIDTH_PX = 331;
const TOOLBAR_COLLAPSED_WIDTH_PX = 44;
const TOOLBAR_HEIGHT_PX = 44;

function setLocalStorageItem(key: string, value: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // localStorage may be unavailable or blocked
  }
}

function getToolbarContentWidth(
  isActive: boolean,
  connectionStatus: ConnectionStatus,
): number {
  if (!isActive) {
    return TOOLBAR_COLLAPSED_WIDTH_PX;
  }

  if (connectionStatus === "connected") {
    return TOOLBAR_CONNECTED_WIDTH_PX;
  }

  return TOOLBAR_ACTIVE_WIDTH_PX;
}

function constrainToolbarPosition(
  currentX: number,
  currentY: number,
  isActive: boolean,
  connectionStatus: ConnectionStatus,
): { x: number; y: number } {
  const contentWidth = getToolbarContentWidth(isActive, connectionStatus);
  const contentOffset = TOOLBAR_WRAPPER_WIDTH_PX - contentWidth;
  const minX = TOOLBAR_VIEWPORT_PADDING_PX - contentOffset;
  const maxX =
    window.innerWidth - TOOLBAR_VIEWPORT_PADDING_PX - TOOLBAR_WRAPPER_WIDTH_PX;

  const x = Math.max(minX, Math.min(maxX, currentX));
  const y = Math.max(
    TOOLBAR_VIEWPORT_PADDING_PX,
    Math.min(
      window.innerHeight - TOOLBAR_HEIGHT_PX - TOOLBAR_VIEWPORT_PADDING_PX,
      currentY,
    ),
  );

  return { x, y };
}

export function useToolbarDragging({
  toolbarPosition,
  setToolbarPosition,
  isActive,
  connectionStatus,
  settingsPanelClassName,
  mounted,
}: UseToolbarDraggingParams): UseToolbarDraggingResult {
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<DragStartPosition | null>(
    null,
  );
  const [dragRotation, setDragRotation] = useState(0);
  const justFinishedToolbarDragRef = useRef(false);

  const consumeJustFinishedToolbarDrag = (): boolean => {
    const value = justFinishedToolbarDragRef.current;
    justFinishedToolbarDragRef.current = false;
    return value;
  };

  useEffect(() => {
    if (!dragStartPos) {
      return;
    }

    const DRAG_THRESHOLD = 10;

    const handleMouseMove = (event: globalThis.MouseEvent): void => {
      const deltaX = event.clientX - dragStartPos.x;
      const deltaY = event.clientY - dragStartPos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (!isDraggingToolbar && distance > DRAG_THRESHOLD) {
        setIsDraggingToolbar(true);
      }

      if (!isDraggingToolbar && distance <= DRAG_THRESHOLD) {
        return;
      }

      const unconstrainedX = dragStartPos.toolbarX + deltaX;
      const unconstrainedY = dragStartPos.toolbarY + deltaY;
      const nextPosition = constrainToolbarPosition(
        unconstrainedX,
        unconstrainedY,
        isActive,
        connectionStatus,
      );

      setToolbarPosition(nextPosition);
    };

    const handleMouseUp = (): void => {
      if (isDraggingToolbar) {
        justFinishedToolbarDragRef.current = true;
      }
      setIsDraggingToolbar(false);
      setDragStartPos(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    dragStartPos,
    isDraggingToolbar,
    isActive,
    connectionStatus,
    setToolbarPosition,
  ]);

  const handleToolbarMouseDown = useCallback(
    (event: MouseEvent): void => {
      const target = event.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest(`.${settingsPanelClassName}`)
      ) {
        return;
      }

      const toolbarParent = (event.currentTarget as HTMLElement).parentElement;
      if (!toolbarParent) {
        return;
      }

      const rect = toolbarParent.getBoundingClientRect();
      const currentX = toolbarPosition?.x ?? rect.left;
      const currentY = toolbarPosition?.y ?? rect.top;
      const randomRotation = (Math.random() - 0.5) * 10;
      setDragRotation(randomRotation);

      setDragStartPos({
        x: event.clientX,
        y: event.clientY,
        toolbarX: currentX,
        toolbarY: currentY,
      });
    },
    [toolbarPosition, settingsPanelClassName],
  );

  useEffect(() => {
    if (!toolbarPosition) {
      return;
    }

    const constrainPosition = (): void => {
      const nextPosition = constrainToolbarPosition(
        toolbarPosition.x,
        toolbarPosition.y,
        isActive,
        connectionStatus,
      );

      if (
        nextPosition.x !== toolbarPosition.x ||
        nextPosition.y !== toolbarPosition.y
      ) {
        setToolbarPosition(nextPosition);
      }
    };

    constrainPosition();

    window.addEventListener("resize", constrainPosition);
    return () => {
      window.removeEventListener("resize", constrainPosition);
    };
  }, [toolbarPosition, isActive, connectionStatus, setToolbarPosition]);

  const prevDraggingRef = useRef(false);
  useEffect(() => {
    const wasDragging = prevDraggingRef.current;
    prevDraggingRef.current = isDraggingToolbar;

    if (!wasDragging || isDraggingToolbar || !toolbarPosition || !mounted) {
      return;
    }

    setLocalStorageItem(
      TOOLBAR_POSITION_STORAGE_KEY,
      serializeToolbarPosition(toolbarPosition),
    );
  }, [isDraggingToolbar, toolbarPosition, mounted]);

  return {
    isDraggingToolbar,
    dragRotation,
    handleToolbarMouseDown,
    consumeJustFinishedToolbarDrag,
  };
}
