// ─────────────────────────────────────────────────────────────
// MAP 17 — FULTON POWER PLANT
// Reactor hall + turbine section. Narrow channels, hot danger.
// Difficulty ★★★★  |  4 objectives
// ─────────────────────────────────────────────────────────────
export default {
  id:          'powerplant',
  name:        'FULTON POWER PLANT',
  desc:        'Four fuel rods. High security. Nowhere to hide.',
  difficulty:  4,
  vehicle:     'truck',
  bagColor:    0x1a3a1a,
  playerStart: [0, 13],

  lights: [
    [-8, 4, 2], [8, 4, 2],
    [0, 4, -8], [0, 4, -18],
    [-8, 4, -14], [8, 4, -14],
  ],

  floors: [
    { x: 0,   z: -2,  w: 30, d: 26, tex: 'floor_metal'    },
    { x: 0,   z: -20, w: 18, d: 10, tex: 'floor_concrete' },
  ],

  walls: [
    { x: -15, z: -2,  w: 0.4, d: 26, color: 0x4a5a4a, tex: 'wall_metal', breachable: true },
    { x:  15, z: -2,  w: 0.4, d: 26, color: 0x4a5a4a, tex: 'wall_metal', breachable: true },
    { x:   0, z: -15, w: 30,  d: 0.4 },
    { x:  -9, z: 12,  w: 12,  d: 0.4 },
    { x:   9, z: 12,  w: 12,  d: 0.4 },
    { x:   0, z: 12,  w: 12,  d: 0.4, y: 2, h: 2 },
    // Turbine hall division channels
    { x: -8,  z: -2,  w: 0.4, d: 14, h: 2.8, color: 0x3a4a3a },
    { x:  8,  z: -2,  w: 0.4, d: 14, h: 2.8, color: 0x3a4a3a },
    // Control room at back
    { x: -9,  z: -20, w: 0.4, d: 10 },
    { x:  9,  z: -20, w: 0.4, d: 10 },
    { x:  0,  z: -25, w: 18,  d: 0.4 },
    { x:  0,  z: -15, w: 10.4, d: 0.4, y: 2, h: 2 },
  ],

  props: [
    // Turbines (big machines in outer channels)
    { x: -12, z:  2,  w: 2.2, h: 2.0, d: 3.0, color: 0x3a3a5a, hp: 300 },
    { x: -12, z: -4,  w: 2.2, h: 2.0, d: 3.0, color: 0x3a3a5a, hp: 300 },
    { x:  12, z:  2,  w: 2.2, h: 2.0, d: 3.0, color: 0x3a3a5a, hp: 300 },
    { x:  12, z: -4,  w: 2.2, h: 2.0, d: 3.0, color: 0x3a3a5a, hp: 300 },
    // Tanks and consoles in center channel
    { type: 'tank',       x:  0, z:  4  },
    { type: 'consolepod', x: -3, z: -8  },
    { type: 'consolepod', x:  3, z: -8  },
    // Control room
    { type: 'consolepod', x: -6, z: -22 },
    { type: 'consolepod', x:  0, z: -22 },
    { type: 'consolepod', x:  6, z: -22 },
    { type: 'console',    x:  0, z: -20 },
  ],


  zones: [
    { type: 'public',  x: 0, z:  6,  w: 30, d: 14, label: 'TURBINE HALL'   },
    { type: 'private', x: 0, z: -5,  w: 30, d: 14, label: 'GENERATOR ROOM' },
    { type: 'secure',  x: 0, z: -20, w: 18, d: 10, label: 'REACTOR CORE'   },
  ],
  doors: [
    { x: -0.6, z: -0.5, angle: 0, type: 'normal', w: 1.2 },
    { x: -0.6, z: -13,  angle: 0, type: 'secure', w: 1.2 },
  ],
  civilianTheme: 'warehouse',
  objectives:   [[-12, 2.5], [12, 2.5], [-6, -22.5], [6, -22.5]],
  escape:        [0, 17, 2.5],
  exfilZones:   [[-24, 1], [24, 1], [0, 24], [0, -30]],
  spawnPoints:  [
    [-17, -4], [17, -4], [-17, 6], [17, 6],
    [-11, -23], [11, -23], [0, -17],
  ],
  patrolRoutes: [
    [[-14, 5], [-9, 5]], [[9, 5], [14, 5]],
    [[-6, -2], [6, -2]],
    [[-7, -20], [7, -20]],
  ],

  cameras: [
    { x: 0,   y: 2.8, z: 11,  angle: Math.PI },
    { x: -14, y: 2.8, z: -5,  angle: Math.PI * 0.5 },
    { x: 14,  y: 2.8, z: -10, angle: -Math.PI * 0.5 },
    { x: 0,   y: 2.8, z: -17, angle: Math.PI, range: 7 },
  ],

  interactables: [
    {
      id: 'sec_cameras', mesh: 'terminal', x: -3, z: -20, rotY: 0,
      hint: '[F] Disable cameras', requireMask: true, once: true,
      actions: [
        { type: 'message', text: 'Security cameras disabled!', color: '#44ff88' },
        { type: 'sound', sound: 'pickup' },
      ],
    },
    {
      id: 'reactor_override', mesh: 'lever', x: 3, z: -22, rotY: 0,
      hint: '[F] Reactor override', once: true,
      actions: [
        { type: 'alarm' },
        { type: 'spawnEnemies', count: 3, enemyType: 'cop_rifle' },
        { type: 'message', text: 'REACTOR ALERT — heavy response incoming!', color: '#ff4444' },
      ],
    },
  ],
}
