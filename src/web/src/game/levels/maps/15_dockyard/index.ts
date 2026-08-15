// ─────────────────────────────────────────────────────────────
// MAP 15 — SOUTHERN DOCKYARD
// Massive outdoor container yard. Hard to navigate, harder to hold.
// Difficulty ★★★  |  6 objectives
// ─────────────────────────────────────────────────────────────
export default {
  id:          'dockyard',
  name:        'SOUTHERN DOCKYARD',
  desc:        'Six containers spread across the yard. Big and loud.',
  difficulty:  3,
  vehicle:     'truck',
  bagColor:    0x3a3028,
  playerStart: [0, 18],

  lights: [],  // outdoor

  floors: [
    { x: 0, z: -3, w: 42, d: 40, tex: 'floor_asphalt' },
  ],

  walls: [
    // Perimeter
    { x: -21, z: -3,  w: 0.4, d: 40, color: 0x5a6050, breachable: true },
    { x:  21, z: -3,  w: 0.4, d: 40, color: 0x5a6050, breachable: true },
    { x:   0, z: -23, w: 42,  d: 0.4, color: 0x5a6050, breachable: true },
    // Entrance barrier
    { x: -12, z: 17,  w: 18,  d: 0.4, h: 1.2, color: 0x5a6050 },
    { x:  12, z: 17,  w: 18,  d: 0.4, h: 1.2, color: 0x5a6050 },
    // Container rows (3×4 grid creating corridors)
    { x: -14, z:  4,  w: 2.4, h: 2.6, d: 6.0, color: 0x4a6a4a },
    { x: -14, z: -4,  w: 2.4, h: 2.6, d: 6.0, color: 0x4a6a4a },
    { x: -14, z:-12,  w: 2.4, h: 2.6, d: 6.0, color: 0x4a6a4a },
    { x:  -5, z:  4,  w: 2.4, h: 2.6, d: 6.0, color: 0x226644 },
    { x:  -5, z: -4,  w: 2.4, h: 2.6, d: 6.0, color: 0x226644 },
    { x:  -5, z:-12,  w: 2.4, h: 2.6, d: 6.0, color: 0x226644 },
    { x:   5, z:  4,  w: 2.4, h: 2.6, d: 6.0, color: 0x6a4a4a },
    { x:   5, z: -4,  w: 2.4, h: 2.6, d: 6.0, color: 0x6a4a4a },
    { x:  14, z:  4,  w: 2.4, h: 2.6, d: 6.0, color: 0x4a4a6a },
    { x:  14, z: -4,  w: 2.4, h: 2.6, d: 6.0, color: 0x4a4a6a },
    { x:  14, z:-12,  w: 2.4, h: 2.6, d: 6.0, color: 0x4a4a6a },
  ],

  props: [
    { type: 'crate', x: -18, z:  8,  size: 1.3 },
    { type: 'crate', x:  18, z:  8,  size: 1.3 },
    { type: 'barrel', x: -10, z: -16  },
    { type: 'barrel', x:  10, z: -16  },
    { type: 'barrel', x:   0, z: -20  },
    { type: 'fuelBarrel', x: -18, z: -16 },
    { type: 'fuelBarrel', x:  18, z: -16 },
    { type: 'fuelBarrel', x: -8,  z:  10 },
    { type: 'gasTank',    x:  8,  z:  10 },
  ],


  zones: [
    { type: 'public',  x: 0, z:  8,  w: 42, d: 18, label: 'PORT YARD'   },
    { type: 'private', x: 0, z: -5,  w: 42, d: 20, label: 'DOCK FLOOR'  },
    { type: 'secure',  x: 0, z: -14, w: 42, d:  8, label: 'CARGO ZONE'  },
  ],
  doors: [],
  civilianTheme: 'dockyard',
  objectives:   [[-14, 4], [-5, -4], [5, 4], [14, -4], [-14, -12], [5, -12]],
  escape:        [0, 22, 2.5],
  exfilZones:   [[-30, 0], [30, 0], [0, 30], [0, -32]],
  spawnPoints:  [
    [-23, -5], [23, -5], [-23, 5], [23, 5],
    [-10, -25], [10, -25], [0, -25],
  ],
  patrolRoutes: [
    [[-19, 8], [19, 8]],
    [[-19, 0], [19, 0]],
    [[-19, -16], [19, -16]],
  ],

  cameras: [
    { x: 0,   y: 3.5, z: 16,  angle: Math.PI, range: 10 },
    { x: -20, y: 3.5, z: -5,  angle: Math.PI * 0.5, range: 10 },
    { x: 20,  y: 3.5, z: -12, angle: -Math.PI * 0.5, range: 10 },
  ],

  interactables: [
    {
      id: 'sec_cameras', mesh: 'terminal', x: -19, z: 15, rotY: Math.PI * 0.5,
      hint: '[F] Disable cameras', requireMask: true, once: true,
      actions: [
        { type: 'message', text: 'Security cameras disabled!', color: '#44ff88' },
        { type: 'sound', sound: 'pickup' },
      ],
    },
  ],
}
