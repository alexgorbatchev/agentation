---
review_sha: 32cc46df6b1818bba38cfb87608061051ea898dd
reviewed_at: 2026-03-20T01:37:40Z
---

# Review Summary
- Findings: critical=0, moderate=1, minor=1
- Coverage: TypeScript package (unit) 91.17%; CLI Go 56.9% (overall monorepo remains below 90% target)
- Test status: PASS for targeted changed-module tests (`go test ./cli/...`, `pnpm --filter agentation exec vitest run --project unit`).

# Project Review Runbook
- Last verified at: 2026-03-20T01:37:40Z (32cc46df6b1818bba38cfb87608061051ea898dd)
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
  - Full browser+coverage command can still be environment-sensitive; unit-only coverage command is stable and should be used for reproducible review metrics.

# Findings by Category
## Correctness Bugs
- None currently open.

## Security Issues
- None currently open.

## Project-Specific Policy Violations (always critical)
- None identified in changed scope.

## Cross-Component Contract Misalignment
- None currently open.

## Stub Implementations
- None identified.

## Unfinished Features
- None identified as release-impacting.

## Dead Code
- None identified as clearly orphaned/unreachable in reviewed scope.

## Code Duplication (DRY)
- None currently open after procctl consolidation.

## Optimization Opportunities
### [REV-009] [minor] Project summary annotation counting still performs per-session round trips after command split
- Location: `cli/cmd/agentation/commands/projects.go` (`RunProject` loop calling `client.GetSession`)
- Current behavior: The refactor moved logic out of `main.go`, but each session’s annotation count is still fetched sequentially.
- Expected behavior: Fetch session details with bounded concurrency (or expose a bulk API) to reduce latency on large projects.
- Why it matters: Large projects still incur avoidable user-facing CLI delays.

## File Size and Modularity
### [REV-010] [moderate] `page-toolbar-css/index.tsx` remains a very large orchestrator despite extraction of hooks/render modules
- Location: `packages/agentation/src/components/page-toolbar-css/index.tsx` (~1300+ LOC)
- Current behavior: The file is substantially reduced but still combines orchestration, event wiring, persistence, and UI state transitions.
- Expected behavior: Continue decomposition into cohesive submodules (e.g., keyboard/selection handlers, popup orchestration, settings persistence).
- Why it matters: The file remains a high-churn integration hotspot and still imposes significant review/maintenance overhead.
- Concrete split plan:
  - Move keyboard and pointer lifecycle handlers into `hooks/useInteractionLifecycle.ts`.
  - Move popup/edit thread orchestration into `hooks/useAnnotationPopupState.ts`.
  - Move settings serialization/persistence into `state/toolbar-settings.ts` with pure functions + tests.

## API and Design Gaps (libraries only)
- No additional library API surface gaps identified beyond findings above.

# Test Results
- Commands run:
  - `go test ./cli/...`
  - `pnpm --filter agentation exec vitest run --project unit`
- Result: Pass
- Failures:
  - None in the commands executed for this incremental review.

# Test Coverage
- Overall: Not directly aggregatable to a single monorepo percentage (mixed TS + Go toolchains). Measured values in current review context:
  - `package` unit coverage (Vitest v8): **91.17% lines**
  - `cli` Go coverage (`go tool cover -func`): **56.9% statements**
- Target: 90%
- Below-target areas:
  - Go CLI command/lifecycle modules are improved but still below target overall.
  - No combined monorepo coverage gate currently enforces a unified threshold.

# Issue Lifecycle (incremental reviews)
- Fixed this round: [REV-002], [REV-003], [REV-004], [REV-005], [REV-006], [REV-007], [REV-008]
- Still open: [REV-010]
- Partially fixed: [REV-001] (source probing risk reduced by stricter guardrails and tests, but fallback invocation path remains present), [REV-009]
