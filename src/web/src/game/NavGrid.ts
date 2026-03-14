import * as THREE from 'three'

/**
 * Hybrid BFS + Ant-Pheromone flow field for enemy pathfinding.
 *
 * 1. Static walkability grid built from wall boxes (doors forced open).
 * 2. BFS from player → shortest-path distance field.
 * 3. Pheromone layer: enemies deposit scent where they walk;
 *    scent diffuses through free cells and evaporates over time.
 * 4. getDir() blends BFS gradient + pheromone gradient →
 *    enemies follow proven ant-trails through doors while
 *    BFS guarantees they always head toward the player.
 */

const CELL = 1          // metres per cell
const INF  = 0x7fffffff

// Pheromone constants
const PHER_DEPOSIT  = 5.0   // amount deposited per enemy per tick
const PHER_EVAP     = 0.92  // evaporation multiplier per update (~8% decay)
const PHER_DIFFUSE  = 0.15  // fraction that spreads to neighbors
const PHER_WEIGHT   = 0.35  // blend weight vs BFS (0 = pure BFS, 1 = pure pheromone)

const _dirResult = new THREE.Vector3()

export class NavGrid {
  grid: Uint8Array       // 0 = free, 1 = blocked
  dist: Int32Array       // BFS distance from target
  pher: Float32Array     // pheromone intensity per cell
  private _pherBuf: Float32Array // double-buffer for diffusion
  w = 0
  h = 0
  ox = 0
  oz = 0
  private _q: Int32Array
  private _built = false

