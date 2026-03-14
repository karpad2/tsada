import * as THREE from 'three'
import { bx, limbPivot } from './EnemyTypes.ts'
import { buildWeaponModel } from '../weapons/WeaponModels.ts'

/**
 * Builds the full 3D character model for an enemy and adds it to `group`.
 * Returns refs to animated parts and hitboxes used by the Enemy class.
 *
 * @param {THREE.Group} group  — the enemy's root group (already positioned)
 * @param {object}      cfg    — entry from ENEMY_TYPES
 * @param {object}      self   — the Enemy instance (receives _legL/R, _armL/R, _hbFill, _minigunBarrels, hitboxes)
 */
export function buildMesh(group, cfg, self) {
  const skin   = new THREE.MeshLambertMaterial({ color: 0xffcc99})
  const shirt  = new THREE.MeshLambertMaterial({ color: cfg.shirt})
  const pants  = new THREE.MeshLambertMaterial({ color: cfg.pants})
  const black  = new THREE.MeshLambertMaterial({ color: 0x111111})
  const white  = new THREE.MeshLambertMaterial({ color: 0xeeeeee})
  const gunMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1e})

  const HIP = 0.62
  self._legL = limbPivot(0.36, 0.60, 0.36, pants, -0.21, HIP,  0)
  self._legR = limbPivot(0.36, 0.60, 0.36, pants,  0.21, HIP,  0)
  group.add(self._legL, self._legR)

  const torso = bx(0.82, 0.64, 0.40, shirt, 0, HIP + 0.32, 0)
  group.add(torso)

  // Tier-specific armor overlay
  if (cfg.tier === 'medium') {
    group.add(
      bx(0.86, 0.62, 0.44, new THREE.MeshLambertMaterial({ color: 0x111a2a}), 0, HIP + 0.32, 0),
    )
  } else if (cfg.tier === 'heavy') {
    group.add(
      bx(0.94, 0.68, 0.46, new THREE.MeshLambertMaterial({ color: 0x222222}), 0, HIP + 0.32, 0),
      bx(0.16, 0.18, 0.36, new THREE.MeshLambertMaterial({ color: 0x1a1a1a}), -0.54, HIP + 0.57, 0),
      bx(0.16, 0.18, 0.36, new THREE.MeshLambertMaterial({ color: 0x1a1a1a}),  0.54, HIP + 0.57, 0),
    )
  }

  const SH = HIP + 0.60
  self._armL = limbPivot(0.28, 0.58, 0.30, shirt, -0.57, SH, 0)
  self._armR = limbPivot(0.28, 0.58, 0.30, shirt,  0.57, SH, 0)
  group.add(self._armL, self._armR)

  const HEAD_Y = SH + 0.38
  const head   = bx(0.68, 0.60, 0.60,
    (cfg.tier === 'guard' || cfg.tier === 'light') ? skin : new THREE.MeshLambertMaterial({ color: 0xffcc99}),
    0, HEAD_Y, 0)
  group.add(head)

  // Helmet for medium (SWAT visor) / heavy (armored visor)
  if (cfg.tier === 'medium') {
    group.add(
      bx(0.74, 0.28, 0.66, new THREE.MeshLambertMaterial({ color: 0x111a2a}), 0, HEAD_Y + 0.24, 0),
      bx(0.68, 0.14, 0.04, new THREE.MeshLambertMaterial({ color: 0x2244aa, transparent: true, opacity: 0.7}), 0, HEAD_Y + 0.08, 0.34),
    )
  } else if (cfg.tier === 'heavy') {
    group.add(
      bx(0.82, 0.38, 0.74, new THREE.MeshLambertMaterial({ color: 0x1a1a1a}), 0, HEAD_Y + 0.20, 0),
      bx(0.72, 0.18, 0.04, new THREE.MeshLambertMaterial({ color: 0xff4400, transparent: true, opacity: 0.6}), 0, HEAD_Y + 0.04, 0.38),
    )
  }

  // Eyes for guard and light cops
  const EYE_Z = 0.31
  const EYE_Y = HEAD_Y + 0.06
  if (cfg.tier === 'guard' || cfg.tier === 'light') {
    group.add(
      bx(0.13, 0.11, 0.04, black, -0.16, EYE_Y, EYE_Z),
      bx(0.13, 0.11, 0.04, black,  0.16, EYE_Y, EYE_Z),
      bx(0.28, 0.05, 0.04, black,  0.00, HEAD_Y - 0.10, EYE_Z),
    )
  }

  // Hat for light cops; brim for guards
  if (cfg.hat) {
    const hatMat = new THREE.MeshLambertMaterial({ color: 0x223366})
    const badge  = new THREE.MeshLambertMaterial({ color: 0xddbb00})
    group.add(
      bx(0.84, 0.08, 0.74, hatMat, 0, HEAD_Y + 0.34, 0),
      bx(0.58, 0.22, 0.54, hatMat, 0, HEAD_Y + 0.50, 0),
      bx(0.60, 0.05, 0.56, white,  0, HEAD_Y + 0.36, 0),
      bx(0.12, 0.14, 0.06, badge,  0, HEAD_Y + 0.05, EYE_Z),
    )
  } else if (cfg.tier === 'guard') {
    group.add(bx(0.66, 0.20, 0.58, pants, 0, HEAD_Y + 0.38, 0))
  }

  buildWeapon(self._armR, cfg.weapon, gunMat, self)

  // Shield mesh (front-facing riot shield)
  if (cfg.hasShield) {
    const shieldMat = new THREE.MeshLambertMaterial({ color: 0x222244, transparent: true, opacity: 0.6 })
    const shieldMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.06), shieldMat)
    shieldMesh.position.set(0, HIP + 0.30, 0.40)
    shieldMesh.castShadow = true
    group.add(shieldMesh)
    // Shield frame
    const frameMat = new THREE.MeshLambertMaterial({ color: 0x111111 })
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.06, 0.08), frameMat)
    frameTop.position.set(0, 0.55, 0); shieldMesh.add(frameTop)
    const frameBot = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.06, 0.08), frameMat)
    frameBot.position.set(0, -0.55, 0); shieldMesh.add(frameBot)
    const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.08), frameMat)
    frameL.position.set(-0.45, 0, 0); shieldMesh.add(frameL)
    const frameR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.08), frameMat)
    frameR.position.set(0.45, 0, 0); shieldMesh.add(frameR)
    // Viewport slit
    const slitMat = new THREE.MeshLambertMaterial({ color: 0x5566aa, transparent: true, opacity: 0.8 })
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.02), slitMat)
    slit.position.set(0, 0.30, 0.04); shieldMesh.add(slit)
    shieldMesh.userData.enemy = self
    shieldMesh.userData.isShield = true
    self._shieldMesh = shieldMesh
    self.hitboxes.push = self.hitboxes.push  // keep reference for later
  }

  // Health bar removed
  self._hbFill = null

  torso.userData.enemy = self
  head.userData.enemy  = self
  head.userData.isHead = true
  self.hitboxes = [torso, head]
  if (cfg.hasShield && self._shieldMesh) {
    self.hitboxes.push(self._shieldMesh)
  }
}

