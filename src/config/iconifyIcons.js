/**
 * Iconify icons ship with the app (fedRAMP/FRONTEND_action_plan_2026-10-26.md,
 * SC-7). @iconify/react fetched each icon at runtime from api.iconify.design;
 * with the CSP enforced, every icon the browser had not cached vanished.
 *
 * iconifyIcons.json holds only the icons the code names. Regenerate it after
 * adding an icon (the test lists the missing ones):
 *
 *   node scripts/iconify-bundle.js
 */

// A quoted "prefix:name" string. Permission strings ("member:update") match
// too, so callers pass the icon-set prefixes to keep.
const QUOTED_NAME = /["'`]([a-z0-9]+(?:-[a-z0-9]+)*):([a-z0-9]+(?:-[a-z0-9]+)*)["'`]/g;

export const findIconNames = (source, prefixes) => {
  const sets = new Set(prefixes);
  return [...source.matchAll(QUOTED_NAME)]
    .filter(([, prefix]) => sets.has(prefix))
    .map(([, prefix, name]) => `${prefix}:${name}`);
};

/** Loads the bundled collections into @iconify/react's storage. */
export const registerOfflineIcons = (addCollection, bundle) => {
  bundle.collections.forEach((collection) => addCollection(collection));
};
