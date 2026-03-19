---
review_sha: fc96397766904c64ba874bb39732a64feeb3453c
reviewed_at: 2026-03-19T04:27:47Z
---

# Review Summary
- Findings: critical=0, moderate=6, minor=2
- Coverage: TypeScript package (unit) 91.17%; CLI Go 48.1% (overall monorepo is below 90% target)
- Test status: PASS (pnpm tests + Go tests). One coverage command (`vitest run --coverage`) fails due browser coverage runtime errors; unit-only coverage command passes.

# Project Review Runbook
- Last verified at: 2026-03-19T04:27:47Z (fc96397766904c64ba874bb39732a64feeb3453c)
- Setup/install commands:
  - `pnpm install`
  - `cd cli && go mod download`
- Test commands:
  - `pnpm test`
  - `cd cli && go test ./...`
- Coverage commands:
  - `pnpm --filter agentation exec vitest run --project unit --coverage`
  - `cd cli && go test ./... -coverprofile=coverage.out && go tool cover -func=coverage.out`
- Build/typecheck/lint commands (if applicable):
  - `pnpm build`
  - `cd cli && go build ./cmd/agentation`
  - `cd cli && go vet ./...`
- Required env/services/fixtures:
  - Playwright/Chromium available locally (required by Storybook browser tests).
  - No external DB/service required; CLI server uses in-memory or local SQLite automatically.
- Monorepo/package working-directory notes:
  - Run JS workspace commands at repo root.
  - Run Go commands from `cli/`.
- Known caveats:
  - `pnpm --filter agentation exec vitest run --coverage` currently exits non-zero with `@vitest/coverage-v8/browser` dynamic import errors.
  - Some jsdom tests log `Not implemented: navigation (except hash changes)` due `window.location.assign` in component-source navigation paths.

# Findings by Category
## Correctness Bugs
### [REV-001] [moderate] Source-location fallback executes user component functions directly
- Location: `package/src/utils/source-location.ts:574` (`probeComponentSource`), `package/src/utils/source-location.ts:610` (`fn({})`)
- Current behavior: When `_debugSource` metadata is unavailable, the fallback probes source locations by directly invoking component functions with synthetic props.
- Expected behavior: Source detection should avoid executing application component functions (or require explicit opt-in), because introspection should not run user render logic outside React's normal lifecycle.
- Why it matters: This can trigger render-time side effects, runtime errors, or expensive work during annotation interactions, producing user-visible instability.

### [REV-002] [moderate] SSE event delivery can silently drop events under load
- Location: `cli/internal/server/store.go:326` (`SubscribeAll`), `cli/internal/server/store.go:341` (`SubscribeSession`), `cli/internal/server/store.go:378` (`publish`), `cli/internal/server/store.go:437` (`nonBlockingSend`)
- Current behavior: Event subscribers use fixed-size channels (`64`) and `nonBlockingSend` drops events when channels are full.
- Expected behavior: Eventing should apply backpressure, durable buffering, or reconnect/replay guarantees so critical events are not silently lost.
- Why it matters: Agents/frontends can miss `annotation.*`, `thread.message`, or `action.requested` events during bursts or slow consumers, causing unreliable automation behavior.

## Security Issues
### [REV-003] [moderate] Router token is not enforced for `/open` requests
- Location: declaration in `cli/README.md:106` (token described for mutating router endpoints); implementation in `cli/internal/router/http/server.go:95` and `:148` (`isAuthorized` checks only register/unregister), and `cli/internal/router/http/server.go:197` (`handleOpen`)
- Current behavior: `/open` is routable without token validation, even when `AGENTATION_ROUTER_TOKEN` is configured.
- Expected behavior: `/open` should require token auth when token mode is enabled (or docs must explicitly state `/open` is intentionally unauthenticated).
- Why it matters: `/open` performs an external side effect (editor navigation). Leaving it unauthenticated widens local attack surface for any process/site that can reach the router.

## Cross-Component Contract Misalignment
### [REV-004] [moderate] Full-suite coverage command is incompatible with current Vitest browser project configuration
- Location: `package/vitest.config.ts` (storybook browser project) and coverage execution (`pnpm --filter agentation exec vitest run --coverage`)
- Current behavior: Full coverage run reports test pass but exits with multiple runtime errors (`Failed to fetch dynamically imported module ... @vitest/coverage-v8/browser`) and non-zero status.
- Expected behavior: Coverage command should be stable and reproducible for CI/review workflows.
- Why it matters: Coverage cannot be reliably measured with the naive/full command; this breaks review automation and makes coverage tracking inconsistent.

