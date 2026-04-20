import { normalizeText } from "../storage/common";
import { mergeArtifacts } from "../storage/mergeService";
import type { WorkbenchStorage } from "../storage/workbenchStorage";
import type {
  ArtifactLinks,
  ArtifactOverride,
  ResolvedArtifacts,
} from "../storage/types";
import { extractArtifactInfo } from "./normalization";
import type {
  ArtifactFieldName,
  ArtifactResolutionResult,
  ArtifactResolutionSnapshot,
  ArtifactResolvedSource,
  ArtifactResolvableItem,
  ExtractedArtifactInfo,
} from "./types";

function hasAutomaticArtifactData(artifact: ArtifactLinks | null): boolean {
  if (!artifact) {
    return false;
  }

  return Boolean(
    artifact.doiUrl ||
    artifact.arxivUrl ||
    artifact.openreviewUrl ||
    artifact.codeUrl ||
    artifact.projectUrl,
  );
}

function buildAutomaticArtifacts(
  itemKey: string,
  extracted: ExtractedArtifactInfo,
): ArtifactLinks | null {
  const automatic: ArtifactLinks = {
    itemKey,
    doiUrl: extracted.doiUrl?.normalizedUrl ?? "",
    arxivUrl: extracted.arxivUrl?.normalizedUrl ?? "",
    openreviewUrl: extracted.openreviewUrl?.normalizedUrl ?? "",
    codeUrl: extracted.codeUrl?.normalizedUrl ?? "",
    projectUrl: extracted.projectUrl?.normalizedUrl ?? "",
    source: "auto",
    updatedAt: 0,
  };

  return hasAutomaticArtifactData(automatic) ? automatic : null;
}

function resolveFieldSource(
  key: ArtifactFieldName,
  extracted: ExtractedArtifactInfo,
  override: ArtifactOverride | null,
  resolved: ResolvedArtifacts,
): ArtifactResolvedSource {
  if (override && override[key] !== undefined) {
    return "override";
  }
  if (!resolved[key]) {
    return "none";
  }
  return extracted[key]?.sourceField ?? "none";
}

function toResolutionResult(
  itemKey: string,
  extracted: ExtractedArtifactInfo,
  resolved: ResolvedArtifacts,
  override: ArtifactOverride | null,
): ArtifactResolutionResult {
  return {
    ...resolved,
    itemKey,
    fieldSources: {
      doiUrl: resolveFieldSource("doiUrl", extracted, override, resolved),
      arxivUrl: resolveFieldSource("arxivUrl", extracted, override, resolved),
      openreviewUrl: resolveFieldSource(
        "openreviewUrl",
        extracted,
        override,
        resolved,
      ),
      codeUrl: resolveFieldSource("codeUrl", extracted, override, resolved),
      projectUrl: resolveFieldSource(
        "projectUrl",
        extracted,
        override,
        resolved,
      ),
    },
  };
}

export class ArtifactHubService {
  constructor(private readonly storage: WorkbenchStorage) {}

  extractArtifactInfo(item: ArtifactResolvableItem): ExtractedArtifactInfo {
    return extractArtifactInfo(item);
  }

  resolveAutomaticArtifacts(
    item: ArtifactResolvableItem,
    itemKey = normalizeText(item.key),
  ): {
    extracted: ExtractedArtifactInfo;
    automatic: ArtifactLinks | null;
  } {
    const extracted = this.extractArtifactInfo(item);

    return {
      extracted,
      automatic: buildAutomaticArtifacts(itemKey, extracted),
    };
  }

  resolveArtifacts(
    item: ArtifactResolvableItem,
    itemKey = normalizeText(item.key),
  ): ArtifactResolutionResult {
    const automaticResolution = this.resolveAutomaticArtifacts(item, itemKey);
    const overrideRecord = itemKey ? this.storage.overrides.get(itemKey) : null;
    const resolved = mergeArtifacts(
      automaticResolution.automatic,
      overrideRecord,
    );
    const override = itemKey
      ? this.storage.overrides.getArtifactOverride(itemKey)
      : null;

    return toResolutionResult(
      itemKey,
      automaticResolution.extracted,
      resolved,
      override,
    );
  }

  refreshArtifacts(
    item: ArtifactResolvableItem,
    itemKey = normalizeText(item.key),
  ): ArtifactResolutionResult {
    const automaticResolution = this.resolveAutomaticArtifacts(item, itemKey);
    if (itemKey) {
      if (automaticResolution.automatic) {
        this.storage.artifacts.set(itemKey, automaticResolution.automatic);
      } else {
        this.storage.artifacts.delete(itemKey);
      }
    }

    const resolved = itemKey
      ? this.storage.getResolvedArtifacts(itemKey)
      : mergeArtifacts(automaticResolution.automatic, null);
    const override = itemKey
      ? this.storage.overrides.getArtifactOverride(itemKey)
      : null;

    return toResolutionResult(
      itemKey,
      automaticResolution.extracted,
      resolved,
      override,
    );
  }

  resolveArtifactSnapshot(
    item: ArtifactResolvableItem,
    itemKey = normalizeText(item.key),
  ): ArtifactResolutionSnapshot {
    const automaticResolution = this.resolveAutomaticArtifacts(item, itemKey);
    const override = itemKey
      ? this.storage.overrides.getArtifactOverride(itemKey)
      : null;
    const resolved = mergeArtifacts(
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
        override,
      ),
      extracted: automaticResolution.extracted,
    };
  }

  getAutomaticArtifacts(itemKey: string): ArtifactLinks | null {
    return this.storage.artifacts.get(itemKey);
  }

  getArtifactOverride(itemKey: string): ArtifactOverride | null {
    return this.storage.overrides.getArtifactOverride(itemKey);
  }

  setArtifactOverride(
    itemKey: string,
    override: ArtifactOverride,
  ): ArtifactOverride | null {
    this.storage.overrides.setArtifactOverride(itemKey, override);
    return this.getArtifactOverride(itemKey);
  }

  clearArtifactOverride(itemKey: string): void {
    this.storage.overrides.clearArtifactOverride(itemKey);
  }
}

export function createArtifactHubService(
  storage: WorkbenchStorage,
): ArtifactHubService {
  return new ArtifactHubService(storage);
}
