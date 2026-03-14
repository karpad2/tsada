// ─────────────────────────────────────────────────────────────
// CombatSystem — shooting, grenades, flashbangs, reload
// ─────────────────────────────────────────────────────────────
import * as THREE from 'three'
import { state }       from '../state.ts'
import { GameManager } from '../GameManager.ts'
import { NetworkManager } from '../NetworkManager.ts'
import {
  GRENADE_FUSE, GRENADE_SPEED, GRENADE_RADIUS, GRENADE_DMG,
  FLASHBANG_FUSE, FLASHBANG_SPEED, FLASHBANG_RADIUS, FLASHBANG_STUN, FLASHBANG_BLIND,
  SMOKE_FUSE, SMOKE_SPEED, SMOKE_RADIUS, SMOKE_DURATION,
  MAX_GRENADES, MAX_FLASHBANGS, MAX_SMOKE_GRENADES, PROP_DMG, GRAVITY,
} from './constants.ts'
import { TOOLS } from '../weapons/WeaponData.ts'
import { sfx }   from '../SoundManager.ts'
import { unlock as unlockAchievement } from '../Achievements.ts'

export function createCombatSystem(ws, ctx) {
  const {
    scene, camera, weaponView,
    enemies, sentries, mines, deployedTools,
    level, physChunks, cameras,
    playerPos, eyeH, takeDamage,
  } = ctx

  // ── Weapon stats ───────────────────────────────────────────
  const WEAPON_DMG       = ws.dmg
  const FIRE_RATE        = ws.fireRate
  const MAX_AMMO         = ws.magSize
  const RESERVE_AMMO     = ws.reserve
  const RELOAD_TIME      = ws.reloadTime
  const IS_AUTO          = ws.isAuto
  const SPREAD           = ws.spread
  const PELLETS          = ws.pellets ?? 1
  const SUPPRESSED       = ws.suppressedShots ?? 0
  const MAX_RANGE        = ws.maxRange ?? Infinity
  const STUN_DURATION    = ws.stunDuration ?? 0
  const IS_SILENT        = ws.isSilent ?? false
  const IS_TASER         = ws.id === 'taser'

  // ── Headshot ─────────────────────────────────────────────
  const HEADSHOT_MULT        = 2.0
  const _hasExecutioner      = (state.skills?.sharpshooter ?? 0) >= 5
  let   _headshotShieldCd    = 0

  let ammo                = state.ammo > 0 ? state.ammo : MAX_AMMO
  let reserve             = state.reserveAmmo >= 0 ? state.reserveAmmo : RESERVE_AMMO
  let isReloading         = false
  let reloadElapsed       = 0
  let fireCooldown        = 0
  // suppressedShotsLeft removed — suppressor now silences all shots

  let grenadeCount   = MAX_GRENADES
  const grenades     = []
  let flashbangCount = MAX_FLASHBANGS
  const flashbangs   = []
  let smokeCount     = MAX_SMOKE_GRENADES
  const smokeGrenades = []
  const smokeClouds: Array<{ pos: THREE.Vector3, radius: number, timer: number, mesh: THREE.Mesh, mat: THREE.MeshBasicMaterial, light: THREE.PointLight }> = []

  const raycaster = new THREE.Raycaster()

  // ── Bullet hole decals ────────────────────────────────────
  const MAX_DECALS  = 64
  const bulletDecals: THREE.Mesh[] = []
  const _decalGeo   = new THREE.CircleGeometry(0.06, 8)

  function _spawnBulletHole(point: THREE.Vector3, normal: THREE.Vector3) {
    const mat  = new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide })
    const hole = new THREE.Mesh(_decalGeo, mat)
    hole.position.copy(point).addScaledVector(normal, 0.005)
    hole.lookAt(point.clone().add(normal))
    // Scorch ring
    const ringGeo = new THREE.RingGeometry(0.05, 0.09, 8)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x333322, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    hole.add(ring)
    scene.add(hole)
    bulletDecals.push(hole)
    // Evict oldest
    if (bulletDecals.length > MAX_DECALS) {
      const old = bulletDecals.shift()!
      old.traverse(c => { if ((c as THREE.Mesh).geometry) (c as THREE.Mesh).geometry.dispose(); if ((c as THREE.Mesh).material) ((c as THREE.Mesh).material as THREE.Material).dispose() })
      scene.remove(old)
    }
  }

  // ── Ammo sync ─────────────────────────────────────────────
  function syncAmmo() { state.ammo = ammo; state.reserveAmmo = reserve }

  function startReload() {
    if (isReloading || ammo === MAX_AMMO || reserve === 0 || state.isDown) return
    isReloading = true; reloadElapsed = 0
    state.isReloading = true; state.reloadProgress = 0
    weaponView.triggerReload()
    sfx.reload()
  }

  // ── Shoot ──────────────────────────────────────────────────
  function shoot() {
    if (fireCooldown > 0 || isReloading || ammo <= 0 || state.isDown) return
    ammo--; syncAmmo(); fireCooldown = FIRE_RATE
    if (ammo === 0 && reserve > 0) startReload()
    if (IS_TASER) sfx.taserFire(); else sfx.shoot()
    // Shooting while in disguise blows your cover
    if (state.wearingDisguise && !IS_SILENT) state.wearingDisguise = false
    if (NetworkManager.enabled) NetworkManager.send('shoot', { pi: NetworkManager.playerIndex })

    const eye           = new THREE.Vector3(playerPos.x, playerPos.y + eyeH(), playerPos.z)
    const adsSpreadMult = state.isADS ? 0.35 : 1.0

    const enemyHitboxes    = enemies.filter(e => e.state !== 'DEAD').flatMap(e => e.hitboxes)
    const sentryHitboxes   = sentries.filter(s => s.alive).map(s => s.hitbox)
    const propMeshes       = level.destructibles.filter(d => !d.shattered).map(d => d.mesh)
    const glassMeshes      = (level.glassPanels ?? []).filter(g => !g.shattered).map(g => g.mesh)
    const civilianHitboxes = (level.civilians ?? []).filter(c => !c.isDead).map(c => c.hitbox)
    const cameraHitboxes   = cameras.filter(c => c.alive).map(c => c.hitbox)

    weaponView.triggerRecoil()
    state.shotsFired++

    for (let p = 0; p < PELLETS; p++) {
      const dx  = (Math.random() - 0.5) * SPREAD * 2 * adsSpreadMult
      const dy  = (Math.random() - 0.5) * SPREAD * 2 * adsSpreadMult
      const dir = new THREE.Vector3(dx, dy, -1).normalize().applyQuaternion(camera.quaternion)
      raycaster.set(eye, dir)

      const hits = raycaster.intersectObjects(
        [...enemyHitboxes, ...sentryHitboxes, ...propMeshes, ...glassMeshes, ...civilianHitboxes, ...cameraHitboxes], false,
      )
      if (hits.length > 0) {
        const h = hits[0]
        // Range-limited weapons (taser): miss if beyond max range
        if (h.distance > MAX_RANGE) {
          if (IS_TASER) _spawnLightningArc(eye, eye.clone().addScaledVector(dir, MAX_RANGE))
          continue
        }
        if (h.object.userData.enemy) {
          const enemy = h.object.userData.enemy
          const isHead = !!h.object.userData.isHead
          const isShield = !!h.object.userData.isShield

          // Shield absorbs damage
          if (isShield && enemy._shieldHp > 0) {
            enemy._shieldHp -= WEAPON_DMG
            if (enemy._shieldHp <= 0) {
              if (enemy._shieldMesh?.parent) enemy._shieldMesh.parent.remove(enemy._shieldMesh)
              enemy.hitboxes = enemy.hitboxes.filter(hb => hb !== enemy._shieldMesh)
              enemy._shieldMesh = null
              sfx.glassShatter()
              // Achievement: shield break
              unlockAchievement('shield_break')
            }
            _spawnImpactPuff(h.point)
            sfx.bulletImpact()
          } else {
            state.shotsHit++
            if (isHead) state.headshotCount++
            const _outMult = ctx.outDmgMult ?? 1
            const dmg = (isHead ? WEAPON_DMG * HEADSHOT_MULT : WEAPON_DMG) * _outMult
            if (NetworkManager.enabled && !NetworkManager.isHost) {
              NetworkManager.send('hit', { eid: enemy.netId, dmg, head: isHead })
            } else {
              enemy.takeDamage(dmg, PELLETS > 1 ? 'shotgun' : undefined)
              if (STUN_DURATION > 0) enemy.stun(STUN_DURATION)
            }
            if (isHead && _hasExecutioner && _headshotShieldCd <= 0) {
              state.shield = Math.min(state.maxShield, state.shield + state.maxShield * 0.10)
              _headshotShieldCd = 1.0
            }
          }
        }
        else if (h.object.userData.sentry)       h.object.userData.sentry.takeDamage(WEAPON_DMG)
        else if (h.object.userData.securityCamera) h.object.userData.securityCamera.destroy()
        else if (h.object.userData.civilian) {
          h.object.userData.civilian.takeDamage(WEAPON_DMG)
          if (h.object.userData.civilian.isDead) GameManager.onCivilianKilled()
        } else if (h.object.userData.glassPanel) {
          h.object.userData.glassPanel.hit(h.point)
          sfx.glassCrack()
        } else if (h.object.userData.destructible) {
          h.object.userData.destructible.takeDamage(PROP_DMG, h.point)
          _spawnImpactPuff(h.point)
        }
        // Taser lightning arc visual
        if (IS_TASER) _spawnLightningArc(eye, h.point)

        // Bullet hole on non-living surfaces
        if (!h.object.userData.enemy && !h.object.userData.civilian && !h.object.userData.sentry && !h.object.userData.securityCamera && h.face) {
          const normal = h.face.normal.clone().transformDirection(h.object.matrixWorld).normalize()
          _spawnBulletHole(h.point.clone(), normal)
          _spawnImpactPuff(h.point)
          sfx.bulletImpact()
        }
      } else {
        // No hit on tracked objects — raycast against all scene meshes for wall hits
        raycaster.set(eye, dir)
        const wallHits = raycaster.intersectObjects(scene.children, true)
        for (const wh of wallHits) {
          if (wh.distance > MAX_RANGE) break
          if (wh.object.userData.enemy || wh.object.userData.civilian) continue
          if (wh.face) {
            const normal = wh.face.normal.clone().transformDirection(wh.object.matrixWorld).normalize()
            _spawnBulletHole(wh.point.clone(), normal)
            _spawnImpactPuff(wh.point)
            sfx.bulletImpact()
          }
          break
        }
      }
    }

    if (!GameManager.isLoudPhase()) {
      if (SUPPRESSED > 0 || IS_SILENT) { /* silent shot */ }
      else { GameManager.emit('gunshot', eye.clone()) }
    }
  }

  // ── Grenade ────────────────────────────────────────────────
  function throwGrenade() {
    if (grenadeCount <= 0) return
    grenadeCount--; state.grenades = grenadeCount
    sfx.grenadePin()
    const eye = new THREE.Vector3(playerPos.x, playerPos.y + eyeH(), playerPos.z)
    const dir = new THREE.Vector3(0, 0.3, -1).normalize().applyQuaternion(camera.quaternion).normalize()
    const geo = new THREE.SphereGeometry(0.11, 8, 8)
    const mat = new THREE.MeshLambertMaterial({ color: 0x2a4a18})
    const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true
    mesh.position.copy(eye); scene.add(mesh)
    grenades.push({ pos: eye.clone(), vel: dir.multiplyScalar(GRENADE_SPEED), mesh, timer: GRENADE_FUSE })
  }

  function _explodeGrenade(pos, radiusOverride?, dmgOverride?) {
    const R   = radiusOverride ?? GRENADE_RADIUS
    const DMG = dmgOverride   ?? GRENADE_DMG
    const falloff = (d) => Math.pow(1 - d / R, 1.5)

    for (const e of enemies) {
      if (e.state === 'DEAD') continue
      const d = e.group.position.distanceTo(pos)
      if (d < R) e.takeDamage(DMG * falloff(d), 'explosive')
    }
    for (const s of sentries) {
      if (!s.alive) continue
      const d = s.pos.distanceTo(pos)
      if (d < R) s.takeDamage(DMG * falloff(d))
    }
    for (let i = mines.length - 1; i >= 0; i--) {
      const m = mines[i]
      if (!m.alive) continue
      if (m.pos.distanceTo(pos) < R) { m.alive = false; scene.remove(m.mesh); mines.splice(i, 1) }
    }
    for (const c of (level.civilians ?? [])) {
      if (c.isDead) continue
      const d = c.group ? c.group.position.distanceTo(pos) : Infinity
      if (d < R) { c.takeDamage(DMG * falloff(d)); if (c.isDead) GameManager.onCivilianKilled() }
    }

    // Chain detonations from deployedTools
    const chainPos = []
    for (let ti = deployedTools.length - 1; ti >= 0; ti--) {
      const dt = deployedTools[ti]
      if (dt._triggered) continue
      if (dt.pos.distanceTo(pos) >= R) continue
      if (dt.toolId === 'explosiveMine') {
        dt._triggered = true
        chainPos.push({ pos: dt.pos.clone(), r: TOOLS.explosiveMine.radius, dmg: TOOLS.explosiveMine.dmg })
        scene.remove(dt.mesh); deployedTools.splice(ti, 1)
      } else if (dt.toolId === 'gasMine' || dt.toolId === 'proxMine') {
        scene.remove(dt.mesh); deployedTools.splice(ti, 1)
      }
    }

    for (const d of level.destructibles) {
      if (d.shattered) continue
      const center = new THREE.Vector3(); d.box3.getCenter(center)
      const dist   = center.distanceTo(pos)
      if (dist < R * 1.5) d.takeDamage(DMG * 1.4 * Math.pow(1 - dist / (R * 1.5), 1.2), pos)
    }

    const selfDist = playerPos.distanceTo(pos)
    if (selfDist < R) takeDamage(DMG * 0.65 * (1 - selfDist / R))

    sfx.explosion()

    const fl = new THREE.PointLight(0xff8800, 10, 14); fl.position.copy(pos); scene.add(fl)
    setTimeout(() => scene.remove(fl), 180)
    const eGeo  = new THREE.SphereGeometry(1, 14, 14)
    const eMat  = new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.88 })
    const eMesh = new THREE.Mesh(eGeo, eMat); eMesh.position.copy(pos); scene.add(eMesh)
    let t = 0
    const anim = () => {
      t += 0.018
      eMesh.scale.setScalar(1 + t * R * 1.8); eMat.opacity = Math.max(0, 0.88 - t * 2.2)
      if (t < 0.45) requestAnimationFrame(anim)
      else { scene.remove(eMesh); eGeo.dispose(); eMat.dispose() }
    }
    requestAnimationFrame(anim)

    for (const { pos: cp, r, dmg } of chainPos) _explodeGrenade(cp, r, dmg)
  }

  // ── Flashbang ──────────────────────────────────────────────
  function throwFlashbang() {
    if (flashbangCount <= 0) return
    flashbangCount--; state.flashbangs = flashbangCount
    sfx.grenadePin()
    const eye = new THREE.Vector3(playerPos.x, playerPos.y + eyeH(), playerPos.z)
    const dir = new THREE.Vector3(0, 0.3, -1).normalize().applyQuaternion(camera.quaternion).normalize()
    const geo = new THREE.SphereGeometry(0.10, 8, 8)
    const mat = new THREE.MeshLambertMaterial({ color: 0xeeeecc})
    const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true
    mesh.position.copy(eye); scene.add(mesh)
    flashbangs.push({ pos: eye.clone(), vel: dir.multiplyScalar(FLASHBANG_SPEED), mesh, timer: FLASHBANG_FUSE })
  }

  function _explodeFlashbang(pos) {
    const R         = FLASHBANG_RADIUS
    const playerEye = new THREE.Vector3(playerPos.x, playerPos.y + eyeH(), playerPos.z)
    for (const e of enemies) {
      if (e.state === 'DEAD') continue
      const d = e.group.position.distanceTo(pos)
      if (d < R) {
        const fo = 1 - d / R
        e.stun(FLASHBANG_STUN * (0.4 + 0.6 * fo))
      }
    }
    const selfDist = playerEye.distanceTo(pos)
    if (selfDist < R) {
      const fo = 1 - selfDist / R
      state.flashblind = Math.max(state.flashblind, FLASHBANG_BLIND * (0.3 + 0.7 * fo))
    }
    sfx.flashbang()

    const fl = new THREE.PointLight(0xffffff, 18, 20); fl.position.copy(pos); scene.add(fl)
    setTimeout(() => scene.remove(fl), 220)
    const eGeo  = new THREE.SphereGeometry(0.8, 12, 12)
    const eMat  = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 })
    const eMesh = new THREE.Mesh(eGeo, eMat); eMesh.position.copy(pos); scene.add(eMesh)
    let t = 0
    const anim = () => {
      t += 0.025
      eMesh.scale.setScalar(1 + t * R * 2); eMat.opacity = Math.max(0, 0.95 - t * 3)
      if (t < 0.35) requestAnimationFrame(anim)
      else { scene.remove(eMesh); eGeo.dispose(); eMat.dispose() }
    }
    requestAnimationFrame(anim)
  }

  // ── Smoke grenade ─────────────────────────────────────────
  function throwSmoke() {
    if (smokeCount <= 0) return
    smokeCount--; state.smokeGrenades = smokeCount
    sfx.grenadePin()
    const eye = new THREE.Vector3(playerPos.x, playerPos.y + eyeH(), playerPos.z)
    const dir = new THREE.Vector3(0, 0.2, -1).normalize().applyQuaternion(camera.quaternion).normalize()
    const geo = new THREE.SphereGeometry(0.09, 7, 7)
    const mat = new THREE.MeshLambertMaterial({ color: 0x888888})
    const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true
    mesh.position.copy(eye); scene.add(mesh)
    smokeGrenades.push({ pos: eye.clone(), vel: dir.multiplyScalar(SMOKE_SPEED), mesh, timer: SMOKE_FUSE })
  }

  function _spawnSmokeCloud(pos) {
    sfx.gasHiss()
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0x99aaaa, transparent: true, opacity: 0.55, depthWrite: false })
    const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(SMOKE_RADIUS, 12, 8), cloudMat)
    cloudMesh.position.copy(pos).setY(1.5)   // hover at player eye height
    scene.add(cloudMesh)
    // Soft point light inside cloud
    const light = new THREE.PointLight(0x99aaaa, 1.5, SMOKE_RADIUS * 2)
    light.position.copy(cloudMesh.position)
    scene.add(light)
    smokeClouds.push({ pos: cloudMesh.position.clone(), radius: SMOKE_RADIUS, timer: SMOKE_DURATION, mesh: cloudMesh, mat: cloudMat, light })
  }

  // ── Bullet impact puff ─────────────────────────────────────
  function _spawnImpactPuff(pos) {
    for (let i = 0; i < 5; i++) {
      const geo  = new THREE.SphereGeometry(0.04 + Math.random() * 0.04, 5, 5)
      const mat  = new THREE.MeshBasicMaterial({ color: 0xaa8866, transparent: true, opacity: 0.7 })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.copy(pos)
      scene.add(mesh)
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 3, Math.random() * 2 + 0.5, (Math.random() - 0.5) * 3)
      physChunks.push({ mesh, vel, rotVel: new THREE.Vector3(), timer: 0.5 + Math.random() * 0.3 })
    }
  }

  // ── Taser lightning arc ────────────────────────────────────
  function _spawnLightningArc(from, to) {
    const segments = 8
    const points = [from.clone()]
    for (let i = 1; i < segments; i++) {
      const t = i / segments
      const p = from.clone().lerp(to, t)
      p.x += (Math.random() - 0.5) * 0.15
      p.y += (Math.random() - 0.5) * 0.15
      p.z += (Math.random() - 0.5) * 0.15
      points.push(p)
    }
    points.push(to.clone())
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    const mat = new THREE.LineBasicMaterial({ color: 0x44aaff, transparent: true, opacity: 0.9 })
    const line = new THREE.Line(geo, mat)
    scene.add(line)
    physChunks.push({ mesh: line, vel: new THREE.Vector3(), rotVel: new THREE.Vector3(), timer: 0.15 })
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    syncAmmo,
    startReload,
    shoot,
    throwGrenade,
    throwFlashbang,
    throwSmoke,
    smokeClouds,
    explodeAt: _explodeGrenade,
    IS_AUTO,
    RELOAD_TIME,
    MAX_AMMO,
    RESERVE_AMMO,
    get ammo()          { return ammo },
    get reserve()       { return reserve },
    addReserve(amount: number) { reserve = Math.min(RESERVE_AMMO, reserve + amount); syncAmmo() },
    get isReloading()   { return isReloading },
    get grenadeCount()  { return grenadeCount },
    get flashbangCount(){ return flashbangCount },
    get smokeCount()    { return smokeCount },

    tick(delta, mouseDown, mouseJust, maskOn, isReloadKey) {
      // Headshot shield cooldown
      if (_headshotShieldCd > 0) _headshotShieldCd -= delta

      // Fire cooldown
      fireCooldown = Math.max(0, fireCooldown - delta)
      if (maskOn && mouseJust && ammo <= 0 && !isReloading) sfx.emptyClick()
      if (maskOn && (IS_AUTO ? mouseDown : mouseJust)) shoot()
      if (maskOn && isReloadKey) startReload()

      // Reload progress
      if (isReloading) {
        reloadElapsed += delta
        state.reloadProgress = Math.min(1, reloadElapsed / RELOAD_TIME)
        if (reloadElapsed >= RELOAD_TIME) {
          const refill = Math.min(MAX_AMMO - ammo, reserve)
          ammo += refill; reserve -= refill
          isReloading = false; state.isReloading = false; state.reloadProgress = 1
          syncAmmo()
          sfx.reloadDone()
        }
      }

      // Grenade physics
      for (let i = grenades.length - 1; i >= 0; i--) {
        const g = grenades[i]
        g.timer -= delta; g.vel.y -= GRAVITY * 0.55 * delta
        g.pos.addScaledVector(g.vel, delta)
        if (g.pos.y <= 0.12) {
          g.pos.y = 0.12; g.vel.y = Math.abs(g.vel.y) * 0.38; g.vel.x *= 0.72; g.vel.z *= 0.72
        }
        g.mesh.position.copy(g.pos); g.mesh.rotation.x += delta * 7; g.mesh.rotation.z += delta * 4
        if (g.timer <= 0) { _explodeGrenade(g.pos.clone()); scene.remove(g.mesh); grenades.splice(i, 1) }
      }

      // Flashbang physics
      for (let i = flashbangs.length - 1; i >= 0; i--) {
        const g = flashbangs[i]
        g.timer -= delta; g.vel.y -= GRAVITY * 0.55 * delta
        g.pos.addScaledVector(g.vel, delta)
        if (g.pos.y <= 0.12) {
          g.pos.y = 0.12; g.vel.y = Math.abs(g.vel.y) * 0.28; g.vel.x *= 0.65; g.vel.z *= 0.65
        }
        g.mesh.position.copy(g.pos); g.mesh.rotation.z += delta * 10
        if (g.timer <= 0) { _explodeFlashbang(g.pos.clone()); scene.remove(g.mesh); flashbangs.splice(i, 1) }
      }

      // Smoke grenade projectile physics
      for (let i = smokeGrenades.length - 1; i >= 0; i--) {
        const g = smokeGrenades[i]
        g.timer -= delta; g.vel.y -= GRAVITY * 0.55 * delta
        g.pos.addScaledVector(g.vel, delta)
        if (g.pos.y <= 0.12) {
          g.pos.y = 0.12; g.vel.y = Math.abs(g.vel.y) * 0.2; g.vel.x *= 0.5; g.vel.z *= 0.5
        }
        g.mesh.position.copy(g.pos)
        if (g.timer <= 0) { _spawnSmokeCloud(g.pos.clone()); scene.remove(g.mesh); smokeGrenades.splice(i, 1) }
      }

      // Smoke cloud lifetime + opacity pulse
      for (let i = smokeClouds.length - 1; i >= 0; i--) {
        const c = smokeClouds[i]
        c.timer -= delta
        // Fade in first 1.5s, hold, then fade out last 3s
        const fadeIn  = Math.min(1, (SMOKE_DURATION - c.timer) / 1.5)
        const fadeOut = c.timer < 3 ? c.timer / 3 : 1
        c.mat.opacity = 0.55 * fadeIn * fadeOut * (0.88 + Math.sin(Date.now() * 0.003) * 0.12)
        c.light.intensity = 1.5 * fadeIn * fadeOut
        if (c.timer <= 0) {
          scene.remove(c.mesh); c.mesh.geometry.dispose(); c.mat.dispose()
          scene.remove(c.light)
          smokeClouds.splice(i, 1)
        }
      }

      // Flashblind fade
      if (state.flashblind > 0) state.flashblind = Math.max(0, state.flashblind - delta)
    },
  }
}
