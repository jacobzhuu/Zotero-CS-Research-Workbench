import { config } from "../../../package.json";
import {
  cloneStoredMap,
  cloneStoredValue,
  loadStoredMap,
  normalizeStringArray,
  normalizeText,
  saveStoredMap,
} from "./common";
import type { VenueMaster } from "./types";

const STORAGE_KEY = `${config.prefsPrefix}.venues`;

function normalizeVenueRecord(venue: VenueMaster): VenueMaster {
  return {
    venueId: normalizeText(venue.venueId),
    canonicalName: normalizeText(venue.canonicalName),
    shortName: normalizeText(venue.shortName),
    type: venue.type,
    ccfRank: venue.ccfRank,
    coreRank: venue.coreRank,
    aliasesJson: normalizeStringArray(venue.aliasesJson),
    updatedAt: Date.now(),
  };
}

export class VenueStore {
  private cache: Map<string, VenueMaster>;

  constructor() {
    this.cache = loadStoredMap<VenueMaster>(STORAGE_KEY);
  }

  get(venueId: string): VenueMaster | null {
    const record = this.cache.get(venueId);
    return record ? cloneStoredValue(record) : null;
  }

  list(): VenueMaster[] {
    return Array.from(this.cache.values(), (venue) => cloneStoredValue(venue));
  }

  getAll(): Map<string, VenueMaster> {
    return cloneStoredMap(this.cache);
  }

  upsert(venue: VenueMaster): VenueMaster {
    const normalized = normalizeVenueRecord(venue);
    this.cache.set(normalized.venueId, normalized);
    this.saveToStorage();
    return cloneStoredValue(normalized);
  }

  upsertMany(venues: VenueMaster[]): VenueMaster[] {
    const normalizedVenues = venues.map((venue) => normalizeVenueRecord(venue));
    for (const venue of normalizedVenues) {
      this.cache.set(venue.venueId, venue);
    }
    this.saveToStorage();
    return normalizedVenues.map((venue) => cloneStoredValue(venue));
  }

  set(venueId: string, venue: VenueMaster): VenueMaster {
    return this.upsert({ ...venue, venueId });
  }

  setBatch(venues: VenueMaster[]): VenueMaster[] {
    return this.upsertMany(venues);
  }

  delete(venueId: string): void {
    if (this.cache.delete(venueId)) {
      this.saveToStorage();
    }
  }

  clear(): void {
    this.cache.clear();
    this.saveToStorage();
  }

  findByShortName(shortName: string): VenueMaster | null {
    const normalized = normalizeText(shortName).toLowerCase();
    for (const venue of this.cache.values()) {
      if (venue.shortName.toLowerCase() === normalized) {
        return cloneStoredValue(venue);
      }
    }

    return null;
  }

  findByAlias(alias: string): VenueMaster | null {
    const normalized = normalizeText(alias).toLowerCase();
    for (const venue of this.cache.values()) {
      if (
        venue.aliasesJson.some((entry) => entry.toLowerCase() === normalized) ||
        venue.shortName.toLowerCase() === normalized ||
        venue.canonicalName.toLowerCase() === normalized
      ) {
        return cloneStoredValue(venue);
      }
    }

    return null;
  }

  get size(): number {
    return this.cache.size;
  }

  private saveToStorage(): void {
    saveStoredMap(STORAGE_KEY, this.cache);
  }
}
