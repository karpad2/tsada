// ── Visual Effects helpers ────────────────────────────────────
// Reusable Three.js VFX: muzzle flash, blood splat, smoke, sparks.
// Import and call from Engine.js or any game system.

import * as THREE from 'three'

/**
 * Spawn a quick muzzle flash light at `pos` in `scene`.
 * Auto-removes after one frame.
 */
export function spawnMuzzleFlash(scene, pos) {
  const light = new THREE.PointLight(0xffdd88, 3.5, 3.5)
  light.position.copy(pos)
  scene.add(light)
  setTimeout(() => scene.remove(light), 40)
}

/**
 * Spawn debris/impact puff particles at `pos`.
 * `physChunks` is the Engine's particle array.
 */
export function spawnImpactPuff(scene, pos, physChunks, color = 0xaa8866, count = 5) {
  for (let i = 0; i < count; i++) {
    const geo  = new THREE.SphereGeometry(0.04 + Math.random() * 0.04, 5, 5)
    const mat  = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.copy(pos)
    scene.add(mesh)
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 3, Math.random() * 2 + 0.5, (Math.random() - 0.5) * 3,
    )
    physChunks.push({ mesh, vel, rotVel: new THREE.Vector3(), timer: 0.5 + Math.random() * 0.3 })
  }
}

/**
 * Explosion sphere + point light at `pos`, auto-fades.
 */
export function spawnExplosion(scene, pos, radius = 6) {
  const fl = new THREE.PointLight(0xff8800, 10, radius * 2.5)
  fl.position.copy(pos); scene.add(fl)
  setTimeout(() => scene.remove(fl), 200)

  const geo  = new THREE.SphereGeometry(1, 14, 14)
  const mat  = new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.88 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.copy(pos); scene.add(mesh)

  let t = 0
  const anim = () => {
    t += 0.018
    mesh.scale.setScalar(1 + t * radius * 1.8)
    mat.opacity = Math.max(0, 0.88 - t * 2.2)
    if (t < 0.45) requestAnimationFrame(anim)
    else { scene.remove(mesh); geo.dispose(); mat.dispose() }
  }
  requestAnimationFrame(anim)
}
