export const DEFAULT_READING_NOTE_SECTIONS = [
  "Problem",
  "Core Idea",
  "Method Overview",
  "Experimental Setup",
  "Main Results",
  "Limitations",
  "Relation to My Work",
] as const;

export type ReadingNoteSection =
  | (typeof DEFAULT_READING_NOTE_SECTIONS)[number]
  | string;

export type ReadingNoteFormat = "markdown" | "plainText";

export interface ReadingNoteCreator {
  firstName?: string;
  lastName?: string;
  name?: string;
}

export interface ReadingNoteResolvableItem {
  id?: number;
  key?: string;
  libraryID?: number;
  getField(
    field: string,
    unformatted?: boolean,
    includeBaseMapped?: boolean,
  ): string;
  getCreatorsJSON?(): ReadingNoteCreator[];
}

export interface ReadingNoteHeaderMetadata {
  title: string;
  authors: string;
  year: string;
  venueShort: string;
  doiUrl: string;
  arxivUrl: string;
  openreviewUrl: string;
  codeUrl: string;
  projectUrl: string;
}

export interface ReadingNoteTemplateData {
  itemKey: string;
  sections: string[];
  metadata: ReadingNoteHeaderMetadata;
}

export interface ReadingNoteTemplateOptions {
  sections?: readonly ReadingNoteSection[];
}

export interface CreateReadingNoteOptions extends ReadingNoteTemplateOptions {
  attachToParent?: boolean;
  format?: ReadingNoteFormat;
}

export interface CreatedReadingNote {
  noteItem: Zotero.Item;
  format: ReadingNoteFormat;
  content: string;
}
