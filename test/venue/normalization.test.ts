/* global afterEach, beforeEach, describe, it, assert */

import {
  canonicalizeVenueText,
  classifyVenueText,
  extractVenueInfo,
  extractVenueVariants,
} from "../../src/modules/venue/normalization";
import type { VenueResolvableItem } from "../../src/modules/venue/types";
import { resetTestEnv, restoreNow } from "../storage/testUtils";

function createItem(
  fields: Record<string, string>,
  key = "item-1",
): VenueResolvableItem {
  return {
    key,
    getField(field: string) {
      return fields[field] ?? "";
    },
  };
}

describe("venue normalization", function () {
  beforeEach(function () {
    resetTestEnv();
  });

  afterEach(function () {
    restoreNow();
  });

  it("canonicalizes venue text deterministically", function () {
    assert.equal(
      canonicalizeVenueText(
        "Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR) 2024",
      ),
      "ieee cvf conference on computer vision and pattern recognition cvpr",
    );
  });

  it("extracts canonicalized variants including acronym aliases", function () {
    const variants = extractVenueVariants(
      "Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR) 2024",
    );

    assert.include(
      variants,
      "ieee cvf conference on computer vision and pattern recognition cvpr",
    );
    assert.include(variants, "cvpr");
  });

  it("classifies conferences and journals from source metadata", function () {
    assert.equal(
      classifyVenueText(
        "Proceedings of the International Conference on Machine Learning",
        "proceedingsTitle",
      ),
      "conference",
    );
    assert.equal(
      classifyVenueText(
        "Journal of Machine Learning Research",
        "publicationTitle",
      ),
      "journal",
    );
    assert.equal(classifyVenueText("Unclear Venue"), "unknown");
  });

  it("prefers conference metadata fields over weaker candidates", function () {
    const info = extractVenueInfo(
      createItem({
        conferenceName: "International Conference on Machine Learning",
        publicationTitle: "Journal of Placeholder Studies",
        extra: "venue: NeurIPS",
      }),
    );

    assert.equal(info.rawVenue, "International Conference on Machine Learning");
    assert.equal(info.sourceField, "conferenceName");
    assert.equal(info.inferredType, "conference");
    assert.equal(
      info.candidates[0]?.normalizedValue,
      "international conference on machine learning",
    );
  });

  it("falls back to extra metadata without mutating the source item fields", function () {
    const fields = {
      extra: "container-title: Proceedings of the VLDB Endowment\nvenue: PVLDB",
    };
    const snapshot = JSON.parse(JSON.stringify(fields)) as typeof fields;

    const info = extractVenueInfo(createItem(fields));

    assert.equal(info.rawVenue, "Proceedings of the VLDB Endowment");
    assert.equal(info.sourceField, "publicationTitle");
    assert.equal(info.inferredType, "journal");
    assert.deepEqual(fields, snapshot);
  });

  it("degrades cleanly to an empty unknown result when no venue metadata exists", function () {
    const info = extractVenueInfo(createItem({}));

    assert.deepEqual(info, {
      rawVenue: "",
      normalizedVenue: "",
      sourceField: "",
      inferredType: "unknown",
      candidates: [],
    });
  });
});
