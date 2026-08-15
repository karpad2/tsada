<template>
  <div class="canvas-wrap">
    <canvas
      ref="canvas"
      class="editor-canvas"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @wheel.prevent="onWheel"
      @contextmenu.prevent
      @keydown="onKey"
      tabindex="0"
    />
    <div class="status-bar">
      <span>{{ mouseInfo }}</span>
      <span class="shortcut-hints">R:rotate  Del:delete  Ctrl+C/V:copy/paste  Ctrl+D:duplicate  Ctrl+Z:undo</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useCanvas2DViewport } from '../../composables/useCanvas2DViewport.ts'

const props = defineProps({
  levelData:    { type: Object, required: true },
  activeTool:   { type: String, default: 'SELECT' },
  subTool:      { type: String, default: null },   // e.g. prop type
  zoneType:     { type: String, default: 'public' },
  doorType:     { type: String, default: 'normal' },
  selectedId:   { type: [String, Number], default: null },
  layers:       { type: Object, default: () => ({
    floors: true, walls: true, zones: true, doors: true, props: true,
    lights: true, cameras: true, spawns: true, bags: true, pillars: true, grid: true,
  }) },
})
const emit = defineEmits([
  'update:selectedId',
  'addElement',
  'moveElement',
  'removeElement',
  'snapshot',        // request undo snapshot before mutation
  'undo',
  'redo',
  'wallGlass',       // toggle glass on a wall (WINDOW tool)
])

// ── Canvas state ─────────────────────────────────────────────
const canvas = ref(null)
let ctx = null

// ── Viewport (pan / zoom / coordinate helpers) ────────────────
const { vp, toScreen, toWorld, rectFromDrag, applyWheel, initPan } = useCanvas2DViewport()

// ── Interaction state ─────────────────────────────────────────
let isDragging  = false
let isPanning   = false
let dragStart   = null   // { wx, wz, sx, sy }
let previewRect = null   // { x1, z1, x2, z2 } world coords during drag
let spawnFirst  = null   // first spawn point for patrol pair
let hoverSnap   = null   // wall-snap preview for DOOR/CAMERA/WINDOW tools
let clipboard   = null   // { type, data } for copy/paste
let lastMouseWorld = { x: 0, z: 0 }  // track mouse world pos for paste location
const mouseInfo  = ref('X: 0  Z: 0')

// ── Hit-test helpers ──────────────────────────────────────────
function ptInRect(wx, wz, el) {
  return (
    Math.abs(wx - el.x) <= el.w / 2 + 0.3 &&
    Math.abs(wz - el.z) <= (el.d ?? el.w) / 2 + 0.3
  )
}

// Edge resize: detect if cursor is near edge of a wall/zone/floor
// Returns 'n'|'s'|'e'|'w' or null — picks the closest edge if within margin
function hitEdge(wx, wz, el) {
  const hw = el.w / 2, hd = (el.d ?? el.w) / 2
  const dx = wx - el.x, dz = wz - el.z
  // Must be within the element bounds (plus small outer margin)
  const outerMargin = 0.6
  if (Math.abs(dx) > hw + outerMargin || Math.abs(dz) > hd + outerMargin) return null

  // Distance to each edge
  const distN = Math.abs(dz - hd)
  const distS = Math.abs(dz + hd)
  const distE = Math.abs(dx - hw)
  const distW = Math.abs(dx + hw)

  // Edge hit zone: for thin elements use up to half the dimension, for large ones cap at 0.6
  const edgeW = Math.min(0.6, hw * 0.5)
  const edgeD = Math.min(0.6, hd * 0.5)

  // Find closest edge, but only if cursor is in the edge zone (not in center)
  const candidates = []
  if (distN < edgeD + outerMargin && Math.abs(dx) <= hw + outerMargin) candidates.push({ id: 'n', dist: distN })
  if (distS < edgeD + outerMargin && Math.abs(dx) <= hw + outerMargin) candidates.push({ id: 's', dist: distS })
  if (distE < edgeW + outerMargin && Math.abs(dz) <= hd + outerMargin) candidates.push({ id: 'e', dist: distE })
  if (distW < edgeW + outerMargin && Math.abs(dz) <= hd + outerMargin) candidates.push({ id: 'w', dist: distW })

  if (!candidates.length) return null
  candidates.sort((a, b) => a.dist - b.dist)
  // Only trigger if closest edge is actually close (not in the middle)
  const best = candidates[0]
  const maxDist = (best.id === 'n' || best.id === 's') ? edgeD + outerMargin : edgeW + outerMargin
  return best.dist <= maxDist ? best.id : null
}
function nearPt(wx, wz, px, pz, r = 0.7) {
  const dx = wx - px, dz = wz - pz
  return Math.sqrt(dx * dx + dz * dz) < r
}
function hitTest(wx, wz) {
  const ld = props.levelData
  const L = props.layers
  // Check reverse order (top-drawn elements first), skip hidden layers
  if (ld.escape && nearPt(wx, wz, ld.escape[0], ld.escape[1], ld.escape[2] ?? 2.5))
    return { type: 'escape', data: ld.escape }
  if (L.spawns && ld.playerStart && nearPt(wx, wz, ld.playerStart[0], ld.playerStart[1]))
    return { type: 'playerStart', data: ld.playerStart }
  if (L.spawns) for (let i = ld.spawnPoints.length - 1; i >= 0; i--)
    if (nearPt(wx, wz, ld.spawnPoints[i][0], ld.spawnPoints[i][1]))
      return { type: 'spawn', idx: i, data: ld.spawnPoints[i] }
  if (L.bags) for (let i = ld.bags.length - 1; i >= 0; i--)
    if (nearPt(wx, wz, ld.bags[i][0], ld.bags[i][1]))
      return { type: 'bag', idx: i, data: ld.bags[i] }
  if (L.cameras) for (let i = (ld.cameras ?? []).length - 1; i >= 0; i--)
    if (nearPt(wx, wz, ld.cameras[i].x, ld.cameras[i].z, 0.8))
      return { type: 'camera', idx: i, data: ld.cameras[i] }
  if (L.pillars) for (let i = (ld.pillars ?? []).length - 1; i >= 0; i--)
    if (nearPt(wx, wz, ld.pillars[i].x, ld.pillars[i].z, 0.5))
      return { type: 'pillar', idx: i, data: ld.pillars[i] }
  if (L.lights) for (let i = ld.lights.length - 1; i >= 0; i--)
    if (nearPt(wx, wz, ld.lights[i][0], ld.lights[i][2]))
      return { type: 'light', idx: i, data: ld.lights[i] }
  if (L.props) for (let i = ld.props.length - 1; i >= 0; i--) {
    const p = ld.props[i]
    const [pw, pd] = _propSize(p)
    const pdx = wx - p.x, pdz = wz - p.z
    const rc = Math.cos(p.rotY || 0), rs = Math.sin(p.rotY || 0)
    const lx = pdx * rc + pdz * rs, lz = -pdx * rs + pdz * rc
    if (Math.abs(lx) <= pw / 2 + 0.3 && Math.abs(lz) <= pd / 2 + 0.3)
      return { type: 'prop', idx: i, data: p }
  }
  if (L.doors) for (let i = ld.doors.length - 1; i >= 0; i--)
    if (nearPt(wx, wz, ld.doors[i].x, ld.doors[i].z, 0.8))
      return { type: 'door', idx: i, data: ld.doors[i] }
  if (L.zones) for (let i = ld.zones.length - 1; i >= 0; i--)
    if (ptInRect(wx, wz, ld.zones[i]))
      return { type: 'zone', idx: i, data: ld.zones[i] }
  if (L.walls) for (let i = ld.walls.length - 1; i >= 0; i--)
    if (ptInRect(wx, wz, ld.walls[i]))
      return { type: 'wall', idx: i, data: ld.walls[i] }
  if (L.floors) for (let i = ld.floors.length - 1; i >= 0; i--)
    if (ptInRect(wx, wz, ld.floors[i]))
      return { type: 'floor', idx: i, data: ld.floors[i] }
  return null
}

