---
name: agentation
description: Add Agentation visual feedback toolbar to a Next.js project, with optional Agentation CLI sync setup
---

# Agentation Setup

Set up the Agentation annotation toolbar in this project, with optional local Agentation CLI sync.

## Steps

1. **Check if package is already installed**
   - Look for `agentation` in `package.json` dependencies/devDependencies.
   - If missing, install with the project package manager (`npm`, `pnpm`, or `yarn`).

2. **Check if toolbar is already configured**
   - Search for `<Agentation` or `import { Agentation } from "agentation"`.
   - If found, report it is already configured and continue to CLI setup validation.

3. **Detect Next.js router type**
   - App Router: `app/layout.tsx` or `app/layout.js`
   - Pages Router: `pages/_app.tsx` or `pages/_app.js`

4. **Add the toolbar component (development only)**

   For Next.js App Router, add to root layout:
   ```tsx
   import { Agentation } from "agentation";

   // Add inside <body>, after children:
   {process.env.NODE_ENV === "development" && <Agentation />}
   ```

   For Next.js Pages Router, add to `_app`:
   ```tsx
   import { Agentation } from "agentation";

   // Add after <Component {...pageProps} />:
   {process.env.NODE_ENV === "development" && <Agentation />}
   ```

5. **Optional: enable CLI/server sync**
   - `endpoint` is optional. Without it, Agentation works with localStorage-only annotations.
   - For real-time sync with the Agentation CLI, set:
   ```tsx
   <Agentation endpoint="http://127.0.0.1:4747" />
   ```

6. **If sync is enabled, validate and start the Agentation CLI stack**
   - Ensure `agentation` is on `PATH` (`command -v agentation`).
   - Start stack: `agentation start` (or `agentation start --background`).
   - Verify: `agentation status`.
   - Verify API reachability: `agentation pending --json`.

7. **Confirm setup**
   - Confirm toolbar renders in development.
   - If sync mode is enabled, confirm annotations can be consumed via CLI (`pending`, `watch`, `ack`, `resolve`, `reply`).

## Important

- **Use the Agentation CLI for local sync workflows.**
- **`endpoint` is optional by default.** Only set it when you want CLI/server-backed sync.
- **One running `agentation start` instance is enough for multiple local projects/sessions.** Do not start one CLI stack per project unless intentionally isolating ports/storage.
- `agentation start` manages server + router under a single process by default.

## Notes

- The `NODE_ENV` guard keeps Agentation development-only.
- Agentation requires React 18+.
- Default CLI server address (when sync is enabled) is `http://127.0.0.1:4747`.
- Optional service toggles:
  - Disable server: `AGENTATION_SERVER_ADDR=0 agentation start`
  - Disable router: `AGENTATION_ROUTER_ADDR=0 agentation start`
- Use `agentation status` to check lifecycle state.
