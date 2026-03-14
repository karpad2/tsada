// ─────────────────────────────────────────────────────────────
// MAP 03 — LUCKY PAWN SHOP
// Cluttered pawn shop. Items hidden under the counter & storage.
// Difficulty ★  |  3 objectives
// ─────────────────────────────────────────────────────────────
export default {
  id:          'pawn',
  name:        'LUCKY PAWN SHOP',
  desc:        'Messy shop, easy targets. Watch the back room.',
  difficulty:  1,
  vehicle:     'car',
  vehicleColor: 0x553322,
  bagColor:    0x3a2800,
  playerStart: [0, 6],

  lights: [
    [0, 3.2, 0], [0, 3.2, -8],
  ],

  floors: [
    { x: 0,  z:  0,  w: 14, d: 12, tex: 'floor_wood'  },
    { x: 0,  z: -11, w: 6,  d: 6,  color: 0x605048     },
  ],

  walls: [
    { x: -7,  z:  0,  w: 0.4, d: 12, breachable: true },
    { x:  7,  z:  0,  w: 0.4, d: 12, breachable: true },
    { x:  0,  z: -6,  w: 14,  d: 0.4 },
    // Front walls with 4m entrance gap
    { x: -5,  z:  6,  w: 4,   d: 0.4, color: 0xb89070 },
    { x:  5,  z:  6,  w: 4,   d: 0.4, color: 0xb89070 },
    // Storage room
    { x: -3,  z: -11, w: 0.4, d: 6  },
    { x:  3,  z: -11, w: 0.4, d: 6  },
    { x:  0,  z: -14, w: 6,   d: 0.4, breachable: true },
    // Storage door header
    { x:  0,  z:  -6, w: 4,   d: 0.4, y: 2, h: 2 },
  ],

  props: [
    // Front counter
    { x: 0, z: 2, w: 8, h: 1.0, d: 0.6, color: 0x7a5030, hp: 100 },
    // Shelves along walls
    { type: 'shelf', x: -5.5, z: -1 },
    { type: 'shelf', x: -5.5, z: -4 },
    { type: 'shelf', x:  5.5, z: -1 },
    { type: 'shelf', x:  5.5, z: -4 },
    // Glass case near counter
    { type: 'displayCase', x: -2, z: 4.5 },
    { type: 'displayCase', x:  2, z: 4.5 },
    // Back storage barrels and crates
    { type: 'crate', x: -1.5, z: -11 },
    { type: 'crate', x:  1.5, z: -11 },
    { type: 'barrel', x: -2,  z: -13 },
    { type: 'barrel', x:  2,  z: -13 },
  ],


  zones: [
    { type: 'public', x: 0, z:  0,  w: 14, d: 10, label: 'SHOP'      },
    { type: 'secure', x: 0, z: -11, w:  6, d:  6, label: 'BACK ROOM' },
  ],
  doors: [
    { x: -0.6, z: -7.8, angle: 0, type: 'secure', w: 1.2 },
  ],
  civilianTheme: 'default',
  objectives:   [[-2, 2.5], [2, 2.5], [0, -13.5]],
  escape:        [0, 10, 2.2],
  exfilZones:   [[-14, 0], [14, 0], [0, 14], [0, -20]],
  spawnPoints:  [[-9, -3], [9, -3], [0, -16]],
  patrolRoutes: [[[-5, -2], [5, -2]], [[-2, -10], [2, -10]]],

  cameras: [
    { x: 0, y: 2.8, z: 5, angle: Math.PI },
    { x: 0, y: 2.8, z: -10, angle: 0, range: 5 },
  ],

  interactables: [
    {
      id: 'sec_cameras', mesh: 'terminal', x: -5, z: -2, rotY: Math.PI * 0.5,
      hint: '[F] Disable cameras', requireMask: true, once: true,
      actions: [
        { type: 'message', text: 'Security cameras disabled!', color: '#44ff88' },
        { type: 'sound', sound: 'pickup' },
      ],
    },
  ],
}
