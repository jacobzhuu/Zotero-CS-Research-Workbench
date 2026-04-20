import { createZToolkit } from "./utils/ztoolkit";
import {
  refreshWorkbenchUI,
  registerWorkbenchColumns,
  registerWorkbenchMenus,
  registerWorkbenchSections,
  unregisterWorkbenchColumns,
  unregisterWorkbenchMenus,
  unregisterWorkbenchSections,
} from "./modules/ui";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  addon.data.venueService.ensureSeedData();
  const copyPlainText = (text: string) => {
    new addon.data.ztoolkit.Clipboard().addText(text, "text/unicode").copy();
  };

  addon.data.registeredColumnKeys = registerWorkbenchColumns(addon.data);
  addon.data.registeredSectionIDs = registerWorkbenchSections(
    addon.data,
    copyPlainText,
  );
  addon.data.registeredMenuIDs = registerWorkbenchMenus(copyPlainText);
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

  if (ids.length === 0 && !extraData) {
    return;
  }

  refreshWorkbenchUI();
}

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  onNotify,
};