// ── Mouse events ──────────────────────────────────────────────
function onMouseDown(e) {
  canvas.value.focus()
  const rect = canvas.value.getBoundingClientRect()
  const sx = e.clientX - rect.left, sy = e.clientY - rect.top

  if (e.button === 2 || (e.button === 0 && e.altKey)) {
    isPanning = true
    dragStart = { sx, sy, panX0: vp.panX, panY0: vp.panY }
    return
  }
  if (e.button !== 0) return

  const snap = 1
  const { wx, wz } = toWorld(sx, sy, snap)
  isDragging = true
  dragStart  = { wx, wz, sx, sy }
  previewRect = null

  if (props.activeTool === 'SELECT') {
    // Check for edge resize on selected element first — use fine snap
    const { wx: fwx, wz: fwz } = toWorld(sx, sy, 0.1)
    if (props.selectedId) {
      const [sType, sIdx] = props.selectedId.split('_')
      const idx = parseInt(sIdx)
      const ld = props.levelData
      const arrKey = { wall: 'walls', floor: 'floors', zone: 'zones' }[sType]
      if (arrKey && ld[arrKey][idx]) {
        const edge = hitEdge(fwx, fwz, ld[arrKey][idx])
        if (edge) {
          emit('snapshot')
          dragStart = { wx: fwx, wz: fwz, sx, sy }
          dragStart.resize = { type: sType, idx, edge, el: ld[arrKey][idx] }
          dragStart.origX = ld[arrKey][idx].x
          dragStart.origZ = ld[arrKey][idx].z
          dragStart.origW = ld[arrKey][idx].w
          dragStart.origD = ld[arrKey][idx].d
          return
        }
      }
    }
    const hit = hitTest(wx, wz)
    emit('update:selectedId', hit ? `${hit.type}_${hit.idx ?? 0}` : null)
    if (hit) dragStart.hit = hit
  }
}

function onMouseMove(e) {
  const rect = canvas.value.getBoundingClientRect()
  const sx = e.clientX - rect.left, sy = e.clientY - rect.top

  if (isPanning && dragStart) {
    vp.panX = dragStart.panX0 + (sx - dragStart.sx)
    vp.panY = dragStart.panY0 + (sy - dragStart.sy)
    draw(); return
  }
  if (!isDragging || !dragStart) {
    const { wx: mwx, wz: mwz } = toWorld(sx, sy, 0.1)
    lastMouseWorld = { x: mwx, z: mwz }
    mouseInfo.value = `X: ${mwx.toFixed(1)}  Z: ${mwz.toFixed(1)}`
    _updateHoverSnap(sx, sy)
    // Update cursor for edge resize hints
    if (props.activeTool === 'SELECT' && props.selectedId) {
      const { wx: hw, wz: hz } = toWorld(sx, sy, 0.5)
      const [sType, sIdx] = props.selectedId.split('_')
      const arrKey = { wall: 'walls', floor: 'floors', zone: 'zones' }[sType]
      const el = arrKey && props.levelData[arrKey]?.[parseInt(sIdx)]
      if (el) {
        const edge = hitEdge(hw, hz, el)
        canvas.value.style.cursor = edge === 'n' || edge === 's' ? 'ns-resize'
          : edge === 'e' || edge === 'w' ? 'ew-resize' : ''
      } else {
        canvas.value.style.cursor = ''
      }
    } else {
      canvas.value.style.cursor = ''
    }
    draw(); return
  }

  const tool = props.activeTool
  const isResize = tool === 'SELECT' && dragStart.resize
  const snap = isResize ? 0.1 : (tool === 'PROP' || tool === 'DOOR') ? 0.5 : 1
  const { wx, wz } = toWorld(sx, sy, snap)

  if (['FLOOR', 'WALL', 'ZONE', 'ESCAPE'].includes(tool)) {
    previewRect = { x1: dragStart.wx, z1: dragStart.wz, x2: wx, z2: wz }
  }
  // Edge resize drag
  if (tool === 'SELECT' && dragStart.resize) {
    const r = dragStart.resize
    const el = r.el
    const dx = wx - dragStart.wx, dz = wz - dragStart.wz
    if (r.edge === 'e') {
      const newW = Math.max(0.2, dragStart.origW + dx)
      el.w = +newW.toFixed(1)
      el.x = +(dragStart.origX + (newW - dragStart.origW) / 2).toFixed(2)
    } else if (r.edge === 'w') {
      const newW = Math.max(0.2, dragStart.origW - dx)
      el.w = +newW.toFixed(1)
      el.x = +(dragStart.origX - (newW - dragStart.origW) / 2).toFixed(2)
    } else if (r.edge === 'n') {
      const newD = Math.max(0.2, dragStart.origD + dz)
      el.d = +newD.toFixed(1)
      el.z = +(dragStart.origZ + (newD - dragStart.origD) / 2).toFixed(2)
    } else if (r.edge === 's') {
      const newD = Math.max(0.2, dragStart.origD - dz)
      el.d = +newD.toFixed(1)
      el.z = +(dragStart.origZ - (newD - dragStart.origD) / 2).toFixed(2)
    }
    draw(); return
  }
  if (tool === 'SELECT' && dragStart.hit) {
    const dx = wx - dragStart.wx, dz = wz - dragStart.wz
    const hit = dragStart.hit
    let blocked = false
    if (hit.type === 'prop') {
      const p = hit.data, [pw, pd] = _propSize(p)
      blocked = _rectBlocked(p.x + dx, p.z + dz, pw, pd, p.rotY, { type: 'prop', idx: hit.idx })
    } else if (hit.type === 'pillar') {
      blocked = _rectBlocked(hit.data.x + dx, hit.data.z + dz, 0.5, 0.5, 0, { type: 'pillar', idx: hit.idx })
    } else if (hit.type === 'wall') {
      const w = hit.data
      blocked = _rectBlocked(w.x + dx, w.z + dz, w.w, w.d, 0, { type: 'wall', idx: hit.idx }, true)
    }
    if (!blocked) {
      dragStart.wx = wx; dragStart.wz = wz
      emit('moveElement', { hit, dx, dz })
    }
  }
  draw()
}

