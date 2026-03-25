import type { ComponentSourceMenuPreviewItem } from "../../../../agentation/src/components/page-toolbar-css/components/ComponentSourceMenuPreview";

export const HERO_HEADER_TEXT = "Benji's Dashboard";

export const HERO_FEEDBACK_TEXTS = {
  primary: "Change to primary style",
  secondary: "Add hover states",
  tertiary: "Make this more prominent",
} as const;

export const HERO_COMPONENT_MENU_ITEMS: ComponentSourceMenuPreviewItem[] = [
  {
    displayName: "ActionButton",
    props: ["label", "tone"],
    sourceLabel: "src/components/toolbar/ActionButton.tsx:18",
  },
  {
    displayName: "ActionRow",
    props: ["ctaLabel"],
    sourceLabel: "src/components/toolbar/ActionRow.tsx:44",
  },
  {
    displayName: "ProfileCard",
    props: ["title", "subtitle"],
    sourceLabel: "src/components/ProfileCard.tsx:72",
  },
];
