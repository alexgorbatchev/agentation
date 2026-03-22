<img src="https://raw.githubusercontent.com/alexgorbatchev/agentation/main/packages/agentation/logo.svg" alt="Agentation" width="50" />

[![npm version](https://img.shields.io/npm/v/%40alexgorbatchev%2Fagentation)](https://www.npmjs.com/package/@alexgorbatchev/agentation)
[![downloads](https://img.shields.io/npm/dm/%40alexgorbatchev%2Fagentation)](https://www.npmjs.com/package/@alexgorbatchev/agentation)

**[Agentation](https://agentation.dev)** is an agent-agnostic visual feedback tool. Click elements on your page, add notes, and copy structured output that helps AI coding agents find the exact code you're referring to.

This npm package is maintained in the [`alexgorbatchev/agentation`](https://github.com/alexgorbatchev/agentation) fork.

## Install

Install both the frontend package and the CLI companion:

```bash
npm install @alexgorbatchev/agentation -D
npm install -g @alexgorbatchev/agentation-cli
```

If you prefer, you can install the CLI from source or another package manager via [`@alexgorbatchev/agentation-cli`](https://github.com/alexgorbatchev/agentation-cli).

## Usage

Start the local Agentation stack first:

```bash
agentation start
```

Then add the component to your app:

```tsx
import { Agentation } from '@alexgorbatchev/agentation';

function App() {
  return (
    <>
      <YourApp />
      <Agentation projectId="my-project" />
    </>
  );
}
```

For the full synced workflow, run the local Agentation server first. By default, the toolbar probes `http://127.0.0.1:4747` on load and connects to the running local CLI/server automatically. If no local server is discovered, Agentation falls back to local-only copy/paste mode.

If you want component-source links to open in Neovim, install [`@alexgorbatchev/agentation.nvim`](https://github.com/alexgorbatchev/agentation.nvim) separately.

The toolbar appears in the bottom-right corner. Click to activate, then click any element to annotate it.

`<Agentation />` renders wherever you mount it. If you only want it in development, gate it in your application:

```tsx
function App() {
  const shouldRenderAgentation = process.env.NODE_ENV !== 'production';

  return (
    <>
      <YourApp />
      {shouldRenderAgentation ? <Agentation projectId="my-project" /> : null}
    </>
  );
}
```

## Features

- **Click to annotate** – Click any element with automatic selector identification
- **Text selection** – Select text to annotate specific content
- **Multi-select** – Drag to select multiple elements at once
- **Area selection** – Drag to annotate any region, even empty space
- **Animation pause** – Freeze all animations (CSS, JS, videos) to capture specific states
- **Structured output** – Copy markdown with selectors, positions, and context
- **Programmatic access** – Callback prop for direct integration with tools
- **Dark/light mode** – Toggle in settings, persists to localStorage
- **Zero dependencies** – Pure CSS animations, no runtime libraries

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `projectId` | `string` | _required_ | Project scope ID used by the local CLI/server for session reuse, pending queues, and watch flows |
| `onAnnotationAdd` | `(annotation: Annotation) => void` | - | Called when an annotation is created |
| `onAnnotationDelete` | `(annotation: Annotation) => void` | - | Called when an annotation is deleted |
| `onAnnotationUpdate` | `(annotation: Annotation) => void` | - | Called when an annotation comment or server-backed fields are updated |
| `onAnnotationsClear` | `(annotations: Annotation[]) => void` | - | Called when all local annotations are cleared |
| `onCopy` | `(markdown: string) => void` | - | Receives generated markdown when the copy action runs |
| `onSubmit` | `(output: string, annotations: Annotation[]) => void` | - | Receives the rendered output plus annotations when the send action runs |
| `copyToClipboard` | `boolean` | `true` | Set to `false` to disable clipboard writes and handle copied output yourself |
| `endpoint` | `string` | _optional_ | Server URL for sync; if omitted, Agentation probes `http://127.0.0.1:4747` once and otherwise stays local-only |
| `sessionId` | `string` | - | Pre-existing session ID to join |
| `onSessionCreated` | `(sessionId: string) => void` | - | Called when a new server-backed session is created |
| `webhookUrl` | `string` | - | Default webhook target for annotation events |
| `className` | `string` | - | Custom class applied to the toolbar container |
| `componentEditor` | `"cursor" \| "neovim" \| "vscode" \| "vscode-insiders" \| "webstorm"` | `"vscode"` | Editor protocol used for component-source links |
| `getComponentEditorUrl` | `(params: ComponentSourceUrlParams) => string` | - | Override editor URL generation entirely |
| `navigateToUrl` | `(url: string) => void` | `window.location.assign` | Override navigation side effects when opening component source links |
| `neovimBridgeUrl` | `string` | `http://127.0.0.1:8777` | Base URL for the Neovim router when `componentEditor="neovim"` |
| `neovimProjectId` | `string` | - | Optional project ID passed to the Neovim router |
| `copyComponentSourcePath` | `boolean` | `true` | Copy the resolved source path when opening a component source link |

### Programmatic Integration

Use callbacks to receive annotation data directly:

```tsx
import { Agentation, type Annotation } from '@alexgorbatchev/agentation';

function App() {
  const handleAnnotation = (annotation: Annotation) => {
    // Structured data - no parsing needed
    console.log(annotation.element);      // "Button"
    console.log(annotation.elementPath);  // "body > div > button"
    console.log(annotation.boundingBox);  // { x, y, width, height }
    console.log(annotation.cssClasses);   // "btn btn-primary"

    // Send to your agent, API, etc.
    sendToAgent(annotation);
  };

  return (
    <>
      <YourApp />
      <Agentation
        projectId="my-project"
        onAnnotationAdd={handleAnnotation}
        copyToClipboard={false}  // Don't write to clipboard
      />
    </>
  );
}
```

### Annotation Type

```typescript
type Annotation = {
  id: string;
  x: number;                    // % of viewport width
  y: number;                    // px from top of document (absolute) OR viewport (if isFixed)
  comment: string;              // User's note
  element: string;              // e.g., "Button"
  elementPath: string;          // e.g., "body > div > button"
  timestamp: number;

  // Optional metadata (when available)
  selectedText?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  nearbyText?: string;
  cssClasses?: string;
  nearbyElements?: string;
  computedStyles?: string;
  fullPath?: string;
  accessibility?: string;
  isMultiSelect?: boolean;
  isFixed?: boolean;
  reactComponents?: string;
  sourceFile?: string;         // e.g. src/components/Button.tsx:42:5
};
```

> **Note:** This is a simplified type. The full type also includes server-backed fields such as `sessionId`, `status`, `thread`, `createdAt`, `updatedAt`, `resolvedAt`, and `authorId`. See [agentation.dev/schema](https://agentation.dev/schema) for the complete schema.

## How it works

Agentation captures class names, selectors, and element positions so AI agents can `grep` for the exact code you're referring to. Instead of describing "the blue button in the sidebar," you give the agent `.sidebar > button.primary` and your feedback.

## Requirements

- React 18+
- Desktop browser (mobile not supported)

## Docs

- [agentation.dev](https://agentation.dev) — public docs and examples
- [@alexgorbatchev/agentation-cli](https://github.com/alexgorbatchev/agentation-cli) — required local server/router CLI
- [@alexgorbatchev/agentation.nvim](https://github.com/alexgorbatchev/agentation.nvim) — optional Neovim bridge plugin ([npm](https://www.npmjs.com/package/@alexgorbatchev/agentation.nvim))
- [@alexgorbatchev/agentation-skills](https://github.com/alexgorbatchev/agentation-skills) — shared coding-agent skills
- [@alexgorbatchev/pi-agentation](https://github.com/alexgorbatchev/pi-agentation) — Pi integration package

## License

Original work © 2026 Benji Taylor. Current fork maintained by Alex Gorbatchev.

Licensed under PolyForm Shield 1.0.0
