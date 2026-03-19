/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  IconClose,
  IconPlus,
  IconCheck,
  IconCheckSmall,
  IconListSparkle,
  IconHelp,
  IconCheckSmallAnimated,
  IconCopyAlt,
  IconCopyAnimated,
  IconSendArrow,
  IconSendAnimated,
  IconEye,
  IconEyeAlt,
  IconEyeClosed,
  IconEyeAnimated,
  IconPausePlayAnimated,
  IconEyeMinus,
  IconGear,
  IconPauseAlt,
  IconPause,
  IconPlayAlt,
  IconTrashAlt,
  IconChatEllipsis,
  IconCheckmark,
  IconCheckmarkLarge,
  IconCheckmarkCircle,
  IconXmark,
  IconXmarkLarge,
  IconSun,
  IconMoon,
  IconEdit,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
  AnimatedBunny,
} from "../icons";

import {
  IconClose as GroupedIconClose,
  IconPlus as GroupedIconPlus,
  IconCheck as GroupedIconCheck,
  IconCheckSmall as GroupedIconCheckSmall,
  IconListSparkle as GroupedIconListSparkle,
  IconHelp as GroupedIconHelp,
  IconCheckSmallAnimated as GroupedIconCheckSmallAnimated,
  IconCopyAlt as GroupedIconCopyAlt,
  IconCopyAnimated as GroupedIconCopyAnimated,
  IconSendArrow as GroupedIconSendArrow,
  IconSendAnimated as GroupedIconSendAnimated,
  IconEye as GroupedIconEye,
  IconEyeAlt as GroupedIconEyeAlt,
  IconEyeClosed as GroupedIconEyeClosed,
  IconEyeAnimated as GroupedIconEyeAnimated,
  IconPausePlayAnimated as GroupedIconPausePlayAnimated,
  IconEyeMinus as GroupedIconEyeMinus,
  IconGear as GroupedIconGear,
  IconPauseAlt as GroupedIconPauseAlt,
  IconPause as GroupedIconPause,
  IconPlayAlt as GroupedIconPlayAlt,
  IconTrashAlt as GroupedIconTrashAlt,
  IconChatEllipsis as GroupedIconChatEllipsis,
  IconCheckmark as GroupedIconCheckmark,
  IconCheckmarkLarge as GroupedIconCheckmarkLarge,
  IconCheckmarkCircle as GroupedIconCheckmarkCircle,
  IconXmark as GroupedIconXmark,
  IconXmarkLarge as GroupedIconXmarkLarge,
  IconSun as GroupedIconSun,
  IconMoon as GroupedIconMoon,
  IconEdit as GroupedIconEdit,
  IconTrash as GroupedIconTrash,
  IconChevronLeft as GroupedIconChevronLeft,
  IconChevronRight as GroupedIconChevronRight,
  AnimatedBunny as GroupedAnimatedBunny,
} from "../icons/index";

// =============================================================================
// Simple icons (size-only props)
// =============================================================================

const simpleIcons = [
  { name: "IconClose", Component: IconClose },
  { name: "IconPlus", Component: IconPlus },
  { name: "IconCheck", Component: IconCheck },
  { name: "IconCheckSmall", Component: IconCheckSmall },
  { name: "IconListSparkle", Component: IconListSparkle },
  { name: "IconHelp", Component: IconHelp },
  { name: "IconCheckSmallAnimated", Component: IconCheckSmallAnimated },
  { name: "IconCopyAlt", Component: IconCopyAlt },
  { name: "IconEye", Component: IconEye },
  { name: "IconEyeAlt", Component: IconEyeAlt },
  { name: "IconEyeClosed", Component: IconEyeClosed },
  { name: "IconEyeMinus", Component: IconEyeMinus },
  { name: "IconGear", Component: IconGear },
  { name: "IconPauseAlt", Component: IconPauseAlt },
  { name: "IconPause", Component: IconPause },
  { name: "IconPlayAlt", Component: IconPlayAlt },
  { name: "IconTrashAlt", Component: IconTrashAlt },
  { name: "IconChatEllipsis", Component: IconChatEllipsis },
  { name: "IconCheckmark", Component: IconCheckmark },
  { name: "IconCheckmarkLarge", Component: IconCheckmarkLarge },
  { name: "IconCheckmarkCircle", Component: IconCheckmarkCircle },
  { name: "IconXmark", Component: IconXmark },
  { name: "IconXmarkLarge", Component: IconXmarkLarge },
  { name: "IconSun", Component: IconSun },
  { name: "IconMoon", Component: IconMoon },
  { name: "IconEdit", Component: IconEdit },
  { name: "IconTrash", Component: IconTrash },
  { name: "IconChevronLeft", Component: IconChevronLeft },
  { name: "IconChevronRight", Component: IconChevronRight },
] as const;

