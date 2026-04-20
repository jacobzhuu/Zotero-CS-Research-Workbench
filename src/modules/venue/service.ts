import { normalizeText } from "../storage/common";
import type { WorkbenchStorage } from "../storage/workbenchStorage";
import { mergeVenue } from "../storage/mergeService";
import type {
  ResolvedVenue,
  VenueMaster,
  VenueOverride,
} from "../storage/types";
import { canonicalizeVenueText, extractVenueInfo } from "./normalization";
import { getSeedVenueMasters } from "./seedData";
import type {
  ExtractedVenueInfo,
  VenueMatchResult,
  VenueResolvableItem,
  VenueResolutionResult,
  VenueResolutionSnapshot,
} from "./types";

type VenueIndexRecord = {
  venue: VenueMaster;
  matchedBy: VenueMatchResult["matchedBy"];
};

function buildFallbackVenue(extracted: ExtractedVenueInfo): VenueMaster | null {
  if (!extracted.rawVenue && extracted.inferredType === "unknown") {
    return null;
  }

  return {
    venueId: "",
    canonicalName: "",
    shortName: "",
    type: extracted.inferredType,
    ccfRank: "",
    coreRank: "",
    aliasesJson: [],
    updatedAt: 0,
  };
}

function buildVenueIndex(venues: VenueMaster[]): Map<string, VenueIndexRecord> {
  const index = new Map<string, VenueIndexRecord>();

  const register = (
    key: string,
    venue: VenueMaster,
    matchedBy: VenueMatchResult["matchedBy"],
  ) => {
    const normalized = canonicalizeVenueText(key);
    if (!normalized || index.has(normalized)) {
      return;
    }

    index.set(normalized, { venue, matchedBy });
  };

  for (const venue of venues) {
    register(venue.canonicalName, venue, "canonicalName");
    register(venue.shortName, venue, "shortName");
    for (const alias of venue.aliasesJson) {
      register(alias, venue, "alias");
    }
  }

  return index;
}

function toResolutionResult(
  itemKey: string,
  extracted: ExtractedVenueInfo,
  resolvedVenue: ResolvedVenue,
  match: VenueMatchResult | null,
): VenueResolutionResult {
  return {
    ...resolvedVenue,
    itemKey,
    rawVenue: extracted.rawVenue,
    normalizedVenue: extracted.normalizedVenue,
    sourceField: extracted.sourceField,
    inferredType: extracted.inferredType,
    matchedBy: match?.matchedBy ?? "none",
    matchedVariant: match?.matchedVariant ?? "",
  };
}

export class VenueLiteService {
  constructor(private readonly storage: WorkbenchStorage) {}

  ensureSeedData(): VenueMaster[] {
    const existing = this.storage.venues.getAll();
    const missingSeeds = getSeedVenueMasters().filter(
      (venue) => !existing.has(venue.venueId),
    );

    if (missingSeeds.length > 0) {
      this.storage.venues.upsertMany(missingSeeds);
    }

    return this.storage.venues.list();
  }

  getSeedVenueDataset(): VenueMaster[] {
    this.ensureSeedData();
    return this.storage.venues.list();
  }

  extractVenueInfo(item: VenueResolvableItem): ExtractedVenueInfo {
    return extractVenueInfo(item);
  }

  findVenueMatch(extracted: ExtractedVenueInfo): VenueMatchResult | null {
    const venueIndex = buildVenueIndex(this.getSeedVenueDataset());

    for (const candidate of extracted.candidates) {
      for (const variant of candidate.variants) {
        const indexRecord = venueIndex.get(variant);
        if (!indexRecord) {
          continue;
        }

        return {
          venue: indexRecord.venue,
          matchedBy: indexRecord.matchedBy,
          matchedVariant: variant,
        };
      }
    }

    return null;
  }

  resolveAutomaticVenue(item: VenueResolvableItem): {
    extracted: ExtractedVenueInfo;
    automatic: VenueMaster | null;
    match: VenueMatchResult | null;
  } {
    const extracted = this.extractVenueInfo(item);
    const match = this.findVenueMatch(extracted);

    return {
      extracted,
      automatic: match?.venue ?? buildFallbackVenue(extracted),
      match,
    };
  }

  resolveVenue(
    item: VenueResolvableItem,
    itemKey = normalizeText(item.key),
  ): VenueResolutionResult {
    const automaticResolution = this.resolveAutomaticVenue(item);
    const resolved = mergeVenue(
      automaticResolution.automatic,
      itemKey ? this.storage.overrides.get(itemKey) : null,
    );

    return toResolutionResult(
      itemKey,
      automaticResolution.extracted,
      resolved,
      automaticResolution.match,
    );
  }

  refreshVenue(
    item: VenueResolvableItem,
    itemKey = normalizeText(item.key),
  ): VenueResolutionResult {
    return this.resolveVenue(item, itemKey);
  }

  resolveVenueSnapshot(
    item: VenueResolvableItem,
    itemKey = normalizeText(item.key),
  ): VenueResolutionSnapshot {
    const automaticResolution = this.resolveAutomaticVenue(item);
    const override = itemKey
      ? this.storage.overrides.getVenueOverride(itemKey)
      : null;
    const resolved = mergeVenue(
      automaticResolution.automatic,
      itemKey ? this.storage.overrides.get(itemKey) : null,
    );

    return {
      automatic: automaticResolution.automatic,
      override,
      resolved: toResolutionResult(
        itemKey,
        automaticResolution.extracted,
        resolved,
        automaticResolution.match,
      ),
    };
  }

  getVenueOverride(itemKey: string): VenueOverride | null {
    return this.storage.overrides.getVenueOverride(itemKey);
  }

  setVenueOverride(
    itemKey: string,
    override: VenueOverride,
  ): VenueOverride | null {
    this.storage.overrides.setVenueOverride(itemKey, override);
    return this.getVenueOverride(itemKey);
  }

  setVenueOverrideFromVenueId(
    itemKey: string,
    venueId: string,
  ): VenueOverride | null {
    this.ensureSeedData();
    const venue = this.storage.venues.get(venueId);
    if (!venue) {
      return null;
    }

    return this.setVenueOverride(itemKey, {
      venueId: venue.venueId,
      canonicalName: venue.canonicalName,
      shortName: venue.shortName,
      type: venue.type,
      ccfRank: venue.ccfRank,
      coreRank: venue.coreRank,
    });
  }

  clearVenueOverride(itemKey: string): void {
    this.storage.overrides.clearVenueOverride(itemKey);
  }
}

export function createVenueLiteService(
  storage: WorkbenchStorage,
): VenueLiteService {
  return new VenueLiteService(storage);
}
