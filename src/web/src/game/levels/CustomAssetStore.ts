// ─────────────────────────────────────────────────────────────
// CustomAssetStore — localStorage CRUD for user-created assets
// ─────────────────────────────────────────────────────────────
const KEY = 'heist_custom_assets'

function _load() {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') }
  catch { return [] }
}
function _save(arr) {
  localStorage.setItem(KEY, JSON.stringify(arr))
}

export function listCustomAssets() {
  return _load()
}

export function saveCustomAsset(data) {
  const arr = _load()
  const idx = arr.findIndex(a => a.id === data.id)
  const entry = { ...data, savedAt: Date.now() }
  if (idx >= 0) arr[idx] = entry
  else arr.push(entry)
  _save(arr)
  return data.id
}

export function loadCustomAsset(id) {
  return _load().find(a => a.id === id) ?? null
}

export function deleteCustomAsset(id) {
  _save(_load().filter(a => a.id !== id))
}

/** Resolve a 'custom:<uuid>' type string to its asset definition. */
export function resolveCustomAsset(typeStr) {
  if (!typeStr.startsWith('custom:')) return null
  return loadCustomAsset(typeStr.slice(7))
}
