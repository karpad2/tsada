// ─────────────────────────────────────────────────────────────
// MAP 04 — NEXUS CORPORATE TOWER
// Open-plan office with a locked server room in the corner.
// Difficulty ★★  |  5 objectives
// ─────────────────────────────────────────────────────────────
export default {
  id:          'office',
  name:        'NEXUS CORPORATE TOWER',
  desc:        'Steal the server drives. Guards everywhere.',
  difficulty:  2,
  vehicle:     'van',
  bagColor:    0x1a1a2a,
  playerStart: [0, 12],

  lights: [
    [-8, 3.5, 2], [0, 3.5, 2], [8, 3.5, 2],
    [-8, 3.5, -8], [8, 3.5, -8],
    [10, 3.5, -16],
  ],

  floors: [
    { x: 0,   z: -2, w: 30, d: 26, tex: 'floor_carpet' },
    { x: 10,  z: -16, w: 8, d: 10, color: 0x282838      },
  ],

  walls: [
    // Perimeter
    { x: -15, z: -2,  w: 0.4, d: 26, breachable: true },
    { x:  15, z: -2,  w: 0.4, d: 26, breachable: true },
    { x:   0, z: -15, w: 30,  d: 0.4, breachable: true },
    // Front entrance (two segments + header)
    { x: -10, z: 11,  w: 10,  d: 0.4 },
    { x:  10, z: 11,  w: 10,  d: 0.4 },
    { x:   0, z: 11,  w: 10,  d: 0.4, y: 2, h: 2 },
    // Internal divider (partial, creates cubicle zone)
    { x: -8,  z: -5,  w: 14,  d: 0.4, h: 1.2 },
    // Server room (corner)
    { x:  6,  z: -11, w: 0.4, d: 10 },
    { x:  0,  z: -11, w: 12,  d: 0.4 },
    { x:  0,  z: -11, w: 6.4, d: 0.4, y: 2, h: 2 },
  ],

  props: [
    // Cubicle clusters
    { type: 'desk', x: -10, z:  5 },
    { type: 'desk', x:  -7, z:  5 },
    { type: 'desk', x:  -4, z:  5 },
    { type: 'desk', x:   2, z:  5 },
    { type: 'desk', x:   5, z:  5 },
    { type: 'desk', x:  -10, z:  1 },
    { type: 'desk', x:   -7, z:  1 },
    { type: 'desk', x:   -4, z:  1 },
    { type: 'desk', x:    2, z:  1 },
    { type: 'desk', x:    5, z:  1 },
    // Filing cabinets
    { type: 'filecab', x: -12, z:  4 },
    { type: 'filecab', x: -12, z:  0 },
    { type: 'filecab', x:  12, z:  4 },
    // Sofa lounge area
    { type: 'sofa', x: -4, z: 8 },
    { type: 'sofa', x:  4, z: 8 },
    // Server room racks
    { type: 'server', x: 9, z: -12 },
    { type: 'server', x: 9, z: -14 },
    { type: 'server', x: 11, z: -12 },
    { type: 'server', x: 11, z: -14 },
    { type: 'server', x: 13, z: -12 },
  ],


  zones: [
    { type: 'public',  x:  0, z:  7,  w: 30, d:  8, label: 'LOBBY'       },
    { type: 'private', x:  0, z: -3,  w: 30, d: 12, label: 'OFFICE FLOOR' },
    { type: 'secure',  x: 10, z: -16, w:  8, d: 10, label: 'SERVER ROOM'  },
  ],
  doors: [
    { x: -0.6, z: 2,   angle: 0, type: 'normal', w: 1.2 },
    { x: 9.4,  z: -11, angle: 0, type: 'secure', w: 1.2 },
  ],
  civilianTheme: 'office',
  objectives:   [[-9, 3], [4, 3], [-6, -8], [9, -12.5], [11, -14.5]],
  escape:        [0, 16, 2.5],
  exfilZones:   [[-22, 0], [22, 0], [0, 22], [0, -22]],
  spawnPoints:  [[-17, -8], [17, -8], [-17, 8], [17, 8], [0, -17], [14, -17]],
  patrolRoutes: [
    [[-12, 4], [12, 4]],
    [[-10, -2], [10, -2]],
    [[5, -8], [13, -8]],
  ],

  cameras: [
    { x: 0,   y: 2.8, z: 10,  angle: Math.PI },
    { x: -14, y: 2.8, z: 2,   angle: Math.PI * 0.5, panRange: 0.6 },
    { x: 14,  y: 2.8, z: -5,  angle: -Math.PI * 0.5 },
    { x: 10,  y: 2.8, z: -12, angle: Math.PI, range: 6 },
  ],

  interactables: [
    {
      id: 'sec_cameras', mesh: 'terminal', x: -12, z: 2, rotY: Math.PI * 0.5,
      hint: '[F] Disable cameras', requireMask: true, once: true,
      actions: [
        { type: 'message', text: 'Security cameras disabled!', color: '#44ff88' },
        { type: 'sound', sound: 'pickup' },
      ],
    },
    {
      id: 'server_hack', mesh: 'terminal', x: 10, z: -13, rotY: Math.PI,
      hint: 'Hold [F] Hack server mainframe', holdTime: 4, requireMask: true, once: true,
      actions: [
        { type: 'objective' },
        { type: 'message', text: 'Server data downloaded — bonus objective!', color: '#ffdd44' },
        { type: 'sound', sound: 'pickup' },
      ],
    },
  ],
}
