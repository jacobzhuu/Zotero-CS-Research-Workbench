import { normalizeText } from "../storage/common";
import type {
  ArtifactFieldName,
  ArtifactFieldSource,
  ArtifactResolvableItem,
  ExtractedArtifactField,
  ExtractedArtifactInfo,
} from "./types";

const DOI_LABELS = new Set(["doi"]);
const ARXIV_LABELS = new Set(["arxiv", "archiveid"]);
const OPENREVIEW_LABELS = new Set(["openreview"]);
const CODE_LABELS = new Set([
  "code",
  "codeurl",
  "repo",
  "repository",
  "github",
  "gitlab",
  "bitbucket",
]);
const PROJECT_LABELS = new Set([
  "project",
  "projecturl",
  "projectpage",
  "homepage",
  "home",
  "website",
  "websiteurl",
]);

const CODE_HOSTS = new Set(["github.com", "gitlab.com", "bitbucket.org"]);

const DOI_PATTERN = /\b10\.\d{4,9}\/[^\s"'<>]+/i;
const ARXIV_PATTERN =
  /\b([a-z-]+(?:\.[A-Z]{2})?\/\d{7}(?:v\d+)?|\d{4}\.\d{4,5}(?:v\d+)?)\b/i;

type ExtraLineEntry = {
  normalizedLabel: string;
  value: string;
};

function trimTrailingPunctuation(value: string): string {
  return value.replace(/[)\],.;:]+$/g, "");
}

function decodeMaybe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeLabel(value: string): string {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function readItemField(
  item: ArtifactResolvableItem,
  field: ArtifactFieldSource,
): string {
  if (!field) {
    return "";
  }

  try {
    return normalizeText(item.getField(field));
  } catch {
    return "";
  }
}

function createExtractedField(
  key: ArtifactFieldName,
  sourceField: ArtifactFieldSource,
  rawValue: string,
  normalizedUrl: string,
): ExtractedArtifactField {
  return {
    key,
    sourceField,
    rawValue: normalizeText(rawValue),
    normalizedUrl,
  };
}

function createResolvedField(
  key: ArtifactFieldName,
  sourceField: ArtifactFieldSource,
  rawValue: string,
  normalize: (value: string) => string,
): ExtractedArtifactField | null {
  const normalizedUrl = normalize(rawValue);
  if (!normalizedUrl) {
    return null;
  }

  return createExtractedField(key, sourceField, rawValue, normalizedUrl);
}

function parseExtraLines(extra: string): ExtraLineEntry[] {
  const entries: ExtraLineEntry[] = [];

  for (const rawLine of extra.split(/\r?\n/)) {
    const line = normalizeText(rawLine);
    if (!line || !line.includes(":")) {
      continue;
    }

    const separatorIndex = line.indexOf(":");
    const label = line.slice(0, separatorIndex);
    const value = normalizeText(line.slice(separatorIndex + 1));
    if (!value) {
      continue;
    }

    entries.push({
      normalizedLabel: normalizeLabel(label),
      value,
    });
  }

  return entries;
}

function normalizeHttpUrl(value: string): string {
  let candidate = normalizeText(value);
  if (!candidate) {
    return "";
  }

  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(candidate)) {
    if (!/^[\w.-]+\.[a-z]{2,}/i.test(candidate)) {
      return "";
    }
    candidate = `https://${candidate}`;
  }

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }
    return url.toString();
  } catch {
    return "";
  }
}

export function normalizeDoiUrl(value: string): string {
  let candidate = decodeMaybe(normalizeText(value));
  if (!candidate) {
    return "";
  }

  candidate = candidate.replace(/^doi\s*:\s*/i, "");

  const urlMatch = candidate.match(/^https?:\/\/(?:dx\.)?doi\.org\/(.+)$/i);
  if (urlMatch) {
    candidate = urlMatch[1];
  }

  const doiMatch = candidate.match(DOI_PATTERN);
  if (!doiMatch) {
    return "";
  }

  const doi = trimTrailingPunctuation(doiMatch[0]).toLowerCase();
  return doi ? `https://doi.org/${doi}` : "";
}

export function normalizeArxivUrl(value: string): string {
  let candidate = decodeMaybe(normalizeText(value));
  if (!candidate) {
    return "";
  }

  const normalizedUrl = normalizeHttpUrl(candidate);
  if (normalizedUrl) {
    try {
      const url = new URL(normalizedUrl);
      if (url.hostname === "arxiv.org" || url.hostname === "www.arxiv.org") {
        const path = url.pathname.replace(/^\/+/, "");
        if (path.startsWith("abs/")) {
          candidate = path.slice(4);
        } else if (path.startsWith("pdf/")) {
          candidate = path.slice(4).replace(/\.pdf$/i, "");
        }
      }
    } catch {
      // Fall back to pattern matching on the raw candidate.
    }
  }

  candidate = candidate.replace(/^arxiv\s*:\s*/i, "");
  const arxivMatch = candidate.match(ARXIV_PATTERN);
  if (!arxivMatch) {
    return "";
  }

  return `https://arxiv.org/abs/${trimTrailingPunctuation(arxivMatch[1])}`;
}

