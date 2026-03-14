// ─────────────────────────────────────────────────────────────
// MAP 20 — OMEGA UNDERGROUND BUNKER
// Deep tunnels + data chambers. The final job.
// Difficulty ★★★★  |  5 objectives
// ─────────────────────────────────────────────────────────────
export default {
  id:          'bunker',
  name:        'OMEGA UNDERGROUND BUNKER',
  desc:        'Five classified files. No windows. No mercy. No backup.',
  difficulty:  4,
  vehicle:     'truck',
  bagColor:    0x0a0a18,
  playerStart: [0, 11],

  lights: [
    [0, 3.2, 2], [0, 3.2, -8], [0, 3.2, -18],
    [-8, 3.2, -14], [8, 3.2, -14],
    [-8, 3.2, -22], [8, 3.2, -22],
  ],

  floors: [
    // Entry tunnel
    { x: 0,   z:  1,  w: 8, d: 10, tex: 'floor_concrete' },
    // Central hub
    { x: 0,   z: -10, w: 20, d: 10, tex: 'floor_concrete' },
    // Left data wing
    { x: -10, z: -22, w: 10, d: 14, color: 0x282838       },
    // Right data wing
    { x:  10, z: -22, w: 10, d: 14, color: 0x282838       },
    // Deep server chamber
    { x:  0,  z: -32, w: 14, d: 6,  color: 0x1a1a28       },
  ],

  walls: [
    // Entry tunnel
    { x: -4,  z:  1,  w: 0.4, d: 10, color: 0x606060, tex: 'wall_concrete' },
    { x:  4,  z:  1,  w: 0.4, d: 10, color: 0x606060, tex: 'wall_concrete' },
    { x:  0,  z:  6,  w: 8,   d: 0.4, color: 0x606060 },
    // Entry door header
    { x: -7,  z: 6,   w: 6,   d: 0.4 },
    { x:  7,  z: 6,   w: 6,   d: 0.4 },
    { x:  0,  z: 6,   w: 8,   d: 0.4, y: 2, h: 2 },
    // Central hub
    { x: -10, z:-10,  w: 0.4, d: 10, color: 0x505050, breachable: true },
    { x:  10, z:-10,  w: 0.4, d: 10, color: 0x505050, breachable: true },
    { x:   0, z: -5,  w: 20,  d: 0.4, color: 0x505050 },
    { x:   0, z:-15,  w: 20,  d: 0.4, color: 0x505050 },
    // Left wing
    { x: -15, z:-22,  w: 0.4, d: 14, color: 0x404050 },
    { x:  -5, z:-22,  w: 0.4, d: 14, color: 0x404050 },
    { x: -10, z:-16,  w: 10,  d: 0.4, y: 2, h: 2 },
    { x: -10, z:-29,  w: 10,  d: 0.4, color: 0x404050 },
    // Right wing
    { x:  15, z:-22,  w: 0.4, d: 14, color: 0x404050 },
    { x:   5, z:-22,  w: 0.4, d: 14, color: 0x404050 },
    { x:  10, z:-16,  w: 10,  d: 0.4, y: 2, h: 2 },
    { x:  10, z:-29,  w: 10,  d: 0.4, color: 0x404050 },
    // Deep chamber
    { x: -7,  z:-32,  w: 0.4, d: 6  },
    { x:  7,  z:-32,  w: 0.4, d: 6  },
    { x:  0,  z:-35,  w: 14,  d: 0.4, breachable: true },
  ],

  props: [
    // Hub guard cover
    { x: -6, z: -10, w: 1.5, h: 1.0, d: 1.5, color: 0x4a4a5a, hp: 80 },
    { x:  6, z: -10, w: 1.5, h: 1.0, d: 1.5, color: 0x4a4a5a, hp: 80 },
    { type: 'consolepod', x: 0, z: -11 },
    // Left data wing
    { type: 'server', x: -13, z: -19 },
    { type: 'server', x: -13, z: -23 },
    { type: 'server', x: -13, z: -27 },
    { type: 'server', x: -7,  z: -19 },
    { type: 'server', x: -7,  z: -23 },
    // Right data wing
    { type: 'server', x: 13, z: -19 },
    { type: 'server', x: 13, z: -23 },
    { type: 'server', x: 13, z: -27 },
    { type: 'server', x:  7, z: -23 },
    // Deep chamber
    { type: 'server', x: -4, z: -33 },
    { type: 'server', x:  0, z: -33 },
    { type: 'server', x:  4, z: -33 },
  ],


  zones: [
    { type: 'public',  x:   0, z:  3,  w:  8, d:  8, label: 'ENTRY'       },
    { type: 'private', x:   0, z: -10, w: 20, d: 10, label: 'COMMAND HUB'  },
    { type: 'secure',  x: -10, z: -22, w: 10, d: 14, label: 'DATA WING A'  },
    { type: 'secure',  x:  10, z: -22, w: 10, d: 14, label: 'DATA WING B'  },
    { type: 'secure',  x:   0, z: -32, w: 14, d:  6, label: 'SERVER CORE'  },
  ],
  doors: [
    { x: -0.6, z: -5,  angle: 0, type: 'normal', w: 1.2 },
    { x: -10.6, z: -16, angle: 0, type: 'secure', w: 1.2 },
    { x:   9.4, z: -16, angle: 0, type: 'secure', w: 1.2 },
  ],
  civilianTheme: 'warehouse',
  objectives:   [[-10, -12], [-13, -23.5], [13, -19.5], [13, -27.5], [0, -33.5]],
  escape:        [0, 9, 2.2],
  exfilZones:   [[-18, -10], [18, -10], [0, 14], [0, -44]],
  spawnPoints:  [
    [-12, -7], [12, -7],
    [-12, -14], [12, -14],
    [-12, -27], [12, -27],
    [0, -37],
  ],
  patrolRoutes: [
    [[-8, -10], [8, -10]],
    [[-13, -22], [-7, -22]],
    [[7, -22], [13, -22]],
  ],

  cameras: [
    { x: 0,   y: 2.8, z: 5,   angle: Math.PI },
    { x: 0,   y: 2.8, z: -8,  angle: Math.PI, panRange: 0.8 },
    { x: -10, y: 2.8, z: -18, angle: Math.PI, range: 7 },
    { x: 10,  y: 2.8, z: -18, angle: Math.PI, range: 7 },
    { x: 0,   y: 2.8, z: -30, angle: 0, range: 6 },
  ],

  interactables: [
    {
      id: 'sec_cameras', mesh: 'terminal', x: 2, z: -10, rotY: Math.PI,
      hint: '[F] Disable cameras', requireMask: true, once: true,
      actions: [
        { type: 'message', text: 'Security cameras disabled!', color: '#44ff88' },
        { type: 'sound', sound: 'pickup' },
      ],
    },
    {
      id: 'wing_access', mesh: 'terminal', x: -2, z: -12, rotY: Math.PI,
      hint: 'Hold [F] Override wing access', holdTime: 4, requireMask: true, once: true,
      actions: [
        { type: 'openDoor', doorIndex: 1 },
        { type: 'openDoor', doorIndex: 2 },
        { type: 'message', text: 'Data wing doors overridden!', color: '#ffdd44' },
        { type: 'sound', sound: 'doorOpen' },
      ],
    },
  ],
}
