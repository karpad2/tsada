// ─────────────────────────────────────────────────────────────
// MAP 08 — GRAND MERIDIAN HOTEL
// Luxury lobby and a private corridor of suites with briefcases.
// Difficulty ★★  |  4 objectives
// ─────────────────────────────────────────────────────────────
export default {
  id:          'hotel',
  name:        'GRAND MERIDIAN HOTEL',
  desc:        'Four briefcases. Three suites. One lobby full of guards.',
  difficulty:  2,
  vehicle:     'car',
  vehicleColor: 0x222222,
  bagColor:    0x1a1a30,
  playerStart: [0, 11],

  lights: [
    [-8, 3.5, 2], [0, 3.5, 2], [8, 3.5, 2],
    [-8, 3.5, -8], [8, 3.5, -8],
    [-10, 3.5, -18], [0, 3.5, -18], [10, 3.5, -18],
  ],

  floors: [
    { x: 0,   z:  0,  w: 28, d: 20, tex: 'floor_marble' },
    { x: 0,   z: -18, w: 28, d: 12, tex: 'floor_carpet' },
  ],

  walls: [
    // Lobby perimeter
    { x: -14, z:  0,  w: 0.4, d: 20, tex: 'wall_marble', breachable: true },
    { x:  14, z:  0,  w: 0.4, d: 20, tex: 'wall_marble', breachable: true },
    { x:   0, z: -10, w: 28,  d: 0.4 },
    { x: -10, z: 10,  w: 8,   d: 0.4 },
    { x:  10, z: 10,  w: 8,   d: 0.4 },
    { x:   0, z: 10,  w: 12,  d: 0.4, y: 2, h: 2 },
    // Corridor (connecting lobby to suites)
    { x:   0, z: -10, w: 28,  d: 0.4 },
    // Suite corridor walls
    { x: -14, z: -18, w: 0.4, d: 12 },
    { x:  14, z: -18, w: 0.4, d: 12 },
    { x:   0, z: -24, w: 28,  d: 0.4, breachable: true },
    // Suite dividers
    { x: -7,  z: -18, w: 0.4, d: 12 },
    { x:  7,  z: -18, w: 0.4, d: 12 },
    // Suite doors (partial wall with gap)
    { x: -10.5, z: -10, w: 7, d: 0.4, y: 2, h: 2 },
    { x:   0,   z: -10, w: 6, d: 0.4, y: 2, h: 2 },
    { x:  10.5, z: -10, w: 7, d: 0.4, y: 2, h: 2 },
  ],

  props: [
    // Lobby furniture
    { type: 'sofa',  x: -8,  z: 5 },
    { type: 'sofa',  x:  8,  z: 5 },
    { type: 'desk',  x:  0,  z: 5 },
    { x: 0, z: 7, w: 6, h: 1.1, d: 0.6, color: 0xc8a878, hp: 90 }, // concierge counter
    // Suite contents
    { type: 'desk',  x: -10.5, z: -15 },
    { type: 'sofa',  x: -10.5, z: -21 },
    { type: 'filecab', x: -12.5, z: -21 },
    { type: 'desk',  x:   0,   z: -15 },
    { type: 'sofa',  x:   0,   z: -21 },
    { type: 'desk',  x:  10.5, z: -15 },
    { type: 'safe',  x:  12.5, z: -21 },
  ],


  zones: [
    { type: 'public',  x: 0, z:  4,  w: 28, d: 12, label: 'LOBBY'        },
    { type: 'private', x: 0, z: -9,  w: 28, d: 10, label: 'GUEST SUITES'  },
    { type: 'secure',  x: 0, z: -18, w: 28, d: 12, label: 'VIP SUITES'    },
  ],
  doors: [
    { x: -0.6, z: -2,  angle: 0, type: 'normal', w: 1.2 },
    { x: -0.6, z: -14, angle: 0, type: 'secure', w: 1.2 },
  ],
  civilianTheme: 'casino',
  objectives:   [[-10.5, -15.5], [0, -15.5], [10.5, -15.5], [12.5, -21.5]],
  escape:        [0, 15, 2.5],
  exfilZones:   [[-22, 0], [22, 0], [0, 20], [0, -28]],
  spawnPoints:  [[-16, -5], [16, -5], [-16, 5], [16, 5], [-12, -22], [12, -22]],
  patrolRoutes: [
    [[-12, 2], [12, 2]],
    [[-12, -6], [12, -6]],
    [[-12, -20], [12, -20]],
  ],

  cameras: [
    { x: 0,   y: 2.8, z: 9,   angle: Math.PI },
    { x: -13, y: 2.8, z: 0,   angle: Math.PI * 0.5 },
    { x: 13,  y: 2.8, z: -15, angle: -Math.PI * 0.5, panRange: 0.6 },
    { x: 0,   y: 2.8, z: -23, angle: 0, range: 8 },
  ],

  interactables: [
    {
      id: 'sec_cameras', mesh: 'terminal', x: -3, z: 7, rotY: 0,
      hint: '[F] Disable cameras', requireMask: true, once: true,
      actions: [
        { type: 'message', text: 'Security cameras disabled!', color: '#44ff88' },
        { type: 'sound', sound: 'pickup' },
      ],
    },
    {
      id: 'safe_hack', mesh: 'terminal', x: 12, z: -20, rotY: -Math.PI * 0.5,
      hint: 'Hold [F] Crack VIP safe', holdTime: 4, requireMask: true, once: true,
      actions: [
        { type: 'objective' },
        { type: 'message', text: 'VIP safe cracked — bonus loot!', color: '#ffdd44' },
        { type: 'sound', sound: 'pickup' },
      ],
    },
  ],
}
