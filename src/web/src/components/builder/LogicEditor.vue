<template>
  <div
    ref="rootRef"
    class="graph-root"
    tabindex="0"
    @wheel.prevent="onWheel"
    @mousedown.right.prevent="onPanStart"
    @mousedown.left="onBgClick"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
    @contextmenu.prevent
    @keydown="onKey"
  >
    <!-- Grid background -->
    <svg class="graph-layer graph-grid">
      <defs>
        <pattern id="sg" :width="20 * vp.zoom" :height="20 * vp.zoom" patternUnits="userSpaceOnUse"
          :patternTransform="`translate(${vp.panX % (20*vp.zoom)} ${vp.panY % (20*vp.zoom)})`">
          <path :d="`M ${20*vp.zoom} 0 L 0 0 0 ${20*vp.zoom}`" fill="none" stroke="#1a1a22" stroke-width="0.5"/>
        </pattern>
        <pattern id="bg" :width="100 * vp.zoom" :height="100 * vp.zoom" patternUnits="userSpaceOnUse"
          :patternTransform="`translate(${vp.panX % (100*vp.zoom)} ${vp.panY % (100*vp.zoom)})`">
          <rect :width="100*vp.zoom" :height="100*vp.zoom" fill="url(#sg)"/>
          <path :d="`M ${100*vp.zoom} 0 L 0 0 0 ${100*vp.zoom}`" fill="none" stroke="#252530" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
    </svg>

    <!-- Edges SVG layer -->
    <svg class="graph-layer graph-edges">
      <!-- Hit areas (invisible, wider) -->
      <path v-for="edge in graph.edges" :key="'h_'+edge.id"
        :d="edgePath(edge)" class="edge-hit"
        @click.stop="selectEdge(edge.id)"
      />
      <!-- Visible edges -->
      <path v-for="edge in graph.edges" :key="edge.id"
        :d="edgePath(edge)"
        :class="['edge', { selected: selectedEdgeId === edge.id }]"
        @click.stop="selectEdge(edge.id)"
      />
      <!-- Drag preview -->
      <path v-if="dragEdge" :d="dragEdgePath" class="edge-preview" />
    </svg>

    <!-- Nodes HTML layer -->
    <div class="graph-nodes" :style="nodesTransform">
      <div
        v-for="node in graph.nodes" :key="node.id"
        :ref="el => registerRef(node.id, el)"
        :class="['gnode', catClass(node), { selected: selectedNodeId === node.id }]"
        :style="{ left: node.x + 'px', top: node.y + 'px' }"
        @mousedown.left.stop="onNodeDown(node, $event)"
      >
        <!-- Header -->
        <div class="gnode-head" :style="{ borderBottomColor: nodeColor(node) }">
          <span class="gnode-icon">{{ nodeIcon(node) }}</span>
          <span class="gnode-label">{{ nodeLabel(node) }}</span>
        </div>
        <!-- Body summary -->
        <div class="gnode-body">{{ nodeSummary(node) }}</div>
        <!-- Input ports -->
        <div v-for="port in nodeInputs(node)" :key="port.id"
          class="port port-in" :data-port="port.id"
          @mousedown.left.stop="onPortDown(node.id, port.id, 'in', $event)"
        />
        <!-- Output ports -->
        <div v-for="port in nodeOutputs(node)" :key="port.id"
          class="port port-out" :data-port="port.id"
          @mousedown.left.stop="onPortDown(node.id, port.id, 'out', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { NODE_TYPES } from '../../game/levels/nodeRegistry.ts'
import { useGraphViewport } from '../../composables/useGraphViewport.ts'
import { useNodeGraph, type GraphData, type GraphNode, type GraphEdge } from '../../composables/useNodeGraph.ts'

const props = defineProps<{
  graph: GraphData
  selectedNodeId: string | null
}>()

const emit = defineEmits<{
  'update:selectedNodeId': [id: string | null]
  addNode:    [type: string, x: number, y: number]
  removeNode: [id: string]
  moveNode:   [id: string, x: number, y: number]
  addEdge:    [from: string, fromPort: string, to: string, toPort: string]
  removeEdge: [id: string]
}>()

const rootRef = ref<HTMLElement | null>(null)
const { vp, applyWheel, startPan, screenToGraph } = useGraphViewport()
const ng = useNodeGraph(props.graph)

const selectedEdgeId = ref<string | null>(null)

// ── Viewport ─────────────────────────────────────────────────
const nodesTransform = computed(() =>
  `transform: translate(${vp.panX}px, ${vp.panY}px) scale(${vp.zoom}); transform-origin: 0 0;`)

function onWheel(e: WheelEvent) { applyWheel(e) }
function onPanStart(e: MouseEvent) { startPan(e) }