function onMouseUp(e) {
  if (isPanning) { isPanning = false; dragStart = null; return }
  if (!isDragging) return
  isDragging = false

  const rect = canvas.value.getBoundingClientRect()
  const sx = e.clientX - rect.left, sy = e.clientY - rect.top
  const tool = props.activeTool
  const snap = (tool === 'PROP' || tool === 'DOOR') ? 0.5 : 1
  const { wx, wz } = toWorld(sx, sy, snap)

  emit('snapshot')   // save undo snapshot before mutation
  const ld = props.levelData

  switch (tool) {
    case 'FLOOR': {
      const r = rectFromDrag(dragStart, { wx, wz })
      if (r.w > 0.5 && r.d > 0.5)
        emit('addElement', { kind: 'floor', data: { ...r, color: 0x9a8a70 } })
      break
    }
    case 'WALL': {
      const r = rectFromDrag(dragStart, { wx, wz })
      const glass = e.shiftKey
      if (r.w > 0.2 || r.d > 0.2) {
        if (r.w < 0.3) r.w = 0.3
        if (r.d < 0.3) r.d = 0.3
        if (!_rectBlocked(r.x, r.z, r.w, r.d, 0, null, true))
          emit('addElement', { kind: 'wall', data: { ...r, color: 0x707070, ...(glass ? { glass: true } : {}) } })
      }
      break
    }
    case 'ZONE': {
      const r = rectFromDrag(dragStart, { wx, wz })
      if (r.w > 0.5 && r.d > 0.5)
        emit('addElement', { kind: 'zone', data: { ...r, type: props.zoneType, label: '' } })
      break
    }
    case 'ESCAPE': {
      const dx = wx - dragStart.wx, dz = wz - dragStart.wz
      const radius = Math.max(1.5, Math.sqrt(dx * dx + dz * dz))
      emit('addElement', { kind: 'escape', data: [+dragStart.wx.toFixed(1), +dragStart.wz.toFixed(1), +radius.toFixed(1)] })
      break
    }
    case 'DOOR': {
      const snap = _snapToWall(wx, wz)
      if (!snap) break
      if (_minDistCheck(snap.doorX, snap.doorZ, 1.5, ld.doors, -1)) break
      emit('addElement', { kind: 'door', data: {
        x: +snap.doorX.toFixed(1), z: +snap.doorZ.toFixed(1),
        angle: snap.doorAngle, type: props.doorType, w: 1.2,
      }})
      break
    }
    case 'LIGHT':
      emit('addElement', { kind: 'light', data: [+wx.toFixed(1), 3.2, +wz.toFixed(1)] })
      break
    case 'BAG':
      if (!_insideWall(wx, wz, 0.2))
        emit('addElement', { kind: 'bag', data: [+wx.toFixed(1), +wz.toFixed(1)] })
      break
    case 'PROP':
      if (props.subTool) {
        const pType = props.subTool
        const [pw, pd] = _propSize({ type: pType })
        if (!_rectBlocked(wx, wz, pw, pd, 0))
          emit('addElement', { kind: 'prop', data: { type: pType, x: +wx.toFixed(1), z: +wz.toFixed(1) } })
      }
      break
    case 'SPAWN': {
      if (_insideWall(wx, wz, 0.3)) break
      const pt = [+wx.toFixed(1), +wz.toFixed(1)]
      if (!spawnFirst) {
        spawnFirst = pt
        emit('addElement', { kind: 'spawn', data: pt })
      } else {
        emit('addElement', { kind: 'patrol', data: [spawnFirst, pt] })
        emit('addElement', { kind: 'spawn',  data: pt })
        spawnFirst = null
      }
      break
    }
    case 'CAMERA': {
      const snap = _snapToWall(wx, wz)
      if (!snap) break
      if (_minDistCheck(snap.camX, snap.camZ, 1.0, ld.cameras ?? [], -1)) break
      emit('addElement', { kind: 'camera', data: {
        x: +snap.camX.toFixed(1), z: +snap.camZ.toFixed(1),
        y: 2.8, angle: +snap.camAngle.toFixed(2), range: 8,
      }})
      break
    }
    case 'PILLAR':
      if (!_rectBlocked(wx, wz, 0.5, 0.5, 0))
        emit('addElement', { kind: 'pillar', data: { x: +wx.toFixed(1), z: +wz.toFixed(1) } })
      break
    case 'PLAYER':
      if (!_insideWall(wx, wz, 0.3))
        emit('addElement', { kind: 'playerStart', data: [+wx.toFixed(1), +wz.toFixed(1)] })
      break
    case 'WINDOW': {
      const hit = hitTest(wx, wz)
      if (hit?.type === 'wall') emit('wallGlass', hit.idx)
      break
    }
  }

  previewRect = null
  dragStart   = null
  draw()
}

// ── Wall-snap helpers (doors, cameras, windows mount on walls) ──
function _snapToWall(wx, wz, maxDist = 2.0) {
  const ld = props.levelData
  let best = null, bestDist = Infinity
  for (const w of ld.walls) {
    const halfW = w.w / 2, halfD = w.d / 2
    const cx = Math.max(w.x - halfW, Math.min(w.x + halfW, wx))
    const cz = Math.max(w.z - halfD, Math.min(w.z + halfD, wz))
    const dist = Math.hypot(wx - cx, wz - cz)
    if (dist < bestDist) { bestDist = dist; best = w }
  }
  if (!best || bestDist > maxDist) return null

  const w = best
  const isH = w.w >= w.d  // horizontal (E-W) wall

  // Door: position on wall centerline
  const doorX = isH ? Math.max(w.x - w.w / 2, Math.min(w.x + w.w / 2, wx)) : w.x
  const doorZ = isH ? w.z : Math.max(w.z - w.d / 2, Math.min(w.z + w.d / 2, wz))
  const doorAngle = isH ? 0 : Math.PI / 2

  // Camera: position on wall surface, facing outward
  let camX, camZ, camAngle
  if (isH) {
    camX = Math.max(w.x - w.w / 2, Math.min(w.x + w.w / 2, wx))
    const onNorth = wz > w.z
    camZ = onNorth ? w.z + w.d / 2 : w.z - w.d / 2
    camAngle = onNorth ? 0 : Math.PI
  } else {
    camZ = Math.max(w.z - w.d / 2, Math.min(w.z + w.d / 2, wz))
    const onEast = wx > w.x
    camX = onEast ? w.x + w.w / 2 : w.x - w.w / 2
    camAngle = onEast ? Math.PI / 2 : -Math.PI / 2
  }

  return { wall: w, dist: bestDist, doorX, doorZ, doorAngle, camX, camZ, camAngle }
}

