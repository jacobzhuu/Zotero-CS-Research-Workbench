/* global afterEach, beforeEach, describe, it, assert */

import { TagStore } from "../../src/modules/storage/tagStore";
import { createPaperTags, resetTestEnv, restoreNow } from "./testUtils";

describe("TagStore", function () {
  beforeEach(function () {
    resetTestEnv();
  });

  afterEach(function () {
    restoreNow();
  });

  it("round-trips multi-value tags without mutating caller input", function () {
    const store = new TagStore();
    const input = createPaperTags({
      taskJson: [" classification ", "Classification", ""],
      datasetJson: [" ImageNet ", "imagenet"],
    });

    store.set("item-2", input);
    input.taskJson.push("mutated");

    const saved = store.get("item-2");
    assert.deepEqual(saved, {
      itemKey: "item-2",
      taskJson: ["classification"],
      methodJson: ["transformer"],
      datasetJson: ["ImageNet"],
      metricJson: ["accuracy"],
      updatedAt: 1_700_000_000_000,
    });
  });

  it("creates default empty arrays when patching a missing record", function () {
    const store = new TagStore();

    const patched = store.patch("fresh-item", {
      methodJson: ["graph neural network"],
    });

    assert.deepEqual(patched, {
      itemKey: "fresh-item",
      taskJson: [],
      methodJson: ["graph neural network"],
      datasetJson: [],
      metricJson: [],
      updatedAt: 1_700_000_000_000,
    });
  });

  it("appends and batch-appends normalized unique tags", function () {
    const store = new TagStore();

    const appended = store.appendTags("item-1", "taskJson", [
      " retrieval ",
      "Retrieval",
      "ranking",
    ]);

    assert.deepEqual(appended.taskJson, ["retrieval", "ranking"]);

    store.batchAppendTags(["item-1", "item-2"], "datasetJson", [
      " MSCOCO ",
      "mscoco",
    ]);

    assert.deepEqual(store.get("item-1")?.datasetJson, ["MSCOCO"]);
    assert.deepEqual(store.get("item-2"), {
      itemKey: "item-2",
      taskJson: [],
      methodJson: [],
      datasetJson: ["MSCOCO"],
      metricJson: [],
      updatedAt: 1_700_000_000_000,
    });
  });

  it("removes tags case-insensitively and returns null for missing items", function () {
    const store = new TagStore();
    store.set(
      "item-1",
      createPaperTags({
        taskJson: ["Retrieval", "Ranking"],
      }),
    );

    assert.equal(store.removeTags("missing", "taskJson", ["retrieval"]), null);

    const updated = store.removeTags("item-1", "taskJson", [" retrieval "]);
    assert.deepEqual(updated?.taskJson, ["Ranking"]);

    const saved = store.get("item-1");
    saved?.taskJson.push("Mutated");
    assert.deepEqual(store.get("item-1")?.taskJson, ["Ranking"]);
  });
});
