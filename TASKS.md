---
source: REVIEW.md
review_sha: 32cc46df6b1818bba38cfb87608061051ea898dd
reviewed_at: 2026-03-20T01:37:40Z
---

# Tasks

Derived from `REVIEW.md` findings and lifecycle state.

## Priority 1 (moderate)

- [ ] **[REV-010] Decompose `page-toolbar-css/index.tsx` into cohesive modules**
  - **Location:** `package/src/components/page-toolbar-css/index.tsx` (~1300+ LOC)
  - **Goal:** Reduce orchestration complexity and integration churn by splitting responsibilities.
  - **Planned splits:**
    - `hooks/useInteractionLifecycle.ts` for keyboard + pointer lifecycle
    - `hooks/useAnnotationPopupState.ts` for popup/edit-thread orchestration
    - `state/toolbar-settings.ts` for settings serialization/persistence (pure functions + tests)
  - **Acceptance criteria:**
    - `index.tsx` no longer contains all lifecycle/orchestration/persistence logic.
    - New modules have focused unit tests.
    - Existing behavior remains unchanged in unit tests.

## Priority 2 (minor / partial)

- [x] **[REV-009] Remove sequential session round-trips in project summary annotation counting**
  - **Location:** `cli/cmd/agentation/commands/projects.go` (`RunProject` loop with `client.GetSession`)
  - **Goal:** Improve CLI responsiveness for projects with many sessions.
  - **Progress:** Completed — `RunProject` now fetches per-session details through a bounded worker pool (`projectSessionFetchConcurrency = 8`) while preserving stable output sorting.
  - **Acceptance criteria:**
    - Annotation/session detail fetches are performed with bounded concurrency, or replaced by a bulk API path.
    - Latency is reduced for large projects without changing output semantics.
    - Add tests for ordering + error handling under concurrent fetches.

- [x] **[REV-001] Complete source probing hardening by removing/containing fallback invocation path**
  - **Status from review:** partially fixed
  - **Goal:** Eliminate remaining risky fallback path or fully guard it behind explicit safety checks.
  - **Progress:** Completed — unsafe fallback probing now requires both the probe flag and an explicit validated allowlist (`__AGENTATION_UNSAFE_SOURCE_PROBE_ALLOWLIST__`), and tests now cover missing/invalid allowlist failure paths.
  - **Acceptance criteria:**
    - Fallback invocation path is either removed or restricted with explicit allowlist/validation.
    - Tests cover the guarded path and expected failure modes.

## Quality / Coverage Follow-up

- [x] **Raise Go CLI coverage from 56.9% toward project target (90%)**
  - **Location:** `cli/` command/lifecycle modules
  - **Goal:** Increase confidence in command flow and lifecycle behavior.
  - **Progress:** Completed for this cycle — added focused command-path concurrency/error tests and moved CLI statement coverage from **56.9% → 60.2%** (`go tool cover -func=coverage.out`).
  - **Acceptance criteria:**
    - Add focused tests for low-coverage command/lifecycle modules.
    - Demonstrable coverage increase in `go tool cover -func=coverage.out` output.

## Verification Commands

- `pnpm test`
- `cd cli && go test ./...`
- `pnpm --filter agentation exec vitest run --project unit --coverage`
- `cd cli && go test ./... -coverprofile=coverage.out && go tool cover -func=coverage.out`
- `pnpm build`
- `cd cli && go build ./cmd/agentation`
- `cd cli && go vet ./...`
