import { expect } from "chai";

import { createArtifactHubService } from "../../src/modules/artifact";
import { createWorkbenchStorage } from "../../src/modules/storage";
import { createStructuredTagService } from "../../src/modules/tags";
import {
  buildCopyArtifactLinksText,
  buildDetailPaneData,
  buildRelatedWorkExportText,
  generateReadingNoteForItem,
  getColumnValue,
  invalidateUIStateCache,
  editStructuredTagsWithPrompts,
} from "../../src/modules/ui";
import { createVenueLiteService } from "../../src/modules/venue";
import type { WorkbenchUIItem } from "../../src/modules/ui";
import {
  resetTestEnv,
  restoreNow,
  installZoteroPrefsMock,
} from "../storage/testUtils";

function createItem(
  fields: Record<string, string>,
  key = "paper-1",
  options: {
    id?: number;
    regular?: boolean;
    note?: boolean;
    attachment?: boolean;
  } = {},
): WorkbenchUIItem {
  return {
    id: options.id ?? 1,
    key,
    libraryID: 1,
    getField(field: string) {
      return fields[field] ?? "";
    },
    isRegularItem: () => options.regular ?? true,
    isNote: () => options.note ?? false,
    isAttachment: () => options.attachment ?? false,
  };
}

describe("Phase 7 UI helpers and actions", function () {
  beforeEach(function () {
    resetTestEnv();
    invalidateUIStateCache();
  });

  after(function () {
    restoreNow();
  });

  it("derives column values and detail-pane data from existing services", function () {
    const storage = createWorkbenchStorage();
    const venueService = createVenueLiteService(storage);
    const artifactService = createArtifactHubService(storage);
    const tagService = createStructuredTagService(storage);

    venueService.ensureSeedData();
    tagService.setTags("paper-1", {
      taskJson: ["text generation"],
      methodJson: ["transformer"],
      datasetJson: ["wmt14"],
      metricJson: ["bleu"],
    });

    const item = createItem({
      title: "A Paper",
      conferenceName: "International Conference on Machine Learning",
      extra: [
        "Code: https://github.com/example/project",
        "OpenReview: https://openreview.net/forum?id=paper1",
      ].join("\n"),
    });

    const services = { venueService, artifactService, tagService };

    expect(getColumnValue(item, "venueShort", services)).to.equal("ICML");
    expect(getColumnValue(item, "ccfRank", services)).to.equal("A");
    expect(getColumnValue(item, "coreRank", services)).to.equal("A*");
    expect(getColumnValue(item, "hasCode", services)).to.equal("Yes");
    expect(getColumnValue(item, "hasOpenReview", services)).to.equal("Yes");

    const detail = buildDetailPaneData(item, services);
    expect(detail.venue.summary).to.equal("ICML");
    expect(detail.artifacts.summary).to.equal("2 link(s)");
    expect(detail.workflow.summary).to.equal("4 tag(s)");
    expect(detail.workflow.task).to.equal("text generation");
    expect(detail.workflow.method).to.equal("transformer");
  });

  it("builds artifact-link clipboard text in fixed order and safe fallback", function () {
    const storage = createWorkbenchStorage();
    const venueService = createVenueLiteService(storage);
    const artifactService = createArtifactHubService(storage);
    const tagService = createStructuredTagService(storage);
    const services = { venueService, artifactService, tagService };

    const item = createItem({
      DOI: "10.1000/test",
      url: "https://arxiv.org/abs/2401.12345",
      extra: [
        "OpenReview: https://openreview.net/forum?id=test123",
        "Code: https://github.com/example/project",
      ].join("\n"),
    });

    expect(buildCopyArtifactLinksText(item, services)).to.equal(
      [
        "DOI: https://doi.org/10.1000/test",
        "arXiv: https://arxiv.org/abs/2401.12345",
        "OpenReview: https://openreview.net/forum?id=test123",
        "Code: https://github.com/example/project",
      ].join("\n"),
    );

    expect(
      buildCopyArtifactLinksText(createItem({}, "empty"), services),
    ).to.equal("");
  });

  it("edits structured tags through prompt responses and treats cancel as no-op", function () {
    const storage = createWorkbenchStorage();
    const tagService = createStructuredTagService(storage);

    tagService.setTags("paper-1", {
      taskJson: ["classification"],
      methodJson: ["cnn"],
      datasetJson: ["imagenet"],
      metricJson: ["accuracy"],
    });

    const updated = editStructuredTagsWithPrompts(
      createItem({}, "paper-1"),
      (() => {
        const responses = [
          "reasoning; planning",
          "transformer",
          "hotpotqa",
          "f1; em",
        ];
        return () => responses.shift() ?? "";
      })(),
      { tagService },
    );

    expect(updated).to.deep.include({
      itemKey: "paper-1",
      taskJson: ["reasoning", "planning"],
      methodJson: ["transformer"],
      datasetJson: ["hotpotqa"],
      metricJson: ["f1", "em"],
    });

    const unchanged = editStructuredTagsWithPrompts(
      createItem({}, "paper-1"),
      (_label, _defaultValue) => null,
      { tagService },
    );

    expect(unchanged).to.equal(null);
    expect(tagService.getTags("paper-1")).to.deep.include({
      taskJson: ["reasoning", "planning"],
      methodJson: ["transformer"],
      datasetJson: ["hotpotqa"],
      metricJson: ["f1", "em"],
    });
  });

  it("filters non-regular items when exporting related work", function () {
    const calls: WorkbenchUIItem[][] = [];
    const output = buildRelatedWorkExportText(
      [
        createItem({ title: "Keep me" }, "paper-1"),
        createItem({ title: "Skip me" }, "note-1", {
          regular: false,
          note: true,
        }),
      ],
      "csv",
      {
        relatedWorkService: {
          collectRows(items: WorkbenchUIItem[]) {
            calls.push(items);
            return [
              {
                Title: "Keep me",
                Year: "2024",
                "Venue Short": "",
                "CCF Rank": "",
                "CORE Rank": "",
                Task: "",
                Method: "",
                Dataset: "",
                Metric: "",
                Code: "",
                Notes: "",
              },
            ];
          },
          toCSV() {
            return "csv-output";
          },
          toMarkdown() {
            return "markdown-output";
          },
        } as any,
      },
    );

    expect(output).to.equal("csv-output");
    expect(calls).to.have.lengthOf(1);
    expect(calls[0]).to.have.lengthOf(1);
    expect(calls[0][0].key).to.equal("paper-1");
  });

  it("delegates reading-note creation only for regular items", async function () {
    installZoteroPrefsMock();

    const created = {
      noteItem: { id: 99 } as Zotero.Item,
      format: "markdown" as const,
      content: "# Reading Note",
    };
    const calls: string[] = [];
    const readingNoteService = {
      async createZoteroNote(item: WorkbenchUIItem) {
        calls.push(item.key ?? "");
        return created;
      },
    };

    expect(
      await generateReadingNoteForItem(createItem({}, "paper-1"), {
        readingNoteService,
      }),
    ).to.equal(created);
    expect(calls).to.deep.equal(["paper-1"]);

    expect(
      await generateReadingNoteForItem(
        createItem({}, "note-1", { regular: false, note: true }),
        { readingNoteService },
      ),
    ).to.equal(null);
    expect(calls).to.deep.equal(["paper-1"]);
  });

  it("does not mutate source item data when assembling UI state", function () {
    const storage = createWorkbenchStorage();
    const venueService = createVenueLiteService(storage);
    const artifactService = createArtifactHubService(storage);
    const tagService = createStructuredTagService(storage);
    venueService.ensureSeedData();

    const fields = {
      conferenceName: "International Conference on Machine Learning",
      extra: "Code: https://github.com/example/project",
    };
    const snapshot = JSON.parse(JSON.stringify(fields));
    const item = createItem(fields, "paper-immutable");

    void getColumnValue(item, "venueShort", {
      venueService,
      artifactService,
      tagService,
    });
    void buildDetailPaneData(item, {
      venueService,
      artifactService,
      tagService,
    });
    void buildCopyArtifactLinksText(item, {
      venueService,
      artifactService,
      tagService,
    });

    expect(fields).to.deep.equal(snapshot);
  });
});
