import { reactive } from 'vue'

export const state = reactive({
  // ── Phase ────────────────────────────────────────────────────
  phase: 'STEALTH', // STEALTH | CONTROL | ANTICIPATION | ASSAULT | ESCAPED | FAILED

  // ── Player ───────────────────────────────────────────────────
  health: 100,
  maxHealth: 100,
  shield: 100,           // Halo-style rechargeable energy shield
  maxShield: 100,
  shieldActive: false,   // true = shield is currently recharging
  maskOn: false,         // false = enemies treat you as an ordinary civilian
  wearingDisguise: false, // wearing dropped enemy uniform (reduces detection)

  // ── Weapon ───────────────────────────────────────────────────
  ammo: 15,
  reserveAmmo: 90,
  isReloading: false,
  reloadProgress: 0,

  // ── Active weapon (set from lobby loadout) ────────────────────
  weaponStats:  null,    // flat stats object from computeWeaponStats(); null = use defaults
  weaponType:   'pistol',  // 'pistol'|'smg'|'shotgun'|'rifle'|'sniper' — for WeaponView
  equippedAttachments: { sight: null, magazine: null, suppressor: null, grip: null } as Record<string, string | null>,

  // ── Concealment ───────────────────────────────────────────────
  // Final concealment value (0-30). < 10 = weapon visually detected by enemies.
  concealment: 28,

  // ── Bag carry ────────────────────────────────────────────────
  isCarryingBag: false,

  // ── Grenades ─────────────────────────────────────────────────
  grenades:        3,
  flashbangs:      2,
  smokeGrenades:   2,
  flashblind:      0,   // countdown in seconds; >0 = screen whited out

  // ── Alarm ────────────────────────────────────────────────────
  alarmLevel: 0,
  detectionRate: 0,    // 0-100: how fast enemies are noticing you (stealth only)
  susRate: 0,          // suspicion level from dead guards (higher = faster detection)

  // ── Objectives ───────────────────────────────────────────────
  objectives: 0,
  objectivesTotal: 3,
  money: 0,             // in-session display money (not persisted directly)

  // ── New objective states ──────────────────────────────────────
  keycards: [],              // array of collected keycard IDs (reactive)
  activeCodePuzzle: null,    // { index, sequence:[0,1,2], inputSoFar:[] } | null
  isPlantingC4: false,
  c4PlantProgress: 0,        // 0→1
  isCarryingDrill: false,
  drillActive: false,        // true = drill placed on door, counting down
  drillProgress: 0,          // 0→1 over drillTime seconds
  drillTimeMax: 240,         // seconds (display only)

  // ── Security bars (art gallery mechanic) ─────────────────────
  barsActive: false,         // true = security bars blocking paintings
  isSawing: false,           // holding F to saw bars on a painting
  sawProgress: 0,            // 0→1 over 15s
  hackActive: false,         // holding F on hack computer
  hackProgress: 0,           // 0→1 over hackTime

  // ── Lockpick (Skyrim-style safe cracking) ────────────────────
  lockpickActive: false,      // true = lockpick minigame is open
  lockpickSafeIdx: -1,        // index into level.safes
  lockpickResult: '' as '' | 'success' | 'cancel',

  // ── ADS (Aim Down Sights) ─────────────────────────────────────
  isADS: false,              // true while RMB held
  adsFov: 40,                // FOV while ADS (default: 75)

  // ── L4D Down system ───────────────────────────────────────────
  isDown: false,             // player is incapacitated (downed)
  downCount: 0,              // how many times downed this heist (0-3)
  custodyTimer: 0,           // counts down to custody (30/20/10s)
  reviveProgress: 0,         // 0→1 bot revive progress shown on HUD
  coopReviveProgress: 0,     // 0→1 while holding F to revive co-op teammate
  coopReviveTarget: null as string | null,  // peer ID being revived
  botReviveProgress: 0,     // 0→1 while holding F to revive downed bot
  botReviveTarget: -1,      // index of bot being revived (-1 = none)

  // ── Civilian hostage system ───────────────────────────────────
  tyingProgress: 0,          // 0→1 while holding F near surrendering civ
  isCarryingHostage: false,  // player is carrying a tied civ (future)

  // ── Kill feed ─────────────────────────────────────────────────
  killFeed: [] as Array<{ id: number, text: string, color: string }>,

  // ── Bot voice lines ───────────────────────────────────────────
  botVoices: [] as Array<{ id: number, botName: string, colorHex: number, text: string }>,

  // ── Heist stats ───────────────────────────────────────────────
  tieCivCount:      0,    // zip-tied civilians this heist
  killCount:        0,    // enemies eliminated this heist
  headshotCount:    0,    // headshots this heist
  shotsFired:       0,    // total shots fired
  shotsHit:         0,    // shots that hit enemies
  damageTaken:      0,    // total damage taken
  dominateCount:    0,    // enemies dominated
  glassShattered:   0,    // glass panels shattered
  civilianKills:    0,    // civilians killed

  // ── Escape vehicle timer ──────────────────────────────────────
  escapeTimerActive: false,
  escapeTimerLeft:   90,     // seconds until van leaves (starts at allDone)

  // ── Escape countdown (5-4-3-2-1 at van after all objectives) ─
  escapeCountdown: 0,        // > 0 = counting down; hits 0 → escape

  // ── Screen effects ─────────────────────────────────────────────
  flashbangTimer: 0,         // > 0 = white-out; fades to 0 over duration

  // ── Minimap data (written every frame by Engine) ──────────────
  minimap: {
    px: 0, pz: 0, pyaw: 0,
    bots:    [] as Array<{ x: number, z: number, st: string }>,
    enemies: [] as Array<{ x: number, z: number, st: string }>,
    civs:    [] as Array<{ x: number, z: number, tied: boolean }>,
    pings:   [] as Array<{ x: number, z: number, timer: number, color: string }>,
  },
  tacMapOpen: false,

  // ── Tool system ───────────────────────────────────────────────
  equippedTools:   [null, null], // two equipped tool IDs (set from lobby)
  activeToolSlot:  0,            // 0 or 1 — selected slot (switched by 1/2 keys)
  toolId:          null,         // = equippedTools[activeToolSlot] (updated by Engine)
  toolCooldownMax: 0,            // max cooldown of current slot tool
  toolCooldownLeft: 0,           // counts down to 0
  toolActive:      false,        // ECM/Sonar effect currently running
  toolActiveLeft:  0,            // remaining active duration
  ziplineAnchored: false,        // anchor A has been placed

  // ── Skills (from lobby, loaded once before heist) ─────────────
  skills: { ghost: 0, muscle: 0, tech: 0, sharpshooter: 0 },

  // ── AI bots (teammates) ───────────────────────────────────────
  bots: [
    { name: 'DALLAS', hp: 100, maxHp: 100, aiState: 'FOLLOW', reviveProgress: 0 },
    { name: 'WOLF',   hp: 100, maxHp: 100, aiState: 'FOLLOW', reviveProgress: 0 },
    { name: 'CHAINS', hp: 100, maxHp: 100, aiState: 'FOLLOW', reviveProgress: 0 },
  ],

  // ── Current map ───────────────────────────────────────────────
  currentMapId:  '',

  // ── Session rewards (accumulated during heist) ────────────────
  sessionXP:     0,
  sessionMoney:  0,
  sessionTime:   0,      // seconds elapsed in this heist
  stealthRating: 100,    // 0-100 (starts 100, drops on alarms/in-stealth kills)

  // ── Assault phase info ───────────────────────────────────────
  waveNumber: 0,
  killsThisAssault: 0,
  killQuota: 0,
  controlTimeLeft: 0,
  anticipationTimeLeft: 0,
  assaultTimeLeft: 0,

  // ── Drama / difficulty ───────────────────────────────────────
  drama: 0,
  enemiesAlive: 0,

  // ── Zone ─────────────────────────────────────────────────────
  currentZone:        null,   // { type, label } or null (public default)
  playerInSecureZone: false,
  beingEscorted:      false,  // true = at least one guard is in ESCORT mode watching player
  escortEscalated:    false,  // true = guard says "STOP RIGHT THERE" (5–8 s into escort)
  enemyRadioing:      false,  // true = at least one enemy is calling in the alarm

  // ── Noise ──────────────────────────────────────────────────────
  noiseRadius: 0,             // 0 = silent; >0 = nearby guards hear you (for HUD arc)

  // ── Pager system ──────────────────────────────────────────────
  pagerActive: false,         // pager is ringing (stealth kill response window)
  pagerTimeLeft: 0,           // 11s countdown; reaches 0 → alert
  pagerAnswerProgress: 0,     // 0→1; hold F for 10s to fill; release = alert

  // ── UI ───────────────────────────────────────────────────────
  hint: '',
  interactHint: '',          // shown when near an interactable object
  interactProgress: 0,       // 0→1 for hold-F interactions
  interactHoldMax: 0,        // seconds needed (0 = instant)

  // ── Settings ─────────────────────────────────────────────────
  mouseSensitivity: 1.0,
  musicVolume: 0.7,
  showFPS: false,
  fps: 0,

  // ── Game mode ────────────────────────────────────────────────
  gameMode: 'heist' as 'heist' | 'holdout' | 'mutators',
  activeMutators: [] as string[],  // active mutator IDs (e.g. ['hydra'])

  // ── Holdout mode ────────────────────────────────────────────
  holdoutWave: 0,
  holdoutReward: 0,
  holdoutTradeOpen: false,
  holdoutHostageSecurity: 100,    // 100 = secured, 0 = freed by HRT
  holdoutHostageMaxSecurity: 100,
  holdoutTraded: false,
  holdoutHostageFreed: false,
  holdoutVaultOpen: false,        // vault door drilled open (holdout only)

  // ── Level selection ───────────────────────────────────────────
  selectedLevel: 0,   // index into LEVELS array

  // ── Custom level (Level Builder) ──────────────────────────────
  builderLevel: null,  // output-format map data; consumed once by Engine on createEngine()

  // ── Co-op chat ────────────────────────────────────────────────
  chatOpen: false,
  chatMessages: [],   // [{ id, text, playerIndex, time }]
})
