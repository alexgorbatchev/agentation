import type { Dispatch, SetStateAction } from "react";

import { formatComponentSourcePath } from "../../../utils/component-inspector";
import type { ComponentInspection } from "../../../utils/component-inspector";
import type { ComponentMenuState } from "../hooks/useInteractionLifecycle";
import {
  ComponentSourceMenuView,
  type ComponentSourceMenuViewItem,
} from "./ComponentSourceMenuView";

type ComponentSourceMenuProps = {
  componentMenu: ComponentMenuState | null;
  isDarkMode: boolean;
  hoveredComponentMenuIndex: number | null;
  setHoveredComponentMenuIndex: Dispatch<SetStateAction<number | null>>;
  openComponentSource: (item: ComponentInspection) => Promise<void>;
};

export function ComponentSourceMenu({
  componentMenu,
  isDarkMode,
  hoveredComponentMenuIndex,
  setHoveredComponentMenuIndex,
  openComponentSource,
}: ComponentSourceMenuProps): JSX.Element | null {
  if (!componentMenu) {
    return null;
  }

  const items: ComponentSourceMenuViewItem[] = componentMenu.items.map((item, index) => ({
    key: `${item.displayName}-${item.source.fileName}-${item.source.lineNumber}-${index}`,
    displayName: item.displayName,
    props: Object.keys(item.props).map((propName) => ({
      name: propName,
      title: item.props[propName],
    })),
    sourceLabel: formatComponentSourcePath(item.source),
  }));

  return (
    <ComponentSourceMenuView
      items={items}
      isDarkMode={isDarkMode}
      hoveredComponentMenuIndex={hoveredComponentMenuIndex}
      setHoveredComponentMenuIndex={(index) => setHoveredComponentMenuIndex(index)}
      onItemClick={(index) => {
        const selectedItem: ComponentInspection | undefined = componentMenu.items[index];
        if (!selectedItem) {
          return;
        }
        void openComponentSource(selectedItem);
      }}
      position={{ x: componentMenu.x, y: componentMenu.y }}
    />
  );
}
