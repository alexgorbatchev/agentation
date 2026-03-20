const GENERIC_CONTAINER_TAGS = new Set([
  "DIV",
  "SPAN",
  "SECTION",
  "ARTICLE",
  "MAIN",
  "ASIDE",
  "HEADER",
  "FOOTER",
  "NAV",
]);

function pierceShadowDOM(element: HTMLElement, x: number, y: number): HTMLElement {
  let current = element;
  while (current.shadowRoot) {
    const deeper = current.shadowRoot.elementFromPoint(x, y) as HTMLElement | null;
    if (!deeper || deeper === current) {
      break;
    }
    current = deeper;
  }
  return current;
}

function isEffectivelyInvisible(element: HTMLElement): boolean {
  if (typeof element.checkVisibility === "function") {
    return !element.checkVisibility({
      checkOpacity: true,
      checkVisibilityCSS: true,
    });
  }

  let current: HTMLElement | null = element;
  while (current && current !== document.body) {
    if (window.getComputedStyle(current).opacity === "0") {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

function hasDirectContent(element: HTMLElement): boolean {
  if (!GENERIC_CONTAINER_TAGS.has(element.tagName)) {
    return true;
  }

  for (const child of element.childNodes) {
    if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
      return true;
    }
  }

  return false;
}

export function deepElementFromPoint(x: number, y: number): HTMLElement | null {
  const element = document.elementFromPoint(x, y) as HTMLElement | null;
  if (!element) {
    return null;
  }
  return pierceShadowDOM(element, x, y);
}

export function pierceElementFromPoint(
  x: number,
  y: number,
): HTMLElement | null {
  const topElement = document.elementFromPoint(x, y) as HTMLElement | null;
  if (!topElement) {
    return null;
  }

  const pierced = pierceShadowDOM(topElement, x, y);
  if (hasDirectContent(pierced) && !isEffectivelyInvisible(pierced)) {
    return pierced;
  }

  const allElements = document.elementsFromPoint(x, y) as HTMLElement[];

  for (const candidate of allElements) {
    if (candidate === topElement) {
      continue;
    }
    if (candidate === document.documentElement || candidate === document.body) {
      continue;
    }

    const deep = pierceShadowDOM(candidate, x, y);
    if (hasDirectContent(deep) && !isEffectivelyInvisible(deep)) {
      return deep;
    }
  }

  const topRect = pierced.getBoundingClientRect();
  const topArea = topRect.width * topRect.height;
  let smallest: HTMLElement | null = null;
  let smallestArea = topArea;

  for (const candidate of allElements) {
    if (candidate === topElement) {
      continue;
    }
    if (candidate === document.documentElement || candidate === document.body) {
      continue;
    }
    if (isEffectivelyInvisible(candidate)) {
      continue;
    }

    const deep = pierceShadowDOM(candidate, x, y);
    const rect = deep.getBoundingClientRect();
    const area = rect.width * rect.height;
    if (area > 0 && area < smallestArea) {
      smallest = deep;
      smallestArea = area;
    }
  }

  return smallest || pierced;
}

export function isElementFixed(element: HTMLElement): boolean {
  let current: HTMLElement | null = element;
  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    const position = style.position;
    if (position === "fixed" || position === "sticky") {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}
