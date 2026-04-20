# ToDoList.md
# Project: Zotero CS Research Workbench
# Goal: Implement PRD v0.1 in a controlled, incremental way for a Zotero 7 plugin

## Global Requirements

- Follow PRD v0.1 only. Do not expand scope on your own.
- Prioritize correctness, maintainability, and minimal-risk changes over feature count.
- Implement tasks incrementally and keep the plugin runnable after each milestone.
- Before editing, first inspect the existing codebase structure and identify:
  - plugin entry points
  - build system
  - UI registration points
  - storage / cache layer
  - existing utility modules
- Reuse existing architecture where possible. Do not introduce heavy abstractions unless necessary.
- Do not add online services as core dependencies.
- Do not implement LLM-based features in this phase.
- Do not implement topic map, subscription, collaboration, submission assistant, or citation graph.
- Preserve original Zotero item metadata. Store enhanced results separately.
- User overrides must always take precedence over automatic results.
- For every completed step:
  1. explain what was changed
  2. explain which files were changed
  3. explain how to test it
  4. run available checks if possible
- If a task depends on uncertain codebase details, inspect first and then adapt, but stay within the task intent.
- Do not do large speculative refactors.

---

## Phase 0 — Initial Audit and Plan

### Task 0.1: Inspect repository
- Read the repository structure.
- Identify package manager, build commands, dev commands, lint/test commands.
- Identify Zotero plugin bootstrap / registration code.
- Identify how custom panes, columns, menus, preferences, and storage are implemented.
- Identify whether TypeScript is already used.
- Summarize findings before making changes.

### Task 0.2: Produce an implementation plan
- Convert the tasks below into a concrete execution order adapted to the actual repo.
- List expected files/modules to create or modify.
- Flag any missing infrastructure that must be added first.

**Deliverable**
- A concise implementation plan in chat, then begin Phase 1.

---

## Phase 1 — Data Model and Storage Foundation

### Task 1.1: Create storage schema for v0.1
Implement local storage for these logical tables or equivalent structures:

- venue_master
- artifact_links
- paper_tags
- user_overrides

Required fields:

#### venue_master
- venue_id
- canonical_name
- short_name
- type
- ccf_rank
- core_rank
- aliases_json
- updated_at

#### artifact_links
- item_key
- doi_url
- arxiv_url
- openreview_url
- code_url
- project_url
- source
- updated_at

#### paper_tags
- item_key
- task_json
- method_json
- dataset_json
- metric_json
- updated_at

#### user_overrides
- item_key
- venue_override_json
- artifact_override_json
- tag_override_json
- updated_at

Requirements:
- Use existing storage conventions if the repo already has one.
- If the plugin already uses SQLite, extend it carefully.
- If not, use a lightweight local persistence approach consistent with the codebase.
- Keep read/write APIs clean and isolated.

### Task 1.2: Define typed interfaces
- Add TypeScript interfaces / types for all v0.1 entities.
- Keep naming consistent and explicit.
- Avoid mixing raw source data with normalized data.

### Task 1.3: Implement override merge logic
- Automatic data and user overrides must be stored separately.
- UI reads must resolve final values as:
  user override > automatic resolved value > empty

**Deliverable**
- Storage layer and typed model ready for upper-layer use.

---

## Phase 2 — Venue Lite

### Task 2.1: Add venue normalization module
Implement:
- raw venue extraction from Zotero item
- canonicalization helpers
- alias matching
- conference / journal / unknown classification

Requirements:
- Matching failure must degrade safely to unknown.
- Do not overwrite original Zotero fields.
- Make the matcher easy to extend.

### Task 2.2: Seed venue_master
- Add an initial local venue dataset for common CS venues.
- Include at least representative venues from:
  - AI/ML
  - NLP
  - CV
  - RecSys
  - Security
  - DB
  - SE
  - HCI
- Include:
  canonical name, short name, aliases, ccf_rank if known, core_rank if known, type

Requirements:
- Keep the data file maintainable.
- Separate data from matching logic.

### Task 2.3: Expose venue data to UI
Implement final resolved fields:
- venue_short
- venue_type
- ccf_rank
- core_rank

### Task 2.4: Add manual correction mechanism
Provide a lightweight way for users to manually correct venue mapping:
- per-item override
- safe persistence
- refresh should not destroy manual corrections

**Deliverable**
- Venue resolution works end-to-end from item -> normalized result -> override-aware final result.

---

## Phase 3 — Artifact Hub

### Task 3.1: Implement identifier extraction
From Zotero items, detect and normalize:
- DOI
- arXiv
- OpenReview
- URL fields already present in metadata

