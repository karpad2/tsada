// ── Node type definitions for the visual logic editor ────────

export interface FieldDef {
  key: string
  label: string
  type: 'string' | 'number' | 'select' | 'boolean' | 'color' | 'code'
  default: any
  options?: { value: any, label: string }[]
  min?: number
  max?: number
  step?: number
}

export interface PortDef {
  id: string
  label: string
}

export interface NodeTypeDef {
  type: string
  label: string
  category: 'trigger' | 'action' | 'flow'
  color: string
  icon: string
  inputs: PortDef[]
  outputs: PortDef[]
  fields: FieldDef[]
}

// ── Shared field helpers ─────────────────────────────────────
const IN:  PortDef[] = [{ id: 'in', label: '' }]
const OUT: PortDef[] = [{ id: 'out', label: '' }]
const INOUT = { inputs: IN, outputs: OUT }

const SOUND_OPTIONS = [
  'shoot', 'explosion', 'pickup', 'maskOn', 'doorOpen',
  'guardAlert', 'reload', 'flashbang', 'tieCiv', 'escapeBeep',
  'shieldHit', 'bodyHit', 'emptyClick', 'reloadDone', 'grenadePin',
  'backupCalled',
].map(v => ({ value: v, label: v }))

const MESH_OPTIONS = [
  { value: 'button',   label: 'Button' },
  { value: 'lever',    label: 'Lever' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'console',  label: 'Console' },
]

const ENEMY_OPTIONS = [
  { value: 'guard',        label: 'Guard' },
  { value: 'cop_pistol',   label: 'Cop (Pistol)' },
  { value: 'cop_smg',      label: 'Cop (SMG)' },
  { value: 'cop_shotgun',  label: 'Cop (Shotgun)' },
  { value: 'swat_smg',     label: 'SWAT (SMG)' },
  { value: 'swat_shield',  label: 'SWAT (Shield)' },
]

