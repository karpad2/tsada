import * as THREE  from 'three'
import { hasLOS }  from './Enemy.ts'

/**
 * Manages ASSAULT-phase combat entities:
 *   – enemy-laid mines (med_miner)
 *   – AP sentry turrets (med_sentry)
 *   – molotov projectiles (heavy_molotov)
 *   – fire pools spawned by molotovs
 *
 * @param {object} cfg
 *   scene      – THREE.Scene
 *   takeDamage – (amount) => void  (called when player takes damage)
 */
export function createAssaultEntities({ scene, takeDamage }) {

  const mines        = []   // { mesh, pos, alive }
  const sentries     = []   // { group, hitbox, _body, pos, health, alive, shootTimer, takeDamage }
  let activeSentry   = null // only 1 sentry at a time — new one despawns previous
  const droneTurrets = []   // hovering drone turrets deployed by fbi_drone_spec
  const molotovs     = []   // { mesh, startPos, endPos, elapsed, duration }
  const firePools    = []   // { mesh, inner, outer, light, pos, lifetime, damageTimer }

  // ── Factory functions ──────────────────────────────────────

  function layMine(pos) {
    const g    = new THREE.Group()
    g.position.copy(pos); g.position.y = 0
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.28, 0.10, 8),
      new THREE.MeshLambertMaterial({ color: 0x222222}),
    )
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.04, 6),
      new THREE.MeshBasicMaterial({ color: 0xff2200 }),
    )
    lens.position.y = 0.07
    g.add(base, lens); scene.add(g)
    mines.push({ mesh: g, pos: pos.clone(), alive: true })
  }

  function _destroySentry(s) {
    if (!s.alive) return
    s.alive = false
    // Explosion flash
    const fl = new THREE.PointLight(0xff6600, 12, 10)
    fl.position.copy(s.pos); fl.position.y += 0.6; scene.add(fl)
    setTimeout(() => scene.remove(fl), 200)
    // Explosion damage to nearby player
    scene.remove(s.group); scene.remove(s.hitbox)
  }

  function makeSentry(pos) {
    // Only 1 sentry at a time — despawn previous
    if (activeSentry && activeSentry.alive) _destroySentry(activeSentry)

    const g   = new THREE.Group(); g.position.copy(pos); g.position.y = 0
    const mat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a})
    const acc = new THREE.MeshLambertMaterial({ color: 0x333344})

    for (let i = 0; i < 3; i++) {
      const ang = (i / 3) * Math.PI * 2
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.06), mat)
      leg.position.set(Math.sin(ang) * 0.22, 0.28, Math.cos(ang) * 0.22)
      leg.rotation.z = Math.sin(ang) * 0.28
      leg.rotation.x = Math.cos(ang) * 0.28
      g.add(leg)
    }

    const body = new THREE.Group(); body.position.y = 0.60; g.add(body)
    body.add(new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.22, 0.30), acc))
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.42, 6), mat)
    barrel.rotation.x = Math.PI / 2; barrel.position.z = -0.32; body.add(barrel)
    const redLight = new THREE.PointLight(0xff2200, 2, 4); redLight.position.y = 0.15; body.add(redLight)
    scene.add(g)

    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(0.40, 1.10, 0.40),
      new THREE.MeshBasicMaterial({ visible: false }),
    )
    hitbox.position.copy(pos); hitbox.position.y = 0.55; scene.add(hitbox)

    const sentry = {
      group: g, hitbox, _body: body, pos: pos.clone(),
      health: 100, maxHealth: 100, alive: true, shootTimer: 0.6,
      takeDamage(amt) {
        this.health -= amt
        if (this.health <= 0) _destroySentry(this)
      },
    }
    hitbox.userData.sentry = sentry
    sentries.push(sentry)
    activeSentry = sentry
    return sentry
  }

  function _destroyDroneTurret(dt) {
    if (!dt.alive) return
    dt.alive = false
    const fl = new THREE.PointLight(0x44aaff, 10, 8)
    fl.position.copy(dt.group.position); scene.add(fl)
    setTimeout(() => scene.remove(fl), 250)
    scene.remove(dt.group); scene.remove(dt.hitbox)
  }

  function makeDroneTurret(pos) {
    const FLY_H = 3.5
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x1a3a1a})
    const propMat = new THREE.MeshLambertMaterial({ color: 0x2a5a2a})
    const g = new THREE.Group()
    g.position.set(pos.x, FLY_H, pos.z)

    // Body
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.13, 0.44), bodyMat))
    // Barrel (downward-angled gun)
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.30, 6),
      bodyMat,
    )
    barrel.rotation.x = Math.PI / 2; barrel.position.set(0, -0.04, -0.26)
    g.add(barrel)
    // Rotors
    const rotors = []
    const offsets = [{ x: -0.32, z: -0.32 }, { x: 0.32, z: -0.32 }, { x: -0.32, z: 0.32 }, { x: 0.32, z: 0.32 }]
    for (const off of offsets) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.05), bodyMat)
      arm.position.set(off.x * 0.5, 0, off.z * 0.5); g.add(arm)
      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.015, 8), propMat)
      rotor.position.set(off.x, 0.07, off.z); g.add(rotor); rotors.push(rotor)
    }
    // Red targeting light
    const redLight = new THREE.PointLight(0xff2200, 3, 6); redLight.position.y = -0.15; g.add(redLight)
    // Blue status light
    const blueLight = new THREE.PointLight(0x0044ff, 1.5, 3); blueLight.position.set(0, 0.1, 0); g.add(blueLight)
    scene.add(g)

    // Hitbox
    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.5, 0.7),
      new THREE.MeshBasicMaterial({ visible: false }),
    )
    hitbox.position.set(pos.x, FLY_H, pos.z); scene.add(hitbox)

    const dt = {
      group: g, hitbox, rotors, redLight,
      pos: new THREE.Vector3(pos.x, FLY_H, pos.z),
      health: 80, maxHealth: 80, alive: true,
      shootTimer: 1.0, bobPhase: Math.random() * Math.PI * 2,
      takeDamage(amt) { this.health -= amt; if (this.health <= 0) _destroyDroneTurret(this) },
    }
    hitbox.userData.sentry = dt  // reuse sentry hit path in CombatSystem
    droneTurrets.push(dt)
    return dt
  }

  function throwMolotov(fromPos, targetPos) {
    const start = fromPos.clone(); start.y += 1.5
    const mesh  = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 6, 4),
      new THREE.MeshLambertMaterial({ color: 0xcc6611, emissive: 0x440f00}),
    )
    mesh.position.copy(start); scene.add(mesh)
    const dist = fromPos.distanceTo(targetPos)
    molotovs.push({
      mesh,
      startPos: start.clone(), endPos: targetPos.clone(),
      elapsed: 0, duration: Math.max(0.8, dist / 10),
    })
  }

  function createFirePool(pos) {
    const g     = new THREE.Group(); g.position.copy(pos); g.position.y = 0.04; scene.add(g)
    const inner = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 1.2, 0.08, 12),
      new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.8 }),
    )
    const outer = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.8, 0.06, 12),
      new THREE.MeshBasicMaterial({ color: 0xcc2200, transparent: true, opacity: 0.5 }),
    )
    const light = new THREE.PointLight(0xff4400, 4, 6); light.position.y = 0.8
    g.add(inner, outer, light)
    firePools.push({ mesh: g, inner, outer, light, pos: pos.clone(), lifetime: 8, damageTimer: 0 })
  }

  // ── Per-frame tick ─────────────────────────────────────────

  /**
   * @param {number}          delta
   * @param {THREE.Vector3}   playerPos
   * @param {number}          eyeH      – player eye height (_eyeH())
   * @param {THREE.Box3[]}    visionBoxes
   * @param {Array}           enemies   – enemy list (for sentry targeting)
   */
  function tick(delta, playerPos, eyeH, visionBoxes, enemies = []) {

    // Mines: trigger on player contact
    for (let i = mines.length - 1; i >= 0; i--) {
      const m = mines[i]
      if (!m.alive) continue
      if (playerPos.distanceTo(m.pos) < 1.5) {
        m.alive = false; scene.remove(m.mesh); mines.splice(i, 1)
        takeDamage(45)
        const fl = new THREE.PointLight(0xff8800, 8, 6)
        fl.position.copy(m.pos); fl.position.y += 0.3; scene.add(fl)
        setTimeout(() => scene.remove(fl), 130)
      }
    }

    // Sentries: rotate toward player, shoot — enemies shoot back at sentries
    for (const s of sentries) {
      if (!s.alive) continue
      s.shootTimer -= delta
      const sDist = playerPos.distanceTo(s.pos)
      const dx = playerPos.x - s.pos.x
      const dz = playerPos.z - s.pos.z
      s._body.rotation.y = Math.atan2(dx, dz)
      const sentryEye = s.pos.clone(); sentryEye.y = 0.75
      const pEye      = playerPos.clone(); pEye.y = playerPos.y + eyeH
      if (s.shootTimer <= 0 && sDist < 20 && hasLOS(sentryEye, pEye, visionBoxes)) {
        s.shootTimer = 0.45
        takeDamage(9)
        const dir = new THREE.Vector3(dx, 0, dz).normalize()
        const fp  = s.pos.clone().addScaledVector(dir, 0.55); fp.y = 0.62
        const fl  = new THREE.PointLight(0xff8800, 5, 5); fl.position.copy(fp); scene.add(fl)
        setTimeout(() => scene.remove(fl), 80)
      }

      // Enemies target sentry: COMBAT enemies within 18m with LOS shoot it
      for (const e of enemies) {
        if (e.state !== 'COMBAT' || e.state === 'DEAD') continue
        const eDist = e.group.position.distanceTo(s.pos)
        if (eDist > 18) continue
        const eEye = e.group.position.clone(); eEye.y = 1.55
        if (!hasLOS(eEye, sentryEye, visionBoxes)) continue
        // ~30% chance per second to shoot sentry instead of player
        if (Math.random() < 0.3 * delta) {
          s.takeDamage(e.damage)
        }
      }
    }

    // Drone turrets: counter-sentry unit — flies toward player's sentries and destroys them
    for (const dt of droneTurrets) {
      if (!dt.alive) continue
      dt.shootTimer -= delta
      dt.bobPhase += delta * 1.8
      // Spin rotors
      for (const r of dt.rotors) r.rotation.y += delta * 25

      // Find nearest alive player sentry
      let nearestSentry = null, nearestDist = Infinity
      for (const s of sentries) {
        if (!s.alive) continue
        const sd = dt.pos.distanceTo(s.pos)
        if (sd < nearestDist) { nearestDist = sd; nearestSentry = s }
      }

      if (nearestSentry) {
        // Fly toward the target sentry
        const dx = nearestSentry.pos.x - dt.pos.x
        const dz = nearestSentry.pos.z - dt.pos.z
        const d = Math.sqrt(dx * dx + dz * dz)
        if (d > 2.5) {
          const step = 5 * delta
          dt.pos.x += (dx / d) * step
          dt.pos.z += (dz / d) * step
        }
        // Face target
        dt.group.rotation.y = Math.atan2(nearestSentry.pos.x - dt.pos.x, nearestSentry.pos.z - dt.pos.z)
        // Attack sentry
        if (d < 4 && dt.shootTimer <= 0) {
          dt.shootTimer = 0.25
          nearestSentry.takeDamage(25)
          const fl = new THREE.PointLight(0x44ff44, 4, 5)
          fl.position.copy(dt.group.position); scene.add(fl)
          setTimeout(() => scene.remove(fl), 60)
        }
      }
      // else: no sentries — drone hovers in place

      const bobY = Math.sin(dt.bobPhase) * 0.15
      dt.group.position.set(dt.pos.x, dt.pos.y + bobY, dt.pos.z)
      dt.hitbox.position.set(dt.pos.x, dt.pos.y, dt.pos.z)
    }

    // Molotov projectiles
    for (let i = molotovs.length - 1; i >= 0; i--) {
      const m = molotovs[i]
      m.elapsed += delta
      const t = Math.min(1, m.elapsed / m.duration)
      m.mesh.position.lerpVectors(m.startPos, m.endPos, t)
      m.mesh.position.y = m.startPos.y + Math.sin(t * Math.PI) * 3.5
      m.mesh.rotation.x += delta * 6
      if (t >= 1) { scene.remove(m.mesh); createFirePool(m.endPos); molotovs.splice(i, 1) }
    }

    // Fire pools: flicker + player damage
    const _ft = Date.now() * 0.001
    for (let i = firePools.length - 1; i >= 0; i--) {
      const fp = firePools[i]
      fp.lifetime -= delta
      if (fp.lifetime <= 0) { scene.remove(fp.mesh); firePools.splice(i, 1); continue }
      const fade = Math.min(1, fp.lifetime * 0.5)
      const flk  = 0.5 + Math.sin(_ft * 7 + i) * 0.3 + Math.sin(_ft * 13 + i * 2.3) * 0.2
      fp.inner.material.opacity = flk * 0.9 * fade
      fp.outer.material.opacity = flk * 0.5 * fade
      fp.light.intensity        = flk * 4  * fade
      fp.damageTimer -= delta
      if (fp.damageTimer <= 0 && playerPos.distanceTo(fp.pos) < 2.0) {
        fp.damageTimer = 0.5; takeDamage(10)
      }
    }
  }

  return {
    mines, sentries, droneTurrets, molotovs, firePools,
    layMine, makeSentry, makeDroneTurret, throwMolotov, createFirePool,
    tick,
  }
}
