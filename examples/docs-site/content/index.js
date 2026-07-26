// Compatibility entry for callers that used the original content registry.
// The catalog contains metadata only; live descriptors load through loadEntry()
// so importing navigation/search data never fetches all 98 reference pages.

export {
  CATEGORIES,
  ENTRY_META,
  SEARCH_COMMANDS,
  SIDEBAR_GROUPS,
  categoryFor,
  metaFor,
  neighborsFor,
  pathFor,
} from "./catalog.js";
export { loadEntry } from "./entryLoader.js";