function _updateHoverSnap(screenX, screenY) {
  const tool = props.activeTool
  if (!['DOOR', 'CAMERA', 'WINDOW'].includes(tool)) { hoverSnap = null; return }
  const { wx, wz } = toWorld(screenX, screenY, 0.5)
  if (tool === 'WINDOW') {
    const hit = hitTest(wx, wz)
    hoverSnap = hit?.type === 'wall' ? { wallIdx: hit.idx } : null
  } else {
    const snap = _snapToWall(wx, wz)
    if (snap) {
      hoverSnap = tool === 'DOOR'
        ? { x: snap.doorX, z: snap.doorZ, type: 'door' }
        : { x: snap.camX, z: snap.camZ, type: 'camera' }
    } else {
      hoverSnap = null
    }
  }
}

// ── Collision helpers (prevent overlapping elements) ─────────────
const COLLISION_MARGIN = 0.15

function _rotatedAABB(cx, cz, w, d, angle) {
  const cos = Math.abs(Math.cos(angle || 0))
  const sin = Math.abs(Math.sin(angle || 0))
  const hw = (w * cos + d * sin) / 2
  const hd = (w * sin + d * cos) / 2
  return { minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd }
}

function _boxesOverlap(a, b) {
  return a.minX - COLLISION_MARGIN < b.maxX && a.maxX + COLLISION_MARGIN > b.minX &&
         a.minZ - COLLISION_MARGIN < b.maxZ && a.maxZ + COLLISION_MARGIN > b.minZ
}

// Check if rect (cx, cz, w, d, angle) overlaps any wall/prop/pillar.
// skip = { type, idx } to exclude self during drag.
// skipWalls = true to skip wall-vs-wall checks (walls can overlap each other).
function _rectBlocked(cx, cz, w, d, angle, skip, skipWalls) {
  const ld = props.levelData
  const me = _rotatedAABB(cx, cz, w, d, angle)
  if (!skipWalls) {
    for (let i = 0; i < ld.walls.length; i++) {
      if (skip && skip.type === 'wall' && skip.idx === i) continue
      const wl = ld.walls[i]
      if (_boxesOverlap(me, _rotatedAABB(wl.x, wl.z, wl.w, wl.d, 0))) return true
    }
  }
  for (let i = 0; i < ld.props.length; i++) {
    if (skip && skip.type === 'prop' && skip.idx === i) continue
    const p = ld.props[i]
    const [pw, pd] = _propSize(p)
    if (_boxesOverlap(me, _rotatedAABB(p.x, p.z, pw, pd, p.rotY))) return true
  }
  for (let i = 0; i < (ld.pillars ?? []).length; i++) {
    if (skip && skip.type === 'pillar' && skip.idx === i) continue
    const pl = ld.pillars[i]
    if (_boxesOverlap(me, _rotatedAABB(pl.x, pl.z, 0.5, 0.5, 0))) return true
  }
  return false
}

function _minDistCheck(cx, cz, minDist, items, skipIdx) {
  for (let i = 0; i < items.length; i++) {
    if (i === skipIdx) continue
    const it = items[i]
    if (Math.hypot(cx - (it.x ?? it[0]), cz - (it.z ?? it[1])) < minDist) return true
  }
  return false
}

function _insideWall(cx, cz, radius) {
  for (const wl of props.levelData.walls) {
    const wb = _rotatedAABB(wl.x, wl.z, wl.w, wl.d, 0)
    if (cx + radius > wb.minX && cx - radius < wb.maxX &&
        cz + radius > wb.minZ && cz - radius < wb.maxZ) return true
  }
  return false
}

function onWheel(e) {
  applyWheel(e, canvas.value, draw)
}

function onKey(e) {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (props.selectedId) {
      emit('snapshot')
      emit('removeElement', props.selectedId)
      emit('update:selectedId', null)
    }
  }
  // R = rotate selected element 90° (Shift+R = -90°)
  if (e.key === 'r' || e.key === 'R') {
    if (props.selectedId) {
      const [type, idxStr] = props.selectedId.split('_')
      const idx = parseInt(idxStr)
      const ld = props.levelData
      const step = e.shiftKey ? -Math.PI / 2 : Math.PI / 2
      if (type === 'prop' && ld.props[idx]) {
        emit('snapshot')
        ld.props[idx].rotY = +((ld.props[idx].rotY ?? 0) + step).toFixed(4)
      } else if (type === 'wall' && ld.walls[idx]) {
        // Swap w and d for walls (equivalent to 90° rotation)
        emit('snapshot')
        const w = ld.walls[idx]
        const tmp = w.w; w.w = w.d; w.d = tmp
      } else if (type === 'door' && ld.doors[idx]) {
        emit('snapshot')
        ld.doors[idx].angle = +((ld.doors[idx].angle ?? 0) + step).toFixed(4)
      } else if (type === 'camera' && ld.cameras?.[idx]) {
        emit('snapshot')
        ld.cameras[idx].angle = +((ld.cameras[idx].angle ?? 0) + step).toFixed(2)
      }
    }
  }
  // Ctrl+D = duplicate selected element
  if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
    e.preventDefault()
    if (props.selectedId) {
      const [type, idxStr] = props.selectedId.split('_')
      const idx = parseInt(idxStr)
      const ld = props.levelData
      const arrKey = { wall: 'walls', floor: 'floors', zone: 'zones', prop: 'props',
        door: 'doors', light: 'lights', camera: 'cameras', pillar: 'pillars',
        bag: 'bags', spawn: 'spawnPoints' }[type]
      if (arrKey && ld[arrKey]?.[idx] != null) {
        emit('snapshot')
        const orig = ld[arrKey][idx]
        const copy = JSON.parse(JSON.stringify(orig))
        // Offset the duplicate
        if (Array.isArray(copy)) {
          copy[0] = (copy[0] ?? 0) + 1
        } else if (copy.x != null) {
          copy.x += 1
        }
        ld[arrKey].push(copy)
        const newIdx = ld[arrKey].length - 1
        emit('update:selectedId', `${type}_${newIdx}`)
        draw()
      }
    }
  }
  // Ctrl+C = copy selected element
  if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
    if (props.selectedId) {
      const [type, idxStr] = props.selectedId.split('_')
      const idx = parseInt(idxStr)
      const ld = props.levelData
      const arrKey = { wall: 'walls', floor: 'floors', zone: 'zones', prop: 'props',
        door: 'doors', light: 'lights', camera: 'cameras', pillar: 'pillars',
        bag: 'bags', spawn: 'spawnPoints' }[type]
      if (arrKey && ld[arrKey]?.[idx] != null) {
        const orig = ld[arrKey][idx]
        clipboard = { type, data: JSON.parse(JSON.stringify(orig)) }
      }
    }
  }
  // Ctrl+V = paste at mouse position
  if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
    e.preventDefault()
    if (clipboard) {
      emit('snapshot')
      const ld = props.levelData
      const copy = JSON.parse(JSON.stringify(clipboard.data))
      const mx = +lastMouseWorld.x.toFixed(1)
      const mz = +lastMouseWorld.z.toFixed(1)
      // Move to mouse position
      if (Array.isArray(copy)) {
        copy[0] = mx; copy[1] = mz
      } else if (copy.x != null) {
        copy.x = mx; copy.z = mz
      }
      const arrKey = { wall: 'walls', floor: 'floors', zone: 'zones', prop: 'props',
        door: 'doors', light: 'lights', camera: 'cameras', pillar: 'pillars',
        bag: 'bags', spawn: 'spawnPoints' }[clipboard.type]
      if (arrKey) {
        ld[arrKey].push(copy)
        const newIdx = ld[arrKey].length - 1
        emit('update:selectedId', `${clipboard.type}_${newIdx}`)
        draw()
      }
    }
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault(); emit('undo')
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
    e.preventDefault(); emit('redo')
  }
}