// ── Node refs ────────────────────────────────────────────────
function registerRef(id: string, el: any) {
  ng.registerNodeRef(id, el as HTMLElement | null)
}

// ── Node helpers ─────────────────────────────────────────────
function nodeColor(n: GraphNode)  { return NODE_TYPES[n.type]?.color ?? '#555' }
function nodeIcon(n: GraphNode)   { return NODE_TYPES[n.type]?.icon ?? '?' }
function nodeLabel(n: GraphNode)  { return NODE_TYPES[n.type]?.label ?? n.type }
function catClass(n: GraphNode)   { return 'cat-' + (NODE_TYPES[n.type]?.category ?? 'action') }
function nodeInputs(n: GraphNode) { return NODE_TYPES[n.type]?.inputs ?? [] }
function nodeOutputs(n: GraphNode){ return NODE_TYPES[n.type]?.outputs ?? [] }

function nodeSummary(n: GraphNode): string {
  const f = n.fields
  switch (n.type) {
    case 'onInteract': return `${f.mesh} [${f.interactId || '?'}] (${f.x},${f.z})`
    case 'message':    return (f.text ?? '').slice(0, 30)
    case 'sound':      return f.sound ?? ''
    case 'delay':      return `${f.seconds ?? 1}s`
    case 'script':     return (f.code ?? '').slice(0, 24) + '...'
    case 'openDoor':   return `door #${f.doorIndex ?? 0}`
    case 'spawnEnemies': return `${f.count}x ${f.enemyType}`
    case 'heal':       return `+${f.amount} HP`
    case 'giveAmmo':   return `+${f.amount} ammo`
    case 'enable':     return `-> ${f.target || '?'}`
    case 'disable':    return `x ${f.target || '?'}`
    case 'explode':    return `(${f.x},${f.z}) r=${f.radius}`
    default:           return ''
  }
}

// ── Background click (deselect) ──────────────────────────────
function onBgClick(e: MouseEvent) {
  if (e.target === rootRef.value || (e.target as HTMLElement)?.closest?.('.graph-grid')) {
    emit('update:selectedNodeId', null)
    selectedEdgeId.value = null
  }
}

// ── Node selection + drag ────────────────────────────────────
let _draggingNode: GraphNode | null = null
let _dragStart = { mx: 0, my: 0, nx: 0, ny: 0 }

function onNodeDown(node: GraphNode, e: MouseEvent) {
  emit('update:selectedNodeId', node.id)
  selectedEdgeId.value = null
  _draggingNode = node
  _dragStart = { mx: e.clientX, my: e.clientY, nx: node.x, ny: node.y }
}

// ── Edge drag ────────────────────────────────────────────────
const dragEdge = ref<{ fromNode: string, fromPort: string, dir: string, x2: number, y2: number } | null>(null)

function onPortDown(nodeId: string, portId: string, dir: string, e: MouseEvent) {
  const rect = rootRef.value!.getBoundingClientRect()
  dragEdge.value = {
    fromNode: nodeId, fromPort: portId, dir,
    x2: e.clientX - rect.left,
    y2: e.clientY - rect.top,
  }
}

const dragEdgePath = computed(() => {
  if (!dragEdge.value || !rootRef.value) return ''
  const de = dragEdge.value
  const rect = rootRef.value.getBoundingClientRect()
  const portPos = ng.getPortPos(de.fromNode, de.fromPort, rect)
  if (!portPos) return ''
  const { x: x1, y: y1 } = portPos
  const x2 = de.x2, y2 = de.y2
  if (de.dir === 'out') return bezier(x1, y1, x2, y2)
  return bezier(x2, y2, x1, y1)
})

// ── Edge selection ───────────────────────────────────────────
function selectEdge(id: string) {
  selectedEdgeId.value = id
  emit('update:selectedNodeId', null)
}

// ── Edge path computation ────────────────────────────────────
function edgePath(edge: GraphEdge): string {
  if (!rootRef.value) return ''
  const rect = rootRef.value.getBoundingClientRect()
  const from = ng.getPortPos(edge.from, edge.fromPort, rect)
  const to   = ng.getPortPos(edge.to,   edge.toPort,   rect)
  if (!from || !to) return ''
  return bezier(from.x, from.y, to.x, to.y)
}

function bezier(x1: number, y1: number, x2: number, y2: number): string {
  const cp = Math.max(50, Math.abs(x2 - x1) * 0.4)
  return `M ${x1} ${y1} C ${x1 + cp} ${y1}, ${x2 - cp} ${y2}, ${x2} ${y2}`
}

