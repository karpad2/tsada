import * as THREE from 'three'
import { Enemy, ENEMY_TYPES }  from './Enemy.ts'
import { DroneEnemy }          from './DroneEnemy.ts'
import { state }               from './state.ts'
import { findClearSpawn }      from './spawnUtils.ts'

// ── Enemy type pool ──────────────────────────────────────────
// [ type, baseWeight, waveBonus ]
// Light: fast/low HP  |  Medium: player-tier  |  Heavy: tank
const _TYPE_POOL = [
  ['cop_smg',         15, 0  ],
  ['cop_pistol',      15, 0  ],
  ['cop_baton',       10, 0  ],
  ['cop_sniper',       8, 0  ],
  ['cop_suppressed',  12, 0  ],
  ['med_shotgun',      5, 0.8],
  ['med_miner',        4, 0.6],
  ['med_sentry',       3, 0.5],
  ['heavy_lmg',        1, 1.0],
  ['heavy_minigun',    1, 1.2],
  ['heavy_shotgun',    1, 0.9],
  ['heavy_molotov',    1, 0.8],
  ['hrt_smg',          2, 0.5],
  ['hrt_shotgun',      1, 0.4],
  ['hrt_shield',       0, 0.3],
  ['cop_taser',        4, 0.3],
  ['swat_shield',      2, 0.5],
  ['drone_scout',      2, 0.5],
  ['drone_bomber',     1, 0.6],
  ['fbi_drone_spec',   2, 0.4],
  ['heavy_juggernaut', 1, 0.7],
  ['k9_unit',          3, 0.3],
  ['cop_flashbang',    4, 0.2],
  ['swat_commander',   1, 0.6],
  ['medic_swat',       3, 0.4],
]

// ── HRT pool (holdout mode) ─────────────────────────────────
const _HRT_POOL = [
  ['hrt_smg',        15, 0  ],
  ['hrt_shotgun',     6, 0.8],
  ['hrt_shield',      3, 1.0],
  ['cop_smg',        10, 0  ],
  ['cop_pistol',      8, 0  ],
  ['cop_sniper',      5, 0  ],
  ['med_shotgun',     3, 0.6],
  ['heavy_lmg',       1, 0.8],
  ['heavy_minigun',   1, 1.0],
]

export function pickEnemyType(waveNum: number) {
  const pool = state.gameMode === 'holdout' ? _HRT_POOL : _TYPE_POOL
  const total = pool.reduce((s, [, base, bonus]) => s + base + bonus * waveNum, 0)
  let r = Math.random() * total
  for (const [type, base, bonus] of pool) {
    r -= base + bonus * waveNum
    if (r <= 0) return type
  }
  return state.gameMode === 'holdout' ? 'hrt_smg' : 'cop_pistol'
}

const MAX_ALIVE_ENEMIES = 45

// ── Wave intervals (seconds) ────────────────────────────────
const ANT_WAVE_INTERVAL     = 12   // anticipation: trickle every 12s
const ASSAULT_WAVE_INTERVAL = 20   // assault: big wave every 20s

export function createWaveManager({ scene, level, enemies, takeDamage, layMine, onDeploySentry, throwMolotov, onDropBomb = null, postSpawn = null }) {
  let _spawnTimer = 0           // counts up; when >= interval → spawn
  let _spawningActive = false   // true = we're in a spawning phase

  function _respawnDead() {
    let removed = 0
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (enemies[i].state === 'DEAD') {
        enemies.splice(i, 1)
        removed++
      }
    }
    return removed
  }

  function _spawnGroup(count) {
    const alive = enemies.filter(e => e.state !== 'DEAD').length
    count = Math.min(count, MAX_ALIVE_ENEMIES - alive)
    if (count <= 0) return

    const sources = level.exfilZones.length ? level.exfilZones : level.spawnPoints
    const spawned = []
    for (let i = 0; i < count; i++) {
      const sp  = sources[i % sources.length]
      const raw = sp.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 3, 0, (Math.random() - 0.5) * 3,
      ))
      const pos = findClearSpawn(raw, level.wallBoxes, level.destructibles)
      const etype = pickEnemyType(state.waveNumber)
      const cfg = ENEMY_TYPES[etype]
      const e = cfg?.isDrone
        ? new DroneEnemy(scene, pos, etype)
        : new Enemy(scene, pos, etype)
      e.onHitPlayer    = () => takeDamage(e.damage)
      e.onLayMine      = p          => layMine(p)
      e.onDeploySentry = p          => onDeploySentry(p)
      e.onThrowMolotov = (from, to) => throwMolotov(from, to)
      if (cfg?.isDrone && cfg.bombInterval && onDropBomb) {
        e.onDropBomb = (from, to) => onDropBomb(from, to)
      }
      enemies.push(e)
      state.enemiesAlive++
      spawned.push(e)
    }
    if (postSpawn) postSpawn(spawned)
  }

  /** Called by GameManager 'spawnWave' event to kick off spawning */
  function spawnWave() {
    _spawningActive = true
    _spawnTimer = 999   // trigger immediate first spawn on next tick
  }

  /** Called every frame from the game loop */
  function tick(delta: number) {
    if (!_spawningActive) return

    // ANTICIPATION: trickle spawns
    if (state.phase === 'ANTICIPATION') {
      _spawnTimer += delta
      if (_spawnTimer >= ANT_WAVE_INTERVAL) {
        _spawnTimer = 0
        const count = Math.floor(5 + state.drama * 0.15)
        _spawnGroup(count)
      }
      return
    }

    // ASSAULT: big wave spawns
    if (state.phase === 'ASSAULT') {
      _spawnTimer += delta
      if (_spawnTimer >= ASSAULT_WAVE_INTERVAL) {
        _spawnTimer = 0
        state.waveNumber++
        const respawned = _respawnDead()
        const baseCount = state.gameMode === 'holdout'
          ? Math.min(40, Math.max(12, Math.floor(10 + state.holdoutWave * 5 + state.drama * 0.3)))
          : Math.min(40, Math.max(15, Math.floor(10 + state.waveNumber * 5 + state.drama * 0.25)))
        _spawnGroup(baseCount + respawned)
      }
      return
    }

    // Any other phase: stop spawning
    _spawningActive = false
  }

  function cancelNextWave() {
    _spawningActive = false
    _spawnTimer = 0
  }

  function destroy() {
    cancelNextWave()
  }

  return { spawnWave, cancelNextWave, tick, destroy }
}
