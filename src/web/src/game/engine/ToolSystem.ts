// ─────────────────────────────────────────────────────────────
// ToolSystem — deploy, tick, and manage all player tools
// ─────────────────────────────────────────────────────────────
import * as THREE from 'three'
import { state } from '../state.ts'
import { TOOLS } from '../weapons/WeaponData.ts'
import { hasLOS } from '../enemy/EnemyTypes.ts'

export function createToolSystem(ctx) {
  const {
    scene, enemies,
    wallBoxes, visionBoxes,
    playerPos, orient,
    explodeAt, toolCDMult,
    equippedToolIds,
  } = ctx

  // ── Multi-slot state ───────────────────────────────────────
  const equippedTools    = [...(equippedToolIds ?? [null, null])]
  const slotCooldowns    = equippedTools.map(() => 0)
  const slotCooldownMaxs = equippedTools.map(tid => TOOLS[tid]?.cooldown ?? 0)

  // ── Deployed & projectile collections ─────────────────────
  const deployedTools  = []
  const gooProjectiles = []

  // ── Zipline state ──────────────────────────────────────────
  let zipAnchorA = null, zipAnchorB = null
  let zipMeshA = null, zipMeshB = null, zipRope = null
  let zipTraveling = false, zipTravelT = 0

  // ── Active tool type (ECM / Sonar) ─────────────────────────
  let activeToolType = null

  // ── Slot switch ────────────────────────────────────────────
  function switchSlot(si) {
    if (si < 0 || si >= equippedTools.length || !equippedTools[si]) return
    slotCooldowns[state.activeToolSlot] = state.toolCooldownLeft
    state.activeToolSlot   = si
    state.toolId           = equippedTools[si]
    state.toolCooldownMax  = slotCooldownMaxs[si]
    state.toolCooldownLeft = slotCooldowns[si]
  }

  // ── Deploy ─────────────────────────────────────────────────
  function deployTool() {
    const toolId  = state.toolId
    const toolDef = TOOLS[toolId]
    if (!toolDef) return

    const { yaw, pitch } = orient

    // Goo Gun — fire projectile
    if (toolId === 'gooGun') {
      const fwd  = new THREE.Vector3(-Math.sin(yaw), -Math.sin(pitch) * 0.4, -Math.cos(yaw)).normalize()
      const geo  = new THREE.SphereGeometry(0.12, 6, 4)
      const mat  = new THREE.MeshLambertMaterial({ color: 0x44bb22, emissive: 0x226600})
      const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true
      const startPos = new THREE.Vector3(playerPos.x, playerPos.y + 1.4, playerPos.z)
      mesh.position.copy(startPos); scene.add(mesh)
      gooProjectiles.push({ mesh, pos: startPos.clone(), vel: fwd.multiplyScalar(20) })
      state.toolCooldownLeft = state.toolCooldownMax * toolCDMult
      return
    }

    // Zipline — two-press anchor logic
    if (toolId === 'zipline') {
      if (!zipAnchorA) {
        zipAnchorA = playerPos.clone()
        zipMeshA = new THREE.Mesh(
          new THREE.SphereGeometry(0.14, 6, 4),
          new THREE.MeshLambertMaterial({ color: 0xffee00, emissive: 0x886600}),
        )
        zipMeshA.position.copy(zipAnchorA).setY(0.14); scene.add(zipMeshA)
        state.hint = '[T] again to set end anchor'
      } else if (!zipAnchorB) {
        zipAnchorB = playerPos.clone()
        zipMeshB = new THREE.Mesh(
          new THREE.SphereGeometry(0.14, 6, 4),
          new THREE.MeshLambertMaterial({ color: 0xffee00, emissive: 0x886600}),
        )
        zipMeshB.position.copy(zipAnchorB).setY(0.14); scene.add(zipMeshB)
        const pts = [zipAnchorA.clone().setY(1.5), zipAnchorB.clone().setY(1.5)]
        const geo = new THREE.BufferGeometry().setFromPoints(pts)
        zipRope = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffee00 }))
        scene.add(zipRope)
        state.toolCooldownLeft = state.toolCooldownMax * toolCDMult
      }
      return
    }

    // All other tools — place a box at feet
    const deployPos = playerPos.clone(); deployPos.y = 0

    const TOOL_COLORS = {
      ammoBag: 0xffaa00, doctorBag: 0xdd2222, ecm: 0x4488ff,
      gasMine: 0x44dd44, explosiveMine: 0xff3333, breachCharge: 0xff6600,
      apTurret: 0x888888, sonar: 0x22ddff,
    }
    const color = TOOL_COLORS[toolId] ?? 0xffaa00
    const mat  = new THREE.MeshLambertMaterial({ color, emissive: new THREE.Color(color).multiplyScalar(0.15)})
    const size = toolId === 'apTurret' ? 0.42 : 0.28
    const geo  = new THREE.BoxGeometry(size, size, size)
    const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true
    mesh.position.copy(deployPos).setY(size / 2); scene.add(mesh)

    const entry = { toolId, mesh, pos: deployPos.clone(), uses: toolDef.uses ?? 1 }
    deployedTools.push(entry)

    state.toolCooldownLeft = state.toolCooldownMax * toolCDMult
    slotCooldowns[state.activeToolSlot] = state.toolCooldownLeft
    state.toolActive = false; state.toolActiveLeft = 0

    if (toolId === 'ecm' || toolId === 'sonar') {
      state.toolActive     = true
      state.toolActiveLeft = toolDef.duration ?? 20
      activeToolType       = toolId
    }
  }

  // ── Ride zipline (called from F key handler in Engine) ─────
  function tryRideZipline() {
    if (zipAnchorA && zipAnchorB && !zipTraveling) {
      if (playerPos.distanceTo(zipAnchorA) < 1.8) {
        zipTraveling = true; zipTravelT = 0; return true
      }
    }
    return false
  }

  // ── Per-frame tick ─────────────────────────────────────────
  function tick(delta) {
    // Tool cooldown
    if (state.toolCooldownLeft > 0) {
      state.toolCooldownLeft = Math.max(0, state.toolCooldownLeft - delta)
      slotCooldowns[state.activeToolSlot] = state.toolCooldownLeft
    }

    // Active tool duration (ECM / Sonar)
    if (state.toolActive && state.toolActiveLeft > 0) {
      state.toolActiveLeft -= delta
      if (state.toolActiveLeft <= 0) {
        if (activeToolType === 'sonar') {
          for (const e of enemies) {
            e.group.traverse(c => { if (c.isMesh && c.material?.emissive) c.material.emissive.set(0) })
          }
        }
        state.toolActive = false; state.toolActiveLeft = 0; activeToolType = null
      }
    }

    // Deployed tool effects
    for (let ti = deployedTools.length - 1; ti >= 0; ti--) {
      const dt = deployedTools[ti]

      // AP Turret — fires at nearest enemy every 0.1 s, 200 rounds then self-destructs
      if (dt.toolId === 'apTurret') {
        dt._ammo = dt._ammo ?? 200
        dt._timer = (dt._timer ?? 0) + delta
        if (dt._timer >= 0.1 && dt._ammo > 0) {
          dt._timer -= 0.1
          let closest = null, closestDist = TOOLS.apTurret.range
          for (const e of enemies) {
            if (e.state === 'DEAD') continue
            const d = dt.pos.distanceTo(e.group.position)
            if (d < closestDist) { closestDist = d; closest = e }
          }
          if (closest) {
            closest.takeDamage(TOOLS.apTurret.dps * 0.1)
            dt.mesh.material.emissive?.set(0xff8800)
            dt._flash = 0.06
            dt._ammo--
          }
        }
        // Enemies shoot back at turret (~30% chance/s per enemy within 18m with LOS)
        dt._hp = dt._hp ?? 150
        const turretEye = dt.pos.clone(); turretEye.y = 0.4
        for (const e of enemies) {
          if (e.state !== 'COMBAT' || e.state === 'DEAD') continue
          const eDist = e.group.position.distanceTo(dt.pos)
          if (eDist > 18) continue
          const eEye = e.group.position.clone(); eEye.y = 1.55
          if (!hasLOS(eEye, turretEye, visionBoxes)) continue
          if (Math.random() < 0.3 * delta) dt._hp -= e.damage
        }

        // Out of ammo or destroyed → explode and remove
        if (dt._ammo <= 0 || dt._hp <= 0) {
          explodeAt(dt.pos.clone(), 3.0, 30)
          scene.remove(dt.mesh); deployedTools.splice(ti, 1); continue
        }
        if (dt._flash > 0) {
          dt._flash -= delta
          if (dt._flash <= 0) dt.mesh.material.emissive?.set(0)
        }

      // Gas Mine — slow on enemy contact
      } else if (dt.toolId === 'gasMine' && !dt._triggered) {
        for (const e of enemies) {
          if (e.state !== 'DEAD' && dt.pos.distanceTo(e.group.position) <= TOOLS.gasMine.radius) {
            dt._triggered = true
            for (const e2 of enemies) {
              if (e2.state !== 'DEAD' && dt.pos.distanceTo(e2.group.position) <= TOOLS.gasMine.radius) {
                e2._slowTimer = TOOLS.gasMine.duration
                e2._slowMult  = TOOLS.gasMine.slowMult
              }
            }
            scene.remove(dt.mesh); deployedTools.splice(ti, 1); break
          }
        }

      // Explosive Mine — detonates on enemy contact
      } else if (dt.toolId === 'explosiveMine' && !dt._triggered) {
        for (const e of enemies) {
          if (e.state !== 'DEAD' && dt.pos.distanceTo(e.group.position) < 1.5) {
            dt._triggered = true
            explodeAt(dt.pos.clone(), TOOLS.explosiveMine.radius, TOOLS.explosiveMine.dmg)
            scene.remove(dt.mesh); deployedTools.splice(ti, 1); break
          }
        }

      // Breach Charge — countdown fuse
      } else if (dt.toolId === 'breachCharge' && !dt._triggered) {
        dt._fuseTimer = (dt._fuseTimer ?? 0) + delta
        const blink = dt._fuseTimer % 0.4 < 0.2 * (1 - dt._fuseTimer / TOOLS.breachCharge.fuseTime)
        if (dt.mesh) dt.mesh.visible = !blink
        if (dt._fuseTimer >= TOOLS.breachCharge.fuseTime) {
          dt._triggered = true
          explodeAt(dt.pos.clone(), TOOLS.breachCharge.radius, TOOLS.breachCharge.dmg)
          scene.remove(dt.mesh); deployedTools.splice(ti, 1); break
        }
      }
    }

    // Goo projectile physics
    for (let gi = gooProjectiles.length - 1; gi >= 0; gi--) {
      const g = gooProjectiles[gi]
      g.pos.addScaledVector(g.vel, delta)
      g.mesh.position.copy(g.pos)
      const hitBox = new THREE.Box3(g.pos.clone().subScalar(0.14), g.pos.clone().addScalar(0.14))
      const hitWall = wallBoxes.some(b => b.intersectsBox(hitBox))
      if (hitWall || g.pos.y < -0.5 || g.pos.distanceTo(playerPos) > 30) {
        const wallMat  = new THREE.MeshLambertMaterial({ color: 0x33aa11, transparent: true, opacity: 0.72})
        const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.0, 1.4), wallMat)
        wallMesh.position.set(g.pos.x, 1.0, g.pos.z)
        scene.add(wallMesh)
        const gooBox = new THREE.Box3().setFromObject(wallMesh)
        wallBoxes.push(gooBox); visionBoxes.push(gooBox)
        const dissolveMs = (TOOLS.gooGun?.duration ?? 30) * 1000
        setTimeout(() => {
          scene.remove(wallMesh); wallMesh.geometry.dispose(); wallMesh.material.dispose()
          const wi = wallBoxes.indexOf(gooBox); if (wi >= 0) wallBoxes.splice(wi, 1)
          const vi = visionBoxes.indexOf(gooBox); if (vi >= 0) visionBoxes.splice(vi, 1)
        }, dissolveMs)
        scene.remove(g.mesh); g.mesh.geometry.dispose(); g.mesh.material.dispose()
        gooProjectiles.splice(gi, 1)
      }
    }

    // Zipline travel
    if (zipTraveling && zipAnchorA && zipAnchorB) {
      zipTravelT += delta / 1.5
      if (zipTravelT >= 1.0) {
        zipTravelT = 1.0; zipTraveling = false
        playerPos.copy(zipAnchorB); playerPos.y = 0
      } else {
        playerPos.lerpVectors(zipAnchorA, zipAnchorB, zipTravelT)
        playerPos.y = 0
      }
    }
  }

  // Initialise slot 0
  switchSlot(0)

  // ── Public API ─────────────────────────────────────────────
  return {
    deployedTools,   // shared array reference used by Engine F-key handler
    deployTool,
    switchSlot,
    tryRideZipline,
    get activeToolType() { return activeToolType },
    get zipAnchorA() { return zipAnchorA },
    tick,
  }
}