// ── Global mouse handlers ────────────────────────────────────
function onMouseMove(e: MouseEvent) {
  // Node drag
  if (_draggingNode) {
    const dx = (e.clientX - _dragStart.mx) / vp.zoom
    const dy = (e.clientY - _dragStart.my) / vp.zoom
    _draggingNode.x = _dragStart.nx + dx
    _draggingNode.y = _dragStart.ny + dy
  }

  // Edge drag preview
  if (dragEdge.value && rootRef.value) {
    const rect = rootRef.value.getBoundingClientRect()
    dragEdge.value.x2 = e.clientX - rect.left
    dragEdge.value.y2 = e.clientY - rect.top
  }
}

function onMouseUp(e: MouseEvent) {
  // Finish node drag
  if (_draggingNode) {
    emit('moveNode', _draggingNode.id, _draggingNode.x, _draggingNode.y)
    _draggingNode = null
  }

  // Finish edge drag — check if released on a port
  if (dragEdge.value) {
    const target = (e.target as HTMLElement)?.closest?.('.port') as HTMLElement
    if (target) {
      const nodeEl = target.closest('.gnode') as HTMLElement
      if (nodeEl) {
        const targetNodeId = _findNodeIdByEl(nodeEl)
        const targetPortId = target.dataset.port ?? ''
        if (targetNodeId) {
          const de = dragEdge.value
          if (de.dir === 'out') {
            emit('addEdge', de.fromNode, de.fromPort, targetNodeId, targetPortId)
          } else {
            emit('addEdge', targetNodeId, targetPortId, de.fromNode, de.fromPort)
          }
        }
      }
    }
    dragEdge.value = null
  }
}

function _findNodeIdByEl(el: HTMLElement): string | null {
  for (const [id, nodeEl] of ng.nodeRefs) {
    if (nodeEl === el) return id
  }
  return null
}

// ── Keyboard ─────────────────────────────────────────────────
function onKey(e: KeyboardEvent) {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (selectedEdgeId.value) {
      emit('removeEdge', selectedEdgeId.value)
      selectedEdgeId.value = null
    } else if (props.selectedNodeId) {
      emit('removeNode', props.selectedNodeId)
      emit('update:selectedNodeId', null)
    }
  }
}

// ── Expose for parent (add node at viewport center) ──────────
function getViewportCenter(): { x: number, y: number } {
  if (!rootRef.value) return { x: 100, y: 100 }
  const rect = rootRef.value.getBoundingClientRect()
  return screenToGraph(rect.width / 2 + rect.left, rect.height / 2 + rect.top, rect)
}

defineExpose({ getViewportCenter })
</script>

<style scoped>
.graph-root {
  position: relative;
  width: 100%; height: 100%;
  overflow: hidden;
  background: #0e0e14;
  outline: none;
  cursor: default;
}

.graph-layer {
  position: absolute;
  inset: 0;
  width: 100%; height: 100%;
  pointer-events: none;
}
.graph-edges { z-index: 1; }
.graph-edges path { pointer-events: stroke; }
.graph-grid  { z-index: 0; pointer-events: none; }

.graph-nodes {
  position: absolute;
  top: 0; left: 0;
  z-index: 2;
}

/* ── Node ── */
.gnode {
  position: absolute;
  width: 180px;
  background: rgba(20,20,28,0.95);
  border: 1px solid #444;
  border-radius: 6px;
  font: 11px 'Courier New', monospace;
  color: #ccc;
  cursor: grab;
  user-select: none;
}
.gnode:hover { border-color: #666; }
.gnode.selected { border-color: #ffaa00; box-shadow: 0 0 10px rgba(255,170,0,0.25); }

.gnode-head {
  padding: 5px 8px;
  border-bottom: 2px solid #555;
  display: flex;
  gap: 5px;
  align-items: center;
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 0.06em;
  color: #ddd;
}
.gnode-icon { font-size: 12px; }
.gnode-body {
  padding: 4px 8px;
  font-size: 9px;
  color: #777;
  min-height: 14px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* ── Ports ── */
.port {
  position: absolute;
  width: 12px; height: 12px;
  border-radius: 50%;
  background: #555;
  border: 2px solid #888;
  cursor: crosshair;
  top: 10px;
  pointer-events: all;
  z-index: 5;
}
.port-in  { left: -6px; }
.port-out { right: -6px; }
.port:hover { background: #ffaa00; border-color: #ffdd88; transform: scale(1.2); }

/* Category colors on node left border */
.cat-trigger { border-left: 3px solid #44cc88; }
.cat-action  { border-left: 3px solid #ffaa44; }
.cat-flow    { border-left: 3px solid #44aaff; }

/* ── Edges ── */
.edge { fill: none; stroke: #666; stroke-width: 2; transition: stroke 0.1s; }
.edge.selected { stroke: #ffaa00; stroke-width: 3; }
.edge-hit { fill: none; stroke: transparent; stroke-width: 14; cursor: pointer; pointer-events: stroke; }
.edge-preview { fill: none; stroke: #ffaa00; stroke-width: 2; stroke-dasharray: 6 4; opacity: 0.7; }
</style>
