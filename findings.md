# Findings & Decisions

## Requirements

- Execute only Phase 0 and Phase 1 from `ToDoList.md`
- Preserve Zotero metadata and keep automatic data separate from user overrides
- Keep override precedence as `user override > automatic resolved value > empty`
- Add tests only for the Phase 1 storage layer modules under `src/modules/storage`

## Research Findings

- The plugin entry path is `addon/bootstrap.js` -> generated content script -> `src/index.ts` -> `src/addon.ts` -> `src/hooks.ts`
- The project uses `zotero-plugin-scaffold`, TypeScript, ESLint, and Prettier
- Storage currently uses `Zotero.Prefs` with JSON-serialized records under `src/modules/storage`
- No UI registration is implemented yet; `src/hooks.ts` explicitly leaves Phase 2+ UI work for later
- `addon/prefs.js` is empty, so preferences UI has not been introduced yet
- `src/hooks.ts` and the per-window toolkit map are the main extension points for later panes, columns, and menu wiring
- The existing storage module already matched the Phase 1 shape, but its merge logic used truthy fallbacks that could not represent explicit blank overrides
- The scaffold test runner discovers `test/**/*.{spec,test}.[jt]s` and uses Mocha + Chai inside Zotero
- The current environment does not have a Zotero binary, so direct `zotero-plugin test` execution is blocked here

## Technical Decisions

| Decision                                                                                       | Rationale                                                                             |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Keep Phase 1 within `src/modules/storage`                                                      | This is already the repository’s storage boundary and keeps changes minimal           |
| Prefer stronger typing and central defaults over adding new dependencies                       | Matches the current architecture and the Phase 1 scope                                |
| Expose a single `WorkbenchStorage` facade through `addon.data.storage` and `addon.api.storage` | Gives future phases one stable access point without adding UI or resolver logic now   |
| Keep the tests under `test/storage` with Mocha-style structure                                 | Matches the scaffold discovery pattern and isolates Phase 1 coverage cleanly          |
| Add `mocha`, `chai`, and `tsx` as test-only dependencies                                       | Provides a local execution path when Zotero is unavailable in the current environment |

## Issues Encountered

| Issue                                                                               | Resolution                                                                                       |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Repository is delivered without `.git` metadata in this environment                 | Use direct file inspection and local verification commands only                                  |
| The scaffold emitted invalid `typings/i10n.d.ts` because there were no locale files | Added `addon/locale/en-US/cs-workbench-addon.ftl` as a minimal build-time localization source    |
| Repo-wide `npm run lint:check` still fails on untouched markdown and utility files  | Left unrelated formatting alone and verified the changed Phase 1 files separately                |
| `npm test` cannot start because Zotero is not installed in this environment         | Ran the storage tests with local Mocha plus `tsx` while keeping the files in scaffold convention |

## Resources

- `ToDoList.md`
- `PRD_v0.1.md`
- `package.json`
- `src/modules/storage/*`
- `addon/bootstrap.js`
- `src/addon.ts`
- `src/hooks.ts`
- `zotero-plugin.config.ts`
