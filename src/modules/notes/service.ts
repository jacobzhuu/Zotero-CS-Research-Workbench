import { normalizeText } from "../storage/common";
import type { ArtifactHubService } from "../artifact";
import type { VenueLiteService } from "../venue";
import {
  DEFAULT_READING_NOTE_SECTIONS,
  type CreateReadingNoteOptions,
  type CreatedReadingNote,
  type ReadingNoteCreator,
  type ReadingNoteFormat,
  type ReadingNoteHeaderMetadata,
  type ReadingNoteResolvableItem,
  type ReadingNoteTemplateData,
  type ReadingNoteTemplateOptions,
} from "./types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveSections(options?: ReadingNoteTemplateOptions): string[] {
  const sections = options?.sections?.map((section) =>
    normalizeText(section),
  ) ?? [...DEFAULT_READING_NOTE_SECTIONS];
  const normalizedSections = sections.filter(Boolean);

  return normalizedSections.length > 0
    ? normalizedSections
    : [...DEFAULT_READING_NOTE_SECTIONS];
}

function formatCreatorName(creator: ReadingNoteCreator): string {
  if (creator.name) {
    return normalizeText(creator.name);
  }

  return normalizeText(
    [creator.firstName ?? "", creator.lastName ?? ""].filter(Boolean).join(" "),
  );
}

function extractAuthors(item: ReadingNoteResolvableItem): string {
  const creators = item.getCreatorsJSON?.() ?? [];
  const authorNames = creators.map(formatCreatorName).filter(Boolean);

  if (authorNames.length > 0) {
    return authorNames.join(", ");
  }

  return normalizeText(item.getField("firstCreator"));
}

function extractYear(item: ReadingNoteResolvableItem): string {
  const dateValue = normalizeText(item.getField("date"));
  const match = dateValue.match(/\b(19|20)\d{2}\b/);
  return match?.[0] ?? "";
}

function metadataEntries(metadata: ReadingNoteHeaderMetadata): Array<{
  label: string;
  value: string;
}> {
  return [
    { label: "Title", value: metadata.title },
    { label: "Authors", value: metadata.authors },
    { label: "Year", value: metadata.year },
    { label: "Venue", value: metadata.venueShort },
    { label: "DOI", value: metadata.doiUrl },
    { label: "arXiv", value: metadata.arxivUrl },
    { label: "OpenReview", value: metadata.openreviewUrl },
    { label: "Code", value: metadata.codeUrl },
    { label: "Project", value: metadata.projectUrl },
  ].filter((entry) => Boolean(entry.value));
}

function buildMarkdownTemplate(data: ReadingNoteTemplateData): string {
  const lines = ["# Reading Note", ""];
  const entries = metadataEntries(data.metadata);

  if (entries.length > 0) {
    lines.push("## Paper", "");
    for (const entry of entries) {
      lines.push(`- ${entry.label}: ${entry.value}`);
    }
    lines.push("");
  }

  for (const section of data.sections) {
    lines.push(`## ${section}`, "", "-", "");
  }

  return lines.join("\n").trimEnd();
}

function buildPlainTextTemplate(data: ReadingNoteTemplateData): string {
  const lines = ["Reading Note", ""];
  const entries = metadataEntries(data.metadata);

  if (entries.length > 0) {
    lines.push("Paper", "");
    for (const entry of entries) {
      lines.push(`${entry.label}: ${entry.value}`);
    }
    lines.push("");
  }

  for (const section of data.sections) {
    lines.push(section, "", "-", "");
  }

  return lines.join("\n").trimEnd();
}

function buildNoteHtml(data: ReadingNoteTemplateData): string {
  const entries = metadataEntries(data.metadata);
  const parts: string[] = ["<h1>Reading Note</h1>"];

  if (entries.length > 0) {
    parts.push("<h2>Paper</h2>", "<ul>");
    for (const entry of entries) {
      parts.push(
        `<li><strong>${escapeHtml(entry.label)}:</strong> ${escapeHtml(
          entry.value,
        )}</li>`,
      );
    }
    parts.push("</ul>");
  }

  for (const section of data.sections) {
    parts.push(`<h2>${escapeHtml(section)}</h2>`, "<p><br></p>");
  }

  return parts.join("");
}

export class ReadingNoteTemplateService {
  constructor(
    private readonly venueService: VenueLiteService,
    private readonly artifactService: ArtifactHubService,
  ) {}

  collectTemplateData(
    item: ReadingNoteResolvableItem,
    options?: ReadingNoteTemplateOptions,
  ): ReadingNoteTemplateData {
    const itemKey = normalizeText(item.key);
    const venue = this.venueService.resolveVenue(item, itemKey);
    const artifacts = this.artifactService.resolveArtifacts(item, itemKey);

    return {
      itemKey,
      sections: resolveSections(options),
      metadata: {
        title: normalizeText(item.getField("title")),
        authors: extractAuthors(item),
        year: extractYear(item),
        venueShort: venue.shortName,
        doiUrl: artifacts.doiUrl,
        arxivUrl: artifacts.arxivUrl,
        openreviewUrl: artifacts.openreviewUrl,
        codeUrl: artifacts.codeUrl,
        projectUrl: artifacts.projectUrl,
      },
    };
  }

  generateMarkdown(
    item: ReadingNoteResolvableItem,
    options?: ReadingNoteTemplateOptions,
  ): string {
    return buildMarkdownTemplate(this.collectTemplateData(item, options));
  }

  generatePlainText(
    item: ReadingNoteResolvableItem,
    options?: ReadingNoteTemplateOptions,
  ): string {
    return buildPlainTextTemplate(this.collectTemplateData(item, options));
  }

  async createZoteroNote(
    item: ReadingNoteResolvableItem,
    options?: CreateReadingNoteOptions,
  ): Promise<CreatedReadingNote> {
    if (typeof Zotero.Item !== "function") {
      throw new Error("Zotero.Item is unavailable in the current environment.");
    }

    const data = this.collectTemplateData(item, options);
    const format: ReadingNoteFormat = options?.format ?? "markdown";
    const content =
      format === "plainText"
        ? buildPlainTextTemplate(data)
        : buildMarkdownTemplate(data);

    const noteItem = new Zotero.Item("note");
    if (typeof item.libraryID === "number") {
      noteItem.libraryID = item.libraryID;
    }
    if (options?.attachToParent !== false && typeof item.id === "number") {
      noteItem.parentItemID = item.id;
    }

    noteItem.setNote(buildNoteHtml(data));
    await noteItem.saveTx();

    return {
      noteItem,
      format,
      content,
    };
  }
}

export function createReadingNoteTemplateService(
  venueService: VenueLiteService,
  artifactService: ArtifactHubService,
): ReadingNoteTemplateService {
  return new ReadingNoteTemplateService(venueService, artifactService);
}
