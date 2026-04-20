/* global afterEach, beforeEach, describe, it, assert */

import {
  cloneStoredMap,
  cloneStoredValue,
  hasOwnKeys,
  loadStoredMap,
  normalizeStringArray,
  normalizeText,
  saveStoredMap,
} from "../../src/modules/storage/common";
import {
  getStoredPref,
  resetTestEnv,
  restoreNow,
  setStoredPref,
} from "./testUtils";

describe("common", function () {
  beforeEach(function () {
    resetTestEnv();
  });

  afterEach(function () {
    restoreNow();
  });

  it("normalizes text values to trimmed strings with empty fallback", function () {
    assert.equal(normalizeText("  venue  "), "venue");
    assert.equal(normalizeText("   "), "");
    assert.equal(normalizeText(undefined), "");
  });

  it("normalizes string arrays without mutating caller input", function () {
    const input = ["  Task ", "task", "", " Dataset "];

    const normalized = normalizeStringArray(input);

    assert.deepEqual(normalized, ["Task", "Dataset"]);
    assert.deepEqual(input, ["  Task ", "task", "", " Dataset "]);
  });

  it("deep-clones stored values and maps", function () {
    const value = { nested: { tags: ["a"] } };
    const valueClone = cloneStoredValue(value);
    valueClone.nested.tags.push("b");
    assert.deepEqual(value, { nested: { tags: ["a"] } });

    const entryMap = new Map([["item-1", { nested: { tags: ["x"] } }]]);
    const mapClone = cloneStoredMap(entryMap);
    mapClone.get("item-1")?.nested.tags.push("y");
    assert.deepEqual(entryMap.get("item-1"), { nested: { tags: ["x"] } });
  });

  it("serializes and deserializes maps without leaking references", function () {
    const source = new Map([
      [
        "item-1",
        {
          labels: ["A"],
        },
      ],
    ]);

    saveStoredMap("extensions.test.common", source);
    const rawStored = getStoredPref("extensions.test.common");
    assert.equal(rawStored, JSON.stringify({ "item-1": { labels: ["A"] } }));

    source.get("item-1")?.labels.push("mutated");

    const loaded = loadStoredMap<{ labels: string[] }>(
      "extensions.test.common",
    );
    assert.deepEqual(loaded.get("item-1"), { labels: ["A"] });

    loaded.get("item-1")?.labels.push("changed");
    const reloaded = loadStoredMap<{ labels: string[] }>(
      "extensions.test.common",
    );
    assert.deepEqual(reloaded.get("item-1"), { labels: ["A"] });
  });

  it("returns empty maps for missing or malformed stored content", function () {
    assert.equal(loadStoredMap("extensions.test.missing").size, 0);

    setStoredPref("extensions.test.bad-json", "{not valid json");
    assert.equal(loadStoredMap("extensions.test.bad-json").size, 0);
  });

  it("detects whether objects have own keys", function () {
    assert.equal(hasOwnKeys({}), false);
    assert.equal(hasOwnKeys({ blank: "" }), true);
  });
});