// ── Draw ──────────────────────────────────────────────────────
function draw() {
  if (!ctx) return
  const W = canvas.value.width, H = canvas.value.height
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#111'
  ctx.fillRect(0, 0, W, H)

  const L = props.layers
  if (L.grid) _drawGrid()

  const ld = props.levelData
  if (L.floors) ld.floors.forEach((f, i)  => _drawFloor(f, i))
  if (L.zones) ld.zones.forEach((z, i)   => _drawZone(z, i))
  if (L.walls) ld.walls.forEach((w, i)   => _drawWall(w, i))
  if (L.doors) ld.doors.forEach((d, i)   => _drawDoor(d, i))
  if (L.lights) ld.lights.forEach((l, i)  => _drawLight(l, i))
  if (L.props) ld.props.forEach((p, i)   => _drawProp(p, i))
  if (L.cameras) (ld.cameras ?? []).forEach((c, i) => _drawCamera(c, i))
  if (L.pillars) (ld.pillars ?? []).forEach((p, i) => _drawPillar(p, i))
  if (L.bags) ld.bags.forEach((b, i)    => _drawBag(b, i))
  if (L.spawns) ld.patrolRoutes.forEach((r, i) => _drawPatrol(r, i))
  if (L.spawns) ld.spawnPoints.forEach((s, i)  => _drawSpawn(s, i))
  if (L.spawns && ld.playerStart) _drawPlayer(ld.playerStart)
  if (ld.escape)      _drawEscape(ld.escape)
  if (previewRect)    _drawPreview()
  if (spawnFirst)     _drawSpawnFirst()
  if (hoverSnap)      _drawSnapPreview()
}

// ── Grid ──────────────────────────────────────────────────────
function _drawGrid() {
  const W = canvas.value.width, H = canvas.value.height
  const minX = Math.floor((-vp.panX) / vp.scale) - 1
  const maxX = Math.ceil((W - vp.panX) / vp.scale) + 1
  const minZ = Math.floor((vp.panY - H) / vp.scale) - 1
  const maxZ = Math.ceil(vp.panY / vp.scale) + 1

  ctx.lineWidth = 0.5
  for (let wx = minX; wx <= maxX; wx++) {
    const sx = vp.panX + wx * vp.scale
    ctx.strokeStyle = wx % 5 === 0 ? '#444' : '#222'
    ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke()
    if (wx % 5 === 0 && vp.scale > 20) {
      ctx.fillStyle = '#555'; ctx.font = '10px monospace'
      ctx.fillText(wx, sx + 2, vp.panY + 12)
    }
  }
  for (let wz = minZ; wz <= maxZ; wz++) {
    const sy = vp.panY - wz * vp.scale
    ctx.strokeStyle = wz % 5 === 0 ? '#444' : '#222'
    ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke()
    if (wz % 5 === 0 && vp.scale > 20) {
      ctx.fillStyle = '#555'; ctx.font = '10px monospace'
      ctx.fillText(wz, vp.panX + 3, sy - 2)
    }
  }
  // Origin cross
  ctx.strokeStyle = '#666'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(vp.panX - 10, vp.panY); ctx.lineTo(vp.panX + 10, vp.panY)
  ctx.moveTo(vp.panX, vp.panY - 10); ctx.lineTo(vp.panX, vp.panY + 10); ctx.stroke()
}

function _selId(type, idx) { return `${type}_${idx ?? 0}` }
function _isSel(type, idx) { return props.selectedId === _selId(type, idx) }

// ── Floors ────────────────────────────────────────────────────
function _drawFloor(f, i) {
  const { sx: x, sy: y } = toScreen(f.x - f.w / 2, f.z + f.d / 2)
  const pw = f.w * vp.scale, ph = f.d * vp.scale
  ctx.fillStyle = 'rgba(120,100,70,0.18)'
  ctx.fillRect(x, y, pw, ph)
  ctx.strokeStyle = 'rgba(120,100,70,0.3)'; ctx.lineWidth = 0.5
  ctx.strokeRect(x, y, pw, ph)
  if (_isSel('floor', i)) {
    ctx.strokeStyle = '#ffa030'; ctx.lineWidth = 2; ctx.setLineDash([4, 3])
    ctx.strokeRect(x, y, pw, ph); ctx.setLineDash([])
  }
}

