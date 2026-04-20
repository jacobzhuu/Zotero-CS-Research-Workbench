import { normalizeText } from "../storage/common";
import type {
  VenueFieldSource,
  VenueResolvableItem,
  ExtractedVenueCandidate,
  ExtractedVenueInfo,
} from "./types";
import type { VenueType } from "../storage/types";

const FIELD_PRIORITY: ReadonlyArray<{
  field: VenueFieldSource;
  inferredType: VenueType;
}> = [
  { field: "conferenceName", inferredType: "conference" },
  { field: "proceedingsTitle", inferredType: "conference" },
  { field: "bookTitle", inferredType: "conference" },
  { field: "publicationTitle", inferredType: "unknown" },
  { field: "journalAbbreviation", inferredType: "journal" },
  { field: "seriesTitle", inferredType: "unknown" },
];

const CONFERENCE_KEYWORDS = [
  "conference",
  "symposium",
  "workshop",
  "proceedings",
  "meeting",
  "congress",
  "forum",
];

const JOURNAL_KEYWORDS = [
  "journal",
  "transactions",
  "letters",
  "magazine",
  "review",
];

const EXTRA_FIELD_LABELS: Readonly<Record<string, VenueFieldSource>> = {
  venue: "extra",
  containertitle: "publicationTitle",
  "container-title": "publicationTitle",
  publicationtitle: "publicationTitle",
  proceedingstitle: "proceedingsTitle",
  conferencename: "conferenceName",
  journalabbreviation: "journalAbbreviation",
  seriestitle: "seriesTitle",
};

function readItemField(
  item: VenueResolvableItem,
  field: VenueFieldSource,
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

function extractExtraCandidates(extra: string): ExtractedVenueCandidate[] {
  const candidates: ExtractedVenueCandidate[] = [];

  for (const rawLine of extra.split(/\r?\n/)) {
    const line = normalizeText(rawLine);
    if (!line || !line.includes(":")) {
      continue;
    }

    const separatorIndex = line.indexOf(":");
    const rawLabel = line
      .slice(0, separatorIndex)
      .toLowerCase()
      .replace(/\s+/g, "");
    const sourceField = EXTRA_FIELD_LABELS[rawLabel];
    if (!sourceField) {
      continue;
    }

    const value = normalizeText(line.slice(separatorIndex + 1));
    if (!value) {
      continue;
    }

    candidates.push(createCandidate(sourceField, value, "unknown"));
  }

  return candidates;
}

function createCandidate(
  sourceField: VenueFieldSource,
  rawValue: string,
  defaultType: VenueType,
): ExtractedVenueCandidate {
  const variants = extractVenueVariants(rawValue);
  const normalizedValue = variants[0] ?? "";

  return {
    sourceField,
    rawValue,
    normalizedValue,
    variants,
    inferredType: classifyVenueText(rawValue, sourceField, defaultType),
  };
}

export function canonicalizeVenueText(value: string): string {
  let normalized = normalizeText(value);
  if (!normalized) {
    return "";
  }

  normalized = normalized
    .replace(/&/g, " and ")
    .replace(/\b(?:19|20)\d{2}\b/g, " ")
    .replace(/\b\d{1,3}(?:st|nd|rd|th)\b/gi, " ")
    .replace(/\bproc(?:eedings)?\.?\s+of\b/gi, " ")
    .replace(/\bproceedings\b/gi, " ")
    .replace(/\bannual\b/gi, " ")
    .replace(/\bthe\b/gi, " ")
    .replace(/[()[\]{}]/g, " ")
    .replace(/[/:,.;_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return normalized;
}

export function extractVenueVariants(value: string): string[] {
  const rawValue = normalizeText(value);
  if (!rawValue) {
    return [];
  }

  const variants = new Set<string>();
  const addVariant = (candidate: string) => {
    const normalized = canonicalizeVenueText(candidate);
    if (normalized) {
      variants.add(normalized);
    }
  };

  addVariant(rawValue);

  for (const match of rawValue.matchAll(/\(([^)]+)\)/g)) {
    addVariant(match[1]);
  }

  const acronymMatches =
    rawValue.match(/\b(?:[A-Z]{3,}|[A-Z][a-z]+[A-Z][A-Za-z]*)\b/g) ?? [];
  for (const acronym of acronymMatches) {
    addVariant(acronym);
  }

  return [...variants];
}

export function classifyVenueText(
  value: string,
  sourceField: VenueFieldSource = "",
  defaultType: VenueType = "unknown",
): VenueType {
  if (sourceField === "conferenceName" || sourceField === "proceedingsTitle") {
    return "conference";
  }
  if (sourceField === "bookTitle") {
    return "conference";
  }
  if (sourceField === "journalAbbreviation") {
    return "journal";
  }

  const normalized = canonicalizeVenueText(value);
  if (!normalized) {
    return defaultType;
  }

  if (CONFERENCE_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "conference";
  }
  if (JOURNAL_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "journal";
  }

  if (sourceField === "publicationTitle") {
    return "journal";
  }

  return defaultType;
}

export function extractVenueInfo(
  item: VenueResolvableItem,
): ExtractedVenueInfo {
  const candidates: ExtractedVenueCandidate[] = [];

  for (const fieldConfig of FIELD_PRIORITY) {
    const value = readItemField(item, fieldConfig.field);
    if (!value) {
      continue;
    }

    candidates.push(
      createCandidate(fieldConfig.field, value, fieldConfig.inferredType),
    );
  }

  const extra = readItemField(item, "extra");
  if (extra) {
    candidates.push(...extractExtraCandidates(extra));
  }

  const primaryCandidate = candidates[0];

  return {
    rawVenue: primaryCandidate?.rawValue ?? "",
    normalizedVenue: primaryCandidate?.normalizedValue ?? "",
    sourceField: primaryCandidate?.sourceField ?? "",
    inferredType: primaryCandidate?.inferredType ?? "unknown",
    candidates,
  };
}
