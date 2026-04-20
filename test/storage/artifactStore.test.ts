/* global afterEach, beforeEach, describe, it, assert */

import { ArtifactStore } from "../../src/modules/storage/artifactStore";
import {
  createArtifactLinks,
  resetTestEnv,
  restoreNow,
  storageKey,
} from "./testUtils";

describe("ArtifactStore", function () {
  beforeEach(function () {
    resetTestEnv();
  });

  afterEach(function () {
    restoreNow();
  });

  it("returns null and empty collections for missing artifacts", function () {
    const store = new ArtifactStore();

    assert.equal(store.get("missing"), null);
    assert.deepEqual(store.list(), []);
    assert.equal(store.getAll().size, 0);
  });

  it("supports set/get/list/getAll with persistence round-trip", function () {
    const store = new ArtifactStore();
    const input = createArtifactLinks({
      itemKey: "ignored",
      doiUrl: " https://doi.org/10.1000/test ",
      codeUrl: " https://github.com/example/project ",
    });

    store.set("item-2", input);

    const saved = store.get("item-2");
    assert.deepEqual(saved, {
      itemKey: "item-2",
      doiUrl: "https://doi.org/10.1000/test",
      arxivUrl: "https://arxiv.org/abs/1234.5678",
      openreviewUrl: "https://openreview.net/forum?id=test",
      codeUrl: "https://github.com/example/project",
      projectUrl: "https://example.com/project",
      source: "auto",
      updatedAt: 1_700_000_000_000,
    });

    saved?.codeUrl.concat("?changed");
    assert.equal(
      store.get("item-2")?.codeUrl,
      "https://github.com/example/project",
    );

    const reloaded = new ArtifactStore();
    assert.equal(
      reloaded.get("item-2")?.doiUrl,
      "https://doi.org/10.1000/test",
    );
    assert.equal(
      typeof Zotero.Prefs.get(storageKey("artifacts"), true),
      "string",
    );
  });

  it("patches existing records without dropping untouched fields", function () {
    const store = new ArtifactStore();
    store.upsert(createArtifactLinks({ itemKey: "item-1" }));

    const patched = store.patch("item-1", {
      codeUrl: "",
      projectUrl: "https://override.example/project",
      source: "manual",
    });

    assert.deepEqual(patched, {
      itemKey: "item-1",
      doiUrl: "https://doi.org/10.1000/test",
      arxivUrl: "https://arxiv.org/abs/1234.5678",
      openreviewUrl: "https://openreview.net/forum?id=test",
      codeUrl: "",
      projectUrl: "https://override.example/project",
      source: "manual",
      updatedAt: 1_700_000_000_000,
    });
  });

  it("creates default records when patching a missing item", function () {
    const store = new ArtifactStore();

    const patched = store.patch("fresh-item", {
      codeUrl: "https://github.com/example/fresh",
    });

    assert.deepEqual(patched, {
      itemKey: "fresh-item",
      doiUrl: "",
      arxivUrl: "",
      openreviewUrl: "",
      codeUrl: "https://github.com/example/fresh",
      projectUrl: "",
      source: "auto",
      updatedAt: 1_700_000_000_000,
    });
  });
});
