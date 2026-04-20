import { createZToolkit } from "./utils/ztoolkit";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  // Phase 1: storage layer is ready, no UI registration yet
  addon.data.initialized = true;
}

async function onMainWindowLoad(win: _ZoteroTypes.MainWindow): Promise<void> {
  const windowToolkit = createZToolkit();
  addon.data.windowToolkits.set(win, windowToolkit);

  // Phase 2+: register UI components here
}

async function onMainWindowUnload(win: Window): Promise<void> {
  const toolkit = addon.data.windowToolkits.get(win);
  toolkit?.unregisterAll();
  addon.data.windowToolkits.delete(win);
}

async function onShutdown(): Promise<void> {
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
  // Phase 2+: handle item changes
}

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  onNotify,
};
