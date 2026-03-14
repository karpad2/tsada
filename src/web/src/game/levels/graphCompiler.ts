import type { GraphData, GraphNode } from '../../composables/useNodeGraph.ts'
import type { InteractableDef } from '../Interactable.ts'
import type { ActionDef } from '../ActionRunner.ts'
import { NODE_TYPES } from './nodeRegistry.ts'

// ── Compile node graph → InteractableDef[] ───────────────────
export function compileGraph(graph: GraphData): InteractableDef[] {
  if (!graph || !graph.nodes.length) return []

  const result: InteractableDef[] = []

  // Find all trigger nodes (entry points)
  const triggers = graph.nodes.filter(n => n.type === 'onInteract')

  for (const trigger of triggers) {
    const actions: ActionDef[] = []
    const visited = new Set<string>()
    walkChain(trigger.id, 'out', actions, graph, visited)

    const f = trigger.fields
    result.push({
      id:          f.interactId || trigger.id,
      mesh:        f.mesh ?? 'button',
      x:           f.x ?? 0,
      z:           f.z ?? 0,
      y:           f.y,
      rotY:        f.rotY,
      hint:        f.hint ?? '[F] Interact',
      holdTime:    f.holdTime ?? 0,
      requireMask: f.requireMask ?? false,
      once:        f.once ?? true,
      enabled:     f.enabled !== false,
      range:       f.range ?? 2.0,
      actions,
    })
  }

  return result
}

// ── Walk edge chain collecting ActionDefs ─────────────────────
function walkChain(
  nodeId: string, portId: string,
  actions: ActionDef[], graph: GraphData, visited: Set<string>,
) {
  const edge = graph.edges.find(e => e.from === nodeId && e.fromPort === portId)
  if (!edge) return

  const target = graph.nodes.find(n => n.id === edge.to)
  if (!target || visited.has(target.id)) return
  visited.add(target.id)

  const action = nodeToAction(target)
  if (action) actions.push(action)

  // Continue chain from target's output
  walkChain(target.id, 'out', actions, graph, visited)
}

// ── Convert a single node to an ActionDef ────────────────────
function nodeToAction(node: GraphNode): ActionDef | null {
  const f = node.fields
  switch (node.type) {
    case 'message':      return { type: 'message', text: f.text ?? '', color: f.color }
    case 'sound':        return { type: 'sound', sound: f.sound ?? 'pickup' }
    case 'alarm':        return { type: 'alarm' }
    case 'objective':    return { type: 'objective' }
    case 'openDoor':     return { type: 'openDoor', doorIndex: f.doorIndex ?? 0 }
    case 'spawnEnemies': return { type: 'spawnEnemies', count: f.count ?? 2, enemyType: f.enemyType }
    case 'heal':         return { type: 'heal', amount: f.amount ?? 25 }
    case 'giveAmmo':     return { type: 'giveAmmo', amount: f.amount ?? 30 }
    case 'enable':       return { type: 'enable', target: f.target ?? '' }
    case 'disable':      return { type: 'disable', target: f.target ?? '' }
    case 'explode':      return { type: 'explode', x: f.x ?? 0, z: f.z ?? 0, radius: f.radius ?? 4, damage: f.damage ?? 80 }
    case 'script':       return { type: 'script', code: f.code ?? '' }
    case 'delay':        return { type: 'delay', seconds: f.seconds ?? 1.0 }
    default:             return null
  }
}
