/**
 * Phase 1 — Data Model Type Definitions
 *
 * `ToDoList.md` defines four logical entities:
 * - `venue_master`
 * - `artifact_links`
 * - `paper_tags`
 * - `user_overrides`
 *
 * This repository uses camelCase interfaces for those entities while preserving
 * the same field intent. Automatic results and user overrides remain separate,
 * and consumers read through merge helpers with the priority:
 *
 * `user override > automatic resolved value > empty`
 */

export type VenueType = "conference" | "journal" | "unknown";
export type CCFRank = "" | "A" | "B" | "C";
export type CORERank = "" | "A*" | "A" | "B" | "C";
export type ArtifactSource = "auto" | "manual";

export interface VenueMaster {
  venueId: string;
  canonicalName: string;
  shortName: string;
  type: VenueType;
  ccfRank: CCFRank;
  coreRank: CORERank;
  aliasesJson: string[];
  updatedAt: number;
}

export interface ArtifactLinks {
  itemKey: string;
  doiUrl: string;
  arxivUrl: string;
  openreviewUrl: string;
  codeUrl: string;
  projectUrl: string;
  source: ArtifactSource;
  updatedAt: number;
}

export interface PaperTags {
  itemKey: string;
  taskJson: string[];
  methodJson: string[];
  datasetJson: string[];
  metricJson: string[];
  updatedAt: number;
}

export interface VenueOverride {
  venueId?: string;
  canonicalName?: string;
  shortName?: string;
  type?: VenueType;
  ccfRank?: CCFRank;
  coreRank?: CORERank;
}

export interface ArtifactOverride {
  doiUrl?: string;
  arxivUrl?: string;
  openreviewUrl?: string;
  codeUrl?: string;
  projectUrl?: string;
}

export interface TagOverride {
  taskJson?: string[];
  methodJson?: string[];
  datasetJson?: string[];
  metricJson?: string[];
}

export interface UserOverrides {
  itemKey: string;
  venueOverrideJson: VenueOverride;
  artifactOverrideJson: ArtifactOverride;
  tagOverrideJson: TagOverride;
  updatedAt: number;
}

export interface ResolvedVenue {
  venueId: string;
  canonicalName: string;
  shortName: string;
  type: VenueType;
  ccfRank: CCFRank;
  coreRank: CORERank;
}

export interface ResolvedArtifacts {
  doiUrl: string;
  arxivUrl: string;
  openreviewUrl: string;
  codeUrl: string;
  projectUrl: string;
}

export interface ResolvedTags {
  taskJson: string[];
  methodJson: string[];
  datasetJson: string[];
  metricJson: string[];
}

export interface WorkbenchResolvedSnapshot {
  venue: ResolvedVenue;
  artifacts: ResolvedArtifacts;
  tags: ResolvedTags;
  overrides: UserOverrides | null;
}
