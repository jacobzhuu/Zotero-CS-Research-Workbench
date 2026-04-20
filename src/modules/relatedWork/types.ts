export const RELATED_WORK_EXPORT_FIELDS = [
  "Title",
  "Year",
  "Venue Short",
  "CCF Rank",
  "CORE Rank",
  "Task",
  "Method",
  "Dataset",
  "Metric",
  "Code",
  "Notes",
] as const;

export type RelatedWorkExportField =
  (typeof RELATED_WORK_EXPORT_FIELDS)[number];

export interface RelatedWorkResolvableItem {
  id?: number;
  key?: string;
  libraryID?: number;
  getField(
    field: string,
    unformatted?: boolean,
    includeBaseMapped?: boolean,
  ): string;
}

export interface RelatedWorkExportRow {
  Title: string;
  Year: string;
  "Venue Short": string;
  "CCF Rank": string;
  "CORE Rank": string;
  Task: string;
  Method: string;
  Dataset: string;
  Metric: string;
  Code: string;
  Notes: string;
}
