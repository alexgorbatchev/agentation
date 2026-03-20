export function normalizeNeovimBridgeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}