const iconExportPairs = [
  { name: "IconClose", legacy: IconClose, grouped: GroupedIconClose },
  { name: "IconPlus", legacy: IconPlus, grouped: GroupedIconPlus },
  { name: "IconCheck", legacy: IconCheck, grouped: GroupedIconCheck },
  { name: "IconCheckSmall", legacy: IconCheckSmall, grouped: GroupedIconCheckSmall },
  { name: "IconListSparkle", legacy: IconListSparkle, grouped: GroupedIconListSparkle },
  { name: "IconHelp", legacy: IconHelp, grouped: GroupedIconHelp },
  { name: "IconCheckSmallAnimated", legacy: IconCheckSmallAnimated, grouped: GroupedIconCheckSmallAnimated },
  { name: "IconCopyAlt", legacy: IconCopyAlt, grouped: GroupedIconCopyAlt },
  { name: "IconCopyAnimated", legacy: IconCopyAnimated, grouped: GroupedIconCopyAnimated },
  { name: "IconSendArrow", legacy: IconSendArrow, grouped: GroupedIconSendArrow },
  { name: "IconSendAnimated", legacy: IconSendAnimated, grouped: GroupedIconSendAnimated },
  { name: "IconEye", legacy: IconEye, grouped: GroupedIconEye },
  { name: "IconEyeAlt", legacy: IconEyeAlt, grouped: GroupedIconEyeAlt },
  { name: "IconEyeClosed", legacy: IconEyeClosed, grouped: GroupedIconEyeClosed },
  { name: "IconEyeAnimated", legacy: IconEyeAnimated, grouped: GroupedIconEyeAnimated },
  { name: "IconPausePlayAnimated", legacy: IconPausePlayAnimated, grouped: GroupedIconPausePlayAnimated },
  { name: "IconEyeMinus", legacy: IconEyeMinus, grouped: GroupedIconEyeMinus },
  { name: "IconGear", legacy: IconGear, grouped: GroupedIconGear },
  { name: "IconPauseAlt", legacy: IconPauseAlt, grouped: GroupedIconPauseAlt },
  { name: "IconPause", legacy: IconPause, grouped: GroupedIconPause },
  { name: "IconPlayAlt", legacy: IconPlayAlt, grouped: GroupedIconPlayAlt },
  { name: "IconTrashAlt", legacy: IconTrashAlt, grouped: GroupedIconTrashAlt },
  { name: "IconChatEllipsis", legacy: IconChatEllipsis, grouped: GroupedIconChatEllipsis },
  { name: "IconCheckmark", legacy: IconCheckmark, grouped: GroupedIconCheckmark },
  { name: "IconCheckmarkLarge", legacy: IconCheckmarkLarge, grouped: GroupedIconCheckmarkLarge },
  { name: "IconCheckmarkCircle", legacy: IconCheckmarkCircle, grouped: GroupedIconCheckmarkCircle },
  { name: "IconXmark", legacy: IconXmark, grouped: GroupedIconXmark },
  { name: "IconXmarkLarge", legacy: IconXmarkLarge, grouped: GroupedIconXmarkLarge },
  { name: "IconSun", legacy: IconSun, grouped: GroupedIconSun },
  { name: "IconMoon", legacy: IconMoon, grouped: GroupedIconMoon },
  { name: "IconEdit", legacy: IconEdit, grouped: GroupedIconEdit },
  { name: "IconTrash", legacy: IconTrash, grouped: GroupedIconTrash },
  { name: "IconChevronLeft", legacy: IconChevronLeft, grouped: GroupedIconChevronLeft },
  { name: "IconChevronRight", legacy: IconChevronRight, grouped: GroupedIconChevronRight },
  { name: "AnimatedBunny", legacy: AnimatedBunny, grouped: GroupedAnimatedBunny },
] as const;

