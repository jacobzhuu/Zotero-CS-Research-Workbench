# Task Plan: Phase 0 and Phase 1 Execution

## Goal

Complete the repository audit and implement only the Phase 1 storage/model foundation required by `ToDoList.md`.

## Current Phase

Phase 5

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

## Decisions Made

| Decision                                                                   | Rationale                                                                                                                    |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Reuse the existing pref-backed storage layer instead of introducing SQLite | The repository already has a minimal storage module and Phase 1 does not require a heavier persistence backend               |
| Add one minimal FTL locale file and ignore `*.ftl` in Prettier             | The scaffold generates invalid `typings/i10n.d.ts` when no locale messages exist, and Prettier does not parse FTL by default |

## Errors Encountered

| Error                                                                       | Resolution                                                                             |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `git status` failed because the working directory is not a Git repository   | Continue with filesystem-based inspection and note the limitation in the final summary |
| `npm run build` initially failed on generated `typings/i10n.d.ts`           | Added a minimal locale file so the scaffold emits a valid `FluentMessageId` union      |
| `npm run lint:check` still reports formatting drift in untouched repo files | Verified the touched Phase 1 files separately and left unrelated formatting as-is      |
