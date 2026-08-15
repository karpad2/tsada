import * as THREE from 'three'
import {
  addWall, addFloor, addCeiling, addPillar,
  makeProp,
  makeDesk, makeCrate, makeBarrel, makeShelf, makeCounter,
  makeContainer, makeDisplayCase, makeSafe, makeServerRack,
  makeGamingTable, makePedestal, makeFilingCab, makeLocker,
  makeSofa, makeWorkbench, makeTank, makeConsole, makeCabinet,
  makeGurney, makeCargoBox, makeConsolePod,
  makeGasTank, makeFuelBarrel, makeElectricPanel,
  addVan, addTruck, addCar, addArmoredTruck,
  addEscapeDisc, addBag, addPointLight,
} from './assets/index.ts'
import { makeDetailedProp, _boxFromShape, _cylFromShape, _boxE } from './assets/_utils.ts'
import { resolveCustomAsset } from './CustomAssetStore.ts'
import { Destructible } from '../Destructible.ts'
import { Door } from './Door.ts'
import { Civilian, THEME_VARIANTS } from '../Civilian.ts'
import { loadModel, enableShadows } from './ModelLoader.ts'
import { Interactable } from '../Interactable.ts'
import { GlassPanel } from '../GlassPanel.ts'

// ── Random civilian spawner ───────────────────────────────
// Spawns civilians randomly inside public / private zones.
// Variant is chosen from the map's civilianTheme (default 'default').
function _spawnCivilians(scene, zones, civilianCount = 5, employeeCount = 3, theme = 'default') {
  const themeKey   = THEME_VARIANTS[theme] ? theme : 'default'
  const [pubVar, prvVar] = THEME_VARIANTS[themeKey]
  const placed = []
  const result = []
  const MARGIN  = 1.8
  const MIN_SEP = 2.0

  function trySpawn(zoneType, count, variant) {
    const eligible = zones.filter(z => z.type === zoneType)
    if (eligible.length === 0) return
    for (let i = 0; i < count; i++) {
      for (let attempt = 0; attempt < 40; attempt++) {
        const zone = eligible[Math.floor(Math.random() * eligible.length)]
        const hw   = Math.max(0, (zone.w ?? 4) / 2 - MARGIN)
        const hd   = Math.max(0, (zone.d ?? 4) / 2 - MARGIN)
        const cx   = zone.x + (Math.random() * 2 - 1) * hw
        const cz   = zone.z + (Math.random() * 2 - 1) * hd
        if (placed.every(([px, pz]) => Math.hypot(px - cx, pz - cz) >= MIN_SEP)) {
          placed.push([cx, cz])
          result.push(new Civilian(scene, cx, cz, variant))
          break
        }
      }
    }
  }

  trySpawn('public',  civilianCount, pubVar)
  trySpawn('private', employeeCount, prvVar)
  return result
}

// ── Prop type dispatch ────────────────────────────────────────
const PROP = {
  desk:        (s,x,z)   => makeDesk(s, x, z),
  crate:       (s,x,z,o) => makeCrate(s, x, z, o.size),
  barrel:      (s,x,z)   => makeBarrel(s, x, z),
  shelf:       (s,x,z)   => makeShelf(s, x, z),
  counter:     (s,x,z,o) => makeCounter(s, x, z, o.w, o.d),
  container:   (s,x,z)   => makeContainer(s, x, z),
  displayCase: (s,x,z)   => makeDisplayCase(s, x, z),
  safe:        (s,x,z)   => makeSafe(s, x, z),
  server:      (s,x,z)   => makeServerRack(s, x, z),
  table:       (s,x,z)   => makeGamingTable(s, x, z),
  pedestal:    (s,x,z)   => makePedestal(s, x, z),
  cabinet:     (s,x,z)   => makeFilingCab(s, x, z),
  locker:      (s,x,z)   => makeLocker(s, x, z),
  sofa:        (s,x,z)   => makeSofa(s, x, z),
  workbench:   (s,x,z)   => makeWorkbench(s, x, z),
  tank:        (s,x,z)   => makeTank(s, x, z),
  console:     (s,x,z)   => makeConsole(s, x, z),
  filecab:     (s,x,z)   => makeFilingCab(s, x, z),
  gurney:      (s,x,z)   => makeGurney(s, x, z),
  cargobox:    (s,x,z)   => makeCargoBox(s, x, z),
  consolepod:  (s,x,z)   => makeConsolePod(s, x, z),
  gasTank:       (s,x,z) => makeGasTank(s, x, z),
  fuelBarrel:    (s,x,z) => makeFuelBarrel(s, x, z),
  electricPanel: (s,x,z) => makeElectricPanel(s, x, z),
}

