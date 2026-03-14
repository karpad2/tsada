// ─────────────────────────────────────────────────────────────
// MAP 16 — WESTSIDE SHOPPING MALL
// Four stores + central atrium. Objectives scattered across shops.
// Difficulty ★★★  |  7 objectives
// ─────────────────────────────────────────────────────────────
export default {
  id:          'mall',
  name:        'WESTSIDE SHOPPING MALL',
  desc:        'After hours. Seven items. Four shops to clear.',
  difficulty:  3,
  vehicle:     'van',
  bagColor:    0x2a1800,
  playerStart: [0, 16],

  lights: [
    [0, 3.5, 5], [-16, 3.5, -6], [0, 3.5, -6], [16, 3.5, -6],
    [-16, 3.5, -18], [0, 3.5, -18], [16, 3.5, -18],
  ],

  floors: [
    // Central atrium corridor
    { x: 0,   z: -6, w: 10, d: 28, tex: 'floor_marble' },
    // Shop A — left front
    { x: -16, z:  0, w: 16, d: 14, tex: 'floor_tile'   },
    // Shop B — left back
    { x: -16, z: -14, w: 16, d: 14, tex: 'floor_carpet' },
    // Shop C — right front
    { x:  16, z:  0, w: 16, d: 14, tex: 'floor_tile'   },
    // Shop D — right back
    { x:  16, z: -14, w: 16, d: 14, tex: 'floor_carpet' },
  ],

  walls: [
    // Outer perimeter
    { x: -24, z: -6, w: 0.4, d: 28, breachable: true },
    { x:  24, z: -6, w: 0.4, d: 28, breachable: true },
    { x:   0, z:-20, w: 48,  d: 0.4, breachable: true },
    { x: -17, z: 8,  w: 14,  d: 0.4 },
    { x:  17, z: 8,  w: 14,  d: 0.4 },
    // Entrance walls
    { x:  -5, z: 8,  w: 6,   d: 0.4 },
    { x:   5, z: 8,  w: 6,   d: 0.4 },
    { x:   0, z: 8,  w: 10,  d: 0.4, y: 2, h: 2 },
    // Atrium walls (partial — shops open to atrium via entrance gaps)
    { x: -5,  z: -6, w: 0.4, d: 4   },
    { x: -5,  z:-14, w: 0.4, d: 6   },
    { x:  5,  z: -6, w: 0.4, d: 4   },
    { x:  5,  z:-14, w: 0.4, d: 6   },
    // Shop back walls
    { x: -16, z:-20, w: 16,  d: 0.4 },
    { x:  16, z:-20, w: 16,  d: 0.4 },
    // Divider between front/back shops
    { x: -14, z: -7, w: 12,  d: 0.4, y: 2, h: 2 },
    { x:  14, z: -7, w: 12,  d: 0.4, y: 2, h: 2 },
  ],

  props: [
    // Shop A (electronics)
    { type: 'displayCase', x: -18, z:  2 },
    { type: 'displayCase', x: -14, z:  2 },
    { type: 'shelf',       x: -20, z: -1 },
    { type: 'desk',        x: -18, z: -4 },
    // Shop B (clothing back)
    { type: 'shelf', x: -20, z: -12 },
    { type: 'shelf', x: -20, z: -16 },
    { type: 'shelf', x: -14, z: -12 },
    { type: 'safe',  x: -20, z: -18 },
    // Shop C (jeweler)
    { type: 'displayCase', x: 18, z:  2 },
    { type: 'displayCase', x: 14, z:  2 },
    { type: 'displayCase', x: 18, z:  0 },
    { type: 'counter',     x: 12, z: -2, w: 4 },
    // Shop D (stockroom)
    { type: 'crate',  x: 18, z: -12, size: 1.2 },
    { type: 'crate',  x: 14, z: -12, size: 1.2 },
    { type: 'crate',  x: 20, z: -16, size: 1.2 },
    { type: 'barrel', x: 18, z: -18 },
    { type: 'barrel', x: 14, z: -18 },
  ],


  zones: [
    { type: 'public',  x:   0, z:  4,  w: 10, d: 22, label: 'CORRIDOR'   },
    { type: 'private', x: -16, z: -6,  w: 16, d: 28, label: 'WEST SHOPS' },
    { type: 'private', x:  16, z: -6,  w: 16, d: 28, label: 'EAST SHOPS' },
    { type: 'secure',  x: -20, z: -18, w: 10, d: 10, label: 'VAULT'       },
  ],
  doors: [
    { x: -5, z: -4, angle: Math.PI / 2, type: 'normal', w: 1.2 },
    { x:  5, z: -4, angle: Math.PI / 2, type: 'normal', w: 1.2 },
  ],
  civilianTheme: 'default',
  objectives: [
    [-18, 2.5], [-14, 2.5],   // Shop A display cases
    [-20, -18.5],             // Shop B safe
    [18, 2.5], [18, 0.5],    // Shop C display cases
    [18, -12.5], [20, -16.5] // Shop D crates
  ],
  escape:        [0, 20, 2.5],
  exfilZones:   [[-34, 0], [34, 0], [0, 28], [0, -30]],
  spawnPoints:  [
    [-26, -4], [26, -4], [-26, 4], [26, 4],
    [-20, -22], [0, -22], [20, -22],
  ],
  patrolRoutes: [
    [[0, 2], [0, -18]],
    [[-22, -3], [-8, -3]],
    [[8, -3], [22, -3]],
    [[-22, -16], [-8, -16]],
  ],

  cameras: [
    { x: 0,   y: 2.8, z: 7,   angle: Math.PI },
    { x: -23, y: 2.8, z: -3,  angle: Math.PI * 0.5, panRange: 0.7 },
    { x: 23,  y: 2.8, z: -10, angle: -Math.PI * 0.5, panRange: 0.7 },
    { x: 0,   y: 2.8, z: -19, angle: 0, range: 8 },
    { x: -20, y: 2.8, z: -18, angle: Math.PI, range: 6 },
  ],

  interactables: [
    {
      id: 'sec_cameras', mesh: 'terminal', x: -22, z: -12, rotY: Math.PI * 0.5,
      hint: '[F] Disable cameras', requireMask: true, once: true,
      actions: [
        { type: 'message', text: 'Security cameras disabled!', color: '#44ff88' },
        { type: 'sound', sound: 'pickup' },
      ],
    },
  ],
}
