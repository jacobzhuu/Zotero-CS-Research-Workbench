import { normalizeText } from "../storage/common";
import type { ArtifactHubService } from "../artifact";
import type { StructuredTagService } from "../tags";
import type { VenueLiteService } from "../venue";
import {
  RELATED_WORK_EXPORT_FIELDS,
  type RelatedWorkExportRow,
  type RelatedWorkResolvableItem,
} from "./types";

function extractYear(item: RelatedWorkResolvableItem): string {
  const dateValue = normalizeText(item.getField("date"));
  const match = dateValue.match(/\b(19|20)\d{2}\b/);
  return match?.[0] ?? "";
}

function joinValues(values: readonly string[]): string {
  return values.join("; ");
}

function sanitizeMarkdownCell(value: string): string {
  return value.replace(/\r?\n/g, "<br>").replace(/\|/g, "\\|");
}

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

export class RelatedWorkExportService {
  constructor(
    private readonly venueService: VenueLiteService,
    private readonly artifactService: ArtifactHubService,
    private readonly tagService: StructuredTagService,
  ) {}

  collectRows(
    items: readonly RelatedWorkResolvableItem[],
  ): RelatedWorkExportRow[] {
    return items.map((item) => {
      const itemKey = normalizeText(item.key);
      const venue = this.venueService.resolveVenue(item, itemKey);
      const artifacts = this.artifactService.resolveArtifacts(item, itemKey);
      const tags = this.tagService.getTags(itemKey);

      return {
        Title: normalizeText(item.getField("title")),
        Year: extractYear(item),
        "Venue Short": venue.shortName,
        "CCF Rank": venue.ccfRank,
        "CORE Rank": venue.coreRank,
        Task: joinValues(tags.taskJson),
        Method: joinValues(tags.methodJson),
        Dataset: joinValues(tags.datasetJson),
        Metric: joinValues(tags.metricJson),
        Code: artifacts.codeUrl,
        // Phase 6 keeps this empty until note-export semantics are explicitly defined.
        Notes: "",
      };
    });
  }

  async collectRowsByKeys(
    libraryID: number,
    itemKeys: readonly string[],
  ): Promise<RelatedWorkExportRow[]> {
    const items: RelatedWorkResolvableItem[] = [];

    for (const itemKey of itemKeys) {
      const normalizedKey = normalizeText(itemKey);
      if (!normalizedKey) {
        continue;
      }

      const item = await Zotero.Items.getByLibraryAndKeyAsync(
        libraryID,
        normalizedKey,
      );
      if (!item) {
        continue;
      }

      items.push(item);
    }

    return this.collectRows(items);
  }

  toMarkdown(rows: readonly RelatedWorkExportRow[]): string {
    const header = `| ${RELATED_WORK_EXPORT_FIELDS.join(" | ")} |`;
    const divider = `| ${RELATED_WORK_EXPORT_FIELDS.map(() => "---").join(" | ")} |`;
    const body = rows.map((row) => {
      const cells = RELATED_WORK_EXPORT_FIELDS.map((field) =>
        sanitizeMarkdownCell(row[field]),
      );
      return `| ${cells.join(" | ")} |`;
    });

    return [header, divider, ...body].join("\n");
  }

  toCSV(rows: readonly RelatedWorkExportRow[]): string {
    const header = RELATED_WORK_EXPORT_FIELDS.join(",");
    const body = rows.map((row) =>
      RELATED_WORK_EXPORT_FIELDS.map((field) => escapeCsvCell(row[field])).join(
        ",",
      ),
    );

    return [header, ...body].join("\n");
  }
}

export function createRelatedWorkExportService(
  venueService: VenueLiteService,
  artifactService: ArtifactHubService,
  tagService: StructuredTagService,
): RelatedWorkExportService {
  return new RelatedWorkExportService(
    venueService,
    artifactService,
    tagService,
  );
}
