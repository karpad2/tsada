import * as THREE from 'three'
import { watch }          from 'vue'
import { state }          from './state.ts'
import { GameManager, setNetPhaseCallback }    from './GameManager.ts'
import { LEVELS }         from './levels/index.ts'
import { buildFromData }  from './levels/LevelBuilder.ts'
import { Enemy, hasLOS, setEnemyPositions }  from './Enemy.ts'
import { WeaponView }     from './WeaponView.ts'
import { TOOLS }          from './weapons/WeaponData.ts'
import { NetworkManager, PLAYER_COLORS as NET_COLORS } from './NetworkManager.ts'
import { MusicManager }           from './MusicManager.ts'
import { SecurityCamera }         from './SecurityCamera.ts'
import { createAssaultEntities }  from './AssaultEntities.ts'
import { createHazardSystem }    from './HazardSystem.ts'
import { createWaveManager, pickEnemyType } from './WaveManager.ts'
import { Bot, BOT_NAMES }         from './Bot.ts'
import { createCombatSystem }     from './engine/CombatSystem.ts'
import { createToolSystem }       from './engine/ToolSystem.ts'
import { createPlayerPhysics }    from './engine/PlayerPhysics.ts'
import { sfx }                    from './SoundManager.ts'
import { runActions }             from './ActionRunner.ts'
import { createPostProcessing }  from './PostProcessing.ts'
import { findClearSpawn }        from './spawnUtils.ts'
import { Hostage }               from './Hostage.ts'
import { NavGrid }               from './NavGrid.ts'
import { unlock as unlockAchievement, tickPopup as tickAchievementPopup } from './Achievements.ts'

import {
  STAND_HEIGHT, CROUCH_HEIGHT,
  MAX_SHIELD, SHIELD_RECHARGE_DELAY, SHIELD_RECHARGE_RATE, DOWN_TIMES,
} from './engine/constants.ts'