export function normalizeOpenReviewUrl(
  value: string,
  allowBareId = false,
): string {
  const candidate = normalizeText(value);
  if (!candidate) {
    return "";
  }

  const normalizedUrl = normalizeHttpUrl(candidate);
  if (normalizedUrl) {
    try {
      const url = new URL(normalizedUrl);
      if (
        url.hostname === "openreview.net" ||
        url.hostname === "www.openreview.net"
      ) {
        const id = normalizeText(url.searchParams.get("id") ?? "");
        if (id) {
          return `https://openreview.net/forum?id=${id}`;
        }
      }
    } catch {
      // Fall through to the bare-id case when URL parsing fails.
    }
  }

  if (allowBareId && /^[A-Za-z0-9_-]{6,}$/.test(candidate)) {
    return `https://openreview.net/forum?id=${candidate}`;
  }

  return "";
}

export function normalizeCodeUrl(value: string): string {
  const normalizedUrl = normalizeHttpUrl(value);
  if (!normalizedUrl) {
    return "";
  }

  try {
    const url = new URL(normalizedUrl);
    const host = url.hostname.toLowerCase();
    if (!CODE_HOSTS.has(host)) {
      return "";
    }
    if (url.pathname.split("/").filter(Boolean).length < 2) {
      return "";
    }
    return normalizedUrl;
  } catch {
    return "";
  }
}

export function normalizeProjectUrl(value: string): string {
  return normalizeHttpUrl(value);
}

function findFirstFromExtra(
  key: ArtifactFieldName,
  entries: ExtraLineEntry[],
  labels: ReadonlySet<string>,
  normalize: (value: string) => string,
): ExtractedArtifactField | null {
  for (const entry of entries) {
    if (!labels.has(entry.normalizedLabel)) {
      continue;
    }

    return createResolvedField(key, "extra", entry.value, normalize);
  }

  return null;
}

function pickFirst<T>(...values: Array<T | null>): T | null {
  return values.find((value) => value !== null) ?? null;
}

export function extractArtifactInfo(
  item: ArtifactResolvableItem,
): ExtractedArtifactInfo {
  const doiField = readItemField(item, "DOI");
  const urlField = readItemField(item, "url");
  const extraField = readItemField(item, "extra");
  const archiveField = readItemField(item, "archive");
  const archiveIdField = readItemField(item, "archiveID");
  const archiveLocationField = readItemField(item, "archiveLocation");
  const extraEntries = parseExtraLines(extraField);
  const isArxivArchive = normalizeLabel(archiveField) === "arxiv";

  const doiUrl = pickFirst(
    doiField
      ? createResolvedField("doiUrl", "DOI", doiField, normalizeDoiUrl)
      : null,
    urlField
      ? createResolvedField("doiUrl", "url", urlField, normalizeDoiUrl)
      : null,
    findFirstFromExtra("doiUrl", extraEntries, DOI_LABELS, normalizeDoiUrl),
    extraField
      ? createResolvedField("doiUrl", "extra", extraField, normalizeDoiUrl)
      : null,
  );

  const arxivUrl = pickFirst(
    archiveIdField
      ? createResolvedField(
          "arxivUrl",
          "archiveID",
          archiveIdField,
          normalizeArxivUrl,
        )
      : null,
    isArxivArchive && archiveLocationField
      ? createResolvedField(
          "arxivUrl",
          "archiveLocation",
          archiveLocationField,
          normalizeArxivUrl,
        )
      : null,
    urlField
      ? createResolvedField("arxivUrl", "url", urlField, normalizeArxivUrl)
      : null,
    findFirstFromExtra(
      "arxivUrl",
      extraEntries,
      ARXIV_LABELS,
      normalizeArxivUrl,
    ),
    extraField
      ? createResolvedField("arxivUrl", "extra", extraField, normalizeArxivUrl)
      : null,
  );

  const openreviewUrl = pickFirst(
    urlField
      ? createResolvedField(
          "openreviewUrl",
          "url",
          urlField,
          normalizeOpenReviewUrl,
        )
      : null,
    findFirstFromExtra(
      "openreviewUrl",
      extraEntries,
      OPENREVIEW_LABELS,
      (value) => normalizeOpenReviewUrl(value, true),
    ),
    extraField
      ? createResolvedField(
          "openreviewUrl",
          "extra",
          extraField,
          normalizeOpenReviewUrl,
        )
      : null,
  );

  const codeUrl = pickFirst(
    findFirstFromExtra("codeUrl", extraEntries, CODE_LABELS, normalizeCodeUrl),
    urlField
      ? createResolvedField("codeUrl", "url", urlField, normalizeCodeUrl)
      : null,
  );

  const projectUrl = pickFirst(
    findFirstFromExtra(
      "projectUrl",
      extraEntries,
      PROJECT_LABELS,
      normalizeProjectUrl,
    ),
  );

  return {
    doiUrl,
    arxivUrl,
    openreviewUrl,
    codeUrl,
    projectUrl,
  };
}
