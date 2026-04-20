/* global afterEach, beforeEach, describe, it, assert */

import { createWorkbenchStorage } from "../../src/modules/storage/workbenchStorage";
import { createArtifactHubService } from "../../src/modules/artifact/service";
import type { ArtifactResolvableItem } from "../../src/modules/artifact/types";
import { resetTestEnv, restoreNow } from "../storage/testUtils";

function createItem(
  fields: Record<string, string>,
  key: string,
): ArtifactResolvableItem {
  return {
    key,
    getField(field: string) {
      return fields[field] ?? "";
    },
  };
}

describe("artifact service", function () {
  beforeEach(function () {
    resetTestEnv();
  });

  afterEach(function () {
    restoreNow();
  });

  it("refreshes high-confidence automatic artifacts into Phase 1 storage", function () {
    const storage = createWorkbenchStorage();
    const service = createArtifactHubService(storage);

    const resolved = service.refreshArtifacts(
      createItem(
        {
          DOI: "10.1145/ABC.DEF",
          archiveID: "arXiv:2401.12345",
          url: "https://openreview.net/forum?id=or789",
          extra: [
            "Code: https://github.com/example/repo",
            "Project: https://example.com/project",
          ].join("\n"),
        },
        "item-auto",
      ),
    );

    assert.deepEqual(storage.artifacts.get("item-auto"), {
      itemKey: "item-auto",
      doiUrl: "https://doi.org/10.1145/abc.def",
      arxivUrl: "https://arxiv.org/abs/2401.12345",
      openreviewUrl: "https://openreview.net/forum?id=or789",
      codeUrl: "https://github.com/example/repo",
      projectUrl: "https://example.com/project",
      source: "auto",
      updatedAt: 1_700_000_000_000,
    });
    assert.equal(resolved.doiUrl, "https://doi.org/10.1145/abc.def");
    assert.equal(resolved.fieldSources.doiUrl, "DOI");
    assert.equal(resolved.fieldSources.arxivUrl, "archiveID");
    assert.equal(resolved.fieldSources.openreviewUrl, "url");
    assert.equal(resolved.fieldSources.codeUrl, "extra");
    assert.equal(resolved.fieldSources.projectUrl, "extra");
  });

  it("prefers manual artifact overrides over automatic values", function () {
    const storage = createWorkbenchStorage();
    const service = createArtifactHubService(storage);
    const itemKey = "item-override";
    const item = createItem(
      {
        DOI: "10.1145/ABC.DEF",
        archiveID: "2401.12345",
        url: "https://openreview.net/forum?id=or111",
      },
      itemKey,
    );

    service.setArtifactOverride(itemKey, {
      codeUrl: "https://github.com/manual/repo",
      projectUrl: "https://manual.example/project",
      openreviewUrl: "",
    });

    const snapshot = service.resolveArtifactSnapshot(item, itemKey);

    assert.equal(
      snapshot.automatic?.openreviewUrl,
      "https://openreview.net/forum?id=or111",
    );
    assert.equal(snapshot.override?.codeUrl, "https://github.com/manual/repo");
    assert.equal(snapshot.resolved.codeUrl, "https://github.com/manual/repo");
    assert.equal(
      snapshot.resolved.projectUrl,
      "https://manual.example/project",
    );
    assert.equal(snapshot.resolved.openreviewUrl, "");
    assert.equal(snapshot.resolved.fieldSources.codeUrl, "override");
    assert.equal(snapshot.resolved.fieldSources.projectUrl, "override");
    assert.equal(snapshot.resolved.fieldSources.openreviewUrl, "override");
  });

  it("does not wipe manual overrides when automatic artifacts are refreshed", function () {
    const storage = createWorkbenchStorage();
    const service = createArtifactHubService(storage);
    const itemKey = "item-refresh";

    service.setArtifactOverride(itemKey, {
      codeUrl: "https://github.com/manual/repo",
      projectUrl: "https://manual.example/project",
    });

    const refreshed = service.refreshArtifacts(
      createItem(
        {
          DOI: "10.1145/ABC.DEF",
          archiveID: "2401.12345",
          url: "https://openreview.net/forum?id=or222",
        },
        itemKey,
      ),
      itemKey,
    );

    assert.equal(refreshed.codeUrl, "https://github.com/manual/repo");
    assert.equal(refreshed.projectUrl, "https://manual.example/project");
    assert.equal(
      service.getArtifactOverride(itemKey)?.codeUrl,
      "https://github.com/manual/repo",
    );
    assert.equal(
      service.getAutomaticArtifacts(itemKey)?.doiUrl,
      "https://doi.org/10.1145/abc.def",
    );

    service.clearArtifactOverride(itemKey);
    const afterClear = service.resolveArtifacts(
      createItem(
        {
          DOI: "10.1145/ABC.DEF",
          archiveID: "2401.12345",
          url: "https://openreview.net/forum?id=or222",
        },
        itemKey,
      ),
      itemKey,
    );

    assert.equal(service.getArtifactOverride(itemKey), null);
    assert.equal(afterClear.codeUrl, "");
    assert.equal(afterClear.projectUrl, "");
    assert.equal(
      afterClear.openreviewUrl,
      "https://openreview.net/forum?id=or222",
    );
  });

  it("clears stale automatic artifacts when metadata no longer resolves", function () {
    const storage = createWorkbenchStorage();
    const service = createArtifactHubService(storage);
    const itemKey = "item-stale";

    service.refreshArtifacts(
      createItem(
        {
          DOI: "10.1145/ABC.DEF",
        },
        itemKey,
      ),
      itemKey,
    );

    const refreshed = service.refreshArtifacts(
      createItem({}, itemKey),
      itemKey,
    );

    assert.equal(service.getAutomaticArtifacts(itemKey), null);
    assert.deepEqual(refreshed, {
      itemKey,
      doiUrl: "",
      arxivUrl: "",
      openreviewUrl: "",
      codeUrl: "",
      projectUrl: "",
      fieldSources: {
        doiUrl: "none",
        arxivUrl: "none",
        openreviewUrl: "none",
        codeUrl: "none",
        projectUrl: "none",
      },
    });
  });
});