export function createEngine(canvas) {

  sfx.init()

  // ── Full reset (must happen before any GameManager.on() calls) ──
  GameManager.resetAll()

  // ── Renderer ──────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled   = true
  renderer.shadowMap.type      = THREE.PCFSoftShadowMap
  renderer.outputColorSpace    = THREE.SRGBColorSpace
  renderer.autoClear           = false
  const scene  = new THREE.Scene()
  scene.background = new THREE.Color(0x0c1118)
  scene.fog        = state.activeMutators?.includes('darkness')
    ? new THREE.Fog(0x000000, 0.5, 10)
    : new THREE.Fog(0x0c1118, 20, 65)
  if (state.activeMutators?.includes('darkness')) scene.background = new THREE.Color(0x000000)

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 100)
  camera.rotation.order = 'YXZ'

  // ── Weapon view (separate scene, drawn on top via clearDepth) ──
  const weaponView = new WeaponView(window.innerWidth / window.innerHeight)
  weaponView.setWeapon(state.weaponType ?? 'pistol', state.equippedAttachments)

  // ── Post-processing (lightweight bloom only) ────────────────
  const postProc = createPostProcessing(renderer, scene, camera, weaponView)

  // ── Lighting ──────────────────────────────────────────────
  scene.add(new THREE.HemisphereLight(0x8899bb, 0x443322, 0.5))
  const sun = new THREE.DirectionalLight(0xfff4e6, 1.6)
  sun.position.set(8, 20, 6); sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.bias      = -0.0003
  sun.shadow.normalBias = 0.02
  Object.assign(sun.shadow.camera, { near: 0.1, far: 70, left: -35, right: 35, top: 35, bottom: -35 })
  scene.add(sun)

  // ── Escort ring ────────────────────────────────────────────
  const escortRingGeo = new THREE.RingGeometry(3.5, 3.9, 48)
  escortRingGeo.rotateX(-Math.PI / 2)
  const escortRingMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })
  const escortRing    = new THREE.Mesh(escortRingGeo, escortRingMat)
  escortRing.visible  = false
  scene.add(escortRing)

  // ── Escort path lines (guard → player) ────────────────────
  const escortLineMat = new THREE.LineBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.5, depthWrite: false })
  const escortLines: THREE.Line[] = []

  // ── Level ──────────────────────────────────────────────────
  let level
  if (state.builderLevel) {
    level = buildFromData(scene, state.builderLevel)
    state.builderLevel = null
    state.currentMapId = 'custom'
  } else {
    level = LEVELS[state.selectedLevel].build(scene)
    state.currentMapId = LEVELS[state.selectedLevel]?.id ?? ''
  }

  const keycardItems   = level.keycardItems   ?? []
  const codeTerminals  = level.codeTerminals  ?? []
  const c4Zones        = level.c4Zones        ?? []
  const interactables  = level.interactables  ?? []
  let   _holdingInteractable = null
  let   _pickpocketTarget: any = null
  state.objectivesTotal = level.objectivePositions.length
    + keycardItems.length + codeTerminals.length + c4Zones.length
  state.keycards = []

  // ── Holdout mode: spawn hostage, skip objectives ──────────
  let hostage: Hostage | null = null
  let _holdoutVaultPending = false
  if (state.gameMode === 'holdout') {
    state.objectivesTotal = 0
    state.holdoutVaultOpen = false
    // Hide bag meshes
    for (const bm of level.bagMeshes) bm.visible = false
    // Spawn hostage at first secure zone center or first objective pos
    const secZone = level.zones.find(z => z.type === 'secure')
    const hx = secZone ? secZone.x : level.objectivePositions[0]?.x ?? level.playerStart.x
    const hz = secZone ? secZone.z : level.objectivePositions[0]?.z ?? level.playerStart.z
    hostage = new Hostage(scene, hx, hz)
    hostage.onFreed = () => {
      state.holdoutHostageFreed = true
      GameManager.playerDied()
    }
    // If there's a drill door (vault), wait for player to breach it before starting assault
    if ((level.drillDoorIndex ?? -1) >= 0) {
      hostage.group.visible = false  // hostage hidden behind vault door
      _holdoutVaultPending  = true
      addKillFeed('Breach the vault door to secure the hostage!', '#ffaa44')
    } else {
      // No vault on this map — auto-start assault as before
      setTimeout(() => {
        if (state.phase !== 'FAILED' && state.phase !== 'ESCAPED') {
          GameManager.holdoutStartAssault()
        }
      }, 500)
    }
  }

  // ── Shared mutable collision box lists ────────────────────
  const wallBoxes   = level.wallBoxes
  const visionBoxes = level.visionBoxes ?? level.wallBoxes
  const physChunks  = []

  for (const d of level.destructibles) {
    wallBoxes.push(d.box3); visionBoxes.push(d.box3)
    d.onShatter = chunks => {
      const wi = wallBoxes.indexOf(d.box3);   if (wi >= 0) wallBoxes.splice(wi, 1)
      const vi = visionBoxes.indexOf(d.box3); if (vi >= 0) visionBoxes.splice(vi, 1)
      physChunks.push(...chunks)
      // Environmental hazard triggers
      if (d.hazardType) {
        const center = new THREE.Vector3(); d.box3.getCenter(center)
        if (d.hazardType === 'gasTank') {
          combat.explodeAt(center, 8, 80)
          hazards.createGasCloud(center)
          sfx.gasHiss()
          // Chain-detonate nearby destructibles
          for (const d2 of level.destructibles) {
            if (d2.shattered || d2 === d) continue
            const c2 = new THREE.Vector3(); d2.box3.getCenter(c2)
            if (center.distanceTo(c2) < 8) d2.takeDamage(999, center)
          }
        } else if (d.hazardType === 'fuelBarrel') {
          combat.explodeAt(center, 5, 60)
          hazards.createFirePool(center)
        } else if (d.hazardType === 'electricPanel') {
          hazards.createSparkZone(center)
          sfx.electricShock()
        }
      }
    }
  }

  // ── Glass panels: crack → shatter → alarm ──────────────────
  for (const gp of (level.glassPanels ?? [])) {
    // Cache world center before mesh gets removed
    const gpCenter = new THREE.Vector3()
    gp.mesh.getWorldPosition(gpCenter)

    gp.onShatter = chunks => {
      physChunks.push(...chunks)
      sfx.glassShatter()
      state.glassShattered++
      // Remove collision box so player/AI can walk through
      for (let i = wallBoxes.length - 1; i >= 0; i--) {
        if (wallBoxes[i].containsPoint(gpCenter)) {
          wallBoxes.splice(i, 1)
          break
        }
      }
    }
    gp.onBreak = (center) => {
      if (!GameManager.isLoudPhase()) {
        GameManager.emit('gunshot', center)
      }
    }
  }

  // ── Zone helper ────────────────────────────────────────────
  const ZONE_PRIORITY = { public: 1, private: 2, secure: 3 }
  function getZoneAt(x, z) {
    let best = null, bestP = 0
    for (const zone of level.zones) {
      if (Math.abs(x - zone.x) < zone.w / 2 && Math.abs(z - zone.z) < zone.d / 2) {
        const p = ZONE_PRIORITY[zone.type] ?? 0
        if (p > bestP) { best = zone; bestP = p }
      }
    }
    return best
  }

  // ── Objective / escape state ──────────────────────────────
  const activeBags = new Set(level.objectivePositions.map((_, i) => i))
  let escapeActive = false
  GameManager.on('allDone', () => {
    escapeActive = true; level.setEscapeActive(true)
    state.escapeTimerActive = true; state.escapeTimerLeft = 90
    addKillFeed('All objectives done — get to the VAN!', '#ffe060')
  })
  GameManager.on('civKillPenalty', () => {
    addKillFeed('Civilian killed!  -$50,000', '#ff4444')
  })

  // ── Skill setup ────────────────────────────────────────────
  const skills        = state.skills ?? {}
  const ghostDetectMult = (skills.ghost  ?? 0) >= 1 ? 0.85 : 1.0
  const sprintMult      = (skills.muscle ?? 0) >= 2 ? 1.15 : 1.0
  const meleeUnlocked   = (skills.muscle ?? 0) >= 3
  const c4PlantTime     = 5 - ((skills.tech ?? 0) >= 1 ? 2 : 0)
  const toolCDMult      = (skills.tech ?? 0) >= 3 ? 0.70 : 1.0
  const MAX_HEALTH      = 100 + ((skills.muscle ?? 0) >= 1 ? 30 : 0)
  state.maxHealth       = MAX_HEALTH

  // ── Shared orient object (yaw/pitch mutated by mouse) ──────
  const orient = { yaw: 0, pitch: 0 }

  // ── Player physics subsystem ───────────────────────────────
  const physics = createPlayerPhysics({ wallBoxes, playerStart: level.playerStart, sprintMult, orient })
  const { playerPos } = physics

  // ── Health / shield ─────────────────────────────────────
  let health              = MAX_HEALTH
  let shield              = MAX_SHIELD
  let shieldRechargeTimer = 0
  let dmgGrace            = 0          // 0.3s invulnerability after each hit

  function revivePlayer() {
    state.isDown = false
    health = Math.max(1, MAX_HEALTH * 0.3)
    state.health = Math.round(health)
    shield = MAX_SHIELD; state.shield = MAX_SHIELD
  }

  function takeDamage(amount) {
    if (['FAILED', 'ESCAPED'].includes(state.phase)) return
    if (state.isDown) return
    if (dmgGrace > 0) return
    dmgGrace = 0.3
    // Auto mask-up on first damage
    GameManager.putOnMask()
    if ((state.skills?.muscle ?? 0) >= 4) amount *= 0.70
    if (state.activeMutators?.includes('glassCannon')) amount *= 3
    shieldRechargeTimer = SHIELD_RECHARGE_DELAY
    const shieldAbs = Math.min(shield, amount)
    shield -= shieldAbs; amount -= shieldAbs
    if (shieldAbs > 0) sfx.shieldHit()
    if (amount > 0) sfx.bodyHit()
    state.damageTaken += amount
    health  = Math.max(0, health - amount)
    state.health = Math.round(health); state.shield = Math.round(shield); state.shieldActive = false
    if (health <= 0) {
      // oneDown: instant custody after first down
      if (state.activeMutators?.includes('oneDown') && state.downCount >= 1) {
        GameManager.playerDied(); return
      }
      if (state.downCount < 3) {
        state.isDown = true; state.downCount += 1
        state.custodyTimer = DOWN_TIMES[state.downCount - 1] ?? 10
        health = 1; state.health = 1
        // Drop body bag if carrying
        if (isCarryingBodyBag) { isCarryingBodyBag = false; carriedBodyBagIdx = -1; state.isCarryingBag = false }
      } else { GameManager.playerDied() }
    }
  }

  function cuffPlayer() {
    if (state.isDown || ['FAILED', 'ESCAPED'].includes(state.phase)) return
    if (state.downCount < 3) {
      state.isDown = true; state.downCount += 1
      state.custodyTimer = DOWN_TIMES[state.downCount - 1] ?? 10
      health = 1; state.health = 1
      if (isCarryingBodyBag) { isCarryingBodyBag = false; carriedBodyBagIdx = -1; state.isCarryingBag = false }
    } else { GameManager.playerDied() }
  }

  function escortFire() {
    GameManager.triggerAlarm(); GameManager.increaseAlarm(30); takeDamage(12)
  }

  // ── Weapon stats ───────────────────────────────────────────
  const ws = state.weaponStats ?? {
    dmg: 25, fireRate: 0.14, magSize: 15, reserve: 90,
    spread: 0.018, reloadTime: 1.8, isAuto: false,
    pellets: 1, suppressedShots: 0, adsFov: 40, sightId: null,
  }
  // Apply sight ADS FOV
  state.adsFov = ws.adsFov ?? 40

  // ── Special ASSAULT entities ──────────────────────────────
  const assault = createAssaultEntities({ scene, takeDamage })
  const { mines, sentries, layMine, makeSentry, makeDroneTurret, throwMolotov } = assault

  // ── Enemies ────────────────────────────────────────────────
  const enemies = []
  const droneBombs = []
  const armorDrops:   Array<{ pos: THREE.Vector3, mesh: THREE.Mesh, mat: THREE.MeshLambertMaterial }> = []
  const uniformDrops: Array<{ pos: THREE.Vector3, mesh: THREE.Mesh, mat: THREE.MeshLambertMaterial }> = []
  const ammoDrops:    Array<{ pos: THREE.Vector3, mesh: THREE.Mesh, mat: THREE.MeshLambertMaterial }> = []
  const hazards = createHazardSystem({ scene, takeDamage, enemies })
  let _nextNetId = 1
  const _isCoopClient = NetworkManager.enabled && !NetworkManager.isHost
  const _isCoopHost   = NetworkManager.enabled && NetworkManager.isHost

  // ── Navigation grid (2D BFS flow field) ────────────────────
  const _navGrid = new NavGrid()
  const _doorPositions = level.doors.map(d => d.pivot.position.clone())
  // Build grid excluding door collision boxes AND seal boxes (doors = always walkable for nav)
  const _doorBoxSet = new Set<THREE.Box3>()
  for (const d of level.doors) {
    _doorBoxSet.add(d.box3)
    for (const sb of d.sealBoxes) _doorBoxSet.add(sb)
  }
  const _navWallBoxes = level.wallBoxes.filter(b => !_doorBoxSet.has(b))
  _navGrid.build(_navWallBoxes, _doorPositions)
  _navGrid.update(playerPos) // initial BFS so enemies have directions immediately
  let _navGridTimer = 0

  if (!_isCoopClient) {
    // Host or solo: create enemies from patrol routes (randomized count + positions)
    for (const [p1, p2] of level.patrolRoutes) {
      const guardCount = 1 + Math.floor(Math.random() * 2.5)  // 1-3 guards per route
      for (let gi = 0; gi < guardCount; gi++) {
        const t = (gi + 0.5) / guardCount + (Math.random() - 0.5) * 0.2
        const rawPos = p1.clone().lerp(p2, Math.max(0.1, Math.min(0.9, t)))
        // Small random offset perpendicular to patrol line
        const dx = p2.x - p1.x, dz = p2.z - p1.z
        const len = Math.sqrt(dx * dx + dz * dz) || 1
        const perpX = -dz / len, perpZ = dx / len
        rawPos.x += perpX * (Math.random() - 0.5) * 1.5
        rawPos.z += perpZ * (Math.random() - 0.5) * 1.5
        const spawnPos = findClearSpawn(rawPos, level.wallBoxes, level.destructibles)
        const e = new Enemy(scene, spawnPos, 'guard')
        e.netId           = _nextNetId++
        e.patrolPoints    = [p1, p2]
        e.onHitPlayer     = () => takeDamage(e.damage)
        e.onCuffPlayer    = () => cuffPlayer()
        e.onEscortFire    = () => escortFire()
        e.onDropLoot      = _onEnemyDropLoot
        e.detectionRange *= ghostDetectMult
        e._navGrid = _navGrid
        e._destructibles = level.destructibles
        if (state.activeMutators?.includes('berserker')) e.speed *= 2
        enemies.push(e)
      }
    }
  }
  // Client: enemies array starts empty — populated via 'e-spawn' messages

  // ── Keycard guard + card readers ────────────────────────────
  // Pick one random patrol guard to carry a keycard for each secure/keycard door
  const _cardReaders: Array<{ mesh: THREE.Group, doorIdx: number, pos: THREE.Vector3 }> = []
  if (!_isCoopClient && enemies.length > 0) {
    // Find secure doors that can benefit from a card reader
    const secureDoors = level.doors
      .map((d, i) => ({ door: d, idx: i }))
      .filter(({ door }) => door.type === 'secure' || door.type === 'keycard')
    if (secureDoors.length > 0) {
      // Pick a random guard to carry the keycard
      const guardPool = enemies.filter(e => e.type === 'guard')
      if (guardPool.length > 0) {
        const carrier = guardPool[Math.floor(Math.random() * guardPool.length)]
        carrier.attachKeycard('vault_keycard')
      }
      // Build a card reader mesh next to each secure door
      for (const { door, idx } of secureDoors) {
        const readerGroup = new THREE.Group()
        // Wall-mount box
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0x222222 })
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.06), bodyMat)
        body.castShadow = true
        readerGroup.add(body)
        // Screen
        const screenMat = new THREE.MeshLambertMaterial({ color: 0x001122, emissive: 0x003366, emissiveIntensity: 0.6 })
        const screen = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.005), screenMat)
        screen.position.set(0, 0.04, 0.033)
        readerGroup.add(screen)
        // Card slot
        const slotMat = new THREE.MeshLambertMaterial({ color: 0x111111 })
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.02, 0.02), slotMat)
        slot.position.set(0, -0.06, 0.03)
        readerGroup.add(slot)
        // LED indicator (red = locked)
        const ledMat = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.8 })
        const led = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 4), ledMat)
        led.position.set(0.06, 0.04, 0.035)
        readerGroup.add(led)
        // Position: offset from door along the wall direction
        const doorAngle = door._baseAngle ?? 0
        const nx = Math.sin(doorAngle)    // wall normal x
        const nz = Math.cos(doorAngle)    // wall normal z
        const dx = door.pivot.position.x
        const dz = door.pivot.position.z
        readerGroup.position.set(dx + nx * 0.2, 1.2, dz + nz * 0.2)
        readerGroup.rotation.y = doorAngle
        scene.add(readerGroup)
        _cardReaders.push({ mesh: readerGroup, doorIdx: idx, pos: readerGroup.position.clone() })
      }
    }
  }

  // ── Security cameras ───────────────────────────────────────
  const cameras = (level.cameras ?? []).map(c => new SecurityCamera(scene, c))

  // ── Combat subsystem ───────────────────────────────────────
  // Cursed: halve starting ammo before CombatSystem reads it
  if (state.activeMutators?.includes('cursed')) {
    state.ammo        = Math.max(1, Math.floor((state.ammo        > 0 ? state.ammo        : 15) / 2))
    state.reserveAmmo = Math.max(0, Math.floor((state.reserveAmmo > 0 ? state.reserveAmmo : 90) / 2))
  }

  const combatCtx = {
    scene, camera, weaponView,
    enemies, sentries, mines,
    level, physChunks, cameras,
    playerPos,
    eyeH: physics.eyeH,
    takeDamage,
    deployedTools: [],   // placeholder — filled by ToolSystem below
    outDmgMult: state.activeMutators?.includes('glassCannon') ? 3 : 1,
  }
  const combat = createCombatSystem(ws, combatCtx)

  // ── Loot drop on enemy death ────────────────────────────────
  function _onEnemyDropLoot(pos: THREE.Vector3, tier: string) {
    const ox = (Math.random() - 0.5) * 0.6, oz = (Math.random() - 0.5) * 0.6
    if (Math.random() < 0.30) {
      // Armor plate pickup (blue flat rectangle)
      const mat = new THREE.MeshLambertMaterial({ color: 0x2255cc})
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.45), mat)
      mesh.position.set(pos.x + ox, 0.05, pos.z + oz)
      mesh.rotation.y = Math.random() * Math.PI * 2
      mesh.castShadow = true; scene.add(mesh)
      armorDrops.push({ pos: mesh.position.clone(), mesh, mat })
    } else if (Math.random() < 0.18 && tier !== 'heavy') {
      // Uniform drop (police jacket)
      const color = tier === 'medium' ? 0x1a2550 : 0x1a50cc
      const mat = new THREE.MeshLambertMaterial({ color})
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.55), mat)
      mesh.position.set(pos.x + ox, 0.04, pos.z + oz)
      mesh.rotation.y = Math.random() * Math.PI * 2
      mesh.castShadow = true; scene.add(mesh)
      uniformDrops.push({ pos: mesh.position.clone(), mesh, mat })
    } else {
      // Ammo box (always drops if no armor/uniform)
      const mat = new THREE.MeshLambertMaterial({ color: 0x886622})
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.12, 0.28), mat)
      mesh.position.set(pos.x + ox, 0.07, pos.z + oz)
      mesh.rotation.y = Math.random() * Math.PI * 2
      mesh.castShadow = true; scene.add(mesh)
      ammoDrops.push({ pos: mesh.position.clone(), mesh, mat })
    }
  }

  // ── Tool subsystem ─────────────────────────────────────────
  const tools = createToolSystem({
    scene, enemies,
    wallBoxes, visionBoxes,
    playerPos, orient,
    explodeAt: combat.explodeAt,
    toolCDMult,
    equippedToolIds: state.equippedTools ?? [null, null],
  })

  // Wire shared deployedTools array into combat context
  combatCtx.deployedTools = tools.deployedTools

  // ── AI bots (fill remaining slots not taken by real co-op players) ──
  const _botCount = NetworkManager.enabled ? Math.max(0, 3 - (NetworkManager.playerCount - 1)) : 3
  const bots = Array.from({ length: _botCount }, (_, i) => {
    const bot = new Bot(scene, i)
    bot.pos.set(level.playerStart.x, 0, level.playerStart.z)
    bot.group.position.copy(bot.pos)
    bot.spawnPos = bot.pos.clone()
    bot.onRevivePlayer = () => {
      revivePlayer()
      state.hint = `${bot.name} revived you!`
    }
    return bot
  })
  // Reset state.bots — co-op players fill first slots, AI bots fill the rest
  const _coopOtherCount = NetworkManager.enabled ? NetworkManager.playerCount - 1 : 0
  const _PLAYER_NAMES = ['PLAYER 2', 'PLAYER 3', 'PLAYER 4']
  const _BOT_NAMES_   = ['DALLAS', 'WOLF', 'CHAINS']
  for (let i = 0; i < 3; i++) {
    if (i < _coopOtherCount) {
      state.bots[i].name = _PLAYER_NAMES[i]
      state.bots[i].hp = 100; state.bots[i].maxHp = 100
      state.bots[i].aiState = 'FOLLOW'; state.bots[i].reviveProgress = 0
      state.bots[i].isPlayer = true
    } else {
      state.bots[i].name = _BOT_NAMES_[i - _coopOtherCount] ?? _BOT_NAMES_[i]
      state.bots[i].hp = 100; state.bots[i].maxHp = 100
      state.bots[i].aiState = 'FOLLOW'; state.bots[i].reviveProgress = 0
      state.bots[i].isPlayer = false
    }
  }

  // ── Kill feed & bot voice helpers ─────────────────────────
  let _feedId = 0
  const _feedTimers: ReturnType<typeof setTimeout>[] = []
  function addKillFeed(text: string, color = '#cccccc') {
    const id = ++_feedId
    state.killFeed.push({ id, text, color })
    _feedTimers.push(setTimeout(() => {
      const i = state.killFeed.findIndex(k => k.id === id)
      if (i >= 0) state.killFeed.splice(i, 1)
    }, 3000))
    // Also push to chat as SYSTEM message
    state.chatMessages.push({ id: Date.now() + Math.random(), text, system: true, color, time: Date.now() })
    if (state.chatMessages.length > 30) state.chatMessages.shift()
  }
  function _actionCtx() {
    return { state, scene, level, GameManager, enemies, interactables, cameras, playerPos, addKillFeed }
  }

  // ── Ping system ──────────────────────────────────────────────
  const _pingMarkers: Array<{ mesh: THREE.Mesh, ring: THREE.Mesh, timer: number, x: number, z: number }> = []
  const _pingRaycaster = new THREE.Raycaster()

  function _placePing() {
    if (!state.maskOn) return   // can't ping while unmasked
    const eye = new THREE.Vector3(playerPos.x, playerPos.y + physics.eyeH(), playerPos.z)
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
    _pingRaycaster.set(eye, dir)
    _pingRaycaster.far = 50
    const hits = _pingRaycaster.intersectObjects(scene.children, true)
    let pingPos: THREE.Vector3
    if (hits.length > 0 && !hits[0].object.userData.enemy) {
      pingPos = hits[0].point.clone()
    } else {
      pingPos = eye.clone().addScaledVector(dir, 20)
    }
    pingPos.y = 0.1

    // 3D marker
    const markerGeo = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 8)
    const markerMat = new THREE.MeshBasicMaterial({ color: 0x44aaff, transparent: true, opacity: 0.6 })
    const marker = new THREE.Mesh(markerGeo, markerMat)
    marker.position.copy(pingPos); marker.position.y = 1.25
    scene.add(marker)

    // Ring on ground
    const ringGeo = new THREE.RingGeometry(0.8, 1.0, 16)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x44aaff, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.copy(pingPos); ring.position.y = 0.05
    scene.add(ring)

    _pingMarkers.push({ mesh: marker, ring, timer: 6, x: pingPos.x, z: pingPos.z })
    sfx.pickup()

    // Add to minimap pings
    state.minimap.pings.push({ x: pingPos.x, z: pingPos.z, timer: 6, color: '#44aaff' })

    // Broadcast in co-op
    if (NetworkManager.enabled) NetworkManager.send('ping', { x: pingPos.x, z: pingPos.z })
  }

  function addBotVoice(botName: string, colorHex: number, text: string) {
    const id = ++_feedId
    state.botVoices.push({ id, botName, colorHex, text })
    _feedTimers.push(setTimeout(() => {
      const i = state.botVoices.findIndex(v => v.id === id)
      if (i >= 0) state.botVoices.splice(i, 1)
    }, 3500))
  }

  // ── Bot voice lines ────────────────────────────────────────
  const BOT_VOICE_LINES = {
    COMBAT:   ['Enemy spotted!', 'Contact!', 'Engaging!', 'Taking fire!'],
    DEAD:     ["I'm down!", 'Man down!', 'KIA!'],
    REVIVING: ['I got you!', 'Hold on!', 'Stay with me!'],
  }
  for (const bot of bots) {
    const b = bot
    b.onStateChange = (st: string) => {
      const pool = BOT_VOICE_LINES[st]
      if (pool) addBotVoice(b.name, b.colorHex, pool[Math.floor(Math.random() * pool.length)])
    }
  }

  // ── Radio mechanic ─────────────────────────────────────────
  // When enemy enters COMBAT (stealth only) → 3s to kill them before alarm
  const enemyRadio = new Map<any, { timer: number, mesh: THREE.Mesh }>()

  // ── Civilian marker icons (!, ☎, ✓) ────────────────────────
  function _makeCivIcon(text: string, color: string): THREE.CanvasTexture {
    const c = document.createElement('canvas'); c.width = 64; c.height = 64
    const ctx = c.getContext('2d')!
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.beginPath(); ctx.arc(32, 32, 28, 0, Math.PI * 2); ctx.fill()
    ctx.font = 'bold 40px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillStyle = color; ctx.fillText(text, 32, 34)
    return new THREE.CanvasTexture(c)
  }
  const _civTex = {
    spot:  _makeCivIcon('!', '#ffdd00'),
    phone: _makeCivIcon('☎', '#ff8800'),
    dom:   _makeCivIcon('✓', '#44ff66'),
  }
  const civMarkers = new Map<any, { sprite: THREE.Sprite, kind: string }>()

  // ── Bag carry ──────────────────────────────────────────────
  let isCarryingBag = false
  let carriedBagIdx = -1
  const physBags    = []

  // ── Thermal drill ─────────────────────────────────────────
  let isCarryingDrill = false
  let drillPlaced     = false
  let drillProgress   = 0
  const drillDoorIdx  = level.drillDoorIndex ?? -1
  const drillTime     = level.drillTime ?? 240
  const drillMesh     = level.drillMesh
  const drillInitPos  = drillMesh ? drillMesh.position.clone() : null
  state.isCarryingDrill = false; state.drillActive = false; state.drillProgress = 0

  // ── Security bars (art gallery) ──────────────────────────────
  const barsCut     = new Set<number>()     // painting indices where bars have been sawed
  let   hackProgress = 0
  const hackPos     = level.hackPos         // {x,z} or null
  const hackTime    = level.hackTime ?? 180
  state.barsActive = false; state.isSawing = false; state.sawProgress = 0
  state.hackActive = false; state.hackProgress = 0
  state.drillTimeMax = drillTime

  // ── Openable safes (lockpick) ───────────────────────────────
  const safes = level.safes ?? []
  let _waitingForLockpick = false
  state.lockpickActive = false; state.lockpickSafeIdx = -1; state.lockpickResult = ''

  // ── Body bags (dead guard cleanup) ────────────────────────
  // unbaggedBodies: dead enemies not yet bagged (visible corpse = suspicious)
  // bodyBags: blue bags on the ground (still suspicious if guards see them)
  const unbaggedBodies: Array<{ enemy: any, pos: THREE.Vector3 }> = []
  const bodyBags: Array<{ mesh: THREE.Mesh, pos: THREE.Vector3, settled: boolean, vel: THREE.Vector3 }> = []
  let isCarryingBodyBag = false
  let carriedBodyBagIdx = -1
  const BODY_BAG_COLOR  = 0x2244aa

  // ── Input ──────────────────────────────────────────────────
  const keys   = {}
  const justDn = {}
  let mouseDown = false
  let mouseJust = false

  const onKeyDn   = e => {
    if (state.chatOpen) return; keys[e.code] = true; justDn[e.code] = true
    if (e.code === 'Tab') { e.preventDefault(); state.tacMapOpen = true }
  }
  const onKeyUp   = e => {
    keys[e.code] = false
    if (e.code === 'Tab') state.tacMapOpen = false
  }
  const onMouse   = e => {
    if (document.pointerLockElement !== canvas) return
    const sens = state.mouseSensitivity * 0.002
    orient.yaw   -= e.movementX * sens
    orient.pitch  = Math.max(-1.45, Math.min(1.45, orient.pitch - e.movementY * sens))
    weaponView.addSway(e.movementX, e.movementY)
  }
  const onMDn     = e => {
    sfx.resume()
    if (e.button === 0) { mouseDown = true; mouseJust = true }
    if (e.button === 2 && !ws.noADS) state.isADS = true
    if (e.button === 1) { e.preventDefault(); _placePing() }
  }
  const onMUp     = e => { if (e.button === 0) mouseDown = false; if (e.button === 2) state.isADS = false }
  const onCtxMenu = e => e.preventDefault()
  const onResize  = () => {
    const w = window.innerWidth, h = window.innerHeight
    renderer.setSize(w, h)
    postProc.resize(w, h)
    const aspect = w / h
    camera.aspect = aspect; camera.updateProjectionMatrix()
    weaponView.setAspect(aspect)
  }

  document.addEventListener('keydown',   onKeyDn)
  document.addEventListener('keyup',     onKeyUp)
  document.addEventListener('mousemove', onMouse)
  document.addEventListener('mousedown', onMDn)
  document.addEventListener('mouseup',   onMUp)
  canvas.addEventListener('contextmenu', onCtxMenu)
  window.addEventListener('resize',      onResize)

  // ── Wave manager ───────────────────────────────────────────
  const waveManager = createWaveManager({
    scene, level, enemies, takeDamage,
    layMine,
    onDeploySentry: p => makeSentry(p),
    throwMolotov,
    onDropBomb: (from, to) => {
      const mat = new THREE.MeshLambertMaterial({ color: 0x222222 })
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), mat)
      mesh.position.copy(from)
      scene.add(mesh)
      droneBombs.push({ mesh, vel: new THREE.Vector3(0, -0.5, 0), mat })
    },
    postSpawn: _isCoopClient ? null : (spawned) => {
      // Assign netIds to newly spawned enemies + broadcast to clients
      for (const e of spawned) {
        e.netId = _nextNetId++
        e.onDropLoot = _onEnemyDropLoot
        e._navGrid = _navGrid
        e._destructibles = level.destructibles
        if (state.activeMutators?.includes('berserker')) e.speed *= 2
        // Sniper elevation (grapple to high point)
        if (e._cfg?.elevate) {
          e.group.position.y = e._cfg.elevate
          e._sniperElevated = true
        }
        if (e._cfg?.deploysDroneTurret) e.onDeployDroneTurret = p => makeDroneTurret(p)
        if (e._cfg?.isTaser) {
          e.onTaserHit = (stunDur) => {
            state.flashblind = Math.max(state.flashblind, stunDur * 0.3)
            addKillFeed('TASED! Controls locked!', '#cccc22')
            sfx.taserZap()
            unlockAchievement('taser_dodge')
          }
        }
        if (e._cfg?.flashbangInterval) {
          e.onThrowFlashbang = () => {
            state.flashbangTimer = 3.0
            addKillFeed('FLASHBANG!', '#ffffff')
          }
        }
        if (e._cfg?.isMedic) e._nearbyAllies = enemies
        if (e._cfg?.commandInterval) {
          e.onCallReinforcements = (pos) => {
            if (state.enemiesAlive >= 45) return
            for (let ci = 0; ci < 3; ci++) {
              const raw = new THREE.Vector3(
                pos.x + (Math.random() - 0.5) * 5, 0,
                pos.z + (Math.random() - 0.5) * 5,
              )
              const sp = findClearSpawn(raw, level.wallBoxes, level.destructibles)
              const ne = new Enemy(scene, sp, 'cop_smg')
              ne.onHitPlayer    = () => takeDamage(ne.damage)
              ne.onLayMine      = p => layMine(p)
              ne.onDeploySentry = p => makeSentry(p)
              ne.onThrowMolotov = (f, t) => throwMolotov(f, t)
              ne.onDropLoot     = _onEnemyDropLoot
              ne._navGrid = _navGrid
              ne.netId          = _nextNetId++
              enemies.push(ne); state.enemiesAlive++
            }
            addKillFeed('Commander called backup!', '#ff4422')
          }
        }
      }
      if (_isCoopHost) {
        const spawnData = spawned.map(e => ({
          id: e.netId,
          x: e.group.position.x, z: e.group.position.z,
          etype: e.type,
        }))
        NetworkManager.send('e-spawn', { enemies: spawnData })
      }
    },
  })

  // ── Music ──────────────────────────────────────────────────
  const music = new MusicManager()
  music.init().then(() => { music.setVolume(state.musicVolume); music.setPhase(state.phase) })
  watch(() => state.musicVolume, v => music.setVolume(v))

  // ── Breachable walls: AI blows them open at ASSAULT start ──
  let _breached = false
  function _breachAllWalls() {
    if (_breached) return
    _breached = true
    addKillFeed('BREACH! Enemies blowing through walls!', '#ff6633')
    const breachables = level.destructibles.filter(d => d.isBreachable && !d.shattered)
    if (breachables.length === 0) return
    // Stagger breaches slightly for dramatic effect
    breachables.forEach((d, i) => {
      setTimeout(() => {
        if (d.shattered) return
        const center = new THREE.Vector3()
        d.box3.getCenter(center)
        const flash = new THREE.PointLight(0xff8833, 15, 20)
        flash.position.copy(center)
        scene.add(flash)
        setTimeout(() => scene.remove(flash), 300)
        sfx.gasHiss()
        d.takeDamage(9999, center)
      }, i * 400) // 0.4s stagger between each breach
    })
    // Rebuild NavGrid after all breaches (with small delay for last one)
    setTimeout(() => {
      const navWalls = level.wallBoxes.filter(b => !_doorBoxSet.has(b))
      _navGrid.build(navWalls, _doorPositions)
      _navGrid.update(playerPos)
    }, breachables.length * 400 + 100)
  }

  GameManager.on('phaseChanged', phase => {
    music.setPhase(phase)
    if (['ANTICIPATION', 'ASSAULT'].includes(phase))
      for (const c of (level.civilians ?? [])) c.startFleeing(level.exfilZones)
    if (phase === 'ASSAULT') _breachAllWalls()
    // Alarm raised → stealth rating penalty
    if (phase === 'CONTROL') state.stealthRating = Math.max(0, state.stealthRating - 25)
  })
  GameManager.on('spawnWave', waveManager.spawnWave)
  GameManager.on('retreatAll', () => {
    waveManager.cancelNextWave()
    const retreatTargets = level.exfilZones.length ? level.exfilZones : level.spawnPoints
    enemies.forEach(e => {
      if (!e.isPolice || e.state === 'DEAD') return
      const closest = retreatTargets.reduce((b, sp) =>
        e.group.position.distanceTo(sp) < e.group.position.distanceTo(b) ? sp : b)
      e.beginRetreat(closest)
    })
  })

  // ── Gunshot hearing: nearby enemies investigate / radio ─────
  const GUNSHOT_RANGE = 30
  GameManager.on('gunshot', (shotPos: THREE.Vector3) => {
    let closestDist = Infinity
    let closestEnemy = null

    for (const e of enemies) {
      if (e.state === 'DEAD' || e.state === 'COMBAT' || e.state === 'RETREAT') continue
      const d = e.group.position.distanceTo(shotPos)
      if (d > GUNSHOT_RANGE) continue

      // Track closest for radio duty
      if (d < closestDist) { closestDist = d; closestEnemy = e }

      // Others: investigate the sound
      e.state          = 'SEARCH'
      e._searchTarget  = shotPos.clone()
      e._wanderTarget  = null
      e._searchTimer   = 9.0
    }

    // Closest enemy → COMBAT + starts radio
    if (closestEnemy) {
      closestEnemy.state          = 'COMBAT'
      closestEnemy._lastKnownPos  = shotPos.clone()
      closestEnemy._losLostTimer  = 0
      closestEnemy._combatDelay   = 5.0

      if (['STEALTH', 'CONTROL'].includes(state.phase) && !closestEnemy._radioStarted) {
        closestEnemy._radioStarted = true
        const rm = new THREE.Mesh(
          new THREE.SphereGeometry(0.13, 6, 4),
          new THREE.MeshBasicMaterial({ color: 0xff2222, depthTest: false, depthWrite: false }),
        )
        rm.renderOrder = 9999
        rm.position.set(closestEnemy.group.position.x, 2.3, closestEnemy.group.position.z)
        scene.add(rm)
        enemyRadio.set(closestEnemy, { timer: 3.0, mesh: rm })
        sfx.guardAlert()
        addKillFeed('Guard heard gunshot!  Radioing!', '#ffaa00')
      }
    }
  })

  // ── Initial state sync ─────────────────────────────────────
  state.health       = health; state.maxHealth = MAX_HEALTH
  state.shield       = shield; state.maxShield = MAX_SHIELD
  state.shieldActive = false
  state.isCarryingBag = false; state.isADS = false; state.isDown = false
  state.flashblind   = 0
  state.tieCivCount  = 0; state.killCount = 0; state.headshotCount = 0
  state.shotsFired = 0; state.shotsHit = 0; state.damageTaken = 0
  state.dominateCount = 0; state.glassShattered = 0; state.civilianKills = 0
  state.killFeed.length = 0; state.botVoices.length = 0
  state.escapeTimerActive = false; state.escapeTimerLeft = 90; state.escapeCountdown = 0
  state.sessionTime    = 0; state.stealthRating = 100
  state.wearingDisguise = false
  state.smokeGrenades  = 2
  combat.syncAmmo()

  // ── Co-op remote players ──────────────────────────────────
  const remotePlayers = {}
  let netTimer = 0, _remoteBroadcasting = false
  let pagerQueue   = 0   // queued pager responses (additional stealth kills while one is active)
  let _noiseTimer  = 0   // seconds of elevated shoot-noise remaining
  let _prevAmmo    = -1  // detect shots fired (ammo decrease without reload)

  function _makeRemoteMesh(colorHex) {
    function bx(w, h, d, mat, x = 0, y = 0, z = 0) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
      m.position.set(x, y, z); m.castShadow = true; return m
    }
    function lp(w, h, d, mat, px) {
      const pivot = new THREE.Group()
      pivot.position.set(px, SH, 0)
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
      mesh.position.y = -h / 2; mesh.castShadow = true
      pivot.add(mesh); return pivot
    }
    const HIP = 0.62, SH = 1.22, HY = 1.60, EZ = -0.24
    const suit   = new THREE.MeshLambertMaterial({ color: colorHex})
    const blk    = new THREE.MeshLambertMaterial({ color: 0x111111})
    const msk    = new THREE.MeshLambertMaterial({ color: 0xdddddd})
    const gunMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1e})
    const armL = lp(0.18, 0.58, 0.22, suit, -0.38)
    const armR = lp(0.18, 0.58, 0.22, suit,  0.38)
    ;[armL, armR].forEach(a => {
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.10, 8, 6), blk)
      hand.position.y = -0.58; a.add(hand)
    })
    const pistol = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.10, 0.22), gunMat)
    pistol.position.set(0, -0.54, -0.14); armR.add(pistol)
    const g = new THREE.Group()
    g.add(
      bx(0.24, HIP,  0.26, suit, -0.14, HIP / 2, 0), bx(0.24, HIP,  0.26, suit,  0.14, HIP / 2, 0),
      bx(0.24, 0.12, 0.30, blk,  -0.14, 0.08, 0.04), bx(0.24, 0.12, 0.30, blk,   0.14, 0.08, 0.04),
      bx(0.54, 0.64, 0.32, suit,  0,    HIP + 0.32, 0),
      armL, armR,
      bx(0.46, 0.52, 0.46, suit,  0,    HY, 0),
      bx(0.40, 0.40, 0.05, msk,   0,    HY + 0.02, EZ - 0.01),
      bx(0.09, 0.09, 0.07, blk,  -0.11, HY + 0.07, EZ - 0.03),
      bx(0.09, 0.09, 0.07, blk,   0.11, HY + 0.07, EZ - 0.03),
      bx(0.22, 0.03, 0.07, blk,   0,    HY - 0.07, EZ - 0.03),
      bx(0.22, 0.03, 0.07, blk,   0,    HY - 0.12, EZ - 0.03),
      bx(0.22, 0.03, 0.07, blk,   0,    HY - 0.17, EZ - 0.03),
    )
    g._armL = armL; g._armR = armR
    return g
  }

  // ── Game loop ──────────────────────────────────────────────
  let lastTime = 0, rafId

  function loop(now) {
    rafId = requestAnimationFrame(loop)
    const delta = Math.min((now - lastTime) / 1000, 0.05)
    lastTime = now
    if (delta <= 0) return

    // FPS counter
    if (state.showFPS) state.fps = Math.round(1 / delta)

    // Flashbang fade-out
    if (state.flashbangTimer > 0) state.flashbangTimer = Math.max(0, state.flashbangTimer - delta)

    // F3 toggle FPS
    if (justDn['F3']) state.showFPS = !state.showFPS

    const isPlaying = !['FAILED', 'ESCAPED'].includes(state.phase)
    const isLocked  = !!document.pointerLockElement

    if (!_isCoopClient) GameManager.tick(delta)
    if (!_isCoopClient) waveManager.tick(delta)

    // ADS FOV lerp
    const targetFov = state.isADS ? state.adsFov : 75
    camera.fov = camera.fov + (targetFov - camera.fov) * Math.min(1, delta * 14)
    camera.updateProjectionMatrix()

    if (isPlaying && isLocked) {
      state.sessionTime += delta
      tickAchievementPopup(delta)

      // ── Escape vehicle countdown ──────────────────────────
      if (state.escapeTimerActive) {
        const _prevLeft = state.escapeTimerLeft
        state.escapeTimerLeft = Math.max(0, state.escapeTimerLeft - delta)
        // Beep each second for the last 15s
        const _pi = Math.ceil(_prevLeft), _ni = Math.ceil(state.escapeTimerLeft)
        if (_prevLeft > 0 && _ni < _pi && _ni <= 15) sfx.escapeBeep(_ni <= 5)
        if (state.escapeTimerLeft <= 0) {
          state.escapeTimerActive = false
          if (!['ESCAPED', 'FAILED'].includes(state.phase)) {
            addKillFeed('VAN LEFT — mission failed!', '#ff3333')
            GameManager.playerDied()
          }
        }
      }

      // ── Pager system ─────────────────────────────────────
      if (state.pagerActive && state.phase === 'STEALTH') {
        state.pagerTimeLeft -= delta
        if (keys['KeyF'] && !state.isDown) {
          state.pagerAnswerProgress += delta / 10   // 10s continuous hold to answer
          if (state.pagerAnswerProgress >= 1) {
            // Successfully answered
            state.pagerActive = false
            state.pagerAnswerProgress = 0
            state.pagerTimeLeft = 0
            addKillFeed('Pager answered.', '#44ff88')
            sfx.pickup()
            if (pagerQueue > 0) {
              pagerQueue--
              state.pagerActive = true
              state.pagerTimeLeft = 11
              state.pagerAnswerProgress = 0
              addKillFeed('Another pager ringing — Hold F!', '#ff6600')
            }
          }
        } else if (!keys['KeyF'] && state.pagerAnswerProgress > 0) {
          // Released F mid-hold → immediate alert
          state.pagerActive = false
          state.pagerAnswerProgress = 0
          state.pagerTimeLeft = 0
          pagerQueue = 0
          GameManager.triggerAlarm()
          addKillFeed('PAGER DROPPED — ALARM!', '#ff2222')
        }
        if (state.pagerActive && state.pagerTimeLeft <= 0) {
          // Time ran out → alarm
          state.pagerActive = false
          state.pagerAnswerProgress = 0
          pagerQueue = 0
          GameManager.triggerAlarm()
          addKillFeed('PAGER NOT ANSWERED — ALARM!', '#ff2222')
        }
      }

      // ── Noise / footstep system ───────────────────────────
      {
        // Detect shots fired (ammo dropped without reloading)
        if (_prevAmmo > 0 && state.ammo < _prevAmmo && !state.isReloading) _noiseTimer = 2.5
        _prevAmmo = state.ammo
        _noiseTimer = Math.max(0, _noiseTimer - delta)

        const _isSprinting = (keys['ShiftLeft'] || keys['ShiftRight']) && !physics.isCrouching
        const _isMoving    = !!(keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'])
        let _noiseRadius = 0
        if (_noiseTimer > 0) {
          _noiseRadius = 12
        } else if (!physics.isCrouching && _isMoving) {
          _noiseRadius = _isSprinting ? 7 : 3
        }
        state.noiseRadius = _noiseRadius

        // Alert nearby PATROL enemies to noise (stealth only)
        if (_noiseRadius > 0 && state.phase === 'STEALTH' && !state.isDown) {
          for (const e of enemies) {
            if (e.state !== 'PATROL') continue
            if (e.group.position.distanceTo(playerPos) < _noiseRadius) {
              e.state = 'SEARCH'
              e._lastKnownPos = playerPos.clone()
            }
          }
        }
      }

      // ── Down / custody timer ─────────────────────────────
      if (state.isDown) {
        state.custodyTimer = Math.max(0, state.custodyTimer - delta)
        if (state.custodyTimer <= 0) { state.reviveProgress = 0; state.isDown = false; GameManager.playerDied() }

        // Doctor Bag nearby → instant revive on first press
        if (justDn['KeyF']) {
          for (const dt of tools.deployedTools) {
            if (dt.toolId === 'doctorBag' && dt.uses > 0 && playerPos.distanceTo(dt.pos) < 2.0) {
              dt.uses--; state.reviveProgress = 0; state.downCount = 0; revivePlayer(); sfx.pickup(); break
            }
          }
        }
      } else {

        // ── Combat tick ────────────────────────────────────
        combat.tick(delta, mouseDown, mouseJust, state.maskOn, justDn['KeyR'])

        // ── Grenade / flashbang keys ───────────────────────
        if (justDn['Digit3']) combat.throwGrenade()
        if (justDn['Digit4']) combat.throwFlashbang()
        if (justDn['Digit5']) combat.throwSmoke()

        // ── Melee (Muscle T3) ──────────────────────────────
        if (justDn['KeyE'] && meleeUnlocked) {
          for (const e of enemies) {
            if (e.state === 'DEAD') continue
            if (e.group.position.distanceTo(playerPos) < 2.0) { e.takeDamage(9999); break }
          }
        }

        // ── Tool slot switch ───────────────────────────────
        if (justDn['Digit1']) tools.switchSlot(0)
        if (justDn['Digit2']) tools.switchSlot(1)
        if (justDn['KeyQ'] && state.toolId && state.toolCooldownLeft <= 0) tools.deployTool()

        // ── F key priority chain ───────────────────────────
        if (justDn['KeyF']) {
          let handled = false

          // 1. Doors
          if (!handled) {
            for (const door of level.doors) {
              if (!door.isOpen && door.isNear(playerPos)) {
                if (door.type === 'drill') {
                  state.hint = 'REQUIRES THERMAL DRILL'
                } else if (door.type === 'secure' && !state.maskOn) {
                  state.hint = 'PUT ON MASK TO BREACH'
                } else if (door.type === 'keycard') {
                  if (state.keycards.includes(door.keycardId)) {
                    door.open()
                    if (NetworkManager.enabled) NetworkManager.send('door', { idx: level.doors.indexOf(door) })
                  }
                  else state.hint = `NEED KEYCARD: ${door.keycardId}`
                } else {
                  door.open(); sfx.doorOpen()
                  if (NetworkManager.enabled) NetworkManager.send('door', { idx: level.doors.indexOf(door) })
                }
                handled = true; break
              }
            }
          }

          // 1b. Safes — start lockpick minigame
          if (!handled && !state.isDown && !isCarryingBag && !isCarryingBodyBag) {
            for (let si = 0; si < safes.length; si++) {
              const safe = safes[si]
              if (safe.shattered || safe._safeOpen) continue
              const sp = new THREE.Vector3(); safe.mesh.getWorldPosition(sp)
              if (playerPos.distanceTo(sp) < 2.2) {
                state.lockpickSafeIdx = si
                state.lockpickResult = ''
                state.lockpickActive = true
                _waitingForLockpick = true
                document.exitPointerLock()
                handled = true; break
              }
            }
          }

          // 2. Shout at civilian (mask must be on)
          if (!handled && state.maskOn) {
            for (const civ of (level.civilians ?? [])) {
              if (!civ.isDead && !civ.isSurrendering && !civ.isTied &&
                  playerPos.distanceTo(civ.group.position) < 2.5) {
                civ.shoutAt()
                state.hint = 'GET DOWN!'
                handled = true; break
              }
            }
          }

          // 2a-pick. Pickpocket keycard from guard (stealth, within 2m, from behind)
          if (!handled && !state.isDown && !state.maskOn) {
            for (const e of enemies) {
              if (e._hasKeycard && !e._keycardStolen && e.state === 'PATROL' &&
                  playerPos.distanceTo(e.group.position) < 2.0) {
                // Check player is behind the guard (dot product with guard forward)
                const guardFwd = new THREE.Vector3(0, 0, 1).applyQuaternion(e.group.quaternion)
                const toPlayer = playerPos.clone().sub(e.group.position).normalize()
                if (guardFwd.dot(toPlayer) < 0.2) {
                  // Start hold-F pickpocket
                  state.interactHoldMax = 2.5
                  _pickpocketTarget = e
                  handled = true; break
                }
              }
            }
          }

          // 2b. Dominate guard (patrol, search, escort, cuff, or combat delay)
          if (!handled && state.maskOn) {
            for (const e of enemies) {
              if (e.state !== 'DEAD' && e.state !== 'SURRENDERED' && e.state !== 'TIED' && e.state !== 'RETREAT' &&
                  !(e.state === 'COMBAT' && e._combatDelay <= 0) &&
                  playerPos.distanceTo(e.group.position) < 3.0) {
                if (e.dominate()) {
                  state.dominateCount++
                  // Cancel radio if active
                  const radio = enemyRadio.get(e)
                  if (radio) { scene.remove(radio.mesh); radio.mesh.geometry.dispose(); (radio.mesh.material as THREE.Material).dispose(); enemyRadio.delete(e) }
                  addKillFeed('Guard dominated!', '#44ff66')
                  state.hint = 'GET DOWN!'
                  handled = true; break
                }
              }
            }
          }

          // 3. Interactables (buttons, levers, terminals)
          if (!handled && !state.isDown) {
            for (const ia of interactables) {
              if (!ia.used && ia.enabled && ia.isNear(playerPos)) {
                if (ia.requireMask && !state.maskOn) {
                  state.hint = 'PUT ON MASK FIRST'
                } else if (ia.holdTime > 0) {
                  state.interactHoldMax = ia.holdTime
                  _holdingInteractable = ia
                } else {
                  ia.activate()
                  runActions(ia.actions, _actionCtx())
                  sfx.pickup()
                }
                handled = true; break
              }
            }
          }

          // 3b. Card readers — use stolen keycard to open secure door silently
          if (!handled && !state.isDown) {
            for (const cr of _cardReaders) {
              if (playerPos.distanceTo(cr.pos) < 2.0) {
                const door = level.doors[cr.doorIdx]
                if (door && !door.isOpen) {
                  if (state.keycards.includes('vault_keycard')) {
                    door.open(); sfx.doorOpen()
                    addKillFeed('Card reader accepted — door unlocked', '#44ff66')
                    // Turn LED green
                    cr.mesh.children[3]?.material?.color?.set(0x00ff00)
                    cr.mesh.children[3]?.material?.emissive?.set(0x00ff00)
                  } else {
                    state.hint = 'NEED KEYCARD'
                  }
                }
                handled = true; break
              }
            }
          }

          // 4. Keycard pickups
          if (!handled && !state.isDown) {
            for (const kc of keycardItems) {
              if (!kc.collected && playerPos.distanceTo(kc.pos) < 2.0) {
                kc.collected = true
                scene.remove(kc.mesh); scene.remove(kc.pedestalMesh); scene.remove(kc.light)
                state.keycards.push(kc.id); GameManager.completeObjective(); state.sessionXP += 100
                sfx.pickup()
                state.hint = `Keycard collected: ${kc.id}`; handled = true; break
              }
            }
          }

          // 4. Code terminals
          if (!handled && !state.isDown) {
            for (const ct of codeTerminals) {
              if (!ct.completed && playerPos.distanceTo(ct.pos) < 2.0) {
                const seq = [0, 1, 2].sort(() => Math.random() - 0.5)
                state.activeCodePuzzle = { index: ct.index, sequence: seq, inputSoFar: [] }
                handled = true; break
              }
            }
          }

          // 5. Deployed tool pickups
          if (!handled && !state.isDown) {
            for (const dt of tools.deployedTools) {
              if (playerPos.distanceTo(dt.pos) < 2.0) {
                if (dt.toolId === 'ammoBag') {
                  const refund = TOOLS[dt.toolId].pickupRefund ?? 0
                  state.toolCooldownLeft = Math.max(0, state.toolCooldownMax * (1 - refund))
                  scene.remove(dt.mesh); tools.deployedTools.splice(tools.deployedTools.indexOf(dt), 1)
                  handled = true; break
                } else if (dt.toolId === 'doctorBag' && dt.uses > 0) {
                  const heal = TOOLS['doctorBag'].heal ?? 70
                  health = Math.min(MAX_HEALTH, health + heal); state.health = Math.round(health)
                  state.downCount = 0   // reset downs
                  sfx.pickup()
                  dt.uses--
                  if (dt.uses <= 0) { scene.remove(dt.mesh); tools.deployedTools.splice(tools.deployedTools.indexOf(dt), 1) }
                  state.toolCooldownLeft = Math.max(0, state.toolCooldownMax * (1 - (TOOLS['doctorBag'].pickupRefund ?? 0)))
                  handled = true; break
                } else if (TOOLS[dt.toolId]?.pickupRefund > 0) {
                  state.toolCooldownLeft = Math.max(0, state.toolCooldownMax * (1 - TOOLS[dt.toolId].pickupRefund))
                  scene.remove(dt.mesh); tools.deployedTools.splice(tools.deployedTools.indexOf(dt), 1)
                  handled = true; break
                }
              }
            }
          }

          // 6. Zipline ride
          if (!handled && !state.isDown) handled = tools.tryRideZipline()

          // 7. Bags (with security bar saw mechanic)
          if (!handled && !isCarryingBag && !isCarryingBodyBag && !isCarryingDrill && !state.isDown) {
            for (const i of activeBags) {
              const bi = i as number
              if (playerPos.distanceTo(level.objectivePositions[bi]) < 2.2) {
                if (state.barsActive && level.barProtected && !barsCut.has(bi)) {
                  // Bars active — need to saw (handled below in hold-F section)
                } else {
                  activeBags.delete(bi); isCarryingBag = true; carriedBagIdx = bi
                  state.isCarryingBag = true; level.bagMeshes[bi].visible = true
                  if (NetworkManager.enabled) NetworkManager.send('bag-pick', { idx: bi, pi: NetworkManager.playerIndex })
                }
                break
              }
            }
          }

          // 7b. Bag a dead body (F near unbagged corpse)
          if (!handled && !isCarryingBag && !isCarryingBodyBag && !isCarryingDrill && !state.isDown) {
            for (let ui = unbaggedBodies.length - 1; ui >= 0; ui--) {
              const ub = unbaggedBodies[ui]
              if (playerPos.distanceTo(ub.pos) < 2.2) {
                // Hide enemy corpse mesh
                ub.enemy.group.visible = false
                // Create blue body bag at corpse position
                const bagMesh = new THREE.Mesh(
                  new THREE.BoxGeometry(0.45, 0.55, 0.35),
                  new THREE.MeshLambertMaterial({ color: BODY_BAG_COLOR }),
                )
                bagMesh.position.set(ub.pos.x, 0.28, ub.pos.z)
                bagMesh.castShadow = true
                scene.add(bagMesh)
                bodyBags.push({ mesh: bagMesh, pos: ub.pos.clone(), settled: true, vel: new THREE.Vector3() })
                unbaggedBodies.splice(ui, 1)
                GameManager.onBodyBagged()
                sfx.pickup()
                addKillFeed('Body bagged', '#6688cc')
                state.hint = '[F] Pick up body bag'
                handled = true; break
              }
            }
          }

          // 7c. Pick up body bag
          if (!handled && !isCarryingBag && !isCarryingBodyBag && !isCarryingDrill && !state.isDown) {
            for (let bi = 0; bi < bodyBags.length; bi++) {
              const bb = bodyBags[bi]
              if (bb.settled && playerPos.distanceTo(bb.pos) < 2.2) {
                isCarryingBodyBag = true; carriedBodyBagIdx = bi
                state.isCarryingBag = true
                bb.mesh.visible = true
                handled = true; break
              }
            }
          }

          // 8. Thermal drill pickup
          if (!handled && drillMesh && !drillPlaced && !isCarryingDrill && !isCarryingBag && !isCarryingBodyBag && !state.isDown) {
            if (playerPos.distanceTo(drillMesh.position) < 2.2) {
              isCarryingDrill = true; state.isCarryingDrill = true
              drillMesh.visible = true; handled = true
              if (NetworkManager.enabled) NetworkManager.send('drill-pick', { pi: NetworkManager.playerIndex })
            }
          }

          // 9. Armor plate pickup
          if (!handled && !state.isDown) {
            for (let ai = armorDrops.length - 1; ai >= 0; ai--) {
              const a = armorDrops[ai]
              if (playerPos.distanceTo(a.pos) < 2.0) {
                scene.remove(a.mesh); a.mesh.geometry.dispose(); a.mat.dispose()
                armorDrops.splice(ai, 1)
                // Restore 60 shield
                shield = Math.min(MAX_SHIELD, shield + 60)
                state.shield = Math.round(shield)
                sfx.pickup()
                addKillFeed('Armor plate equipped! +60 shield', '#4488ff')
                handled = true; break
              }
            }
          }

          // 10. Ammo pickup (blocked by cursed mutator)
          if (!handled && !state.isDown && !state.activeMutators?.includes('cursed')) {
            for (let ai = ammoDrops.length - 1; ai >= 0; ai--) {
              const a = ammoDrops[ai]
              if (playerPos.distanceTo(a.pos) < 2.0) {
                scene.remove(a.mesh); a.mesh.geometry.dispose(); a.mat.dispose()
                ammoDrops.splice(ai, 1)
                const pickupAmt = Math.max(1, Math.round((state.weaponStats?.reserve ?? 120) / 24))
                combat.addReserve(pickupAmt)
                sfx.pickup()
                addKillFeed(`+${pickupAmt} ammo`, '#ffdd88')
                handled = true; break
              }
            }
          }

          // 11. Enemy uniform pickup (disguise)
          if (!handled && !state.isDown && !state.maskOn) {
            for (let ui = uniformDrops.length - 1; ui >= 0; ui--) {
              const u = uniformDrops[ui]
              if (playerPos.distanceTo(u.pos) < 2.0) {
                scene.remove(u.mesh); u.mesh.geometry.dispose(); u.mat.dispose()
                uniformDrops.splice(ui, 1)
                state.wearingDisguise = true
                sfx.pickup()
                addKillFeed('Enemy uniform equipped — disguised!', '#ffcc44')
                handled = true; break
              }
            }
          }
        }

        // ── F held — C4 planting ───────────────────────────
        const nearC4 = c4Zones.find(z => !z.planted && playerPos.distanceTo(z.pos) < 1.8)
        if (keys['KeyF'] && nearC4 && !state.isDown && !isCarryingBag) {
          state.isPlantingC4 = true
          state.c4PlantProgress += delta / c4PlantTime
          if (state.c4PlantProgress >= 1.0) {
            state.c4PlantProgress = 0; state.isPlantingC4 = false; nearC4.planted = true
            scene.remove(nearC4.mesh); scene.remove(nearC4.light)
            GameManager.completeObjective(); state.sessionXP += 150
          }
        } else if (state.isPlantingC4 && !keys['KeyF']) {
          state.isPlantingC4 = false; state.c4PlantProgress = 0
        }

        // ── F held — Saw security bars on a painting ──────
        if (level.barProtected && state.barsActive && keys['KeyF'] && !state.isDown && !isCarryingBag) {
          let sawTarget = -1
          for (const i of activeBags) {
            const bi = i as number
            if (!barsCut.has(bi) && playerPos.distanceTo(level.objectivePositions[bi]) < 2.2) { sawTarget = bi; break }
          }
          if (sawTarget >= 0) {
            state.isSawing = true
            state.sawProgress += delta / 15  // 15 seconds
            if (state.sawProgress >= 1.0) {
              barsCut.add(sawTarget)
              if (level.barMeshes[sawTarget]) level.barMeshes[sawTarget].visible = false
              state.isSawing = false; state.sawProgress = 0
              // Auto-pickup after sawing
              activeBags.delete(sawTarget); isCarryingBag = true; carriedBagIdx = sawTarget
              state.isCarryingBag = true; level.bagMeshes[sawTarget].visible = true
              addKillFeed('Bars cut — painting acquired!', '#44ff88')
            }
          }
        }
        if (state.isSawing && !keys['KeyF']) { state.isSawing = false; state.sawProgress = 0 }

        // ── F held — Hack security computer (disable all bars) ──
        if (hackPos && state.barsActive && keys['KeyF'] && !state.isDown && !isCarryingBag) {
          const hpVec = new THREE.Vector3(hackPos.x, 0, hackPos.z)
          if (playerPos.distanceTo(hpVec) < 2.0) {
            state.hackActive = true
            hackProgress += delta
            state.hackProgress = Math.min(1, hackProgress / hackTime)
            if (hackProgress >= hackTime) {
              state.barsActive = false; state.hackActive = false
              hackProgress = 0; state.hackProgress = 0
              level.barMeshes.forEach((m: any) => { if (m) m.visible = false })
              addKillFeed('SECURITY OVERRIDE — all bars disabled!', '#44ff88')
            }
          }
        }
        if (state.hackActive && !keys['KeyF']) { state.hackActive = false; hackProgress = 0; state.hackProgress = 0 }

        // ── F held — tie-up surrendering civilian or guard ──
        const nearSurrCiv = !state.isDown && !nearC4 && state.maskOn
          ? (level.civilians ?? []).find(c => !c.isDead && c.isSurrendering &&
              playerPos.distanceTo(c.group.position) < 2.0)
          : null
        const nearSurrGuard = !state.isDown && !nearC4 && !nearSurrCiv && state.maskOn
          ? enemies.find(e => e.state === 'SURRENDERED' &&
              playerPos.distanceTo(e.group.position) < 2.0)
          : null
        const nearSurr = nearSurrCiv || nearSurrGuard
        if (keys['KeyF'] && nearSurr) {
          state.tyingProgress = Math.min(1, state.tyingProgress + delta / 2.5)
          if (state.tyingProgress >= 1.0) {
            state.tyingProgress = 0
            if (nearSurrCiv) {
              nearSurrCiv.tie()
              state.hint = 'Civilian zip-tied!'
              state.tieCivCount++
              addKillFeed('Civilian zip-tied', '#ff8833')
            } else if (nearSurrGuard) {
              nearSurrGuard.tieUp()
              state.hint = 'Guard zip-tied!'
              addKillFeed('Guard zip-tied', '#ff8833')
            }
            sfx.tieCiv()
          }
        } else if (state.tyingProgress > 0 && !keys['KeyF']) {
          state.tyingProgress = Math.max(0, state.tyingProgress - delta * 2.0)
        }

        // ── F held — revive downed co-op player ───────────
        if (NetworkManager.enabled && keys['KeyF'] && !nearC4 && !nearSurrCiv) {
          let reviving = false
          for (const pid in remotePlayers) {
            const rp = remotePlayers[pid]
            if (rp._isDown && playerPos.distanceTo(rp.position) < 2.0) {
              state.coopReviveProgress = Math.min(1, (state.coopReviveProgress ?? 0) + delta / 3)
              state.coopReviveTarget = pid
              reviving = true
              if (state.coopReviveProgress >= 1) {
                state.coopReviveProgress = 0; state.coopReviveTarget = null
                NetworkManager.send('revive', { target: pid })
                state.hint = 'Teammate revived!'
              }
              break
            }
          }
          if (!reviving && state.coopReviveProgress > 0) {
            state.coopReviveProgress = 0; state.coopReviveTarget = null
          }
        } else if (state.coopReviveProgress > 0) {
          state.coopReviveProgress = 0; state.coopReviveTarget = null
        }

        // ── F held — revive downed bot ───────────────────────
        if (keys['KeyF'] && !state.isDown && !nearC4 && !nearSurrCiv && !_holdingInteractable) {
          let revivingBot = false
          for (let bi = 0; bi < bots.length; bi++) {
            const bot = bots[bi]
            if (bot.aiState === 'DOWN' && playerPos.distanceTo(bot.group.position) < 2.2) {
              state.botReviveProgress = Math.min(1, state.botReviveProgress + delta / 3)
              state.botReviveTarget = bi
              revivingBot = true
              if (state.botReviveProgress >= 1) {
                bot.reviveBot()
                state.botReviveProgress = 0; state.botReviveTarget = -1
                state.hint = `${bot.name} revived!`
                sfx.pickup()
                addKillFeed(`${bot.name} revived`, '#44ff88')
              }
              break
            }
          }
          if (!revivingBot && state.botReviveProgress > 0) {
            state.botReviveProgress = 0; state.botReviveTarget = -1
          }
        } else if (state.botReviveProgress > 0) {
          state.botReviveProgress = 0; state.botReviveTarget = -1
        }

        // ── F held — interactable hold progress ─────────────
        if (_holdingInteractable && keys['KeyF']) {
          state.interactProgress += delta / state.interactHoldMax
          if (state.interactProgress >= 1) {
            const ia = _holdingInteractable
            ia.activate()
            runActions(ia.actions, _actionCtx())
            sfx.pickup()
            state.interactProgress = 0; state.interactHoldMax = 0
            _holdingInteractable = null
          }
        } else if (_holdingInteractable) {
          state.interactProgress = 0; state.interactHoldMax = 0
          _holdingInteractable = null
        }

        // ── F held — pickpocket keycard progress ───────────
        if (_pickpocketTarget && keys['KeyF']) {
          state.interactProgress += delta / state.interactHoldMax
          if (state.interactProgress >= 1) {
            const e = _pickpocketTarget
            e.removeKeycard()
            state.keycards.push(e._keycardId)
            addKillFeed('Keycard stolen!', '#44ff66')
            sfx.pickup()
            state.interactProgress = 0; state.interactHoldMax = 0
            _pickpocketTarget = null
          }
        } else if (_pickpocketTarget) {
          state.interactProgress = 0; state.interactHoldMax = 0
          _pickpocketTarget = null
        }

        // ── Body dragging (F held + moving near unbagged body) ─
        if (keys['KeyF'] && !state.isDown && !GameManager.isLoudPhase()) {
          const _isMoving2 = !!(keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'])
          if (_isMoving2) {
            for (const ub of unbaggedBodies) {
              if (playerPos.distanceTo(ub.pos) < 1.6) {
                // Trail 1.4m behind the player
                const behind = new THREE.Vector3(
                  Math.sin(orient.yaw) * 1.4,
                  0,
                  Math.cos(orient.yaw) * 1.4,
                )
                const dragTarget = playerPos.clone().add(behind)
                ub.pos.lerp(dragTarget, Math.min(1, delta * 8))
                ub.enemy.group.position.set(ub.pos.x, 0, ub.pos.z)
                break
              }
            }
          }
        }

        // ── Melee (E key) ─────────────────────────────────────
        if (justDn['KeyE'] && state.maskOn && !state.isDown) {
          const MELEE_RANGE = 2.2
          let meleeTarget = null, meleeDist = MELEE_RANGE
          for (const e of enemies) {
            if (e.state === 'DEAD' || e.state === 'SURRENDERED' || e.state === 'TIED') continue
            const d = e.group.position.distanceTo(playerPos)
            if (d < meleeDist) { meleeDist = d; meleeTarget = e }
          }
          if (meleeTarget) {
            if (state.phase === 'STEALTH') {
              meleeTarget.takeDamage(9999)
              addKillFeed('Melee takedown', '#44ff88')
            } else {
              meleeTarget.takeDamage(60)
              sfx.bodyHit()
              addKillFeed('Melee hit!', '#ffffff')
            }
          }
        }

        // ── G — contextual: drop drill / drop bag / mask up ──
        if (justDn['KeyG']) {
          if (isCarryingDrill) {
            // Drop drill — if near target door, place it on the door
            const targetDoor = drillDoorIdx >= 0 ? level.doors[drillDoorIdx] : null
            const nearDoor = targetDoor && !targetDoor.isOpen && targetDoor.isNear(playerPos, 3.0)
            const fwd = new THREE.Vector3(-Math.sin(orient.yaw), 0, -Math.cos(orient.yaw))
            if (nearDoor) {
              // Snap drill to door position and start drilling
              const doorCenter = new THREE.Vector3(targetDoor.pivot.position.x, 0.3, targetDoor.pivot.position.z)
              drillMesh.position.copy(doorCenter)
              drillMesh.visible = true
              drillPlaced = true; drillProgress = 0
              state.drillActive = true; state.drillProgress = 0
              sfx.pickup()
              addKillFeed('THERMAL DRILL PLACED — drilling...', '#ff8844')
              if (NetworkManager.enabled) NetworkManager.send('drill-place', { x: doorCenter.x, z: doorCenter.z })
            } else {
              // Just drop it on the ground
              const dropPos = playerPos.clone().addScaledVector(fwd, 0.6)
              drillMesh.position.set(dropPos.x, 0.23, dropPos.z)
              drillMesh.visible = true
              if (NetworkManager.enabled) NetworkManager.send('drill-drop', { x: dropPos.x, z: dropPos.z })
            }
            isCarryingDrill = false; state.isCarryingDrill = false
          } else if (isCarryingBodyBag) {
            const bb  = bodyBags[carriedBodyBagIdx]
            const fwd = new THREE.Vector3(-Math.sin(orient.yaw), 0, -Math.cos(orient.yaw))
            const dropPos = playerPos.clone().addScaledVector(fwd, 0.6)
            bb.vel = fwd.clone().multiplyScalar(3); bb.vel.y = 2.5
            bb.pos.set(dropPos.x, playerPos.y + physics.eyeH() - 0.2, dropPos.z)
            bb.settled = false
            isCarryingBodyBag = false; carriedBodyBagIdx = -1; state.isCarryingBag = false
          } else if (isCarryingBag) {
            const fwd     = new THREE.Vector3(-Math.sin(orient.yaw), 0, -Math.cos(orient.yaw))
            const dropPos = playerPos.clone().addScaledVector(fwd, 0.6)
            const vel     = fwd.clone().multiplyScalar(3); vel.y = 2.5
            physBags.push({
              mesh:    level.bagMeshes[carriedBagIdx],
              origIdx: carriedBagIdx,
              pos:     new THREE.Vector3(dropPos.x, playerPos.y + physics.eyeH() - 0.2, dropPos.z),
              vel, settled: false,
            })
            activeBags.add(carriedBagIdx)
            level.objectivePositions[carriedBagIdx].copy(dropPos)
            if (NetworkManager.enabled) NetworkManager.send('bag-drop', { idx: carriedBagIdx, x: dropPos.x, z: dropPos.z })
            isCarryingBag = false; carriedBagIdx = -1; state.isCarryingBag = false
          } else if (!state.maskOn) {
            GameManager.putOnMask()
            sfx.maskOn()
            if (NetworkManager.enabled) NetworkManager.send('mask', { pi: NetworkManager.playerIndex })
          }
        }

        // ── Holdout: trade key ────────────────────────────
        if (justDn['KeyT'] && state.gameMode === 'holdout' && state.holdoutTradeOpen) {
          GameManager.holdoutTrade()
          if (NetworkManager.enabled) NetworkManager.send('holdout-trade', {})
        }

        // ── Player physics tick ────────────────────────────
        physics.tick(delta, keys, justDn)

        // ── Carried bag follows player ─────────────────────
        if (isCarryingBag && carriedBagIdx >= 0) {
          level.bagMeshes[carriedBagIdx].position.set(
            playerPos.x - Math.sin(orient.yaw) * 0.5,
            playerPos.y + 0.55,
            playerPos.z - Math.cos(orient.yaw) * 0.5,
          )
          level.bagMeshes[carriedBagIdx].rotation.y = orient.yaw + Math.PI * 0.2
        }

        // ── Carried body bag follows player ──────────────
        if (isCarryingBodyBag && carriedBodyBagIdx >= 0) {
          const bb = bodyBags[carriedBodyBagIdx]
          bb.mesh.position.set(
            playerPos.x - Math.sin(orient.yaw) * 0.5,
            playerPos.y + 0.55,
            playerPos.z - Math.cos(orient.yaw) * 0.5,
          )
          bb.mesh.rotation.y = orient.yaw + Math.PI * 0.2
        }

        // ── Carried drill follows player ──────────────────
        if (isCarryingDrill && drillMesh) {
          drillMesh.position.set(
            playerPos.x - Math.sin(orient.yaw) * 0.5,
            playerPos.y + 0.55,
            playerPos.z - Math.cos(orient.yaw) * 0.5,
          )
          drillMesh.rotation.y = orient.yaw + Math.PI * 0.2
        }

        // ── Thermal drill timer (host drives, client receives) ──
        if (drillPlaced && !level.doors[drillDoorIdx]?.isOpen && !_isCoopClient) {
          drillProgress += delta
          state.drillProgress = Math.min(1, drillProgress / drillTime)
          if (drillProgress >= drillTime) {
            level.doors[drillDoorIdx].open()
            sfx.doorOpen()
            drillMesh.visible = false
            state.drillActive = false; state.drillProgress = 1
            addKillFeed('VAULT DOOR BREACHED!', '#44ff44')
            if (_isCoopHost) NetworkManager.send('drill-done', { doorIdx: drillDoorIdx })
            // Holdout vault mechanic: reveal hostage + start assault
            if (_holdoutVaultPending && hostage) {
              _holdoutVaultPending  = false
              state.holdoutVaultOpen = true
              hostage.group.visible  = true
              addKillFeed('Hostage secured — survive the assault!', '#ff6633')
              if (state.phase !== 'FAILED' && state.phase !== 'ESCAPED') {
                GameManager.holdoutStartAssault()
              }
            }
          }
        }

        // ── Security bars activation (alarm → show bars) ──
        if (level.barProtected && !state.barsActive && state.alarmLevel >= 100 && barsCut.size < level.barMeshes.length) {
          state.barsActive = true
          level.barMeshes.forEach((m: any, idx: number) => { if (m && !barsCut.has(idx)) m.visible = true })
          addKillFeed('SECURITY BARS ACTIVATED!', '#ff4444')
        }

        // ── Lockpick result check ────────────────────────
        if (_waitingForLockpick && !state.lockpickActive) {
          _waitingForLockpick = false
          if (state.lockpickResult === 'success' && state.lockpickSafeIdx >= 0) {
            const safe = safes[state.lockpickSafeIdx]
            if (safe) {
              safe._safeOpen = true
              // Random loot (70% chance)
              if (Math.random() < 0.7) {
                const lootTable = [
                  { name: 'Cash bundle',  money: 8000,  xp: 50,  color: '#44dd44', w: 0.6 },
                  { name: 'Cash bundle',  money: 12000, xp: 75,  color: '#44dd44', w: 0.25 },
                  { name: 'Gold bar',     money: 25000, xp: 120, color: '#ffcc00', w: 0.1 },
                  { name: 'Jewelry box',  money: 40000, xp: 200, color: '#cc44ff', w: 0.04 },
                  { name: 'Bearer bonds', money: 60000, xp: 300, color: '#ff4488', w: 0.01 },
                ]
                let roll = Math.random(), pick = lootTable[0]
                for (const l of lootTable) { roll -= l.w; if (roll <= 0) { pick = l; break } }
                state.sessionMoney += pick.money; state.sessionXP += pick.xp
                addKillFeed(`SAFE CRACKED — ${pick.name}! +$${pick.money.toLocaleString()}`, pick.color)
              } else {
                addKillFeed('SAFE CRACKED — empty!', '#888888')
              }
            }
          }
          state.lockpickSafeIdx = -1; state.lockpickResult = ''
        }

        // ── Animate safe doors ──────────────────────────
        for (const safe of safes) {
          if (safe._safeOpen && safe.doorPivot) {
            const cur = safe.doorPivot.rotation.y
            if (cur < Math.PI * 0.85) safe.doorPivot.rotation.y = Math.min(Math.PI * 0.85, cur + delta * 3)
          }
        }

        // ── Drop zone highlight ──────────────────────────
        const showDrop = isCarryingBag || isCarryingDrill || isCarryingBodyBag
        level.setDropHighlight(showDrop)
        level.updateRing(now * 0.001)

        // ── Bag drop physics ───────────────────────────────
        for (let i = physBags.length - 1; i >= 0; i--) {
          const b = physBags[i]
          if (b.settled) continue
          b.vel.y -= 18 * delta   // GRAVITY
          b.pos.addScaledVector(b.vel, delta)
          if (b.pos.y <= 0.28) {
            b.pos.y = 0.28; b.vel.y = Math.abs(b.vel.y) * 0.4
            b.vel.x *= 0.6; b.vel.z *= 0.6
            if (Math.abs(b.vel.y) < 0.5) {
              b.vel.set(0, 0, 0); b.settled = true
              // Auto-deposit if bag landed near the van
              const dv = new THREE.Vector2(b.pos.x - level.escapePos.x, b.pos.z - level.escapePos.z).length()
              if (dv < level.escapeRadius + 2) {
                b.mesh.visible = false; activeBags.delete(b.origIdx)
                physBags.splice(i, 1)
                GameManager.completeObjective()
                addKillFeed('Bag secured!', '#44ff44')
                if (state.objectives >= state.objectivesTotal) setTimeout(() => GameManager.escape(), 500)
                continue
              }
            }
          }
          b.mesh.position.copy(b.pos); b.mesh.rotation.x += b.vel.length() * delta * 2
          level.objectivePositions[b.origIdx].copy(b.pos)
        }

        // ── Body bag drop physics ────────────────────────
        for (const bb of bodyBags) {
          if (bb.settled) continue
          bb.vel.y -= 18 * delta
          bb.pos.addScaledVector(bb.vel, delta)
          if (bb.pos.y <= 0.28) {
            bb.pos.y = 0.28; bb.vel.y = Math.abs(bb.vel.y) * 0.4
            bb.vel.x *= 0.6; bb.vel.z *= 0.6
            if (Math.abs(bb.vel.y) < 0.5) {
              bb.vel.set(0, 0, 0); bb.settled = true
            }
          }
          bb.mesh.position.copy(bb.pos); bb.mesh.rotation.x += bb.vel.length() * delta * 2
        }

        // ── Debris / chunk physics ─────────────────────────
        for (let i = physChunks.length - 1; i >= 0; i--) {
          const c = physChunks[i]
          c.timer -= delta; c.vel.y -= 18 * delta   // GRAVITY
          c.mesh.position.addScaledVector(c.vel, delta)
          c.mesh.rotation.x += c.rotVel.x * delta
          c.mesh.rotation.y += c.rotVel.y * delta
          c.mesh.rotation.z += c.rotVel.z * delta
          if (c.mesh.position.y <= 0.05) {
            c.mesh.position.y = 0.05; c.vel.y = Math.abs(c.vel.y) * 0.28
            c.vel.x *= 0.65; c.vel.z *= 0.65; c.rotVel.multiplyScalar(0.42)
          }
          if (c.timer < 1.5) c.mesh.material.opacity = c.timer / 1.5
          if (c.timer <= 0) {
            scene.remove(c.mesh); c.mesh.geometry.dispose(); c.mesh.material.dispose()
            physChunks.splice(i, 1)
          }
        }

        // ── Drone bombs ──────────────────────────────────
        for (let i = droneBombs.length - 1; i >= 0; i--) {
          const b = droneBombs[i]
          b.vel.y -= 12 * delta
          b.mesh.position.addScaledVector(b.vel, delta)
          if (b.mesh.position.y <= 0.2) {
            combat.explodeAt(b.mesh.position, 3, 35)
            scene.remove(b.mesh); b.mesh.geometry.dispose(); b.mat.dispose()
            droneBombs.splice(i, 1)
          }
        }

        // ── Damage grace period ──────────────────────────
        if (dmgGrace > 0) dmgGrace -= delta

        // ── Halo shield recharge ───────────────────────────
        if (shieldRechargeTimer > 0) {
          shieldRechargeTimer -= delta; state.shieldActive = false
        } else if (shield < MAX_SHIELD) {
          shield = Math.min(MAX_SHIELD, shield + SHIELD_RECHARGE_RATE * delta)
          state.shield = Math.round(shield); state.shieldActive = true
        } else {
          state.shieldActive = shield >= MAX_SHIELD
        }

        // ── Contextual hint ────────────────────────────────
        let hint = ''
        if (!state.maskOn && state.phase === 'STEALTH') {
          hint = '[G] Put on mask to begin'
        } else if (isCarryingDrill) {
          const targetDoor = drillDoorIdx >= 0 ? level.doors[drillDoorIdx] : null
          if (targetDoor && !targetDoor.isOpen && targetDoor.isNear(playerPos, 3.0))
            hint = '[G] Place thermal drill'
          else hint = 'Bring drill to the vault door'
        } else if (isCarryingBodyBag) {
          hint = '[G] Drop body bag'
        } else if (isCarryingBag) {
          const dv = new THREE.Vector2(playerPos.x - level.escapePos.x, playerPos.z - level.escapePos.z).length()
          if (dv < level.escapeRadius + 5) hint = '[G] Throw bag to VAN'
          else hint = 'Bring bag to the VAN'
        } else {
          // Drill on ground (not picked up, not placed)
          if (drillMesh && !drillPlaced && !isCarryingDrill && playerPos.distanceTo(drillMesh.position) < 2.5)
            hint = '[F] Pick up thermal drill'
          // Safe lockpick hint
          if (!hint) {
            for (const safe of safes) {
              if (safe.shattered || safe._safeOpen) continue
              const sp = new THREE.Vector3(); safe.mesh.getWorldPosition(sp)
              if (playerPos.distanceTo(sp) < 2.5) { hint = '[F] Lockpick safe'; break }
            }
          }
          for (const i of activeBags) {
            const bi = i as number
            if (playerPos.distanceTo(level.objectivePositions[bi]) < 2.5) {
              if (state.barsActive && level.barProtected && !barsCut.has(bi))
                hint = '[F] Saw bars (hold 15s)'
              else
                hint = '[F] Pick up painting'
              break
            }
          }
          // Hack computer hint
          if (!hint && hackPos && state.barsActive && level.barProtected) {
            const hpVec = new THREE.Vector3(hackPos.x, 0, hackPos.z)
            if (playerPos.distanceTo(hpVec) < 2.5) hint = '[F] Hack security (hold 3:00)'
          }
          // Body bag on ground
          if (!hint) {
            for (const bb of bodyBags) {
              if (bb.settled && playerPos.distanceTo(bb.pos) < 2.5) { hint = '[F] Pick up body bag'; break }
            }
          }
          // Armor plate
          if (!hint) {
            for (const a of armorDrops) {
              if (playerPos.distanceTo(a.pos) < 2.5) { hint = '[F] Pick up armor plate'; break }
            }
          }
          // Ammo box
          if (!hint) {
            for (const a of ammoDrops) {
              if (playerPos.distanceTo(a.pos) < 2.5) { hint = '[F] Pick up ammo (+30)'; break }
            }
          }
          // Uniform (disguise)
          if (!hint && !state.maskOn) {
            for (const u of uniformDrops) {
              if (playerPos.distanceTo(u.pos) < 2.5) { hint = '[F] Pick up uniform (disguise)'; break }
            }
          }
          // Unbagged body nearby
          if (!hint) {
            for (const ub of unbaggedBodies) {
              if (playerPos.distanceTo(ub.pos) < 2.5) { hint = '[F] Bag body'; break }
            }
          }
          if (!hint && escapeActive) {
            const dv = new THREE.Vector2(playerPos.x - level.escapePos.x, playerPos.z - level.escapePos.z).length()
            if (dv < level.escapeRadius + 2) hint = 'Walk to VAN to ESCAPE!'
          }
          // Pickpocket hint (stealth, unmasked, behind guard with keycard)
          if (!hint && !state.maskOn) {
            for (const e of enemies) {
              if (e._hasKeycard && !e._keycardStolen && e.state === 'PATROL' &&
                  playerPos.distanceTo(e.group.position) < 2.5) {
                const guardFwd = new THREE.Vector3(0, 0, 1).applyQuaternion(e.group.quaternion)
                const toPlayer = playerPos.clone().sub(e.group.position).normalize()
                if (guardFwd.dot(toPlayer) < 0.2) {
                  hint = 'Hold [F] Steal keycard'
                } else {
                  hint = 'Get behind guard to steal keycard'
                }
                break
              }
            }
          }
          // Card reader hint
          if (!hint) {
            for (const cr of _cardReaders) {
              if (playerPos.distanceTo(cr.pos) < 2.5) {
                const door = level.doors[cr.doorIdx]
                if (door && !door.isOpen) {
                  hint = state.keycards.includes('vault_keycard') ? '[F] Swipe keycard' : 'NEED KEYCARD'
                }
                break
              }
            }
          }
          // Civilian / guard interaction hints (only when masked)
          if (!hint && state.maskOn) {
            const sciv = (level.civilians ?? []).find(c =>
              !c.isDead && c.isSurrendering && playerPos.distanceTo(c.group.position) < 2.0)
            const sguard = enemies.find(e =>
              e.state === 'SURRENDERED' && playerPos.distanceTo(e.group.position) < 2.0)
            if (sciv || sguard) {
              hint = 'Hold [F] to tie up'
            } else {
              const fciv = (level.civilians ?? []).find(c =>
                !c.isDead && !c.isSurrendering && !c.isTied &&
                playerPos.distanceTo(c.group.position) < 2.5)
              if (fciv) hint = '[F] Shout at civilian'
              // Guard can be dominated (any non-shooting state)
              if (!hint) {
                const dguard = enemies.find(e =>
                  e.state !== 'DEAD' && e.state !== 'SURRENDERED' && e.state !== 'TIED' && e.state !== 'RETREAT' &&
                  !(e.state === 'COMBAT' && e._combatDelay <= 0) &&
                  playerPos.distanceTo(e.group.position) < 3.0)
                if (dguard) hint = '[F] Dominate guard'
              }
            }
          }
        }
        if (hint) state.hint = hint
        else if (
          state.hint === '[F] Pick up bag' ||
          state.hint === '[G] Throw bag to VAN' ||
          state.hint === 'Bring bag to the VAN' ||
          state.hint === '[G] Put on mask to begin' ||
          state.hint === '[F] Shout at civilian' ||
          state.hint === 'Hold [F] to tie up' ||
          state.hint === '[F] Pick up thermal drill' ||
          state.hint === '[G] Place thermal drill' ||
          state.hint === 'Bring drill to the vault door' ||
          state.hint === 'REQUIRES THERMAL DRILL' ||
          state.hint === '[F] Bag body' ||
          state.hint === '[F] Pick up body bag' ||
          state.hint === '[G] Drop body bag' ||
          state.hint === 'Body bagged' ||
          state.hint === '[F] Dominate guard' ||
          state.hint === 'Hold [F] to tie up' ||
          state.hint === '[F] Saw bars (hold 15s)' ||
          state.hint === '[F] Pick up painting' ||
          state.hint === '[F] Hack security (hold 3:00)' ||
          state.hint === '[F] Lockpick safe' ||
          state.hint === 'Hold [F] Steal keycard' ||
          state.hint === 'Get behind guard to steal keycard' ||
          state.hint === '[F] Swipe keycard' ||
          state.hint === 'NEED KEYCARD'
        ) state.hint = ''

        // ── Interactable proximity hints ──────────────────────
        state.interactHint = ''
        for (const ia of interactables) {
          if (!ia.used && ia.enabled && ia.isNear(playerPos)) {
            state.interactHint = ia.hint
            break
          }
        }
        // Downed bot hint
        if (!state.interactHint) {
          for (const bot of bots) {
            if (bot.aiState === 'DOWN' && playerPos.distanceTo(bot.group.position) < 2.5) {
              state.interactHint = `Hold [F] Revive ${bot.name}`
              break
            }
          }
        }

        // ── Holdout: update hostage bar + sync security ─────
        if (hostage && !hostage.isFreed) {
          hostage.updateBarFacing(camera)
          state.holdoutHostageSecurity = hostage.security
        }

        // ── Escape / deposit zone ──────────────────────────
        if (state.gameMode === 'holdout') {
          // Skip escape zone in holdout — escape only via trade
        } else {
        const dEsc = new THREE.Vector2(playerPos.x - level.escapePos.x, playerPos.z - level.escapePos.z).length()
        const inEscapeZone = dEsc < level.escapeRadius
        if (inEscapeZone) {
          if (isCarryingBag) {
            level.bagMeshes[carriedBagIdx].visible = false
            if (NetworkManager.enabled) NetworkManager.send('bag-secure', { idx: carriedBagIdx })
            isCarryingBag = false; state.isCarryingBag = false; carriedBagIdx = -1
            GameManager.completeObjective()
            addKillFeed('Bag secured!', '#44ff44')
            // If last bag — start countdown instead of instant escape
            if (state.objectives >= state.objectivesTotal) {
              state.escapeCountdown = 5
            }
          } else if (state.objectives >= state.objectivesTotal && state.escapeCountdown === 0) {
            // Already done — start countdown if not yet running
            state.escapeCountdown = 5
          }
        }
        // Escape countdown tick
        if (state.escapeCountdown > 0) {
          if (inEscapeZone) {
            const prev = Math.ceil(state.escapeCountdown)
            state.escapeCountdown = Math.max(0, state.escapeCountdown - delta)
            const cur = Math.ceil(state.escapeCountdown)
            if (cur < prev) sfx.escapeBeep(true)   // beep each second
            if (state.escapeCountdown <= 0) {
              state.escapeTimerActive = false
              GameManager.escape()
            }
          } else {
            // Left the zone — cancel countdown
            state.escapeCountdown = 0
          }
        }
        } // end else (not holdout)

        // ── Zone detection ─────────────────────────────────
        const currentZone        = getZoneAt(playerPos.x, playerPos.z)
        state.currentZone        = currentZone
        state.playerInSecureZone = currentZone?.type === 'secure'

        // ── Door updates ───────────────────────────────────
        for (const door of level.doors) door.update(delta)

        // ── Tool system tick ───────────────────────────────
        tools.tick(delta)

        // ── Sonar glow ────────────────────────────────────
        if (tools.activeToolType === 'sonar' && state.toolActive) {
          for (const e of enemies) {
            if (e.state !== 'DEAD') e.group.traverse(c => {
              if (c.isMesh && c.material?.emissive) { c.material.emissive.set(0x0033cc); c.material.emissiveIntensity = 0.55 }
            })
          }
        }

        // ── Keycard spin ───────────────────────────────────
        for (const kc of keycardItems) {
          if (!kc.collected) kc.mesh.rotation.y += delta * 1.8
        }

      } // end else (not down)

      // ── Enemies (run even when player is down) ───────────
        const eyePos  = new THREE.Vector3(playerPos.x, playerPos.y + physics.eyeH(), playerPos.z)
        const tieCivs = (level.civilians ?? []).filter(c => c.isTied && !c.isDead)

      if (_isCoopClient) {
        // ── Client: lerp enemy positions from host snapshots ──
        for (const e of enemies) {
          if (e.state === 'DEAD') continue
          if (e._netTarget) {
            e.group.position.lerp(e._netTarget, Math.min(1, delta * 12))
            e.group.rotation.y = THREE.MathUtils.lerp(e.group.rotation.y, e._netTargetRY, Math.min(1, delta * 12))
          }
        }

        // ── Client-side stealth detection (no ping dependency) ──
        if (state.phase === 'STEALTH') {
          let anyDetecting = false
          const prevDet = GameManager.getDetectionRate()
          for (const e of enemies) {
            if (e.state === 'DEAD' || e.state === 'SURRENDERED' || e.state === 'TIED') continue
            if (e.state !== 'PATROL') continue
            const eEye = e.group.position.clone(); eEye.y = 1.55
            const dist = e.group.position.distanceTo(playerPos)
            if (dist >= e.detectionRange) continue
            const _hasV = hasLOS(eEye, eyePos, visionBoxes)
            if (!_hasV) continue
            // FOV check — 120° cone
            const fwd = new THREE.Vector3(); e.group.getWorldDirection(fwd); fwd.y = 0
            const toP = new THREE.Vector3(playerPos.x - e.group.position.x, 0, playerPos.z - e.group.position.z)
            if (fwd.lengthSq() > 0.001) fwd.normalize()
            if (toP.lengthSq() > 0.001) toP.normalize()
            if (fwd.dot(toP) < 0.5 && dist >= 2.0) continue
            // Has LOS + FOV → build detection locally
            anyDetecting = true
            if (GameManager.isMaskOn()) {
              const cp = Math.max(0, 10 - state.concealment) * 2
              GameManager.addEnemyDetection(40 + cp, delta)
            } else if (state.playerInSecureZone) {
              GameManager.addEnemyDetection(200, delta)
            } else if (state.currentZone?.type === 'private') {
              GameManager.addEnemyDetection(60, delta)
            } else {
              const cp = Math.max(0, 10 - state.concealment) * 2
              if (cp > 0) GameManager.addEnemyDetection(cp, delta)
            }
            state.detectionRate = GameManager.getDetectionRate()
          }
          if (!anyDetecting) {
            GameManager.decayDetection(8, delta)
          }
          // Client: if detection hit 100, tell host to raise alarm
          // Detection internally triggers setPhase('CONTROL'), but the host
          // will send the real phase change back — just send alarm-req
          if (prevDet < 100 && GameManager.getDetectionRate() >= 100) {
            NetworkManager.send('alarm-req', { amount: 30 })
            // Reset local detection so _addDetection doesn't keep triggering setPhase
            GameManager.resetStealth()
          }
        }
      } else {
        // ── Host / solo: full enemy AI ──

        // Tick radio timers (guards calling backup)
        for (const [e, radio] of enemyRadio) {
          if (e.state === 'DEAD') {
            scene.remove(radio.mesh); radio.mesh.geometry.dispose()
            ;(radio.mesh.material as THREE.Material).dispose()
            enemyRadio.delete(e); continue
          }
          radio.timer -= delta
          radio.mesh.position.set(e.group.position.x, 2.3, e.group.position.z)
          ;(radio.mesh.material as THREE.MeshBasicMaterial).color.setHex(
            Math.sin(Date.now() * 0.015) > 0 ? 0xff2222 : 0xffee22)
          if (radio.timer <= 0) {
            scene.remove(radio.mesh); radio.mesh.geometry.dispose()
            ;(radio.mesh.material as THREE.Material).dispose()
            enemyRadio.delete(e)
            // Radio triggers CONTROL phase only (not ANTICIPATION)
            GameManager.radioAlarm()
            sfx.backupCalled()
            addKillFeed('ALARM RAISED!', '#ff3333')
          }
        }

        state.enemyRadioing = enemyRadio.size > 0

        // Sync enemy positions for separation steering
        setEnemyPositions(enemies.filter(e => e.state !== 'DEAD').map(e => e.group.position))

        // Update nav grid flow field ~1×/s
        _navGridTimer += delta
        if (_navGridTimer > 1.0) {
          _navGridTimer = 0
          _navGrid.update(playerPos)
        }

        // Build all-players list for multi-target (host + remotes)
        const _allTargets = [{ pos: playerPos, eye: eyePos, pid: null }]
        if (_isCoopHost) {
          for (const pid in remotePlayers) {
            const rp = remotePlayers[pid]
            if (rp._isDown) continue
            const rEye = new THREE.Vector3(rp.position.x, rp.position.y + 1.55, rp.position.z)
            _allTargets.push({ pos: rp.position.clone(), eye: rEye, pid })
          }
        }

        // Periodically remove long-dead enemies from array to keep iteration lean
        for (let i = enemies.length - 1; i >= 0; i--) {
          const de = enemies[i]
          if (de.state === 'DEAD') {
            de._deadTimer = (de._deadTimer ?? 0) + delta
            if (de._deadTimer > 10) { enemies.splice(i, 1) }
          }
        }

        for (const e of enemies) {
          // Radio: first COMBAT transition in stealth → 3s to kill before alarm
          if (e.state === 'COMBAT' && !e._radioStarted) {
            e._radioStarted = true
            if (['STEALTH', 'CONTROL'].includes(state.phase)) {
              const rm = new THREE.Mesh(
                new THREE.SphereGeometry(0.13, 6, 4),
                new THREE.MeshBasicMaterial({ color: 0xff2222, depthTest: false, depthWrite: false }),
              )
              rm.renderOrder = 9999
              rm.position.set(e.group.position.x, 2.3, e.group.position.z)
              scene.add(rm)
              enemyRadio.set(e, { timer: 3.0, mesh: rm })
              sfx.guardAlert()
              addKillFeed('Guard radioing!  Kill fast!', '#ffaa00')
            }
          }

          // Find closest player for this enemy (host + remotes)
          let _tgtPos = playerPos, _tgtEye = eyePos, _tgtPid = null
          if (_isCoopHost && _allTargets.length > 1) {
            let bestDist = e.group.position.distanceTo(playerPos)
            for (let ti = 1; ti < _allTargets.length; ti++) {
              const d = e.group.position.distanceTo(_allTargets[ti].pos)
              if (d < bestDist) { bestDist = d; _tgtPos = _allTargets[ti].pos; _tgtEye = _allTargets[ti].eye; _tgtPid = _allTargets[ti].pid }
            }
          }

          // Hostage deterrence: reduce fire damage near tied civs/guards
          const tiedGuards = enemies.filter(g => g.state === 'TIED')
          const hostageNear = tieCivs.some(tc => e.group.position.distanceTo(tc.group.position) < 5.0)
            || tiedGuards.some(tg => tg !== e && e.group.position.distanceTo(tg.group.position) < 5.0)
          const _dmgMult = hostageNear ? 0.4 : 1.0

          // ── HRT rescue targeting ─────────────────────────────
          let _isRescuing = false
          if (e._cfg?.hrt && e.state === 'COMBAT') {
            let rescueTarget: THREE.Vector3 | null = null

            if (state.gameMode === 'holdout' && hostage && !hostage.isFreed) {
              // Holdout: target the hostage
              rescueTarget = hostage.getFloorPos()
            } else if (state.gameMode === 'heist') {
              // Classic heist: target nearest tied civilian
              let bestDist = Infinity
              for (const tc of tieCivs) {
                const d = e.group.position.distanceTo(tc.group.position)
                if (d < bestDist) { bestDist = d; rescueTarget = tc.group.position.clone(); rescueTarget.y = 0 }
              }
            }

            if (rescueTarget) {
              const dToRescue = e.group.position.distanceTo(rescueTarget)
              if (dToRescue < 1.5) {
                // Within rescue range — rescuing (can't shoot)
                _isRescuing = true
                e._rescueTimer = (e._rescueTimer ?? 0) + delta
                e._shootTimer = 999  // prevent shooting while rescuing
              } else {
                // Path toward rescue target instead of player
                _tgtPos = rescueTarget
                _tgtEye = new THREE.Vector3(rescueTarget.x, 1.0, rescueTarget.z)
                e._rescueTimer = 0
              }
            } else {
              e._rescueTimer = 0
            }
          } else {
            e._rescueTimer = 0
          }

          e.onHitPlayer = (_isRescuing || (e._cfg?.hrt && e._rescueTimer > 0))
            ? () => {} // HRT is rescuing, shots don't hit player
            : _tgtPid
              ? () => NetworkManager.send('e-dmg', { pid: _tgtPid, dmg: e.damage * _dmgMult })
              : () => takeDamage(e.damage * _dmgMult)

          // Smoke suppression: block enemy LOS if smoke cloud is between them and target
          e._smokeSuppressed = combat.smokeClouds.some(cloud => {
            if (cloud.timer <= 0) return false
            const ax = e.group.position.x, az = e.group.position.z
            const bx2 = _tgtPos.x,         bz2 = _tgtPos.z
            const cx2 = cloud.pos.x,       cz2 = cloud.pos.z
            const dx = bx2 - ax, dz = bz2 - az
            const lenSq = dx*dx + dz*dz
            if (lenSq < 0.0001) return false
            const t = Math.max(0, Math.min(1, -((ax - cx2)*dx + (az - cz2)*dz) / lenSq))
            const clX = ax + t*dx - cx2, clZ = az + t*dz - cz2
            return clX*clX + clZ*clZ < cloud.radius * cloud.radius
          })

          const wasAlive = e.state !== 'DEAD'
          e.update(delta, _tgtPos, _tgtEye, visionBoxes, wallBoxes)

          // Medic healing: heal nearby wounded allies (all states except DEAD)
          if (e._cfg?.isMedic && e.state !== 'DEAD') {
            for (const ally of enemies) {
              if (ally === e || ally.state === 'DEAD') continue
              if (ally.health >= ally.maxHealth * 0.98) continue
              if (e.group.position.distanceTo(ally.group.position) < (e._cfg.healRange ?? 3.5)) {
                ally.health = Math.min(ally.maxHealth, ally.health + (e._cfg.healRate ?? 25) * delta)
                break
              }
            }
          }

          // ── HRT rescue completion check ──────────────────────
          if (_isRescuing && (e._rescueTimer ?? 0) >= 10) {
            e._rescueTimer = 0
            if (state.gameMode === 'holdout' && hostage && !hostage.isFreed) {
              // Hostage freed → player fails
              hostage.drainSecurity(hostage.security + 1, 1)
            } else if (state.gameMode === 'heist') {
              // Untie nearest tied civilian
              let bestCiv = null, bestD = Infinity
              for (const tc of tieCivs) {
                const d = e.group.position.distanceTo(tc.group.position)
                if (d < 2.0 && d < bestD) { bestD = d; bestCiv = tc }
              }
              if (bestCiv) {
                bestCiv.isTied = false
                bestCiv.isSurrendering = false
                bestCiv.startFleeing(level.exfilZones)
                addKillFeed('HRT untied a hostage!', '#ff4444')
              }
            }
          }

          // Guard marker: ✓ when surrendered, remove when tied
          if (e.state === 'SURRENDERED' && !civMarkers.has(e)) {
            const mat = new THREE.SpriteMaterial({
              map: _civTex.dom, depthTest: false, depthWrite: false, transparent: true,
            })
            const sprite = new THREE.Sprite(mat)
            sprite.renderOrder = 9999; sprite.scale.set(0.5, 0.5, 1)
            sprite.position.set(e.group.position.x, 2.4, e.group.position.z)
            scene.add(sprite)
            civMarkers.set(e, { sprite, kind: 'dom' })
          } else if (e.state === 'TIED' && civMarkers.has(e)) {
            const m = civMarkers.get(e)!
            scene.remove(m.sprite); m.sprite.material.dispose()
            civMarkers.delete(e)
          }

          // Kill detection
          if (wasAlive && e.state === 'DEAD') {
            state.killCount++
            // Stealth kills reduce stealth rating
            if (['STEALTH', 'CONTROL'].includes(state.phase)) {
              state.stealthRating = Math.max(0, state.stealthRating - 8)
            }
            addKillFeed('Guard eliminated', '#ffffff')
            // Cancel radio if they were radioing
            const radio = enemyRadio.get(e)
            if (radio) {
              scene.remove(radio.mesh); radio.mesh.geometry.dispose()
              ;(radio.mesh.material as THREE.Material).dispose()
              enemyRadio.delete(e)
              addKillFeed('Radio neutralized!', '#44ff88')
            }
            // Track corpse for body-bagging (stealth)
            if (!unbaggedBodies.some(b => b.enemy === e)) {
              unbaggedBodies.push({ enemy: e, pos: e.group.position.clone() })
            }

            // ── Guard communication: nearby guards notice the death ──
            if (state.phase === 'STEALTH') {
              for (const e2 of enemies) {
                if (e2 === e || e2.state === 'DEAD' || e2.state === 'COMBAT' || e2.state === 'SEARCH') continue
                if (e2.group.position.distanceTo(e.group.position) < 15) {
                  e2.state = 'SEARCH'
                  e2._lastKnownPos = e.group.position.clone()
                }
              }
            }

            // ── Pager: stealth kills require 10s hold response ──
            if (state.phase === 'STEALTH' && e.isPolice && !e._cfg?.isDrone) {
              if (!state.pagerActive) {
                state.pagerActive = true
                state.pagerTimeLeft = 11
                state.pagerAnswerProgress = 0
                addKillFeed('PAGER RINGING — Hold F (10s)!', '#ff6600')
              } else {
                pagerQueue++
              }
            }
            // Host broadcasts kill to clients
            if (_isCoopHost) NetworkManager.send('e-kill', { id: e.netId })

            // ── Hydra mutator: spawn 2 more enemies on death ──
            if (state.activeMutators?.includes('hydra') && state.phase === 'ASSAULT' && state.enemiesAlive < 45) {
              for (let hi = 0; hi < 2; hi++) {
                const offset = new THREE.Vector3(
                  (hi === 0 ? 1 : -1) * (1 + Math.random()),
                  0,
                  (Math.random() - 0.5) * 2,
                )
                const spawnPos = findClearSpawn(
                  e.group.position.clone().add(offset),
                  level.wallBoxes,
                  level.destructibles,
                )
                const etype = pickEnemyType(state.waveNumber)
                const ne    = new Enemy(scene, spawnPos, etype)
                ne.onHitPlayer    = () => takeDamage(ne.damage)
                ne.onLayMine      = p          => layMine(p)
                ne.onDeploySentry = p          => onDeploySentry(p)
                ne.onThrowMolotov = (from, to) => throwMolotov(from, to)
                ne.onDropLoot     = _onEnemyDropLoot
                ne._navGrid = _navGrid
                enemies.push(ne)
                state.enemiesAlive++
              }
            }
          }
        }
      } // end host/client enemy branch

        // ── AI opens doors (enemies + bots) ─────────────────
        for (const door of level.doors) {
          if (door.isOpen) continue
          if (door.type === 'keycard' || door.type === 'drill') continue
          // Enemies: normal doors always; secure only when loud (they're alerted)
          if (door.type === 'normal' || GameManager.isLoudPhase()) {
            for (const e of enemies) {
              if (e.state === 'DEAD') continue
              if (door.isNear(e.group.position, 1.6)) { door.open(); sfx.doorOpen(); break }
            }
          }
          if (door.isOpen) continue
          // Bots: normal doors always; secure only when loud
          if (door.type === 'normal' || GameManager.isLoudPhase()) {
            for (const bot of bots) {
              if (bot.aiState === 'DEAD' || bot.aiState === 'DOWN') continue
              if (door.isNear(bot.group.position, 1.6)) { door.open(); sfx.doorOpen(); break }
            }
          }
        }

        // ── Guard suspicious-object detection (stealth) ──────
        if (!GameManager.isLoudPhase()) {
          // Collect all suspicious positions
          const susObjects: THREE.Vector3[] = []
          for (const ub of unbaggedBodies) susObjects.push(ub.pos)
          for (const bb of bodyBags) if (bb.settled) susObjects.push(bb.pos)
          if (drillMesh && !isCarryingDrill && drillMesh.visible && drillInitPos && drillMesh.position.distanceTo(drillInitPos) > 1) susObjects.push(drillMesh.position)

          for (const e of enemies) {
            if (e.state !== 'PATROL') continue
            const eEye = e.group.position.clone(); eEye.y = 1.55
            for (const sp of susObjects) {
              const d = e.group.position.distanceTo(sp)
              if (d > 12) continue
              const spEye = sp.clone(); spEye.y = 0.5
              if (!hasLOS(eEye, spEye, visionBoxes)) continue
              // Guard spotted suspicious object → trigger alarm
              e.state = 'COMBAT'
              e._lastKnownPos = sp.clone()
              e._losLostTimer = 0
              e._radioStarted = false  // will start radio in next frame
              GameManager.triggerAlarm()
              addKillFeed('Guard found something!', '#ff4444')
              break
            }
          }
        }
        state.susRate = GameManager.getSusRate()

        // ── Co-op player slots in HUD ─────────────────────
        if (NetworkManager.enabled) {
          let pi = 0
          for (const pid in remotePlayers) {
            if (pi >= _coopOtherCount) break
            const rp = remotePlayers[pid]
            state.bots[pi].hp       = rp._isDown ? 0 : 100
            state.bots[pi].aiState  = rp._isDown ? 'DOWN' : 'FOLLOW'
            state.bots[pi].isPlayer = true
            pi++
          }
        }

        // ── Interpolate remote player positions (smooth 10Hz → 60fps) ──
        for (const pid in remotePlayers) {
          const rp = remotePlayers[pid]
          if (!rp._netTarget) continue
          rp.position.lerp(rp._netTarget, Math.min(1, delta * 15))
          rp.rotation.y = THREE.MathUtils.lerp(rp.rotation.y, rp._netTargetRY ?? rp.rotation.y, Math.min(1, delta * 15))
          rp.rotation.z = THREE.MathUtils.lerp(rp.rotation.z, rp._netTargetRZ ?? 0, Math.min(1, delta * 15))
        }

        // ── AI Bots ───────────────────────────────────────
        for (let bi = 0; bi < bots.length; bi++) {
          const bot = bots[bi]
          bot.update(delta, playerPos, enemies, wallBoxes, state.isDown)
          // Sync state for HUD (bots start after co-op player slots)
          const si = _coopOtherCount + bi
          if (si < 3) {
            state.bots[si].hp            = bot.hp
            state.bots[si].aiState       = bot.aiState
            state.bots[si].reviveProgress = bot.reviveProgress
          }
        }

        // ── Minimap sync (written every frame, read by HUD canvas) ──
        const mm = state.minimap
        mm.px = playerPos.x; mm.pz = playerPos.z; mm.pyaw = orient.yaw
        mm.enemies.length = 0
        for (const e of enemies) {
          if (e.state !== 'DEAD')
            mm.enemies.push({ x: e.group.position.x, z: e.group.position.z, st: e.state })
        }
        mm.bots.length = 0
        // Co-op players on minimap
        for (const pid in remotePlayers) {
          const rp = remotePlayers[pid]
          mm.bots.push({ x: rp.position.x, z: rp.position.z, st: rp._isDown ? 'DOWN' : 'FOLLOW' })
        }
        // AI bots on minimap
        for (const b of bots)
          mm.bots.push({ x: b.group.position.x, z: b.group.position.z, st: b.aiState })
        mm.civs.length = 0
        for (const c of (level.civilians ?? []))
          if (!c.isDead) mm.civs.push({ x: c.group.position.x, z: c.group.position.z, tied: c.isTied })

        // ── Ping markers tick ─────────────────────────────
        for (let i = _pingMarkers.length - 1; i >= 0; i--) {
          const p = _pingMarkers[i]
          p.timer -= delta
          // Pulse
          const pulse = 0.4 + Math.sin(Date.now() * 0.006) * 0.2
          ;(p.mesh.material as THREE.MeshBasicMaterial).opacity = pulse
          ;(p.ring.material as THREE.MeshBasicMaterial).opacity = pulse * 0.7
          p.ring.scale.setScalar(1 + Math.sin(Date.now() * 0.004) * 0.15)
          if (p.timer <= 0) {
            scene.remove(p.mesh); scene.remove(p.ring)
            p.mesh.geometry.dispose(); (p.mesh.material as THREE.Material).dispose()
            p.ring.geometry.dispose(); (p.ring.material as THREE.Material).dispose()
            _pingMarkers.splice(i, 1)
          }
        }
        // Tick minimap pings
        for (let i = mm.pings.length - 1; i >= 0; i--) {
          mm.pings[i].timer -= delta
          if (mm.pings[i].timer <= 0) mm.pings.splice(i, 1)
        }

        // ── Escort ring + path lines ─────────────────────
        const escortingEnemies = enemies.filter(e => e.state === 'ESCORT')
        const anyEscort = escortingEnemies.length > 0
        state.beingEscorted = anyEscort
        if (!anyEscort) state.escortEscalated = false
        escortRing.visible = anyEscort
        if (anyEscort) {
          escortRing.position.set(playerPos.x, 0.03, playerPos.z)
          escortRingMat.opacity = 0.35 + Math.abs(Math.sin(Date.now() * 0.004)) * 0.4
          escortRingMat.color.set(state.escortEscalated ? 0xff3333 : 0xffcc00)
        }

        // Update escort path lines (one per escorting guard)
        // Grow/shrink pool to match
        while (escortLines.length < escortingEnemies.length) {
          const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()])
          const line = new THREE.Line(geo, escortLineMat)
          line.frustumCulled = false
          scene.add(line)
          escortLines.push(line)
        }
        for (let li = 0; li < escortLines.length; li++) {
          if (li < escortingEnemies.length) {
            const eg = escortingEnemies[li]
            const pts = (escortLines[li].geometry as THREE.BufferGeometry).attributes.position
            pts.setXYZ(0, eg.group.position.x, 0.08, eg.group.position.z)
            pts.setXYZ(1, playerPos.x, 0.08, playerPos.z)
            pts.needsUpdate = true
            escortLines[li].visible = true
            // Color matches escalation
            ;(escortLines[li].material as THREE.LineBasicMaterial).color.set(
              state.escortEscalated ? 0xff3333 : 0xffcc00
            )
          } else {
            escortLines[li].visible = false
          }
        }

        // ── Security cameras ───────────────────────────────
        for (const cam of cameras) cam.update(delta, playerPos, visionBoxes)

        // ── Civilians ──────────────────────────────────────
        for (const c of (level.civilians ?? [])) {
          c.update(delta, wallBoxes)

          // Determine desired marker: null | 'spot' | 'phone' | 'dom'
          let wantKind: string | null = null

          if (c.isTied || c.isDead) {
            c.spotTimer = 0
          } else if (c.isSurrendering) {
            wantKind = 'dom'
          } else if (GameManager.isLoudPhase()) {
            c.spotTimer = 0
          } else if (state.maskOn) {
            const civDist = playerPos.distanceTo(c.group.position)
            if (civDist < 10 && hasLOS(c.group.position, eyePos, visionBoxes)) {
              c.spotTimer += delta
              if (c.spotTimer >= 15.0) {
                c.spotTimer = 0
                c.startFleeing(level.exfilZones)
                GameManager.triggerAlarm()
                sfx.guardAlert()
                addKillFeed('Civilian called the police!', '#ff4444')
              } else if (c.spotTimer >= 3.0) {
                wantKind = 'phone'
              } else if (c.spotTimer > 0.3) {
                wantKind = 'spot'
              }
            } else {
              c.spotTimer = Math.max(0, c.spotTimer - delta * 1.5)
              if (c.spotTimer >= 3.0) wantKind = 'phone'
              else if (c.spotTimer > 0.3) wantKind = 'spot'
            }
          } else {
            c.spotTimer = Math.max(0, c.spotTimer - delta * 2.0)
          }

          // ── Civilian spots a dead body → panic + alarm ──────────
          if (!c.isDead && !c.isTied && !c.isSurrendering && !c._fleeing && !GameManager.isLoudPhase()) {
            const cEye = c.group.position.clone(); cEye.y = 1.55
            for (const ub of unbaggedBodies) {
              const bd = c.group.position.distanceTo(ub.pos)
              if (bd > 8) continue
              const bEye = ub.pos.clone(); bEye.y = 0.5
              if (!hasLOS(cEye, bEye, visionBoxes)) continue
              // Civilian saw a dead body — instant panic
              c.startFleeing(level.exfilZones)
              GameManager.triggerAlarm()
              sfx.guardAlert()
              addKillFeed('Civilian spotted a body!', '#ff4444')
              break
            }
          }

          // Update marker sprite
          const existing = civMarkers.get(c)
          if (wantKind === null) {
            if (existing) {
              scene.remove(existing.sprite); existing.sprite.material.dispose()
              civMarkers.delete(c)
            }
          } else {
            if (!existing || existing.kind !== wantKind) {
              if (existing) { scene.remove(existing.sprite); existing.sprite.material.dispose() }
              const mat = new THREE.SpriteMaterial({
                map: _civTex[wantKind], depthTest: false, depthWrite: false, transparent: true,
              })
              const sprite = new THREE.Sprite(mat)
              sprite.renderOrder = 9999
              sprite.scale.set(0.5, 0.5, 1)
              sprite.position.set(c.group.position.x, 2.4, c.group.position.z)
              scene.add(sprite)
              civMarkers.set(c, { sprite, kind: wantKind })
              if (wantKind === 'phone') addKillFeed('Civilian calling the police!', '#ffaa44')
            }
            // Animate: follow position + blink for phone
            const m = civMarkers.get(c)!
            m.sprite.position.set(c.group.position.x, 2.4, c.group.position.z)
            if (m.kind === 'phone') {
              m.sprite.material.opacity = Math.sin(Date.now() * 0.012) > 0 ? 1.0 : 0.4
            }
          }
        }

        // ── ASSAULT entities ───────────────────────────────
        assault.tick(delta, playerPos, physics.eyeH(), visionBoxes, enemies)

        // ── Environmental hazards ──────────────────────────
        hazards.tick(delta, playerPos)

    }

    // ── Camera ─────────────────────────────────────────────
    camera.position.set(playerPos.x, playerPos.y + physics.eyeH(), playerPos.z)
    camera.rotation.set(orient.pitch, orient.yaw, 0, 'YXZ')

    // ── Weapon bob ─────────────────────────────────────────
    const isMoving = !!(keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'])
    weaponView.update(delta, isMoving, combat.RELOAD_TIME)

    // ── Render ─────────────────────────────────────────────
    postProc.setWeaponEnabled(document.pointerLockElement === canvas && state.maskOn)
    postProc.render()

    // ── Co-op broadcast (10 Hz) ────────────────────────────
    if (NetworkManager.enabled) {
      netTimer += delta
      if (netTimer >= 0.1) {
        netTimer = 0
        NetworkManager.send('pos', {
          x: playerPos.x, y: playerPos.y, z: playerPos.z,
          yaw: orient.yaw, pitch: orient.pitch, pi: NetworkManager.playerIndex,
          down: state.isDown ? 1 : 0,
        })
        // Host: broadcast enemy snapshot + drill progress at 10Hz
        if (_isCoopHost) {
          const snap = enemies
            .filter(e => e.state !== 'DEAD')
            .map(e => ({
              id: e.netId,
              x: e.group.position.x, z: e.group.position.z,
              ry: e.group.rotation.y,
              st: e.state, hp: e.health,
            }))
          NetworkManager.send('e-snap', { enemies: snap })
          // Sync drill progress so client HUD matches
          if (drillPlaced && state.drillActive) {
            NetworkManager.send('drill-prog', { p: state.drillProgress })
          }
        }
      }
    }

    for (const k in justDn) delete justDn[k]
    mouseJust = false
  }

  // ── Code puzzle solved event ───────────────────────────────
  const onPuzzleSolved = () => {
    const ct = codeTerminals.find(t => state.activeCodePuzzle?.index === t.index)
    if (ct && !ct.completed) {
      ct.completed = true; GameManager.completeObjective(); state.sessionXP += 100
    }
    state.activeCodePuzzle = null
  }
  window.addEventListener('codePuzzleSolved', onPuzzleSolved)

  // ── Co-op network setup ────────────────────────────────────
  let _restoreGameManager = () => {}
  if (NetworkManager.enabled) {
    const _origComplete    = GameManager.completeObjective.bind(GameManager)
    const _origEscape      = GameManager.escape.bind(GameManager)
    const _origTrigAlarm   = GameManager.triggerAlarm.bind(GameManager)
    const _origIncAlarm    = GameManager.increaseAlarm.bind(GameManager)
    const _origRadioAlarm  = GameManager.radioAlarm.bind(GameManager)

    GameManager.completeObjective = function() {
      _origComplete(); if (!_remoteBroadcasting) NetworkManager.send('obj', {})
    }
    GameManager.escape = function() {
      _origEscape(); if (!_remoteBroadcasting) NetworkManager.send('escape', {})
    }

    // Client alarm interception: send request to host instead of triggering locally
    if (_isCoopClient) {
      GameManager.triggerAlarm  = function() { NetworkManager.send('alarm-req', {}) }
      GameManager.increaseAlarm = function(amt) { NetworkManager.send('alarm-req', { amount: amt }) }
      GameManager.radioAlarm    = function() { NetworkManager.send('alarm-req', { radio: true }) }
    }

    // Host: register phase callback → broadcast phase changes
    if (_isCoopHost) {
      setNetPhaseCallback((phase, alarmLevel) => {
        NetworkManager.send('phase', { phase, alarmLevel })
      })
      // Send initial enemy spawn list to clients after a short delay
      setTimeout(() => {
        const spawnData = enemies.map(e => ({
          id: e.netId,
          x: e.group.position.x, z: e.group.position.z,
          etype: e.type,
        }))
        NetworkManager.send('e-spawn', { enemies: spawnData })
        // Also send initial phase state
        NetworkManager.send('phase', { phase: state.phase, alarmLevel: state.alarmLevel })
        // Send open door indices
        level.doors.forEach((door, idx) => {
          if (door.isOpen) NetworkManager.send('door', { idx })
        })
      }, 500)
    }

    NetworkManager.onMessage(data => {
      // ── Player position ──
      if (data.type === 'pos') {
        const pid = data._from
        if (!remotePlayers[pid]) {
          const mesh = _makeRemoteMesh(NET_COLORS[data.pi ?? 1] ?? 0xffffff)
          // Teleport to first known position so the mesh doesn't lerp in from origin
          mesh.position.set(data.x, data.y, data.z)
          mesh.rotation.y = data.yaw ?? 0
          mesh._netTarget   = new THREE.Vector3(data.x, data.y, data.z)
          mesh._netTargetRY = data.yaw ?? 0
          mesh._netTargetRZ = 0
          scene.add(mesh); remotePlayers[pid] = mesh
        }
        const rp = remotePlayers[pid]
        // Store targets — lerped each frame in game loop (smooth interpolation)
        rp._netTarget.set(data.x, data.y, data.z)
        rp._netTargetRY = data.yaw ?? 0
        rp._isDown      = !!data.down
        rp._netTargetRZ = data.down ? Math.PI / 2 : 0
        if (data.pitch !== undefined && !data.down) {
          const aimRot = Math.PI * 0.5 + data.pitch
          rp._armR.rotation.x = aimRot
          rp._armL.rotation.x = aimRot - 0.18
        }
      }
      // ── Revive ──
      else if (data.type === 'revive') {
        if (state.isDown) {
          state.reviveProgress = 0; revivePlayer()
          state.hint = 'A teammate revived you!'
        }
      }
      // ── Objective ──
      else if (data.type === 'obj') {
        _remoteBroadcasting = true; GameManager.completeObjective(); state.sessionXP += 100; _remoteBroadcasting = false
      }
      // ── Escape ──
      else if (data.type === 'escape') {
        _remoteBroadcasting = true; GameManager.escape(); _remoteBroadcasting = false
      }
      // ── Chat ──
      else if (data.type === 'chat') {
        state.chatMessages.push({ id: Date.now() + Math.random(), text: data.text, playerIndex: data.pi ?? 0, time: Date.now() })
        if (state.chatMessages.length > 20) state.chatMessages.shift()
      }

      // ── Phase sync (client receives from host) ──
      else if (data.type === 'phase' && _isCoopClient) {
        const prevPhase  = state.phase
        state.phase      = data.phase
        state.alarmLevel = data.alarmLevel ?? state.alarmLevel
        // Sync music + civilian flee on phase change
        if (data.phase !== prevPhase) {
          music.setPhase(data.phase)
          if (['ANTICIPATION', 'ASSAULT'].includes(data.phase))
            for (const c of (level.civilians ?? [])) c.startFleeing(level.exfilZones)
        }
      }

      // ── Alarm request (host receives from client) ──
      else if (data.type === 'alarm-req' && _isCoopHost) {
        if (data.radio)       _origRadioAlarm()
        else if (data.amount) _origIncAlarm(data.amount)
        else                  _origTrigAlarm()
      }

      // ── Door sync ──
      else if (data.type === 'door') {
        const door = level.doors[data.idx]
        if (door && !door.isOpen) { door.open(); sfx.doorOpen() }
      }

      // ── Bag pickup ──
      else if (data.type === 'bag-pick') {
        activeBags.delete(data.idx)
        if (level.bagMeshes[data.idx]) level.bagMeshes[data.idx].visible = false
      }

      // ── Bag drop ──
      else if (data.type === 'bag-drop') {
        activeBags.add(data.idx)
        if (level.objectivePositions[data.idx]) {
          level.objectivePositions[data.idx].set(data.x, 0, data.z)
        }
        if (level.bagMeshes[data.idx]) {
          level.bagMeshes[data.idx].position.set(data.x, 0.25, data.z)
          level.bagMeshes[data.idx].visible = true
        }
      }

      // ── Bag secured ──
      else if (data.type === 'bag-secure') {
        activeBags.delete(data.idx)
        if (level.bagMeshes[data.idx]) level.bagMeshes[data.idx].visible = false
      }

      // ── Mask on (remote player) ──
      else if (data.type === 'mask') {
        // Visual: could update remote player mesh — for now just a feed note
      }

      // ── Enemy spawn (client receives initial + wave spawns) ──
      else if (data.type === 'e-spawn' && _isCoopClient) {
        for (const ed of (data.enemies ?? [])) {
          // Skip if already exists
          if (enemies.some(e => e.netId === ed.id)) continue
          const pos = new THREE.Vector3(ed.x, 0, ed.z)
          const e = new Enemy(scene, pos, ed.etype || 'guard')
          e.netId = ed.id
          e._netTarget = pos.clone()
          e._netTargetRY = 0
          e._navGrid = _navGrid
          // Client enemies don't run AI — no onHitPlayer needed
          enemies.push(e)
        }
      }

      // ── Enemy snapshot (client lerp targets) ──
      else if (data.type === 'e-snap' && _isCoopClient) {
        for (const ed of (data.enemies ?? [])) {
          const e = enemies.find(en => en.netId === ed.id)
          if (e) {
            if (!e._netTarget) e._netTarget = new THREE.Vector3()
            e._netTarget.set(ed.x, 0, ed.z)
            e._netTargetRY = ed.ry ?? 0
            e.state  = ed.st ?? e.state
            e.health = ed.hp ?? e.health
          }
        }
      }

      // ── Enemy kill (client) ──
      else if (data.type === 'e-kill' && _isCoopClient) {
        const e = enemies.find(en => en.netId === data.id)
        if (e && e.state !== 'DEAD') {
          e.state = 'DEAD'; e.health = 0
          e.group.visible = false
          state.killCount++
          addKillFeed('Guard eliminated', '#ffffff')
        }
      }

      // ── Hit request (host receives from client) ──
      else if (data.type === 'hit' && _isCoopHost) {
        const e = enemies.find(en => en.netId === data.eid)
        if (e && e.state !== 'DEAD') {
          e.takeDamage(data.dmg ?? 25)
        }
      }

      // ── Enemy damage to remote player (host → client) ──
      else if (data.type === 'e-dmg') {
        // Only take damage if targeted at me (pid matches), or if I'm host and pid is null
        const myPeerId = NetworkManager.players[NetworkManager.playerIndex]?.peerId
        if (data.pid === myPeerId) {
          takeDamage(data.dmg ?? 10)
        }
      }

      // ── Holdout trade (co-op: any player can trigger trade) ──
      else if (data.type === 'holdout-trade') {
        if (state.gameMode === 'holdout' && state.holdoutTradeOpen) {
          GameManager.holdoutTrade()
        }
      }

      // ── Shoot visual (muzzle flash on remote) ──
      else if (data.type === 'shoot') {
        const pid = data._from
        if (remotePlayers[pid]) {
          // Quick muzzle flash
          const flash = new THREE.PointLight(0xffaa33, 3, 4)
          flash.position.copy(remotePlayers[pid].position)
          flash.position.y += 1.4
          scene.add(flash)
          setTimeout(() => scene.remove(flash), 80)
        }
      }

      // ── Drill picked up (remote player) ──
      else if (data.type === 'drill-pick') {
        if (drillMesh) drillMesh.visible = false
      }

      // ── Drill placed on door ──
      else if (data.type === 'drill-place') {
        if (drillMesh) {
          drillMesh.position.set(data.x, 0.3, data.z)
          drillMesh.visible = true
          drillPlaced = true; drillProgress = 0
          state.drillActive = true; state.drillProgress = 0
          addKillFeed('THERMAL DRILL PLACED — drilling...', '#ff8844')
        }
      }

      // ── Drill dropped on ground ──
      else if (data.type === 'drill-drop') {
        if (drillMesh) {
          drillMesh.position.set(data.x, 0.23, data.z)
          drillMesh.visible = true
        }
      }

      // ── Drill done (vault breached) ──
      else if (data.type === 'drill-done') {
        const door = level.doors[data.doorIdx]
        if (door && !door.isOpen) { door.open(); sfx.doorOpen() }
        if (drillMesh) drillMesh.visible = false
        state.drillActive = false; state.drillProgress = 1
        drillPlaced = false
        addKillFeed('VAULT DOOR BREACHED!', '#44ff44')
      }

      // ── Drill progress (client HUD sync) ──
      else if (data.type === 'drill-prog' && _isCoopClient) {
        state.drillProgress = data.p ?? 0
      }
    })

    _restoreGameManager = () => {
      GameManager.completeObjective = _origComplete
      GameManager.escape            = _origEscape
      GameManager.triggerAlarm      = _origTrigAlarm
      GameManager.increaseAlarm     = _origIncAlarm
      GameManager.radioAlarm        = _origRadioAlarm
      setNetPhaseCallback(null)
      NetworkManager.onMessage(null)
      for (const pid in remotePlayers) scene.remove(remotePlayers[pid])
    }
  }

  requestAnimationFrame(t => { lastTime = t; rafId = requestAnimationFrame(loop) })

  return {
    destroy() {
      cancelAnimationFrame(rafId); waveManager.destroy(); hazards.destroy()
      for (const b of droneBombs) { scene.remove(b.mesh); b.mesh.geometry.dispose(); b.mat.dispose() }
      droneBombs.length = 0
      for (const a of armorDrops) { scene.remove(a.mesh); a.mesh.geometry.dispose(); (a.mesh.material as THREE.Material).dispose() }
      armorDrops.length = 0
      for (const u of uniformDrops) { scene.remove(u.mesh); u.mesh.geometry.dispose(); (u.mesh.material as THREE.Material).dispose() }
      uniformDrops.length = 0
      for (const a of ammoDrops) { scene.remove(a.mesh); a.mesh.geometry.dispose(); (a.mesh.material as THREE.Material).dispose() }
      ammoDrops.length = 0
      for (const cam of cameras) cam.remove()
      if (hostage) hostage.dispose(scene)
      _feedTimers.forEach(t => clearTimeout(t))
      for (const [, radio] of enemyRadio) {
        scene.remove(radio.mesh); radio.mesh.geometry.dispose()
        ;(radio.mesh.material as THREE.Material).dispose()
      }
      enemyRadio.clear()
      for (const [, m] of civMarkers) {
        scene.remove(m.sprite); m.sprite.material.dispose()
      }
      civMarkers.clear()
      _civTex.spot.dispose(); _civTex.phone.dispose(); _civTex.dom.dispose()
      document.removeEventListener('keydown',   onKeyDn)
      document.removeEventListener('keyup',     onKeyUp)
      document.removeEventListener('mousemove', onMouse)
      document.removeEventListener('mousedown', onMDn)
      document.removeEventListener('mouseup',   onMUp)
      canvas.removeEventListener('contextmenu', onCtxMenu)
      window.removeEventListener('resize',      onResize)
      window.removeEventListener('codePuzzleSolved', onPuzzleSolved)
      _restoreGameManager()
      music.destroy()
      weaponView.dispose()
      postProc.dispose()
      renderer.dispose()
    },
  }
}
