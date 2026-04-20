import type {
  ArtifactLinks,
  PaperTags,
  ResolvedVenue,
  ResolvedArtifacts,
  ResolvedTags,
  UserOverrides,
  VenueMaster,
  VenueOverride,
  ArtifactOverride,
  TagOverride,
} from "./types";

function pickOverride<T>(automatic: T, override: T | undefined): T {
  return override === undefined ? automatic : override;
}

function emptyResolvedVenue(): ResolvedVenue {
  return {
    venueId: "",
    canonicalName: "",
    shortName: "",
    type: "unknown",
    ccfRank: "",
    coreRank: "",
  };
}

function emptyResolvedArtifacts(): ResolvedArtifacts {
  return {
    doiUrl: "",
    arxivUrl: "",
    openreviewUrl: "",
    codeUrl: "",
    projectUrl: "",
  };
}

function emptyResolvedTags(): ResolvedTags {
  return {
    taskJson: [],
    methodJson: [],
    datasetJson: [],
    metricJson: [],
  };
}

function getVenueOverride(
  override: UserOverrides | null,
): VenueOverride | null {
  return override?.venueOverrideJson ?? null;
}

function getArtifactOverride(
  override: UserOverrides | null,
): ArtifactOverride | null {
  return override?.artifactOverrideJson ?? null;
}

function getTagOverride(override: UserOverrides | null): TagOverride | null {
  return override?.tagOverrideJson ?? null;
}

export function mergeVenue(
  auto: VenueMaster | null,
  override: UserOverrides | null,
): ResolvedVenue {
  const base: ResolvedVenue = auto
    ? {
        venueId: auto.venueId,
        canonicalName: auto.canonicalName,
        shortName: auto.shortName,
        type: auto.type,
        ccfRank: auto.ccfRank,
        coreRank: auto.coreRank,
      }
    : emptyResolvedVenue();

  const venueOverride = getVenueOverride(override);
  if (!venueOverride) {
    return base;
  }

  return {
    venueId: pickOverride(base.venueId, venueOverride.venueId),
    canonicalName: pickOverride(
      base.canonicalName,
      venueOverride.canonicalName,
    ),
    shortName: pickOverride(base.shortName, venueOverride.shortName),
    type: pickOverride(base.type, venueOverride.type),
    ccfRank: pickOverride(base.ccfRank, venueOverride.ccfRank),
    coreRank: pickOverride(base.coreRank, venueOverride.coreRank),
  };
}

export function mergeArtifacts(
  auto: ArtifactLinks | null,
  override: UserOverrides | null,
): ResolvedArtifacts {
  const base: ResolvedArtifacts = auto
    ? {
        doiUrl: auto.doiUrl,
        arxivUrl: auto.arxivUrl,
        openreviewUrl: auto.openreviewUrl,
        codeUrl: auto.codeUrl,
        projectUrl: auto.projectUrl,
      }
    : emptyResolvedArtifacts();

  const artifactOverride = getArtifactOverride(override);
  if (!artifactOverride) {
    return base;
  }

  return {
    doiUrl: pickOverride(base.doiUrl, artifactOverride.doiUrl),
    arxivUrl: pickOverride(base.arxivUrl, artifactOverride.arxivUrl),
    openreviewUrl: pickOverride(
      base.openreviewUrl,
      artifactOverride.openreviewUrl,
    ),
    codeUrl: pickOverride(base.codeUrl, artifactOverride.codeUrl),
    projectUrl: pickOverride(base.projectUrl, artifactOverride.projectUrl),
  };
}

export function mergeTags(
  auto: PaperTags | null,
  override: UserOverrides | null,
): ResolvedTags {
  const base: ResolvedTags = auto
    ? {
        taskJson: [...auto.taskJson],
        methodJson: [...auto.methodJson],
        datasetJson: [...auto.datasetJson],
        metricJson: [...auto.metricJson],
      }
    : emptyResolvedTags();

  const tagOverride = getTagOverride(override);
  if (!tagOverride) {
    return base;
  }

  return {
    taskJson: pickOverride(base.taskJson, tagOverride.taskJson),
    methodJson: pickOverride(base.methodJson, tagOverride.methodJson),
    datasetJson: pickOverride(base.datasetJson, tagOverride.datasetJson),
    metricJson: pickOverride(base.metricJson, tagOverride.metricJson),
  };
}
