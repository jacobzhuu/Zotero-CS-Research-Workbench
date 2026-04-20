/* global afterEach, beforeEach, describe, it, assert */

import { WorkbenchStorage } from "../../src/modules/storage/workbenchStorage";
import {
  createArtifactLinks,
  createPaperTags,
  createVenueMaster,
  resetTestEnv,
  restoreNow,
} from "./testUtils";

describe("WorkbenchStorage", function () {
  beforeEach(function () {
    resetTestEnv();
  });

  afterEach(function () {
    restoreNow();
  });

  it("returns automatic values when no overrides are present", function () {
    const storage = new WorkbenchStorage();
    storage.artifacts.set(
      "item-1",
      createArtifactLinks({
        itemKey: "item-1",
      }),
    );
    storage.tags.set(
      "item-1",
      createPaperTags({
        itemKey: "item-1",
      }),
    );

    assert.deepEqual(storage.getResolvedArtifacts("item-1"), {
      doiUrl: "https://doi.org/10.1000/test",
      arxivUrl: "https://arxiv.org/abs/1234.5678",
      openreviewUrl: "https://openreview.net/forum?id=test",
      codeUrl: "https://github.com/example/project",
      projectUrl: "https://example.com/project",
    });

    assert.deepEqual(storage.getResolvedTags("item-1"), {
      taskJson: ["classification"],
      methodJson: ["transformer"],
      datasetJson: ["imagenet"],
      metricJson: ["accuracy"],
    });
  });

  it("returns override-first results through facade helpers", function () {
    const storage = new WorkbenchStorage();
    storage.artifacts.set(
      "item-1",
      createArtifactLinks({
        itemKey: "item-1",
      }),
    );
    storage.overrides.setArtifactOverride("item-1", {
      codeUrl: "",
      projectUrl: "https://override.example/project",
    });

    assert.deepEqual(storage.getResolvedArtifacts("item-1"), {
      doiUrl: "https://doi.org/10.1000/test",
      arxivUrl: "https://arxiv.org/abs/1234.5678",
      openreviewUrl: "https://openreview.net/forum?id=test",
      codeUrl: "",
      projectUrl: "https://override.example/project",
    });
  });

  it("coordinates stored automatic data and user overrides in snapshots", function () {
    const storage = new WorkbenchStorage();
    const automaticVenue = createVenueMaster({
      venueId: "venue-1",
      shortName: "AUTO",
    });

    storage.tags.set(
      "item-1",
      createPaperTags({
        itemKey: "item-1",
      }),
    );
    storage.overrides.setVenueOverride("item-1", {
      shortName: "MANUAL",
      ccfRank: "",
    });
    storage.overrides.setTagOverride("item-1", {
      methodJson: ["graph neural network"],
    });

    const snapshot = storage.getResolvedSnapshot("item-1", automaticVenue);

    assert.deepEqual(snapshot.venue, {
      venueId: "venue-1",
      canonicalName: "Conference on Test Cases",
      shortName: "MANUAL",
      type: "conference",
      ccfRank: "",
      coreRank: "A",
    });
    assert.deepEqual(snapshot.tags, {
      taskJson: ["classification"],
      methodJson: ["graph neural network"],
      datasetJson: ["imagenet"],
      metricJson: ["accuracy"],
    });
    assert.deepEqual(snapshot.overrides?.venueOverrideJson, {
      shortName: "MANUAL",
      ccfRank: "",
    });
  });

  it("falls back to empty resolved values when nothing is stored", function () {
    const storage = new WorkbenchStorage();

    assert.deepEqual(storage.getResolvedVenue("missing"), {
      venueId: "",
      canonicalName: "",
      shortName: "",
      type: "unknown",
      ccfRank: "",
      coreRank: "",
    });
    assert.deepEqual(storage.getResolvedArtifacts("missing"), {
      doiUrl: "",
      arxivUrl: "",
      openreviewUrl: "",
      codeUrl: "",
      projectUrl: "",
    });
    assert.deepEqual(storage.getResolvedTags("missing"), {
      taskJson: [],
      methodJson: [],
      datasetJson: [],
      metricJson: [],
    });
  });
});
