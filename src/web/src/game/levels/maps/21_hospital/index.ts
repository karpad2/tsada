// ─────────────────────────────────────────────────────────────
// MAP 21 — NO MERCY GENERAL HOSPITAL
// Break in, find patient zero, draw blood, analyse it in the lab.
// Difficulty ★★★  |  4 objectives
// ─────────────────────────────────────────────────────────────
export default {
  id:          'hospital',
  name:        'NO MERCY GENERAL',
  desc:        'Extract a blood sample from patient zero and analyse it.',
  difficulty:  3,
  vehicle:     'van',
  civilianTheme: 'hospital',
  civilianCount: 6,
  employeeCount: 5,
  playerStart: [0, 12],

  lights: [
    [-8, 3.2, 12], [8, 3.2, 12], [0, 3.2, 4], [-8, 3.2, -4], [8, 3.2, -4],
    [0, 3.2, -10], [-8, 3.2, -16], [8, 3.2, -16], [0, 3.2, -22],
    [0, 3.2, 20.5, 0.5, 5, 0x88ccff],   // elevator shaft — blue tint
  ],

  floors: [
    { x: 0, z: 10,  w: 22, d: 14, tex: 'floor_tile',     color: 0xe8e8e8 },
    { x: 0, z: -2,  w: 22, d: 10, tex: 'floor_tile',     color: 0xe0e8e0 },
    { x: 0, z: -14, w: 22, d: 14, tex: 'floor_concrete', color: 0xd8e0d8 },
    { x: 0, z: -26, w: 14, d: 10, tex: 'floor_tile',     color: 0xe8f0e8 },
  ],

  ceilings: [
    { x: 0, z: 10,  w: 22, d: 14, h: 4 },
    { x: 0, z: -2,  w: 22, d: 10, h: 4 },
    { x: 0, z: -14, w: 22, d: 14, h: 4 },
    { x: 0, z: -26, w: 14, d: 10, h: 4 },
    // Elevator shaft ceiling
    { x: 0, z: 20,  w: 3,  d: 6,  h: 4 },
  ],

  walls: [
    // ── Reception / Lobby (z: 3 to 17) ─────────────────────────
    { x: -11, z: 10, w: 0.4, d: 14, tex: 'wall_plaster', color: 0xf0f0ea },
    { x:  11, z: 10, w: 0.4, d: 14, tex: 'wall_plaster', color: 0xf0f0ea },
    // North lobby wall — split either side of elevator door
    { x: -6.2, z: 17, w: 9.6, d: 0.4, tex: 'wall_plaster', color: 0xf0f0ea },
    { x:  6.2, z: 17, w: 9.6, d: 0.4, tex: 'wall_plaster', color: 0xf0f0ea },
    { x:    0, z: 17, w: 1.4, d: 0.4, y: 2, h: 2 },   // door header
    // ── Elevator shaft (north of lobby) ──────────────────────────
    { x: -1.5, z: 20, w: 0.4, d: 6, color: 0x1a1a22 }, // left shaft wall
    { x:  1.5, z: 20, w: 0.4, d: 6, color: 0x1a1a22 }, // right shaft wall
    { x:    0, z: 23, w: 3.4, d: 0.4, color: 0x1a1a22 }, // back wall
    // Left reception wing wall (partial, leaves door gap)
    { x: -6.2, z: 3, w: 9.6, d: 0.4, tex: 'wall_plaster', color: 0xf0f0ea },
    { x:  6.2, z: 3, w: 9.6, d: 0.4, tex: 'wall_plaster', color: 0xf0f0ea },
    // Door header above corridor gap
    { x: 0, z: 3, w: 1.4, d: 0.4, y: 2, h: 2 },

    // ── Corridor (z: -2 to 3) ───────────────────────────────────
    { x: -11, z: -2, w: 0.4, d: 10, tex: 'wall_plaster', color: 0xf0f0ea },
    { x:  11, z: -2, w: 0.4, d: 10, tex: 'wall_plaster', color: 0xf0f0ea },
    // Left corridor wall with door gap at x=-5
    { x: -8.1, z: -7, w: 5.8, d: 0.4, tex: 'wall_plaster', color: 0xf0f0ea },
    { x: -3.9, z: -7, w: 6.2, d: 0.4, tex: 'wall_plaster', color: 0xf0f0ea },
    { x: -0.6, z: -7, w: 1.2, d: 0.4, y: 2, h: 2 },
    // Right corridor wall with door gap at x=5
    { x:  8.1, z: -7, w: 5.8, d: 0.4, tex: 'wall_plaster', color: 0xf0f0ea },
    { x:  3.9, z: -7, w: 6.2, d: 0.4, tex: 'wall_plaster', color: 0xf0f0ea },
    { x:  0.6, z: -7, w: 1.2, d: 0.4, y: 2, h: 2 },

    // ── Patient ward (z: -7 to -21) ─────────────────────────────
    { x: -11, z: -14, w: 0.4, d: 14, tex: 'wall_plaster', color: 0xf0f0ea, breachable: true },
    { x:  11, z: -14, w: 0.4, d: 14, tex: 'wall_plaster', color: 0xf0f0ea, breachable: true },
    { x: -4.8, z: -21, w: 12.4, d: 0.4, tex: 'wall_plaster', color: 0xf0f0ea },
    { x:  4.8, z: -21, w: 12.4, d: 0.4, tex: 'wall_plaster', color: 0xf0f0ea },
    { x: -0.6, z: -21, w: 1.2,  d: 0.4, y: 2, h: 2 },
    // Centre divider wall (patient rooms left/right)
    { x: 0, z: -13.5, w: 0.3, d: 11, tex: 'wall_plaster', color: 0xeeeee8 },

    // ── Lab (z: -21 to -31) ──────────────────────────────────────
    { x: -7, z: -26, w: 0.4, d: 10, tex: 'wall_concrete', color: 0xe0e8e0 },
    { x:  7, z: -26, w: 0.4, d: 10, tex: 'wall_concrete', color: 0xe0e8e0 },
    { x:  0, z: -31, w: 14,  d: 0.4, tex: 'wall_concrete', color: 0xe0e8e0, breachable: true },
  ],

  props: [
    // Reception desk
    { type: 'counter', x:  0, z: 14, w: 5, d: 0.7 },
    // Waiting room chairs (sofas)
    { type: 'sofa', x: -7, z: 12 }, { type: 'sofa', x: 7, z: 12 },
    { type: 'sofa', x: -7, z: 7 },  { type: 'sofa', x: 7, z: 7 },
    // Nurse station (private zone)
    { type: 'desk',   x: -7, z: 0 }, { type: 'desk', x: 7, z: 0 },
    { type: 'locker', x: -9, z: 0 }, { type: 'locker', x: 9, z: 0 },
    // Patient beds (gurneys) — left ward
    { type: 'gurney', x: -7, z: -10 }, { type: 'gurney', x: -7, z: -13 },
    { type: 'gurney', x: -7, z: -16 }, { type: 'gurney', x: -7, z: -19 },
    // Patient beds — right ward
    { type: 'gurney', x: 7, z: -10 }, { type: 'gurney', x: 7, z: -13 },
    { type: 'gurney', x: 7, z: -16 }, { type: 'gurney', x: 7, z: -19 },
    // Surgical stations (drill/saw tables) in centre corridor
    { type: 'workbench', x: -2, z: -10 }, { type: 'workbench', x: 2, z: -10 },
    { type: 'cabinet',   x: -2, z: -12 }, { type: 'cabinet',   x: 2, z: -12 },
    { type: 'cabinet',   x: -2, z: -16 }, { type: 'cabinet',   x: 2, z: -16 },
    // Lab equipment
    { type: 'server',  x: -4, z: -24 }, { type: 'server', x: 4, z: -24 },
    { type: 'workbench', x: -4, z: -28 }, { type: 'workbench', x: 4, z: -28 },
    { type: 'safe',    x: 0, z: -29 },
    { type: 'console', x: -2, z: -26 }, { type: 'console', x: 2, z: -26 },
  ],

  zones: [
    { type: 'public',  x: 0,  z: 10,  w: 22, d: 14, label: 'WAITING ROOM'  },
    { type: 'private', x: 0,  z: -2,  w: 22, d: 10, label: 'NURSE STATION' },
    { type: 'secure',  x: 0,  z: -14, w: 22, d: 14, label: 'PATIENT WARD'  },
    { type: 'secure',  x: 0,  z: -26, w: 14, d: 10, label: 'LAB'           },
  ],

  doors: [
    { x: -0.6, z: 17,  angle: 0, type: 'normal', w: 1.2 },  // lobby → elevator
    { x: -0.6, z: 3,   angle: 0, type: 'normal', w: 1.2 },  // lobby → corridor
    { x: -5.6, z: -7,  angle: 0, type: 'normal', w: 1.2 },
    { x:  4.4, z: -7,  angle: 0, type: 'normal', w: 1.2 },
    { x: -0.6, z: -21, angle: 0, type: 'secure', w: 1.2 },
  ],

  objectives: [
    { type: 'bag', x: -7, z: -11 },
    { type: 'bag', x:  7, z: -17 },
    { type: 'code', x: -2, z: -26 },
    { type: 'bag', x: 0, z: -27 },
  ],

  escape: [0, 20.5, 1.5],   // inside elevator shaft

  exfilZones: [[-20, 0], [20, 0], [0, 28], [0, -42]],
  spawnPoints: [
    [-14, 5], [14, 5], [-14, -5], [14, -5],
    [-14, -18], [14, -18], [0, -34],
  ],

  patrolRoutes: [
    [[-8, 8], [8, 8]],
    [[-8, -2], [8, -2]],
    [[-8, -14], [0, -14]],
    [[0, -14], [8, -14]],
  ],

  cameras: [
    { x: 0,   y: 2.8, z: 16,  angle: Math.PI },
    { x: -10, y: 2.8, z: 0,   angle: Math.PI * 0.5, panRange: 0.6 },
    { x: 10,  y: 2.8, z: -14, angle: -Math.PI * 0.5, panRange: 0.6 },
    { x: 0,   y: 2.8, z: -28, angle: 0, range: 7 },
  ],

  interactables: [
    {
      id: 'sec_cameras', mesh: 'terminal', x: 7, z: 1, rotY: -Math.PI * 0.5,
      hint: '[F] Disable cameras', requireMask: true, once: true,
      actions: [
        { type: 'message', text: 'Security cameras disabled!', color: '#44ff88' },
        { type: 'sound', sound: 'pickup' },
      ],
    },
    {
      id: 'lab_access', mesh: 'terminal', x: -2, z: -22, rotY: Math.PI,
      hint: 'Hold [F] Override lab access', holdTime: 3, requireMask: true, once: true,
      actions: [
        { type: 'openDoor', doorIndex: 4 },
        { type: 'message', text: 'Lab door overridden!', color: '#ffdd44' },
        { type: 'sound', sound: 'doorOpen' },
      ],
    },
  ],
}
