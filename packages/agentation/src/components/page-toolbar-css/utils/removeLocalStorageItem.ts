export function removeLocalStorageItem(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // localStorage may be unavailable or blocked
  }
}
