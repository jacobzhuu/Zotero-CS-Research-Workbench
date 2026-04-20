import { normalizeText } from "../storage/common";
import type { StructuredTagRecord } from "../tags/types";
import type {
  Phase7ColumnKey,
  Phase7ColumnSnapshot,
  Phase7DetailField,
  Phase7DetailPaneData,
  Phase7ResolvedItemState,
  Phase7UIServices,
  WorkbenchUIItem,
} from "./types";

const STATE_SIGNATURE_FIELDS = [
  "DOI",
  "archive",
  "archiveID",
  "archiveLocation",
  "bookTitle",
  "conferenceName",
  "extra",
  "journalAbbreviation",
  "proceedingsTitle",
  "publicationTitle",
  "seriesTitle",
  "url",
] as const;

const resolvedStateCache = new Map<
  string,
  { signature: string; state: Phase7ResolvedItemState }
>();

function joinTagValues(values: readonly string[]): string {
  return values.join("; ");
}

function readField(item: WorkbenchUIItem, field: string): string {
  try {
    return normalizeText(item.getField(field));
  } catch {
    return "";
  }
}

export function getItemCacheKey(item: WorkbenchUIItem): string {
  const itemKey = normalizeText(item.key);
  if (itemKey) {
    return itemKey;
  }

  return typeof item.id === "number" ? `id:${item.id}` : "";
}

