// ─────────────────────────────────────────────────────────────
// MAP 07 — HARBOUR WAREHOUSE
// Industrial warehouse with container corridors and a corner office.
// Difficulty ★★  |  5 objectives
// ─────────────────────────────────────────────────────────────
export default {
  id:          'warehouse',
  name:        'HARBOUR WAREHOUSE',
  desc:        'Shipping containers, no cover. Find the stash.',
  difficulty:  2,
  vehicle:     'truck',
  bagColor:    0x3a2800,
  playerStart: [0, 14],

  lights: [
    [-12, 4, 0], [0, 4, 0], [12, 4, 0],
    [-12, 4, -10], [12, 4, -10],
    [14, 3.5, -18],
  ],

  floors: [
    { x: 0,   z: -1, w: 34, d: 28, tex: 'floor_concrete' },
    { x: 13,  z: -18, w: 8, d: 8, color: 0x4a4040         },
  ],

  walls: [
    { x: -17, z: -1,  w: 0.4, d: 28, breachable: true },
    { x:  17, z: -1,  w: 0.4, d: 28, breachable: true },
    { x:   0, z: -15, w: 34,  d: 0.4, breachable: true },
    // Entrance
    { x: -10, z: 13,  w: 14,  d: 0.4 },
    { x:  10, z: 13,  w: 14,  d: 0.4 },
    { x:   0, z: 13,  w: 14,  d: 0.4, y: 2, h: 2 },
    // Corner office (top-right)
    { x:  9,  z: -18, w: 0.4, d: 8  },
    { x:  13, z: -22, w: 8,   d: 0.4 },
    { x:  13, z: -14, w: 8,   d: 0.4, y: 2, h: 2 },
    // Container rows (act as walls for corridors)
    { x: -10, z: -5,  w: 2.4, h: 2.6, d: 6.0, color: 0x4a6a4a },
    { x: -10, z:  3,  w: 2.4, h: 2.6, d: 6.0, color: 0x4a6a4a },
    { x:   0, z: -5,  w: 2.4, h: 2.6, d: 6.0, color: 0x226644 },
    { x:   0, z:  3,  w: 2.4, h: 2.6, d: 6.0, color: 0x226644 },
    { x:  10, z: -5,  w: 2.4, h: 2.6, d: 6.0, color: 0x4a4a6a },
  ],

  props: [
    // Loose crates around warehouse
    { type: 'crate', x: -14, z: -3  },
    { type: 'crate', x: -14, z: -7  },
    { type: 'crate', x:  14, z: -3  },
    { type: 'crate', x:  14, z: -7  },
    { type: 'barrel', x:  -5,  z: -12 },
    { type: 'barrel', x:   5,  z: -12 },
    // Office furniture
    { type: 'desk',    x: 11, z: -20 },
    { type: 'filecab', x: 14.5, z: -21 },
    { type: 'workbench', x: 11, z: -17.5 },
  ],


  zones: [
    { type: 'public',  x:  0,  z:  8,  w: 34, d: 10, label: 'LOADING DOCK' },
    { type: 'private', x:  0,  z: -2,  w: 34, d: 16, label: 'WAREHOUSE'    },
    { type: 'secure',  x: 13,  z: -18, w:  8, d:  8, label: 'SITE OFFICE'  },
  ],
  doors: [
    { x: 12.4, z: -14, angle: 0, type: 'secure', w: 1.2 },
  ],
  civilianTheme: 'warehouse',
  objectives:   [[-10, -5], [0, 3], [10, -5], [11, -20.5], [11, -17.5]],
  escape:        [0, 18, 2.5],
  exfilZones:   [[-25, -1], [25, -1], [0, 24], [0, -28]],
  spawnPoints:  [[-19, -8], [19, -8], [-19, 6], [19, 6], [0, -17], [15, -22.5]],
  patrolRoutes: [
    [[-15, 0], [15, 0]],
    [[-14, -10], [8, -10]],
    [[10, -17], [15, -17]],
  ],

  cameras: [
    { x: 0,   y: 2.8, z: 12, angle: Math.PI },
    { x: -16, y: 2.8, z: 0,  angle: Math.PI * 0.5 },
    { x: 16,  y: 2.8, z: -8, angle: -Math.PI * 0.5 },
    { x: 13,  y: 2.8, z: -15, angle: Math.PI, range: 6 },
  ],

  interactables: [
    {
      id: 'sec_cameras', mesh: 'terminal', x: 13, z: -18, rotY: Math.PI,
      hint: '[F] Disable cameras', requireMask: true, once: true,
      actions: [
        { type: 'message', text: 'Security cameras disabled!', color: '#44ff88' },
        { type: 'sound', sound: 'pickup' },
      ],
    },
  ],
}
