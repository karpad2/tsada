// ─────────────────────────────────────────────────────────────
// MAP 06 — ROYAL ART GALLERY
// Five exhibition halls, security offices, parking lot.
// Sold paintings are protected by security bars on alarm.
// Bypass: saw each painting (15 s) or hack security PC (3 min).
// Difficulty ★★  |  5 objectives
// ─────────────────────────────────────────────────────────────
export default {
  id:          'gallery',
  name:        'ROYAL ART GALLERY',
  desc:        'Steal five sold paintings before they leave the country.',
  difficulty:  2,
  vehicle:     'van',
  bagColor:    0x3a2a10,
  playerStart: [0, -18],
  barProtected: true,
  hack: { x: 1, z: 4, time: 180 },

  // ── Lights ───────────────────────────────────────────────
  lights: [
    // Lobby
    [0, 3.5, -16],  [-6, 3.5, -16],  [6, 3.5, -16],
    // Ticket area
    [0, 3.5, -9],
    // Access corridors
    [-10, 3.5, -4], [10, 3.5, -4],
    // Security offices
    [0, 3.5, 4],  [-4, 3.5, 4],  [4, 3.5, 4],
    // Hall A
    [-20, 3.5, 2],
    // Hall E
    [20, 3.5, 2],
    // Hall B
    [-12, 3.5, 16],
    // Hall C
    [0, 3.5, 16],
    // Hall D
    [12, 3.5, 16],
    // Parking lamps
    [-22, 6, -20, 0.8, 18],
    // Exterior
    [0, 6, -26, 0.6, 20],
  ],

  // ── Floors ───────────────────────────────────────────────
  floors: [
    // Exterior asphalt
    { x: 0, z: 0, w: 80, d: 70, tex: 'floor_asphalt' },
    // Parking lot
    { x: -22, z: -18, w: 14, d: 10, color: 0x3a3a36, y: 0.01 },
    // Sidewalk
    { x: 0, z: -22.5, w: 40, d: 1, color: 0x9a9890, y: 0.01 },
    // Lobby
    { x: 0, z: -16, w: 20, d: 8, tex: 'floor_marble', y: 0.02 },
    // Toilets
    { x: 16, z: -15, w: 6, d: 6, tex: 'floor_tile', y: 0.02 },
    // Ticket & info area
    { x: 0, z: -10, w: 20, d: 4, tex: 'floor_marble', y: 0.02 },
    // Access corridor left
    { x: -10, z: -2, w: 4, d: 12, tex: 'floor_stone', y: 0.02 },
    // Access corridor right
    { x: 10, z: -2, w: 4, d: 12, tex: 'floor_stone', y: 0.02 },
    // Security offices
    { x: 0, z: 4, w: 16, d: 8, tex: 'floor_carpet', y: 0.02 },
    // Hall A
    { x: -20, z: 2, w: 8, d: 12, tex: 'floor_wood', y: 0.02 },
    // Hall E
    { x: 20, z: 2, w: 8, d: 12, tex: 'floor_wood', y: 0.02 },
    // Hall B
    { x: -12, z: 16, w: 12, d: 8, tex: 'floor_wood', y: 0.02 },
    // Hall C
    { x: 0, z: 16, w: 12, d: 8, tex: 'floor_wood', y: 0.02 },
    // Hall D
    { x: 12, z: 16, w: 12, d: 8, tex: 'floor_wood', y: 0.02 },
  ],

  // ── Walls ────────────────────────────────────────────────
  walls: [
    // ═══ LOBBY (z = -20 to -12) ═══
    // South wall (front entrance gaps at x = -3..3)
    { x: -12.5, z: -20, w: 15, d: 0.4, tex: 'wall_marble' },
    { x:  12.5, z: -20, w: 15, d: 0.4, tex: 'wall_marble' },
    { x:  0,    z: -20, w: 6,  d: 0.4, y: 2.2, h: 1.8, tex: 'wall_marble' },
    // Lobby west wall
    { x: -10, z: -16, w: 0.4, d: 8, tex: 'wall_marble' },
    // Lobby east wall (gap to toilets at z = -14)
    { x: 10, z: -18, w: 0.4, d: 4, tex: 'wall_marble' },
    { x: 10, z: -14, w: 0.4, d: 4, tex: 'wall_marble' },
    // Lobby north wall (to ticket area, gap at x = -4..4)
    { x: -7, z: -12, w: 6, d: 0.4, tex: 'wall_marble' },
    { x:  7, z: -12, w: 6, d: 0.4, tex: 'wall_marble' },

    // ═══ TOILETS (x = 13..19, z = -18..-12) ═══
    { x: 19, z: -15, w: 0.4, d: 6 },
    { x: 16, z: -18, w: 6, d: 0.4 },
    { x: 16, z: -12, w: 6, d: 0.4 },

    // ═══ TICKET & INFO AREA (z = -12 to -8) ═══
    { x: -10, z: -10, w: 0.4, d: 4 },
    { x:  10, z: -10, w: 0.4, d: 4 },
    { x: -5,  z: -8,  w: 10, d: 0.4 },
    { x:  5,  z: -8,  w: 10, d: 0.4 },

    // ═══ ACCESS CORRIDORS ═══
    // Left corridor (x = -12 to -8, z = -8 to 4)
    { x: -12, z: -2, w: 0.4, d: 12 },
    { x: -8,  z: -2, w: 0.4, d: 12 },
    // Right corridor (x = 8 to 12, z = -8 to 4)
    { x: 8,  z: -2, w: 0.4, d: 12 },
    { x: 12, z: -2, w: 0.4, d: 12 },

    // ═══ SECURITY OFFICES (x = -8 to 8, z = 0 to 8) ═══
    { x: 0, z: 0, w: 16, d: 0.4 },
    // South wall of security (gap at x = -1..1 for door)
    { x: -4.5, z: 0, w: 7, d: 0.4 },
    { x:  4.5, z: 0, w: 7, d: 0.4 },
    { x: 0, z: 0, w: 2, d: 0.4, y: 2.2, h: 1.8 },
    // North wall of security (gaps to upper halls)
    { x: -4.5, z: 8, w: 7, d: 0.4 },
    { x:  4.5, z: 8, w: 7, d: 0.4 },
    // Security internal divider
    { x: 0, z: 4, w: 0.4, d: 8 },

    // ═══ HALL A (x = -24 to -16, z = -4 to 8) ═══
    { x: -24, z: 2,  w: 0.4, d: 12, breachable: true },
    { x: -16, z: -1, w: 0.4, d: 6  },
    { x: -16, z: 5,  w: 0.4, d: 6  },
    { x: -20, z: -4, w: 8,   d: 0.4 },
    { x: -20, z: 8,  w: 8,   d: 0.4 },

    // ═══ HALL E (x = 16 to 24, z = -4 to 8) ═══
    { x: 24, z: 2,  w: 0.4, d: 12, breachable: true },
    { x: 16, z: -1, w: 0.4, d: 6  },
    { x: 16, z: 5,  w: 0.4, d: 6  },
    { x: 20, z: -4, w: 8,   d: 0.4 },
    { x: 20, z: 8,  w: 8,   d: 0.4 },

    // ═══ HALL B (x = -18 to -6, z = 12 to 20) ═══
    { x: -18, z: 16, w: 0.4, d: 8 },
    { x: -6,  z: 16, w: 0.4, d: 8 },
    { x: -12, z: 20, w: 12,  d: 0.4, breachable: true },
    // South wall (gap at x = -12 for entry)
    { x: -15, z: 12, w: 6, d: 0.4 },
    { x: -9,  z: 12, w: 6, d: 0.4 },

    // ═══ HALL C (x = -6 to 6, z = 12 to 20) ═══
    { x: 0,  z: 20, w: 12, d: 0.4 },
    // South wall (gap at x = 0 for entry)
    { x: -3, z: 12, w: 6, d: 0.4 },
    { x:  3, z: 12, w: 6, d: 0.4 },

    // ═══ HALL D (x = 6 to 18, z = 12 to 20) ═══
    { x: 18, z: 16, w: 0.4, d: 8 },
    { x: 6,  z: 16, w: 0.4, d: 8 },
    { x: 12, z: 20, w: 12,  d: 0.4 },
    // South wall (gap at x = 12 for entry)
    { x: 9,  z: 12, w: 6, d: 0.4 },
    { x: 15, z: 12, w: 6, d: 0.4 },

    // ═══ FIRE EXIT (east side, z = -20) ═══
    { x: 22, z: -20, w: 4, d: 0.4 },
  ],

  // ── Props ──────────────────────────────────────────────
  props: [
    // Lobby furniture
    { type: 'sofa', x: -6, z: -18 },
    { type: 'sofa', x:  6, z: -18 },
    // Ticket desk
    { type: 'counter', x: 0, z: -10 },
    // Toilets
    { type: 'cabinet', x: 16, z: -16 },
    // Security office desks
    { type: 'desk', x: -4, z: 5 },
    { type: 'desk', x:  4, z: 5 },
    { type: 'server', x: -6, z: 6 },
    // Hall A exhibits (no objectives — just decoration)
    { type: 'pedestal', x: -20, z: 0 },
    { type: 'pedestal', x: -20, z: 4 },
    { type: 'displayCase', x: -22, z: 2 },
    // Hall E exhibits (no objectives — just decoration)
    { type: 'pedestal', x: 20, z: 0 },
    { type: 'pedestal', x: 20, z: 4 },
    { type: 'displayCase', x: 22, z: 2 },
    // Hall B exhibits
    { type: 'pedestal', x: -14, z: 16 },
    { type: 'pedestal', x: -10, z: 16 },
    { type: 'sofa', x: -12, z: 14 },
    // Hall C exhibits
    { type: 'pedestal', x: -2, z: 16 },
    { type: 'pedestal', x:  2, z: 16 },
    { type: 'sofa', x: 0, z: 14 },
    // Hall D exhibits
    { type: 'pedestal', x: 10, z: 16 },
    { type: 'pedestal', x: 14, z: 16 },
    { type: 'sofa', x: 12, z: 14 },
  ],

  // ── Zones ──────────────────────────────────────────────
  zones: [
    { type: 'public',  x: 0,   z: -16, w: 20, d: 8,  label: 'LOBBY' },
    { type: 'public',  x: 0,   z: -10, w: 20, d: 4,  label: 'TICKET & INFO' },
    { type: 'private', x: -10, z: -2,  w: 4,  d: 12, label: 'ACCESS CORRIDOR' },
    { type: 'private', x: 10,  z: -2,  w: 4,  d: 12, label: 'ACCESS CORRIDOR' },
    { type: 'secure',  x: 0,   z: 4,   w: 16, d: 8,  label: 'SECURITY OFFICES' },
    { type: 'private', x: -20, z: 2,   w: 8,  d: 12, label: 'HALL A' },
    { type: 'private', x: 20,  z: 2,   w: 8,  d: 12, label: 'HALL E' },
    { type: 'private', x: -12, z: 16,  w: 12, d: 8,  label: 'HALL B' },
    { type: 'private', x: 0,   z: 16,  w: 12, d: 8,  label: 'HALL C' },
    { type: 'private', x: 12,  z: 16,  w: 12, d: 8,  label: 'HALL D' },
  ],

  // ── Doors ──────────────────────────────────────────────
  doors: [
    // Ticket → left corridor
    { x: -10, z: -6, angle: Math.PI / 2, type: 'normal', w: 1.2 },
    // Ticket → right corridor
    { x: 10,  z: -6, angle: Math.PI / 2, type: 'normal', w: 1.2 },
    // Security office entrance (secure — mask required)
    { x: 0, z: 0, angle: 0, type: 'secure', w: 1.2 },
    // Hall A entry
    { x: -16, z: 2, angle: Math.PI / 2, type: 'normal', w: 1.2 },
    // Hall E entry
    { x: 16, z: 2, angle: Math.PI / 2, type: 'normal', w: 1.2 },
    // Hall B entry
    { x: -12, z: 12, angle: 0, type: 'normal', w: 1.2 },
    // Hall C entry
    { x: 0, z: 12, angle: 0, type: 'normal', w: 1.2 },
    // Hall D entry
    { x: 12, z: 12, angle: 0, type: 'normal', w: 1.2 },
    // Fire exit
    { x: 22, z: -20, angle: 0, type: 'normal', w: 1.2 },
  ],

  civilianTheme: 'museum',

  // ── Objectives (sold paintings — 5 total) ─────────────
  // 2 in Hall B, 1 in Hall C, 2 in Hall D
  objectives: [
    [-15, 16],    // Hall B — left painting
    [-9,  16],    // Hall B — right painting
    [0,   18],    // Hall C — masterpiece (center)
    [9,   16],    // Hall D — left painting
    [15,  16],    // Hall D — right painting
  ],

  bags: [],
  escape:     [0, -24, 2.5],
  exfilZones: [[-28, 0], [28, 0], [0, -30], [0, 24]],

  // ── Spawn points ───────────────────────────────────────
  spawnPoints: [
    [-26, 2], [26, 2],         // sides of halls A/E
    [-18, 22], [18, 22],       // behind halls B/D
    [0, -28], [24, -22],       // south (street, fire exit)
  ],

  // ── Patrol routes ──────────────────────────────────────
  patrolRoutes: [
    [[-10, -4], [10, -4]],                    // corridors
    [[-20, -2], [-20, 6]],                    // Hall A
    [[20, -2], [20, 6]],                      // Hall E
    [[-16, 16], [16, 16]],                    // across upper halls
  ],

  // ── Cameras ────────────────────────────────────────────
  cameras: [
    { x: 0,   y: 2.8, z: -14, angle: Math.PI,     range: 10 },  // lobby
    { x: -10, y: 2.8, z: -2,  angle: 0,            range: 8  },  // left corridor
    { x: 10,  y: 2.8, z: -2,  angle: 0,            range: 8  },  // right corridor
    { x: -12, y: 2.8, z: 19,  angle: Math.PI,      range: 8  },  // Hall B
    { x: 0,   y: 2.8, z: 19,  angle: Math.PI,      range: 8  },  // Hall C
    { x: 12,  y: 2.8, z: 19,  angle: Math.PI,      range: 8  },  // Hall D
  ],

  // ── Interactables ──────────────────────────────────────
  interactables: [
    {
      id: 'sec_cameras', mesh: 'terminal', x: -5, z: 6, rotY: Math.PI,
      hint: '[F] Disable cameras', requireMask: true, once: true,
      actions: [
        { type: 'message', text: 'Security cameras disabled!', color: '#44ff88' },
        { type: 'sound', sound: 'pickup' },
      ],
    },
    {
      id: 'alarm_btn', mesh: 'button', x: 5, z: 2, rotY: 0,
      hint: '[F] Emergency alarm',
      actions: [
        { type: 'alarm' },
        { type: 'spawnEnemies', count: 2, enemyType: 'cop_smg' },
        { type: 'message', text: 'ALARM TRIGGERED!', color: '#ff4444' },
      ],
    },
  ],

  // ── Pillars ────────────────────────────────────────────
  pillars: [
    { x: -10, z: -16 }, { x: 10, z: -16 },
    { x: -10, z: -12 }, { x: 10, z: -12 },
  ],
}