export function isRegularWorkbenchItem(
  item: WorkbenchUIItem | null,
): item is WorkbenchUIItem {
  if (!item) {
    return false;
  }

  try {
    if (typeof item.isRegularItem === "function") {
      return item.isRegularItem();
    }
    if (typeof item.isNote === "function" && item.isNote()) {
      return false;
    }
    if (typeof item.isAttachment === "function" && item.isAttachment()) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}

export function getRegularWorkbenchItems(
  items: readonly WorkbenchUIItem[],
): WorkbenchUIItem[] {
  return items.filter((item) => isRegularWorkbenchItem(item));
}

export function buildItemStateSignature(item: WorkbenchUIItem): string {
  return STATE_SIGNATURE_FIELDS.map(
    (field) => `${field}=${readField(item, field)}`,
  ).join("\u0000");
}

function emptyTags(itemKey: string): StructuredTagRecord {
  return {
    itemKey,
    taskJson: [],
    methodJson: [],
    datasetJson: [],
    metricJson: [],
    updatedAt: 0,
  };
}

function computeResolvedItemState(
  item: WorkbenchUIItem,
  services: Pick<
    Phase7UIServices,
    "venueService" | "artifactService" | "tagService"
  >,
): Phase7ResolvedItemState {
  const itemKey = getItemCacheKey(item);

  return {
    venue: services.venueService.resolveVenue(item, itemKey),
    artifacts: services.artifactService.resolveArtifacts(item, itemKey),
    tags: itemKey ? services.tagService.getTags(itemKey) : emptyTags(""),
  };
}

export function invalidateUIStateCache(itemKey?: string): void {
  if (!itemKey) {
    resolvedStateCache.clear();
    return;
  }

  resolvedStateCache.delete(normalizeText(itemKey));
}

export function getResolvedItemState(
  item: WorkbenchUIItem,
  services: Pick<
    Phase7UIServices,
    "venueService" | "artifactService" | "tagService"
  >,
): Phase7ResolvedItemState {
  const cacheKey = getItemCacheKey(item);
  if (!cacheKey) {
    return computeResolvedItemState(item, services);
  }

  const signature = buildItemStateSignature(item);
  const cached = resolvedStateCache.get(cacheKey);
  if (cached && cached.signature === signature) {
    return cached.state;
  }

  const state = computeResolvedItemState(item, services);
  resolvedStateCache.set(cacheKey, { signature, state });
  return state;
}

export function buildColumnSnapshot(
  item: WorkbenchUIItem,
  services: Pick<
    Phase7UIServices,
    "venueService" | "artifactService" | "tagService"
  >,
): Phase7ColumnSnapshot {
  if (!isRegularWorkbenchItem(item)) {
    return {
      venueShort: "",
      ccfRank: "",
      coreRank: "",
      hasCode: "",
      hasOpenReview: "",
    };
  }

  const state = getResolvedItemState(item, services);

  return {
    venueShort: state.venue.shortName,
    ccfRank: state.venue.ccfRank,
    coreRank: state.venue.coreRank,
    hasCode: state.artifacts.codeUrl ? "Yes" : "",
    hasOpenReview: state.artifacts.openreviewUrl ? "Yes" : "",
  };
}

export function getColumnValue(
  item: WorkbenchUIItem,
  columnKey: Phase7ColumnKey,
  services: Pick<
    Phase7UIServices,
    "venueService" | "artifactService" | "tagService"
  >,
): string {
  return buildColumnSnapshot(item, services)[columnKey];
}

function countNonEmpty(values: readonly string[]): number {
  return values.filter(Boolean).length;
}

function createFields(
  values: Array<[label: string, value: string]>,
): Phase7DetailField[] {
  return values.map(([label, value]) => ({
    label,
    value,
  }));
}

export function buildDetailPaneData(
  item: WorkbenchUIItem,
  services: Pick<
    Phase7UIServices,
    "venueService" | "artifactService" | "tagService"
  >,
): Phase7DetailPaneData {
  const state = isRegularWorkbenchItem(item)
    ? getResolvedItemState(item, services)
    : {
        venue: {
          shortName: "",
          canonicalName: "",
          type: "",
          ccfRank: "",
          coreRank: "",
        },
        artifacts: {
          doiUrl: "",
          arxivUrl: "",
          openreviewUrl: "",
          codeUrl: "",
          projectUrl: "",
        },
        tags: emptyTags(""),
      };

  const artifactCount = countNonEmpty([
    state.artifacts.doiUrl,
    state.artifacts.arxivUrl,
    state.artifacts.openreviewUrl,
    state.artifacts.codeUrl,
    state.artifacts.projectUrl,
  ]);
  const tagCount = countNonEmpty([
    ...state.tags.taskJson,
    ...state.tags.methodJson,
    ...state.tags.datasetJson,
    ...state.tags.metricJson,
  ]);

  return {
    venue: {
      fullName: state.venue.canonicalName,
      shortName: state.venue.shortName,
      type: state.venue.type,
      ccfRank: state.venue.ccfRank,
      coreRank: state.venue.coreRank,
      summary:
        state.venue.shortName ||
        state.venue.type ||
        state.venue.canonicalName ||
        "",
      fields: createFields([
        ["Full Name", state.venue.canonicalName],
        ["Short Name", state.venue.shortName],
        ["Type", state.venue.type],
        ["CCF", state.venue.ccfRank],
        ["CORE", state.venue.coreRank],
      ]),
    },
    artifacts: {
      doi: state.artifacts.doiUrl,
      arxiv: state.artifacts.arxivUrl,
      openreview: state.artifacts.openreviewUrl,
      code: state.artifacts.codeUrl,
      project: state.artifacts.projectUrl,
      summary: artifactCount > 0 ? `${artifactCount} link(s)` : "",
      fields: createFields([
        ["DOI", state.artifacts.doiUrl],
        ["arXiv", state.artifacts.arxivUrl],
        ["OpenReview", state.artifacts.openreviewUrl],
        ["Code", state.artifacts.codeUrl],
        ["Project", state.artifacts.projectUrl],
      ]),
    },
    workflow: {
      task: joinTagValues(state.tags.taskJson),
      method: joinTagValues(state.tags.methodJson),
      dataset: joinTagValues(state.tags.datasetJson),
      metric: joinTagValues(state.tags.metricJson),
      summary: tagCount > 0 ? `${tagCount} tag(s)` : "",
      fields: createFields([
        ["Task", joinTagValues(state.tags.taskJson)],
        ["Method", joinTagValues(state.tags.methodJson)],
        ["Dataset", joinTagValues(state.tags.datasetJson)],
        ["Metric", joinTagValues(state.tags.metricJson)],
      ]),
    },
  };
}

export function buildArtifactLinksClipboardText(
  item: WorkbenchUIItem,
  services: Pick<
    Phase7UIServices,
    "venueService" | "artifactService" | "tagService"
  >,
): string {
  if (!isRegularWorkbenchItem(item)) {
    return "";
  }

  const state = getResolvedItemState(item, services);
  const rows = [
    ["DOI", state.artifacts.doiUrl],
    ["arXiv", state.artifacts.arxivUrl],
    ["OpenReview", state.artifacts.openreviewUrl],
    ["Code", state.artifacts.codeUrl],
    ["Project", state.artifacts.projectUrl],
  ].filter(([, value]) => Boolean(value));

  return rows.map(([label, value]) => `${label}: ${value}`).join("\n");
}
