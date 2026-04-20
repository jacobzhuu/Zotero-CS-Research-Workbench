import type {
  ResolvedArtifacts,
  ResolvedTags,
  ResolvedVenue,
  VenueMaster,
  WorkbenchResolvedSnapshot,
} from "./types";
import { mergeArtifacts, mergeTags, mergeVenue } from "./mergeService";
import { ArtifactStore } from "./artifactStore";
import { OverrideStore } from "./overrideStore";
import { TagStore } from "./tagStore";
import { VenueStore } from "./venueStore";

export class WorkbenchStorage {
  readonly venues: VenueStore;
  readonly artifacts: ArtifactStore;
  readonly tags: TagStore;
  readonly overrides: OverrideStore;

  constructor() {
    this.venues = new VenueStore();
    this.artifacts = new ArtifactStore();
    this.tags = new TagStore();
    this.overrides = new OverrideStore();
  }

  getResolvedVenue(
    itemKey: string,
    automaticVenue: VenueMaster | null = null,
  ): ResolvedVenue {
    return mergeVenue(automaticVenue, this.overrides.get(itemKey));
  }

  getResolvedArtifacts(itemKey: string): ResolvedArtifacts {
    return mergeArtifacts(
      this.artifacts.get(itemKey),
      this.overrides.get(itemKey),
    );
  }

  getResolvedTags(itemKey: string): ResolvedTags {
    return mergeTags(this.tags.get(itemKey), this.overrides.get(itemKey));
  }

  getResolvedSnapshot(
    itemKey: string,
    automaticVenue: VenueMaster | null = null,
  ): WorkbenchResolvedSnapshot {
    const overrides = this.overrides.get(itemKey);

    return {
      venue: mergeVenue(automaticVenue, overrides),
      artifacts: mergeArtifacts(this.artifacts.get(itemKey), overrides),
      tags: mergeTags(this.tags.get(itemKey), overrides),
      overrides,
    };
  }
}

export function createWorkbenchStorage(): WorkbenchStorage {
  return new WorkbenchStorage();
}
