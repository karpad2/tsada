// ─────────────────────────────────────────────────────────────
// MAP 19 — IRONGATE CORRECTIONAL FACILITY
// Cell block with guard stations. Narrow corridors, no mercy.
// Difficulty ★★★★  |  3 objectives
// ─────────────────────────────────────────────────────────────
export default {
  id:          'prison',
  name:        'IRONGATE CORRECTIONAL',
  desc:        'Three keycards. Long corridors. Guards every step.',
  difficulty:  4,
  vehicle:     'van',
  bagColor:    0x181818,
  playerStart: [0, 12],

  lights: [
    [0, 3.5, 2], [0, 3.5, -8], [0, 3.5, -18],
    [-12, 3.5, -14], [12, 3.5, -14],
  ],

  floors: [
    // Central corridor
    { x: 0,   z: -6,  w: 8, d: 30, tex: 'floor_concrete' },
    // Left cell block
    { x: -12, z: -12, w: 12, d: 16, color: 0x4a4848 },
    // Right cell block
    { x:  12, z: -12, w: 12, d: 16, color: 0x4a4848 },
  ],

  walls: [
    // Central corridor walls
    { x: -4, z: -6,  w: 0.4, d: 30, color: 0x6a6868, tex: 'wall_concrete' },
    { x:  4, z: -6,  w: 0.4, d: 30, color: 0x6a6868, tex: 'wall_concrete' },
    { x:  0, z:-21,  w: 8,   d: 0.4, color: 0x6a6868, breachable: true },
    // Entrance
    { x: -6, z: 9,   w: 8,   d: 0.4 },
    { x:  6, z: 9,   w: 8,   d: 0.4 },
    { x:  0, z: 9,   w: 8,   d: 0.4, y: 2, h: 2 },
    // Left cell block
    { x: -18, z:-12, w: 0.4, d: 16, color: 0x585656, breachable: true },
    { x: -12, z: -4, w: 12,  d: 0.4, color: 0x585656 },
    { x: -12, z:-20, w: 12,  d: 0.4, color: 0x585656 },
    { x:  -4, z: -4, w: 0.4, d: 4,  y: 2, h: 2 },
    // Cell dividers (left block)
    { x: -12, z: -8, w: 10,  d: 0.4, h: 2.8, color: 0x585656 },
    { x: -12, z:-16, w: 10,  d: 0.4, h: 2.8, color: 0x585656 },
    // Right cell block
    { x:  18, z:-12, w: 0.4, d: 16, color: 0x585656, breachable: true },
    { x:  12, z: -4, w: 12,  d: 0.4, color: 0x585656 },
    { x:  12, z:-20, w: 12,  d: 0.4, color: 0x585656 },
    { x:   4, z: -4, w: 0.4, d: 4,  y: 2, h: 2 },
    // Cell dividers (right block)
    { x: 12, z: -8, w: 10,  d: 0.4, h: 2.8, color: 0x585656 },
    { x: 12, z:-16, w: 10,  d: 0.4, h: 2.8, color: 0x585656 },
  ],

  props: [
    // Guard station mid-corridor
    { x: 0, z: -3, w: 3, h: 1.0, d: 0.5, color: 0x5a6878, hp: 90 },
    // Cell furniture
    { type: 'locker', x: -16, z: -6  },
    { type: 'locker', x: -16, z: -18 },
    { type: 'locker', x:  16, z: -6  },
    { type: 'locker', x:  16, z: -18 },
    // Guard desks at post positions
    { type: 'desk', x: -10, z: -12 },
    { type: 'desk', x:  10, z: -12 },
  ],


  zones: [
    { type: 'public',  x:   0, z:  5,  w:  8, d:  8, label: 'ENTRANCE'    },
    { type: 'private', x:   0, z: -10, w:  8, d: 22, label: 'CORRIDOR'     },
    { type: 'secure',  x: -12, z: -12, w: 12, d: 16, label: 'LEFT BLOCK'   },
    { type: 'secure',  x:  12, z: -12, w: 12, d: 16, label: 'RIGHT BLOCK'  },
  ],
  doors: [
    { x: -4, z: -4, angle: Math.PI / 2, type: 'secure', w: 1.2 },
    { x:  4, z: -4, angle: Math.PI / 2, type: 'secure', w: 1.2 },
  ],
  civilianTheme: 'prison',
  objectives:   [[0, -3.5], [-10, -12.5], [10, -12.5]],
  escape:        [0, 16, 2.5],
  exfilZones:   [[-28, -12], [28, -12], [0, 22], [0, -28]],
  spawnPoints:  [
    [-6, -22], [6, -22], [0, -21.5],
    [-20, -10], [20, -10],
    [-20, -14], [20, -14],
  ],
  patrolRoutes: [
    [[0, 0], [0, -20]],
    [[-16, -7], [-8, -7]],
    [[8, -7], [16, -7]],
  ],

  cameras: [
    { x: 0,  y: 2.8, z: 8,   angle: Math.PI },
    { x: -3, y: 2.8, z: -10, angle: -Math.PI * 0.5, panRange: 0.8 },
    { x: 3,  y: 2.8, z: -10, angle: Math.PI * 0.5, panRange: 0.8 },
    { x: 0,  y: 2.8, z: -20, angle: 0, range: 6 },
  ],

  interactables: [
    {
      id: 'sec_cameras', mesh: 'terminal', x: 0, z: -2, rotY: Math.PI,
      hint: '[F] Disable cameras', requireMask: true, once: true,
      actions: [
        { type: 'message', text: 'Security cameras disabled!', color: '#44ff88' },
        { type: 'sound', sound: 'pickup' },
      ],
    },
    {
      id: 'cell_override', mesh: 'lever', x: -10, z: -11, rotY: Math.PI * 0.5,
      hint: '[F] Override cell locks', once: true,
      actions: [
        { type: 'openDoor', doorIndex: 0 },
        { type: 'message', text: 'Cell block doors overridden!', color: '#ffdd44' },
        { type: 'sound', sound: 'doorOpen' },
      ],
    },
  ],
}
