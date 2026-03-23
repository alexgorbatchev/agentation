# Agentation Vercel Setup

## Current project facts

- Vercel project: `agentation-example`
- Vercel owner/scope: `alexs-projects-fcc1db3d`
- Vercel root directory: `packages/example`
- Local link file: `.vercel/project.json`
- Checked-in Vercel config: `packages/example/vercel.json`

## Build chain

`packages/example/package.json` must keep this sequence:

1. `prebuild`: `cd ../.. && bun run --filter ./packages/agentation build`
2. `build`: `next build`

That prebuild is required because the docs app imports the workspace package and the package exports from `packages/agentation/dist/*`.

## Local validation command

Use this exact clean-build check when diagnosing Vercel:

```bash
rm -rf packages/agentation/dist
bun run --filter ./packages/example build
```

If this fails, Vercel will fail too.

## Config drift rules

- Do not add a repo-root `vercel.json` while the Vercel project root remains `packages/example`.
- Do not reintroduce `packages/agentation/vercel.json`; it is stale for this monorepo.
- Keep `package.json#packageManager` aligned with the Bun version expected by CI and Vercel.

## Expected warnings

- `Ignored build scripts: @parcel/watcher...` is currently non-blocking.
- `detected next export` is expected because the site uses static export.
