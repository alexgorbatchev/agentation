---
name: agentation
description: Add Agentation visual feedback toolbar to a Next.js project
---

# Agentation Setup

Set up the Agentation annotation toolbar in this project.

## Steps

1. **Check if already installed**
   - Look for `agentation` in package.json dependencies
   - If not found, run `npm install agentation` (or pnpm/yarn based on lockfile)

2. **Check if already configured**
   - Search for `<Agentation` or `import { Agentation }` in src/ or app/
   - If found, report that Agentation is already set up and exit

3. **Detect framework**
   - Next.js App Router: has `app/layout.tsx` or `app/layout.js`
   - Next.js Pages Router: has `pages/_app.tsx` or `pages/_app.js`

4. **Add the component**

   For Next.js App Router, add to the root layout:
   ```tsx
   import { Agentation } from "agentation";

   // Add inside the body, after children:
   {process.env.NODE_ENV === "development" && <Agentation />}
   ```

   For Next.js Pages Router, add to _app:
   ```tsx
   import { Agentation } from "agentation";

   // Add after Component:
   {process.env.NODE_ENV === "development" && <Agentation />}
   ```

5. **Confirm component setup**
   - Tell the user the Agentation toolbar component is configured

6. **Recommend local CLI/server setup**
   - Explain that for real-time annotation syncing with AI agents, they should run the local Agentation server stack
   - Recommend:
     - Start both server + router: `agentation start`
     - Optional router-only mode: `AGENTATION_SERVER_ADDR=0 agentation start`
   - Tell the user they can point the toolbar endpoint at `http://127.0.0.1:4747`
   - Explain that once running, annotations sync in real time and can be consumed via CLI commands (`pending`, `watch`, `ack`, `resolve`, `reply`)

## Notes

- The `NODE_ENV` check ensures Agentation only loads in development
- Agentation requires React 18
- The Agentation HTTP server runs on port 4747 by default
- Use `agentation pending`, `agentation watch`, `agentation ack`, and `agentation resolve` for loop workflows
- Use `agentation status` to verify the local stack is running
