/* global afterEach, beforeEach, describe, it, assert */

import { createArtifactHubService } from "../../src/modules/artifact";
import { createReadingNoteTemplateService } from "../../src/modules/notes";
import { createWorkbenchStorage } from "../../src/modules/storage/workbenchStorage";
import { createVenueLiteService } from "../../src/modules/venue";
import type {
  ReadingNoteCreator,
  ReadingNoteResolvableItem,
} from "../../src/modules/notes";
import { resetTestEnv, restoreNow } from "../storage/testUtils";

class FakeZoteroNoteItem {
  static created: FakeZoteroNoteItem[] = [];

  libraryID = 0;
  parentItemID?: number;
  noteContent = "";
  saved = false;

  constructor(public readonly itemType: string) {
    FakeZoteroNoteItem.created.push(this);
  }

  setNote(content: string): boolean {
    this.noteContent = content;
    return true;
  }

  async saveTx(): Promise<number> {
    this.saved = true;
    return 1;
  }
}

function installNoteItemMock(): void {
  FakeZoteroNoteItem.created = [];
  globalThis.Zotero = {
    ...(globalThis.Zotero ?? {}),
    Item: FakeZoteroNoteItem as unknown as typeof Zotero.Item,
  } as typeof Zotero;
}

function createItem(
  fields: Record<string, string>,
  creators: ReadingNoteCreator[] = [],
  key = "item-1",
): ReadingNoteResolvableItem {
  return {
    id: 101,
    key,
    libraryID: 1,
    getField(field: string) {
      return fields[field] ?? "";
    },
    getCreatorsJSON() {
      return creators;
    },
  };
}

