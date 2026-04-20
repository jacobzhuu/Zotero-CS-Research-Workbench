/* global afterEach, beforeEach, describe, it, assert */

import {
  mergeArtifacts,
  mergeTags,
  mergeVenue,
} from "../../src/modules/storage/mergeService";
import {
  createArtifactLinks,
  createPaperTags,
  createUserOverrides,
  createVenueMaster,
  resetTestEnv,
  restoreNow,
} from "./testUtils";

describe("mergeService", function () {
  beforeEach(function () {
    resetTestEnv();
  });

  afterEach(function () {
    restoreNow();
  });

  it("returns empty defaults when automatic data and overrides are missing", function () {
    assert.deepEqual(mergeVenue(null, null), {
      venueId: "",
      canonicalName: "",
      shortName: "",
      type: "unknown",
      ccfRank: "",
      coreRank: "",
    });

    assert.deepEqual(mergeArtifacts(null, null), {
      doiUrl: "",
      arxivUrl: "",
      openreviewUrl: "",
      codeUrl: "",
      projectUrl: "",
    });

    assert.deepEqual(mergeTags(null, null), {
      taskJson: [],
      methodJson: [],
      datasetJson: [],
      metricJson: [],
    });
  });

  it("prefers override values over automatic venue values", function () {
    const automaticVenue = createVenueMaster();
    const overrides = createUserOverrides({
      venueOverrideJson: {
        shortName: "MANUAL",
        ccfRank: "B",
      },
    });

    assert.deepEqual(mergeVenue(automaticVenue, overrides), {
      venueId: "venue-1",
      canonicalName: "Conference on Test Cases",
      shortName: "MANUAL",
      type: "conference",
      ccfRank: "B",
      coreRank: "A",
    });
  });

  it("preserves explicit blank-string artifact overrides", function () {
    const automaticArtifacts = createArtifactLinks();
    const overrides = createUserOverrides({
      artifactOverrideJson: {
        codeUrl: "",
        projectUrl: "https://override.example/project",
      },
    });

    assert.deepEqual(mergeArtifacts(automaticArtifacts, overrides), {
      doiUrl: "https://doi.org/10.1000/test",
      arxivUrl: "https://arxiv.org/abs/1234.5678",
      openreviewUrl: "https://openreview.net/forum?id=test",
      codeUrl: "",
      projectUrl: "https://override.example/project",
    });
  });

  it("applies partial tag overrides while preserving untouched automatic arrays", function () {
    const automaticTags = createPaperTags();
    const overrides = createUserOverrides({
      tagOverrideJson: {
        taskJson: ["retrieval"],
      },
    });

    assert.deepEqual(mergeTags(automaticTags, overrides), {
      taskJson: ["retrieval"],
      methodJson: ["transformer"],
      datasetJson: ["imagenet"],
      metricJson: ["accuracy"],
    });
  });

  it("allows explicit empty-array tag overrides to win over automatic values", function () {
    const automaticTags = createPaperTags();
    const overrides = createUserOverrides({
      tagOverrideJson: {
        datasetJson: [],
      },
    });

    assert.deepEqual(mergeTags(automaticTags, overrides), {
      taskJson: ["classification"],
      methodJson: ["transformer"],
      datasetJson: [],
      metricJson: ["accuracy"],
    });
  });
});
