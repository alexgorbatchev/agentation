import { identifyElement } from "../../../utils/element-identification";
import { getReactComponentName } from "../../../utils/react-detection";
import type { ReactComponentMode } from "../types";

export type IdentifiedElementWithReact = {
  /** Combined name for display (React path + element) */
  name: string;
  /** Raw element name without React path */
  elementName: string;
  /** DOM path */
  path: string;
  /** React component path (e.g., '<SideNav> <LinkComponent>') */
  reactComponents: string | null;
};

export function identifyElementWithReact(
  element: HTMLElement,
  reactMode: ReactComponentMode = "filtered",
): IdentifiedElementWithReact {
  const { name: elementName, path } = identifyElement(element);

  if (reactMode === "off") {
    return { name: elementName, elementName, path, reactComponents: null };
  }

  const reactInfo = getReactComponentName(element, { mode: reactMode });

  return {
    name: reactInfo.path ? `${reactInfo.path} ${elementName}` : elementName,
    elementName,
    path,
    reactComponents: reactInfo.path,
  };
}
