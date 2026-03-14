/**
 * Generic undo/redo stack for a Vue reactive object.
 *
 * @param {object}   levelData    — the reactive object to snapshot
 * @param {function} onAfterApply — called after each snapshot is applied (e.g. clear selection)
 */
export function useUndoRedo(levelData, onAfterApply) {
  const undoStack = []
  const redoStack = []
  const MAX_UNDO  = 30

  function pushSnapshot() {
    undoStack.push(JSON.stringify(levelData))
    if (undoStack.length > MAX_UNDO) undoStack.shift()
    redoStack.length = 0
  }

  function _applySnapshot(snap) {
    Object.keys(snap).forEach(k => {
      if (Array.isArray(snap[k]) && Array.isArray(levelData[k])) {
        levelData[k].length = 0
        levelData[k].push(...snap[k])
      } else {
        levelData[k] = snap[k]
      }
    })
    onAfterApply?.()
  }

  function undo() {
    if (!undoStack.length) return
    redoStack.push(JSON.stringify(levelData))
    _applySnapshot(JSON.parse(undoStack.pop()))
  }

  function redo() {
    if (!redoStack.length) return
    undoStack.push(JSON.stringify(levelData))
    _applySnapshot(JSON.parse(redoStack.pop()))
  }

  return { pushSnapshot, undo, redo, undoStack, redoStack }
}