### Task 3.2: Build artifact resolver
Resolve and store:
- doi_url
- arxiv_url
- openreview_url
- code_url
- project_url

Rules:
- Only high-confidence automatic resolution in v0.1.
- Code and project links may be manually filled if auto-detection is weak.
- Keep provenance/source info if practical.

### Task 3.3: Add copy/open helpers
Implement:
- copy all artifact links
- open selected artifact link

Requirements:
- Graceful handling of missing links
- No crash on malformed URLs

**Deliverable**
- Artifact data can be extracted, stored, displayed, copied, and opened.

---

## Phase 4 — Structured Tags Lite

### Task 4.1: Implement tag model
Support editable multi-value tags for:
- task
- method
- dataset
- metric

### Task 4.2: Build single-item editor
- Add a UI editor for the four tag groups.
- Support add/remove/edit.
- Save to local storage.

### Task 4.3: Build batch-edit support
- Allow applying one or more tags to multiple selected items.
- Do not erase existing values unless explicitly requested.

### Task 4.4: Optional suggestion scaffold
- If easy and low-risk, add a disabled-by-default suggestion hook.
- Do not implement complex extraction.
- Suggestions must never overwrite user edits automatically.

**Deliverable**
- Users can manage the four structured tag fields reliably.

---

## Phase 5 — Reading Note Template

### Task 5.1: Add note template generator
Generate a reading note template for a selected paper with these sections:
- Problem
- Core Idea
- Method Overview
- Experimental Setup
- Main Results
- Limitations
- Relation to My Work

### Task 5.2: Output targets
Support:
- creating a Zotero Note
- copying Markdown text
- copying plain text

Requirements:
- v0.1 only generates the template skeleton
- Do not auto-summarize the paper

**Deliverable**
- One-click note template generation is available.

---

## Phase 6 — Related Work Export

### Task 6.1: Build exporter
For multiple selected items, export a comparison table with fields:
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

### Task 6.2: Output formats
Implement:
- Markdown table
- CSV

Requirements:
- Missing values should be empty, not errors.
- Keep field order stable.
- Export should remain usable up to 100 selected items.

**Deliverable**
- Multi-paper comparison export works in Markdown and CSV.

---

## Phase 7 — UI Integration

### Task 7.1: Add item list columns
Add minimal useful columns:
- Venue Short
- CCF Rank
- CORE Rank
- Has Code
- Has OpenReview

Requirements:
- Columns should not noticeably degrade scrolling performance.
- Prefer cached values.

### Task 7.2: Add detail pane cards
Create 3 sections/cards:

#### Venue
- Full Name
- Short Name
- Type
- CCF
- CORE

#### Artifacts
- DOI
- arXiv
- OpenReview
- Code
- Project

#### Structure & Workflow
- Task
- Method
- Dataset
- Metric
- Generate Note
- Export Related Work

### Task 7.3: Add context menu actions
Add:
- Refresh Venue Match
- Edit Structured Tags
- Generate Reading Note
- Export Related Work
- Copy Artifact Links

**Deliverable**
- Core v0.1 features are accessible from list, detail pane, and context menu.

---

## Phase 8 — Stability, Settings, and Polish

### Task 8.1: Add plugin settings
Add only minimal settings if needed:
- enable/disable certain columns
- enable/disable optional suggestions
- reset local cache if necessary

### Task 8.2: Error handling
- All resolver failures must fail safely.
- No corruption of Zotero data.
- Invalid external data should not block UI rendering.

### Task 8.3: Performance review
Check:
- list column access
- repeated resolver calls
- detail pane rendering
- export performance

Add caching where needed, but keep logic understandable.

### Task 8.4: Basic documentation
Update README with:
- what v0.1 implements
- what it explicitly does not implement
- how to build/run/test
- screenshots or usage notes if easy

**Deliverable**
- v0.1 is stable, documented, and demoable.

---

## Phase 9 — Final Validation

### Task 9.1: Manual test checklist
Verify:
- venue resolution works on representative CS papers
- manual venue overrides persist
- artifact links resolve and copy correctly
- tag editing works for single and batch modes
- note template generation works
- related work export works
- UI remains responsive

### Task 9.2: Final report
At the end, provide:
1. changed files
2. feature summary
3. known limitations
4. recommended next steps for v0.2

---

## Hard Constraints

- Stay within PRD v0.1 scope.
- No speculative v0.2/v1.0 implementation.
- No hidden behavior.
- No destructive metadata writes.
- No heavy online dependency.
- No fake completion claims: if something is incomplete, say so clearly.

## Preferred Working Style

- Small, reviewable steps
- Minimal but solid abstractions
- Explain before large edits
- Test after each meaningful milestone