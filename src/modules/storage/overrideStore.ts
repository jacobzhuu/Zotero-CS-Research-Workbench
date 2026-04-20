import { config } from "../../../package.json";
import {
  cloneStoredMap,
  cloneStoredValue,
  hasOwnKeys,
  loadStoredMap,
  normalizeStringArray,
  normalizeText,
  saveStoredMap,
} from "./common";
import type {
  ArtifactOverride,
  TagOverride,
  UserOverrides,
  VenueOverride,
} from "./types";

const STORAGE_KEY = `${config.prefsPrefix}.overrides`;

function emptyOverrides(itemKey: string): UserOverrides {
  return {
    itemKey,
    venueOverrideJson: {},
    artifactOverrideJson: {},
    tagOverrideJson: {},
    updatedAt: Date.now(),
  };
}

function normalizeVenueOverride(override: VenueOverride): VenueOverride {
  const normalized: VenueOverride = {};

  if (override.venueId !== undefined) {
    normalized.venueId = normalizeText(override.venueId);
  }
  if (override.canonicalName !== undefined) {
    normalized.canonicalName = normalizeText(override.canonicalName);
  }
  if (override.shortName !== undefined) {
    normalized.shortName = normalizeText(override.shortName);
  }
  if (override.type !== undefined) {
    normalized.type = override.type;
  }
  if (override.ccfRank !== undefined) {
    normalized.ccfRank = override.ccfRank;
  }
  if (override.coreRank !== undefined) {
    normalized.coreRank = override.coreRank;
  }

  return normalized;
}

function normalizeArtifactOverride(
  override: ArtifactOverride,
): ArtifactOverride {
  const normalized: ArtifactOverride = {};

  if (override.doiUrl !== undefined) {
    normalized.doiUrl = normalizeText(override.doiUrl);
  }
  if (override.arxivUrl !== undefined) {
    normalized.arxivUrl = normalizeText(override.arxivUrl);
  }
  if (override.openreviewUrl !== undefined) {
    normalized.openreviewUrl = normalizeText(override.openreviewUrl);
  }
  if (override.codeUrl !== undefined) {
    normalized.codeUrl = normalizeText(override.codeUrl);
  }
  if (override.projectUrl !== undefined) {
    normalized.projectUrl = normalizeText(override.projectUrl);
  }

  return normalized;
}

function normalizeTagOverride(override: TagOverride): TagOverride {
  const normalized: TagOverride = {};

  if (override.taskJson !== undefined) {
    normalized.taskJson = normalizeStringArray(override.taskJson);
  }
  if (override.methodJson !== undefined) {
    normalized.methodJson = normalizeStringArray(override.methodJson);
  }
  if (override.datasetJson !== undefined) {
    normalized.datasetJson = normalizeStringArray(override.datasetJson);
  }
  if (override.metricJson !== undefined) {
    normalized.metricJson = normalizeStringArray(override.metricJson);
  }

  return normalized;
}

function normalizeOverrides(record: UserOverrides): UserOverrides {
  return {
    itemKey: normalizeText(record.itemKey),
    venueOverrideJson: normalizeVenueOverride(record.venueOverrideJson),
    artifactOverrideJson: normalizeArtifactOverride(
      record.artifactOverrideJson,
    ),
    tagOverrideJson: normalizeTagOverride(record.tagOverrideJson),
    updatedAt: Date.now(),
  };
}

export class OverrideStore {
  private cache: Map<string, UserOverrides>;

  constructor() {
    this.cache = loadStoredMap<UserOverrides>(STORAGE_KEY);
  }

  get(itemKey: string): UserOverrides | null {
    const record = this.cache.get(itemKey);
    return record ? cloneStoredValue(record) : null;
  }

  list(): UserOverrides[] {
    return Array.from(this.cache.values(), (record) =>
      cloneStoredValue(record),
    );
  }

  getAll(): Map<string, UserOverrides> {
    return cloneStoredMap(this.cache);
  }

  upsert(record: UserOverrides): UserOverrides | null {
    const normalized = normalizeOverrides(record);
    if (!this.hasAnyOverride(normalized)) {
      this.cache.delete(normalized.itemKey);
      this.saveToStorage();
      return null;
    }

    this.cache.set(normalized.itemKey, normalized);
    this.saveToStorage();
    return cloneStoredValue(normalized);
  }

  hasOverrides(itemKey: string): boolean {
    const entry = this.cache.get(itemKey);
    if (!entry) return false;

    return this.hasAnyOverride(entry);
  }

  getVenueOverride(itemKey: string): VenueOverride | null {
    const entry = this.cache.get(itemKey);
    return entry ? cloneStoredValue(entry.venueOverrideJson) : null;
  }

  getArtifactOverride(itemKey: string): ArtifactOverride | null {
    const entry = this.cache.get(itemKey);
    return entry ? cloneStoredValue(entry.artifactOverrideJson) : null;
  }

  getTagOverride(itemKey: string): TagOverride | null {
    const entry = this.cache.get(itemKey);
    return entry ? cloneStoredValue(entry.tagOverrideJson) : null;
  }

  set(itemKey: string, overrides: UserOverrides): UserOverrides | null {
    return this.upsert({ ...overrides, itemKey });
  }

  setVenueOverride(
    itemKey: string,
    override: VenueOverride,
  ): UserOverrides | null {
    const existing = this.cache.get(itemKey) || emptyOverrides(itemKey);
    existing.venueOverrideJson = { ...existing.venueOverrideJson, ...override };
    existing.updatedAt = Date.now();
    return this.upsert(existing);
  }

  clearVenueOverride(itemKey: string): void {
    const existing = this.cache.get(itemKey);
    if (!existing) return;
    existing.venueOverrideJson = {};
    this.upsert(existing);
  }

  setArtifactOverride(
    itemKey: string,
    override: ArtifactOverride,
  ): UserOverrides | null {
    const existing = this.cache.get(itemKey) || emptyOverrides(itemKey);
    existing.artifactOverrideJson = {
      ...existing.artifactOverrideJson,
      ...override,
    };
    return this.upsert(existing);
  }

  clearArtifactOverride(itemKey: string): void {
    const existing = this.cache.get(itemKey);
    if (!existing) return;
    existing.artifactOverrideJson = {};
    this.upsert(existing);
  }

  setTagOverride(itemKey: string, override: TagOverride): UserOverrides | null {
    const existing = this.cache.get(itemKey) || emptyOverrides(itemKey);
    existing.tagOverrideJson = { ...existing.tagOverrideJson, ...override };
    return this.upsert(existing);
  }

  clearTagOverride(itemKey: string): void {
    const existing = this.cache.get(itemKey);
    if (!existing) return;
    existing.tagOverrideJson = {};
    this.upsert(existing);
  }

  clearAll(itemKey: string): void {
    if (this.cache.delete(itemKey)) {
      this.saveToStorage();
    }
  }

  delete(itemKey: string): void {
    this.clearAll(itemKey);
  }

  clear(): void {
    this.cache.clear();
    this.saveToStorage();
  }

  get size(): number {
    return this.cache.size;
  }

  private hasAnyOverride(record: UserOverrides): boolean {
    return (
      hasOwnKeys(record.venueOverrideJson) ||
      hasOwnKeys(record.artifactOverrideJson) ||
      hasOwnKeys(record.tagOverrideJson)
    );
  }

  private saveToStorage(): void {
    saveStoredMap(STORAGE_KEY, this.cache);
  }
}
