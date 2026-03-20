import type { OutputDetailLevel } from "./state/toolbar-settings";
import type { ReactComponentMode } from "./types";

export type OutputDetailOption = {
  value: OutputDetailLevel;
  label: string;
};

export type ColorOption = {
  value: string;
  label: string;
};

export const OUTPUT_TO_REACT_MODE: Record<OutputDetailLevel, ReactComponentMode> = {
  compact: "off",
  standard: "filtered",
  detailed: "smart",
  forensic: "all",
};

export const OUTPUT_DETAIL_OPTIONS: OutputDetailOption[] = [
  { value: "compact", label: "Compact" },
  { value: "standard", label: "Standard" },
  { value: "detailed", label: "Detailed" },
  { value: "forensic", label: "Forensic" },
];

export const COLOR_OPTIONS: ColorOption[] = [
  { value: "#AF52DE", label: "Purple" },
  { value: "#3c82f7", label: "Blue" },
  { value: "#5AC8FA", label: "Cyan" },
  { value: "#34C759", label: "Green" },
  { value: "#FFD60A", label: "Yellow" },
  { value: "#FF9500", label: "Orange" },
  { value: "#FF3B30", label: "Red" },
];