// ── Node type registry ───────────────────────────────────────
export const NODE_TYPES: Record<string, NodeTypeDef> = {
  // ── TRIGGERS ───────────────────────────────────────────────
  onInteract: {
    type: 'onInteract', label: 'On Interact', category: 'trigger',
    color: '#44cc88', icon: '⚡',
    inputs: [], outputs: OUT,
    fields: [
      { key: 'interactId', label: 'ID',          type: 'string',  default: '' },
      { key: 'mesh',       label: 'Mesh',        type: 'select',  default: 'button', options: MESH_OPTIONS },
      { key: 'x',          label: 'X',           type: 'number',  default: 0, step: 0.5 },
      { key: 'z',          label: 'Z',           type: 'number',  default: 0, step: 0.5 },
      { key: 'rotY',       label: 'Rotation Y',  type: 'number',  default: 0, step: 0.1 },
      { key: 'hint',       label: 'Hint',        type: 'string',  default: '[F] Interact' },
      { key: 'holdTime',   label: 'Hold time (s)', type: 'number', default: 0, min: 0, step: 0.5 },
      { key: 'requireMask', label: 'Require mask', type: 'boolean', default: false },
      { key: 'once',       label: 'Once only',   type: 'boolean', default: true },
      { key: 'enabled',    label: 'Enabled',     type: 'boolean', default: true },
      { key: 'range',      label: 'Range',       type: 'number',  default: 2.0, min: 0.5, step: 0.5 },
    ],
  },

  // ── ACTIONS ────────────────────────────────────────────────
  message: {
    type: 'message', label: 'Message', category: 'action',
    color: '#ffaa44', icon: '💬', ...INOUT,
    fields: [
      { key: 'text',  label: 'Text',  type: 'string', default: 'Hello!' },
      { key: 'color', label: 'Color', type: 'color',  default: '#ffdd44' },
    ],
  },
  sound: {
    type: 'sound', label: 'Sound', category: 'action',
    color: '#ffaa44', icon: '🔊', ...INOUT,
    fields: [
      { key: 'sound', label: 'Sound', type: 'select', default: 'pickup', options: SOUND_OPTIONS },
    ],
  },
  alarm: {
    type: 'alarm', label: 'Trigger Alarm', category: 'action',
    color: '#ffaa44', icon: '🚨', ...INOUT,
    fields: [],
  },
  objective: {
    type: 'objective', label: 'Complete Objective', category: 'action',
    color: '#ffaa44', icon: '✓', ...INOUT,
    fields: [],
  },
  openDoor: {
    type: 'openDoor', label: 'Open Door', category: 'action',
    color: '#ffaa44', icon: '🚪', ...INOUT,
    fields: [
      { key: 'doorIndex', label: 'Door index', type: 'number', default: 0, min: 0, step: 1 },
    ],
  },
  spawnEnemies: {
    type: 'spawnEnemies', label: 'Spawn Enemies', category: 'action',
    color: '#ffaa44', icon: '👮', ...INOUT,
    fields: [
      { key: 'count',     label: 'Count',      type: 'number', default: 2, min: 1, step: 1 },
      { key: 'enemyType', label: 'Enemy type',  type: 'select', default: 'cop_smg', options: ENEMY_OPTIONS },
    ],
  },
  heal: {
    type: 'heal', label: 'Heal Player', category: 'action',
    color: '#ffaa44', icon: '❤', ...INOUT,
    fields: [
      { key: 'amount', label: 'Amount', type: 'number', default: 25, min: 1, step: 5 },
    ],
  },
  giveAmmo: {
    type: 'giveAmmo', label: 'Give Ammo', category: 'action',
    color: '#ffaa44', icon: '🔫', ...INOUT,
    fields: [
      { key: 'amount', label: 'Amount', type: 'number', default: 30, min: 1, step: 5 },
    ],
  },
  enable: {
    type: 'enable', label: 'Enable', category: 'action',
    color: '#ffaa44', icon: '✅', ...INOUT,
    fields: [
      { key: 'target', label: 'Target ID', type: 'string', default: '' },
    ],
  },
  disable: {
    type: 'disable', label: 'Disable', category: 'action',
    color: '#ffaa44', icon: '⛔', ...INOUT,
    fields: [
      { key: 'target', label: 'Target ID', type: 'string', default: '' },
    ],
  },
  explode: {
    type: 'explode', label: 'Explode', category: 'action',
    color: '#ffaa44', icon: '💥', ...INOUT,
    fields: [
      { key: 'x',      label: 'X',      type: 'number', default: 0, step: 0.5 },
      { key: 'z',      label: 'Z',      type: 'number', default: 0, step: 0.5 },
      { key: 'radius', label: 'Radius', type: 'number', default: 4, min: 1, step: 1 },
      { key: 'damage', label: 'Damage', type: 'number', default: 80, min: 0, step: 10 },
    ],
  },
  script: {
    type: 'script', label: 'Script (JS)', category: 'action',
    color: '#ffaa44', icon: '{ }', ...INOUT,
    fields: [
      { key: 'code', label: 'Code', type: 'code', default: '// ctx.addKillFeed("hello", "#ff0")' },
    ],
  },

  // ── FLOW ───────────────────────────────────────────────────
  delay: {
    type: 'delay', label: 'Delay', category: 'flow',
    color: '#44aaff', icon: '⏱', ...INOUT,
    fields: [
      { key: 'seconds', label: 'Seconds', type: 'number', default: 1.0, min: 0.1, step: 0.5 },
    ],
  },
}

// ── Categories for toolbar ───────────────────────────────────
export const NODE_CATEGORIES = [
  { label: 'TRIGGERS', types: ['onInteract'] },
  { label: 'ACTIONS',  types: ['message', 'sound', 'alarm', 'objective', 'openDoor', 'spawnEnemies', 'heal', 'giveAmmo', 'enable', 'disable', 'explode', 'script'] },
  { label: 'FLOW',     types: ['delay'] },
]

// ── Default fields for a new node ────────────────────────────
export function getDefaultFields(type: string): Record<string, any> {
  const def = NODE_TYPES[type]
  if (!def) return {}
  const fields: Record<string, any> = {}
  for (const f of def.fields) fields[f.key] = f.default
  return fields
}
