// ─────────────────────────────────────────────────────────────
// MAP 14 — ARMORED TRUCK AMBUSH
// Open street scene. You crack the truck in the middle of traffic.
// Difficulty ★★  |  4 objectives
// ─────────────────────────────────────────────────────────────
export default {
  id:          'armored',
  name:        'ARMORED TRUCK AMBUSH',
  desc:        'Truck is stalled. Hit it fast before backup arrives.',
  difficulty:  2,
  vehicle:     'van',
  vehicleAngle: Math.PI / 2,
  bagColor:    0x3a2800,
  playerStart: [0, 14],

  lights: [],  // outdoor, no interior lights

  floors: [
    { x: 0, z: -2, w: 38, d: 32, tex: 'floor_asphalt' },
  ],

  walls: [
    // Perimeter buildings (suggestions)
    { x: -19, z: -2,  w: 0.4, d: 32, color: 0x8a8070, tex: 'wall_brick', breachable: true },
    { x:  19, z: -2,  w: 0.4, d: 32, color: 0x8a8070, tex: 'wall_brick', breachable: true },
    { x:   0, z: -18, w: 38,  d: 0.4, color: 0x8a8070, tex: 'wall_brick', breachable: true },
    // Parked cars as cover (treated as walls)
    { x: -12, z:  4,  w: 1.8, h: 1.4, d: 3.8, color: 0x334466 },
    { x: -12, z: -2,  w: 1.8, h: 1.4, d: 3.8, color: 0xaa3322 },
    { x:  12, z:  4,  w: 1.8, h: 1.4, d: 3.8, color: 0x228833 },
    { x:  12, z: -2,  w: 1.8, h: 1.4, d: 3.8, color: 0x555522 },
    // Dumpsters
    { x: -16, z: -6,  w: 1.4, h: 1.2, d: 2.8, color: 0x336633 },
    { x:  16, z: -6,  w: 1.4, h: 1.2, d: 2.8, color: 0x336633 },
    // Police barricades
    { x: -6,  z:  8,  w: 4,   h: 0.9, d: 0.4, color: 0x1122aa },
    { x:  6,  z:  8,  w: 4,   h: 0.9, d: 0.4, color: 0x1122aa },
    // Armored truck itself (in center of scene)
    { x: 0,   z: -4,  w: 2.6, h: 2.0, d: 6.0, color: 0x3a4a3a },
  ],

  props: [
    { type: 'barrel', x: -8,  z:  6 },
    { type: 'barrel', x:  8,  z:  6 },
    { type: 'crate',  x: -8,  z: -10 },
    { type: 'crate',  x:  8,  z: -10 },
  ],


  zones: [
    { type: 'public', x: 0, z:  4,  w: 38, d: 22, label: 'STREET'        },
    { type: 'secure', x: 0, z: -6,  w:  6, d: 10, label: 'ARMORED TRUCK' },
  ],
  doors: [],
  civilianTheme: 'warehouse',
  objectives:   [[0, -3], [0, -5], [-1, -8], [1, -8]],
  escape:        [0, 18, 2.5],
  exfilZones:   [[-28, 0], [28, 0], [0, 24], [0, -24]],
  spawnPoints:  [
    [-21, -5], [21, -5], [-21, 5], [21, 5],
    [-8, -18.5], [8, -18.5],
  ],
  patrolRoutes: [
    [[-18, 0], [18, 0]],
    [[-15, -12], [15, -12]],
  ],

  cameras: [
    { x: -18, y: 3.5, z: 4,  angle: Math.PI * 0.5, range: 10 },
    { x: 18,  y: 3.5, z: -4, angle: -Math.PI * 0.5, range: 10 },
  ],

  interactables: [
    {
      id: 'truck_hack', mesh: 'terminal', x: 2, z: -6, rotY: Math.PI * 0.5,
      hint: 'Hold [F] Hack truck lock', holdTime: 3, requireMask: true, once: true,
      actions: [
        { type: 'message', text: 'Truck lock cracked — grab the loot!', color: '#ffdd44' },
        { type: 'sound', sound: 'doorOpen' },
      ],
    },
  ],
}
