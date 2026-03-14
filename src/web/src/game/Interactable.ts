import * as THREE from 'three'
import type { ActionDef } from './ActionRunner.ts'

// ── Interactable definition (map data format) ────────────────
export interface InteractableDef {
  id: string
  mesh: 'button' | 'lever' | 'terminal' | 'console'
  x: number
  z: number
  y?: number
  rotY?: number
  hint?: string
  holdTime?: number
  requireMask?: boolean
  once?: boolean
  enabled?: boolean
  range?: number
  actions: ActionDef[]
}

// ── Mesh builder registry ────────────────────────────────────
function buildButton(group: THREE.Group) {
  // Wall-mount plate + red cylinder button
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.06),
    new THREE.MeshLambertMaterial({ color: 0x444444}),
  )
  plate.position.set(0, 1.1, 0)
  plate.castShadow = true
  group.add(plate)

  const btn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12),
    new THREE.MeshLambertMaterial({ color: 0xcc2222, emissive: 0x661111, emissiveIntensity: 0.6}),
  )
  btn.rotation.x = Math.PI / 2
  btn.position.set(0, 1.1, 0.04)
  group.add(btn)
  return btn  // the part that animates
}

function buildLever(group: THREE.Group) {
  // Base plate on floor + arm
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.1, 0.3),
    new THREE.MeshLambertMaterial({ color: 0x555555}),
  )
  base.position.set(0, 0.05, 0)
  base.castShadow = true
  group.add(base)

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.5, 0.06),
    new THREE.MeshLambertMaterial({ color: 0xcc8800, emissive: 0x664400, emissiveIntensity: 0.3}),
  )
  arm.position.set(0, 0.35, 0)
  arm.castShadow = true
  group.add(arm)

  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0xff2222}),
  )
  knob.position.set(0, 0.6, 0)
  group.add(knob)
  return arm
}

function buildTerminal(group: THREE.Group) {
  // Tall standing terminal with glowing screen
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 1.4, 0.5),
    new THREE.MeshLambertMaterial({ color: 0x1a1a26}),
  )
  body.position.set(0, 0.7, 0)
  body.castShadow = body.receiveShadow = true
  group.add(body)

  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.4, 0.04),
    new THREE.MeshLambertMaterial({ color: 0x112244, emissive: 0x0044cc, emissiveIntensity: 0.9}),
  )
  screen.position.set(0, 1.1, 0.28)
  group.add(screen)

  const led = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.06, 0.06),
    new THREE.MeshLambertMaterial({ color: 0x00cc44, emissive: 0x00cc44, emissiveIntensity: 0.8}),
  )
  led.position.set(-0.2, 0.85, 0.28)
  group.add(led)
  return screen
}

const MESH_BUILDERS: Record<string, (g: THREE.Group) => THREE.Object3D> = {
  button:   buildButton,
  lever:    buildLever,
  terminal: buildTerminal,
  console:  buildTerminal,  // alias
}

// ── Interactable class ───────────────────────────────────────
export class Interactable {
  id: string
  group: THREE.Group
  hint: string
  holdTime: number
  requireMask: boolean
  once: boolean
  used = false
  actions: ActionDef[]
  range: number
  enabled: boolean
  private _activePart: THREE.Object3D | null = null

  constructor(scene: THREE.Scene, data: InteractableDef) {
    this.id          = data.id
    this.hint        = data.hint ?? '[F] Interact'
    this.holdTime    = data.holdTime ?? 0
    this.requireMask = data.requireMask ?? false
    this.once        = data.once ?? false
    this.actions     = data.actions ?? []
    this.range       = data.range ?? 2.0
    this.enabled     = data.enabled !== false  // default true

    // Build mesh
    this.group = new THREE.Group()
    this.group.position.set(data.x, data.y ?? 0, data.z)
    if (data.rotY) this.group.rotation.y = data.rotY

    const builder = MESH_BUILDERS[data.mesh]
    if (builder) {
      this._activePart = builder(this.group)
    } else {
      // Fallback: small glowing cube
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.3, 0.3),
        new THREE.MeshLambertMaterial({ color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 0.5}),
      )
      cube.position.set(0, 0.8, 0)
      this.group.add(cube)
      this._activePart = cube
    }

    scene.add(this.group)
  }

  isNear(playerPos: THREE.Vector3): boolean {
    return playerPos.distanceTo(this.group.position) < this.range
  }

  /** Visual feedback on activation */
  activate() {
    if (this._activePart) {
      // Flash emissive briefly
      const mat = (this._activePart as THREE.Mesh).material as THREE.MeshLambertMaterial
      if (mat?.emissive) {
        const orig = mat.emissiveIntensity
        mat.emissiveIntensity = 2.0
        setTimeout(() => { mat.emissiveIntensity = orig }, 200)
      }
    }
    if (this.once) {
      this.used = true
      this._greyOut()
    }
  }

  private _greyOut() {
    this.group.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const m = (child as THREE.Mesh).material as THREE.MeshLambertMaterial
        if (m) {
          m.color.set(0x444444)
          m.emissive?.set(0x000000)
          m.emissiveIntensity = 0
        }
      }
    })
  }
}
