import type { PaperTags } from "../storage/types";

export const STRUCTURED_TAG_FIELDS = [
  "taskJson",
  "methodJson",
  "datasetJson",
  "metricJson",
] as const;

export type StructuredTagField = (typeof STRUCTURED_TAG_FIELDS)[number];

export type StructuredTagPatch = Partial<
  Record<StructuredTagField, readonly string[]>
>;

export type StructuredTagRecord = PaperTags;
