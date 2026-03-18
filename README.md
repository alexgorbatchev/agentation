<img src="./package/logo.svg" alt="Agentation" width="50" />

[![npm version](https://img.shields.io/npm/v/agentation)](https://www.npmjs.com/package/agentation)
[![downloads](https://img.shields.io/npm/dm/agentation)](https://www.npmjs.com/package/agentation)

---

> [!WARNING]
> Fork notice: this repository is a maintained fork of [benjitaylor/agentation](https://github.com/benjitaylor/agentation) with several additions on top of upstream:

- Annotation thread and reply UI
- Deep select for piercing overlays
- Alt hold-to-select mode with a crosshair cursor
- Review queue for resolved annotations
- MCP support for surfacing human thread replies
- Storybook plus expanded automated test coverage
- Neovim integration ([`nvim/README.md`](nvim/README.md)) and a local router daemon managed by the Go CLI for multi-project Neovim routing

---

**[Agentation](https://agentation.dev)** is an agent-agnostic visual feedback tool. Click elements on your page, add notes, and copy structured output that helps AI coding agents find the exact code you're referring to.

## Install

```bash
npm install agentation -D
```

## Usage

```tsx
import { Agentation } from 'agentation';

function App() {
  return (
    <>
      <YourApp />
      <Agentation />
    </>
  );
}
```

The toolbar appears in the bottom-right corner. Click to activate, then click any element to annotate it.

## Features

- **Click to annotate** – Click any element with automatic selector identification
- **Text selection** – Select text to annotate specific content
- **Multi-select** – Drag to select multiple elements at once
- **Area selection** – Drag to annotate any region, even empty space
- **Animation pause** – Freeze all animations (CSS, JS, videos) to capture specific states
- **Structured output** – Copy markdown with selectors, positions, and context
- **Dark/light mode** – Matches your preference or set manually
- **Zero dependencies** – Pure CSS animations, no runtime libraries

## How it works

Agentation captures class names, selectors, and element positions so AI agents can `grep` for the exact code you're referring to. Instead of describing "the blue button in the sidebar," you give the agent `.sidebar > button.primary` and your feedback.

## Requirements

- React 18+
- Desktop browser (mobile not supported)

## Docs

Full documentation at [agentation.dev](https://agentation.dev)

Neovim/router docs:

- `nvim/README.md`
- `cli/README.md` (router lifecycle is integrated into `agentation` CLI)

## Development

```bash
pnpm install
pnpm build
pnpm test
```

Router binaries are published via GitHub Actions on tags matching `router-v*`.

## License

© 2026 Benji Taylor

Licensed under PolyForm Shield 1.0.0
