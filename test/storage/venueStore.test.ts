/* global afterEach, beforeEach, describe, it, assert */

import { VenueStore } from "../../src/modules/storage/venueStore";
import {
  createVenueMaster,
  resetTestEnv,
  restoreNow,
  storageKey,
} from "./testUtils";

describe("VenueStore", function () {
  beforeEach(function () {
    resetTestEnv();
  });

  afterEach(function () {
    restoreNow();
  });

  it("returns null and empty collections for missing venues", function () {
    const store = new VenueStore();

    assert.equal(store.get("missing"), null);
    assert.deepEqual(store.list(), []);
    assert.equal(store.getAll().size, 0);
  });

  it("supports set/get/list/getAll with normalized persistence and clone safety", function () {
    const store = new VenueStore();
    const input = createVenueMaster({
      venueId: "ignored",
      canonicalName: "  Conference on Test Cases  ",
      shortName: "  CTC  ",
      aliasesJson: [" Alias One ", "alias one", "", "Alias Two"],
    });

    store.set(" venue-2 ", input);

    const saved = store.get("venue-2");
    assert.deepEqual(saved, {
      venueId: "venue-2",
      canonicalName: "Conference on Test Cases",
      shortName: "CTC",
      type: "conference",
      ccfRank: "A",
      coreRank: "A",
      aliasesJson: ["Alias One", "Alias Two"],
      updatedAt: 1_700_000_000_000,
    });

    assert.equal(store.list().length, 1);
    assert.equal(store.getAll().size, 1);

    saved?.aliasesJson.push("Mutated");
    assert.deepEqual(store.get("venue-2")?.aliasesJson, [
      "Alias One",
      "Alias Two",
    ]);
    assert.equal(input.venueId, "ignored");
  });

  it("supports bulk upsert and persistence round-trip", function () {
    const store = new VenueStore();
    store.upsertMany([
      createVenueMaster({ venueId: "venue-1", shortName: "V1" }),
      createVenueMaster({ venueId: "venue-2", shortName: "V2" }),
    ]);

    const reloaded = new VenueStore();
    assert.equal(reloaded.getAll().size, 2);
    assert.equal(reloaded.get("venue-1")?.shortName, "V1");
    assert.equal(reloaded.get("venue-2")?.shortName, "V2");
    assert.equal(typeof Zotero.Prefs.get(storageKey("venues"), true), "string");
  });

  it("can find venues by short name or alias", function () {
    const store = new VenueStore();
    store.upsert(
      createVenueMaster({
        venueId: "venue-lookup",
        shortName: "LookupConf",
        aliasesJson: ["Lookup Conference", "LC"],
      }),
    );

    assert.equal(
      store.findByShortName(" lookupconf ")?.venueId,
      "venue-lookup",
    );
    assert.equal(store.findByAlias(" lc ")?.venueId, "venue-lookup");
    assert.equal(
      store.findByAlias("lookup conference")?.shortName,
      "LookupConf",
    );
  });
});
