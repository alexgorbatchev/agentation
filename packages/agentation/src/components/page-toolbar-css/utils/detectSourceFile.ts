import {
  findNearestComponentSource,
  formatSourceLocation,
  getSourceLocation,
} from "../../../utils/source-location";

export function detectSourceFile(element: Element): string | undefined {
  const result = getSourceLocation(element as HTMLElement);
  const sourceLocation = result.found
    ? result
    : findNearestComponentSource(element as HTMLElement);

  if (!sourceLocation.found || !sourceLocation.source) {
    return undefined;
  }

  return formatSourceLocation(sourceLocation.source, "path");
}
