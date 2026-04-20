
# Zotero CS Research Workbench

A Zotero 7 plugin for computer science researchers.

It augments Zotero items with lightweight CS-oriented metadata and workflow tools, including:

- venue normalization and ranking display
- artifact link aggregation
- structured paper tags
- reading note template generation
- related work table export

The goal is to turn Zotero from a generic reference manager into a practical literature workbench for CS research.

---

## Why this project

Zotero is already strong for general reference management, but computer science researchers often need additional capabilities that are not first-class in the default experience:

- quickly identify conference/journal venues and abbreviations
- check CCF / CORE rank at a glance
- open paper-related resources such as arXiv, OpenReview, code, and project pages
- maintain structured tags like Task / Method / Dataset / Metric
- generate consistent reading-note templates
- export literature comparison tables for related work writing

This plugin focuses on those high-frequency workflows.

---

## Project status

Current target: **v0.1**

This repository is currently scoped to a strict first version.  
The goal of v0.1 is **not** to build a full research platform, but to validate a compact, high-value Zotero workflow for CS users.

See:

- `PRD_v0.1.md` for product scope and acceptance criteria
- `ToDoList.md` for engineering execution order and constraints

---

## v0.1 scope

v0.1 includes only the following modules:

1. **Venue Lite**
2. **Artifact Hub**
3. **Structured Tags Lite**
4. **Reading Note Template**
5. **Related Work Export**

### 1) Venue Lite
Enhance Zotero items with:

- venue short name
- venue type
- CCF rank
- CORE rank

Features:
- venue normalization
- alias matching
- manual correction
- safe local persistence

### 2) Artifact Hub
Aggregate high-confidence paper resources:

- DOI
- arXiv
- OpenReview
- Code
- Project

Features:
- identifier extraction
- local artifact storage
- copy all links
- open selected links

### 3) Structured Tags Lite
Allow users to maintain lightweight multi-value tags for:

- Task
- Method
- Dataset
- Metric

Features:
- single-item editing
- batch editing
- local persistence
- user overrides take precedence

### 4) Reading Note Template
Generate a note template for a selected paper with sections such as:

- Problem
- Core Idea
- Method Overview
- Experimental Setup
- Main Results
- Limitations
- Relation to My Work

Output targets:
- Zotero Note
- Markdown
- plain text

### 5) Related Work Export
Export comparison tables for multiple selected papers.

Output formats:
- Markdown table
- CSV

Default export fields:
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

---

## Explicitly out of scope for v0.1

The following are intentionally excluded from the first release:

- JCR / CAS / IF integration
- high-accuracy automatic paper understanding
- baseline / reproducibility scoring
- paper type inference
- topic map / knowledge graph
- citation lineage graph
- subscriptions / tracking / reminders
- team collaboration
- submission assistant
- LLM-based analysis pipeline
- heavy online services as core dependencies

---

## Design principles

This project follows a few strict rules:

- **Stay within PRD v0.1 scope**
- **Prefer small, reliable features over broad automation**
- **Do not destructively modify original Zotero metadata**
- **Store automatic results separately from user overrides**
- **User overrides must always win**
- **Fail safely when parsing or external resolution is incomplete**
- **Keep the plugin usable offline for cached/local features**
- **Favor maintainability over speculative abstraction**

---

## Data model (v0.1)

The plugin is expected to maintain local storage for these logical entities:

- `venue_master`
- `artifact_links`
- `paper_tags`
- `user_overrides`

### Resolution priority

Final displayed values must follow this rule:

`user override > automatic resolved value > empty`

---

## Planned UI surface

### Item list columns
Minimal columns planned for v0.1:

- Venue Short
- CCF Rank
- CORE Rank
- Has Code
- Has OpenReview

### Detail pane cards
Three cards are planned:

1. **Venue**
2. **Artifacts**
3. **Structure & Workflow**

### Context menu actions
Planned actions:

- Refresh Venue Match
- Edit Structured Tags
- Generate Reading Note
- Export Related Work
- Copy Artifact Links

---

## Repository guidance for coding agents

If you are using Codex / Claude Code / other coding agents:

- Read `ToDoList.md` first
- Treat `ToDoList.md` as the execution contract
- Use `PRD_v0.1.md` as the product boundary reference
- Do not implement features outside v0.1 scope
- Keep changes incremental and reviewable
- Preserve existing repo architecture where possible
- Do not claim completion unless wiring, storage, UI, and basic verification are all done

Recommended rule:

> If `ToDoList.md` and `PRD_v0.1.md` differ, follow `ToDoList.md` for execution order and `PRD_v0.1.md` for product intent and scope.

---

## Suggested development order

1. storage + typed model
2. venue lite
3. artifact hub
4. structured tags lite
5. reading note template
6. related work export
7. UI integration
8. settings / error handling / documentation

---

## Success criteria for v0.1

v0.1 is considered successful if a user can:

1. see venue short / CCF / CORE in the item list
2. open a paper and see DOI / arXiv / OpenReview / Code / Project
3. edit Task / Method / Dataset / Metric
4. generate a reading note template with one click
5. export Markdown / CSV related-work tables for multiple selected items
6. rely on manual corrections that persist across refreshes

---

## Build / run / test

> To be filled according to the actual repository structure.

Recommended sections to add after the repo bootstrap is confirmed:

- prerequisites
- install
- dev build
- production build
- test
- packaging
- screenshots

---

## Roadmap

### v0.1
- venue lite
- artifact hub
- structured tags lite
- reading note template
- related work export

### v0.2
Possible future extensions, not part of current implementation scope:
- baseline / repro manual tags
- paper type
- more artifact types
- lightweight suggestions
- stronger batch editing and filtering

### v0.3+
Possible later directions:
- citation lineage
- topic clustering
- tracking / subscriptions
- collaboration
- optional AI-assisted analysis

---

## License

> To be decided.

---

## One-line summary

Zotero CS Research Workbench is a Zotero 7 plugin that adds CS-specific venue metadata, artifact links, lightweight structured tags, note templates, and related-work export tools to support real research workflows.