import { config } from "../../package.json";

const PREFS_PREFIX = config.prefsPrefix;

/**
 * Get preference value.
 * Wrapper of `Zotero.Prefs.get`.
 */
export function getPref<K extends keyof _ZoteroTypes.Prefs["PluginPrefsMap"]>(
  key: K,
) {
  return Zotero.Prefs.get(
    `${PREFS_PREFIX}.${key}`,
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
  return Zotero.Prefs.set(`${PREFS_PREFIX}.${key}`, value, true);
}

/**
 * Clear preference value.
 * Wrapper of `Zotero.Prefs.clear`.
 */
export function clearPref(key: string) {
  return Zotero.Prefs.clear(`${PREFS_PREFIX}.${key}`, true);
}