### [REV-005] [minor] Storage error-handling is inconsistent between shared storage utilities and toolbar state persistence
- Location: safe storage wrappers in `package/src/utils/storage.ts`; direct storage access in `package/src/components/page-toolbar-css/index.tsx:1083`, `:1093`, `:1108`, `:1618`, `:3069`
- Current behavior: Several toolbar persistence writes/removes call `localStorage` directly without try/catch, while shared storage utilities are explicitly guarded.
- Expected behavior: Storage operations should consistently degrade gracefully in restricted browser contexts.
- Why it matters: Browsers with blocked/limited storage can throw runtime exceptions, potentially breaking toolbar state flows.

## Stub Implementations
- None identified.

## Unfinished Features
- None identified as release-impacting.

## Dead Code
- None identified as clearly orphaned/unreachable in reviewed modules.

## Code Duplication (DRY)
### [REV-006] [moderate] Process lifecycle control logic is triplicated across stack/server/router command layers
- Location: `cli/internal/lifecycle/lifecycle.go` (`RunStart/RunStop/RunStatus`, PID/log helpers), `cli/internal/serverctl/serverctl.go`, `cli/internal/routerctl/routerctl.go`
- Current behavior: Start/stop/status, PID file handling, process discovery, and logging-path logic are maintained in three separate implementations.
- Expected behavior: Shared process-management primitives should be centralized in one internal package with thin command-specific wrappers.
- Why it matters: Fixes and behavior changes are likely to drift across entrypoints, increasing regression risk.
- Consolidation direction: extract a `cli/internal/procctl` module owning PID path resolution, process liveness checks, background spawn/stop/status, and command-line scan fallback; keep only service-specific wiring in each command package.

## Optimization Opportunities
### [REV-007] [minor] Project summary command performs per-session fetches serially
- Location: `cli/cmd/agentation/main.go:218` (`runProject` loop calling `client.GetSession`)
- Current behavior: Session annotation counts are gathered one-by-one, incurring linear network latency.
- Expected behavior: Fetches should be parallelized with bounded concurrency.
- Why it matters: Large projects with many sessions experience avoidable CLI latency.

## File Size and Modularity
### [REV-008] [moderate] Several high-churn files exceed maintainable size boundaries
- Location:
  - `package/src/components/page-toolbar-css/index.tsx` (~5276 LOC)
  - `package/src/components/icons.tsx` (~917 LOC)
  - `cli/internal/server/service.go` (~601 LOC)
  - `cli/internal/lifecycle/lifecycle.go` (~588 LOC)
  - `cli/cmd/agentation/main.go` (~587 LOC)
- Current behavior: Each file mixes multiple responsibilities (state machine/UI rendering/network sync in toolbar; command parsing + formatting + transport in CLI).
- Expected behavior: Split by cohesive concerns to reduce review surface and merge conflict pressure.
- Why it matters: Large mixed-concern files reduce change safety and make regression analysis difficult.
- Concrete split plan:
  - `page-toolbar-css/index.tsx` → `hooks/useAnnotationState.ts`, `hooks/useServerSync.ts`, `hooks/useToolbarInteractions.ts`, `render/ToolbarShell.tsx`, `render/MarkersLayer.tsx`.
  - `icons.tsx` → grouped icon modules (`status-icons.tsx`, `toolbar-icons.tsx`, `animated-icons.tsx`) re-exported from `components/icons/index.ts`.
  - `main.go` → `commands/*.go` (projects/pending/watch/actions) + shared output/flag helpers.
  - `lifecycle.go` → `stack_start.go`, `stack_stop_status.go`, `pidfile.go`, `logpaths.go`.

## API and Design Gaps (libraries only)
- No additional library API surface gaps identified beyond findings above.

# Test Results
- Commands run:
  - `pnpm test`
  - `cd cli && go test ./...`
  - `pnpm build`
  - `cd cli && go build ./cmd/agentation`
  - `cd cli && go vet ./...`
- Result: Pass
- Failures:
  - None in test/build/vet runs above.
  - Coverage-specific full command (`pnpm --filter agentation exec vitest run --coverage`) exits non-zero due browser coverage runtime import errors.

# Test Coverage
- Overall: Not directly aggregatable to a single monorepo percentage (mixed TS + Go toolchains). Measured values:
  - `package` unit coverage (Vitest v8): **91.17% lines**
  - `cli` Go coverage (`go tool cover -func`): **48.1% statements**
- Target: 90%
- Below-target areas:
  - CLI Go command/lifecycle layers (`internal/lifecycle`, `internal/serverctl`, `internal/routerctl`, and command handlers) have substantial untested paths.
  - Full-browser-storybook coverage run is currently unstable (see REV-004).

# Issue Lifecycle (incremental reviews)
- Initial full review; no prior issue IDs to carry forward.
- Fixed this round: N/A
- Still open: [REV-001], [REV-002], [REV-003], [REV-004], [REV-005], [REV-006], [REV-007], [REV-008]
- Partially fixed: N/A
