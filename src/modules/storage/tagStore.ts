import { config } from "../../../package.json";
import {
  cloneStoredMap,
  cloneStoredValue,
  loadStoredMap,
  normalizeStringArray,
  normalizeText,
  saveStoredMap,
} from "./common";
import type { PaperTags } from "./types";

const STORAGE_KEY = `${config.prefsPrefix}.tags`;

type TagField = keyof Omit<PaperTags, "itemKey" | "updatedAt">;

function emptyTags(itemKey: string): PaperTags {
  return {
    itemKey,
    taskJson: [],
    methodJson: [],
    datasetJson: [],
    metricJson: [],
    updatedAt: Date.now(),
  };
}

function normalizeTags(data: PaperTags): PaperTags {
  return {
    itemKey: normalizeText(data.itemKey),
    taskJson: normalizeStringArray(data.taskJson),
    methodJson: normalizeStringArray(data.methodJson),
    datasetJson: normalizeStringArray(data.datasetJson),
    metricJson: normalizeStringArray(data.metricJson),
    updatedAt: Date.now(),
  };
}

export class TagStore {
  private cache: Map<string, PaperTags>;

  constructor() {
    this.cache = loadStoredMap<PaperTags>(STORAGE_KEY);
  }

  get(itemKey: string): PaperTags | null {
    const record = this.cache.get(itemKey);
    return record ? cloneStoredValue(record) : null;
  }

  list(): PaperTags[] {
    return Array.from(this.cache.values(), (tags) => cloneStoredValue(tags));
  }

  getAll(): Map<string, PaperTags> {
    return cloneStoredMap(this.cache);
  }

  upsert(tags: PaperTags): PaperTags {
    const normalized = normalizeTags(tags);
    this.cache.set(normalized.itemKey, normalized);
    this.saveToStorage();
    return cloneStoredValue(normalized);
  }

  set(itemKey: string, data: PaperTags): PaperTags {
    return this.upsert({ ...data, itemKey });
  }

  patch(itemKey: string, partial: Partial<PaperTags>): PaperTags {
    const existing = this.cache.get(itemKey) ?? emptyTags(itemKey);
    return this.upsert({
      ...existing,
      ...partial,
      itemKey,
    });
  }

  batchAppendTags(itemKeys: string[], field: TagField, values: string[]): void {
    for (const key of itemKeys) {
      const existing = this.cache.get(key) ?? emptyTags(key);
      this.cache.set(
        key,
        normalizeTags({
          ...existing,
          [field]: [...existing[field], ...values],
        }),
      );
    }
    this.saveToStorage();
  }

  appendTags(itemKey: string, field: TagField, values: string[]): PaperTags {
    const existing = this.cache.get(itemKey) ?? emptyTags(itemKey);
    return this.upsert({
      ...existing,
      [field]: [...existing[field], ...values],
    });
  }

  removeTags(
    itemKey: string,
    field: TagField,
    values: string[],
  ): PaperTags | null {
    const existing = this.cache.get(itemKey);
    if (!existing) {
      return null;
    }

    const removeSet = new Set(
      normalizeStringArray(values).map((value) => value.toLowerCase()),
    );
    return this.upsert({
      ...existing,
      [field]: existing[field].filter(
        (value) => !removeSet.has(value.toLowerCase()),
      ),
    });
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
