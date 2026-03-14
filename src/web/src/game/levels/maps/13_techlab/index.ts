// ─────────────────────────────────────────────────────────────
// MAP 13 — HELIOS RESEARCH LAB
// Clean room + server farm. Drives scattered across both wings.
// Difficulty ★★★  |  5 objectives
// ─────────────────────────────────────────────────────────────
export default {
  id:          'techlab',
  name:        'HELIOS RESEARCH LAB',
  desc:        'Five hard drives. The server farm is your main target.',
  difficulty:  3,
  vehicle:     'van',
  bagColor:    0x0a1a28,
  playerStart: [0, 12],

  lights: [
    [-8, 3.5, 2], [8, 3.5, 2],
    [-8, 3.5, -8], [8, 3.5, -8],
    [-8, 3.5, -18], [8, 3.5, -18],
  ],

  floors: [
    { x: 0,   z: -2,  w: 28, d: 26, tex: 'floor_linoleum' },
    { x: -8,  z: -18, w: 12, d: 12, color: 0x1a1a28        },
  ],

  walls: [
    { x: -14, z: -2,  w: 0.4, d: 26, tex: 'wall_panel', breachable: true },
    { x:  14, z: -2,  w: 0.4, d: 26, tex: 'wall_panel', breachable: true },
    { x:   0, z: -15, w: 28,  d: 0.4 },
    { x: -10, z: 11,  w: 8,   d: 0.4 },
    { x:  10, z: 11,  w: 8,   d: 0.4 },
    { x:   0, z: 11,  w: 12,  d: 0.4, y: 2, h: 2 },
    // Clean room divider
    { x:   2, z: -2,  w: 0.4, d: 12  },
    { x:   8, z: -9,  w: 12,  d: 0.4 },
    { x:   2, z: -6,  w: 0.4, d: 6,  y: 2, h: 2 },
    // Server farm
    { x: -14, z: -18, w: 0.4, d: 12, color: 0x1a1a2a },
    { x:  -2, z: -18, w: 0.4, d: 12, color: 0x1a1a2a },
    { x:  -8, z: -24, w: 12,  d: 0.4, breachable: true },
    { x:  -8, z: -12, w: 12,  d: 0.4, y: 2, h: 2 },
  ],

  props: [
    // Clean room workstations
    { type: 'workbench', x: -8, z:  4 },
    { type: 'workbench', x: -8, z:  0 },
    { type: 'gurney',    x: -8, z: -4 },
    { type: 'gurney',    x: -8, z: -8 },
    { type: 'console',   x: -4, z: -4 },
    // Tech side desks
    { type: 'desk', x: 8, z:  4 },
    { type: 'desk', x: 8, z:  0 },
    { type: 'desk', x: 8, z: -4 },
    // Server farm racks
    { type: 'server', x: -12, z: -16 },
    { type: 'server', x: -12, z: -18 },
    { type: 'server', x: -12, z: -20 },
    { type: 'server', x: -10, z: -16 },
    { type: 'server', x: -10, z: -18 },
    { type: 'server', x: -10, z: -20 },
    { type: 'server', x:  -6, z: -16 },
    { type: 'server', x:  -6, z: -18 },
  ],


  zones: [
    { type: 'public',  x:  0, z:  6,  w: 28, d: 12, label: 'RECEPTION'  },
    { type: 'private', x:  0, z: -4,  w: 28, d: 14, label: 'LAB FLOOR'  },
    { type: 'secure',  x: -8, z: -18, w: 12, d: 12, label: 'SERVER CORE' },
  ],
  doors: [
    { x:  -0.6, z:  0,  angle: 0, type: 'normal', w: 1.2 },
    { x:  -8,   z: -11, angle: 0, type: 'secure', w: 1.2 },
  ],
  civilianTheme: 'office',
  objectives:   [[-8, 4.5], [-8, -4.5], [-12, -16.5], [-12, -20.5], [-6, -18.5]],
  escape:        [0, 16, 2.5],
  exfilZones:   [[-22, 1], [22, 1], [0, 22], [0, -32]],
  spawnPoints:  [
    [-16, -4], [16, -4], [-16, 6], [16, 6],
    [-6, -26], [0, -14], [10, -14],
  ],
  patrolRoutes: [
    [[-12, 4], [0, 4]],
    [[-12, -10], [0, -10]],
    [[-12, -18], [-4, -18]],
  ],

  cameras: [
    { x: 0,   y: 2.8, z: 10,  angle: Math.PI },
    { x: -13, y: 2.8, z: -5,  angle: Math.PI * 0.5 },
    { x: 13,  y: 2.8, z: -8,  angle: -Math.PI * 0.5 },
    { x: -8,  y: 2.8, z: -15, angle: Math.PI, range: 7 },
  ],

  interactables: [
    // Reception — server room access terminal (hold 4s, opens secure door)
    {
      id: 'server_access', mesh: 'terminal', x: 2, z: 1, rotY: Math.PI,
      hint: 'Hold [F] Override server room lock', holdTime: 4, requireMask: true, once: true,
      actions: [
        { type: 'openDoor', doorIndex: 1 },
        { type: 'message', text: 'Server room door overridden!', color: '#44ff88' },
        { type: 'sound', sound: 'pickup' },
      ],
    },
    // Inside server room — disable fire suppression (enables bonus area)
    {
      id: 'fire_suppress', mesh: 'lever', x: -10, z: -14, rotY: 0,
      hint: '[F] Disable fire suppression', once: true,
      actions: [
        { type: 'message', text: 'Fire suppression disabled — server room clear!', color: '#88ddff' },
        { type: 'heal', amount: 25 },
      ],
    },
    // Emergency lockdown button in corridor
    {
      id: 'lockdown', mesh: 'button', x: -4, z: -10, rotY: Math.PI / 2,
      hint: '[F] Emergency lockdown',
      actions: [
        { type: 'alarm' },
        { type: 'spawnEnemies', count: 3, enemyType: 'cop_smg' },
        { type: 'message', text: 'LOCKDOWN — security responding!', color: '#ff4444' },
      ],
    },
  ],
}
