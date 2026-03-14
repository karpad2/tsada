// ─────────────────────────────────────────────────────────────
// MAP 12 — METRO POLICE HQ — EVIDENCE
// Rob the evidence room. Guards everywhere and they respawn fast.
// Difficulty ★★★  |  5 objectives
// ─────────────────────────────────────────────────────────────
export default {
  id:          'policestation',
  name:        'METRO POLICE HQ',
  desc:        'Evidence room is deep inside. This one makes noise.',
  difficulty:  3,
  vehicle:     'van',
  bagColor:    0x3a2800,
  playerStart: [0, 12],

  lights: [
    [-8, 3.5, 2], [8, 3.5, 2],
    [-8, 3.5, -8], [8, 3.5, -8],
    [0, 3.5, -18],
  ],

  floors: [
    { x: 0,  z: -1,  w: 26, d: 24, tex: 'floor_linoleum' },
    { x: 0,  z: -19, w: 14, d: 8,  color: 0x4a4040        },
  ],

  walls: [
    { x: -13, z: -1,  w: 0.4, d: 24, tex: 'wall_concrete', breachable: true },
    { x:  13, z: -1,  w: 0.4, d: 24, tex: 'wall_concrete', breachable: true },
    { x:   0, z: -13, w: 26,  d: 0.4 },
    { x:  -9, z: 11,  w: 8,   d: 0.4 },
    { x:   9, z: 11,  w: 8,   d: 0.4 },
    { x:   0, z: 11,  w: 10,  d: 0.4, y: 2, h: 2 },
    // Lobby desk area partition
    { x:  -7, z:  5,  w: 12,  d: 0.4, h: 1.2 },
    // Corridor + cell block area
    { x: -7,  z: -19, w: 0.4, d: 8  },
    { x:  7,  z: -19, w: 0.4, d: 8  },
    { x:  0,  z: -23, w: 14,  d: 0.4, breachable: true },
    { x:  0,  z: -13, w: 8.4, d: 0.4, y: 2, h: 2 },
    // Side interview rooms
    { x: -13, z: -9,  w: 0.4, d: 8  },
    { x:  13, z: -9,  w: 0.4, d: 8  },
    { x: -10, z: -13, w: 6,   d: 0.4 },
    { x:  10, z: -13, w: 6,   d: 0.4 },
  ],

  props: [
    // Front reception
    { x: -3, z: 8, w: 8, h: 1.0, d: 0.6, color: 0x5a6878, hp: 110 },
    // Patrol desks in main area
    { type: 'desk', x: -8, z:  2 },
    { type: 'desk', x:  8, z:  2 },
    { type: 'desk', x: -8, z: -2 },
    { type: 'desk', x:  8, z: -2 },
    { type: 'filecab', x: -10, z: -2 },
    { type: 'filecab', x:  10, z: -2 },
    // Evidence room
    { type: 'locker', x: -5, z: -21 },
    { type: 'locker', x: -3, z: -21 },
    { type: 'locker', x:  3, z: -21 },
    { type: 'locker', x:  5, z: -21 },
    { type: 'filecab', x: -5, z: -15 },
    { type: 'filecab', x:  5, z: -15 },
  ],


  zones: [
    { type: 'public',  x: 0, z:  6,  w: 26, d: 14, label: 'RECEPTION'     },
    { type: 'private', x: 0, z: -4,  w: 26, d: 14, label: 'OFFICES'        },
    { type: 'secure',  x: 0, z: -19, w: 14, d:  8, label: 'EVIDENCE ROOM'  },
  ],
  doors: [
    { x: -0.6, z:  0,  angle: 0, type: 'normal', w: 1.2 },
    { x: -0.6, z: -11, angle: 0, type: 'secure', w: 1.2 },
  ],
  civilianTheme: 'office',
  objectives:   [[-8, 2.5], [8, 2.5], [-5, -15.5], [0, -20.5], [5, -21.5]],
  escape:        [0, 16, 2.5],
  exfilZones:   [[-22, 0], [22, 0], [0, 22], [0, -32]],
  spawnPoints:  [
    [-15, -5], [15, -5], [-15, 5], [15, 5],
    [0, -25], [-8, -15], [8, -15],
  ],
  patrolRoutes: [
    [[-11, 2], [11, 2]],
    [[-11, -6], [11, -6]],
    [[-5, -20], [5, -20]],
  ],

  cameras: [
    { x: 0,   y: 2.8, z: 10,  angle: Math.PI },
    { x: -12, y: 2.8, z: -2,  angle: Math.PI * 0.5, panRange: 0.6 },
    { x: 12,  y: 2.8, z: -8,  angle: -Math.PI * 0.5 },
    { x: 0,   y: 2.8, z: -16, angle: Math.PI, range: 7 },
  ],

  interactables: [
    {
      id: 'sec_cameras', mesh: 'terminal', x: -8, z: -1, rotY: Math.PI,
      hint: '[F] Disable cameras', requireMask: true, once: true,
      actions: [
        { type: 'message', text: 'Security cameras disabled!', color: '#44ff88' },
        { type: 'sound', sound: 'pickup' },
      ],
    },
    {
      id: 'evidence_download', mesh: 'terminal', x: 0, z: -18, rotY: Math.PI,
      hint: 'Hold [F] Download evidence files', holdTime: 4, requireMask: true, once: true,
      actions: [
        { type: 'objective' },
        { type: 'message', text: 'Evidence files downloaded — bonus objective!', color: '#ffdd44' },
        { type: 'sound', sound: 'pickup' },
      ],
    },
  ],
}
