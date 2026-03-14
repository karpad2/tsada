// ─────────────────────────────────────────────────────────────
// MAP 02 — DIAMOND DISTRICT
// Upscale jewelry store. Display cases on the floor, safe in back.
// Difficulty ★  |  4 objectives
// ─────────────────────────────────────────────────────────────
export default {
  id:          'jewelry',
  name:        'DIAMOND DISTRICT',
  desc:        'Clean out the display cases. Safe is in the back room.',
  difficulty:  1,
  vehicle:     'car',
  vehicleColor: 0x334466,
  bagColor:    0x202030,
  playerStart: [0, 7],

  lights: [
    [-4, 3.5, 0], [4, 3.5, 0], [0, 3.5, -7],
  ],

  floors: [
    { x: 0,   z:  0,  w: 20, d: 14, tex: 'floor_marble' },
    { x: 0,   z: -12, w: 10, d: 8,  color: 0x707080     },
  ],

  walls: [
    // Showroom perimeter
    { x: -10, z:  0,  w: 0.4, d: 14, breachable: true },
    { x:  10, z:  0,  w: 0.4, d: 14, breachable: true },
    { x:   0, z: -7,  w: 20,  d: 0.4 },
    // Front entrance walls (gap in middle 4m)
    { x: -7,  z:  7,  w: 6,   d: 0.4, color: 0xd8d0c0 },
    { x:  7,  z:  7,  w: 6,   d: 0.4, color: 0xd8d0c0 },
    // Back room
    { x: -5,  z: -12, w: 0.4, d: 8  },
    { x:  5,  z: -12, w: 0.4, d: 8  },
    { x:  0,  z: -16, w: 10,  d: 0.4, breachable: true },
    // Back room doorway header
    { x:  0,  z:  -7, w: 6,   d: 0.4, y: 2, h: 2 },
  ],

  props: [
    // Display case grid in showroom
    { type: 'displayCase', x: -6, z:  1 },
    { type: 'displayCase', x: -6, z: -2 },
    { type: 'displayCase', x: -6, z: -4 },
    { type: 'displayCase', x:  6, z:  1 },
    { type: 'displayCase', x:  6, z: -2 },
    { type: 'displayCase', x:  6, z: -4 },
    // Service counter at entrance
    { x: 0, z: 4, w: 5, h: 1.0, d: 0.6, color: 0xc8b090, hp: 90 },
    // Safe in back room
    { type: 'safe', x: 0, z: -14 },
    { type: 'cabinet', x: -3, z: -14 },
    { type: 'cabinet', x:  3, z: -14 },
  ],


  zones: [
    { type: 'public', x: 0, z:  1,  w: 20, d: 10, label: 'SHOWROOM'  },
    { type: 'secure', x: 0, z: -12, w: 10, d:  8, label: 'SAFE ROOM' },
  ],
  doors: [
    { x: -0.6, z: -7.8, angle: 0, type: 'secure', w: 1.2 },
  ],
  civilianTheme: 'bank',
  objectives:   [[-6, -2], [6, -2], [0, -11], [0, -14.5]],
  escape:        [0, 11, 2.2],
  exfilZones:   [[-16, 0], [16, 0], [0, 14], [0, -22]],
  spawnPoints:  [[-12, -4], [12, -4], [-12, 4], [12, 4], [0, -18]],
  patrolRoutes: [[[-7, 0], [7, 0]], [[-3, -10], [3, -10]]],

  cameras: [
    { x: 0,  y: 2.8, z: 6,   angle: Math.PI },
    { x: -9, y: 2.8, z: 0,   angle: Math.PI * 0.5, panRange: 0.6 },
    { x: 0,  y: 2.8, z: -12, angle: 0,  range: 6 },
  ],

  interactables: [
    {
      id: 'sec_cameras', mesh: 'terminal', x: -8, z: 0, rotY: Math.PI * 0.5,
      hint: '[F] Disable cameras', requireMask: true, once: true,
      actions: [
        { type: 'message', text: 'Security cameras disabled!', color: '#44ff88' },
        { type: 'sound', sound: 'pickup' },
      ],
    },
  ],
}
