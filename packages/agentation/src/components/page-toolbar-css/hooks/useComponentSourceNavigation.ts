import { useCallback } from "react";

import {
  createComponentSourceUrl,
  formatComponentSourcePath,
  type ComponentEditor,
  type ComponentInspection,
  type ComponentSourceUrlParams,
} from "../../../utils/component-inspector";

type UseComponentSourceNavigationParams = {
  copyComponentSourcePath: boolean;
  componentEditor: ComponentEditor;
  getComponentEditorUrl?: (params: ComponentSourceUrlParams) => string;
  normalizedNeovimBridgeUrl: string;
  neovimProjectId?: string;
  navigateToUrl: (url: string) => void;
  closeComponentMenu: () => void;
};

type UseComponentSourceNavigationResult = {
  openComponentSource: (item: ComponentInspection) => Promise<void>;
};

export function useComponentSourceNavigation({
  copyComponentSourcePath,
  componentEditor,
  getComponentEditorUrl,
  normalizedNeovimBridgeUrl,
  neovimProjectId,
  navigateToUrl,
  closeComponentMenu,
}: UseComponentSourceNavigationParams): UseComponentSourceNavigationResult {
  const openComponentSource = useCallback(
    async (item: ComponentInspection): Promise<void> => {
      const sourcePath = formatComponentSourcePath(item.source);

      if (copyComponentSourcePath) {
        try {
          await navigator.clipboard.writeText(sourcePath);
        } catch {
          // Ignore clipboard failures and still attempt editor navigation.
        }
      }

      const url = createComponentSourceUrl(
        item.source,
        componentEditor,
        getComponentEditorUrl,
        normalizedNeovimBridgeUrl,
        neovimProjectId,
      );

      if (
        componentEditor === "neovim" &&
        /^https?:\/\//.test(url) &&
        typeof fetch === "function"
      ) {
        try {
          await fetch(url, {
            method: "GET",
            mode: "cors",
            keepalive: true,
          });
        } catch {
          // Ignore local bridge failures and keep the menu behavior predictable.
        }
      } else {
        navigateToUrl(url);
      }

      closeComponentMenu();
    },
    [
      closeComponentMenu,
      componentEditor,
      copyComponentSourcePath,
      getComponentEditorUrl,
      navigateToUrl,
      neovimProjectId,
      normalizedNeovimBridgeUrl,
    ],
  );

  return { openComponentSource };
}
