import type { SourceLocation } from "./source-location";

type ComponentType = {
  name?: string;
  displayName?: string;
  render?: ComponentType;
  type?: ComponentType;
  defaultProps?: Record<string, unknown>;
};

type ReactFiber = {
  type?: ComponentType | string | null;
  _debugOwner?: ReactFiber | null;
  _debugSource?: {
    fileName: string;
    lineNumber: number;
    columnNumber?: number;
  } | null;
  memoizedProps?: Record<string, unknown>;
};

type ReactRenderer = {
  findFiberByHostInstance(element: HTMLElement): ReactFiber | null;
};

type ReactDevToolsHook = {
  renderers?: Map<number, ReactRenderer>;
};

export type ComponentEditor = "cursor" | "vscode" | "vscode-insiders" | "webstorm";

export type ComponentSourceUrlParams = {
  path: string;
  line: number;
  column: number;
};

export type ComponentInspection = {
  displayName: string;
  props: Record<string, string>;
  source: SourceLocation;
};

function getDevToolsHook(): ReactDevToolsHook | null {
  const value = Reflect.get(window, "__REACT_DEVTOOLS_GLOBAL_HOOK__");
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as ReactDevToolsHook;
}

function getFiberFromDevTools(element: HTMLElement): ReactFiber | null {
  const hook = getDevToolsHook();
  if (!hook?.renderers) {
    return null;
  }

  for (const renderer of hook.renderers.values()) {
    try {
      const fiber = renderer.findFiberByHostInstance(element);
      if (fiber) {
        return fiber;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function getFiberFromElement(element: HTMLElement): ReactFiber | null {
  const fromDevTools = getFiberFromDevTools(element);
  if (fromDevTools) {
    return fromDevTools;
  }

  const entries = Object.entries(element as unknown as Record<string, unknown>);
  for (const [key, value] of entries) {
    if ((key.startsWith("__reactInternalInstance$") || key.startsWith("__reactFiber$")) && value) {
      return value as ReactFiber;
    }
  }

  return null;
}

function getDisplayName(instance: ReactFiber): string {
  const type = instance.type;
  if (!type || typeof type === "string") {
    return "Component";
  }
  return type.displayName || type.name || type.render?.displayName || type.render?.name || type.type?.displayName || type.type?.name || "Component";
}

function getSource(instance: ReactFiber): SourceLocation | null {
  const source = instance._debugSource || instance._debugOwner?._debugSource;
  if (!source?.fileName || !source.lineNumber) {
    return null;
  }

  return {
    fileName: source.fileName,
    lineNumber: source.lineNumber,
    columnNumber: source.columnNumber,
    componentName: getDisplayName(instance),
  };
}

function getProps(instance: ReactFiber): Record<string, string> {
  const props = instance.memoizedProps;
  if (!props) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(props)) {
    if (key === "key") {
      continue;
    }

    const defaultValue = typeof instance.type === "object" && instance.type !== null ? instance.type.defaultProps?.[key] : undefined;
    if (value === defaultValue) {
      continue;
    }

    const valueType = typeof value;
    if (valueType === "string" || valueType === "number" || valueType === "boolean") {
      result[key] = String(value);
    }
  }

  return result;
}

export function inspectComponentElement(element: HTMLElement): ComponentInspection[] {
  const seen = new Set<ReactFiber>();
  const results: ComponentInspection[] = [];

  let current = getFiberFromElement(element);
  while (current) {
    if (seen.has(current)) {
      break;
    }
    seen.add(current);

    const source = getSource(current);
    if (source) {
      results.push({
        displayName: getDisplayName(current),
        props: getProps(current),
        source,
      });
    }

    current = current._debugOwner ?? null;
  }

  return results;
}

function trimPath(path: string): string {
  return path.replace(/^\.?\//, "");
}

function toProjectRelativePath(path: string): string {
  const normalizedPath = trimPath(path);
  const match = normalizedPath.match(/(?:^|\/)(src|app|pages)\/.+$/);
  if (match?.index !== undefined) {
    return normalizedPath.slice(match.index + (normalizedPath[match.index] === "/" ? 1 : 0));
  }
  return normalizedPath;
}

export function formatComponentSourcePath(source: SourceLocation): string {
  return `${toProjectRelativePath(source.fileName)}:${source.lineNumber}${source.columnNumber ? `:${source.columnNumber}` : ""}`;
}

export function createComponentSourceUrl(
  source: SourceLocation,
  editor: ComponentEditor,
  getEditorUrl?: (params: ComponentSourceUrlParams) => string,
): string {
  const params: ComponentSourceUrlParams = {
    path: toProjectRelativePath(source.fileName),
    line: source.lineNumber,
    column: source.columnNumber ?? 1,
  };

  if (getEditorUrl) {
    return getEditorUrl(params);
  }

  switch (editor) {
    case "cursor":
      return `cursor://open?url=file:/${params.path}&line=${params.line}&column=${params.column}`;
    case "vscode-insiders":
      return `vscode-insiders://file/${params.path}:${params.line}:${params.column}`;
    case "webstorm":
      return `webstorm://open?file=/${params.path}&line=${params.line}`;
    case "vscode":
    default:
      return `vscode://file/${params.path}:${params.line}:${params.column}`;
  }
}
