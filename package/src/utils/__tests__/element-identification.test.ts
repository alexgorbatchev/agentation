/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  getElementPath,
  identifyElement,
  identifyAnimationElement,
  getNearbyText,
  getNearbyElements,
  getElementClasses,
  getComputedStylesSnapshot,
  getDetailedComputedStyles,
  getForensicComputedStyles,
  parseComputedStylesString,
  getAccessibilityInfo,
  getFullElementPath,
  closestCrossingShadow,
  isInShadowDOM,
  getShadowHost,
} from "../element-identification";

beforeEach(() => {
  document.body.innerHTML = "";
});

// =============================================================================
// Shadow DOM helpers
// =============================================================================

describe("isInShadowDOM", () => {
  it("returns false for elements in the regular DOM", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    expect(isInShadowDOM(div)).toBe(false);
  });

  it("returns true for elements inside a shadow root", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });
    const inner = document.createElement("span");
    shadow.appendChild(inner);
    expect(isInShadowDOM(inner)).toBe(true);
  });
});

describe("getShadowHost", () => {
  it("returns null for regular DOM elements", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    expect(getShadowHost(div)).toBeNull();
  });

  it("returns the host element for shadow DOM elements", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });
    const inner = document.createElement("span");
    shadow.appendChild(inner);
    expect(getShadowHost(inner)).toBe(host);
  });
});

describe("closestCrossingShadow", () => {
  it("finds matching ancestor in regular DOM", () => {
    document.body.innerHTML = '<article><section><p id="target">text</p></section></article>';
    const target = document.getElementById("target")!;
    expect(closestCrossingShadow(target, "article")).toBe(
      document.querySelector("article")
    );
  });

  it("returns the element itself if it matches", () => {
    const div = document.createElement("div");
    div.classList.add("match");
    document.body.appendChild(div);
    expect(closestCrossingShadow(div, ".match")).toBe(div);
  });

  it("crosses shadow boundary to find host ancestors", () => {
    const host = document.createElement("div");
    host.classList.add("outer");
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });
    const inner = document.createElement("span");
    shadow.appendChild(inner);
    expect(closestCrossingShadow(inner, ".outer")).toBe(host);
  });

  it("returns null when no ancestor matches", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    expect(closestCrossingShadow(div, ".nonexistent")).toBeNull();
  });
});

// =============================================================================
// getElementPath
// =============================================================================

describe("getElementPath", () => {
  it("builds a readable path from nested elements", () => {
    document.body.innerHTML = "<article><section><p>text</p></section></article>";
    const target = document.querySelector("p") as HTMLElement;
    const path = getElementPath(target);
    expect(path).toContain("article");
    expect(path).toContain("section");
    expect(path).toContain("p");
  });

  it("uses #id shortcut when available", () => {
    document.body.innerHTML = '<div id="main"><span>text</span></div>';
    const span = document.querySelector("span") as HTMLElement;
    const path = getElementPath(span);
    expect(path).toContain("#main");
  });

  it("uses meaningful class names", () => {
    document.body.innerHTML = '<div class="sidebar-nav"><span>text</span></div>';
    const span = document.querySelector("span") as HTMLElement;
    const path = getElementPath(span);
    expect(path).toContain(".sidebar");
  });

  it("respects maxDepth limit", () => {
    document.body.innerHTML =
      "<div><div><div><div><div><span>deep</span></div></div></div></div></div>";
    const span = document.querySelector("span") as HTMLElement;
    const path = getElementPath(span, 2);
    const parts = path.split(" > ");
    expect(parts.length).toBeLessThanOrEqual(2);
  });

  it("stops at html/body", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const path = getElementPath(div, 10);
    expect(path).not.toContain("html");
    expect(path).not.toContain("body");
  });

  it("skips short or hash-like class names", () => {
    document.body.innerHTML = '<div class="ab XYZABC123"><span>text</span></div>';
    const span = document.querySelector("span") as HTMLElement;
    const path = getElementPath(span);
    // "ab" is too short, "XYZABC123" matches the hash regex → falls back to tag
    expect(path).toContain("div");
  });
});

// =============================================================================
// identifyElement
// =============================================================================

