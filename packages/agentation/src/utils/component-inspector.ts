import {
  resolveStandardFiberSource,
  type SourceLocation,
  type StandardSourceCarrier,
} from "./source-location";

type ComponentType = {
  name?: string;
  displayName?: string;
  render?: ComponentType;
  type?: ComponentType;
  defaultProps?: Record<string, unknown>;
};

type ReactFiber = StandardSourceCarrier & {
  type?: ComponentType | string | null;
  _debugOwner?: ReactFiber | null;
  return?: ReactFiber | null;
};

type ReactRenderer = {
  findFiberByHostInstance(element: HTMLElement): ReactFiber | null;
};

type ReactDevToolsHook = {
  renderers?: Map<number, ReactRenderer>;
};

export type ComponentEditor =
  | "cursor"
  | "neovim"
  | "vscode"
  | "vscode-insiders"
  | "webstorm";

export type ComponentSourceUrlParams = {
  path: string;
  line: number;
  column: number;
  projectId?: string;
  bridgeUrl?: string;
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
    if (
      (key.startsWith("__reactInternalInstance$") || key.startsWith("__reactFiber$")) &&
      value
    ) {
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
  return (
    type.displayName ||
    type.name ||
    type.render?.displayName ||
    type.render?.name ||
    type.type?.displayName ||
    type.type?.name ||
    "Component"
  );
}

function getComponentName(instance: ReactFiber): string | null {
  const displayName = getDisplayName(instance);
  return displayName === "Component" ? null : displayName;
}

function getSource(instance: ReactFiber): SourceLocation | null {
  const resolvedSource = resolveStandardFiberSource(instance, getComponentName);
  return resolvedSource?.source ?? null;
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

    const defaultValue =
      typeof instance.type === "object" && instance.type !== null
        ? instance.type.defaultProps?.[key]
        : undefined;
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
  const seenSources = new Set<string>();
  const results: ComponentInspection[] = [];

  let current = getFiberFromElement(element);
  while (current) {
    if (seen.has(current)) {
      break;
    }
    seen.add(current);

    const source = getSource(current);
    if (source) {
      const sourceKey = `${source.fileName}:${source.lineNumber}:${source.columnNumber ?? 0}`;
      if (!seenSources.has(sourceKey)) {
        seenSources.add(sourceKey);
        results.push({
          displayName: source.componentName || getDisplayName(current),
          props: getProps(current),
          source,
        });
      }
    }

    current = current._debugOwner ?? current.return ?? null;
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

function normalizeBridgeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export function createComponentSourceUrl(
  source: SourceLocation,
  editor: ComponentEditor,
  getEditorUrl?: (params: ComponentSourceUrlParams) => string,
  neovimBridgeUrl = "http://127.0.0.1:8777",
  neovimProjectId?: string,
): string {
  const params: ComponentSourceUrlParams = {
    path: toProjectRelativePath(source.fileName),
    line: source.lineNumber,
    column: source.columnNumber ?? 1,
    projectId: neovimProjectId,
    bridgeUrl: normalizeBridgeUrl(neovimBridgeUrl),
  };

  if (getEditorUrl) {
    return getEditorUrl(params);
  }

  switch (editor) {
    case "cursor":
      return `cursor://open?url=file:/${params.path}&line=${params.line}&column=${params.column}`;
    case "neovim": {
      const projectIdQuery = params.projectId
        ? `&projectId=${encodeURIComponent(params.projectId)}`
        : "";
      return `${params.bridgeUrl}/open?path=${encodeURIComponent(params.path)}&line=${params.line}&column=${params.column}${projectIdQuery}`;
    }
    case "vscode-insiders":
      return `vscode-insiders://file/${params.path}:${params.line}:${params.column}`;
    case "webstorm":
      return `webstorm://open?file=/${params.path}&line=${params.line}`;
    case "vscode":
    default:
      return `vscode://file/${params.path}:${params.line}:${params.column}`;
  }
}
