# Zotero CS Research Workbench

A Zotero 7 plugin for computer science literature workflows.

It adds a small, local-first research workbench on top of Zotero items:

- venue normalization with CCF and CORE ranks
- artifact link extraction for DOI, arXiv, OpenReview, code, and project URLs
- structured `Task` / `Method` / `Dataset` / `Metric` tags
- deterministic reading-note templates
- related-work export to Markdown and CSV
- minimal Zotero UI integration through columns, item-pane sections, context-menu actions, and a small preferences pane

The v0.1 target is deliberately narrow: stable local workflows, explicit overrides, and no speculative automation.

## Status

Current scope: **v0.1 complete**

See:

- [PRD_v0.1.md](PRD_v0.1.md) for product intent
- [ToDoList.md](ToDoList.md) for implementation phases and scope boundaries

## Implemented in v0.1

### Venue Lite

- deterministic venue extraction from Zotero metadata
- local venue seed dataset for representative CS venues
- alias matching plus conference/journal/unknown classification
- resolved venue values:
  - `Venue Short`
  - `CCF Rank`
  - `CORE Rank`
- per-item venue override support

### Artifact Hub

- deterministic extraction and normalization for:
  - DOI
  - arXiv
  - OpenReview
  - existing URL fields
- local artifact persistence
- manual artifact override support for code and project links

### Structured Tags Lite

- structured multi-value tags for:
  - `Task`
  - `Method`
  - `Dataset`
  - `Metric`
- single-item replace / patch / append / remove / clear operations
- batch append / remove / replace operations
- minimal prompt-based editor from the Zotero context menu

### Reading Note Template

- deterministic Markdown and plain-text note generation
- optional Zotero child-note creation
- metadata-aware header using current item plus existing local venue/artifact services
- fixed default sections:
  - Problem
  - Core Idea
  - Method Overview
  - Experimental Setup
  - Main Results
  - Limitations
  - Relation to My Work

### Related Work Export

- deterministic multi-item row assembly
- Markdown table export
- CSV export
- fixed export fields:
  - Title
  - Year
  - Venue Short
  - CCF Rank
  - CORE Rank
  - Task
  - Method
  - Dataset
  - Metric
  - Code
  - Notes

### Minimal UI Integration

#### Item list columns

- Venue Short
- CCF Rank
- CORE Rank
- Has Code
- Has OpenReview

#### Item-pane sections

- Venue
- Artifacts
- Structure & Workflow

#### Context-menu actions

- Refresh Venue Match
- Edit Structured Tags
- Generate Reading Note
- Export Related Work
- Copy Artifact Links

#### Minimal preferences

- enable or disable workbench item-list columns
- enable or disable workbench item-pane sections
- enable or disable workbench context-menu actions
- reset local workbench data and reseed built-in venue data

## Deliberately out of scope for v0.1

- LLM features
- paper summarization or content inference
- related-work prose generation
- citation graphs, topic maps, or submission assistant logic
- collaboration features
- cloud sync as a core requirement
- Excel-native export
- large custom settings or custom tag-editor UI
- broader v0.2 workflow expansion

## Data model and precedence

Local workbench data is stored separately from original Zotero metadata.

Logical storage entities:

- `venue_master`
- `artifact_links`
- `paper_tags`
- `user_overrides`

Resolved values always follow:

`user override > automatic resolved value > empty`

The plugin does **not** overwrite original Zotero metadata.

## Development

### Requirements

- Node.js
- npm
- Zotero 7 for live plugin testing

### Install

```bash
npm install
```

### Run in development

```bash
npm run start
```

This uses `zotero-plugin-scaffold` to build and serve the plugin for a Zotero development profile.

### Build

```bash
npm run build
```

This runs the scaffold build and then `tsc --noEmit`.

### Lint and format

```bash
npm run lint:check
npm run lint:fix
```

### Tests

Zotero-integrated test runner:

```bash
npm test
```

Local Mocha path used during repository development when Zotero is unavailable:

```bash
node --import tsx ./node_modules/mocha/bin/mocha.js \
  --require ./test/storage/mochaGlobals.cjs \
  "./test/storage/**/*.test.ts" \
  "./test/venue/**/*.test.ts" \
  "./test/artifact/**/*.test.ts" \
  "./test/tags/**/*.test.ts" \
  "./test/notes/**/*.test.ts" \
  "./test/relatedWork/**/*.test.ts" \
  "./test/ui/**/*.test.ts"
```

## Manual verification checklist

Use a Zotero profile with the plugin loaded and a few CS paper items that cover venue, artifact, and tag cases.

### Core UI

- Verify the item list exposes:
  - `Venue Short`
  - `CCF Rank`
  - `CORE Rank`
  - `Has Code`
  - `Has OpenReview`
- Select a regular item and verify the item pane shows:
  - `Venue`
  - `Artifacts`
  - `Structure & Workflow`
- Select attachments or notes and verify the added sections fail safely or stay hidden.

### Venue and artifacts

- Confirm known venues normalize to the expected short name and ranks.
- Confirm missing or unknown venue metadata degrades safely to empty values.
- Confirm DOI, arXiv, OpenReview, code, and project links appear only when locally resolvable.

### Structured tags

- Use `Edit Structured Tags` from the item context menu.
- Confirm prompt edits persist locally.
- Confirm repeated append/remove flows remain stable and do not duplicate values unexpectedly.

### Reading notes

- Use `Generate Reading Note` on a regular item.
- Confirm a Zotero child note is created.
- Confirm the note contains the fixed section template and item-derived header metadata when available.

### Related-work export

- Select multiple regular items.
- Use `Export Related Work` and verify Markdown and CSV clipboard output.
- Confirm empty venue/artifact/tag fields serialize safely as empty cells.

### Preferences

- Open the plugin preference pane.
- Disable and re-enable columns, sections, and context-menu actions.
- Confirm the UI updates without restart.
- Trigger `Reset local workbench data` and confirm:
  - cached artifacts/tags/overrides are cleared
  - built-in venue seed data remains available

### Failure handling

- Try actions with no valid regular-item selection.
- Confirm the plugin shows safe no-op alerts instead of crashing.
- Confirm clipboard-dependent flows fail cleanly if clipboard access is unavailable.

## Screenshots

Screenshots are not included yet.

Suggested future additions:

- item-list columns
- item-pane sections
- prompt-based structured-tag editor
- related-work export results
- preferences pane

## Known limitations

- Venue coverage is representative, not exhaustive.
- Artifact detection is intentionally conservative and local-only.
- Structured tag editing uses prompt dialogs, not a full custom editor.
- Related-work `Notes` is currently exported as an empty column by design.
- Item-pane artifact values render as text, not clickable links.
- The plugin relies on Zotero runtime APIs for live behavior; full end-to-end UI automation is limited in this repository.

## Architecture notes

- Core storage lives under `src/modules/storage` and uses `Zotero.Prefs` JSON persistence.
- Domain services live under:
  - `src/modules/venue`
  - `src/modules/artifact`
  - `src/modules/tags`
  - `src/modules/notes`
  - `src/modules/relatedWork`
- UI integration lives under `src/modules/ui`.
- Plugin lifecycle wiring is centered in [src/hooks.ts](src/hooks.ts) and [src/addon.ts](src/addon.ts).

## Guidance for future work

- Treat `ToDoList.md` as the execution contract.
- Use `PRD_v0.1.md` for scope intent and product boundaries.
- Preserve the local-first storage and explicit override model.
- Avoid broad refactors unless they are required for correctness or a clearly scoped new phase.