describe("identifyElement", () => {
  it("uses data-element attribute when present", () => {
    const div = document.createElement("div");
    div.dataset.element = "custom-label";
    document.body.appendChild(div);
    expect(identifyElement(div).name).toBe("custom-label");
  });

  describe("buttons", () => {
    it("identifies button by text content", () => {
      const btn = document.createElement("button");
      btn.textContent = "Submit";
      document.body.appendChild(btn);
      expect(identifyElement(btn).name).toBe('button "Submit"');
    });

    it("prefers aria-label over text content", () => {
      const btn = document.createElement("button");
      btn.textContent = "X";
      btn.setAttribute("aria-label", "Close dialog");
      document.body.appendChild(btn);
      expect(identifyElement(btn).name).toBe("button [Close dialog]");
    });

    it("falls back to generic button when empty", () => {
      const btn = document.createElement("button");
      document.body.appendChild(btn);
      expect(identifyElement(btn).name).toBe("button");
    });
  });

  describe("links", () => {
    it("identifies link by text content", () => {
      const a = document.createElement("a");
      a.textContent = "Learn more";
      a.setAttribute("href", "/docs");
      document.body.appendChild(a);
      expect(identifyElement(a).name).toBe('link "Learn more"');
    });

    it("falls back to href when no text", () => {
      const a = document.createElement("a");
      a.setAttribute("href", "https://example.com");
      document.body.appendChild(a);
      expect(identifyElement(a).name).toContain("link to");
      expect(identifyElement(a).name).toContain("example.com");
    });

    it("falls back to generic link", () => {
      const a = document.createElement("a");
      document.body.appendChild(a);
      expect(identifyElement(a).name).toBe("link");
    });
  });

  describe("inputs", () => {
    it("identifies input by placeholder", () => {
      const input = document.createElement("input");
      input.setAttribute("placeholder", "Search...");
      document.body.appendChild(input);
      expect(identifyElement(input).name).toBe('input "Search..."');
    });

    it("identifies input by name attribute", () => {
      const input = document.createElement("input");
      input.setAttribute("name", "email");
      document.body.appendChild(input);
      expect(identifyElement(input).name).toBe("input [email]");
    });

    it("falls back to type-based identification", () => {
      const input = document.createElement("input");
      input.setAttribute("type", "checkbox");
      document.body.appendChild(input);
      expect(identifyElement(input).name).toBe("checkbox input");
    });

    it("defaults to text input when type not specified", () => {
      const input = document.createElement("input");
      document.body.appendChild(input);
      expect(identifyElement(input).name).toBe("text input");
    });
  });

  describe("headings", () => {
    it("identifies heading with text", () => {
      const h2 = document.createElement("h2");
      h2.textContent = "Getting Started";
      document.body.appendChild(h2);
      expect(identifyElement(h2).name).toBe('h2 "Getting Started"');
    });

    it("falls back to tag name for empty heading", () => {
      const h3 = document.createElement("h3");
      document.body.appendChild(h3);
      expect(identifyElement(h3).name).toBe("h3");
    });
  });

  describe("text elements", () => {
    it("identifies paragraph with text preview", () => {
      const p = document.createElement("p");
      p.textContent = "This is a paragraph with some content.";
      document.body.appendChild(p);
      expect(identifyElement(p).name).toContain("paragraph:");
      expect(identifyElement(p).name).toContain("This is a paragraph");
    });

    it("truncates long paragraph text with ellipsis", () => {
      const p = document.createElement("p");
      p.textContent = "A".repeat(50);
      document.body.appendChild(p);
      expect(identifyElement(p).name).toContain("...");
    });

    it("identifies span with short text", () => {
      const span = document.createElement("span");
      span.textContent = "Badge";
      document.body.appendChild(span);
      expect(identifyElement(span).name).toBe('"Badge"');
    });

    it("identifies code element with backtick formatting", () => {
      const code = document.createElement("code");
      code.textContent = "npm install";
      document.body.appendChild(code);
      expect(identifyElement(code).name).toBe("code: `npm install`");
    });

    it("identifies pre as code block", () => {
      const pre = document.createElement("pre");
      document.body.appendChild(pre);
      expect(identifyElement(pre).name).toBe("code block");
    });

    it("identifies list item with text", () => {
      const li = document.createElement("li");
      li.textContent = "First item";
      document.body.appendChild(li);
      expect(identifyElement(li).name).toContain("list item");
      expect(identifyElement(li).name).toContain("First item");
    });
  });

  describe("media", () => {
    it("identifies image with alt text", () => {
      const img = document.createElement("img");
      img.setAttribute("alt", "Logo");
      document.body.appendChild(img);
      expect(identifyElement(img).name).toBe('image "Logo"');
    });

    it("falls back to generic image without alt", () => {
      const img = document.createElement("img");
      document.body.appendChild(img);
      expect(identifyElement(img).name).toBe("image");
    });

    it("identifies video element", () => {
      const video = document.createElement("video");
      document.body.appendChild(video);
      expect(identifyElement(video).name).toBe("video");
    });
  });

  describe("SVG elements", () => {
    it("identifies standalone svg as icon", () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      document.body.appendChild(svg);
      expect(identifyElement(svg as unknown as HTMLElement).name).toBe("icon");
    });

    it("identifies svg inside a button with text", () => {
      const btn = document.createElement("button");
      btn.textContent = "Menu";
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      btn.appendChild(svg);
      document.body.appendChild(btn);
      expect(identifyElement(svg as unknown as HTMLElement).name).toContain("Menu");
      expect(identifyElement(svg as unknown as HTMLElement).name).toContain("icon");
    });

    it("identifies path element as graphic element", () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      svg.appendChild(path);
      document.body.appendChild(svg);
      expect(identifyElement(path as unknown as HTMLElement).name).toContain("graphic");
    });
  });

  describe("containers", () => {
    it("uses aria-label when available", () => {
      const div = document.createElement("div");
      div.setAttribute("aria-label", "Navigation menu");
      document.body.appendChild(div);
      expect(identifyElement(div).name).toBe("div [Navigation menu]");
    });

    it("uses role attribute", () => {
      const div = document.createElement("div");
      div.setAttribute("role", "dialog");
      document.body.appendChild(div);
      expect(identifyElement(div).name).toBe("dialog");
    });

    it("extracts meaningful class words for containers", () => {
      const div = document.createElement("div");
      div.className = "hero-section main-content";
      document.body.appendChild(div);
      const name = identifyElement(div).name;
      expect(name).toContain("hero");
    });

    it("returns 'container' for a plain div", () => {
      const div = document.createElement("div");
      document.body.appendChild(div);
      expect(identifyElement(div).name).toBe("container");
    });

    it("returns semantic tag for section/nav/etc.", () => {
      const nav = document.createElement("nav");
      document.body.appendChild(nav);
      expect(identifyElement(nav).name).toBe("nav");
    });
  });

  it("returns tag name for unknown elements", () => {
    const table = document.createElement("table");
    document.body.appendChild(table);
    expect(identifyElement(table).name).toBe("table");
  });
});