/**
 * Builds the weapon geometry attached to `armR` pivot.
 * Uses shared WeaponModels for pistol/smg/shotgun/sniper/suppressed.
 * Keeps enemy-only weapons (baton/lmg/minigun/heavyShotgun) local.
 * Sets `self._minigunBarrels` if weapon is 'minigun'.
 */
export function buildWeapon(armR, type, gunMat, self) {
  const SCALE  = 0.75
  const POS_Y  = -0.54
  const POS_Z  = -0.14

  // Try shared model first (pistol, smg, shotgun, sniper, suppressed, rifle)
  const model = buildWeaponModel(type)
  if (model) {
    model.scale.setScalar(SCALE)
    model.position.set(0, POS_Y, POS_Z)
    armR.add(model)
    return
  }

  // Enemy-only weapons
  const add = m => armR.add(m)
  switch (type) {
    case 'taser_gun': {
      const taserBody = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.08, 0.24), new THREE.MeshLambertMaterial({ color: 0xcccc22 }))
      taserBody.position.set(0, -0.52, -0.16); taserBody.castShadow = true; add(taserBody)
      const taserGrip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.08), new THREE.MeshLambertMaterial({ color: 0x111111 }))
      taserGrip.position.set(0, -0.62, -0.10); add(taserGrip)
      // Prongs
      for (const ox of [-0.03, 0.03]) {
        const prong = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.008, 0.08, 4), new THREE.MeshLambertMaterial({ color: 0xaaaaaa }))
        prong.rotation.x = Math.PI / 2; prong.position.set(ox, -0.52, -0.30); add(prong)
      }
      break
    }
    case 'baton': {
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.46, 6), new THREE.MeshLambertMaterial({ color: 0x1a1a1a }))
      handle.position.set(0, -0.52, -0.08); add(handle)
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.16, 6), new THREE.MeshLambertMaterial({ color: 0x222222 }))
      tip.position.set(0, -0.30, -0.09); add(tip)
      break
    }
    case 'lmg': {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.50), gunMat.clone())
      body.position.set(0, -0.52, -0.20); body.castShadow = true; add(body)
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.07, 12), gunMat.clone())
      drum.position.set(0, -0.63, -0.18); add(drum)
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.30, 6), gunMat.clone())
      barrel.rotation.x = Math.PI / 2; barrel.position.set(0, -0.51, -0.52); add(barrel)
      break
    }
    case 'minigun': {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.40), gunMat.clone())
      body.position.set(0, -0.52, -0.18); body.castShadow = true; add(body)
      self._minigunBarrels = new THREE.Group()
      self._minigunBarrels.position.set(0, -0.51, -0.46)
      for (let b = 0; b < 6; b++) {
        const ang = (b / 6) * Math.PI * 2
        const bm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.30, 4), gunMat.clone())
        bm.rotation.x = Math.PI / 2
        bm.position.set(Math.sin(ang) * 0.07, Math.cos(ang) * 0.07, 0)
        self._minigunBarrels.add(bm)
      }
      add(self._minigunBarrels)
      break
    }
    case 'heavyShotgun': {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.38), gunMat.clone())
      body.position.set(0, -0.52, -0.16); body.castShadow = true; add(body)
      for (const ox of [-0.04, 0.04]) {
        const bl = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.26, 6), gunMat.clone())
        bl.rotation.x = Math.PI / 2; bl.position.set(ox, -0.50, -0.42); add(bl)
      }
      break
    }
    default: {
      // Fallback: use rifle model
      const fallback = buildWeaponModel('rifle')!
      fallback.scale.setScalar(SCALE)
      fallback.position.set(0, POS_Y, POS_Z)
      armR.add(fallback)
    }
  }
}
