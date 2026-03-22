---
name: agentation-vercel
description: Deploy and diagnose the Agentation Vercel app in this repository. Use when checking build status, reading Vercel build logs, fixing deployment config drift, running preview or production deploys, or debugging why the docs site behaves differently on Vercel. Targets the `agentation-example` project rooted at `packages/example`.
---

# Agentation Vercel

Use this skill for the docs site only.

## Workflow overview

1. Confirm the project wiring.
2. Reproduce the build locally from a clean state.
3. Inspect the remote deployment and build logs.
4. Fix config drift or build failures.
5. Deploy preview or production.
6. Report any remaining non-blocking warnings separately.

Read `references/setup.md` before changing Vercel config.

## Confirm the project wiring

- Read `packages/example/vercel.json`, `packages/example/package.json`, and `.vercel/project.json`.
- Expect the Vercel project to be `agentation-example`.
- Expect the Vercel root directory to be `packages/example`.
- Expect the docs app to build the workspace package via `prebuild` before `next build`.
- Treat repo-root `vercel.json` files or `packages/agentation/vercel.json` as config drift.

## Reproduce the build locally

Run the docs build from a clean package-output state before touching Vercel:

```bash
rm -rf packages/agentation/dist
pnpm --filter feedback-tool-example build
```

If the local clean build fails, fix that first.

If the local directory is not linked to Vercel, relink it:

```bash
vercel link --yes --project agentation-example --scope alexs-projects-fcc1db3d
```

## Inspect the remote deployment

Use these commands from the repo root:

```bash
vercel project inspect agentation-example
vercel ls agentation-example
vercel inspect <deployment-url> --logs
```

Prefer `vercel inspect <deployment-url> --logs` for build failures.

## Diagnose common failures

- `Module not found: Can't resolve '@alexgorbatchev/agentation'`
  - The workspace package was not built before `next build`.
  - Preserve the `prebuild` hook in `packages/example/package.json`.

- `The vercel.json file should be inside of the provided root directory.`
  - The config file is in the wrong directory for this project.
  - Keep the Vercel config in `packages/example/vercel.json`.

- `Ignored build scripts: @parcel/watcher@...`
  - Treat this as non-blocking unless the build actually fails.
  - Do not approve extra install scripts casually.

- `detected next export`
  - Treat this as expected.
  - The site intentionally uses static export via `next.config.js`.

## Deploy

Run deploys only after the clean local build passes.

Preview:

```bash
vercel deploy --yes --logs
```

Production:

```bash
vercel deploy --prod --yes --logs
```

## Verify

- Open the preview or production URL.
- Verify the site renders and the toolbar behavior matches the current app policy.
- State clearly whether production was deployed from committed `main` or from a local working tree.
- Call out lingering warnings separately from blocking failures.
