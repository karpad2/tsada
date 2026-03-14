import { NODE_TYPES, getDefaultFields } from '../game/levels/nodeRegistry.ts'

// ── Data types ───────────────────────────────────────────────
export interface GraphNode {
  id: string
  type: string
  x: number
  y: number
  fields: Record<string, any>
}

export interface GraphEdge {
  id: string
  from: string
  fromPort: string
  to: string
  toPort: string
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

let _idCounter = 0
function uid() { return 'n' + Date.now().toString(36) + '_' + (++_idCounter) }

// ── Composable ───────────────────────────────────────────────
export function useNodeGraph(graph: GraphData) {

  // ── Node CRUD ──────────────────────────────────────────────
  function addNode(type: string, x: number, y: number): GraphNode {
    const node: GraphNode = {
      id: uid(),
      type,
      x, y,
      fields: getDefaultFields(type),
    }
    graph.nodes.push(node)
    return node
  }

  function removeNode(nodeId: string) {
    // Remove connected edges first
    graph.edges = graph.edges.filter(e => e.from !== nodeId && e.to !== nodeId)
    const idx = graph.nodes.findIndex(n => n.id === nodeId)
    if (idx >= 0) graph.nodes.splice(idx, 1)
  }

  function moveNode(nodeId: string, x: number, y: number) {
    const node = graph.nodes.find(n => n.id === nodeId)
    if (node) { node.x = x; node.y = y }
  }

  // ── Edge CRUD ──────────────────────────────────────────────
  function canConnect(from: string, fromPort: string, to: string, toPort: string): boolean {
    if (from === to) return false
    // No duplicate edges
    if (graph.edges.some(e => e.from === from && e.fromPort === fromPort && e.to === to && e.toPort === toPort)) return false
    // Input port accepts max 1 incoming edge
    if (graph.edges.some(e => e.to === to && e.toPort === toPort)) return false
    // Validate port directions
    const fromNode = graph.nodes.find(n => n.id === from)
    const toNode   = graph.nodes.find(n => n.id === to)
    if (!fromNode || !toNode) return false
    const fromDef = NODE_TYPES[fromNode.type]
    const toDef   = NODE_TYPES[toNode.type]
    if (!fromDef || !toDef) return false
    const hasOutput = fromDef.outputs.some(p => p.id === fromPort)
    const hasInput  = toDef.inputs.some(p => p.id === toPort)
    return hasOutput && hasInput
  }

  function addEdge(from: string, fromPort: string, to: string, toPort: string): GraphEdge | null {
    if (!canConnect(from, fromPort, to, toPort)) return null
    const edge: GraphEdge = { id: uid(), from, fromPort, to, toPort }
    graph.edges.push(edge)
    return edge
  }

  function removeEdge(edgeId: string) {
    const idx = graph.edges.findIndex(e => e.id === edgeId)
    if (idx >= 0) graph.edges.splice(idx, 1)
  }

  function getEdgesForNode(nodeId: string): GraphEdge[] {
    return graph.edges.filter(e => e.from === nodeId || e.to === nodeId)
  }

  // ── Field updates ──────────────────────────────────────────
  function updateField(nodeId: string, key: string, value: any) {
    const node = graph.nodes.find(n => n.id === nodeId)
    if (node) node.fields[key] = value
  }

  // ── Port screen positions ──────────────────────────────────
  // Computed from DOM elements; nodeRefs must be populated by the canvas component
  const nodeRefs = new Map<string, HTMLElement>()

  function registerNodeRef(nodeId: string, el: HTMLElement | null) {
    if (el) nodeRefs.set(nodeId, el)
    else nodeRefs.delete(nodeId)
  }

  function getPortPos(nodeId: string, portId: string, rootRect: DOMRect) {
    const el = nodeRefs.get(nodeId)
    if (!el) return null
    const portEl = el.querySelector(`.port[data-port="${portId}"]`) as HTMLElement
    if (!portEl) return null
    const pr = portEl.getBoundingClientRect()
    return {
      x: pr.left + pr.width / 2 - rootRect.left,
      y: pr.top  + pr.height / 2 - rootRect.top,
    }
  }

  return {
    addNode, removeNode, moveNode,
    addEdge, removeEdge, getEdgesForNode,
    canConnect, updateField,
    nodeRefs, registerNodeRef, getPortPos,
  }
}
