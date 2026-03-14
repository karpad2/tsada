// ─────────────────────────────────────────────────────────────
// CustomLevelStore — localStorage CRUD for user-created maps
// ─────────────────────────────────────────────────────────────
const KEY = 'heist_custom_levels'

function _load() {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') }
  catch { return [] }
}
function _save(arr) {
  localStorage.setItem(KEY, JSON.stringify(arr))
}

/** Returns array of all saved level metadata (full objects). */
export function listCustomLevels() {
  return _load()
}

/**
 * Save (create or update) a level by id.
 * Returns the id.
 */
export function saveCustomLevel(data) {
  const arr = _load()
  const idx = arr.findIndex(l => l.id === data.id)
  const entry = { ...data, savedAt: Date.now() }
  if (idx >= 0) arr[idx] = entry
  else arr.push(entry)
  _save(arr)
  return data.id
}

/** Load a single level by id. Returns null if not found. */
export function loadCustomLevel(id) {
  return _load().find(l => l.id === id) ?? null
}

/** Delete a level by id. */
export function deleteCustomLevel(id) {
  _save(_load().filter(l => l.id !== id))
}

/**
 * Export a level data object as a JS source string compatible with
 * the maps/ directory format (can be copy-pasted as e.g. 21_mymap.js).
 */
export function exportAsJS(data) {
  // toOutputFormat is expected to already be applied before calling this
  const esc = v => JSON.stringify(v, null, 2)
    .replace(/"([a-zA-Z_][a-zA-Z0-9_]*)"\s*:/g, '$1:')   // unquote keys
    .replace(/"/g, "'")                                    // single quotes

  const lines = [
    `// ─────────────────────────────────────────────────────────────`,
    `// MAP — ${data.name}`,
    `// ${data.desc}`,
    `// Difficulty ${'★'.repeat(data.difficulty ?? 1)}  |  ${(data.objectives ?? []).length} objectives`,
    `// ─────────────────────────────────────────────────────────────`,
    `export default ${esc(data)}`,
  ]
  return lines.join('\n')
}