// ── Zones ─────────────────────────────────────────────────────
const ZONE_COLORS = { public: '#22aa22', private: '#aaaa00', secure: '#aa2222' }
function _drawZone(z, i) {
  const { sx: x, sy: y } = toScreen(z.x - z.w / 2, z.z + z.d / 2)
  const pw = z.w * vp.scale, ph = z.d * vp.scale
  const col = ZONE_COLORS[z.type] ?? '#888'
  ctx.fillStyle = col + '11'
  ctx.fillRect(x, y, pw, ph)
  ctx.strokeStyle = col + '55'; ctx.lineWidth = 1; ctx.setLineDash([6, 4])
  ctx.strokeRect(x + 1, y + 1, pw - 2, ph - 2); ctx.setLineDash([])
  if (z.label && vp.scale > 15) {
    ctx.fillStyle = col; ctx.font = `bold ${Math.min(14, vp.scale * 0.35)}px monospace`
    ctx.textAlign = 'center'
    ctx.fillText(z.label || z.type.toUpperCase(), x + pw / 2, y + ph / 2)
    ctx.textAlign = 'left'
  }
  if (_isSel('zone', i)) {
    ctx.strokeStyle = '#ffa030'; ctx.lineWidth = 2; ctx.setLineDash([4, 3])
    ctx.strokeRect(x, y, pw, ph); ctx.setLineDash([])
  }
}

// ── Walls ─────────────────────────────────────────────────────
function _drawWall(w, i) {
  const { sx: x, sy: y } = toScreen(w.x - w.w / 2, w.z + w.d / 2)
  const pw = w.w * vp.scale, ph = w.d * vp.scale
  if (w.window) {
    // Solid wall with cyan glass center stripe
    ctx.fillStyle = '#555'; ctx.fillRect(x, y, pw, ph)
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1
    ctx.strokeRect(x, y, pw, ph)
    // Glass center indicator
    const frameR = (w.windowFrame ?? 0.3) / (w.w >= w.d ? w.w : w.d)
    const isH = w.w >= w.d
    if (isH) {
      const fx = pw * frameR, gw = pw - fx * 2
      ctx.fillStyle = 'rgba(136,204,238,0.45)'
      ctx.fillRect(x + fx, y, gw, ph)
    } else {
      const fz = ph * frameR, gh = ph - fz * 2
      ctx.fillStyle = 'rgba(136,204,238,0.45)'
      ctx.fillRect(x, y + fz, pw, gh)
    }
  } else if (w.glass) {
    ctx.fillStyle = 'rgba(136,204,238,0.35)'
    ctx.fillRect(x, y, pw, ph)
    ctx.strokeStyle = 'rgba(136,204,238,0.8)'; ctx.lineWidth = 1.5
    ctx.setLineDash([5, 3]); ctx.strokeRect(x, y, pw, ph); ctx.setLineDash([])
  } else {
    ctx.fillStyle = w.breachable ? '#885522' : w.destructible ? '#664433' : '#555'; ctx.fillRect(x, y, pw, ph)
    ctx.strokeStyle = w.breachable ? 'rgba(255,160,40,0.8)' : w.destructible ? 'rgba(255,80,40,0.6)' : 'rgba(255,255,255,0.2)'
    ctx.lineWidth = w.breachable ? 2 : 1
    if (w.destructible || w.breachable) ctx.setLineDash([3, 3])
    ctx.strokeRect(x, y, pw, ph)
    if (w.destructible || w.breachable) ctx.setLineDash([])
  }
  if (_isSel('wall', i)) {
    ctx.strokeStyle = '#ffa030'; ctx.lineWidth = 2; ctx.setLineDash([4, 3])
    ctx.strokeRect(x, y, pw, ph); ctx.setLineDash([])
    // Size labels on edges
    ctx.fillStyle = '#ffa030'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'
    ctx.fillText(`${w.w}`, x + pw / 2, y - 4)
    ctx.save(); ctx.translate(x - 4, y + ph / 2); ctx.rotate(-Math.PI / 2)
    ctx.fillText(`${w.d}`, 0, 0); ctx.restore()
    ctx.textAlign = 'left'
    // Edge resize handles
    const hR = 3
    ctx.fillStyle = '#ffa030'
    ctx.fillRect(x + pw / 2 - hR, y - hR, hR * 2, hR * 2)            // N
    ctx.fillRect(x + pw / 2 - hR, y + ph - hR, hR * 2, hR * 2)       // S
    ctx.fillRect(x - hR, y + ph / 2 - hR, hR * 2, hR * 2)            // W
    ctx.fillRect(x + pw - hR, y + ph / 2 - hR, hR * 2, hR * 2)       // E
  }
}

// ── Doors ─────────────────────────────────────────────────────
function _drawDoor(d, i) {
  const { sx, sy } = toScreen(d.x, d.z)
  const sw = (d.w ?? 1.2) * vp.scale
  const hingeR = Math.max(3, vp.scale * 0.08)
  ctx.save()
  ctx.translate(sx, sy)
  ctx.rotate(-(d.angle ?? 0))
  const doorColors = { secure: '#aa2222', keycard: '#2244aa', drill: '#cc6600' }
  ctx.fillStyle = doorColors[d.type] ?? '#554433'
  ctx.fillRect(0, -3, sw, 6)
  ctx.restore()
  // Hinge dot
  const hingeColors = { secure: '#ff4444', keycard: '#4488ff', drill: '#ff8800' }
  ctx.fillStyle = hingeColors[d.type] ?? '#ffaa00'
  ctx.beginPath(); ctx.arc(sx, sy, hingeR, 0, Math.PI * 2); ctx.fill()
  if (_isSel('door', i)) {
    ctx.strokeStyle = '#ffa030'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(sx, sy, hingeR + 4, 0, Math.PI * 2); ctx.stroke()
  }
}

// ── Lights ────────────────────────────────────────────────────
function _drawLight(l, i) {
  const { sx, sy } = toScreen(l[0], l[2])
  const r = (l[4] ?? 12) * vp.scale * 0.4  // use actual range
  const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r)
  grad.addColorStop(0, 'rgba(255,240,160,0.06)')
  grad.addColorStop(1, 'rgba(255,240,160,0)')
  ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#ffe090'; ctx.font = `${Math.max(12, vp.scale * 0.4)}px monospace`
  ctx.textAlign = 'center'
  ctx.fillText('☀', sx, sy + 5)
  ctx.textAlign = 'left'
  if (_isSel('light', i)) {
    ctx.strokeStyle = '#ffa030'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.arc(sx, sy, 10, 0, Math.PI * 2); ctx.stroke()
  }
}