// =============================================================================
// identifyAnimationElement
// =============================================================================

describe("identifyAnimationElement", () => {
  it("uses data-element attribute when present", () => {
    const div = document.createElement("div");
    div.dataset.element = "spinner";
    expect(identifyAnimationElement(div)).toBe("spinner");
  });

  it("returns simplified names for SVG elements", () => {
    const cases: Record<string, string> = {
      path: "path",
      circle: "circle",
      rect: "rectangle",
      line: "line",
      ellipse: "ellipse",
      polygon: "polygon",
      g: "group",
      svg: "svg",
    };
    for (const [tag, expected] of Object.entries(cases)) {
      const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
      expect(identifyAnimationElement(el as unknown as HTMLElement)).toBe(expected);
    }
  });

  it("identifies button with text", () => {
    const btn = document.createElement("button");
    btn.textContent = "Click me";
    expect(identifyAnimationElement(btn)).toBe('button "Click me"');
  });

  it("identifies input with type", () => {
    const input = document.createElement("input");
    input.setAttribute("type", "range");
    expect(identifyAnimationElement(input)).toBe("input (range)");
  });

  it("identifies text elements with short content", () => {
    const span = document.createElement("span");
    span.textContent = "Hello";
    expect(identifyAnimationElement(span)).toBe('"Hello"');
  });

  it("returns 'text' for long text content", () => {
    const p = document.createElement("p");
    p.textContent = "A".repeat(50);
    expect(identifyAnimationElement(p)).toBe("text");
  });

  it("extracts class-based name for divs", () => {
    const div = document.createElement("div");
    div.className = "loading-spinner";
    expect(identifyAnimationElement(div)).toContain("loading");
  });

  it("returns 'container' for a plain div", () => {
    const div = document.createElement("div");
    expect(identifyAnimationElement(div)).toBe("container");
  });
});

