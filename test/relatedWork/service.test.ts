/* global afterEach, beforeEach, describe, it, assert */

import { createArtifactHubService } from "../../src/modules/artifact";
import { createRelatedWorkExportService } from "../../src/modules/relatedWork";
import { RELATED_WORK_EXPORT_FIELDS } from "../../src/modules/relatedWork";
import type { RelatedWorkResolvableItem } from "../../src/modules/relatedWork";
import { createWorkbenchStorage } from "../../src/modules/storage/workbenchStorage";
import { createStructuredTagService } from "../../src/modules/tags";
import { createVenueLiteService } from "../../src/modules/venue";
import { resetTestEnv, restoreNow } from "../storage/testUtils";

function installItemsLookupMock(
  itemsByKey: Record<string, RelatedWorkResolvableItem>,
): void {
  globalThis.Zotero = {
    ...(globalThis.Zotero ?? {}),
    Items: {
      async getByLibraryAndKeyAsync(_libraryID: number, key: string) {
        return itemsByKey[key] ?? false;
      },
    },
  } as typeof Zotero;
}

function createItem(
  fields: Record<string, string>,
  key: string,
): RelatedWorkResolvableItem {
  return {
    key,
    libraryID: 1,
    getField(field: string) {
      return fields[field] ?? "";
    },
  };
}

