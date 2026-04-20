import { config } from "../../../package.json";
import type { WorkbenchStorage } from "../storage";
import type { VenueLiteService } from "../venue";
import {
  getBooleanPref,
  getPrefBranchName,
  setRawPref,
} from "../../utils/prefs";

export const WORKBENCH_UI_PREF_KEYS = {
  enableColumns: "ui.enableColumns",
  enableSections: "ui.enableSections",
  enableContextMenu: "ui.enableContextMenu",
  resetDataNonce: "ui.resetDataNonce",
} as const;

export interface WorkbenchUISettings {
  enableColumns: boolean;
  enableSections: boolean;
  enableContextMenu: boolean;
}

export function getWorkbenchUISettings(): WorkbenchUISettings {
  return {
    enableColumns: getBooleanPref(WORKBENCH_UI_PREF_KEYS.enableColumns, true),
    enableSections: getBooleanPref(WORKBENCH_UI_PREF_KEYS.enableSections, true),
    enableContextMenu: getBooleanPref(
      WORKBENCH_UI_PREF_KEYS.enableContextMenu,
      true,
    ),
  };
}

export function requestWorkbenchDataReset(): void {
  setRawPref(WORKBENCH_UI_PREF_KEYS.resetDataNonce, Date.now());
}

export async function registerWorkbenchPreferencePane(): Promise<
  string | null
> {
  if (!Zotero.PreferencePanes?.register) {
    return null;
  }

  return Zotero.PreferencePanes.register({
    pluginID: config.addonID,
    id: "cs-workbench-preferences",
    label: config.addonName,
    src: `chrome://${config.addonRef}/content/prefs.xhtml`,
    scripts: [`chrome://${config.addonRef}/content/prefsPane.js`],
  });
}

export function registerWorkbenchPreferenceObservers(
  onSettingsChanged: () => void,
  onResetRequested: () => void,
): symbol[] {
  const observers = [
    Zotero.Prefs.registerObserver(
      getPrefBranchName(WORKBENCH_UI_PREF_KEYS.enableColumns),
      onSettingsChanged,
      true,
    ),
    Zotero.Prefs.registerObserver(
      getPrefBranchName(WORKBENCH_UI_PREF_KEYS.enableSections),
      onSettingsChanged,
      true,
    ),
    Zotero.Prefs.registerObserver(
      getPrefBranchName(WORKBENCH_UI_PREF_KEYS.enableContextMenu),
      onSettingsChanged,
      true,
    ),
    Zotero.Prefs.registerObserver(
      getPrefBranchName(WORKBENCH_UI_PREF_KEYS.resetDataNonce),
      onResetRequested,
      true,
    ),
  ];

  return observers;
}

export function unregisterWorkbenchPreferenceObservers(
  observers: readonly symbol[],
): void {
  for (const observer of observers) {
    Zotero.Prefs.unregisterObserver(observer);
  }
}

export function resetWorkbenchLocalData(
  storage: WorkbenchStorage,
  venueService: VenueLiteService,
): void {
  storage.venues.clear();
  storage.artifacts.clear();
  storage.tags.clear();
  storage.overrides.clear();
  venueService.ensureSeedData();
}
