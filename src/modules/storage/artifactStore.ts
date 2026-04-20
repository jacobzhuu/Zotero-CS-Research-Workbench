import { config } from "../../../package.json";
import {
  cloneStoredMap,
  cloneStoredValue,
  loadStoredMap,
  normalizeText,
  saveStoredMap,
} from "./common";
import type { ArtifactLinks } from "./types";

const STORAGE_KEY = `${config.prefsPrefix}.artifacts`;

function createEmptyArtifactLinks(itemKey: string): ArtifactLinks {
  return {
    itemKey,
    doiUrl: "",
    arxivUrl: "",
    openreviewUrl: "",
    codeUrl: "",
    projectUrl: "",
    source: "auto",
    updatedAt: Date.now(),
  };
}

function normalizeArtifactLinks(artifact: ArtifactLinks): ArtifactLinks {
  return {
    itemKey: normalizeText(artifact.itemKey),
    doiUrl: normalizeText(artifact.doiUrl),
    arxivUrl: normalizeText(artifact.arxivUrl),
    openreviewUrl: normalizeText(artifact.openreviewUrl),
    codeUrl: normalizeText(artifact.codeUrl),
    projectUrl: normalizeText(artifact.projectUrl),
    source: artifact.source,
    updatedAt: Date.now(),
  };
}

export class ArtifactStore {
  private cache: Map<string, ArtifactLinks>;

  constructor() {
    this.cache = loadStoredMap<ArtifactLinks>(STORAGE_KEY);
  }

  get(itemKey: string): ArtifactLinks | null {
    const record = this.cache.get(itemKey);
    return record ? cloneStoredValue(record) : null;
  }

  list(): ArtifactLinks[] {
    return Array.from(this.cache.values(), (artifact) =>
      cloneStoredValue(artifact),
    );
  }

  getAll(): Map<string, ArtifactLinks> {
    return cloneStoredMap(this.cache);
  }

  upsert(artifact: ArtifactLinks): ArtifactLinks {
    const normalized = normalizeArtifactLinks(artifact);
    this.cache.set(normalized.itemKey, normalized);
    this.saveToStorage();
    return cloneStoredValue(normalized);
  }

  set(itemKey: string, data: ArtifactLinks): ArtifactLinks {
    return this.upsert({ ...data, itemKey });
  }

  patch(itemKey: string, partial: Partial<ArtifactLinks>): ArtifactLinks {
    const existing =
      this.cache.get(itemKey) ?? createEmptyArtifactLinks(itemKey);
    const updated: ArtifactLinks = {
      ...existing,
      ...partial,
      itemKey,
    };

    return this.upsert(updated);
  }

  delete(itemKey: string): void {
    if (this.cache.delete(itemKey)) {
      this.saveToStorage();
    }
  }

  clear(): void {
    this.cache.clear();
    this.saveToStorage();
  }

  get size(): number {
    return this.cache.size;
  }

  private saveToStorage(): void {
    saveStoredMap(STORAGE_KEY, this.cache);
  }
}
