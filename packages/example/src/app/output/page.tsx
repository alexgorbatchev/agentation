import type { JSX } from "react";

import { Footer } from "../Footer";
import { getHighlightedCodeHtml } from "../lib/getHighlightedCodeHtml";
import { OutputPageClient } from "./OutputPageClient";

type OutputFormat = "compact" | "standard" | "detailed" | "forensic";

const outputExamples: Record<OutputFormat, string> = {
  standard: `## Page Feedback: /dashboard
**Viewport:** 1512x738

### 1. button.submit-btn
**Location:** \`.form-container > .actions > button.submit-btn\`
**Source:** src/components/FormActions.tsx:42:5
**Classes:** \`submit-btn primary\`
**React:** \`<App> <Dashboard> <FormActions> <SubmitButton>\`
**Position:** 450, 320 (120x40)
**Feedback:** Button text should say "Save" not "Submit"

### 2. span.nav-label
**Location:** \`.sidebar > nav > .nav-item > span\`
**Source:** src/components/Sidebar.tsx:28:12
**React:** \`<App> <Sidebar> <NavItem>\`
**Selected:** "Settigns"
**Feedback:** Typo - should be "Settings"`,

  detailed: `## Page Feedback: /dashboard
**Viewport:** 1512x738
**URL:** https://myapp.com/dashboard
**User Agent:** Chrome/120.0

---

### 1. button.submit-btn

**Selector:** \`.form-container > .actions > button.submit-btn\`
**Source:** src/components/FormActions.tsx:42:5
**Classes:** \`.submit-btn\`, \`.primary\`
**React:** \`<App> <Dashboard> <FormActions> <SubmitButton>\`
**Bounding box:** x:450, y:320, 120x40px
**Nearby text:** "Cancel Save Changes"

**Issue:** Button text should say "Save" not "Submit"

---

### 2. span.nav-label

**Selector:** \`.sidebar > nav > .nav-item > span\`
**Source:** src/components/Sidebar.tsx:28:12
**Classes:** \`.nav-label\`
**React:** \`<App> <Sidebar> <NavItem>\`
**Selected text:** "Settigns"
**Nearby text:** "Dashboard Settigns Profile"

**Issue:** Typo - should be "Settings"

---

**Search tips:** Use the class names, React components, or selectors above to find these elements. Try \`grep -r "SubmitButton"\` or \`grep -r "className.*submit-btn"\`.`,

  compact: `## Feedback: /dashboard

1. **.submit-btn** (src/components/FormActions.tsx:42): Button text should say "Save" not "Submit"

2. **.nav-label** (src/components/Sidebar.tsx:28): Typo - should be "Settings" (re: "Settigns")`,

  forensic: `## Page Feedback: /dashboard

**Environment:**
- Viewport: 1440x900
- URL: http://localhost:3000/dashboard
- User Agent: Mozilla/5.0 Chrome/142.0.0.0
- Timestamp: 2024-01-15T10:30:00.000Z
- Device Pixel Ratio: 2

---

### 1. button.submit-btn

**Full DOM Path:** \`body > div.app > main.dashboard > div.form-container > div.actions > button.submit-btn\`
**Source:** src/components/FormActions.tsx:42:5
**React:** \`<App> <Dashboard> <FormActions> <SubmitButton>\`

**CSS Classes:** \`submit-btn, primary\`
**Position:**
- Bounding box: x:450, y:320
- Dimensions: 120x40px
- Annotation at: 45.2% from left, 320px from top
**Computed Styles:** bg: rgb(59, 130, 246), font: 14px, weight: 600, padding: 8px 16px, radius: 6px
**Accessibility:** focusable

**Issue:** Button text should say "Save" not "Submit"

---

### 2. span.nav-label

**Full DOM Path:** \`body > div.app > aside.sidebar > nav > div.nav-item:nth-child(2) > span.nav-label\`
**Source:** src/components/Sidebar.tsx:28:12
**React:** \`<App> <Sidebar> <NavItem>\`

**CSS Classes:** \`nav-label\`
**Selected text:** "Settigns"
**Position:**
- Bounding box: x:24, y:156
- Dimensions: 64x20px
- Annotation at: 3.2% from left, 156px from top
**Computed Styles:** font: 13px, weight: 500, color: rgb(55, 65, 81)
**Accessibility:** none

**Issue:** Typo - should be "Settings"`,
};

async function createHighlightedOutputExamples(): Promise<Record<OutputFormat, string>> {
  return {
    compact: await getHighlightedCodeHtml(outputExamples.compact, "markdown"),
    standard: await getHighlightedCodeHtml(outputExamples.standard, "markdown"),
    detailed: await getHighlightedCodeHtml(outputExamples.detailed, "markdown"),
    forensic: await getHighlightedCodeHtml(outputExamples.forensic, "markdown"),
  };
}

export default async function OutputPage(): Promise<JSX.Element> {
  const highlightedOutputExamples = await createHighlightedOutputExamples();

  return (
    <>
      <OutputPageClient highlightedOutputExamples={highlightedOutputExamples} />
      <Footer />
    </>
  );
}
