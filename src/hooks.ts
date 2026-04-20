import { createZToolkit } from "./utils/ztoolkit";
import {
  getWorkbenchUISettings,
  refreshWorkbenchUI,
  registerWorkbenchColumns,
  registerWorkbenchMenus,
  registerWorkbenchPreferenceObservers,
  registerWorkbenchPreferencePane,
  registerWorkbenchSections,
  resetWorkbenchLocalData,
  unregisterWorkbenchColumns,
  unregisterWorkbenchMenus,
  unregisterWorkbenchPreferenceObservers,
  unregisterWorkbenchSections,
} from "./modules/ui";

function syncWorkbenchUI() {
  const copyPlainText = (text: string) => {
    new addon.data.ztoolkit.Clipboard().addText(text, "text/unicode").copy();
  };
  const settings = getWorkbenchUISettings();

  if (settings.enableColumns) {
    if (addon.data.registeredColumnKeys.length === 0) {
      addon.data.registeredColumnKeys = registerWorkbenchColumns(addon.data);
    }
  } else if (addon.data.registeredColumnKeys.length > 0) {
    unregisterWorkbenchColumns(addon.data.registeredColumnKeys);
    addon.data.registeredColumnKeys = [];
  }

  if (settings.enableSections) {
    if (addon.data.registeredSectionIDs.length === 0) {
      addon.data.registeredSectionIDs = registerWorkbenchSections(
        addon.data,
        copyPlainText,
      );
    }
  } else if (addon.data.registeredSectionIDs.length > 0) {
    unregisterWorkbenchSections(addon.data.registeredSectionIDs);
    addon.data.registeredSectionIDs = [];
  }

  if (settings.enableContextMenu) {
    if (addon.data.registeredMenuIDs.length === 0) {
      addon.data.registeredMenuIDs = registerWorkbenchMenus(copyPlainText);
    }
  } else if (addon.data.registeredMenuIDs.length > 0) {
    unregisterWorkbenchMenus(addon.data.registeredMenuIDs);
    addon.data.registeredMenuIDs = [];
  }
}

function getItemKeysFromNotifierIDs(
  ids: Array<string | number>,
): string[] | null {
  const numericIDs = ids.filter((id): id is number => typeof id === "number");
  if (numericIDs.length === 0) {
    return null;
  }

  try {
    const items = Zotero.Items.get(numericIDs);
    return items.map((item) => item.key).filter(Boolean);
  } catch {
    return null;
  }
}

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  addon.data.venueService.ensureSeedData();
  addon.data.preferencePaneID = await registerWorkbenchPreferencePane();
  addon.data.preferenceObserverSymbols = registerWorkbenchPreferenceObservers(
    () => {
      syncWorkbenchUI();
      refreshWorkbenchUI();
    },
    () => {
      resetWorkbenchLocalData(addon.data.storage, addon.data.venueService);
      refreshWorkbenchUI();
    },
  );
  syncWorkbenchUI();
  refreshWorkbenchUI();
  addon.data.initialized = true;
}

async function onMainWindowLoad(win: _ZoteroTypes.MainWindow): Promise<void> {
  const windowToolkit = createZToolkit();
  addon.data.windowToolkits.set(win, windowToolkit);

  if (addon.data.initialized) {
    refreshWorkbenchUI();
  }
}

async function onMainWindowUnload(win: Window): Promise<void> {
  const toolkit = addon.data.windowToolkits.get(win);
  toolkit?.unregisterAll();
  addon.data.windowToolkits.delete(win);
}

async function onShutdown(): Promise<void> {
  unregisterWorkbenchPreferenceObservers(addon.data.preferenceObserverSymbols);
  addon.data.preferenceObserverSymbols = [];
  if (addon.data.preferencePaneID) {
    Zotero.PreferencePanes.unregister(addon.data.preferencePaneID);
    addon.data.preferencePaneID = null;
  }
  unregisterWorkbenchMenus(addon.data.registeredMenuIDs);
  unregisterWorkbenchSections(addon.data.registeredSectionIDs);
  unregisterWorkbenchColumns(addon.data.registeredColumnKeys);
  addon.data.registeredMenuIDs = [];
  addon.data.registeredSectionIDs = [];
  addon.data.registeredColumnKeys = [];
  addon.data.windowToolkits.forEach((toolkit) => toolkit.unregisterAll());
  addon.data.windowToolkits.clear();
  ztoolkit.unregisterAll();
  addon.data.alive = false;
  // @ts-expect-error - Plugin instance is not typed
  delete Zotero[addon.data.config.addonInstance];
}

async function onNotify(
  event: string,
  type: string,
  ids: Array<string | number>,
  extraData: { [key: string]: any },
) {
  if (!addon.data.initialized || type !== "item") {
    return;
  }

  if (!["add", "modify", "delete", "refresh"].includes(event)) {
    return;
  }

  if (ids.length === 0 && !extraData) {
    return;
  }

  refreshWorkbenchUI(
    event === "delete"
      ? undefined
      : (getItemKeysFromNotifierIDs(ids) ?? undefined),
  );
}

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  onNotify,
};
