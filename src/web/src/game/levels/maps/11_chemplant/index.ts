// ─────────────────────────────────────────────────────────────
// MAP 11 — AXIOM CHEMICAL PLANT
// Industrial maze of tanks and pipes. Control room in the back.
// Difficulty ★★★  |  4 objectives
// ─────────────────────────────────────────────────────────────
export default {
  id:          'chemplant',
  name:        'AXIOM CHEMICAL PLANT',
  desc:        'Four canisters. One control room. Zero OSHA compliance.',
  difficulty:  3,
  vehicle:     'truck',
  bagColor:    0x2a4a2a,
  playerStart: [0, 13],

  lights: [
    [-10, 4, 0], [0, 4, 0], [10, 4, 0],
    [-10, 4, -10], [10, 4, -10],
    [0, 3.5, -20],
  ],

  floors: [
    { x: 0,  z: -1,  w: 30, d: 26, tex: 'floor_metal'    },
    { x: 0,  z: -20, w: 10, d: 8,  tex: 'floor_concrete' },
  ],

  walls: [
    { x: -15, z: -1,  w: 0.4, d: 26, color: 0x607060, tex: 'wall_metal', breachable: true },
    { x:  15, z: -1,  w: 0.4, d: 26, color: 0x607060, tex: 'wall_metal', breachable: true },
    { x:   0, z: -14, w: 30,  d: 0.4, color: 0x607060 },
    { x:  -9, z: 12,  w: 12,  d: 0.4 },
    { x:   9, z: 12,  w: 12,  d: 0.4 },
    { x:   0, z: 12,  w: 12,  d: 0.4, y: 2, h: 2 },
    // Pipe channel walls (horizontal)
    { x: -6,  z: -3,  w: 18,  d: 0.4, h: 2.5, color: 0x4a5a4a },
    { x:  6,  z: -9,  w: 18,  d: 0.4, h: 2.5, color: 0x4a5a4a },
    // Control room
    { x: -5,  z: -20, w: 0.4, d: 8  },
    { x:   5, z: -20, w: 0.4, d: 8  },
    { x:   0, z: -24, w: 10,  d: 0.4, breachable: true },
    { x:   0, z: -14, w: 5.4, d: 0.4, y: 2, h: 2 },
  ],

  props: [
    // Chemical tanks (large, structural-ish props)
    { type: 'tank', x: -11, z:  2  },
    { type: 'tank', x: -11, z: -8  },
    { type: 'tank', x:  11, z:  2  },
    { type: 'tank', x:  11, z: -8  },
    // Barrels scattered
    { type: 'barrel', x: -5,  z:  5 },
    { type: 'barrel', x:  5,  z:  5 },
    { type: 'fuelBarrel', x: -3,  z: -12 },
    { type: 'fuelBarrel', x:  3,  z: -12 },
    { type: 'gasTank', x: 0, z: 6 },
    // Control room
    { type: 'consolepod', x: -2, z: -22 },
    { type: 'consolepod', x:  2, z: -22 },
    { type: 'console',    x:  0, z: -20 },
  ],


  zones: [
    { type: 'public',  x: 0, z:  6,  w: 30, d: 14, label: 'MAIN PLANT'  },
    { type: 'private', x: 0, z: -4,  w: 30, d: 14, label: 'PROCESSING'  },
    { type: 'secure',  x: 0, z: -20, w: 10, d:  8, label: 'CONTROL ROOM' },
  ],
  doors: [
    { x: -0.6, z:  0,  angle: 0, type: 'normal', w: 1.2 },
    { x: -0.6, z: -12, angle: 0, type: 'secure', w: 1.2 },
  ],
  civilianTheme: 'warehouse',
  objectives:   [[-11, 2.5], [-11, -7.5], [11, 2.5], [0, -20.5]],
  escape:        [0, 17, 2.5],
  exfilZones:   [[-24, 1], [24, 1], [0, 24], [0, -28]],
  spawnPoints:  [
    [-17, -4], [17, -4], [-17, 6], [17, 6],
    [0, -16], [-7, -22], [7, -22],
  ],
  patrolRoutes: [
    [[-13, 5], [13, 5]],
    [[-13, -12], [4, -12]],
    [[-3, -19], [3, -19]],
  ],

  cameras: [
    { x: 0,   y: 2.8, z: 11,  angle: Math.PI },
    { x: -14, y: 2.8, z: -5,  angle: Math.PI * 0.5 },
    { x: 14,  y: 2.8, z: -10, angle: -Math.PI * 0.5 },
    { x: 0,   y: 2.8, z: -16, angle: Math.PI, range: 6 },
  ],

  interactables: [
    {
      id: 'sec_cameras', mesh: 'terminal', x: -2, z: -21, rotY: 0,
      hint: '[F] Disable cameras', requireMask: true, once: true,
      actions: [
        { type: 'message', text: 'Security cameras disabled!', color: '#44ff88' },
        { type: 'sound', sound: 'pickup' },
      ],
    },
    {
      id: 'emergency_valve', mesh: 'lever', x: -5, z: -10, rotY: Math.PI * 0.5,
      hint: '[F] Emergency shutoff valve',
      actions: [
        { type: 'alarm' },
        { type: 'spawnEnemies', count: 2, enemyType: 'cop_smg' },
        { type: 'message', text: 'EMERGENCY ALERT — chemical spill alarm!', color: '#ff4444' },
      ],
    },
  ],
}
