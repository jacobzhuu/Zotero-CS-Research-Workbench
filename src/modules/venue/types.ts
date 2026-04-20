import type {
  ResolvedVenue,
  VenueMaster,
  VenueOverride,
  VenueType,
} from "../storage/types";

export type VenueFieldSource =
  | "conferenceName"
  | "proceedingsTitle"
  | "bookTitle"
  | "publicationTitle"
  | "journalAbbreviation"
  | "seriesTitle"
  | "extra"
  | "";

export type VenueMatchSource = "alias" | "canonicalName" | "shortName" | "none";

export interface VenueResolvableItem {
  key?: string;
  getField(
    field: string,
    unformatted?: boolean,
    includeBaseMapped?: boolean,
  ): string;
  getExtraField?(fieldName: string): string;
}

export interface ExtractedVenueCandidate {
  sourceField: VenueFieldSource;
  rawValue: string;
  normalizedValue: string;
  variants: string[];
  inferredType: VenueType;
}

export interface ExtractedVenueInfo {
  rawVenue: string;
  normalizedVenue: string;
  sourceField: VenueFieldSource;
  inferredType: VenueType;
  candidates: ExtractedVenueCandidate[];
}

export interface VenueMatchResult {
  matchedBy: VenueMatchSource;
  matchedVariant: string;
  venue: VenueMaster;
}

export interface VenueResolutionResult extends ResolvedVenue {
  rawVenue: string;
  normalizedVenue: string;
  sourceField: VenueFieldSource;
  inferredType: VenueType;
  matchedBy: VenueMatchSource;
  matchedVariant: string;
  itemKey: string;
}

export interface VenueSeedRecord {
  area: "AI/ML" | "NLP" | "CV" | "RecSys" | "Security" | "DB" | "SE" | "HCI";
  venueId: string;
  canonicalName: string;
  shortName: string;
  aliases: string[];
  type: VenueType;
  ccfRank?: VenueMaster["ccfRank"];
  coreRank?: VenueMaster["coreRank"];
}

export interface VenueResolutionSnapshot {
  automatic: VenueMaster | null;
  override: VenueOverride | null;
  resolved: VenueResolutionResult;
}
