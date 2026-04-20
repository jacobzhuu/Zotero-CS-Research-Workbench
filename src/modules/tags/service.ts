import { normalizeStringArray, normalizeText } from "../storage/common";
import type { WorkbenchStorage } from "../storage/workbenchStorage";
import type { PaperTags } from "../storage/types";
import type {
  StructuredTagField,
  StructuredTagPatch,
  StructuredTagRecord,
} from "./types";
import { STRUCTURED_TAG_FIELDS } from "./types";

type NormalizedTagPatch = Partial<Record<StructuredTagField, string[]>>;

function emptyTags(itemKey: string): StructuredTagRecord {
  return {
    itemKey,
    taskJson: [],
    methodJson: [],
    datasetJson: [],
    metricJson: [],
    updatedAt: 0,
  };
}

function clonePatch(patch: StructuredTagPatch): StructuredTagPatch {
  const cloned: StructuredTagPatch = {};

  for (const field of STRUCTURED_TAG_FIELDS) {
    if (patch[field] !== undefined) {
      cloned[field] = [...patch[field]];
    }
  }

  return cloned;
}

function normalizePatch(patch: StructuredTagPatch): NormalizedTagPatch {
  const normalized: NormalizedTagPatch = {};

  for (const field of STRUCTURED_TAG_FIELDS) {
    if (patch[field] !== undefined) {
      normalized[field] = normalizeStringArray(patch[field]);
    }
  }

  return normalized;
}

function cloneRecord(
  record: PaperTags | null,
  itemKey = "",
): StructuredTagRecord {
  if (!record) {
    return emptyTags(itemKey);
  }

  return {
    itemKey: record.itemKey,
    taskJson: [...record.taskJson],
    methodJson: [...record.methodJson],
    datasetJson: [...record.datasetJson],
    metricJson: [...record.metricJson],
    updatedAt: record.updatedAt,
  };
}

function hasAnyTagValues(record: StructuredTagRecord): boolean {
  return STRUCTURED_TAG_FIELDS.some((field) => record[field].length > 0);
}

function uniqueItemKeys(itemKeys: readonly string[]): string[] {
  const seen = new Set<string>();
  const normalizedKeys: string[] = [];

  for (const itemKey of itemKeys) {
    const normalized = normalizeText(itemKey);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    normalizedKeys.push(normalized);
  }

  return normalizedKeys;
}

function appendValues(
  existing: readonly string[],
  values: readonly string[],
): string[] {
  return normalizeStringArray([...existing, ...values]);
}

function removeValues(
  existing: readonly string[],
  values: readonly string[],
): string[] {
  const removeSet = new Set(
    normalizeStringArray(values).map((value) => value.toLowerCase()),
  );

  return existing.filter((value) => !removeSet.has(value.toLowerCase()));
}

export class StructuredTagService {
  constructor(private readonly storage: WorkbenchStorage) {}

  getTags(itemKey: string): StructuredTagRecord {
    const normalizedItemKey = normalizeText(itemKey);
    return cloneRecord(
      this.storage.tags.get(normalizedItemKey),
      normalizedItemKey,
    );
  }

  setTags(itemKey: string, tags: StructuredTagPatch): StructuredTagRecord {
    const normalizedItemKey = normalizeText(itemKey);
    const normalizedPatch = normalizePatch(clonePatch(tags));

    const saved = this.storage.tags.set(normalizedItemKey, {
      itemKey: normalizedItemKey,
      taskJson: normalizedPatch.taskJson ?? [],
      methodJson: normalizedPatch.methodJson ?? [],
      datasetJson: normalizedPatch.datasetJson ?? [],
      metricJson: normalizedPatch.metricJson ?? [],
      updatedAt: 0,
    });

    if (!hasAnyTagValues(cloneRecord(saved))) {
      this.storage.tags.delete(normalizedItemKey);
      return emptyTags(normalizedItemKey);
    }

    return cloneRecord(saved);
  }

