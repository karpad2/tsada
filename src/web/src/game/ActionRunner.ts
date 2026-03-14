import { sfx } from './SoundManager.ts'

// ── Action definitions ───────────────────────────────────────
export type ActionDef =
  | { type: 'message', text: string, color?: string }
  | { type: 'sound', sound: string }
  | { type: 'alarm' }
  | { type: 'objective' }
  | { type: 'openDoor', doorIndex: number }
  | { type: 'spawnEnemies', count: number, enemyType?: string }
  | { type: 'heal', amount: number }
  | { type: 'giveAmmo', amount: number }
  | { type: 'enable', target: string }
  | { type: 'disable', target: string }
  | { type: 'explode', x: number, z: number, radius?: number, damage?: number }
  | { type: 'delay', seconds: number }
  | { type: 'script', code: string }
  | { type: 'disableCameras' }

// ── Context passed from Engine ───────────────────────────────
export interface ActionContext {
  state: any
  scene: any
  level: any
  GameManager: any
  enemies: any[]
  interactables: any[]
  cameras: any[]
  playerPos: any
  addKillFeed: (text: string, color: string) => void
  spawnEnemy?: (type: string, x: number, z: number) => void
}

// ── Execute action chain ─────────────────────────────────────
export function runActions(actions: ActionDef[], ctx: ActionContext) {
  for (const a of actions) {
    switch (a.type) {

      case 'message':
        ctx.addKillFeed(a.text, a.color ?? '#ffdd44')
        break

      case 'sound':
        if (typeof sfx[a.sound] === 'function') sfx[a.sound]()
        break

      case 'alarm':
        ctx.GameManager.triggerAlarm()
        break

      case 'objective':
        ctx.GameManager.completeObjective()
        ctx.state.sessionXP += 100
        break

      case 'openDoor': {
        const door = ctx.level.doors?.[a.doorIndex]
        if (door && !door.isOpen) { door.open(); sfx.doorOpen() }
        break
      }

      case 'spawnEnemies': {
        if (ctx.spawnEnemy) {
          for (let i = 0; i < (a.count ?? 1); i++) {
            const angle = (Math.PI * 2 * i) / a.count
            const sx = ctx.playerPos.x + Math.cos(angle) * 8
            const sz = ctx.playerPos.z + Math.sin(angle) * 8
            ctx.spawnEnemy(a.enemyType ?? 'cop_smg', sx, sz)
          }
        }
        break
      }

      case 'heal':
        ctx.state.health = Math.min(ctx.state.maxHealth, ctx.state.health + a.amount)
        break

      case 'giveAmmo':
        ctx.state.reserveAmmo += a.amount
        break

      case 'enable': {
        const target = ctx.interactables.find(ia => ia.id === a.target)
        if (target) target.enabled = true
        break
      }

      case 'disable': {
        const target = ctx.interactables.find(ia => ia.id === a.target)
        if (target) target.enabled = false
        break
      }

      case 'explode':
        ctx.addKillFeed('EXPLOSION!', '#ff4444')
        sfx.explosion()
        // Damage nearby enemies
        for (const e of ctx.enemies) {
          const dx = e.group.position.x - a.x
          const dz = e.group.position.z - a.z
          const dist = Math.sqrt(dx * dx + dz * dz)
          const r = a.radius ?? 4
          if (dist < r) {
            const dmg = (a.damage ?? 80) * (1 - dist / r)
            e.takeDamage(dmg, e.group.position)
          }
        }
        break

      case 'disableCameras':
        for (const cam of ctx.cameras ?? []) cam.destroy()
        break

      case 'delay': {
        // Schedule remaining actions after delay
        const remaining = actions.slice(actions.indexOf(a) + 1)
        if (remaining.length > 0) {
          setTimeout(() => runActions(remaining, ctx), (a.seconds ?? 1) * 1000)
        }
        return  // stop synchronous loop
      }

      case 'script':
        try { new Function('ctx', a.code)(ctx) }
        catch (err) { console.warn('[ActionRunner] script error:', err) }
        break
    }
  }
}