// =============================================================================
// getNearbyText
// =============================================================================

describe("getNearbyText", () => {
  it("includes element's own text", () => {
    const p = document.createElement("p");
    p.textContent = "Hello world";
    document.body.appendChild(p);
    expect(getNearbyText(p)).toContain("Hello world");
  });

  it("includes previous sibling text", () => {
    document.body.innerHTML = "<span>Before</span><span>Target</span>";
    const target = document.querySelectorAll("span")[1] as HTMLElement;
    const text = getNearbyText(target);
    expect(text).toContain('[before: "Before"]');
    expect(text).toContain("Target");
  });

  it("includes next sibling text", () => {
    document.body.innerHTML = "<span>Target</span><span>After</span>";
    const target = document.querySelector("span") as HTMLElement;
    const text = getNearbyText(target);
    expect(text).toContain("Target");
    expect(text).toContain('[after: "After"]');
  });

  it("skips own text longer than 100 chars", () => {
    const p = document.createElement("p");
    p.textContent = "A".repeat(101);
    document.body.appendChild(p);
    const text = getNearbyText(p);
    expect(text).not.toContain("A".repeat(101));
  });

  it("skips sibling text longer than 50 chars", () => {
    const prev = document.createElement("span");
    prev.textContent = "B".repeat(51);
    const target = document.createElement("span");
    target.textContent = "target";
    document.body.appendChild(prev);
    document.body.appendChild(target);
    const text = getNearbyText(target);
    expect(text).not.toContain("[before:");
    expect(text).toContain("target");
  });
});

// =============================================================================
// getNearbyElements
// =============================================================================

describe("getNearbyElements", () => {
  it("lists sibling elements", () => {
    document.body.innerHTML =
      '<div><span class="first">A</span><span id="target">B</span><span>C</span></div>';
    const target = document.getElementById("target") as HTMLElement;
    const nearby = getNearbyElements(target);
    expect(nearby).toContain("span");
  });

  it("returns empty string when no parent", () => {
    // documentElement has no parent element we care about
    const detached = document.createElement("div");
    expect(getNearbyElements(detached)).toBe("");
  });

  it("includes button/link text in sibling descriptions", () => {
    document.body.innerHTML =
      '<nav><button>Save</button><span id="target">sep</span><a href="/">Home</a></nav>';
    const target = document.getElementById("target") as HTMLElement;
    const nearby = getNearbyElements(target);
    expect(nearby).toContain("Save");
    expect(nearby).toContain("Home");
  });

  it("shows total count when more siblings than displayed", () => {
    document.body.innerHTML = `<div>
      <span>1</span><span>2</span><span>3</span>
      <span>4</span><span>5</span><span id="target">6</span>
    </div>`;
    const target = document.getElementById("target") as HTMLElement;
    const nearby = getNearbyElements(target);
    expect(nearby).toContain("total");
  });
});

// =============================================================================
// getElementClasses
// =============================================================================

describe("getElementClasses", () => {
  it("returns cleaned class names", () => {
    const div = document.createElement("div");
    div.className = "header sidebar";
    expect(getElementClasses(div)).toBe("header, sidebar");
  });

  it("strips CSS module hashes", () => {
    const div = document.createElement("div");
    div.className = "card_abc12345";
    expect(getElementClasses(div)).toBe("card");
  });

  it("deduplicates classes after hash removal", () => {
    const div = document.createElement("div");
    div.className = "btn_hash12345 btn_hash67890";
    expect(getElementClasses(div)).toBe("btn");
  });

  it("returns empty string for elements without classes", () => {
    const div = document.createElement("div");
    expect(getElementClasses(div)).toBe("");
  });

  it("handles SVG elements where className is not a string", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    // SVG className is an SVGAnimatedString, not a plain string
    expect(getElementClasses(svg as unknown as HTMLElement)).toBe("");
  });
});

// =============================================================================
// parseComputedStylesString
// =============================================================================

