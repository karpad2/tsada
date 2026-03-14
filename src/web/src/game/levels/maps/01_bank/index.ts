// ─────────────────────────────────────────────────────────────
// MAP — FIRST NATIONAL BANK
// Rob the main vault. Classic heist.
// Difficulty ★  |  3 objectives
// ─────────────────────────────────────────────────────────────
export default {
  id: 'bank',
  name: 'BANK',
  desc: 'Classic heist.',
  difficulty: 1,
  vehicle: 'van',
  bagColor: 3811328,
  playerStart: [
    0,
    20
  ],
  lights: [
    [
      -6,
      3.5,
      9
    ],
    [
      6,
      3.5,
      9
    ],
    [
      0,
      3.5,
      7
    ],
    [
      -6,
      3.5,
      5
    ],
    [
      6,
      3.5,
      5
    ],
    [
      4,
      3.5,
      1
    ],
    [
      10,
      3.5,
      1
    ],
    [
      -11,
      3.5,
      1
    ],
    [
      -2,
      3.5,
      -5
    ],
    [
      -9,
      3.5,
      -8
    ],
    [
      -9,
      3.5,
      -11
    ],
    [
      9,
      3.5,
      -5
    ],
    [
      9,
      3.5,
      -11
    ],
    [
      -10,
      6,
      20,
      1,
      22
    ],
    [
      10,
      6,
      20,
      1,
      22
    ],
    [
      -6,
      6,
      -20,
      0.8,
      18
    ],
    [
      6,
      6,
      -20,
      0.8,
      18
    ]
  ],
  floors: [
    {
      x: 0,
      z: 0,
      w: 80,
      d: 70,
      tex: 'floor_asphalt'
    },
    {
      x: 0,
      z: 13.5,
      w: 34,
      d: 1,
      color: 10131600,
      y: 0.01
    },
    {
      x: 0,
      z: -13.5,
      w: 34,
      d: 1,
      color: 10131600,
      y: 0.01
    },
    {
      x: -15.5,
      z: 0,
      w: 1,
      d: 26,
      color: 10131600,
      y: 0.01
    },
    {
      x: 15.5,
      z: 0,
      w: 1,
      d: 26,
      color: 10131600,
      y: 0.01
    },
    {
      x: 0,
      z: -20,
      w: 28,
      d: 10,
      color: 3815990,
      y: 0.01
    },
    {
      x: 0,
      z: 8,
      w: 28,
      d: 8,
      tex: 'floor_tile',
      y: 0.02
    },
    {
      x: 0,
      z: 0.5,
      w: 28,
      d: 7,
      tex: 'floor_tile',
      y: 0.02
    },
    {
      x: 0,
      z: -8,
      w: 28,
      d: 10,
      tex: 'floor_tile',
      y: 0.02
    },
    {
      x: -9,
      z: -9,
      w: 10,
      d: 8,
      tex: 'floor_concrete',
      y: 0.03
    }
  ],
  walls: [
    {
      x: -11.5,
      z: 12,
      w: 5,
      d: 0.4,
      tex: 'wall_brick'
    },
    {
      x: -6,
      z: 12,
      w: 6,
      d: 0.3,
      window: true,
      windowY: 0.8,
      windowH: 2,
      tex: 'wall_brick'
    },
    {
      x: 6,
      z: 12,
      w: 6,
      d: 0.3,
      window: true,
      windowY: 0.8,
      windowH: 2,
      tex: 'wall_brick'
    },
    {
      x: 11.5,
      z: 12,
      w: 5,
      d: 0.4,
      tex: 'wall_brick'
    },
    {
      x: -7.475,
      z: -13,
      w: 13.05,
      d: 0.4,
      tex: 'wall_brick'
    },
    {
      x: 10.28,
      z: -13,
      w: 7.5,
      d: 0.4,
      tex: 'wall_brick'
    },
    {
      x: 0,
      z: -13,
      w: 1.9,
      d: 0.4,
      y: 2.2,
      h: 1.8,
      tex: 'wall_brick'
    },
    {
      x: -14,
      z: 10,
      w: 0.4,
      d: 4,
      tex: 'wall_brick'
    },
    {
      x: -14,
      z: 6,
      w: 0.4,
      d: 4,
      window: true,
      windowY: 1,
      windowH: 1.5,
      tex: 'wall_brick'
    },
    {
      x: -14,
      z: -8,
      w: 0.4,
      d: 10,
      tex: 'wall_brick'
    },
    {
      x: 14,
      z: 10,
      w: 0.4,
      d: 3.9,
      tex: 'wall_brick'
    },
    {
      x: 14,
      z: 6.1,
      w: 0.4,
      d: 4,
      window: true,
      windowY: 1,
      windowH: 1.5,
      tex: 'wall_brick'
    },
    {
      x: -7.55,
      z: 4,
      w: 12.9,
      d: 0.3,
      tex: 'wall_plaster',
      destructible: true
    },
    {
      x: 7.25,
      z: 4,
      w: 13.5,
      d: 0.3,
      tex: 'wall_plaster',
      destructible: true
    },
    {
      x: -0.3,
      z: 4,
      w: 1.6,
      d: 0.3,
      y: 2.2,
      h: 1.8
    },
    {
      x: -8,
      z: 2.3,
      w: 0.3,
      d: 3.4,
      tex: 'wall_plaster',
      destructible: true
    },
    {
      x: -8,
      z: -1.9,
      w: 0.3,
      d: 2.2,
      tex: 'wall_plaster',
      destructible: true
    },
    {
      x: -8,
      z: -0.1,
      w: 0.3,
      d: 1.4,
      y: 2.2,
      h: 1.8
    },
    {
      x: -7.55,
      z: -3,
      w: 12.9,
      d: 0.3,
      tex: 'wall_plaster'
    },
    {
      x: 7.15,
      z: -2.95,
      w: 13.7,
      d: 0.4,
      tex: 'wall_plaster',
      destructible: true
    },
    {
      x: -0.4,
      z: -3,
      w: 1.4,
      d: 0.3,
      y: 2.2,
      h: 1.8
    },
    {
      x: -4,
      z: -5.15,
      w: 0.5,
      d: 4.3,
      color: 5265520,
      tex: 'wall_concrete'
    },
    {
      x: -4,
      z: -10.85,
      w: 0.5,
      d: 4.3,
      color: 5265520,
      tex: 'wall_concrete'
    },
    {
      x: -4,
      z: -8,
      w: 0.5,
      d: 1.4,
      y: 2.2,
      h: 1.8,
      color: 5265520,
      tex: 'wall_concrete'
    },
    {
      x: 5,
      z: -4,
      w: 0.3,
      d: 2,
      tex: 'wall_plaster',
      destructible: true
    },
    {
      x: 5,
      z: -7.1,
      w: 0.3,
      d: 1.8,
      tex: 'wall_plaster',
      destructible: true
    },
    {
      x: 9.5,
      z: -8,
      w: 9,
      d: 0.3,
      tex: 'wall_plaster',
      destructible: true
    },
    {
      x: -24,
      z: 10,
      w: 14,
      h: 6,
      d: 26,
      color: 5920080
    },
    {
      x: 24,
      z: 10,
      w: 14,
      h: 6,
      d: 26,
      color: 5788760
    },
    {
      x: -24,
      z: -18,
      w: 14,
      h: 5,
      d: 14,
      color: 5131336
    },
    {
      x: 24,
      z: -14,
      w: 14,
      h: 5,
      d: 18,
      color: 5394512
    },
    {
      x: 0,
      z: -30,
      w: 56,
      h: 5,
      d: 8,
      color: 4868678
    },
    {
      x: -8,
      z: 17,
      w: 1.8,
      h: 1.4,
      d: 3.8,
      color: 3359846
    },
    {
      x: -4,
      z: 17,
      w: 1.8,
      h: 1.4,
      d: 3.8,
      color: 11154210
    },
    {
      x: 8,
      z: 17,
      w: 1.8,
      h: 1.4,
      d: 3.8,
      color: 5596757
    },
    {
      x: 12,
      z: 17,
      w: 1.8,
      h: 1.4,
      d: 3.8,
      color: 8947848
    },
    {
      x: -10,
      z: -19,
      w: 1.8,
      h: 1.4,
      d: 3.8,
      color: 4465186
    },
    {
      x: -6,
      z: -19,
      w: 1.8,
      h: 1.4,
      d: 3.8,
      color: 2245700
    },
    {
      x: 6,
      z: -19,
      w: 1.8,
      h: 1.4,
      d: 3.8,
      color: 4473890
    },
    {
      x: 10,
      z: -19,
      w: 1.8,
      h: 1.4,
      d: 3.8,
      color: 2236996
    },
    {
      x: -18,
      z: 2,
      w: 3.8,
      h: 1.4,
      d: 1.8,
      color: 3355443
    },
    {
      x: 18,
      z: -4,
      w: 3.8,
      h: 1.4,
      d: 1.8,
      color: 12303291
    },
    {
      x: -13.95,
      z: 0.5,
      w: 0.5,
      d: 7.2,
      color: 7368816,
      tex: 'wall_brick',
      breachable: true
    },
    {
      x: 14.05,
      z: 0.5,
      w: 0.5,
      d: 6.8,
      color: 7368816,
      breachable: true,
      tex: 'wall_brick'
    },
    {
      x: 14,
      z: -8,
      w: 0.6,
      d: 10.4,
      color: 7368816,
      tex: 'wall_brick'
    },
    {
      x: 4.85,
      z: -13,
      w: 3.5,
      d: 0.4,
      color: 7368816,
      window: true,
      tex: 'wall_brick'
    },
    {
      x: 2,
      z: -13,
      w: 2.2,
      d: 0.4,
      color: 7368816,
      tex: 'wall_brick'
    }
  ],
  props: [
    {
      x: -7,
      z: 5.5,
      w: 10,
      h: 1.1,
      d: 0.5,
      color: 6961688,
      hp: 160
    },
    {
      x: 7,
      z: 5.5,
      w: 10,
      h: 1.1,
      d: 0.5,
      color: 6961688,
      hp: 160
    },
    {
      type: 'sofa',
      x: 13,
      z: 9,
      rotY: 1.5708
    },
    {
      type: 'sofa',
      x: -13,
      z: 8,
      rotY: 1.5708
    },
    {
      type: 'desk',
      x: -5,
      z: 8.8
    },
    {
      type: 'desk',
      x: 5,
      z: 8.8
    },
    {
      type: 'desk',
      x: 2,
      z: 3
    },
    {
      type: 'desk',
      x: 5,
      z: 3
    },
    {
      type: 'desk',
      x: 8,
      z: 3
    },
    {
      type: 'desk',
      x: 11,
      z: 3
    },
    {
      type: 'desk',
      x: 2,
      z: -2,
      rotY: 3.1416
    },
    {
      type: 'desk',
      x: 5,
      z: -2,
      rotY: 3.1416
    },
    {
      type: 'desk',
      x: 8,
      z: -2,
      rotY: 3.1416
    },
    {
      type: 'desk',
      x: 11,
      z: -2,
      rotY: 3.1416
    },
    {
      type: 'cabinet',
      x: -13,
      z: 3,
      rotY: 3.1416
    },
    {
      type: 'cabinet',
      x: -7,
      z: 3,
      rotY: 1.5708
    },
    {
      type: 'console',
      x: -10,
      z: -1
    },
    {
      type: 'console',
      x: -12,
      z: -1
    },
    {
      type: 'desk',
      x: -10,
      z: 3
    },
    {
      type: 'desk',
      x: 9,
      z: -7
    },
    {
      type: 'safe',
      x: 13,
      z: -7
    },
    {
      type: 'cabinet',
      x: 6,
      z: -7
    },
    {
      type: 'sofa',
      x: 13,
      z: -4.5,
      rotY: 7.854
    },
    {
      type: 'server',
      x: 7,
      z: -9,
      rotY: 3.1416
    },
    {
      type: 'server',
      x: 9,
      z: -9,
      rotY: 3.1416
    },
    {
      type: 'server',
      x: 11,
      z: -9,
      rotY: 3.1416
    },
    {
      type: 'crate',
      x: -3,
      z: -12
    },
    {
      type: 'crate',
      x: 3,
      z: -12
    },
    {
      type: 'safe',
      x: -13,
      z: -7,
      rotY: 4.7124
    },
    {
      type: 'safe',
      x: -13,
      z: -9,
      rotY: 4.7124
    },
    {
      type: 'safe',
      x: -13,
      z: -11,
      rotY: 4.7124
    },
    {
      type: 'shelf',
      x: -12,
      z: -4,
      rotY: 3.1416
    },
    {
      type: 'shelf',
      x: -6,
      z: -4,
      rotY: 3.1416
    }
  ],
  zones: [
    {
      type: 'public',
      x: 0,
      z: 8,
      w: 28,
      d: 8,
      label: 'LOBBY'
    },
    {
      type: 'public',
      x: 0,
      z: 20,
      w: 50,
      d: 20,
      label: 'STREET'
    },
    {
      type: 'public',
      x: 0,
      z: -20,
      w: 30,
      d: 12,
      label: 'PARKING'
    },
    {
      type: 'private',
      x: -11,
      z: 1,
      w: 6,
      d: 6,
      label: 'SECURITY'
    },
    {
      type: 'private',
      x: 6,
      z: 0.5,
      w: 16,
      d: 7,
      label: 'OFFICES'
    },
    {
      type: 'private',
      x: 9,
      z: -5.5,
      w: 10,
      d: 5,
      label: 'MANAGER'
    },
    {
      type: 'private',
      x: 9,
      z: -10,
      w: 10,
      d: 6,
      label: 'SERVER ROOM'
    },
    {
      type: 'secure',
      x: -9,
      z: -9,
      w: 10,
      d: 8,
      label: 'VAULT'
    }
  ],
  doors: [
    {
      x: -1,
      z: 4,
      angle: 0,
      type: 'normal',
      w: 1.4
    },
    {
      x: -8,
      z: 0.5,
      angle: 1.5707963267948966,
      type: 'normal',
      w: 1.2
    },
    {
      x: -1,
      z: -3,
      angle: 0,
      type: 'secure',
      w: 1.2
    },
    {
      x: -4,
      z: -7.3,
      angle: 1.5707963267948966,
      type: 'drill',
      w: 1.4
    },
    {
      x: 5,
      z: -5,
      angle: 1.5707963267948966,
      type: 'normal',
      w: 1.2
    },
    {
      x: -0.8,
      z: -13,
      angle: 0,
      type: 'normal',
      w: 1.6
    }
  ],
  objectives: [
    [
      -10,
      -8
    ],
    [
      -8,
      -10
    ],
    [
      -6,
      -8
    ]
  ],
  escape: [
    0,
    22,
    3
  ],
  cameras: [
    {
      x: 14,
      y: 2.8,
      z: 8,
      angle: 4.71
    },
    {
      x: -14,
      y: 2.8,
      z: 7,
      angle: 1.5707963267948966
    },
    {
      x: 13,
      y: 2.8,
      z: 0,
      angle: -1.5707963267948966
    },
    {
      x: 2,
      y: 2.8,
      z: -13,
      angle: 3.141592653589793,
      panRange: 0.8
    },
    {
      x: -14,
      y: 2.8,
      z: -9,
      angle: 1.57,
      range: 7
    },
    {
      x: 14,
      y: 2.8,
      z: -6,
      angle: 4.71,
      range: 6
    }
  ],
  pillars: [
    {
      x: -5,
      z: 10
    },
    {
      x: 5,
      z: 10
    }
  ],
  spawnPoints: [
    [
      -15.5,
      2
    ],
    [
      15.5,
      5
    ],
    [
      -20,
      -6
    ],
    [
      15.5,
      -6
    ],
    [
      0,
      26
    ],
    [
      0,
      -25.5
    ]
  ],
  patrolRoutes: [
    [
      [
        -10,
        6
      ],
      [
        10,
        6
      ]
    ],
    [
      [
        -6,
        0
      ],
      [
        12,
        0
      ]
    ],
    [
      [
        -2,
        -6
      ],
      [
        -2,
        -11
      ],
      [
        12,
        -11
      ]
    ]
  ],
  civilianTheme: 'bank',
  drill: {
    doorIndex: 3,
    time: 240
  },
  graph: {
    nodes: [
      {
        id: 'dnmmgisypl_21',
        type: 'onInteract',
        x: 100,
        y: 0,
        fields: {
          interactId: 'sec_cameras',
          mesh: 'terminal',
          x: -9,
          z: 1,
          rotY: 0,
          hint: '[F] Disable cameras',
          holdTime: 0,
          requireMask: true,
          once: true,
          enabled: true,
          range: 2
        }
      },
      {
        id: 'dnmmgisypl_23',
        type: 'message',
        x: 600,
        y: 0,
        fields: {
          text: 'Security cameras disabled!',
          color: '#44ff88'
        }
      },
      {
        id: 'dnmmgisypl_25',
        type: 'sound',
        x: 850,
        y: 0,
        fields: {
          sound: 'pickup'
        }
      },
      {
        id: 'dnmmgisypl_27',
        type: 'onInteract',
        x: 100,
        y: 120,
        fields: {
          interactId: 'mgr_hack',
          mesh: 'terminal',
          x: 8,
          z: -6,
          rotY: 0,
          hint: 'Hold [F] Hack manager PC',
          holdTime: 3,
          requireMask: true,
          once: true,
          enabled: true,
          range: 2
        }
      },
      {
        id: 'dnmmgisypl_28',
        type: 'objective',
        x: 350,
        y: 120,
        fields: {}
      },
      {
        id: 'dnmmgisypl_30',
        type: 'message',
        x: 600,
        y: 120,
        fields: {
          text: 'Manager files downloaded — bonus objective!',
          color: '#ffdd44'
        }
      },
      {
        id: 'dnmmgisypl_32',
        type: 'sound',
        x: 850,
        y: 120,
        fields: {
          sound: 'pickup'
        }
      },
      {
        id: 'dnmmgisypl_34',
        type: 'onInteract',
        x: 100,
        y: 240,
        fields: {
          interactId: 'vault_alarm',
          mesh: 'button',
          x: -5,
          z: -4,
          rotY: 0,
          hint: '[F] Emergency alarm button',
          holdTime: 0,
          requireMask: false,
          once: true,
          enabled: true,
          range: 2
        }
      },
      {
        id: 'dnmmgisypl_35',
        type: 'alarm',
        x: 350,
        y: 240,
        fields: {}
      },
      {
        id: 'dnmmgisypl_37',
        type: 'spawnEnemies',
        x: 600,
        y: 240,
        fields: {
          count: 2,
          enemyType: 'cop_smg'
        }
      },
      {
        id: 'dnmmgisypl_39',
        type: 'message',
        x: 850,
        y: 240,
        fields: {
          text: 'ALARM TRIGGERED — reinforcements incoming!',
          color: '#ff4444'
        }
      }
    ],
    edges: [
      {
        id: 'dnmmgisypl_24',
        from: 'dnmmgisypl_21',
        fromPort: 'out',
        to: 'dnmmgisypl_23',
        toPort: 'in'
      },
      {
        id: 'dnmmgisypl_26',
        from: 'dnmmgisypl_23',
        fromPort: 'out',
        to: 'dnmmgisypl_25',
        toPort: 'in'
      },
      {
        id: 'dnmmgisypl_29',
        from: 'dnmmgisypl_27',
        fromPort: 'out',
        to: 'dnmmgisypl_28',
        toPort: 'in'
      },
      {
        id: 'dnmmgisypl_31',
        from: 'dnmmgisypl_28',
        fromPort: 'out',
        to: 'dnmmgisypl_30',
        toPort: 'in'
      },
      {
        id: 'dnmmgisypl_33',
        from: 'dnmmgisypl_30',
        fromPort: 'out',
        to: 'dnmmgisypl_32',
        toPort: 'in'
      },
      {
        id: 'dnmmgisypl_36',
        from: 'dnmmgisypl_34',
        fromPort: 'out',
        to: 'dnmmgisypl_35',
        toPort: 'in'
      },
      {
        id: 'dnmmgisypl_38',
        from: 'dnmmgisypl_35',
        fromPort: 'out',
        to: 'dnmmgisypl_37',
        toPort: 'in'
      },
      {
        id: 'dnmmgisypl_40',
        from: 'dnmmgisypl_37',
        fromPort: 'out',
        to: 'dnmmgisypl_39',
        toPort: 'in'
      }
    ]
  },
  interactables: [
    {
      id: 'sec_cameras',
      mesh: 'terminal',
      x: -9,
      z: 1,
      rotY: 0,
      hint: '[F] Disable cameras',
      holdTime: 0,
      requireMask: true,
      once: true,
      enabled: true,
      range: 2,
      actions: [
        {
          type: 'message',
          text: 'Security cameras disabled!',
          color: '#44ff88'
        },
        {
          type: 'sound',
          sound: 'pickup'
        }
      ]
    },
    {
      id: 'mgr_hack',
      mesh: 'terminal',
      x: 8,
      z: -6,
      rotY: 0,
      hint: 'Hold [F] Hack manager PC',
      holdTime: 3,
      requireMask: true,
      once: true,
      enabled: true,
      range: 2,
      actions: [
        {
          type: 'objective'
        },
        {
          type: 'message',
          text: 'Manager files downloaded — bonus objective!',
          color: '#ffdd44'
        },
        {
          type: 'sound',
          sound: 'pickup'
        }
      ]
    },
    {
      id: 'vault_alarm',
      mesh: 'button',
      x: -5,
      z: -4,
      rotY: 0,
      hint: '[F] Emergency alarm button',
      holdTime: 0,
      requireMask: false,
      once: true,
      enabled: true,
      range: 2,
      actions: [
        {
          type: 'alarm'
        },
        {
          type: 'spawnEnemies',
          count: 2,
          enemyType: 'cop_smg'
        },
        {
          type: 'message',
          text: 'ALARM TRIGGERED — reinforcements incoming!',
          color: '#ff4444'
        }
      ]
    }
  ]
}