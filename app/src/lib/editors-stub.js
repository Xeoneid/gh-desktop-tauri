'use strict'
// Stub for the entire editors module in the Tauri/web build.
// Editor detection uses platform registry/fs APIs that aren't available
// in a web context. Return empty results so app-store.ts loads cleanly.

module.exports = {
  // lookup.ts exports
  getAvailableEditors: async () => [],
  findEditorOrDefault: async (_name) => null,
  // launch.ts exports
  launchExternalEditor: async (_path, _editor) => {},
  launchCustomExternalEditor: async (_path, _editor) => {},
}
