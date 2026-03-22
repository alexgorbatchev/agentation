# Agentation

Monorepo containing:

1. **npm package** (`packages/agentation/`) - See `packages/agentation/README.md` and the `.agents/skills/agentation-release/` skill for release workflow
2. **Website/docs** (`packages/example/`) - Public site content; see the `.agents/skills/agentation-vercel/` skill for deployment and debugging workflow

## What is Agentation?

A floating toolbar for annotating web pages and collecting structured feedback for AI coding agents.

## Development

```bash
pnpm install    # Install all workspace dependencies
pnpm dev        # Run both package watch + website dev server
pnpm build      # Build all packages
pnpm test       # Run all tests
```

## Important

The npm package is public. Changes to `packages/agentation/src/` affect all users.
Website changes (`packages/example/`) only affect agentation.dev.

## PR/Issue Approach

- Package size is critical - avoid bloat
- UI changes need extra scrutiny
- Plugins/extensions → encourage separate repos
- External binary files → never accept

## Annotations

Whenever the user brings up annotations, fetch all the pending annotations before doing anything else. And infer whether I am referencing any annotations.

**IMPORTANT**: All PRs should be made in this repository by default.