// ── Props ─────────────────────────────────────────────────────
const PROP_COLORS = {
  desk: '#5a3a18', crate: '#4a3a18', barrel: '#3a2810', shelf: '#4a2a08',
  safe: '#2a2a2a', server: '#1a2a3a', locker: '#2a2a3a', sofa: '#4a2238',
  table: '#2a4a2a', workbench: '#3a2a10', tank: '#1a3020', console: '#1a1a2a',
  container: '#2a3a1a', displayCase: '#3a3a2a', cargobox: '#4a3a1a', consolepod: '#1a2030',
  cabinet: '#2a2a3a', filecab: '#2a3a4a', pedestal: '#3a3a3a', gurney: '#3a3a3a',
  van: '#1a3a5a', truck: '#2a2a4a', car: '#2a4a2a',
  fuelBarrel: '#cc2222', gasTank: '#2a8a2a', electricPanel: '#555555',
}
// Actual footprint sizes [w, d] for built-in prop types
const PROP_SIZES = {
  desk:        [2.2, 1.0],   crate:      [1.1, 1.1],   barrel:     [0.55, 0.55],
  shelf:       [2.0, 0.4],   counter:    [3.0, 0.6],   safe:       [0.8, 0.6],
  server:      [0.6, 0.8],   locker:     [0.5, 0.4],   sofa:       [2.2, 0.85],
  table:       [1.6, 3.2],   workbench:  [2.8, 0.7],   tank:       [0.86, 0.86],
  console:     [1.4, 0.6],   container:  [2.4, 6.0],   displayCase:[1.0, 0.5],
  cargobox:    [1.6, 1.1],   consolepod: [2.4, 0.8],   cabinet:    [0.6, 0.4],
  filecab:     [0.5, 0.6],   pedestal:   [0.7, 0.7],   gurney:     [0.7, 1.9],
  van:         [2.2, 4.8],   truck:      [2.6, 7.0],   car:        [1.8, 3.8],
  fuelBarrel:  [0.58, 0.58], gasTank:    [0.80, 0.80], electricPanel: [0.70, 0.22],
}
function _propSize(p) {
  if (p.w && p.d) return [p.w, p.d]
  const sz = PROP_SIZES[p.type]
  if (sz) return sz
  return [0.8, 0.8]
}
function _drawProp(p, i) {
  const { sx, sy } = toScreen(p.x, p.z)
  const [fw, fd] = _propSize(p)
  const pw = fw * vp.scale, ph = fd * vp.scale
  const col = PROP_COLORS[p.type] ?? (p.type?.startsWith('custom:') ? '#4a2a4a' : '#3a3030')

  ctx.save()
  ctx.translate(sx, sy)
  if (p.rotY) ctx.rotate(-p.rotY)

  // Filled footprint
  ctx.fillStyle = col
  ctx.fillRect(-pw / 2, -ph / 2, pw, ph)

  // Outline
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1
  ctx.strokeRect(-pw / 2, -ph / 2, pw, ph)

  // Direction indicator (white line on front/+Z edge)
  if (pw > 8 || ph > 8) {
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-pw * 0.3, -ph / 2)
    ctx.lineTo(pw * 0.3, -ph / 2)
    ctx.stroke()
  }

  ctx.restore()

  // Type label (centered, unrotated)
  if (p.type && vp.scale > 18) {
    const label = p.type.startsWith('custom:') ? 'CUST' : p.type.substring(0, 5).toUpperCase()
    ctx.fillStyle = '#ddd'; ctx.font = `${Math.max(8, Math.min(12, vp.scale * 0.2))}px monospace`
    ctx.textAlign = 'center'
    ctx.fillText(label, sx, sy + 4)
    ctx.textAlign = 'left'
  }

  // Selection highlight
  if (_isSel('prop', i)) {
    ctx.save()
    ctx.translate(sx, sy)
    if (p.rotY) ctx.rotate(-p.rotY)
    ctx.strokeStyle = '#ffa030'; ctx.lineWidth = 2; ctx.setLineDash([3, 2])
    ctx.strokeRect(-pw / 2 - 2, -ph / 2 - 2, pw + 4, ph + 4)
    ctx.setLineDash([])
    ctx.restore()
  }
}

// ── Bags ──────────────────────────────────────────────────────
function _drawBag(b, i) {
  const { sx, sy } = toScreen(b[0], b[1])
  const r = Math.max(5, vp.scale * 0.18)
  ctx.save()
  ctx.translate(sx, sy); ctx.rotate(Math.PI / 4)
  ctx.fillStyle = '#7a5010'
  ctx.fillRect(-r, -r, r * 2, r * 2)
  ctx.restore()
  if (vp.scale > 20) {
    ctx.fillStyle = '#ffcc44'; ctx.font = '9px monospace'; ctx.textAlign = 'center'
    ctx.fillText('BAG', sx, sy + r + 10); ctx.textAlign = 'left'
  }
  if (_isSel('bag', i)) {
    ctx.strokeStyle = '#ffa030'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(sx, sy, r + 4, 0, Math.PI * 2); ctx.stroke()
  }
}

// ── Cameras ──────────────────────────────────────────────────
function _drawCamera(c, i) {
  const { sx, sy } = toScreen(c.x, c.z)
  const r = Math.max(6, vp.scale * 0.2)
  const range = (c.range ?? 8) * vp.scale
  const angle = c.angle ?? 0
  const fov = Math.PI / 3  // 60° FOV cone

  // FOV cone
  ctx.fillStyle = 'rgba(100,180,255,0.04)'
  ctx.beginPath()
  ctx.moveTo(sx, sy)
  ctx.arc(sx, sy, range, -angle - fov / 2 + Math.PI / 2, -angle + fov / 2 + Math.PI / 2)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = 'rgba(100,180,255,0.3)'; ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(sx, sy)
  ctx.arc(sx, sy, range, -angle - fov / 2 + Math.PI / 2, -angle + fov / 2 + Math.PI / 2)
  ctx.closePath()
  ctx.stroke()

  // Camera body (small square)
  ctx.fillStyle = '#4488cc'
  ctx.fillRect(sx - r / 2, sy - r / 2, r, r)

  if (vp.scale > 20) {
    ctx.fillStyle = '#88ccff'; ctx.font = '9px monospace'; ctx.textAlign = 'center'
    ctx.fillText('CAM', sx, sy + r + 10); ctx.textAlign = 'left'
  }
  if (_isSel('camera', i)) {
    ctx.strokeStyle = '#ffa030'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(sx, sy, r + 4, 0, Math.PI * 2); ctx.stroke()
  }
}

// ── Pillars ──────────────────────────────────────────────────
function _drawPillar(p, i) {
  const { sx, sy } = toScreen(p.x, p.z)
  const s = Math.max(6, vp.scale * 0.25)
  ctx.fillStyle = '#4a4a4a'
  ctx.fillRect(sx - s / 2, sy - s / 2, s, s)
  ctx.strokeStyle = '#777'; ctx.lineWidth = 1
  ctx.strokeRect(sx - s / 2, sy - s / 2, s, s)
  if (vp.scale > 20) {
    ctx.fillStyle = '#999'; ctx.font = '8px monospace'; ctx.textAlign = 'center'
    ctx.fillText('PIL', sx, sy + s / 2 + 10); ctx.textAlign = 'left'
  }
  if (_isSel('pillar', i)) {
    ctx.strokeStyle = '#ffa030'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(sx, sy, s / 2 + 4, 0, Math.PI * 2); ctx.stroke()
  }
}

