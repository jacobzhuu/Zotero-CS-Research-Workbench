import { normalizeStringArray, normalizeText } from "../storage/common";
import type { CreatedReadingNote } from "../notes/types";
import type { StructuredTagPatch, StructuredTagRecord } from "../tags/types";
import { STRUCTURED_TAG_FIELDS } from "../tags/types";
import type {
  Phase7UIServices,
  RelatedWorkExportFormat,
  WorkbenchUIItem,
} from "./types";
import {
  buildArtifactLinksClipboardText,
  getRegularWorkbenchItems,
  getItemCacheKey,
  invalidateUIStateCache,
  isRegularWorkbenchItem,
} from "./helpers";

function parsePromptInput(value: string): string[] {
  return normalizeStringArray(
    value
      .split(/\r?\n|;/g)
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

export function serializeStructuredTagValues(
  values: readonly string[],
): string {
  return values.join("; ");
}

export function createStructuredTagPromptDefaults(
  current: StructuredTagRecord,
): Record<(typeof STRUCTURED_TAG_FIELDS)[number], string> {
  return {
    taskJson: serializeStructuredTagValues(current.taskJson),
    methodJson: serializeStructuredTagValues(current.methodJson),
    datasetJson: serializeStructuredTagValues(current.datasetJson),
    metricJson: serializeStructuredTagValues(current.metricJson),
  };
}

export function refreshVenueForItem(
  item: WorkbenchUIItem | null,
  services: Pick<Phase7UIServices, "venueService">,
) {
  if (!isRegularWorkbenchItem(item)) {
    return null;
  }

  const itemKey = getItemCacheKey(item);
  invalidateUIStateCache(itemKey);
  return services.venueService.refreshVenue(item, normalizeText(item.key));
}

export async function generateReadingNoteForItem(
  item: WorkbenchUIItem | null,
  services: Pick<Phase7UIServices, "readingNoteService">,
): Promise<CreatedReadingNote | null> {
  if (!isRegularWorkbenchItem(item)) {
    return null;
  }

  return services.readingNoteService.createZoteroNote(item, {
    format: "markdown",
  });
}

export function buildRelatedWorkExportText(
  items: readonly WorkbenchUIItem[],
  format: RelatedWorkExportFormat,
  services: Pick<Phase7UIServices, "relatedWorkService">,
): string {
  const regularItems = getRegularWorkbenchItems(items);
  if (regularItems.length === 0) {
    return "";
  }

  const rows = services.relatedWorkService.collectRows(regularItems);
  return format === "csv"
    ? services.relatedWorkService.toCSV(rows)
    : services.relatedWorkService.toMarkdown(rows);
}

export function buildCopyArtifactLinksText(
  item: WorkbenchUIItem | null,
  services: Pick<
    Phase7UIServices,
    "venueService" | "artifactService" | "tagService"
  >,
): string {
  if (!isRegularWorkbenchItem(item)) {
    return "";
  }

  return buildArtifactLinksClipboardText(item, services);
}

export function editStructuredTagsWithPrompts(
  item: WorkbenchUIItem | null,
  prompt: (label: string, defaultValue: string) => string | null,
  services: Pick<Phase7UIServices, "tagService">,
): StructuredTagRecord | null {
  if (!isRegularWorkbenchItem(item)) {
    return null;
  }

  const itemKey = normalizeText(item.key);
  if (!itemKey) {
    return null;
  }

  const current = services.tagService.getTags(itemKey);
  const defaults = createStructuredTagPromptDefaults(current);
  const next: StructuredTagPatch = {};
  const labels: Record<(typeof STRUCTURED_TAG_FIELDS)[number], string> = {
    taskJson: "Task tags",
    methodJson: "Method tags",
    datasetJson: "Dataset tags",
    metricJson: "Metric tags",
  };

  for (const field of STRUCTURED_TAG_FIELDS) {
    const response = prompt(labels[field], defaults[field]);
    if (response === null) {
      return null;
    }

    next[field] = parsePromptInput(response);
  }

  const updated = services.tagService.setTags(itemKey, next);
  invalidateUIStateCache(itemKey);
  return updated;
}
