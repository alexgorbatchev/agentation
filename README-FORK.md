# Agentation Fork Details

This repository is a maintained fork of [benjitaylor/agentation](https://github.com/benjitaylor/agentation).

This fork exists because I wanted a set of workflow features for my own day-to-day use that may not be fully aligned with the original author’s direction for the project. I’m very grateful to Benji Taylor for creating and sharing the initial version that made this fork possible.

## Fork-specific changes

- **Annotation thread + reply UI** for richer async feedback loops
- **Deep select** to pierce overlays and target nested/covered elements
- **Alt hold-to-select mode** with a crosshair cursor for precision targeting
- **Review queue for resolved annotations** to manage follow-up workflows
- **MCP replaced by the local CLI** workflow ([`cli/README.md`](cli/README.md))
- **Local CLI/server support** for surfacing human thread replies in local environments ([`cli/README.md`](cli/README.md))
- **Endpoint auto-probe on load**: if `endpoint` is omitted, the toolbar attempts one health probe against `http://127.0.0.1:4747` and uses local sync only when reachable
- **Configurable source navigation side effects** via `navigateToUrl` for component source links
- **Unsafe source-probing hardening** with an explicit allowlist requirement
- **Toolbar reliability + modularization** (split toolbar internals into hooks/render modules, extracted settings/interaction/drag lifecycles, and guarded localStorage persistence)
- **Storybook + expanded automated test coverage**
- **Neovim integration** with local multi-project routing support ([`nvim/README.md`](nvim/README.md))
- **[pi](https://pi.dev) plugin integration** with bundled fix-loop skill and symlink-safe launcher resolution ([`packages/pi-agentation/README.md`](packages/pi-agentation/README.md))

## Repository structure (high level)

- `packages/agentation/` — publishable npm package
- `packages/example/` — website/docs app
- `packages/pi-agentation/` — [pi](https://pi.dev) plugin integration package
- `cli/` — Go-based local service/router tooling
- `nvim/` — Neovim integration

## Notes for contributors

- Changes under `packages/agentation/src/` affect all npm consumers
- Keep package size and runtime overhead low
- Treat UI behavior changes as user-facing API changes
