// ─────────────────────────────────────────────────────────────
// MAP 18 — CAMP IRON RIDGE — MILITARY DEPOT
// Guarded compound with barracks and an armory. Non-stop police.
// Difficulty ★★★★  |  4 objectives
// ─────────────────────────────────────────────────────────────
export default {
  id:          'military',
  name:        'CAMP IRON RIDGE',
  desc:        'Military depot. Four crates. Every guard is military.',
  difficulty:  4,
  vehicle:     'truck',
  bagColor:    0x2a3a1a,
  playerStart: [0, 15],

  lights: [
    [-12, 4, -2], [12, 4, -2],
    [-12, 4, -14], [12, 4, -14],
  ],

  floors: [
    { x: 0,   z: -4,  w: 38, d: 32, tex: 'floor_asphalt' },
    // Barracks building
    { x: -12, z: -10, w: 12, d: 12, color: 0x5a5040       },
    // Armory building
    { x:  12, z: -10, w: 12, d: 12, color: 0x4a4a40       },
  ],

  walls: [
    // Compound perimeter fence
    { x: -19, z: -4,  w: 0.4, d: 32, h: 2.5, color: 0x607060, breachable: true },
    { x:  19, z: -4,  w: 0.4, d: 32, h: 2.5, color: 0x607060, breachable: true },
    { x:   0, z: -20, w: 38,  d: 0.4, h: 2.5, color: 0x607060, breachable: true },
    { x: -12, z: 12,  w: 14,  d: 0.4, h: 2.5, color: 0x607060 },
    { x:  12, z: 12,  w: 14,  d: 0.4, h: 2.5, color: 0x607060 },
    // Barracks building walls
    { x: -18, z:-10,  w: 0.4, d: 12, color: 0x5a5040, tex: 'wall_concrete' },
    { x:  -6, z:-10,  w: 0.4, d: 12, color: 0x5a5040, tex: 'wall_concrete' },
    { x: -12, z: -4,  w: 12,  d: 0.4, color: 0x5a5040 },
    { x: -12, z:-16,  w: 12,  d: 0.4, color: 0x5a5040 },
    { x: -12, z: -4,  w: 6.4, d: 0.4, y: 2, h: 2 },
    // Armory building walls
    { x:   6, z:-10,  w: 0.4, d: 12, color: 0x4a4a40, tex: 'wall_concrete' },
    { x:  18, z:-10,  w: 0.4, d: 12, color: 0x4a4a40, tex: 'wall_concrete' },
    { x:  12, z: -4,  w: 12,  d: 0.4, color: 0x4a4a40 },
    { x:  12, z:-16,  w: 12,  d: 0.4, color: 0x4a4a40 },
    { x:  12, z: -4,  w: 6.4, d: 0.4, y: 2, h: 2 },
    // Guard posts
    { x: -6,  z:  0,  w: 0.4, h: 3.0, d: 0.4, color: 0x607060 },
    { x:  6,  z:  0,  w: 0.4, h: 3.0, d: 0.4, color: 0x607060 },
  ],

  props: [
    // Courtyard cover
    { x: -3, z:  6, w: 2.0, h: 1.0, d: 2.0, color: 0x4a5a40, hp: 80 },
    { x:  3, z:  6, w: 2.0, h: 1.0, d: 2.0, color: 0x4a5a40, hp: 80 },
    { x: 0,  z: -2, w: 2.0, h: 1.0, d: 2.0, color: 0x4a5a40, hp: 80 },
    // Barracks
    { type: 'locker', x: -16, z: -6  },
    { type: 'locker', x: -14, z: -6  },
    { type: 'workbench', x: -14, z: -14 },
    // Armory
    { type: 'workbench', x:  8,  z: -6 },
    { type: 'workbench', x: 16,  z: -6 },
    { type: 'crate', x: 10, z: -14, size: 1.4 },
    { type: 'crate', x: 14, z: -14, size: 1.4 },
  ],


  zones: [
    { type: 'public',  x:   0, z:  5,  w: 38, d: 18, label: 'COMPOUND' },
    { type: 'private', x: -12, z: -10, w: 12, d: 12, label: 'ARMOURY'   },
    { type: 'secure',  x:  12, z: -10, w: 12, d: 12, label: 'DEPOT'     },
  ],
  doors: [
    { x: -12, z: -4, angle: 0, type: 'secure', w: 1.2 },
    { x:  12, z: -4, angle: 0, type: 'secure', w: 1.2 },
  ],
  civilianTheme: 'military',
  objectives:   [[-12, -7], [-12, -14], [10, -14.5], [14, -14.5]],
  escape:        [0, 19, 2.5],
  exfilZones:   [[-28, -2], [28, -2], [0, 26], [0, -26]],
  spawnPoints:  [
    [-21, -8], [21, -8], [-21, 4], [21, 4],
    [-14, -18], [14, -18], [0, -18],
  ],
  patrolRoutes: [
    [[-17, 0], [17, 0]],
    [[-17, -12], [-8, -12]],
    [[8, -12], [17, -12]],
  ],

  cameras: [
    { x: 0,   y: 3.2, z: 11,  angle: Math.PI },
    { x: -17, y: 2.8, z: -10, angle: Math.PI * 0.5, range: 8 },
    { x: 17,  y: 2.8, z: -10, angle: -Math.PI * 0.5, range: 8 },
  ],

  interactables: [
    {
      id: 'sec_cameras', mesh: 'terminal', x: -6, z: 1, rotY: 0,
      hint: '[F] Disable cameras', requireMask: true, once: true,
      actions: [
        { type: 'message', text: 'Security cameras disabled!', color: '#44ff88' },
        { type: 'sound', sound: 'pickup' },
      ],
    },
    {
      id: 'gate_control', mesh: 'lever', x: 6, z: 1, rotY: 0,
      hint: '[F] Open depot gate',
      actions: [
        { type: 'openDoor', doorIndex: 1 },
        { type: 'message', text: 'Depot gate opened!', color: '#ffdd44' },
        { type: 'sound', sound: 'doorOpen' },
      ],
    },
  ],
}
