import { ref, reactive, computed } from 'vue'
import { useUndoRedo } from './useUndoRedo.ts'
import { compileGraph } from '../game/levels/graphCompiler.ts'
import { decompileToGraph } from '../game/levels/graphDecompiler.ts'

export function useLevelData() {
  // ── Factory ───────────────────────────────────────────────────
  function makeEmpty() {
    return {
      id:           crypto.randomUUID(),
      name:         'My Heist',
      desc:         '',
      difficulty:   2,
      vehicle:      'van',
      bagColor:     0x3a2800,
      playerStart:  null,
      escape:       null,
      floors:       [],
      walls:        [],
      props:        [],
      lights:       [],
      bags:         [],
      zones:        [],
      doors:        [],
      cameras:      [],
      pillars:      [],
      spawnPoints:  [],
      patrolRoutes: [],
      civilianTheme: 'default',
      civilianCount: 0,
      employeeCount: 0,
      vehicleAngle: 0,
      drill:        null,
      graph:        { nodes: [], edges: [] },
    }
  }

  const levelData  = reactive(makeEmpty())
  const selectedId = ref(null)

  const { pushSnapshot, undo, redo, undoStack, redoStack } = useUndoRedo(
    levelData,
    () => { selectedId.value = null },
  )

  // ── Output format conversion ──────────────────────────────────
  function toOutputFormat(ld) {
    return {
      id:           ld.id,
      name:         ld.name,
      desc:         ld.desc,
      difficulty:   ld.difficulty,
      vehicle:      ld.vehicle,
      bagColor:     ld.bagColor,
      playerStart:  ld.playerStart ? [...ld.playerStart] : [0, 0],
      lights:       ld.lights.map(l => [...l]),
      floors:       ld.floors.map(f => ({ ...f })),
      walls:        ld.walls.map(w => ({ ...w })),
      props:        ld.props.map(p => ({ ...p })),
      zones:        ld.zones.map(z => ({ ...z })),
      doors:        ld.doors.map(d => ({ ...d })),
      objectives:   ld.bags.map(b => [...b]),
      escape:       ld.escape ? [...ld.escape] : [0, -20, 2.5],
      cameras:      ld.cameras.map(c => ({ ...c })),
      pillars:      ld.pillars.map(p => ({ ...p })),
      spawnPoints:  ld.spawnPoints.map(s => [...s]),
      patrolRoutes: ld.patrolRoutes.map(r => r.map(p => [...p])),
      civilianTheme: ld.civilianTheme !== 'default' ? ld.civilianTheme : undefined,
      civilianCount: ld.civilianCount || undefined,
      employeeCount: ld.employeeCount || undefined,
      vehicleAngle:  ld.vehicleAngle || undefined,
      drill:         ld.drill ? { ...ld.drill } : undefined,
      graph:        { nodes: ld.graph.nodes.map(n => ({ ...n, fields: { ...n.fields } })),
                      edges: ld.graph.edges.map(e => ({ ...e })) },
      interactables: compileGraph(ld.graph),
    }
  }

  const levelOutput = computed(() => toOutputFormat(levelData))

  // ── Element key map ───────────────────────────────────────────
  const ARRAY_KEY = {
    floor: 'floors', wall: 'walls', zone: 'zones', door: 'doors',
    prop: 'props', light: 'lights', bag: 'bags', spawn: 'spawnPoints',
    camera: 'cameras', pillar: 'pillars',
  }

  // ── Add element ───────────────────────────────────────────────
  function onAdd({ kind, data }) {
    switch (kind) {
      case 'floor':       levelData.floors.push(data); break
      case 'wall':        levelData.walls.push(data); break
      case 'zone':        levelData.zones.push(data); break
      case 'door':        levelData.doors.push(data); break
      case 'prop':        levelData.props.push(data); break
      case 'light':       levelData.lights.push(data); break
      case 'bag':         levelData.bags.push(data); break
      case 'spawn':       levelData.spawnPoints.push(data); break
      case 'camera':      levelData.cameras.push(data); break
      case 'pillar':      levelData.pillars.push(data); break
      case 'patrol':      levelData.patrolRoutes.push(data); break
      case 'playerStart': levelData.playerStart = data; break
      case 'escape':      levelData.escape = data; break
    }
  }

  // ── Move element ──────────────────────────────────────────────
  function onMove({ hit, dx, dz }) {
    const { type, idx } = hit
    if (type === 'playerStart' && levelData.playerStart) {
      levelData.playerStart[0] = +(levelData.playerStart[0] + dx).toFixed(2)
      levelData.playerStart[1] = +(levelData.playerStart[1] + dz).toFixed(2)
      return
    }
    if (type === 'escape' && levelData.escape) {
      levelData.escape[0] = +(levelData.escape[0] + dx).toFixed(2)
      levelData.escape[1] = +(levelData.escape[1] + dz).toFixed(2)
      return
    }
    const arrKey = ARRAY_KEY[type]
    if (!arrKey) return
    const el = levelData[arrKey][idx]
    if (el === undefined) return
    if (Array.isArray(el)) {
      el[0] = +(el[0] + dx).toFixed(2)
      if (type === 'light') el[2] = +(el[2] + dz).toFixed(2)
      else el[1] = +(el[1] + dz).toFixed(2)
    } else {
      el.x = +(el.x + dx).toFixed(2)
      el.z = +(el.z + dz).toFixed(2)
    }
  }

  // ── Remove element ────────────────────────────────────────────
  function _removeByTypeIdx(type, idx) {
    if (type === 'playerStart') { levelData.playerStart = null; return }
    if (type === 'escape')      { levelData.escape      = null; return }
    const arrKey = ARRAY_KEY[type]
    if (!arrKey) return
    levelData[arrKey].splice(idx, 1)
  }

  function onRemove(elemId) {
    const parts = String(elemId).split('_')
    const type  = parts[0]
    const idx   = parseInt(parts[1] ?? '0')
    _removeByTypeIdx(type, idx)
  }

  function onRemoveSelected() {
    if (!selectedId.value) return
    pushSnapshot()
    onRemove(selectedId.value)
    selectedId.value = null
  }

  // ── Deep update from Properties panel ────────────────────────
  function onUpdate({ path, val }) {
    let obj = levelData
    for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]]
    obj[path[path.length - 1]] = val
  }

  // ── 3D prop placement ─────────────────────────────────────────
  function onPlaceProp({ type, x, z }) {
    pushSnapshot()
    levelData.props.push({ type, x: +x.toFixed(2), z: +z.toFixed(2) })
  }

  function onRemoveProp({ idx }) {
    if (idx < 0 || idx >= levelData.props.length) return
    pushSnapshot()
    levelData.props.splice(idx, 1)
  }

  // ── Danger zone ops ───────────────────────────────────────────
  function clearAll() {
    // eslint-disable-next-line no-alert
    if (!confirm('Clear all elements? This cannot be undone.')) return
    pushSnapshot()
    levelData.floors = []; levelData.walls = []; levelData.zones = []
    levelData.doors  = []; levelData.props = []; levelData.lights = []
    levelData.bags   = []; levelData.spawnPoints = []; levelData.patrolRoutes = []
    levelData.cameras = []; levelData.pillars = []
    levelData.playerStart = null; levelData.escape = null
    levelData.graph.nodes = []; levelData.graph.edges = []
    selectedId.value = null
  }

  function newLevel() {
    // eslint-disable-next-line no-alert
    if (!confirm('Create a new level? Unsaved changes will be lost.')) return
    const fresh = makeEmpty()
    Object.assign(levelData, fresh)
    levelData.floors = []; levelData.walls = []; levelData.zones = []
    levelData.doors  = []; levelData.props = []; levelData.lights = []
    levelData.bags   = []; levelData.spawnPoints = []; levelData.patrolRoutes = []
    levelData.cameras = []; levelData.pillars = []
    levelData.playerStart = null; levelData.escape = null
    levelData.graph.nodes = []; levelData.graph.edges = []
    undoStack.length = 0; redoStack.length = 0
    selectedId.value = null
  }

  // ── Load existing level into builder ─────────────────────────
  function loadLevel(data: any) {
    // eslint-disable-next-line no-alert
    if (levelData.floors.length || levelData.walls.length) {
      if (!confirm('Load level? Current unsaved changes will be lost.')) return false
    }

    // Metadata
    levelData.id         = data.id ?? crypto.randomUUID()
    levelData.name       = data.name ?? 'Untitled'
    levelData.desc       = data.desc ?? ''
    levelData.difficulty = data.difficulty ?? 2
    levelData.vehicle    = data.vehicle ?? 'van'
    levelData.bagColor   = data.bagColor ?? 0x3a2800

    // Arrays — deep copy
    levelData.floors       = (data.floors ?? []).map(f => ({ ...f }))
    levelData.walls        = (data.walls ?? []).map(w => ({ ...w }))
    levelData.props        = (data.props ?? []).map(p => ({ ...p }))
    levelData.lights       = (data.lights ?? []).map(l => [...l])
    levelData.zones        = (data.zones ?? []).map(z => ({ ...z }))
    levelData.doors        = (data.doors ?? []).map(d => ({ ...d }))
    levelData.cameras      = (data.cameras ?? []).map(c => ({ ...c }))
    levelData.pillars      = (data.pillars ?? []).map(p => ({ ...p }))
    levelData.spawnPoints  = (data.spawnPoints ?? []).map(s => [...s])
    levelData.patrolRoutes = (data.patrolRoutes ?? []).map(r => r.map(p => [...p]))

    // Settings
    levelData.civilianTheme = data.civilianTheme ?? 'default'
    levelData.civilianCount = data.civilianCount ?? 0
    levelData.employeeCount = data.employeeCount ?? 0
    levelData.vehicleAngle  = data.vehicleAngle ?? 0
    levelData.drill         = data.drill ? { ...data.drill } : null

    // Bags: builder uses 'bags', maps use 'objectives'
    levelData.bags = (data.bags ?? data.objectives ?? []).map(b => [...b])

    // Singletons
    levelData.playerStart = data.playerStart ? [...data.playerStart] : null
    levelData.escape      = data.escape ? [...data.escape] : null

    // Graph: prefer stored graph (custom saves), else decompile interactables
    if (data.graph?.nodes?.length) {
      levelData.graph.nodes = data.graph.nodes.map(n => ({ ...n, fields: { ...n.fields } }))
      levelData.graph.edges = data.graph.edges.map(e => ({ ...e }))
    } else if (data.interactables?.length) {
      const g = decompileToGraph(data.interactables)
      levelData.graph.nodes = g.nodes
      levelData.graph.edges = g.edges
    } else {
      levelData.graph.nodes = []
      levelData.graph.edges = []
    }

    // Reset undo/redo + selection
    undoStack.length = 0
    redoStack.length = 0
    selectedId.value = null
    return true
  }

  return {
    levelData, levelOutput, selectedId, makeEmpty, toOutputFormat,
    pushSnapshot, undo, redo,
    onAdd, onMove, onRemove, onRemoveSelected, onUpdate,
    onPlaceProp, onRemoveProp, clearAll, newLevel, loadLevel,
  }
}
