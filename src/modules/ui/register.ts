import { config } from "../../../package.json";
import {
  buildDetailPaneData,
  getColumnValue,
  getRegularWorkbenchItems,
  invalidateUIStateCache,
  isRegularWorkbenchItem,
} from "./helpers";
import {
  buildCopyArtifactLinksText,
  buildRelatedWorkExportText,
  editStructuredTagsWithPrompts,
  generateReadingNoteForItem,
  refreshVenueForItem,
} from "./actions";
import type {
  Phase7ColumnKey,
  Phase7DetailField,
  Phase7UIServices,
  RelatedWorkExportFormat,
  WorkbenchUIItem,
} from "./types";

const SECTION_ICON = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" rx="2" fill="#5C6B77"/></svg>',
)}`;

const COLUMN_DEFINITIONS: Array<{
  key: Phase7ColumnKey;
  dataKey: string;
  label: string;
  width: string;
}> = [
  {
    key: "venueShort",
    dataKey: "venueShort",
    label: "Venue Short",
    width: "90",
  },
  { key: "ccfRank", dataKey: "ccfRank", label: "CCF Rank", width: "80" },
  { key: "coreRank", dataKey: "coreRank", label: "CORE Rank", width: "80" },
  { key: "hasCode", dataKey: "hasCode", label: "Has Code", width: "90" },
  {
    key: "hasOpenReview",
    dataKey: "hasOpenReview",
    label: "Has OpenReview",
    width: "120",
  },
] as const;

const VENUE_SECTION_ID = "csWorkbench-venue";
const ARTIFACT_SECTION_ID = "csWorkbench-artifacts";
const WORKFLOW_SECTION_ID = "csWorkbench-workflow";
const LIBRARY_MENU_ID = "csWorkbench-library-item";

function getWindow(doc?: Document | null): _ZoteroTypes.MainWindow | null {
  return (doc?.defaultView as _ZoteroTypes.MainWindow | null) ?? null;
}

function showAlert(
  win: Window | null | undefined,
  message: string,
  title = config.addonName,
): void {
  Zotero.alert(
    (win as Window | null | undefined) ?? Zotero.getMainWindow(),
    title,
    message,
  );
}

function copyText(
  copyPlainText: (text: string) => void,
  text: string,
): boolean {
  if (!text) {
    return false;
  }

  copyPlainText(text);
  return true;
}

function refreshVisibleUI(): void {
  invalidateUIStateCache();
  Zotero.ItemTreeManager.refreshColumns();
  for (const pane of Zotero.getZoteroPanes()) {
    if (pane.itemPane) {
      pane.itemPane.render();
    }
  }
}

function createFieldRow(
  doc: Document,
  field: Phase7DetailField,
): HTMLDivElement {
  const row = doc.createElement("div");
  row.style.display = "grid";
  row.style.gridTemplateColumns = "max-content 1fr";
  row.style.columnGap = "8px";
  row.style.marginBottom = "6px";

  const label = doc.createElement("div");
  label.textContent = field.label;
  label.style.fontWeight = "600";

  const value = doc.createElement("div");
  value.textContent = field.value;
  value.style.whiteSpace = "pre-wrap";
  value.style.wordBreak = "break-word";

  row.append(label, value);
  return row;
}

function createActionButton(
  doc: Document,
  label: string,
  onClick: () => void | Promise<void>,
): HTMLButtonElement {
  const button = doc.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.style.marginRight = "8px";
  button.addEventListener("click", () => {
    void onClick();
  });
  return button;
}

function renderFields(
  doc: Document,
  body: HTMLDivElement,
  fields: readonly Phase7DetailField[],
): void {
  const fragment = doc.createDocumentFragment();
  for (const field of fields) {
    fragment.append(createFieldRow(doc, field));
  }
  body.replaceChildren(fragment);
}

function renderWorkflowSection(
  doc: Document,
  body: HTMLDivElement,
  item: WorkbenchUIItem,
  services: Phase7UIServices,
  copyPlainText: (text: string) => void,
): void {
  const data = buildDetailPaneData(item, services);
  const fragment = doc.createDocumentFragment();
  for (const field of data.workflow.fields) {
    fragment.append(createFieldRow(doc, field));
  }

  const buttonRow = doc.createElement("div");
  buttonRow.style.marginTop = "10px";

  buttonRow.append(
    createActionButton(doc, "Generate Reading Note", async () => {
      const created = await generateReadingNoteForItem(item, services);
      if (!created) {
        showAlert(getWindow(doc), "Select a regular item to generate a note.");
        return;
      }
      showAlert(getWindow(doc), "Reading note created.");
    }),
    createActionButton(doc, "Export Related Work", () => {
      const text = buildRelatedWorkExportText([item], "markdown", services);
      if (!copyText(copyPlainText, text)) {
        showAlert(getWindow(doc), "No exportable item is selected.");
        return;
      }
      showAlert(
        getWindow(doc),
        "Copied related-work Markdown to the clipboard.",
      );
    }),
  );

  fragment.append(buttonRow);
  body.replaceChildren(fragment);
}

function hasSingleRegularItem(
  items?: readonly Zotero.Item[],
): items is [Zotero.Item] {
  return getRegularWorkbenchItems(items ?? []).length === 1;
}

async function handleGenerateReadingNote(
  items: readonly Zotero.Item[] | undefined,
  doc: Document | null,
): Promise<void> {
  const regularItems = getRegularWorkbenchItems(items ?? []);
  const item = regularItems[0] ?? null;
  const created = await generateReadingNoteForItem(item, addon.data);
  if (!created) {
    showAlert(getWindow(doc), "Select a single regular item first.");
    return;
  }

  showAlert(getWindow(doc), "Reading note created.");
}

function handleExportRelatedWork(
  items: readonly Zotero.Item[] | undefined,
  format: RelatedWorkExportFormat,
  copyPlainText: (text: string) => void,
  doc: Document | null,
): void {
  const text = buildRelatedWorkExportText(items ?? [], format, addon.data);
  if (!copyText(copyPlainText, text)) {
    showAlert(getWindow(doc), "Select one or more regular items first.");
    return;
  }

  showAlert(
    getWindow(doc),
    format === "csv"
      ? "Copied related-work CSV to the clipboard."
      : "Copied related-work Markdown to the clipboard.",
  );
}

function handleCopyArtifactLinks(
  items: readonly Zotero.Item[] | undefined,
  copyPlainText: (text: string) => void,
  doc: Document | null,
): void {
  const regularItems = getRegularWorkbenchItems(items ?? []);
  const text = buildCopyArtifactLinksText(regularItems[0] ?? null, addon.data);
  if (!copyText(copyPlainText, text)) {
    showAlert(getWindow(doc), "No artifact links are available for the item.");
    return;
  }

  showAlert(getWindow(doc), "Copied artifact links to the clipboard.");
}

function handleRefreshVenue(
  items: readonly Zotero.Item[] | undefined,
  doc: Document | null,
): void {
  const regularItems = getRegularWorkbenchItems(items ?? []);
  const refreshed = refreshVenueForItem(regularItems[0] ?? null, addon.data);
  if (!refreshed) {
    showAlert(getWindow(doc), "Select a single regular item first.");
    return;
  }

  refreshVisibleUI();
  showAlert(getWindow(doc), "Venue data refreshed.");
}

function handleEditStructuredTags(
  items: readonly Zotero.Item[] | undefined,
  doc: Document | null,
): void {
  const regularItems = getRegularWorkbenchItems(items ?? []);
  const win = getWindow(doc);
  const updated = editStructuredTagsWithPrompts(
    regularItems[0] ?? null,
    (label, defaultValue) =>
      win?.prompt(`${label} (use ';' or new lines)`, defaultValue) ?? null,
    addon.data,
  );

  if (updated === null) {
    return;
  }

  refreshVisibleUI();
  showAlert(win, "Structured tags updated.");
}

export function registerWorkbenchColumns(
  services: Pick<
    Phase7UIServices,
    "venueService" | "artifactService" | "tagService"
  >,
): string[] {
  const registeredKeys: string[] = [];

  for (const definition of COLUMN_DEFINITIONS) {
    const registeredKey = Zotero.ItemTreeManager.registerColumn({
      dataKey: definition.dataKey,
      label: definition.label,
      pluginID: config.addonID,
      enabledTreeIDs: ["main"],
      defaultIn: ["default"],
      width: definition.width,
      zoteroPersist: ["width", "hidden", "sortDirection"],
      dataProvider: (item) => getColumnValue(item, definition.key, services),
    });

    if (registeredKey) {
      registeredKeys.push(registeredKey);
    }
  }

  Zotero.ItemTreeManager.refreshColumns();
  return registeredKeys;
}

export function unregisterWorkbenchColumns(dataKeys: readonly string[]): void {
  for (const dataKey of dataKeys) {
    Zotero.ItemTreeManager.unregisterColumn(dataKey);
  }
}

export function registerWorkbenchSections(
  services: Phase7UIServices,
  copyPlainText: (text: string) => void,
): string[] {
  const sections: Array<string | false> = [
    Zotero.ItemPaneManager.registerSection({
      paneID: VENUE_SECTION_ID,
      pluginID: config.addonID,
      header: { l10nID: "cswb-pane-venue-header", icon: SECTION_ICON },
      sidenav: { l10nID: "cswb-pane-venue-sidenav", icon: SECTION_ICON },
      onRender: ({ body, doc, item, setEnabled, setSectionSummary }) => {
        const enabled = isRegularWorkbenchItem(item);
        setEnabled(enabled);
        if (!enabled) {
          body.replaceChildren();
          setSectionSummary("");
          return;
        }

        const data = buildDetailPaneData(item, services);
        renderFields(doc, body, data.venue.fields);
        setSectionSummary(data.venue.summary);
      },
      onItemChange: ({ item, setEnabled }) => {
        setEnabled(isRegularWorkbenchItem(item));
      },
    }),
    Zotero.ItemPaneManager.registerSection({
      paneID: ARTIFACT_SECTION_ID,
      pluginID: config.addonID,
      header: { l10nID: "cswb-pane-artifacts-header", icon: SECTION_ICON },
      sidenav: { l10nID: "cswb-pane-artifacts-sidenav", icon: SECTION_ICON },
      onRender: ({ body, doc, item, setEnabled, setSectionSummary }) => {
        const enabled = isRegularWorkbenchItem(item);
        setEnabled(enabled);
        if (!enabled) {
          body.replaceChildren();
          setSectionSummary("");
          return;
        }

        const data = buildDetailPaneData(item, services);
        renderFields(doc, body, data.artifacts.fields);
        setSectionSummary(data.artifacts.summary);
      },
      onItemChange: ({ item, setEnabled }) => {
        setEnabled(isRegularWorkbenchItem(item));
      },
    }),
    Zotero.ItemPaneManager.registerSection({
      paneID: WORKFLOW_SECTION_ID,
      pluginID: config.addonID,
      header: { l10nID: "cswb-pane-workflow-header", icon: SECTION_ICON },
      sidenav: { l10nID: "cswb-pane-workflow-sidenav", icon: SECTION_ICON },
      onRender: ({ body, doc, item, setEnabled, setSectionSummary }) => {
        const enabled = isRegularWorkbenchItem(item);
        setEnabled(enabled);
        if (!enabled) {
          body.replaceChildren();
          setSectionSummary("");
          return;
        }

        const data = buildDetailPaneData(item, services);
        renderWorkflowSection(doc, body, item, services, copyPlainText);
        setSectionSummary(data.workflow.summary);
      },
      onItemChange: ({ item, setEnabled }) => {
        setEnabled(isRegularWorkbenchItem(item));
      },
    }),
  ];

  return sections.filter((section): section is string => Boolean(section));
}

export function unregisterWorkbenchSections(
  sectionIDs: readonly string[],
): void {
  for (const sectionID of sectionIDs) {
    Zotero.ItemPaneManager.unregisterSection(sectionID);
  }
}

export function registerWorkbenchMenus(
  copyPlainText: (text: string) => void,
): string[] {
  const menuID = Zotero.MenuManager.registerMenu({
    menuID: LIBRARY_MENU_ID,
    pluginID: config.addonID,
    target: "main/library/item",
    menus: [
      {
        menuType: "menuitem",
        l10nID: "cswb-menu-refresh-venue",
        onShowing: (_event, context) => {
          context.setVisible(hasSingleRegularItem(context.items));
        },
        onCommand: (_event, context) => {
          handleRefreshVenue(context.items, context.menuElem.ownerDocument);
        },
      },
      {
        menuType: "menuitem",
        l10nID: "cswb-menu-edit-tags",
        onShowing: (_event, context) => {
          context.setVisible(hasSingleRegularItem(context.items));
        },
        onCommand: (_event, context) => {
          handleEditStructuredTags(
            context.items,
            context.menuElem.ownerDocument,
          );
        },
      },
      {
        menuType: "menuitem",
        l10nID: "cswb-menu-generate-note",
        onShowing: (_event, context) => {
          context.setVisible(hasSingleRegularItem(context.items));
        },
        onCommand: (_event, context) => {
          void handleGenerateReadingNote(
            context.items,
            context.menuElem.ownerDocument,
          );
        },
      },
      {
        menuType: "submenu",
        l10nID: "cswb-menu-export-related-work",
        onShowing: (_event, context) => {
          context.setVisible(
            getRegularWorkbenchItems(context.items ?? []).length > 0,
          );
        },
        menus: [
          {
            menuType: "menuitem",
            l10nID: "cswb-menu-export-related-work-markdown",
            onCommand: (_event, context) => {
              handleExportRelatedWork(
                context.items,
                "markdown",
                copyPlainText,
                context.menuElem.ownerDocument,
              );
            },
          },
          {
            menuType: "menuitem",
            l10nID: "cswb-menu-export-related-work-csv",
            onCommand: (_event, context) => {
              handleExportRelatedWork(
                context.items,
                "csv",
                copyPlainText,
                context.menuElem.ownerDocument,
              );
            },
          },
        ],
      },
      {
        menuType: "menuitem",
        l10nID: "cswb-menu-copy-artifact-links",
        onShowing: (_event, context) => {
          context.setVisible(hasSingleRegularItem(context.items));
        },
        onCommand: (_event, context) => {
          handleCopyArtifactLinks(
            context.items,
            copyPlainText,
            context.menuElem.ownerDocument,
          );
        },
      },
    ],
  });

  return menuID ? [menuID] : [];
}

export function unregisterWorkbenchMenus(menuIDs: readonly string[]): void {
  for (const menuID of menuIDs) {
    Zotero.MenuManager.unregisterMenu(menuID);
  }
}

export function refreshWorkbenchUI(): void {
  refreshVisibleUI();
}
