/* global Zotero, document, window */

const PREFS_PREFIX = "extensions.zotero.cs-workbench";
const PREF_KEYS = {
  enableColumns: "ui.enableColumns",
  enableSections: "ui.enableSections",
  enableContextMenu: "ui.enableContextMenu",
  resetDataNonce: "ui.resetDataNonce",
};

function prefName(key) {
  return `${PREFS_PREFIX}.${key}`;
}

function getBooleanPref(key, fallback = false) {
  const value = Zotero.Prefs.get(prefName(key), true);
  return typeof value === "boolean" ? value : fallback;
}

function setBooleanPref(key, value) {
  Zotero.Prefs.set(prefName(key), Boolean(value), true);
}

function initPrefsPane() {
  const root = document.getElementById("cswb-pref-root");
  if (!root || root.dataset.initialized === "true") {
    return;
  }

  root.dataset.initialized = "true";

  const columnsCheckbox = document.getElementById("cswb-pref-enable-columns");
  const sectionsCheckbox = document.getElementById("cswb-pref-enable-sections");
  const contextMenuCheckbox = document.getElementById(
    "cswb-pref-enable-context-menu",
  );
  const resetButton = document.getElementById("cswb-pref-reset-data");

  if (
    !columnsCheckbox ||
    !sectionsCheckbox ||
    !contextMenuCheckbox ||
    !resetButton
  ) {
    return;
  }

  columnsCheckbox.checked = getBooleanPref(PREF_KEYS.enableColumns, true);
  sectionsCheckbox.checked = getBooleanPref(PREF_KEYS.enableSections, true);
  contextMenuCheckbox.checked = getBooleanPref(
    PREF_KEYS.enableContextMenu,
    true,
  );

  columnsCheckbox.addEventListener("command", () => {
    setBooleanPref(PREF_KEYS.enableColumns, columnsCheckbox.checked);
  });
  sectionsCheckbox.addEventListener("command", () => {
    setBooleanPref(PREF_KEYS.enableSections, sectionsCheckbox.checked);
  });
  contextMenuCheckbox.addEventListener("command", () => {
    setBooleanPref(PREF_KEYS.enableContextMenu, contextMenuCheckbox.checked);
  });
  resetButton.addEventListener("command", () => {
    const confirmed = window.confirm(
      "Reset all local workbench data? This clears cached artifacts, tags, and overrides.",
    );
    if (!confirmed) {
      return;
    }

    Zotero.Prefs.set(prefName(PREF_KEYS.resetDataNonce), Date.now(), true);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPrefsPane, { once: true });
} else {
  initPrefsPane();
}
