/* global afterEach, beforeEach, describe, it, assert */

import {
  extractArtifactInfo,
  normalizeArxivUrl,
  normalizeDoiUrl,
  normalizeOpenReviewUrl,
} from "../../src/modules/artifact/normalization";
import type { ArtifactResolvableItem } from "../../src/modules/artifact/types";
import { resetTestEnv, restoreNow } from "../storage/testUtils";

function createItem(
  fields: Record<string, string>,
  key = "item-1",
): ArtifactResolvableItem {
  return {
    key,
    getField(field: string) {
      return fields[field] ?? "";
    },
  };
}

describe("artifact normalization", function () {
  beforeEach(function () {
    resetTestEnv();
  });

  afterEach(function () {
    restoreNow();
  });

  it("normalizes DOI identifiers and DOI URLs", function () {
    assert.equal(
      normalizeDoiUrl("10.1145/12345.67890"),
      "https://doi.org/10.1145/12345.67890",
    );
    assert.equal(
      normalizeDoiUrl("https://doi.org/10.1145/ABC.DEF."),
      "https://doi.org/10.1145/abc.def",
    );
    assert.equal(normalizeDoiUrl("not-a-doi"), "");
  });

  it("normalizes arXiv identifiers from raw ids and URLs", function () {
    assert.equal(
      normalizeArxivUrl("arXiv:2401.12345v2"),
      "https://arxiv.org/abs/2401.12345v2",
    );
    assert.equal(
      normalizeArxivUrl("https://arxiv.org/pdf/cs.CL/9901001.pdf"),
      "https://arxiv.org/abs/cs.CL/9901001",
    );
    assert.equal(normalizeArxivUrl("not-an-arxiv-id"), "");
  });

  it("normalizes OpenReview URLs and explicit ids", function () {
    assert.equal(
      normalizeOpenReviewUrl("https://openreview.net/pdf?id=abc123"),
      "https://openreview.net/forum?id=abc123",
    );
    assert.equal(
      normalizeOpenReviewUrl("abc123", true),
      "https://openreview.net/forum?id=abc123",
    );
    assert.equal(normalizeOpenReviewUrl("abc123"), "");
  });

  it("extracts representative artifact links without mutating source metadata", function () {
    const fields = {
      DOI: "10.1145/ABC.DEF",
      url: "https://openreview.net/pdf?id=or456",
      archive: "arXiv",
      archiveLocation: "2401.12345v3",
      extra: [
        "Code: github.com/example/repo",
        "Project: https://example.com/project",
      ].join("\n"),
    };
    const snapshot = JSON.parse(JSON.stringify(fields)) as typeof fields;

    const extracted = extractArtifactInfo(createItem(fields));

    assert.equal(
      extracted.doiUrl?.normalizedUrl,
      "https://doi.org/10.1145/abc.def",
    );
    assert.equal(extracted.doiUrl?.sourceField, "DOI");
    assert.equal(
      extracted.arxivUrl?.normalizedUrl,
      "https://arxiv.org/abs/2401.12345v3",
    );
    assert.equal(extracted.arxivUrl?.sourceField, "archiveLocation");
    assert.equal(
      extracted.openreviewUrl?.normalizedUrl,
      "https://openreview.net/forum?id=or456",
    );
    assert.equal(extracted.openreviewUrl?.sourceField, "url");
    assert.equal(
      extracted.codeUrl?.normalizedUrl,
      "https://github.com/example/repo",
    );
    assert.equal(extracted.codeUrl?.sourceField, "extra");
    assert.equal(
      extracted.projectUrl?.normalizedUrl,
      "https://example.com/project",
    );
    assert.equal(extracted.projectUrl?.sourceField, "extra");
    assert.deepEqual(fields, snapshot);
  });

  it("falls back cleanly when metadata is missing or malformed", function () {
    const extracted = extractArtifactInfo(
      createItem({
        DOI: "not-a-doi",
        url: "notaurl",
        archive: "arXiv",
        archiveLocation: "definitely not an arxiv id",
        extra: "Code: not-a-valid-url",
      }),
    );

    assert.deepEqual(extracted, {
      doiUrl: null,
      arxivUrl: null,
      openreviewUrl: null,
      codeUrl: null,
      projectUrl: null,
    });
  });
});
