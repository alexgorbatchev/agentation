"use client";

import { useState } from "react";

import {
  AltRightClickDemo,
  AnimationPauseDemo,
  AreaSelectionDemo,
  ElementClickDemo,
  MultiSelectDemo,
  TextSelectionDemo,
} from "./features-demo";
import "./FeaturesDemo.css";

type FeatureKey =
  | "text-selection"
  | "element-click"
  | "multi-select"
  | "area-selection"
  | "animation-pause"
  | "alt-right-click";

interface Feature {
  key: FeatureKey;
  label: string;
  caption: string;
}

const features: Feature[] = [
  {
    key: "text-selection",
    label: "Text",
    caption: "Select text to annotate typos, content issues, or copy changes.\nThe quoted text is included in the output.",
  },
  {
    key: "element-click",
    label: "Elements",
    caption: "Click any element to add feedback.\nAgentation identifies it by class name, ID, or semantic content.",
  },
  {
    key: "multi-select",
    label: "Multi-Select",
    caption: "Hold `⌘`+`⇧` and click elements individually, or drag to select multiple at once.\nAll selected elements are included in a single annotation.",
  },
  {
    key: "area-selection",
    label: "Area",
    caption: "Drag to select any region, even empty space.\nUseful for layout feedback or indicating where something should go.",
  },
  {
    key: "animation-pause",
    label: "Animation",
    caption: "Freeze animations to annotate specific states.\nClick pause in the toolbar to stop all animations.",
  },
  {
    key: "alt-right-click",
    label: "Alt+Right",
    caption:
      "Hold Alt and right-click to inspect the source components behind an element.\nOpen the component menu and jump straight to the relevant file.",
  },
];

export function FeaturesDemo(): JSX.Element {
  const [activeFeature, setActiveFeature] = useState<FeatureKey>("text-selection");
  const [animationKey, setAnimationKey] = useState(0);

  const handleFeatureChange = (feature: FeatureKey): void => {
    setActiveFeature(feature);
    setAnimationKey((currentAnimationKey) => currentAnimationKey + 1);
  };

  const currentFeature = features.find((feature) => feature.key === activeFeature);
  if (!currentFeature) {
    return <div className="fd-container" />;
  }

  return (
    <div className="fd-container">
      <div className="fd-tabs">
        {features.map((feature) => (
          <button
            key={feature.key}
            className={`fd-tab ${activeFeature === feature.key ? "active" : ""}`}
            onClick={() => handleFeatureChange(feature.key)}
          >
            {feature.label}
          </button>
        ))}
      </div>

      <div className="fd-demo">
        {activeFeature === "text-selection" && <TextSelectionDemo key={animationKey} />}
        {activeFeature === "element-click" && <ElementClickDemo key={animationKey} />}
        {activeFeature === "multi-select" && <MultiSelectDemo key={animationKey} />}
        {activeFeature === "area-selection" && <AreaSelectionDemo key={animationKey} />}
        {activeFeature === "animation-pause" && <AnimationPauseDemo key={animationKey} />}
        {activeFeature === "alt-right-click" && <AltRightClickDemo key={animationKey} />}
      </div>

      <p
        key={activeFeature}
        style={{
          marginTop: "1rem",
          fontSize: "0.75rem",
          color: "rgba(0,0,0,0.5)",
          whiteSpace: "pre-line",
          lineHeight: 1.3,
          animation: "fadeIn 0.3s ease",
        }}
      >
        {currentFeature.caption}
      </p>
    </div>
  );
}