  patchTags(itemKey: string, patch: StructuredTagPatch): StructuredTagRecord {
    const normalizedItemKey = normalizeText(itemKey);
    const normalizedPatch = normalizePatch(clonePatch(patch));
    const saved = this.storage.tags.patch(normalizedItemKey, normalizedPatch);

    if (!hasAnyTagValues(cloneRecord(saved))) {
      this.storage.tags.delete(normalizedItemKey);
      return emptyTags(normalizedItemKey);
    }

    return cloneRecord(saved);
  }

  appendTags(itemKey: string, patch: StructuredTagPatch): StructuredTagRecord {
    const normalizedItemKey = normalizeText(itemKey);
    const normalizedPatch = normalizePatch(clonePatch(patch));
    const current = this.getTags(normalizedItemKey);
    const next: StructuredTagRecord = cloneRecord(current, normalizedItemKey);

    for (const field of STRUCTURED_TAG_FIELDS) {
      if (normalizedPatch[field] === undefined) {
        continue;
      }

      next[field] = appendValues(next[field], normalizedPatch[field]);
    }

    if (!hasAnyTagValues(next)) {
      this.storage.tags.delete(normalizedItemKey);
      return emptyTags(normalizedItemKey);
    }

    return cloneRecord(this.storage.tags.upsert(next));
  }

  removeTags(itemKey: string, patch: StructuredTagPatch): StructuredTagRecord {
    const normalizedItemKey = normalizeText(itemKey);
    const normalizedPatch = normalizePatch(clonePatch(patch));
    const current = this.getTags(normalizedItemKey);
    const next: StructuredTagRecord = cloneRecord(current, normalizedItemKey);

    for (const field of STRUCTURED_TAG_FIELDS) {
      if (normalizedPatch[field] === undefined) {
        continue;
      }

      next[field] = removeValues(next[field], normalizedPatch[field]);
    }

    if (!hasAnyTagValues(next)) {
      this.storage.tags.delete(normalizedItemKey);
      return emptyTags(normalizedItemKey);
    }

    return cloneRecord(this.storage.tags.upsert(next));
  }

  clearTags(
    itemKey: string,
    fields: readonly StructuredTagField[] = STRUCTURED_TAG_FIELDS,
  ): StructuredTagRecord {
    const normalizedItemKey = normalizeText(itemKey);
    const current = this.getTags(normalizedItemKey);
    const next: StructuredTagRecord = cloneRecord(current, normalizedItemKey);

    for (const field of fields) {
      next[field] = [];
    }

    if (!hasAnyTagValues(next)) {
      this.storage.tags.delete(normalizedItemKey);
      return emptyTags(normalizedItemKey);
    }

    return cloneRecord(this.storage.tags.upsert(next));
  }

  batchAppendTags(
    itemKeys: readonly string[],
    patch: StructuredTagPatch,
  ): StructuredTagRecord[] {
    const normalizedPatch = normalizePatch(clonePatch(patch));
    return uniqueItemKeys(itemKeys).map((itemKey) =>
      this.appendTags(itemKey, normalizedPatch),
    );
  }

  batchRemoveTags(
    itemKeys: readonly string[],
    patch: StructuredTagPatch,
  ): StructuredTagRecord[] {
    const normalizedPatch = normalizePatch(clonePatch(patch));
    return uniqueItemKeys(itemKeys).map((itemKey) =>
      this.removeTags(itemKey, normalizedPatch),
    );
  }

  batchReplaceTags(
    itemKeys: readonly string[],
    patch: StructuredTagPatch,
  ): StructuredTagRecord[] {
    const normalizedPatch = normalizePatch(clonePatch(patch));
    return uniqueItemKeys(itemKeys).map((itemKey) =>
      this.patchTags(itemKey, normalizedPatch),
    );
  }
}

export function createStructuredTagService(
  storage: WorkbenchStorage,
): StructuredTagService {
  return new StructuredTagService(storage);
}