describe("related work export service", function () {
  beforeEach(function () {
    resetTestEnv();
  });

  afterEach(function () {
    restoreNow();
  });

  it("assembles deterministic rows in fixed field order from existing services", function () {
    const storage = createWorkbenchStorage();
    const venueService = createVenueLiteService(storage);
    const artifactService = createArtifactHubService(storage);
    const tagService = createStructuredTagService(storage);
    const service = createRelatedWorkExportService(
      venueService,
      artifactService,
      tagService,
    );

    tagService.setTags("paper-1", {
      taskJson: ["classification"],
      methodJson: ["transformer"],
      datasetJson: ["ImageNet"],
      metricJson: ["accuracy"],
    });
    tagService.setTags("paper-2", {
      taskJson: ["retrieval"],
      datasetJson: ["MSCOCO"],
    });

    const rows = service.collectRows([
      createItem(
        {
          title: "Paper One",
          date: "2024-01-01",
          conferenceName: "International Conference on Machine Learning",
          extra: "Code: https://github.com/example/paper-one",
        },
        "paper-1",
      ),
      createItem(
        {
          title: "Paper Two",
          date: "2023",
        },
        "paper-2",
      ),
    ]);

    assert.deepEqual(Object.keys(rows[0]), [...RELATED_WORK_EXPORT_FIELDS]);
    assert.deepEqual(rows, [
      {
        Title: "Paper One",
        Year: "2024",
        "Venue Short": "ICML",
        "CCF Rank": "A",
        "CORE Rank": "A*",
        Task: "classification",
        Method: "transformer",
        Dataset: "ImageNet",
        Metric: "accuracy",
        Code: "https://github.com/example/paper-one",
        Notes: "",
      },
      {
        Title: "Paper Two",
        Year: "2023",
        "Venue Short": "",
        "CCF Rank": "",
        "CORE Rank": "",
        Task: "retrieval",
        Method: "",
        Dataset: "MSCOCO",
        Metric: "",
        Code: "",
        Notes: "",
      },
    ]);
  });

  it("renders a stable markdown table and escapes representative cell content", function () {
    const storage = createWorkbenchStorage();
    const venueService = createVenueLiteService(storage);
    const artifactService = createArtifactHubService(storage);
    const tagService = createStructuredTagService(storage);
    const service = createRelatedWorkExportService(
      venueService,
      artifactService,
      tagService,
    );

    const markdown = service.toMarkdown([
      {
        Title: "Paper | One\nLine 2",
        Year: "2024",
        "Venue Short": "ICML",
        "CCF Rank": "A",
        "CORE Rank": "A*",
        Task: "classification",
        Method: "transformer",
        Dataset: "ImageNet",
        Metric: "accuracy",
        Code: "https://github.com/example/paper-one",
        Notes: "",
      },
    ]);

    assert.equal(
      markdown,
      [
        "| Title | Year | Venue Short | CCF Rank | CORE Rank | Task | Method | Dataset | Metric | Code | Notes |",
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
        "| Paper \\| One<br>Line 2 | 2024 | ICML | A | A* | classification | transformer | ImageNet | accuracy | https://github.com/example/paper-one |  |",
      ].join("\n"),
    );
  });

  it("renders a stable CSV export and quotes commas, quotes, and newlines", function () {
    const storage = createWorkbenchStorage();
    const venueService = createVenueLiteService(storage);
    const artifactService = createArtifactHubService(storage);
    const tagService = createStructuredTagService(storage);
    const service = createRelatedWorkExportService(
      venueService,
      artifactService,
      tagService,
    );

    const csv = service.toCSV([
      {
        Title: 'Paper, "One"\nLine 2',
        Year: "2024",
        "Venue Short": "ICML",
        "CCF Rank": "A",
        "CORE Rank": "A*",
        Task: "classification",
        Method: "transformer",
        Dataset: "ImageNet",
        Metric: "accuracy",
        Code: "https://github.com/example/paper-one",
        Notes: "",
      },
    ]);

    assert.equal(
      csv,
      [
        "Title,Year,Venue Short,CCF Rank,CORE Rank,Task,Method,Dataset,Metric,Code,Notes",
        '"Paper, ""One""\nLine 2",2024,ICML,A,A*,classification,transformer,ImageNet,accuracy,https://github.com/example/paper-one,',
      ].join("\n"),
    );
  });

  it("falls back safely for missing local service data and does not mutate source items", function () {
    const storage = createWorkbenchStorage();
    const venueService = createVenueLiteService(storage);
    const artifactService = createArtifactHubService(storage);
    const tagService = createStructuredTagService(storage);
    const service = createRelatedWorkExportService(
      venueService,
      artifactService,
      tagService,
    );
    const fields = {
      title: "Immutable Paper",
      date: "not-a-date",
      conferenceName: "Unmatched Venue",
    };
    const snapshot = JSON.parse(JSON.stringify(fields)) as typeof fields;
    const rows = service.collectRows([createItem(fields, "paper-immutable")]);

    assert.deepEqual(rows, [
      {
        Title: "Immutable Paper",
        Year: "",
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
    ]);
    assert.deepEqual(fields, snapshot);
  });

  it("supports the async item-key collection path and preserves input order", async function () {
    const storage = createWorkbenchStorage();
    const venueService = createVenueLiteService(storage);
    const artifactService = createArtifactHubService(storage);
    const tagService = createStructuredTagService(storage);
    const service = createRelatedWorkExportService(
      venueService,
      artifactService,
      tagService,
    );

    tagService.setTags("paper-b", {
      taskJson: ["retrieval"],
      methodJson: ["dual encoder"],
    });

    installItemsLookupMock({
      "paper-a": createItem(
        {
          title: "Paper A",
          date: "2024",
          conferenceName: "International Conference on Machine Learning",
        },
        "paper-a",
      ),
      "paper-b": createItem(
        {
          title: "Paper B",
          date: "2022",
          extra: "Code: https://github.com/example/paper-b",
        },
        "paper-b",
      ),
    });

    const rows = await service.collectRowsByKeys(1, [
      "paper-b",
      "missing",
      "paper-a",
    ]);

    assert.deepEqual(rows, [
      {
        Title: "Paper B",
        Year: "2022",
        "Venue Short": "",
        "CCF Rank": "",
        "CORE Rank": "",
        Task: "retrieval",
        Method: "dual encoder",
        Dataset: "",
        Metric: "",
        Code: "https://github.com/example/paper-b",
        Notes: "",
      },
      {
        Title: "Paper A",
        Year: "2024",
        "Venue Short": "ICML",
        "CCF Rank": "A",
        "CORE Rank": "A*",
        Task: "",
        Method: "",
        Dataset: "",
        Metric: "",
        Code: "",
        Notes: "",
      },
    ]);
  });
});
