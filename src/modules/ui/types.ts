import type { ArtifactHubService } from "../artifact";
import type { ReadingNoteTemplateService } from "../notes";
import type { RelatedWorkExportService } from "../relatedWork";
import type { StructuredTagService } from "../tags";
import type { StructuredTagRecord } from "../tags/types";
import type { VenueLiteService } from "../venue";
import type { ArtifactResolutionResult } from "../artifact/types";
import type { VenueResolutionResult } from "../venue/types";

export interface WorkbenchUIItem {
  id?: number;
  key?: string;
  libraryID?: number;
  getField(
    field: string,
    unformatted?: boolean,
    includeBaseMapped?: boolean,
  ): string;
  getCreatorsJSON?(): Array<{
    firstName?: string;
    lastName?: string;
    name?: string;
  }>;
  isRegularItem?(): boolean;
  isAttachment?(): boolean;
  isNote?(): boolean;
}

export interface Phase7UIServices {
  venueService: VenueLiteService;
  artifactService: ArtifactHubService;
  tagService: StructuredTagService;
  readingNoteService: ReadingNoteTemplateService;
  relatedWorkService: RelatedWorkExportService;
}

export const PHASE7_COLUMN_KEYS = [
  "venueShort",
  "ccfRank",
  "coreRank",
  "hasCode",
  "hasOpenReview",
] as const;

export type Phase7ColumnKey = (typeof PHASE7_COLUMN_KEYS)[number];

export interface Phase7ColumnSnapshot {
  venueShort: string;
  ccfRank: string;
  coreRank: string;
  hasCode: string;
  hasOpenReview: string;
}

export interface Phase7ResolvedItemState {
  venue: VenueResolutionResult;
  artifacts: ArtifactResolutionResult;
  tags: StructuredTagRecord;
}

export interface Phase7DetailField {
  label: string;
  value: string;
}

export interface Phase7DetailPaneData {
  venue: {
    fullName: string;
    shortName: string;
    type: string;
    ccfRank: string;
    coreRank: string;
    summary: string;
    fields: Phase7DetailField[];
  };
  artifacts: {
    doi: string;
    arxiv: string;
    openreview: string;
    code: string;
    project: string;
    summary: string;
    fields: Phase7DetailField[];
  };
  workflow: {
    task: string;
    method: string;
    dataset: string;
    metric: string;
    summary: string;
    fields: Phase7DetailField[];
  };
}

export type RelatedWorkExportFormat = "markdown" | "csv";
