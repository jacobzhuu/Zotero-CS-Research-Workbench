import { config } from "../../package.json";
import type {
  ArtifactLinks,
  ArtifactOverride,
  PaperTags,
  TagOverride,
  UserOverrides,
  VenueMaster,
  VenueOverride,
} from "../../src/modules/storage/types";

const prefStore = new Map<string, string>();
const originalDateNow = Date.now;

function createPrefsMock() {
  return {
    get(key: string) {
      return prefStore.get(key);
    },
    set(key: string, value: string) {
      prefStore.set(key, value);
      return value;
    },
    clear(key: string) {
      prefStore.delete(key);
    },
  };
}

export function installZoteroPrefsMock(): void {
  globalThis.Zotero = {
    ...(globalThis.Zotero ?? {}),
    Prefs: createPrefsMock(),
  } as typeof Zotero;
}

export function resetPrefsMock(initial: Record<string, string> = {}): void {
  prefStore.clear();
  for (const [key, value] of Object.entries(initial)) {
    prefStore.set(key, value);
  }
  installZoteroPrefsMock();
}

export function getStoredPref(key: string): string | undefined {
  return prefStore.get(key);
}

export function setStoredPref(key: string, value: string): void {
  prefStore.set(key, value);
}

export function storageKey(
  name: "venues" | "artifacts" | "tags" | "overrides" | string,
): string {
  return `${config.prefsPrefix}.${name}`;
}

export function freezeNow(now = 1_700_000_000_000): void {
  Date.now = () => now;
}

export function restoreNow(): void {
  Date.now = originalDateNow;
}

export function resetTestEnv(now = 1_700_000_000_000): void {
  resetPrefsMock();
  freezeNow(now);
}

export function createVenueOverride(
  overrides: Partial<VenueOverride> = {},
): VenueOverride {
  return {
    ...overrides,
  };
}

export function createArtifactOverride(
  overrides: Partial<ArtifactOverride> = {},
): ArtifactOverride {
  return {
    ...overrides,
  };
}

export function createTagOverride(
  overrides: Partial<TagOverride> = {},
): TagOverride {
  return {
    ...overrides,
  };
}

export function createVenueMaster(
  overrides: Partial<VenueMaster> = {},
): VenueMaster {
  return {
    venueId: "venue-1",
    canonicalName: "Conference on Test Cases",
    shortName: "CTC",
    type: "conference",
    ccfRank: "A",
    coreRank: "A",
    aliasesJson: ["Conference on Test Cases", "CTC"],
    updatedAt: 1,
    ...overrides,
  };
}

export function createArtifactLinks(
  overrides: Partial<ArtifactLinks> = {},
): ArtifactLinks {
  return {
    itemKey: "item-1",
    doiUrl: "https://doi.org/10.1000/test",
    arxivUrl: "https://arxiv.org/abs/1234.5678",
    openreviewUrl: "https://openreview.net/forum?id=test",
    codeUrl: "https://github.com/example/project",
    projectUrl: "https://example.com/project",
    source: "auto",
    updatedAt: 1,
    ...overrides,
  };
}

export function createPaperTags(overrides: Partial<PaperTags> = {}): PaperTags {
  return {
    itemKey: "item-1",
    taskJson: ["classification"],
    methodJson: ["transformer"],
    datasetJson: ["imagenet"],
    metricJson: ["accuracy"],
    updatedAt: 1,
    ...overrides,
  };
}

export function createUserOverrides(
  overrides: Partial<UserOverrides> = {},
): UserOverrides {
  return {
    itemKey: "item-1",
    venueOverrideJson: {},
    artifactOverrideJson: {},
    tagOverrideJson: {},
    updatedAt: 1,
    ...overrides,
  };
}
