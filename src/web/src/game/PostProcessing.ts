import * as THREE from 'three'
import { EffectComposer }   from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass }       from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass }  from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass }       from 'three/addons/postprocessing/OutputPass.js'
import { Pass } from 'three/addons/postprocessing/Pass.js'

// ── Weapon overlay pass ─────────────────────────────────────────
class WeaponOverlayPass extends Pass {
  weaponView: any
  enabled = true
  needsSwap = false

  constructor(weaponView: any) {
    super()
    this.weaponView = weaponView
  }

  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {
    if (!this.enabled || !this.weaponView) return
    // Render weapon onto readBuffer (where the main scene lives after RenderPass swap)
    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer)
    renderer.clearDepth()
    renderer.render(this.weaponView._scene, this.weaponView._camera)
  }
}

// ── Lightweight post-processing: bloom only ─────────────────────
export function createPostProcessing(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  weaponView: any,
) {
  const w = window.innerWidth
  const h = window.innerHeight

  const composer = new EffectComposer(renderer)

  // 1. Render main scene
  composer.addPass(new RenderPass(scene, camera))

  // 2. Weapon overlay (drawn between scene and bloom)
  const weaponPass = new WeaponOverlayPass(weaponView)
  weaponPass.enabled = false
  composer.addPass(weaponPass)

  // 3. Bloom at half res — emissive glow (screens, LEDs, muzzle flash)
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(w >> 1, h >> 1),
    0.4,    // strength
    0.4,    // radius
    0.8,    // threshold — only bright emissives bloom
  )
  composer.addPass(bloomPass)

  // 4. Output — tone mapping + color space
  composer.addPass(new OutputPass())

  return {
    weaponPass,

    setWeaponEnabled(on: boolean) {
      weaponPass.enabled = on
    },

    resize(w: number, h: number) {
      composer.setSize(w, h)
      bloomPass.resolution.set(w >> 1, h >> 1)
    },

    render() {
      composer.render()
    },

    dispose() {
      composer.dispose()
    },
  }
}
