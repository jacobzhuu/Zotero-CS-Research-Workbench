# Task Plan: v0.1 Execution

## Goal

Complete Phases 0 through 8 from `ToDoList.md` while keeping each phase scoped to its intended v0.1 deliverables.

## Current Phase

Phase 8

## Phases

### Phase 1: Audit Repository Structure

- [x] Read `ToDoList.md`
- [x] Read `PRD_v0.1.md`
- [x] Inspect package/build/test configuration
- [x] Inspect plugin bootstrap and storage modules
- [x] Summarize actual architecture in chat
- **Status:** complete

### Phase 2: Adapt Repo-Specific Plan

- [x] Identify exact files to keep, modify, or add
- [x] Flag mismatches between `ToDoList.md` and current code
- [x] Produce Phase 1 execution plan
- **Status:** complete

### Phase 3: Implement Phase 1 Foundation

- [x] Refine storage/types APIs to match the Phase 1 contract
- [x] Implement clean read/write helpers
- [x] Implement override-aware merge helpers
- [x] Avoid Phase 2+ work
- **Status:** complete

### Phase 4: Verify

- [x] Run lint/type/test checks that are available
- [x] Record any failures or environmental limits
- **Status:** complete

### Phase 5: Deliver

- [x] Summarize audit, plan, code changes, tests, risks
- [x] Explicitly state execution stopped after Phase 1
- **Status:** complete

### Phase 6: Build Product Modules

- [x] Implement Venue Lite
- [x] Implement Artifact Hub
- [x] Implement Structured Tags Lite
- [x] Implement Reading Note Template
- [x] Implement Related Work Export
- [x] Add focused module tests
- **Status:** complete

### Phase 7: UI Integration

- [x] Add item-list columns
- [x] Add detail-pane sections
- [x] Add context-menu actions
- [x] Add focused UI-helper tests
- **Status:** complete

### Phase 8: Stability, Settings, and Polish

- [x] Add minimal preferences support for UI toggles and local-data reset
- [x] Harden UI action failure paths and invalid-selection handling
- [x] Tighten cache invalidation behavior for notifier-driven refreshes
- [x] Update README to reflect actual implemented v0.1 behavior
- [x] Re-run targeted build, lint, and local Mocha validation
- **Status:** complete

## Decisions Made

| Decision                                                                   | Rationale                                                                                                                    |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Reuse the existing pref-backed storage layer instead of introducing SQLite | The repository already has a minimal storage module and Phase 1 does not require a heavier persistence backend               |
| Add one minimal FTL locale file and ignore `*.ftl` in Prettier             | The scaffold generates invalid `typings/i10n.d.ts` when no locale messages exist, and Prettier does not parse FTL by default |
| Keep Phase 8 settings limited to UI toggles and local-data reset           | This adds clear demo value without introducing a larger settings system                                                      |

## Errors Encountered

| Error                                                                       | Resolution                                                                             |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `git status` failed because the working directory is not a Git repository   | Continue with filesystem-based inspection and note the limitation in the final summary |
| `npm run build` initially failed on generated `typings/i10n.d.ts`           | Added a minimal locale file so the scaffold emits a valid `FluentMessageId` union      |
| `npm run lint:check` still reports formatting drift in untouched repo files | Verified the touched Phase 1 files separately and left unrelated formatting as-is      |