  /** Build the static walkability grid. */
  build(wallBoxes: THREE.Box3[], doorPositions: THREE.Vector3[]) {
    let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity
    for (const b of wallBoxes) {
      if (b.min.x < minX) minX = b.min.x
      if (b.min.z < minZ) minZ = b.min.z
      if (b.max.x > maxX) maxX = b.max.x
      if (b.max.z > maxZ) maxZ = b.max.z
    }
    minX -= 30; minZ -= 30; maxX += 30; maxZ += 30

    this.ox = Math.floor(minX / CELL)
    this.oz = Math.floor(minZ / CELL)
    this.w  = Math.ceil(maxX / CELL) - this.ox + 1
    this.h  = Math.ceil(maxZ / CELL) - this.oz + 1

    const n = this.w * this.h
    this.grid     = new Uint8Array(n)
    this.dist     = new Int32Array(n)
    this.pher     = new Float32Array(n)
    this._pherBuf = new Float32Array(n)
    this._q       = new Int32Array(n * 2)

    // Mark cells blocked by walls (inflate by ~0.25m for enemy clearance)
    const pad = 0.25
    for (const b of wallBoxes) {
      const x0 = Math.floor((b.min.x - pad) / CELL) - this.ox
      const z0 = Math.floor((b.min.z - pad) / CELL) - this.oz
      const x1 = Math.ceil ((b.max.x + pad) / CELL) - this.ox
      const z1 = Math.ceil ((b.max.z + pad) / CELL) - this.oz
      for (let z = Math.max(0, z0); z <= Math.min(this.h - 1, z1); z++) {
        for (let x = Math.max(0, x0); x <= Math.min(this.w - 1, x1); x++) {
          this.grid[z * this.w + x] = 1
        }
      }
    }

    // Force-clear a cross around each door (±3 cells in both axes)
    // to guarantee the BFS can flow through the opening
    for (const dp of doorPositions) {
      const gx = Math.round(dp.x / CELL) - this.ox
      const gz = Math.round(dp.z / CELL) - this.oz
      for (let d = -3; d <= 3; d++) {
        // horizontal line
        const hx = gx + d
        if (hx >= 0 && hx < this.w && gz >= 0 && gz < this.h) this.grid[gz * this.w + hx] = 0
        // vertical line
        const vz = gz + d
        if (gx >= 0 && gx < this.w && vz >= 0 && vz < this.h) this.grid[vz * this.w + gx] = 0
      }
      // also a 3×3 block for good measure
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          const x = gx + dx, z = gz + dz
          if (x >= 0 && x < this.w && z >= 0 && z < this.h) this.grid[z * this.w + x] = 0
        }
      }
    }

    this._built = true
    const free = this.grid.reduce((s, v) => s + (v === 0 ? 1 : 0), 0)
    console.log(`[NavGrid] ${this.w}x${this.h} = ${n} cells | ${free} free | ${n - free} blocked | ${doorPositions.length} doors`)
  }

  // ── BFS from player position ───────────────────────────────
  update(targetPos: THREE.Vector3) {
    if (!this._built) return
    this.dist.fill(INF)

    const tx = Math.round(targetPos.x / CELL) - this.ox
    const tz = Math.round(targetPos.z / CELL) - this.oz
    if (tx < 0 || tx >= this.w || tz < 0 || tz >= this.h) return

    // Seed: mark target cell + 3×3 around it (in case player is near wall)
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const sx = tx + dx, sz = tz + dz
        if (sx >= 0 && sx < this.w && sz >= 0 && sz < this.h) {
          this.dist[sz * this.w + sx] = 0
        }
      }
    }

    const q = this._q
    q[0] = tx; q[1] = tz
    let head = 0, tail = 2

    while (head < tail) {
      const cx = q[head++]
      const cz = q[head++]
      const nd = this.dist[cz * this.w + cx] + 1

      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dz === 0) continue
          const nx = cx + dx, nz = cz + dz
          if (nx < 0 || nx >= this.w || nz < 0 || nz >= this.h) continue
          const ni = nz * this.w + nx
          if (this.grid[ni] === 1) continue
          if (nd < this.dist[ni]) {
            this.dist[ni] = nd
            q[tail++] = nx
            q[tail++] = nz
          }
        }
      }
    }

    // ── Pheromone: evaporate + diffuse ─────────────────────────
    const { pher, _pherBuf: buf, grid, w, h } = this
    // Evaporate
    for (let i = 0; i < pher.length; i++) pher[i] *= PHER_EVAP

    // Diffuse: each free cell shares some pheromone with free neighbors
    buf.set(pher)
    for (let z = 1; z < h - 1; z++) {
      for (let x = 1; x < w - 1; x++) {
        const i = z * w + x
        if (grid[i] === 1) continue
        let sum = 0, cnt = 0
        for (let dz = -1; dz <= 1; dz++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dz === 0) continue
            const ni = (z + dz) * w + (x + dx)
            if (grid[ni] === 0) { sum += pher[ni]; cnt++ }
          }
        }
        if (cnt > 0) {
          const avg = sum / cnt
          buf[i] = pher[i] * (1 - PHER_DIFFUSE) + avg * PHER_DIFFUSE
        }
      }
    }
    this.pher = buf
    this._pherBuf = pher // swap buffers
  }

  // ── Enemy deposits pheromone at its position ─────────────────
  deposit(pos: THREE.Vector3) {
    if (!this._built) return
    const gx = Math.round(pos.x / CELL) - this.ox
    const gz = Math.round(pos.z / CELL) - this.oz
    if (gx < 0 || gx >= this.w || gz < 0 || gz >= this.h) return
    this.pher[gz * this.w + gx] += PHER_DEPOSIT
  }

  // ── Get movement direction (BFS gradient + pheromone gradient) ──
  getDir(pos: THREE.Vector3): THREE.Vector3 | null {
    if (!this._built) return null
    const gx = Math.round(pos.x / CELL) - this.ox
    const gz = Math.round(pos.z / CELL) - this.oz
    if (gx < 2 || gx >= this.w - 2 || gz < 2 || gz >= this.h - 2) return null

    const myDist = this.dist[gz * this.w + gx]
    if (myDist === 0) return null

    // Search radius: wider if in blocked/unreachable cell
    const R = myDist === INF ? 3 : 1

    // Find BFS gradient (toward lower distance)
    let bfsDx = 0, bfsDz = 0, bestBfs = INF
    // Find pheromone gradient (toward higher pheromone)
    let phDx = 0, phDz = 0, bestPh = -1

    for (let dz = -R; dz <= R; dz++) {
      for (let dx = -R; dx <= R; dx++) {
        if (dx === 0 && dz === 0) continue
        const nx = gx + dx, nz = gz + dz
        if (nx < 0 || nx >= this.w || nz < 0 || nz >= this.h) continue
        const ni = nz * this.w + nx

        const d = this.dist[ni]
        if (d < bestBfs) { bestBfs = d; bfsDx = dx; bfsDz = dz }

        const p = this.pher[ni]
        // Only follow pheromone if the cell is also closer to target (no backtracking)
        if (p > bestPh && d < myDist + 2) { bestPh = p; phDx = dx; phDz = dz }
      }
    }

    if (bfsDx === 0 && bfsDz === 0) return null
    if (myDist !== INF && bestBfs >= myDist) return null

    // Normalize both directions
    const bfsLen = Math.sqrt(bfsDx * bfsDx + bfsDz * bfsDz) || 1
    const phLen  = Math.sqrt(phDx * phDx + phDz * phDz) || 1

    // Blend: (1-w)*BFS + w*Pheromone
    const pw = bestPh > 0.5 ? PHER_WEIGHT : 0 // only blend if there's actual pheromone
    const rx = (1 - pw) * (bfsDx / bfsLen) + pw * (phDx / phLen)
    const rz = (1 - pw) * (bfsDz / bfsLen) + pw * (phDz / phLen)
    const rLen = Math.sqrt(rx * rx + rz * rz) || 1

    _dirResult.set(rx / rLen, 0, rz / rLen)
    return _dirResult
  }

  isReachable(pos: THREE.Vector3): boolean {
    if (!this._built) return false
    const gx = Math.round(pos.x / CELL) - this.ox
    const gz = Math.round(pos.z / CELL) - this.oz
    if (gx < 0 || gx >= this.w || gz < 0 || gz >= this.h) return false
    return this.dist[gz * this.w + gx] < INF
  }
}
