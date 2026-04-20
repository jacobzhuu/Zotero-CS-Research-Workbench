import { expect } from "chai";

import { createArtifactHubService } from "../../src/modules/artifact";
import { createWorkbenchStorage } from "../../src/modules/storage";
import { createStructuredTagService } from "../../src/modules/tags";
import {
  getWorkbenchUISettings,
  resetWorkbenchLocalData,
} from "../../src/modules/ui";
import { createVenueLiteService } from "../../src/modules/venue";
import {
  createArtifactOverride,
  createVenueMaster,
  resetTestEnv,
  restoreNow,
} from "../storage/testUtils";

describe("Phase 8 UI settings", function () {
  beforeEach(function () {
    resetTestEnv();
  });

  after(function () {
    restoreNow();
  });

  it("falls back to enabled defaults", function () {
    expect(getWorkbenchUISettings()).to.deep.equal({
      enableColumns: true,
      enableSections: true,
      enableContextMenu: true,
    });
  });

  it("reads boolean UI settings from prefs", function () {
    globalThis.Zotero.Prefs.set(
      "extensions.zotero.cs-workbench.ui.enableColumns",
      false,
      true,
    );
    globalThis.Zotero.Prefs.set(
      "extensions.zotero.cs-workbench.ui.enableSections",
      false,
      true,
    );
    globalThis.Zotero.Prefs.set(
      "extensions.zotero.cs-workbench.ui.enableContextMenu",
      true,
      true,
    );

    expect(getWorkbenchUISettings()).to.deep.equal({
      enableColumns: false,
      enableSections: false,
      enableContextMenu: true,
    });
  });

  it("resets local workbench data but restores venue seed data", function () {
    const storage = createWorkbenchStorage();
    const venueService = createVenueLiteService(storage);
    const artifactService = createArtifactHubService(storage);
    const tagService = createStructuredTagService(storage);

    storage.venues.set(
      "temp-venue",
      createVenueMaster({
        venueId: "temp-venue",
        canonicalName: "Temporary Venue",
        shortName: "TMP",
      }),
    );
    artifactService.setArtifactOverride(
      "paper-1",
      createArtifactOverride({
        codeUrl: "https://github.com/example/project",
      }),
    );
    storage.artifacts.set("paper-1", {
      itemKey: "paper-1",
      doiUrl: "https://doi.org/10.1000/test",
      arxivUrl: "",
      openreviewUrl: "",
      codeUrl: "",
      projectUrl: "",
      source: "auto",
      updatedAt: 1,
    });
    tagService.setTags("paper-1", {
      taskJson: ["classification"],
    });

    expect(storage.venues.get("temp-venue")).to.not.equal(null);
    expect(storage.artifacts.get("paper-1")?.doiUrl).to.equal(
      "https://doi.org/10.1000/test",
    );
    expect(storage.tags.get("paper-1")?.taskJson).to.deep.equal([
      "classification",
    ]);
    expect(storage.overrides.getArtifactOverride("paper-1")).to.deep.equal({
      codeUrl: "https://github.com/example/project",
    });

    resetWorkbenchLocalData(storage, venueService);

    expect(storage.artifacts.get("paper-1")).to.equal(null);
    expect(storage.tags.get("paper-1")).to.equal(null);
    expect(storage.overrides.get("paper-1")).to.equal(null);
    expect(storage.venues.get("temp-venue")).to.equal(null);
    expect(storage.venues.list().length).to.be.greaterThan(0);
  });
});
