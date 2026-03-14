// ─────────────────────────────────────────────────────────────
// PlayerPhysics — movement, collision, jump, crouch
// ─────────────────────────────────────────────────────────────
import * as THREE from 'three'
import { state } from '../state.ts'
import {
  PLAYER_RADIUS, STAND_HEIGHT, CROUCH_HEIGHT,
  WALK_SPEED, SPRINT_SPEED, CROUCH_SPEED, JUMP_VEL, GRAVITY,
} from './constants.ts'

export function createPlayerPhysics(ctx) {
  const { wallBoxes, playerStart, sprintMult, orient } = ctx

  const playerPos = new THREE.Vector3(playerStart.x, 0, playerStart.z)
  let velY        = 0
  let onGround    = true
  let isCrouching = false

  function eyeH() { return isCrouching ? CROUCH_HEIGHT : STAND_HEIGHT }

  function canMoveXZ(x, z) {
    const y   = playerPos.y
    const box = new THREE.Box3(
      new THREE.Vector3(x - PLAYER_RADIUS, y,            z - PLAYER_RADIUS),
      new THREE.Vector3(x + PLAYER_RADIUS, y + STAND_HEIGHT, z + PLAYER_RADIUS),
    )
    return !wallBoxes.some(b => b.intersectsBox(box))
  }

  function tryMoveXZ(nx, nz) {
    if (canMoveXZ(nx, nz))           { playerPos.x = nx; playerPos.z = nz; return }
    if (canMoveXZ(nx, playerPos.z))  { playerPos.x = nx; return }
    if (canMoveXZ(playerPos.x, nz))  { playerPos.z = nz }
  }

  function tick(delta, keys, justDn) {
    // Crouch toggle
    if (justDn['KeyC'] || justDn['ControlLeft'] || justDn['ControlRight']) isCrouching = !isCrouching

    // Vertical physics (gravity + jump)
    if (!onGround) velY -= GRAVITY * delta
    playerPos.y += velY * delta
    if (playerPos.y <= 0) { playerPos.y = 0; if (velY < 0) velY = 0; onGround = true }
    else onGround = false

    if (justDn['Space'] && onGround && !isCrouching) { velY = JUMP_VEL; onGround = false }

    // Lateral movement
    const { yaw } = orient
    const sprint  = (keys['ShiftLeft'] || keys['ShiftRight']) && !isCrouching && onGround
    let speed     = isCrouching ? CROUCH_SPEED : sprint ? SPRINT_SPEED * sprintMult : WALK_SPEED
    if (state.isADS && state.weaponStats?.slowADS) speed *= 0.6
    const fwdV    = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw))
    const rgtV    = new THREE.Vector3( Math.cos(yaw), 0, -Math.sin(yaw))
    const dir     = new THREE.Vector3()
    if (keys['KeyW']) dir.add(fwdV); if (keys['KeyS']) dir.sub(fwdV)
    if (keys['KeyA']) dir.sub(rgtV); if (keys['KeyD']) dir.add(rgtV)
    if (dir.length() > 0) {
      dir.normalize()
      tryMoveXZ(playerPos.x + dir.x * speed * delta, playerPos.z + dir.z * speed * delta)
    }
  }

  return {
    playerPos,
    eyeH,
    get velY()        { return velY },
    set velY(v)       { velY = v },
    get onGround()    { return onGround },
    get isCrouching() { return isCrouching },
    tick,
  }
}
