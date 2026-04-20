/* global afterEach, beforeEach, describe, it, assert */

import { createWorkbenchStorage } from "../../src/modules/storage/workbenchStorage";
import { createStructuredTagService } from "../../src/modules/tags/service";
import {
  createPaperTags,
  resetTestEnv,
  restoreNow,
} from "../storage/testUtils";

describe("structured tag service", function () {
  beforeEach(function () {
    resetTestEnv();
  });

  afterEach(function () {
    restoreNow();
  });

  it("returns empty defaults for missing items", function () {
    const storage = createWorkbenchStorage();
    const service = createStructuredTagService(storage);

    assert.deepEqual(service.getTags("missing"), {
      itemKey: "missing",
      taskJson: [],
      methodJson: [],
      datasetJson: [],
      metricJson: [],
      updatedAt: 0,
    });
  });

  it("replaces a single item's tags without mutating caller input", function () {
    const storage = createWorkbenchStorage();
    const service = createStructuredTagService(storage);
    const input = {
      taskJson: [" retrieval ", "Retrieval", ""],
      datasetJson: [" MSCOCO ", "mscoco"],
    };

    const saved = service.setTags("item-1", input);
    input.taskJson.push("mutated");

    assert.deepEqual(saved, {
      itemKey: "item-1",
      taskJson: ["retrieval"],
      methodJson: [],
      datasetJson: ["MSCOCO"],
      metricJson: [],
      updatedAt: 1_700_000_000_000,
    });
    assert.deepEqual(storage.tags.get("item-1"), saved);
  });

  it("patches selected groups while preserving untouched values", function () {
    const storage = createWorkbenchStorage();
    const service = createStructuredTagService(storage);
    storage.tags.set("item-1", createPaperTags());

    const patched = service.patchTags("item-1", {
      methodJson: ["graph neural network"],
      metricJson: ["f1"],
    });

    assert.deepEqual(patched, {
      itemKey: "item-1",
      taskJson: ["classification"],
      methodJson: ["graph neural network"],
      datasetJson: ["imagenet"],
      metricJson: ["f1"],
      updatedAt: 1_700_000_000_000,
    });
  });

  it("appends and removes tags with stable multi-value semantics", function () {
    const storage = createWorkbenchStorage();
    const service = createStructuredTagService(storage);
    storage.tags.set(
      "item-1",
      createPaperTags({
        taskJson: ["Retrieval"],
        datasetJson: ["MSCOCO"],
      }),
    );

    const appended = service.appendTags("item-1", {
      taskJson: [" retrieval ", "ranking"],
      datasetJson: ["mscoco", "COCO-Caption"],
    });

    assert.deepEqual(appended.taskJson, ["Retrieval", "ranking"]);
    assert.deepEqual(appended.datasetJson, ["MSCOCO", "COCO-Caption"]);

    const removed = service.removeTags("item-1", {
      taskJson: ["RETRIEVAL"],
      datasetJson: [" mscoco "],
    });

    assert.deepEqual(removed.taskJson, ["ranking"]);
    assert.deepEqual(removed.datasetJson, ["COCO-Caption"]);
  });

  it("clears selected groups or the whole record with empty fallback", function () {
    const storage = createWorkbenchStorage();
    const service = createStructuredTagService(storage);
    storage.tags.set("item-1", createPaperTags());

    const clearedMethod = service.clearTags("item-1", ["methodJson"]);
    assert.deepEqual(clearedMethod, {
      itemKey: "item-1",
      taskJson: ["classification"],
      methodJson: [],
      datasetJson: ["imagenet"],
      metricJson: ["accuracy"],
      updatedAt: 1_700_000_000_000,
    });

    const clearedAll = service.clearTags("item-1");
    assert.deepEqual(clearedAll, {
      itemKey: "item-1",
      taskJson: [],
      methodJson: [],
      datasetJson: [],
      metricJson: [],
      updatedAt: 0,
    });
    assert.equal(storage.tags.get("item-1"), null);
  });

  it("batch-appends tags idempotently without wiping existing values", function () {
    const storage = createWorkbenchStorage();
    const service = createStructuredTagService(storage);
    storage.tags.set(
      "item-1",
      createPaperTags({
        taskJson: ["classification"],
        datasetJson: ["ImageNet"],
      }),
    );

    const inputKeys = ["item-1", "item-2", "item-1", " "];
    const inputPatch = {
      taskJson: [" ranking ", "Ranking"],
      datasetJson: [" CIFAR-10 ", "cifar-10"],
    };

    const first = service.batchAppendTags(inputKeys, inputPatch);
    const second = service.batchAppendTags(inputKeys, inputPatch);

    assert.lengthOf(first, 2);
    assert.lengthOf(second, 2);
    assert.deepEqual(service.getTags("item-1"), {
      itemKey: "item-1",
      taskJson: ["classification", "ranking"],
      methodJson: ["transformer"],
      datasetJson: ["ImageNet", "CIFAR-10"],
      metricJson: ["accuracy"],
      updatedAt: 1_700_000_000_000,
    });
    assert.deepEqual(service.getTags("item-2"), {
      itemKey: "item-2",
      taskJson: ["ranking"],
      methodJson: [],
      datasetJson: ["CIFAR-10"],
      metricJson: [],
      updatedAt: 1_700_000_000_000,
    });
  });

  it("supports explicit batch replace and batch remove for selected groups only", function () {
    const storage = createWorkbenchStorage();
    const service = createStructuredTagService(storage);
    storage.tags.set("item-1", createPaperTags());
    storage.tags.set(
      "item-2",
      createPaperTags({
        taskJson: ["retrieval"],
        datasetJson: ["MSCOCO"],
      }),
    );

    const replaced = service.batchReplaceTags(["item-1", "item-2"], {
      taskJson: ["generation"],
    });

    assert.deepEqual(replaced[0], {
      itemKey: "item-1",
      taskJson: ["generation"],
      methodJson: ["transformer"],
      datasetJson: ["imagenet"],
      metricJson: ["accuracy"],
      updatedAt: 1_700_000_000_000,
    });
    assert.deepEqual(service.getTags("item-2"), {
      itemKey: "item-2",
      taskJson: ["generation"],
      methodJson: ["transformer"],
      datasetJson: ["MSCOCO"],
      metricJson: ["accuracy"],
      updatedAt: 1_700_000_000_000,
    });

    const removed = service.batchRemoveTags(["item-1", "item-2"], {
      datasetJson: [" msCOCO ", "imagenet"],
      metricJson: ["accuracy"],
    });

    assert.deepEqual(removed[0], {
      itemKey: "item-1",
      taskJson: ["generation"],
      methodJson: ["transformer"],
      datasetJson: [],
      metricJson: [],
      updatedAt: 1_700_000_000_000,
    });
    assert.deepEqual(removed[1], {
      itemKey: "item-2",
      taskJson: ["generation"],
      methodJson: ["transformer"],
      datasetJson: [],
      metricJson: [],
      updatedAt: 1_700_000_000_000,
    });
  });
});
