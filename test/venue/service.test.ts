/* global afterEach, beforeEach, describe, it, assert */

import { createWorkbenchStorage } from "../../src/modules/storage/workbenchStorage";
import { createVenueLiteService } from "../../src/modules/venue/service";
import type { VenueResolvableItem } from "../../src/modules/venue/types";
import { resetTestEnv, restoreNow } from "../storage/testUtils";

function createItem(
  fields: Record<string, string>,
  key: string,
): VenueResolvableItem {
  return {
    key,
    getField(field: string) {
      return fields[field] ?? "";
    },
  };
}

describe("venue service", function () {
  beforeEach(function () {
    resetTestEnv();
  });

  afterEach(function () {
    restoreNow();
  });

  it("seeds the local venue master dataset once and exposes it through storage", function () {
    const storage = createWorkbenchStorage();
    const service = createVenueLiteService(storage);

    const firstSeed = service.ensureSeedData();
    const secondSeed = service.ensureSeedData();

    assert.isAtLeast(firstSeed.length, 20);
    assert.equal(firstSeed.length, secondSeed.length);
    assert.isNotNull(storage.venues.get("neurips"));
    assert.isNotNull(storage.venues.get("acl"));
    assert.isNotNull(storage.venues.get("pvldb"));
  });

  it("resolves representative conference aliases from item metadata", function () {
    const storage = createWorkbenchStorage();
    const service = createVenueLiteService(storage);
    const resolved = service.resolveVenue(
      createItem(
        {
          proceedingsTitle:
            "Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR) 2024",
        },
        "item-cvpr",
      ),
    );

    assert.equal(resolved.venueId, "cvpr");
    assert.equal(resolved.shortName, "CVPR");
    assert.equal(resolved.type, "conference");
    assert.equal(resolved.ccfRank, "A");
    assert.equal(resolved.coreRank, "A*");
    assert.equal(resolved.matchedBy, "shortName");
    assert.equal(resolved.matchedVariant, "cvpr");
  });

  it("resolves representative journal venues from publication metadata", function () {
    const storage = createWorkbenchStorage();
    const service = createVenueLiteService(storage);
    const resolved = service.resolveVenue(
      createItem(
        {
          publicationTitle: "Proceedings of the VLDB Endowment",
        },
        "item-pvldb",
      ),
    );

    assert.equal(resolved.venueId, "pvldb");
    assert.equal(resolved.shortName, "PVLDB");
    assert.equal(resolved.type, "journal");
    assert.equal(resolved.matchedBy, "canonicalName");
  });

  it("falls back safely when a venue cannot be matched", function () {
    const storage = createWorkbenchStorage();
    const service = createVenueLiteService(storage);
    const resolved = service.resolveVenue(
      createItem(
        {
          publicationTitle: "Journal of Interesting Null Results",
        },
        "item-unknown",
      ),
    );

    assert.equal(resolved.venueId, "");
    assert.equal(resolved.canonicalName, "");
    assert.equal(resolved.shortName, "");
    assert.equal(resolved.type, "journal");
    assert.equal(resolved.ccfRank, "");
    assert.equal(resolved.coreRank, "");
    assert.equal(resolved.matchedBy, "none");
  });

  it("applies manual venue overrides ahead of automatic matches", function () {
    const storage = createWorkbenchStorage();
    const service = createVenueLiteService(storage);
    const item = createItem(
      {
        conferenceName:
          "Annual Meeting of the Association for Computational Linguistics",
      },
      "item-override",
    );

    service.setVenueOverrideFromVenueId("item-override", "neurips");
    const snapshot = service.resolveVenueSnapshot(item, "item-override");

    assert.equal(snapshot.automatic?.venueId, "acl");
    assert.equal(snapshot.override?.venueId, "neurips");
    assert.equal(snapshot.resolved.venueId, "neurips");
    assert.equal(snapshot.resolved.shortName, "NeurIPS");
    assert.equal(snapshot.resolved.type, "conference");
  });

  it("preserves explicit blank-string venue overrides", function () {
    const storage = createWorkbenchStorage();
    const service = createVenueLiteService(storage);
    const item = createItem(
      {
        conferenceName: "International Conference on Machine Learning",
      },
      "item-blank",
    );

    service.setVenueOverride("item-blank", {
      venueId: "",
      canonicalName: "",
      shortName: "",
      type: "unknown",
      ccfRank: "",
      coreRank: "",
    });

    const resolved = service.resolveVenue(item, "item-blank");

    assert.equal(resolved.venueId, "");
    assert.equal(resolved.canonicalName, "");
    assert.equal(resolved.shortName, "");
    assert.equal(resolved.type, "unknown");
    assert.equal(resolved.ccfRank, "");
    assert.equal(resolved.coreRank, "");
  });

  it("does not wipe manual venue overrides during refresh and clear restores automatic resolution", function () {
    const storage = createWorkbenchStorage();
    const service = createVenueLiteService(storage);
    const itemKey = "item-refresh";

    service.setVenueOverrideFromVenueId(itemKey, "neurips");

    const refreshed = service.refreshVenue(
      createItem(
        {
          conferenceName:
            "Annual Meeting of the Association for Computational Linguistics",
        },
        itemKey,
      ),
      itemKey,
    );

    assert.equal(refreshed.venueId, "neurips");
    assert.equal(service.getVenueOverride(itemKey)?.venueId, "neurips");

    service.clearVenueOverride(itemKey);
    const afterClear = service.resolveVenue(
      createItem(
        {
          conferenceName:
            "Annual Meeting of the Association for Computational Linguistics",
        },
        itemKey,
      ),
      itemKey,
    );

    assert.equal(service.getVenueOverride(itemKey), null);
    assert.equal(afterClear.venueId, "acl");
    assert.equal(afterClear.shortName, "ACL");
  });
});