describe("Icon components", () => {
  describe.each(iconExportPairs)("$name export parity", ({ legacy, grouped }) => {
    it("matches between legacy icons.tsx and grouped icons/index.ts", () => {
      expect(grouped).toBe(legacy);
    });
  });

  // ---------------------------------------------------------------------------
  // Simple icons: render with defaults and custom size
  // ---------------------------------------------------------------------------

  describe.each(simpleIcons)("$name", ({ Component }) => {
    it("renders without throwing", () => {
      const { container } = render(<Component />);
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("renders an SVG element", () => {
      const { container } = render(<Component />);
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg!.tagName.toLowerCase()).toBe("svg");
    });

    it("accepts a custom size prop", () => {
      const { container } = render(<Component size={32} />);
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg!.getAttribute("width")).toBe("32");
      expect(svg!.getAttribute("height")).toBe("32");
    });
  });

  // ---------------------------------------------------------------------------
  // IconCopyAnimated (copied prop)
  // ---------------------------------------------------------------------------

  describe("IconCopyAnimated", () => {
    it("renders without throwing (default)", () => {
      const { container } = render(<IconCopyAnimated />);
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("renders in copied=false state", () => {
      const { container } = render(<IconCopyAnimated copied={false} />);
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("renders in copied=true state", () => {
      const { container } = render(<IconCopyAnimated copied={true} />);
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("accepts a custom size prop", () => {
      const { container } = render(<IconCopyAnimated size={48} />);
      const svg = container.querySelector("svg");
      expect(svg!.getAttribute("width")).toBe("48");
      expect(svg!.getAttribute("height")).toBe("48");
    });
  });

  // ---------------------------------------------------------------------------
  // IconSendArrow (state prop)
  // ---------------------------------------------------------------------------

  describe("IconSendArrow", () => {
    it("renders without throwing (default)", () => {
      const { container } = render(<IconSendArrow />);
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("renders in idle state", () => {
      const { container } = render(<IconSendArrow state="idle" />);
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("renders in sending state", () => {
      const { container } = render(<IconSendArrow state="sending" />);
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("renders in sent state", () => {
      const { container } = render(<IconSendArrow state="sent" />);
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("renders in failed state", () => {
      const { container } = render(<IconSendArrow state="failed" />);
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("accepts a custom size prop", () => {
      const { container } = render(<IconSendArrow size={36} />);
      const svg = container.querySelector("svg");
      expect(svg!.getAttribute("width")).toBe("36");
      expect(svg!.getAttribute("height")).toBe("36");
    });
  });

  // ---------------------------------------------------------------------------
  // IconSendAnimated (sent prop)
  // ---------------------------------------------------------------------------

  describe("IconSendAnimated", () => {
    it("renders without throwing (default)", () => {
      const { container } = render(<IconSendAnimated />);
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("renders in sent=false state", () => {
      const { container } = render(<IconSendAnimated sent={false} />);
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("renders in sent=true state", () => {
      const { container } = render(<IconSendAnimated sent={true} />);
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("accepts a custom size prop", () => {
      const { container } = render(<IconSendAnimated size={40} />);
      const svg = container.querySelector("svg");
      expect(svg!.getAttribute("width")).toBe("40");
      expect(svg!.getAttribute("height")).toBe("40");
    });
  });

  // ---------------------------------------------------------------------------
  // IconEyeAnimated (isOpen prop)
  // ---------------------------------------------------------------------------

  describe("IconEyeAnimated", () => {
    it("renders without throwing (default)", () => {
      const { container } = render(<IconEyeAnimated />);
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("renders in isOpen=true state", () => {
      const { container } = render(<IconEyeAnimated isOpen={true} />);
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("renders in isOpen=false state", () => {
      const { container } = render(<IconEyeAnimated isOpen={false} />);
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("accepts a custom size prop", () => {
      const { container } = render(<IconEyeAnimated size={28} />);
      const svg = container.querySelector("svg");
      expect(svg!.getAttribute("width")).toBe("28");
      expect(svg!.getAttribute("height")).toBe("28");
    });
  });

  // ---------------------------------------------------------------------------
  // IconPausePlayAnimated (isPaused prop)
  // ---------------------------------------------------------------------------

  describe("IconPausePlayAnimated", () => {
    it("renders without throwing (default)", () => {
      const { container } = render(<IconPausePlayAnimated />);
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("renders in isPaused=false state (pause icon)", () => {
      const { container } = render(<IconPausePlayAnimated isPaused={false} />);
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("renders in isPaused=true state (play icon)", () => {
      const { container } = render(<IconPausePlayAnimated isPaused={true} />);
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("accepts a custom size prop", () => {
      const { container } = render(<IconPausePlayAnimated size={44} />);
      const svg = container.querySelector("svg");
      expect(svg!.getAttribute("width")).toBe("44");
      expect(svg!.getAttribute("height")).toBe("44");
    });
  });

  // ---------------------------------------------------------------------------
  // AnimatedBunny (color prop)
  // ---------------------------------------------------------------------------

  describe("AnimatedBunny", () => {
    it("renders without throwing (default)", () => {
      const { container } = render(<AnimatedBunny />);
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("renders an SVG element", () => {
      const { container } = render(<AnimatedBunny />);
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg!.tagName.toLowerCase()).toBe("svg");
    });

    it("accepts a custom size prop", () => {
      const { container } = render(<AnimatedBunny size={64} />);
      const svg = container.querySelector("svg");
      expect(svg!.getAttribute("width")).toBe("64");
      expect(svg!.getAttribute("height")).toBe("64");
    });

    it("accepts a custom color prop", () => {
      const { container } = render(<AnimatedBunny color="#ff0000" />);
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      // The color is applied as fill to path/circle elements
      const coloredElements = container.querySelectorAll('[fill="#ff0000"]');
      expect(coloredElements.length).toBeGreaterThan(0);
    });

    it("uses default color when none provided", () => {
      const { container } = render(<AnimatedBunny />);
      const coloredElements = container.querySelectorAll('[fill="#4C74FF"]');
      expect(coloredElements.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Icons with style prop
  // ---------------------------------------------------------------------------

  describe("icons with style prop", () => {
    it("IconListSparkle accepts a style prop", () => {
      const { container } = render(
        <IconListSparkle style={{ opacity: 0.5 }} />
      );
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg!.style.opacity).toBe("0.5");
    });

    it("IconChatEllipsis accepts a style prop", () => {
      const { container } = render(
        <IconChatEllipsis style={{ opacity: 0.8 }} />
      );
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg!.style.opacity).toBe("0.8");
    });
  });
});
