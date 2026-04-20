import { config } from "../../package.json";

const PREFS_PREFIX = config.prefsPrefix;

export function getPrefBranchName(key: string): string {
  return `${PREFS_PREFIX}.${key}`;
}

/**
 * Get preference value.
 * Wrapper of `Zotero.Prefs.get`.
 */
export function getPref<K extends keyof _ZoteroTypes.Prefs["PluginPrefsMap"]>(
  key: K,
) {
  return Zotero.Prefs.get(
    getPrefBranchName(key),
    true,
  ) as _ZoteroTypes.Prefs["PluginPrefsMap"][K];
}

/**
 * Set preference value.
 * Wrapper of `Zotero.Prefs.set`.
 */
export function setPref<K extends keyof _ZoteroTypes.Prefs["PluginPrefsMap"]>(
  key: K,
  value: _ZoteroTypes.Prefs["PluginPrefsMap"][K],
) {
  return Zotero.Prefs.set(getPrefBranchName(key), value, true);
}

/**
 * Clear preference value.
 * Wrapper of `Zotero.Prefs.clear`.
 */
export function clearPref(key: string) {
  return Zotero.Prefs.clear(getPrefBranchName(key), true);
}

export function getRawPref(key: string): boolean | string | number | undefined {
  return Zotero.Prefs.get(getPrefBranchName(key), true);
}

export function getBooleanPref(key: string, fallback = false): boolean {
  const value = getRawPref(key);
  return typeof value === "boolean" ? value : fallback;
}

export function setRawPref(
  key: string,
  value: boolean | string | number,
): void {
  Zotero.Prefs.set(getPrefBranchName(key), value, true);
}