describe("parseComputedStylesString", () => {
  it("parses a semicolon-separated style string into a record", () => {
    const result = parseComputedStylesString("color: red; font-size: 16px");
    expect(result).toEqual({ color: "red", "font-size": "16px" });
  });

  it("returns undefined for undefined input", () => {
    expect(parseComputedStylesString(undefined)).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(parseComputedStylesString("")).toBeUndefined();
  });

  it("handles values containing colons (e.g., URLs)", () => {
    const result = parseComputedStylesString("background: url(http://example.com)");
    expect(result).toEqual({ background: "url(http://example.com)" });
  });

  it("skips malformed entries without colons", () => {
    const result = parseComputedStylesString("color: blue; badentry; font-size: 14px");
    expect(result).toEqual({ color: "blue", "font-size": "14px" });
  });

  it("trims whitespace from keys and values", () => {
    const result = parseComputedStylesString("  margin :  10px  ;  padding:  5px  ");
    expect(result).toEqual({ margin: "10px", padding: "5px" });
  });
});

// =============================================================================
// getAccessibilityInfo
// =============================================================================

describe("getAccessibilityInfo", () => {
  it("reports role attribute", () => {
    const div = document.createElement("div");
    div.setAttribute("role", "dialog");
    expect(getAccessibilityInfo(div)).toContain('role="dialog"');
  });

  it("reports aria-label", () => {
    const btn = document.createElement("button");
    btn.setAttribute("aria-label", "Close");
    const info = getAccessibilityInfo(btn);
    expect(info).toContain('aria-label="Close"');
  });

  it("reports aria-describedby", () => {
    const input = document.createElement("input");
    input.setAttribute("aria-describedby", "help-text");
    expect(getAccessibilityInfo(input)).toContain('aria-describedby="help-text"');
  });

  it("reports tabindex", () => {
    const div = document.createElement("div");
    div.setAttribute("tabindex", "0");
    document.body.appendChild(div);
    const info = getAccessibilityInfo(div);
    expect(info).toContain("tabindex=0");
    expect(info).toContain("focusable");
  });

  it("reports aria-hidden", () => {
    const div = document.createElement("div");
    div.setAttribute("aria-hidden", "true");
    expect(getAccessibilityInfo(div)).toContain("aria-hidden");
  });

  it("detects natively focusable elements", () => {
    const a = document.createElement("a");
    document.body.appendChild(a);
    expect(getAccessibilityInfo(a)).toContain("focusable");
  });

  it("returns empty string for elements with no a11y attributes", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    expect(getAccessibilityInfo(div)).toBe("");
  });
});

// =============================================================================
// getFullElementPath
// =============================================================================

describe("getFullElementPath", () => {
  it("builds full ancestry including tag and id", () => {
    document.body.innerHTML =
      '<div id="root"><article><p id="target">text</p></article></div>';
    const target = document.getElementById("target") as HTMLElement;
    const path = getFullElementPath(target);
    expect(path).toContain("div#root");
    expect(path).toContain("p#target");
    expect(path).toContain("article");
  });

  it("uses class name when no id", () => {
    document.body.innerHTML =
      '<div class="wrapper"><span>text</span></div>';
    const span = document.querySelector("span") as HTMLElement;
    const path = getFullElementPath(span);
    expect(path).toContain("div.wrapper");
  });

  it("stops before html element", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const path = getFullElementPath(div);
    expect(path).not.toContain("html");
  });
});

// =============================================================================
// getComputedStyles* — jsdom returns empty values, so test shape not values
// =============================================================================

describe("getComputedStylesSnapshot", () => {
  it("returns a string without throwing", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    expect(typeof getComputedStylesSnapshot(div)).toBe("string");
  });
});

describe("getDetailedComputedStyles", () => {
  it("returns an object without throwing", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const result = getDetailedComputedStyles(div);
    expect(typeof result).toBe("object");
  });

  it("selects different properties based on element type", () => {
    // Just verifying different element types don't crash
    for (const tag of ["p", "button", "input", "img", "div", "table"]) {
      const el = document.createElement(tag);
      document.body.appendChild(el);
      expect(() => getDetailedComputedStyles(el)).not.toThrow();
    }
  });
});

describe("getForensicComputedStyles", () => {
  it("returns a string without throwing", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    expect(typeof getForensicComputedStyles(div)).toBe("string");
  });
});
