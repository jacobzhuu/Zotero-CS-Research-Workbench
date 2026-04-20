import type {
  ArtifactLinks,
  ArtifactOverride,
  ResolvedArtifacts,
} from "../storage/types";

export type ArtifactFieldName = keyof ResolvedArtifacts;

export type ArtifactFieldSource =
  | "DOI"
  | "url"
  | "archive"
  | "archiveID"
  | "archiveLocation"
  | "extra"
  | "";

export type ArtifactResolvedSource = ArtifactFieldSource | "override" | "none";

export interface ArtifactResolvableItem {
  key?: string;
  getField(
    field: string,
    unformatted?: boolean,
    includeBaseMapped?: boolean,
  ): string;
  getExtraField?(fieldName: string): string;
}

export interface ExtractedArtifactField {
  key: ArtifactFieldName;
  rawValue: string;
  normalizedUrl: string;
  sourceField: ArtifactFieldSource;
}

export interface ExtractedArtifactInfo {
  doiUrl: ExtractedArtifactField | null;
  arxivUrl: ExtractedArtifactField | null;
  openreviewUrl: ExtractedArtifactField | null;
  codeUrl: ExtractedArtifactField | null;
  projectUrl: ExtractedArtifactField | null;
}

export interface ArtifactResolvedSources {
  doiUrl: ArtifactResolvedSource;
  arxivUrl: ArtifactResolvedSource;
  openreviewUrl: ArtifactResolvedSource;
  codeUrl: ArtifactResolvedSource;
  projectUrl: ArtifactResolvedSource;
}

export interface ArtifactResolutionResult extends ResolvedArtifacts {
  itemKey: string;
  fieldSources: ArtifactResolvedSources;
}

export interface ArtifactResolutionSnapshot {
  automatic: ArtifactLinks | null;
  override: ArtifactOverride | null;
  resolved: ArtifactResolutionResult;
  extracted: ExtractedArtifactInfo;
}
