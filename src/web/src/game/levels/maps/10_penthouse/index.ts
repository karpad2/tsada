// ─────────────────────────────────────────────────────────────
// MAP 10 — APEX PENTHOUSE
// High-rise luxury apartment. Safe room hidden behind a bookcase.
// Difficulty ★★★  |  3 objectives
// ─────────────────────────────────────────────────────────────
export default {
  id:          'penthouse',
  name:        'APEX PENTHOUSE',
  desc:        'Top floor job. Guards think nobody knows this place.',
  difficulty:  3,
  vehicle:     'car',
  vehicleColor: 0x111111,
  bagColor:    0x0a0a18,
  playerStart: [0, 9],

  lights: [
    [-6, 3.5, 1], [6, 3.5, 1],
    [-6, 3.5, -8], [8, 3.5, -8],
    [10, 3.5, -15],
  ],

  floors: [
    { x: 0,   z: -2,  w: 22, d: 20, tex: 'floor_marble' },
    { x: 9,   z: -14, w: 10, d: 10, tex: 'floor_carpet' },
  ],

  walls: [
    // Main apartment
    { x: -11, z: -2,  w: 0.4, d: 20, tex: 'wall_marble', breachable: true },
    { x:   4, z: -2,  w: 0.4, d: 20 },
    { x:  -3.5, z: -12, w: 15, d: 0.4 },
    { x:  -7, z: 10,  w: 8,   d: 0.4 },
    { x:   1, z: 10,  w: 6,   d: 0.4 },
    { x:  -3, z: 10,  w: 6,   d: 0.4, y: 2, h: 2 },
    // Wing extension (bedroom/office area)
    { x:  14, z: -14, w: 0.4, d: 10, breachable: true },
    { x:   9, z: -19, w: 10,  d: 0.4, breachable: true },
    { x:   4, z: -9,  w: 0.4, d: 5,  y: 2, h: 2 },
    // Balcony rail
    { x: -4,  z: -12, w: 14,  d: 0.4, h: 0.9, color: 0xd8d8e0 },
  ],

  props: [
    // Living area
    { type: 'sofa',  x: -7, z:  4 },
    { type: 'sofa',  x: -1, z:  4 },
    { x: -4, z: 6, w: 3, h: 0.55, d: 1.5, color: 0x3a2820, hp: 50 }, // coffee table
    // Kitchen counter
    { x: -8, z: -2, w: 0.6, h: 1.0, d: 8, color: 0xc0b898, hp: 120 },
    // Office area
    { type: 'desk',    x: 11, z: -15 },
    { type: 'server',  x: 13, z: -17 },
    { type: 'filecab', x: 13, z: -15 },
    // Safe
    { type: 'safe', x: 12, z: -18 },
  ],


  zones: [
    { type: 'public',  x: 0, z:  3,  w: 22, d: 12, label: 'RECEPTION'    },
    { type: 'private', x: 0, z: -7,  w: 22, d: 12, label: 'LIVING AREA'  },
    { type: 'secure',  x: 9, z: -14, w: 10, d: 10, label: 'PRIVATE VAULT' },
  ],
  doors: [
    { x: -0.6, z: -2, angle: 0, type: 'normal', w: 1.2 },
    { x:  8.4, z: -9, angle: 0, type: 'secure', w: 1.2 },
  ],
  civilianTheme: 'casino',
  objectives:   [[-1, 4.5], [11, -15.5], [12, -18.5]],
  escape:        [0, 13, 2.2],
  exfilZones:   [[-20, -8], [20, -8], [0, 18], [0, -28]],
  spawnPoints:  [[-13, -5], [5, -5], [-13, 5], [15, -12], [9, -21]],
  patrolRoutes: [
    [[-9, 0], [2, 0]],
    [[-9, -6], [2, -6]],
    [[8, -13], [13, -13]],
  ],

  cameras: [
    { x: 0,  y: 2.8, z: 9,   angle: Math.PI },
    { x: -10, y: 2.8, z: -5, angle: Math.PI * 0.5 },
    { x: 13, y: 2.8, z: -16, angle: -Math.PI * 0.5, range: 6 },
  ],

  interactables: [
    {
      id: 'sec_cameras', mesh: 'terminal', x: -8, z: -3, rotY: Math.PI * 0.5,
      hint: '[F] Disable cameras', requireMask: true, once: true,
      actions: [
        { type: 'message', text: 'Security cameras disabled!', color: '#44ff88' },
        { type: 'sound', sound: 'pickup' },
      ],
    },
    {
      id: 'pc_hack', mesh: 'terminal', x: 11, z: -16, rotY: Math.PI,
      hint: 'Hold [F] Hack private files', holdTime: 3, requireMask: true, once: true,
      actions: [
        { type: 'objective' },
        { type: 'message', text: 'Private files downloaded — bonus objective!', color: '#ffdd44' },
        { type: 'sound', sound: 'pickup' },
      ],
    },
  ],
}
