import type { GraphData, GraphNode, GraphEdge } from '../../composables/useNodeGraph.ts'
import type { InteractableDef } from '../Interactable.ts'
import type { ActionDef } from '../ActionRunner.ts'
import { getDefaultFields } from './nodeRegistry.ts'

let _idCounter = 0
function uid() { return 'dn' + Date.now().toString(36) + '_' + (++_idCounter) }

// ── Decompile InteractableDef[] → GraphData ───────────────────
export function decompileToGraph(interactables: InteractableDef[]): GraphData {
  if (!interactables?.length) return { nodes: [], edges: [] }

  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  for (let i = 0; i < interactables.length; i++) {
    const ia = interactables[i]
    const baseY = i * 120

    // Create trigger node
    const trigger: GraphNode = {
      id: uid(),
      type: 'onInteract',
      x: 100,
      y: baseY,
      fields: {
        ...getDefaultFields('onInteract'),
        mesh:        ia.mesh ?? 'button',
        interactId:  ia.id ?? '',
        x:           ia.x ?? 0,
        z:           ia.z ?? 0,
        hint:        ia.hint ?? '[F] Interact',
        holdTime:    ia.holdTime ?? 0,
        requireMask: ia.requireMask ?? false,
        once:        ia.once ?? true,
        enabled:     ia.enabled !== false,
        range:       ia.range ?? 2.0,
      },
    }
    nodes.push(trigger)

    // Create action chain
    let prevNodeId = trigger.id
    let prevPort = 'out'

    for (let j = 0; j < (ia.actions?.length ?? 0); j++) {
      const action = ia.actions[j]
      const actionNode = actionToNode(action, 350 + j * 250, baseY)
      if (!actionNode) continue

      nodes.push(actionNode)
      edges.push({
        id: uid(),
        from: prevNodeId,
        fromPort: prevPort,
        to: actionNode.id,
        toPort: 'in',
      })
      prevNodeId = actionNode.id
      prevPort = 'out'
    }
  }

  return { nodes, edges }
}

// ── Convert a single ActionDef → GraphNode ────────────────────
function actionToNode(action: ActionDef, x: number, y: number): GraphNode | null {
  const id = uid()
  const base = (type: string, extra: Record<string, any>) => ({
    id, type, x, y,
    fields: { ...getDefaultFields(type), ...extra },
  })

  switch (action.type) {
    case 'message':      return base('message',      { text: action.text, color: action.color ?? '#ffdd44' })
    case 'sound':        return base('sound',         { sound: action.sound })
    case 'alarm':        return base('alarm',         {})
    case 'objective':    return base('objective',     {})
    case 'openDoor':     return base('openDoor',      { doorIndex: action.doorIndex })
    case 'spawnEnemies': return base('spawnEnemies',  { count: action.count, enemyType: action.enemyType ?? 'cop_smg' })
    case 'heal':         return base('heal',          { amount: action.amount })
    case 'giveAmmo':     return base('giveAmmo',      { amount: action.amount })
    case 'enable':       return base('enable',        { target: action.target })
    case 'disable':      return base('disable',       { target: action.target })
    case 'explode':      return base('explode',       { x: action.x, z: action.z, radius: action.radius ?? 4, damage: action.damage ?? 80 })
    case 'script':       return base('script',        { code: action.code })
    case 'delay':        return base('delay',         { seconds: action.seconds })
    default:             return null
  }
}
