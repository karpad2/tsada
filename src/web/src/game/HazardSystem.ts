import * as THREE from 'three'

/**
 * Manages environmental hazard zones spawned when hazardous props are destroyed:
 *   - Gas clouds  (poison DOT)
 *   - Fire pools  (larger fire, damages enemies + player)
 *   - Spark zones (electric burst + periodic shock)
 */
export function createHazardSystem({ scene, takeDamage, enemies }) {
  const gasClouds  = []
  const firePools  = []
  const sparkZones = []

  // ── Gas Cloud ──────────────────────────────────────────────
  function createGasCloud(pos) {
    const g = new THREE.Group()
    g.position.set(pos.x, 2.0, pos.z)
    const cloud = new THREE.Mesh(
      new THREE.SphereGeometry(4, 16, 12),
      new THREE.MeshBasicMaterial({
        color: 0x33ff33, transparent: true, opacity: 0.18,
        side: THREE.DoubleSide, depthWrite: false,
      }),
    )
    const light = new THREE.PointLight(0x33ff33, 2, 10)
    g.add(cloud, light)
    scene.add(g)
    gasClouds.push({ mesh: g, cloud, light, pos: pos.clone(), lifetime: 6.0, damageTimer: 0, radius: 8 })
  }

  // ── Fire Pool ──────────────────────────────────────────────
  function createFirePool(pos) {
    const g = new THREE.Group()
    g.position.set(pos.x, 0.04, pos.z)
    const inner = new THREE.Mesh(
      new THREE.CylinderGeometry(3.0, 3.5, 0.10, 16),
      new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.8 }),
    )
    const outer = new THREE.Mesh(
      new THREE.CylinderGeometry(5.0, 5.5, 0.08, 16),
      new THREE.MeshBasicMaterial({ color: 0xcc2200, transparent: true, opacity: 0.4 }),
    )
    const light = new THREE.PointLight(0xff4400, 6, 12)
    light.position.y = 1.2
    g.add(inner, outer, light)
    scene.add(g)
    firePools.push({ mesh: g, inner, outer, light, pos: pos.clone(), lifetime: 12.0, damageTimer: 0, radius: 8 })
  }

  // ── Electrical Spark Zone ──────────────────────────────────
  function createSparkZone(pos) {
    const g = new THREE.Group()
    g.position.set(pos.x, 0.05, pos.z)
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(2.0, 2.0, 0.04, 16),
      new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.5 }),
    )
    const light = new THREE.PointLight(0x4488ff, 4, 6)
    light.position.y = 0.5
    g.add(disc, light)
    scene.add(g)
    sparkZones.push({
      mesh: g, disc, light, pos: pos.clone(),
      lifetime: 8.0, damageTimer: 0, radius: 4,
      initialBurst: true,
    })
  }

  // ── Per-frame tick ─────────────────────────────────────────
  function tick(delta, playerPos) {
    const _ft = Date.now() * 0.001

    // Gas clouds
    for (let i = gasClouds.length - 1; i >= 0; i--) {
      const gc = gasClouds[i]
      gc.lifetime -= delta
      if (gc.lifetime <= 0) {
        scene.remove(gc.mesh)
        gasClouds.splice(i, 1)
        continue
      }
      const fade = Math.min(1, gc.lifetime / 1.5)
      gc.cloud.material.opacity = 0.18 * fade * (0.7 + Math.sin(_ft * 3 + i) * 0.3)
      gc.light.intensity = 2 * fade

      gc.damageTimer -= delta
      if (gc.damageTimer <= 0) {
        gc.damageTimer = 0.5
        if (playerPos.distanceTo(gc.pos) < gc.radius) takeDamage(5)
        for (const e of enemies) {
          if (e.state === 'DEAD') continue
          if (e.group.position.distanceTo(gc.pos) < gc.radius) e.takeDamage(5)
        }
      }
    }

    // Fire pools
    for (let i = firePools.length - 1; i >= 0; i--) {
      const fp = firePools[i]
      fp.lifetime -= delta
      if (fp.lifetime <= 0) {
        scene.remove(fp.mesh)
        firePools.splice(i, 1)
        continue
      }
      const fade = Math.min(1, fp.lifetime * 0.3)
      const flk = 0.5 + Math.sin(_ft * 7 + i) * 0.3 + Math.sin(_ft * 13 + i * 2.3) * 0.2
      fp.inner.material.opacity = flk * 0.9 * fade
      fp.outer.material.opacity = flk * 0.4 * fade
      fp.light.intensity = flk * 6 * fade

      fp.damageTimer -= delta
      if (fp.damageTimer <= 0) {
        fp.damageTimer = 0.5
        if (playerPos.distanceTo(fp.pos) < fp.radius) takeDamage(15)
        for (const e of enemies) {
          if (e.state === 'DEAD') continue
          if (e.group.position.distanceTo(fp.pos) < fp.radius) e.takeDamage(15)
        }
      }
    }

    // Spark zones
    for (let i = sparkZones.length - 1; i >= 0; i--) {
      const sz = sparkZones[i]
      sz.lifetime -= delta
      if (sz.lifetime <= 0) {
        scene.remove(sz.mesh)
        sparkZones.splice(i, 1)
        continue
      }
      const fade = Math.min(1, sz.lifetime / 1.5)
      const flk = Math.abs(Math.sin(_ft * 15 + i * 3.7))
      sz.disc.material.opacity = flk * 0.5 * fade
      sz.light.intensity = flk * 4 * fade

      // Initial burst: stun + damage
      if (sz.initialBurst) {
        sz.initialBurst = false
        if (playerPos.distanceTo(sz.pos) < sz.radius) takeDamage(40)
        for (const e of enemies) {
          if (e.state === 'DEAD') continue
          if (e.group.position.distanceTo(sz.pos) < sz.radius) {
            e.takeDamage(40)
            e.stun(2.0)
          }
        }
      }

      // Periodic spark damage
      sz.damageTimer -= delta
      if (sz.damageTimer <= 0) {
        sz.damageTimer = 1.0
        if (playerPos.distanceTo(sz.pos) < sz.radius) takeDamage(8)
        for (const e of enemies) {
          if (e.state === 'DEAD') continue
          if (e.group.position.distanceTo(sz.pos) < sz.radius) e.takeDamage(8)
        }
      }
    }
  }

  function destroy() {
    for (const gc of gasClouds) scene.remove(gc.mesh)
    for (const fp of firePools) scene.remove(fp.mesh)
    for (const sz of sparkZones) scene.remove(sz.mesh)
    gasClouds.length = 0
    firePools.length = 0
    sparkZones.length = 0
  }

  return { createGasCloud, createFirePool, createSparkZone, tick, destroy }
}
