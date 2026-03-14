import * as THREE from 'three'

export function addEscapeDisc(scene, x, z, radius = 2.5) {
  const geo = new THREE.CylinderGeometry(radius, radius, 0.06, 32)
  const mat = new THREE.MeshBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.4 })
  const disc = new THREE.Mesh(geo, mat)
  disc.position.set(x, 0.01, z)
  scene.add(disc)

  // Drop-zone ring — visible when carrying bag/drill
  const ringGeo = new THREE.RingGeometry(radius - 0.15, radius + 0.15, 48)
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0, side: THREE.DoubleSide })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.rotation.x = -Math.PI / 2
  ring.position.set(x, 0.03, z)
  ring.visible = false
  scene.add(ring)

  let _dropMode = false

  return {
    disc,
    setActive(active) {
      if (_dropMode) return  // drop highlight overrides escape highlight
      mat.color.set(active ? 0x44ff44 : 0x444444)
      mat.opacity = active ? 0.65 : 0.35
    },
    setDropHighlight(on) {
      _dropMode = on
      ring.visible = on
      if (on) {
        mat.color.set(0xff8800)
        mat.opacity = 0.25
      } else {
        mat.color.set(0x444444)
        mat.opacity = 0.35
      }
    },
    updateRing(time) {
      if (!ring.visible) return
      ringMat.opacity = 0.35 + Math.sin(time * 4) * 0.2
    },
  }
}
