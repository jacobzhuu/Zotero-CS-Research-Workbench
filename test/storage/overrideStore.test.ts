/* global afterEach, beforeEach, describe, it, assert */

import { OverrideStore } from "../../src/modules/storage/overrideStore";
import {
  createUserOverrides,
  resetTestEnv,
  restoreNow,
  storageKey,
} from "./testUtils";

describe("OverrideStore", function () {
  beforeEach(function () {
    resetTestEnv();
  });

  afterEach(function () {
    restoreNow();
  });

  it("returns null and false when no overrides are stored", function () {
    const store = new OverrideStore();

    assert.equal(store.get("missing"), null);
    assert.equal(store.getVenueOverride("missing"), null);
    assert.equal(store.getArtifactOverride("missing"), null);
    assert.equal(store.getTagOverride("missing"), null);
    assert.equal(store.hasOverrides("missing"), false);
  });

  it("persists partial venue, artifact, and tag overrides on the same item", function () {
    const store = new OverrideStore();

    store.setVenueOverride("item-1", {
      shortName: "MANUAL",
      ccfRank: "B",
    });
    store.setArtifactOverride("item-1", {
      codeUrl: "",
      projectUrl: "https://override.example/project",
    });
    store.setTagOverride("item-1", {
      taskJson: ["retrieval"],
    });

    const saved = store.get("item-1");
    assert.deepEqual(saved, {
      itemKey: "item-1",
      venueOverrideJson: {
        shortName: "MANUAL",
        ccfRank: "B",
      },
      artifactOverrideJson: {
        codeUrl: "",
        projectUrl: "https://override.example/project",
      },
      tagOverrideJson: {
        taskJson: ["retrieval"],
      },
      updatedAt: 1_700_000_000_000,
    });
    assert.equal(store.hasOverrides("item-1"), true);
    assert.equal(
      typeof Zotero.Prefs.get(storageKey("overrides"), true),
      "string",
    );
  });

  it("round-trips explicit blank-string overrides through persistence", function () {
    const store = new OverrideStore();
    store.setArtifactOverride("item-blank", {
      codeUrl: "",
      projectUrl: " https://override.example/project ",
    });

    const reloaded = new OverrideStore();
    assert.deepEqual(reloaded.getArtifactOverride("item-blank"), {
      codeUrl: "",
      projectUrl: "https://override.example/project",
    });
  });

  it("supports direct set and clone-safe reads", function () {
    const store = new OverrideStore();
    store.set(
      "item-2",
      createUserOverrides({
        venueOverrideJson: {
          canonicalName: "Custom Venue",
        },
      }),
    );

    const overrides = store.get("item-2");
    if (overrides?.venueOverrideJson.canonicalName) {
      overrides.venueOverrideJson.canonicalName = "Mutated";
    }

    assert.deepEqual(store.getVenueOverride("item-2"), {
      canonicalName: "Custom Venue",
    });
  });

  it("removes override records when the last override group is cleared", function () {
    const store = new OverrideStore();
    store.setVenueOverride("item-1", { shortName: "Manual" });
    store.setArtifactOverride("item-1", {
      codeUrl: "https://example.com/code",
    });

    store.clearVenueOverride("item-1");
    assert.equal(store.hasOverrides("item-1"), true);

    store.clearArtifactOverride("item-1");
    assert.equal(store.hasOverrides("item-1"), false);
    assert.equal(store.get("item-1"), null);
  });
});
