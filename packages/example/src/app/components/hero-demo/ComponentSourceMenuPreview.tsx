import type { CSSProperties, Ref } from "react";

import {
  ComponentSourceMenuView,
  type ComponentSourceMenuViewItem,
} from "../../../../../agentation/src/components/page-toolbar-css/components/ComponentSourceMenuView";

const noop = (): void => {};

export type ComponentSourceMenuPreviewItem = {
  key?: string;
  displayName: string;
  props: string[];
  sourceLabel: string;
};

export type ComponentSourceMenuPreviewProps = {
  items: ComponentSourceMenuPreviewItem[];
  position: { x: number; y: number };
  isDarkMode?: boolean;
  hoveredComponentMenuIndex: number | null;
  setHoveredComponentMenuIndex: (index: number | null) => void;
  className?: string;
  style?: CSSProperties;
  itemRefs?: Array<Ref<HTMLButtonElement> | undefined>;
  interactive?: boolean;
};

export function ComponentSourceMenuPreview({
  items,
  position,
  isDarkMode = true,
  hoveredComponentMenuIndex,
  setHoveredComponentMenuIndex,
  className,
  style,
  itemRefs,
  interactive = false,
}: ComponentSourceMenuPreviewProps): JSX.Element | null {
  const viewItems: ComponentSourceMenuViewItem[] = items.map((item, index) => ({
    key: item.key ?? `${item.displayName}-${item.sourceLabel}-${index}`,
    displayName: item.displayName,
    props: item.props.map((propName) => ({ name: propName })),
    sourceLabel: item.sourceLabel,
  }));

  return (
    <ComponentSourceMenuView
      items={viewItems}
      isDarkMode={isDarkMode}
      hoveredComponentMenuIndex={hoveredComponentMenuIndex}
      setHoveredComponentMenuIndex={setHoveredComponentMenuIndex}
      onItemClick={noop}
      position={position}
      positionMode="absolute"
      className={className}
      style={{
        pointerEvents: interactive ? undefined : "none",
        ...style,
      }}
      itemRefs={itemRefs}
      interactive={interactive}
    />
  );
}