// ── Patrol routes ─────────────────────────────────────────────
function _drawPatrol(r, i) {
  const a = r[0], b = r[1]
  const { sx: ax, sy: ay } = toScreen(a[0], a[1])
  const { sx: bx, sy: by } = toScreen(b[0], b[1])
  ctx.strokeStyle = 'rgba(255,100,100,0.5)'; ctx.lineWidth = 1.5
  ctx.setLineDash([5, 4])
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke()
  ctx.setLineDash([])
}

// ── Spawn points ──────────────────────────────────────────────
function _drawSpawn(s, i) {
  const { sx, sy } = toScreen(s[0], s[1])
  const r = Math.max(6, vp.scale * 0.2)
  ctx.fillStyle = '#cc2222'
  ctx.beginPath(); ctx.moveTo(sx, sy - r); ctx.lineTo(sx + r, sy + r); ctx.lineTo(sx - r, sy + r); ctx.closePath(); ctx.fill()
  if (_isSel('spawn', i)) {
    ctx.strokeStyle = '#ffa030'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(sx, sy, r + 4, 0, Math.PI * 2); ctx.stroke()
  }
}

// ── Player start ──────────────────────────────────────────────
function _drawPlayer(ps) {
  const { sx, sy } = toScreen(ps[0], ps[1])
  const r = Math.max(8, vp.scale * 0.25)
  ctx.strokeStyle = '#22cc22'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke()
  ctx.fillStyle = '#22cc22'; ctx.font = `bold ${Math.max(10, vp.scale * 0.3)}px monospace`
  ctx.textAlign = 'center'; ctx.fillText('P', sx, sy + 4); ctx.textAlign = 'left'
}

// ── Escape zone ───────────────────────────────────────────────
function _drawEscape(esc) {
  const { sx, sy } = toScreen(esc[0], esc[1])
  const r = (esc[2] ?? 2.5) * vp.scale
  ctx.strokeStyle = '#22cccc'; ctx.lineWidth = 2; ctx.setLineDash([6, 4])
  ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([])
  ctx.fillStyle = 'rgba(34,204,204,0.12)'
  ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#22cccc'; ctx.font = `bold ${Math.max(10, vp.scale * 0.3)}px monospace`
  ctx.textAlign = 'center'; ctx.fillText('ESC', sx, sy + 4); ctx.textAlign = 'left'
}

// ── Preview rect during drag ──────────────────────────────────
function _drawPreview() {
  if (!previewRect) return
  const { x1, z1, x2, z2 } = previewRect
  const { sx: ax, sy: ay } = toScreen(Math.min(x1, x2), Math.max(z1, z2))
  const pw = Math.abs(x2 - x1) * vp.scale, ph = Math.abs(z2 - z1) * vp.scale
  const tool = props.activeTool
  let col = '#aaa'
  if (tool === 'FLOOR') col = 'rgba(180,150,90,0.5)'
  if (tool === 'WALL')  col = 'rgba(100,100,100,0.6)'
  if (tool === 'ZONE')  col = ZONE_COLORS[props.zoneType] + '44'
  if (tool === 'ESCAPE') col = 'rgba(34,204,204,0.3)'
  ctx.fillStyle = col; ctx.fillRect(ax, ay, pw, ph)
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.setLineDash([3, 3])
  ctx.strokeRect(ax, ay, pw, ph); ctx.setLineDash([])
}

function _drawSpawnFirst() {
  if (!spawnFirst) return
  const { sx, sy } = toScreen(spawnFirst[0], spawnFirst[1])
  ctx.strokeStyle = '#ff6666'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3])
  ctx.beginPath(); ctx.arc(sx, sy, 10, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([])
}

// ── Wall-snap preview (hover indicator for DOOR/CAMERA/WINDOW) ──
function _drawSnapPreview() {
  if (!hoverSnap) return
  if (hoverSnap.wallIdx != null) {
    // WINDOW tool: highlight the wall under cursor
    const w = props.levelData.walls[hoverSnap.wallIdx]
    if (!w) return
    const { sx: x, sy: y } = toScreen(w.x - w.w / 2, w.z + w.d / 2)
    const pw = w.w * vp.scale, ph = w.d * vp.scale
    ctx.strokeStyle = w.glass ? '#ff8844' : '#44ddff'; ctx.lineWidth = 2.5
    ctx.setLineDash([4, 3]); ctx.strokeRect(x, y, pw, ph); ctx.setLineDash([])
    // Label
    ctx.fillStyle = w.glass ? '#ff8844' : '#44ddff'
    ctx.font = '9px monospace'; ctx.textAlign = 'center'
    ctx.fillText(w.glass ? '→ SOLID' : '→ GLASS', x + pw / 2, y + ph / 2 + 3)
    ctx.textAlign = 'left'
    return
  }
  // DOOR / CAMERA tool: show snap target dot
  const { sx, sy } = toScreen(hoverSnap.x, hoverSnap.z)
  ctx.fillStyle = 'rgba(255,170,0,0.5)'
  ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = '#ffaa00'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.arc(sx, sy, 9, 0, Math.PI * 2); ctx.stroke()
}

// ── Resize / init ─────────────────────────────────────────────
function resize() {
  if (!canvas.value) return
  const wrap = canvas.value.parentElement
  canvas.value.width  = wrap?.clientWidth  ?? window.innerWidth
  canvas.value.height = (wrap?.clientHeight ?? window.innerHeight) - 22  // leave room for status bar
  initPan(canvas.value)
  draw()
}

onMounted(() => {
  ctx = canvas.value.getContext('2d')
  resize()
  window.addEventListener('resize', resize)
})
onUnmounted(() => window.removeEventListener('resize', resize))

// Redraw whenever level data or selection changes
watch(() => [props.levelData, props.selectedId], draw, { deep: true })

// Expose draw so parent can trigger redraws
defineExpose({ draw })
</script>

<style scoped>
.canvas-wrap {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
.editor-canvas {
  display: block;
  flex: 1;
  width: 100%;
  cursor: crosshair;
  outline: none;
}
.status-bar {
  height: 22px;
  background: rgba(10,10,14,0.96);
  border-top: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  font: 10px 'Courier New', monospace;
  color: #777;
  flex-shrink: 0;
}
.shortcut-hints { color: #555; }
</style>