describe("reading note template service", function () {
  beforeEach(function () {
    resetTestEnv();
    installNoteItemMock();
  });

  afterEach(function () {
    restoreNow();
  });

  it("generates deterministic markdown with metadata header when venue and artifacts are available", function () {
    const storage = createWorkbenchStorage();
    const venueService = createVenueLiteService(storage);
    const artifactService = createArtifactHubService(storage);
    const service = createReadingNoteTemplateService(
      venueService,
      artifactService,
    );

    const markdown = service.generateMarkdown(
      createItem(
        {
          title: "A Structured Test Paper",
          date: "2024-06-01",
          conferenceName: "International Conference on Machine Learning",
          DOI: "10.1145/ABC.DEF",
          archiveID: "2401.12345",
          url: "https://openreview.net/forum?id=or123",
          extra: [
            "Code: https://github.com/example/repo",
            "Project: https://example.com/project",
          ].join("\n"),
        },
        [{ firstName: "Alice", lastName: "Smith" }, { name: "Bob Jones" }],
      ),
    );

    assert.equal(
      markdown,
      [
        "# Reading Note",
        "",
        "## Paper",
        "",
        "- Title: A Structured Test Paper",
        "- Authors: Alice Smith, Bob Jones",
        "- Year: 2024",
        "- Venue: ICML",
        "- DOI: https://doi.org/10.1145/abc.def",
        "- arXiv: https://arxiv.org/abs/2401.12345",
        "- OpenReview: https://openreview.net/forum?id=or123",
        "- Code: https://github.com/example/repo",
        "- Project: https://example.com/project",
        "",
        "## Problem",
        "",
        "-",
        "",
        "## Core Idea",
        "",
        "-",
        "",
        "## Method Overview",
        "",
        "-",
        "",
        "## Experimental Setup",
        "",
        "-",
        "",
        "## Main Results",
        "",
        "-",
        "",
        "## Limitations",
        "",
        "-",
        "",
        "## Relation to My Work",
        "",
        "-",
      ].join("\n"),
    );
  });

  it("generates deterministic plain text output with the same default sections", function () {
    const storage = createWorkbenchStorage();
    const venueService = createVenueLiteService(storage);
    const artifactService = createArtifactHubService(storage);
    const service = createReadingNoteTemplateService(
      venueService,
      artifactService,
    );

    const plainText = service.generatePlainText(
      createItem(
        {
          title: "A Structured Test Paper",
          date: "2024",
        },
        [{ firstName: "Alice", lastName: "Smith" }],
      ),
    );

    assert.equal(
      plainText,
      [
        "Reading Note",
        "",
        "Paper",
        "",
        "Title: A Structured Test Paper",
        "Authors: Alice Smith",
        "Year: 2024",
        "",
        "Problem",
        "",
        "-",
        "",
        "Core Idea",
        "",
        "-",
        "",
        "Method Overview",
        "",
        "-",
        "",
        "Experimental Setup",
        "",
        "-",
        "",
        "Main Results",
        "",
        "-",
        "",
        "Limitations",
        "",
        "-",
        "",
        "Relation to My Work",
        "",
        "-",
      ].join("\n"),
    );
  });

  it("falls back safely when item metadata is incomplete", function () {
    const storage = createWorkbenchStorage();
    const venueService = createVenueLiteService(storage);
    const artifactService = createArtifactHubService(storage);
    const service = createReadingNoteTemplateService(
      venueService,
      artifactService,
    );

    const markdown = service.generateMarkdown(createItem({}, [], "blank-item"));

    assert.equal(
      markdown,
      [
        "# Reading Note",
        "",
        "## Problem",
        "",
        "-",
        "",
        "## Core Idea",
        "",
        "-",
        "",
        "## Method Overview",
        "",
        "-",
        "",
        "## Experimental Setup",
        "",
        "-",
        "",
        "## Main Results",
        "",
        "-",
        "",
        "## Limitations",
        "",
        "-",
        "",
        "## Relation to My Work",
        "",
        "-",
      ].join("\n"),
    );
  });

  it("does not mutate source item fields or creators", function () {
    const storage = createWorkbenchStorage();
    const venueService = createVenueLiteService(storage);
    const artifactService = createArtifactHubService(storage);
    const service = createReadingNoteTemplateService(
      venueService,
      artifactService,
    );
    const fields = {
      title: "Immutable Paper",
      date: "2023",
      conferenceName: "Advances in Neural Information Processing Systems",
    };
    const creators: ReadingNoteCreator[] = [
      { firstName: "Ada", lastName: "Lovelace" },
    ];
    const fieldsSnapshot = JSON.parse(JSON.stringify(fields)) as typeof fields;
    const creatorsSnapshot = JSON.parse(
      JSON.stringify(creators),
    ) as typeof creators;

    service.generateMarkdown(createItem(fields, creators, "immutable-item"));

    assert.deepEqual(fields, fieldsSnapshot);
    assert.deepEqual(creators, creatorsSnapshot);
  });

  it("supports minimal section customization without changing the default behavior", function () {
    const storage = createWorkbenchStorage();
    const venueService = createVenueLiteService(storage);
    const artifactService = createArtifactHubService(storage);
    const service = createReadingNoteTemplateService(
      venueService,
      artifactService,
    );

    const markdown = service.generateMarkdown(createItem({}, []), {
      sections: ["Quick Summary", "Open Questions"],
    });

    assert.equal(
      markdown,
      [
        "# Reading Note",
        "",
        "## Quick Summary",
        "",
        "-",
        "",
        "## Open Questions",
        "",
        "-",
      ].join("\n"),
    );
  });

  it("creates a Zotero note with deterministic content and parent linkage", async function () {
    const storage = createWorkbenchStorage();
    const venueService = createVenueLiteService(storage);
    const artifactService = createArtifactHubService(storage);
    const service = createReadingNoteTemplateService(
      venueService,
      artifactService,
    );

    const created = await service.createZoteroNote(
      createItem(
        {
          title: "Note Creation Paper",
          date: "2025",
          conferenceName: "International Conference on Machine Learning",
        },
        [{ name: "Alice Smith" }],
        "note-item",
      ),
      { format: "plainText" },
    );

    assert.equal(created.format, "plainText");
    assert.include(created.content, "Title: Note Creation Paper");
    assert.lengthOf(FakeZoteroNoteItem.created, 1);
    const noteItem = FakeZoteroNoteItem.created[0];
    assert.equal(noteItem.itemType, "note");
    assert.equal(noteItem.libraryID, 1);
    assert.equal(noteItem.parentItemID, 101);
    assert.isTrue(noteItem.saved);
    assert.include(noteItem.noteContent, "<h1>Reading Note</h1>");
    assert.include(noteItem.noteContent, "<strong>Venue:</strong> ICML");
    assert.include(noteItem.noteContent, "<h2>Problem</h2>");
  });
});
