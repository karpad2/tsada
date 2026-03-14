// ─────────────────────────────────────────────────────────────
// MAP 09 — METRO AIRPORT CARGO
// Huge hangar with containers and a secure terminal section.
// Difficulty ★★★  |  6 objectives
// ─────────────────────────────────────────────────────────────
export default {
  id:          'airport',
  name:        'METRO AIRPORT CARGO',
  desc:        'Six shipments. Hangar is wide open — stay low.',
  difficulty:  3,
  vehicle:     'truck',
  bagColor:    0x3a3028,
  playerStart: [0, 16],

  lights: [
    [-16, 4, 2], [0, 4, 2], [16, 4, 2],
    [-16, 4, -8], [0, 4, -8], [16, 4, -8],
    [14, 3.5, -20],
  ],

  floors: [
    { x: 0,   z: -2,  w: 40, d: 32, tex: 'floor_concrete' },
    { x: 14,  z: -20, w: 10, d: 10, color: 0x3a3840        },
  ],

  walls: [
    { x: -20, z: -2,  w: 0.4, d: 32, breachable: true },
    { x:  20, z: -2,  w: 0.4, d: 32, breachable: true },
    { x:   0, z: -18, w: 40,  d: 0.4, breachable: true },
    // Entrance (wide)
    { x: -14, z: 14,  w: 12,  d: 0.4 },
    { x:  14, z: 14,  w: 12,  d: 0.4 },
    { x:   0, z: 14,  w: 16,  d: 0.4, y: 2, h: 2 },
    // Terminal section
    { x:  9,  z: -20, w: 0.4, d: 10 },
    { x:  14, z: -25, w: 10,  d: 0.4 },
    { x:  14, z: -15, w: 10,  d: 0.4, y: 2, h: 2 },
    // Container stacks (as walls)
    { x: -14, z:  2,  w: 2.4, h: 2.6, d: 6.0, color: 0x4a6a4a },
    { x:  -6, z:  2,  w: 2.4, h: 2.6, d: 6.0, color: 0x226644 },
    { x:   6, z:  2,  w: 2.4, h: 2.6, d: 6.0, color: 0x4a4a6a },
    { x:  14, z:  2,  w: 2.4, h: 2.6, d: 6.0, color: 0x6a4a4a },
    { x: -14, z: -8,  w: 2.4, h: 2.6, d: 6.0, color: 0x4a6a4a },
    { x:  -6, z: -8,  w: 2.4, h: 2.6, d: 6.0, color: 0x226644 },
  ],

  props: [
    { type: 'crate', x: -10, z: -2,  size: 1.4 },
    { type: 'crate', x:  10, z: -2,  size: 1.4 },
    { type: 'crate', x: -18, z: -10  },
    { type: 'crate', x:  18, z: -10  },
    { type: 'barrel', x: 2, z: -12   },
    { type: 'barrel', x: -2, z: -12  },
    // Terminal
    { type: 'desk',    x: 12, z: -18.8 },
    { type: 'console', x: 16, z: -22 },
    { type: 'filecab', x: 18, z: -23 },
    { type: 'cargobox', x: 12, z: -22 },
  ],


  zones: [
    { type: 'public',  x:  0,  z:  6,  w: 40, d: 18, label: 'TERMINAL'    },
    { type: 'private', x:  0,  z: -6,  w: 40, d: 14, label: 'CARGO AREA'  },
    { type: 'secure',  x: 14,  z: -20, w: 10, d: 10, label: 'RESTRICTED'  },
  ],
  doors: [
    { x: -0.6, z:  2,  angle: 0, type: 'normal', w: 1.2 },
    { x: 13.4, z: -14, angle: 0, type: 'secure', w: 1.2 },
  ],
  civilianTheme: 'default',
  objectives:   [[-14, 2], [6, 2], [-14, -8], [-6, -8], [12, -18.5], [12, -22.5]],
  escape:        [0, 20, 2.5],
  exfilZones:   [[-30, 0], [30, 0], [0, 28], [0, -32]],
  spawnPoints:  [
    [-22, -6], [22, -6], [-22, 6], [22, 6],
    [0, -20], [16, -26],
  ],
  patrolRoutes: [
    [[-18, 4], [18, 4]],
    [[-18, -12], [8, -12]],
    [[10, -18], [18, -18]],
  ],

  cameras: [
    { x: 0,   y: 2.8, z: 13,  angle: Math.PI },
    { x: -19, y: 2.8, z: 2,   angle: Math.PI * 0.5, panRange: 0.7 },
    { x: 19,  y: 2.8, z: -8,  angle: -Math.PI * 0.5 },
    { x: 14,  y: 2.8, z: -16, angle: Math.PI, range: 7 },
  ],

  interactables: [
    {
      id: 'sec_cameras', mesh: 'terminal', x: 16, z: -20, rotY: 0,
      hint: '[F] Disable cameras', requireMask: true, once: true,
      actions: [
        { type: 'message', text: 'Security cameras disabled!', color: '#44ff88' },
        { type: 'sound', sound: 'pickup' },
      ],
    },
  ],
}
