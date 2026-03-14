// ─────────────────────────────────────────────────────────────
// MAP 05 — GOLDEN PALACE CASINO
// Huge gaming floor with a fortified cash vault at the back.
// Difficulty ★★  |  6 objectives
// ─────────────────────────────────────────────────────────────
export default {
  id:          'casino',
  name:        'GOLDEN PALACE CASINO',
  desc:        'Hit the tables. The real money is in the vault.',
  difficulty:  2,
  vehicle:     'truck',
  bagColor:    0x1a1000,
  playerStart: [0, 14],

  lights: [
    [-12, 3.5, 2],  [0, 3.5, 2],  [12, 3.5, 2],
    [-12, 3.5, -6], [0, 3.5, -6], [12, 3.5, -6],
    [0,   3.5, -18],
  ],

  floors: [
    { x: 0,   z: -1,  w: 38, d: 28, tex: 'floor_casino' },
    { x: 0,   z: -20, w: 12, d: 10, color: 0x303030      },
  ],

  walls: [
    { x: -19, z: -1,  w: 0.4, d: 28, breachable: true },
    { x:  19, z: -1,  w: 0.4, d: 28, breachable: true },
    { x:   0, z: -15, w: 38,  d: 0.4, breachable: true },
    { x: -12, z: 13,  w: 14,  d: 0.4 },
    { x:  12, z: 13,  w: 14,  d: 0.4 },
    { x:   0, z: 13,  w: 10,  d: 0.4, y: 2, h: 2 },
    // Vault room
    { x: -6,  z: -20, w: 0.4, d: 10 },
    { x:  6,  z: -20, w: 0.4, d: 10 },
    { x:  0,  z: -25, w: 12,  d: 0.4 },
    { x:  0,  z: -15, w: 6.4, d: 0.4, y: 2, h: 2 },
  ],

  props: [
    // Gaming tables (3 rows × 3 columns)
    { type: 'table', x: -12, z:  4 },
    { type: 'table', x:   0, z:  4 },
    { type: 'table', x:  12, z:  4 },
    { type: 'table', x: -12, z: -2 },
    { type: 'table', x:   0, z: -2 },
    { type: 'table', x:  12, z: -2 },
    { type: 'table', x: -12, z: -8 },
    { type: 'table', x:   0, z: -8 },
    { type: 'table', x:  12, z: -8 },
    // Bar counter
    { type: 'counter', x: -14.5, z: 10, w: 8, h: 1.1, d: 0.6, color: 0x3a1a08, hp: 130 },
    // Vault safes
    { type: 'safe', x: -3, z: -23 },
    { type: 'safe', x:  3, z: -23 },
    // Slot machine row
    { x: 16, z: 2,  w: 0.7, h: 1.5, d: 0.5, color: 0x880033, hp: 40 },
    { x: 16, z: 0,  w: 0.7, h: 1.5, d: 0.5, color: 0x880033, hp: 40 },
    { x: 16, z: -2, w: 0.7, h: 1.5, d: 0.5, color: 0x880033, hp: 40 },
    { x: 16, z: -4, w: 0.7, h: 1.5, d: 0.5, color: 0x880033, hp: 40 },
  ],


  zones: [
    { type: 'public',  x: 0, z:  2,  w: 38, d: 22, label: 'GAMING FLOOR' },
    { type: 'private', x: 0, z: -10, w: 38, d: 10, label: 'STAFF AREA'   },
    { type: 'secure',  x: 0, z: -20, w: 12, d: 10, label: 'VAULT'         },
  ],
  doors: [
    { x: -3.2, z: -15, angle: 0, type: 'secure', w: 1.2 },
  ],
  civilianTheme: 'casino',
  objectives:   [[-12, 4], [0, 4], [12, 4], [0, -8], [-3, -23.5], [3, -23.5]],
  escape:        [0, 18, 2.5],
  exfilZones:   [[-26, 0], [26, 0], [0, 24], [0, -32]],
  spawnPoints:  [[-21, -8], [21, -8], [-21, 8], [21, 8], [0, -27], [-14, -12], [14, -12]],
  patrolRoutes: [
    [[-15, 4], [15, 4]],
    [[-14, -5], [14, -5]],
    [[-3, -17], [3, -17]],
  ],

  cameras: [
    { x: 0,   y: 2.8, z: 12,  angle: Math.PI },
    { x: -18, y: 2.8, z: 2,   angle: Math.PI * 0.5, panRange: 0.7 },
    { x: 18,  y: 2.8, z: -6,  angle: -Math.PI * 0.5 },
    { x: 0,   y: 2.8, z: -18, angle: Math.PI, range: 7 },
  ],

  interactables: [
    {
      id: 'casino_cams', mesh: 'terminal', x: -16, z: -12, rotY: 0,
      hint: '[F] Disable vault cameras', requireMask: true, once: true,
      actions: [
        { type: 'message', text: 'Vault cameras offline!', color: '#44ff88' },
        { type: 'sound', sound: 'pickup' },
      ],
    },
    {
      id: 'vault_hack', mesh: 'terminal', x: -1, z: -16, rotY: Math.PI,
      hint: 'Hold [F] Hack vault terminal', holdTime: 5, requireMask: true, once: true,
      actions: [
        { type: 'openDoor', doorIndex: 0 },
        { type: 'message', text: 'Vault door unlocked!', color: '#ffdd44' },
        { type: 'sound', sound: 'doorOpen' },
      ],
    },
  ],
}
