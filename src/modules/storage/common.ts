export function cloneStoredValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function cloneStoredMap<T>(
  entries: ReadonlyMap<string, T>,
): Map<string, T> {
  return new Map(
    Array.from(entries.entries(), ([key, value]) => [
      key,
      cloneStoredValue(value),
    ]),
  );
}

export function loadStoredMap<T>(storageKey: string): Map<string, T> {
  try {
    const stored = Zotero.Prefs.get(storageKey, true) as string | undefined;
    if (!stored) {
      return new Map();
    }

    const parsed = JSON.parse(stored) as Record<string, T>;
    return new Map(
      Object.entries(parsed).map(([key, value]) => [
        key,
        cloneStoredValue(value),
      ]),
    );
  } catch {
    return new Map();
  }
}

export function saveStoredMap<T>(
  storageKey: string,
  entries: ReadonlyMap<string, T>,
): void {
  try {
    const serialized: Record<string, T> = {};
    for (const [key, value] of entries.entries()) {
      serialized[key] = cloneStoredValue(value);
    }

    Zotero.Prefs.set(storageKey, JSON.stringify(serialized), true);
  } catch {
    // Storage write failures should not crash the plugin.
  }
}

export function normalizeText(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function normalizeStringArray(
  values: readonly string[] | undefined,
): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of values ?? []) {
    const trimmed = value.trim();
    const dedupeKey = trimmed.toLowerCase();
    if (!trimmed || seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    normalized.push(trimmed);
  }

  return normalized;
}

export function hasOwnKeys(value: object): boolean {
  return Object.keys(value).length > 0;
}
