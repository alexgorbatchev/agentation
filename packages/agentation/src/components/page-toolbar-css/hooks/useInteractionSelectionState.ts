import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { Annotation } from "../../../types";
import type {
  ComponentMenuState,
  HoverInfo,
  PendingAnnotationState,
  PendingMultiSelectElement,
} from "./useInteractionLifecycle";

type UseInteractionSelectionStateResult = {
  hoverInfo: HoverInfo | null;
  setHoverInfo: Dispatch<SetStateAction<HoverInfo | null>>;
  hoverPosition: { x: number; y: number };
  setHoverPosition: Dispatch<SetStateAction<{ x: number; y: number }>>;
  pendingAnnotation: PendingAnnotationState | null;
  setPendingAnnotation: Dispatch<SetStateAction<PendingAnnotationState | null>>;
  hoveredMarkerId: string | null;
  setHoveredMarkerId: Dispatch<SetStateAction<string | null>>;
  hoveredTargetElement: HTMLElement | null;
  setHoveredTargetElement: Dispatch<SetStateAction<HTMLElement | null>>;
  hoveredTargetElements: HTMLElement[];
  setHoveredTargetElements: Dispatch<SetStateAction<HTMLElement[]>>;
  editingAnnotation: Annotation | null;
  setEditingAnnotation: Dispatch<SetStateAction<Annotation | null>>;
  editingTargetElement: HTMLElement | null;
  setEditingTargetElement: Dispatch<SetStateAction<HTMLElement | null>>;
  editingTargetElements: HTMLElement[];
  setEditingTargetElements: Dispatch<SetStateAction<HTMLElement[]>>;
  componentMenu: ComponentMenuState | null;
  setComponentMenu: Dispatch<SetStateAction<ComponentMenuState | null>>;
  hoveredComponentMenuIndex: number | null;
  setHoveredComponentMenuIndex: Dispatch<SetStateAction<number | null>>;
  pendingMultiSelectElements: PendingMultiSelectElement[];
  setPendingMultiSelectElements: Dispatch<
    SetStateAction<PendingMultiSelectElement[]>
  >;
  isReplySending: boolean;
  setIsReplySending: Dispatch<SetStateAction<boolean>>;
  scrollY: number;
  setScrollY: Dispatch<SetStateAction<number>>;
  isScrolling: boolean;
  setIsScrolling: Dispatch<SetStateAction<boolean>>;
};

export function useInteractionSelectionState(): UseInteractionSelectionStateResult {
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [pendingAnnotation, setPendingAnnotation] =
    useState<PendingAnnotationState | null>(null);

  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [hoveredTargetElement, setHoveredTargetElement] =
    useState<HTMLElement | null>(null);
  const [hoveredTargetElements, setHoveredTargetElements] = useState<
    HTMLElement[]
  >([]);

  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(
    null,
  );
  const [editingTargetElement, setEditingTargetElement] =
    useState<HTMLElement | null>(null);
  const [editingTargetElements, setEditingTargetElements] = useState<
    HTMLElement[]
  >([]);

  const [componentMenu, setComponentMenu] =
    useState<ComponentMenuState | null>(null);
  const [hoveredComponentMenuIndex, setHoveredComponentMenuIndex] = useState<
    number | null
  >(null);
  const [pendingMultiSelectElements, setPendingMultiSelectElements] = useState<
    PendingMultiSelectElement[]
  >([]);

  const [isReplySending, setIsReplySending] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  return {
    hoverInfo,
    setHoverInfo,
    hoverPosition,
    setHoverPosition,
    pendingAnnotation,
    setPendingAnnotation,
    hoveredMarkerId,
    setHoveredMarkerId,
    hoveredTargetElement,
    setHoveredTargetElement,
    hoveredTargetElements,
    setHoveredTargetElements,
    editingAnnotation,
    setEditingAnnotation,
    editingTargetElement,
    setEditingTargetElement,
    editingTargetElements,
    setEditingTargetElements,
    componentMenu,
    setComponentMenu,
    hoveredComponentMenuIndex,
    setHoveredComponentMenuIndex,
    pendingMultiSelectElements,
    setPendingMultiSelectElements,
    isReplySending,
    setIsReplySending,
    scrollY,
    setScrollY,
    isScrolling,
    setIsScrolling,
  };
}