// ── Main builder ─────────────────────────────────────────────
export function buildFromData(scene, data) {
  const wallMeshes  = []   // all structural walls (solid + glass) — used for movement collision
  const solidMeshes = []   // solid walls only — used for enemy line-of-sight
  const wallEntries = []   // { mesh, box3, isSolid } — for breach system
  const destructibles = []
  const glassPanels: GlassPanel[] = []
  const vehicleBoxes = []

  // Floors (visual only)
  for (const f of (data.floors ?? []))
    addFloor(scene, f.x, f.z, f.w, f.d, f.color, f.tex, f.y ?? 0)

  // Ceilings (optional)
  for (const c of (data.ceilings ?? []))
    addCeiling(scene, c.x, c.z, c.w, c.d, c.h ?? 4, c.color)

  // Structural walls → separated into solid vs glass vs destructible
  const _wallDestructible = data.destructibleWalls ?? false
  const _wallHp           = data.wallHp ?? 400   // bullet-proof default; only explosives breach

  // Split a destructible wall into 1.5m panels along its long axis
  function _splitWall(x, z, w, d, panelSize = 1.5) {
    const panels = []
    if (w >= d) {
      const n = Math.max(1, Math.round(w / panelSize)); const pw = w / n
      for (let i = 0; i < n; i++)
        panels.push({ x: x - w / 2 + pw / 2 + i * pw, z, w: pw, d })
    } else {
      const n = Math.max(1, Math.round(d / panelSize)); const pd = d / n
      for (let j = 0; j < n; j++)
        panels.push({ x, z: z - d / 2 + pd / 2 + j * pd, w, d: pd })
    }
    return panels
  }

  for (const w of (data.walls ?? [])) {
    if (w.window) {
      // Wall with window: solid frame (sill, lintel, 2 side posts) + breakable glass center
      const wallH = w.h ?? 4
      const wallY = w.y ?? 0
      const color = w.color ?? 0xcfbf9a
      const winBottom = w.windowY ?? 1.0    // bottom of glass from floor
      const winH     = w.windowH ?? 1.5     // height of glass pane
      const winTop   = winBottom + winH
      const sillH    = winBottom             // bottom sill height
      const lintelH  = Math.max(0.1, wallH - winTop) // top portion above window
      const frameW   = w.windowFrame ?? 0.3  // side frame width
      const isH      = w.w >= w.d            // horizontal or vertical wall
      const wallLen  = isH ? w.w : w.d
      const wallThk  = isH ? w.d : w.w
      const winLen   = Math.max(0.3, wallLen - frameW * 2) // glass width

      // Bottom sill (full width)
      if (sillH > 0.05) {
        const sill = addWall(scene, w.x, w.z, w.w, sillH, w.d, color, wallY, w.tex)
        solidMeshes.push(sill); wallMeshes.push(sill)
      }
      // Top lintel (full width)
      if (lintelH > 0.05) {
        const lintel = addWall(scene, w.x, w.z, w.w, lintelH, w.d, color, wallY + winTop, w.tex)
        solidMeshes.push(lintel); wallMeshes.push(lintel)
      }
      // Left side post
      if (isH) {
        const lx = w.x - wallLen / 2 + frameW / 2
        const post = addWall(scene, lx, w.z, frameW, winH, w.d, color, wallY + winBottom, w.tex)
        solidMeshes.push(post); wallMeshes.push(post)
        // Right side post
        const rx = w.x + wallLen / 2 - frameW / 2
        const rPost = addWall(scene, rx, w.z, frameW, winH, w.d, color, wallY + winBottom, w.tex)
        solidMeshes.push(rPost); wallMeshes.push(rPost)
      } else {
        const lz = w.z - wallLen / 2 + frameW / 2
        const post = addWall(scene, w.x, lz, w.w, winH, frameW, color, wallY + winBottom, w.tex)
        solidMeshes.push(post); wallMeshes.push(post)
        const rz = w.z + wallLen / 2 - frameW / 2
        const rPost = addWall(scene, w.x, rz, w.w, winH, frameW, color, wallY + winBottom, w.tex)
        solidMeshes.push(rPost); wallMeshes.push(rPost)
      }
      // Glass pane in the center (breakable — blocks movement, transparent to LOS)
      const gw = isH ? winLen : wallThk
      const gd = isH ? wallThk : winLen
      const glassMesh = addWall(scene, w.x, w.z, gw, winH, gd, 0xccddff, wallY + winBottom)
      glassMesh.material = new THREE.MeshLambertMaterial({
        color: 0xccddff, transparent: true, opacity: 0.3,
        side: THREE.DoubleSide,
      })
      wallMeshes.push(glassMesh)
      const gp = new GlassPanel(scene, glassMesh)
      glassPanels.push(gp)
    } else if (w.glass) {
      // Full glass wall: movement blocked, LOS passes, breakable
      const m = addWall(scene, w.x, w.z, w.w, w.h ?? 4, w.d,
                        w.color ?? 0xcfbf9a, w.y ?? 0, w.tex)
      m.material = new THREE.MeshLambertMaterial({
        color: 0xccddff, transparent: true, opacity: 0.3,
        side: THREE.DoubleSide,
      })
      wallMeshes.push(m)
      glassPanels.push(new GlassPanel(scene, m))
    } else if (w.breachable) {
      // Breachable wall: AI can blow it open when stuck nearby
      const m = addWall(scene, w.x, w.z, w.w, w.h ?? 4, w.d,
                        w.color ?? 0xcfbf9a, w.y ?? 0, w.tex)
      const d = new Destructible(scene, m, w.hp ?? 150)
      d.isBreachable = true
      destructibles.push(d)
    } else if (w.destructible ?? _wallDestructible) {
      // Split into panels — each panel is an independent Destructible section (Finals-style)
      // Engine adds each panel's box3 to wallBoxes+visionBoxes and removes on shatter.
      // High HP means only explosives (breach charge / grenade cluster) can break through.
      for (const p of _splitWall(w.x, w.z, w.w, w.d)) {
        const pm = addWall(scene, p.x, p.z, p.w, w.h ?? 4, p.d,
                           w.color ?? 0xcfbf9a, w.y ?? 0, w.tex)
        destructibles.push(new Destructible(scene, pm, w.hp ?? _wallHp))
      }
    } else {
      const m = addWall(scene, w.x, w.z, w.w, w.h ?? 4, w.d,
                        w.color ?? 0xcfbf9a, w.y ?? 0, w.tex)
      solidMeshes.push(m)
      wallMeshes.push(m)
      wallEntries.push({ mesh: m, isSolid: true })
    }
  }

  // Pillars → always solid
  for (const p of (data.pillars ?? [])) {
    const pm = addPillar(scene, p.x, p.z, p.h ?? 4, p.color)
    wallMeshes.push(pm)
    solidMeshes.push(pm)
  }

  // Destructible props
  for (const _origP of (data.props ?? [])) {
    // Slight random offset for non-critical props (adds variety each run)
    const p = { ..._origP }
    if (!p.noRandom && p.type !== 'safe' && p.type !== 'gasTank' && p.type !== 'fuelBarrel' && p.type !== 'electricPanel') {
      p.x += (Math.random() - 0.5) * 0.4
      p.z += (Math.random() - 0.5) * 0.4
    }
    let d
    if (p.type === 'model' && p.src) {
      // ── External model (OBJ/GLTF/GLB) — loads async ──────────
      const g = new THREE.Group()
      g.position.set(p.x, 0, p.z)
      if (p.rotY) g.rotation.y = p.rotY
      scene.add(g)
      d = new Destructible(scene, g, p.hp ?? 100)
      // Async: load model, add to group, apply scale + shadows
      loadModel(p.src, p.mtl).then(model => {
        const s = p.scale ?? 1
        model.scale.set(s, s, s)
        enableShadows(model)
        g.add(model)
        // Refresh bounding box now that geometry is loaded
        d.box3.setFromObject(g)
      }).catch(err => console.warn(`[LevelBuilder] Model load failed: ${p.src}`, err))
    } else if (p.type?.startsWith('custom:')) {
      // ── Custom user-defined asset ──────────
      const def = resolveCustomAsset(p.type)
      if (def) {
        d = makeDetailedProp(scene, p.x, p.z, g => {
          for (const s of def.shapes) {
            let mesh
            if (s.kind === 'box')  mesh = _boxFromShape(g, s)
            else if (s.kind === 'cyl')  mesh = _cylFromShape(g, s)
            else if (s.kind === 'boxE') mesh = _boxE(g, s.w, s.h, s.d, s.color, s.emissive, s.ei, s.lx, s.ly, s.lz)
            if (mesh) {
              if (s.rotX) mesh.rotation.x = s.rotX
              if (s.rotY) mesh.rotation.y = s.rotY
              if (s.rotZ) mesh.rotation.z = s.rotZ
            }
          }
        }, p.hp ?? def.hp)
        if (p.rotY) d.mesh.rotation.y = p.rotY
        if (typeof d.refreshBox === 'function') d.refreshBox()
        if (p.type.includes('fuelBarrel')) d.hazardType = 'fuelBarrel'
        else if (p.type.includes('gasTank')) d.hazardType = 'gasTank'
        else if (p.type.includes('electricPanel')) d.hazardType = 'electricPanel'
      } else {
        d = makeProp(scene, p.x, p.z, 0.8, 0.8, 0.8, 0xFF00FF, p.hp ?? 60)
      }
    } else if (p.type) {
      const factory = PROP[p.type]
      if (factory) {
        d = factory(scene, p.x, p.z, p)
        if (p.rotY) d.mesh.rotation.y = p.rotY
        if (typeof d.refreshBox === 'function') d.refreshBox()
        // Allow hp override
        if (p.hp !== undefined) d.health = d.maxHealth = p.hp
        // Tag hazard props for Engine to trigger special effects on destruction
        if (p.type === 'gasTank' || p.type === 'fuelBarrel' || p.type === 'electricPanel') {
          d.hazardType = p.type
        }
      } else {
        console.warn(`[LevelBuilder] Unknown prop type: ${p.type}`)
        continue
      }
    } else {
      d = makeProp(scene, p.x, p.z, p.w, p.h, p.d,
                   p.color ?? 0x3a3030, p.hp ?? 60)
      if (p.rotY) d.mesh.rotation.y = p.rotY
    }
    destructibles.push(d)

    // Find glass meshes inside props (e.g. displayCase) and create GlassPanels
    if (d?.mesh) {
      d.mesh.traverse(child => {
        if ((child as any).isMesh && (child as any).material?.transparent &&
            (child as any).material?.opacity < 0.5 && !(child as any).userData.glassPanel) {
          glassPanels.push(new GlassPanel(scene, child as THREE.Mesh))
        }
      })
    }
  }

  // ── Openable safes (collect props that have a doorPivot) ─────
  const safes: any[] = []
  for (const d of destructibles) {
    if ((d as any).doorPivot) safes.push(d)
  }

  // ── Objectives (new multi-type format, backwards-compatible) ───────────────
  // Old format: objectives: [[x,z], ...]  → normalized to {type:'bag',x,z}
  // New format: objectives: [{type,x,z,...}, ...]
  const rawObjs = (data.objectives ?? []).map(o =>
    Array.isArray(o) ? { type: 'bag', x: o[0], z: o[1] } : o)

  const objectivePositions = []
  const bagMeshes          = []
  const keycardItems       = []   // {mesh, id, pos, collected}
  const codeTerminals      = []   // {mesh, pos, index}
  const c4Zones            = []   // {mesh, pos, index}

  for (let i = 0; i < rawObjs.length; i++) {
    const o = rawObjs[i]
    const pos = new THREE.Vector3(o.x, 0, o.z)

    if (o.type === 'bag') {
      objectivePositions.push(pos)
      bagMeshes.push(addBag(scene, o.x, o.z, data.bagColor ?? 0x3a2800))

    } else if (o.type === 'keycard') {
      // Small golden glowing box on a pedestal
      const geo  = new THREE.BoxGeometry(0.18, 0.10, 0.26)
      const mat  = new THREE.MeshLambertMaterial({ color: 0xffd700, emissive: 0xaa8800, emissiveIntensity: 0.7})
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(o.x, 0.95, o.z)
      mesh.castShadow = true
      scene.add(mesh)
      // Pedestal
      const ped = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.9, 0.30),
        new THREE.MeshLambertMaterial({ color: 0x444444}),
      )
      ped.position.set(o.x, 0.45, o.z)
      scene.add(ped)
      // Glow light
      const light = new THREE.PointLight(0xffdd44, 0.6, 1.8)
      light.position.set(o.x, 1.2, o.z)
      scene.add(light)
      keycardItems.push({ mesh, pedestalMesh: ped, light, id: o.id ?? `kc_${i}`, pos: pos.clone(), collected: false })

    } else if (o.type === 'code') {
      // Laptop / console terminal
      const d = makeConsole(scene, o.x, o.z)
      codeTerminals.push({ mesh: d.mesh, pos: pos.clone(), index: codeTerminals.length, completed: false })

    } else if (o.type === 'c4') {
      // Red glowing floor disc (like escape disc but red)
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.55, 0.06, 20),
        new THREE.MeshLambertMaterial({ color: 0xff2222, emissive: 0xaa0000, emissiveIntensity: 0.6}),
      )
      disc.position.set(o.x, 0.03, o.z)
      scene.add(disc)
      const dLight = new THREE.PointLight(0xff2222, 0.5, 2.5)
      dLight.position.set(o.x, 0.5, o.z)
      scene.add(dLight)
      c4Zones.push({ mesh: disc, light: dLight, pos: pos.clone(), index: c4Zones.length, planted: false })
    }
  }

  // Escape disc + vehicle
  const [ex, ez, er = 2.5] = data.escape
  const { setActive, setDropHighlight, updateRing } = addEscapeDisc(scene, ex, ez, er)
  // Vehicle collision sizes: [halfW, halfH, halfD, zOffset]
  const vehSizes = { van: [1.1, 1.3, 2.4, 3], truck: [1.3, 1.5, 3.5, 4], car: [0.9, 0.9, 1.9, 2.5], armored: [1.2, 1.3, 2.75, 3.5] }
  let vehType = data.vehicle
  if (vehType === 'van')          addVan(scene, ex, ez + 3, data.vehicleAngle ?? 0)
  else if (vehType === 'truck')   addTruck(scene, ex, ez + 4, data.vehicleAngle ?? 0)
  else if (vehType === 'car')     addCar(scene, ex, ez + 2.5, data.vehicleColor ?? 0x334466)
  else if (vehType === 'armored') addArmoredTruck(scene, ex, ez + 3.5, data.vehicleAngle ?? 0)
  if (vehType && vehSizes[vehType]) {
    const [hw, hh, hd, zo] = vehSizes[vehType]
    vehicleBoxes.push(new THREE.Box3(
      new THREE.Vector3(ex - hw, 0, ez + zo - hd),
      new THREE.Vector3(ex + hw, hh * 2, ez + zo + hd),
    ))
  }

  // Thermal drill bag (spawns near vehicle)
  let drillMesh = null, drillDoorIndex = -1, drillTime = 240
  if (data.drill) {
    drillDoorIndex = data.drill.doorIndex
    drillTime      = data.drill.time ?? 240
    drillMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.50, 0.45, 0.40),
      new THREE.MeshLambertMaterial({ color: 0xFF6600 }),
    )
    drillMesh.position.set(ex + 1.5, 0.23, ez + 3)
    drillMesh.castShadow = true
    scene.add(drillMesh)
  }

  // Security bar meshes (art gallery: lock paintings on alarm)
  const barMeshes: any[] = []
  const barProtected = !!data.barProtected
  const hackPos  = data.hack ? { x: data.hack.x, z: data.hack.z } : null
  const hackTime = data.hack?.time ?? 180
  if (barProtected) {
    const barMat = new THREE.MeshLambertMaterial({ color: 0x666666, wireframe: true })
    for (let i = 0; i < objectivePositions.length; i++) {
      const p = objectivePositions[i]
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 0.08), barMat)
      bar.position.set(p.x, 1.0, p.z)
      bar.castShadow = true
      bar.visible = false
      scene.add(bar)
      barMeshes.push(bar)
    }
  }

  // Interior point lights
  for (const l of (data.lights ?? []))
    addPointLight(scene, l[0], l[1], l[2], l[3] ?? 0.7, l[4] ?? 12, l[5] ?? 0xfffce0)

  // Spawn points, exfil zones & patrol routes
  const spawnPoints  = (data.spawnPoints ?? []).map(([x, z]) => new THREE.Vector3(x, 0, z))
  // exfilZones: police staging areas + civilian flee targets; fallback to spawnPoints
  const exfilZones   = (data.exfilZones ?? data.spawnPoints ?? []).map(([x, z]) => new THREE.Vector3(x, 0, z))
  const patrolRoutes = (data.patrolRoutes ?? []).map(r =>
    r.map(([x, z]) => new THREE.Vector3(x, 0, z)))

  // Player start
  const [psx = 0, psz = 9] = data.playerStart ?? [0, 9]
  const playerStart = new THREE.Vector3(psx, 0, psz)

  // Collision boxes: all walls (including glass) + vehicles block movement
  const _wallMeshBoxes = wallMeshes.map(m => new THREE.Box3().setFromObject(m))
  const wallBoxes   = _wallMeshBoxes.concat(vehicleBoxes)
  // Vision boxes: solid walls only block enemy line-of-sight (glass is transparent to LOS)
  const _solidMeshBoxes = solidMeshes.map(m => new THREE.Box3().setFromObject(m))
  const visionBoxes = [..._solidMeshBoxes]

  // Assign same box3 refs to wallEntries (so breach can remove them by reference)
  for (const we of wallEntries) {
    const wi = wallMeshes.indexOf(we.mesh)
    const si = solidMeshes.indexOf(we.mesh)
    we.wallBox3   = wi >= 0 ? _wallMeshBoxes[wi] : null
    we.visionBox3 = si >= 0 ? _solidMeshBoxes[si] : null
  }

  // ── Zones ────────────────────────────────────────────────
  // Each zone: { type:'public'|'private'|'secure', x, z, w, d, label }
  const zones = data.zones ?? []

  // ── Doors ────────────────────────────────────────────────
  // Each door entry: { x, z, angle?, type?:'normal'|'secure'|'keycard', w?, keycardId? }
  const doors = []
  for (const d of (data.doors ?? [])) {
    const door = new Door(scene, d.x, d.z, d.angle ?? 0, d.type ?? 'normal', d.w ?? 1.2, d.keycardId)
    wallBoxes.push(door.box3)
    visionBoxes.push(door.box3)
    // Seal boxes fill gaps beside door frame — permanent, not removed on open
    for (const sb of door.sealBoxes) wallBoxes.push(sb)
    door.onOpen = () => {
      const wi = wallBoxes.indexOf(door.box3)
      if (wi >= 0) wallBoxes.splice(wi, 1)
      const vi = visionBoxes.indexOf(door.box3)
      if (vi >= 0) visionBoxes.splice(vi, 1)
    }
    doors.push(door)
  }

  // ── Civilians (randomised per run in public / private zones) ─
  const civilians = _spawnCivilians(scene, data.zones ?? [], data.civilianCount, data.employeeCount, data.civilianTheme ?? 'default')

  // ── Interactables (buttons, levers, terminals with action chains) ─
  const interactables = (data.interactables ?? []).map(def => new Interactable(scene, def))

  // ── Environment ground (prevents floating-in-void look) ──
  const envGround = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 300),
    new THREE.MeshLambertMaterial({ color: 0x2e2e28}),
  )
  envGround.rotation.x = -Math.PI / 2
  envGround.position.y = -0.02
  envGround.receiveShadow = true
  scene.add(envGround)

  return {
    wallBoxes,
    visionBoxes,
    wallEntries,
    destructibles,
    objectivePositions,
    bagMeshes,
    keycardItems,
    codeTerminals,
    c4Zones,
    spawnPoints,
    exfilZones,
    patrolRoutes,
    escapePos:    new THREE.Vector3(ex, 0, ez),
    escapeRadius: er,
    playerStart,
    setEscapeActive: setActive,
    setDropHighlight,
    updateRing,
    zones,
    doors,
    civilians,
    interactables,
    cameras: data.cameras ?? [],
    drillMesh,
    drillDoorIndex,
    drillTime,
    barMeshes,
    barProtected,
    hackPos,
    hackTime,
    safes,
    glassPanels,
  }
}
