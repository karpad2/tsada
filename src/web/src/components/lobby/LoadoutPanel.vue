<template>
  <div class="loadout-root">

    <!-- ── Weapon tabs (horizontal bar) ─────────────────────────── -->
    <div class="weapon-tabs">
      <button
        v-for="(w, id) in WEAPONS"
        :key="id"
        class="wtab"
        :class="{
          active: localEquip.weapon === id,
          locked: !prog.ownedWeapons.includes(id),
        }"
        :disabled="!prog.ownedWeapons.includes(id)"
        @click="selectWeapon(id)"
      >
        <span class="wtab-icon">{{ WEAPON_ICONS[id] }}</span>
        <span class="wtab-name">{{ w.name }}</span>
        <span v-if="!prog.ownedWeapons.includes(id)" class="wtab-price">
          ${{ w.price.toLocaleString() }}
        </span>
        <span v-else-if="localEquip.weapon === id" class="wtab-badge">EQUIPPED</span>
      </button>
    </div>

    <!-- ── Main content area ────────────────────────────────────── -->
    <div class="main-area">

      <!-- Left: 3D preview -->
      <div class="preview-area">
        <WeaponPreview3D
          :weaponId="localEquip.weapon"
          :attachments="localEquip.attachments"
        />
        <div class="preview-hint">DRAG TO ROTATE</div>

        <!-- Attachment picker overlay -->
        <div v-if="pickerSlot" class="picker-overlay" @click.self="pickerSlot = null">
          <div class="picker-panel">
            <div class="picker-header">
              <span class="picker-title">{{ SLOT_NAMES[pickerSlot]?.toUpperCase() }}</span>
              <button class="picker-close" @click="pickerSlot = null">ESC</button>
            </div>
            <div class="picker-grid">
              <button
                v-if="localEquip.attachments[pickerSlot]"
                class="picker-card remove"
                @click="removeAttachment(pickerSlot)"
                @mouseenter="hoveredAttachment = null"
                @mouseleave="hoveredAttachment = null"
              >
                <span class="pc-name">REMOVE</span>
                <span class="pc-desc">Unequip current attachment</span>
              </button>
              <button
                v-for="(att, id) in filteredAttachments"
                :key="id"
                class="picker-card"
                :class="{
                  equipped: localEquip.attachments[pickerSlot] === id,
                  locked: !prog.ownedAttachments.includes(id),
                }"
                :disabled="!prog.ownedAttachments.includes(id)"
                @click="attachItem(pickerSlot, id)"
                @mouseenter="hoveredAttachment = { slot: pickerSlot, id }"
                @mouseleave="hoveredAttachment = null"
              >
                <span class="pc-name">{{ att.name }}</span>
                <span class="pc-deltas">
                  <template v-for="(val, key) in att.delta" :key="key">
                    <span :class="isDeltaPositive(key, val) ? 'delta-up' : 'delta-down'">
                      {{ STAT_SHORT[key] }} {{ val > 0 ? '+' : '' }}{{ formatDelta(key, val) }}
                    </span>
                  </template>
                  <span v-if="att.dmgMult && att.dmgMult !== 1" class="delta-down">
                    DMG {{ Math.round((att.dmgMult - 1) * 100) }}%
                  </span>
                </span>
                <span v-if="localEquip.attachments[pickerSlot] === id" class="pc-equipped">EQUIPPED</span>
                <span v-if="!prog.ownedAttachments.includes(id)" class="pc-lock">
                  ${{ att.price.toLocaleString() }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Stats + Attachments -->
      <div class="right-panel">

        <!-- Stats -->
        <div class="section-title">STATISTICS</div>
        <div class="stat-block">
          <div v-for="stat in STAT_DEFS" :key="stat.key" class="stat-row">
            <span class="stat-lbl">{{ stat.label }}</span>
            <div class="stat-bar-wrap">
              <!-- Delta bar (preview) -->
              <div
                v-if="previewStats && deltaFor(stat.key) !== 0"
                class="stat-bar-delta"
                :class="isDeltaGood(stat) ? 'delta-positive' : 'delta-negative'"
                :style="deltaBarStyle(stat)"
              />
              <!-- Current bar -->
              <div class="stat-bar" :style="{ width: barWidth(stat, weaponStats) + '%', background: stat.color || concealColor }" />
            </div>
            <span class="stat-val">
              {{ formatStat(stat, weaponStats) }}
              <span v-if="previewStats && deltaFor(stat.key) !== 0" :class="isDeltaGood(stat) ? 'val-up' : 'val-down'">
                {{ formatStatDelta(stat) }}
              </span>
            </span>
          </div>
        </div>

        <div v-if="weaponStats.concealment < 10" class="conceal-warn">
          WEAPON VISIBLE — enemies detect in public zones
        </div>

        <!-- Attachment slots -->
        <div class="section-title" style="margin-top: 12px">MODIFICATIONS</div>
        <div class="att-slots">
          <div
            v-for="slot in ALL_SLOTS"
            :key="slot"
            class="att-slot"
            :class="{
              filled: localEquip.attachments[slot],
              disabled: !activeWeapon.slots.includes(slot),
              selecting: pickerSlot === slot,
            }"
            @click="activeWeapon.slots.includes(slot) && openAttachPicker(slot)"
          >
            <div class="att-slot-icon">{{ SLOT_ICONS[slot] }}</div>
            <div class="att-slot-info">
              <div class="att-slot-label">{{ SLOT_NAMES[slot] }}</div>
              <div class="att-slot-val">
                {{ localEquip.attachments[slot]
                  ? ATTACHMENTS[localEquip.attachments[slot]]?.name
                  : (activeWeapon.slots.includes(slot) ? 'Empty' : 'N/A') }}
              </div>
            </div>
            <button
              v-if="localEquip.attachments[slot]"
              class="att-remove"
              @click.stop="removeAttachment(slot)"
            >✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Tools bar (bottom) ───────────────────────────────────── -->
    <div class="tools-bar">
      <div class="section-title" style="margin-bottom: 6px">EQUIPMENT <small class="tools-hint">[1] [2] in-game</small></div>
      <div class="tools-row">
        <div
          v-for="(slotId, si) in localEquip.tools"
          :key="si"
          class="tool-slot"
          :class="{ filled: !!slotId, picking: toolPickerSlot === si }"
          @click="toolPickerSlot = toolPickerSlot === si ? null : si"
        >
          <span class="tool-num">{{ si + 1 }}</span>
          <span class="tool-name">{{ slotId ? TOOLS[slotId]?.name : 'EMPTY' }}</span>
          <span v-if="slotId" class="tool-clear" @click.stop="setToolSlot(si, null)">✕</span>
        </div>
      </div>
      <div v-if="toolPickerSlot !== null" class="tool-picker">
        <button
          v-for="(t, id) in TOOLS"
          :key="id"
          class="tool-btn"
          :class="{
            active: localEquip.tools[toolPickerSlot] === id,
            locked: !prog.ownedTools.includes(id),
          }"
          :disabled="!prog.ownedTools.includes(id)"
          @click="setToolSlot(toolPickerSlot, id)"
        >
          <span class="tool-btn-name">{{ t.name }}</span>
          <span class="tool-btn-desc">{{ t.desc }}</span>
          <span v-if="!prog.ownedTools.includes(id)" class="lock-badge">${{ t.price.toLocaleString() }}</span>
        </button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { WEAPONS, ATTACHMENTS, TOOLS, computeWeaponStats } from '../../game/weapons/WeaponData.ts'
import WeaponPreview3D from './WeaponPreview3D.vue'

const props = defineProps({
  prog: { type: Object, required: true },
})
const emit = defineEmits(['update'])

const ALL_SLOTS = ['sight', 'magazine', 'suppressor', 'grip']
const SLOT_NAMES = { sight: 'Sight', magazine: 'Magazine', suppressor: 'Suppressor', grip: 'Grip' }
const SLOT_ICONS = { sight: '◎', magazine: '▤', suppressor: '━', grip: '╦' }
const WEAPON_ICONS = { pistol: '🔫', smg: '⚙', shotgun: '💥', rifle: '🎯', sniper: '🔭' }

const STAT_SHORT = {
  spread: 'ACC', concealment: 'CONC', magSize: 'MAG', reserve: 'AMMO',
  reloadTime: 'RLD', fireRate: 'ROF', dmg: 'DMG',
}

const STAT_DEFS = [
  { key: 'dmg',         label: 'DAMAGE',      color: '#ff6644', max: 120, format: v => v },
  { key: 'fireRate',    label: 'FIRE RATE',    color: '#ffcc44', max: 1.5, invert: true, format: v => (1 / v).toFixed(0) + '/s' },
  { key: 'magSize',     label: 'MAGAZINE',     color: '#44aaff', max: 50, format: v => v },
  { key: 'concealment', label: 'CONCEALMENT',  color: null,      max: 30, format: v => v },
]

// Local mutable loadout
const localEquip = ref({
  weapon:      props.prog.equippedWeapon ?? 'pistol',
  attachments: { ...props.prog.equippedAttachments },
  tools:       [...(props.prog.equippedTools ?? [null, null])],
})

const toolPickerSlot = ref(null)
const pickerSlot = ref(null)
const hoveredAttachment = ref(null)

const activeWeapon = computed(() => WEAPONS[localEquip.value.weapon])

const filteredAttachments = computed(() => {
  if (!pickerSlot.value) return {}
  return Object.fromEntries(
    Object.entries(ATTACHMENTS).filter(([, a]) => a.slot === pickerSlot.value)
  )
})

const FALLBACK_STATS = { dmg: 0, fireRate: 1, magSize: 0, concealment: 0 }
const weaponStats = computed(() => {
  try {
    return computeWeaponStats(localEquip.value.weapon, localEquip.value.attachments, props.prog.spentSkills)
  } catch {
    return FALLBACK_STATS
  }
})

// Preview stats when hovering an attachment in the picker
const previewStats = computed(() => {
  const h = hoveredAttachment.value
  if (!h) return null
  try {
    const previewAtts = { ...localEquip.value.attachments, [h.slot]: h.id }
    return computeWeaponStats(localEquip.value.weapon, previewAtts, props.prog.spentSkills)
  } catch {
    return null
  }
})

const concealColor = computed(() => {
  const c = weaponStats.value.concealment
  if (c < 10) return '#ff4444'
  if (c < 20) return '#ffcc44'
  return '#44dd88'
})

function barWidth(stat, stats) {
  const val = stats[stat.key]
  if (stat.invert) return ((stat.max - val) / stat.max * 100)
  return Math.min(100, val / stat.max * 100)
}

function formatStat(stat, stats) {
  return stat.format(stats[stat.key])
}

function deltaFor(key) {
  if (!previewStats.value) return 0
  return previewStats.value[key] - weaponStats.value[key]
}

function isDeltaGood(stat) {
  const d = deltaFor(stat.key)
  return stat.invert ? d < 0 : d > 0
}

function formatStatDelta(stat) {
  const d = deltaFor(stat.key)
  if (stat.key === 'fireRate') {
    const rps = 1 / previewStats.value.fireRate - 1 / weaponStats.value.fireRate
    return (rps > 0 ? '+' : '') + rps.toFixed(0)
  }
  return (d > 0 ? '+' : '') + Math.round(d)
}

function deltaBarStyle(stat) {
  const cur = barWidth(stat, weaponStats.value)
  const preview = barWidth(stat, previewStats.value)
  if (preview > cur) {
    return { left: cur + '%', width: (preview - cur) + '%' }
  } else {
    return { left: preview + '%', width: (cur - preview) + '%' }
  }
}

function isDeltaPositive(key, val) {
  // For most stats, positive delta = good. For fireRate/spread/reloadTime, negative = good.
  const invertedStats = ['fireRate', 'spread', 'reloadTime']
  return invertedStats.includes(key) ? val < 0 : val > 0
}

function formatDelta(key, val) {
  if (key === 'fireRate' || key === 'reloadTime' || key === 'spread') return val.toFixed(2)
  return val
}

function selectWeapon(id) {
  localEquip.value.weapon = id
  for (const slot of ALL_SLOTS) {
    if (!WEAPONS[id].slots.includes(slot)) localEquip.value.attachments[slot] = null
  }
  pickerSlot.value = null
  hoveredAttachment.value = null
}

function openAttachPicker(slot) {
  pickerSlot.value = pickerSlot.value === slot ? null : slot
  hoveredAttachment.value = null
}

function attachItem(slot, id) {
  localEquip.value.attachments[slot] = id
  pickerSlot.value = null
  hoveredAttachment.value = null
}

function removeAttachment(slot) {
  localEquip.value.attachments[slot] = null
  pickerSlot.value = null
  hoveredAttachment.value = null
}

function setToolSlot(slotIdx, toolId) {
  localEquip.value.tools[slotIdx] = toolId === localEquip.value.tools[slotIdx] ? null : toolId
  toolPickerSlot.value = null
}

watch(localEquip, val => {
  emit('update', {
    equippedWeapon:      val.weapon,
    equippedAttachments: { ...val.attachments },
    equippedTools:       [...val.tools],
  })
}, { deep: true, immediate: true })
</script>

<style scoped>
.loadout-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  gap: 0;
}

/* ── Weapon tabs ── */
.weapon-tabs {
  display: flex;
  gap: 2px;
  padding: 0 0 8px;
  border-bottom: 1px solid #333;
  flex-shrink: 0;
  overflow-x: auto;
}
.wtab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid #333;
  border-radius: 4px 4px 0 0;
  color: #999;
  font: 11px 'Courier New', monospace;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.wtab:hover:not(:disabled) { background: rgba(255,255,255,0.08); color: #ccc; border-color: #555; }
.wtab.active { background: rgba(255,170,0,0.15); border-color: #ffaa00; color: #ffdd88; border-bottom-color: transparent; }
.wtab.locked { opacity: 0.4; cursor: default; }
.wtab:disabled { cursor: default; }
.wtab-icon { font-size: 14px; }
.wtab-name { font-size: 10px; letter-spacing: 0.05em; }
.wtab-price { font-size: 9px; color: #666; }
.wtab-badge { font-size: 8px; color: #ffaa00; letter-spacing: 0.1em; }

/* ── Main area ── */
.main-area {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 0;
}

/* ── 3D Preview ── */
.preview-area {
  flex: 1;
  min-width: 0;
  position: relative;
  background: radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0%, transparent 70%);
  border-right: 1px solid #333;
}
.preview-hint {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  font: 9px 'Courier New', monospace;
  color: rgba(255,255,255,0.15);
  letter-spacing: 0.15em;
  pointer-events: none;
}

/* ── Attachment picker overlay ── */
.picker-overlay {
  position: absolute;
  inset: 0;
  background: rgba(13,13,18,0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
.picker-panel {
  width: 90%;
  max-width: 400px;
  max-height: 90%;
  overflow-y: auto;
}
.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.picker-title {
  font: bold 12px 'Courier New', monospace;
  color: #ffaa00;
  letter-spacing: 0.15em;
}
.picker-close {
  padding: 3px 8px;
  background: rgba(255,255,255,0.06);
  border: 1px solid #444;
  border-radius: 3px;
  color: #888;
  font: 9px 'Courier New', monospace;
  cursor: pointer;
}
.picker-close:hover { border-color: #ff6644; color: #ff6644; }
.picker-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.picker-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: rgba(255,255,255,0.05);
  border: 1px solid #444;
  border-radius: 4px;
  color: #ccc;
  font: 10px 'Courier New', monospace;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
  position: relative;
}
.picker-card:hover:not(:disabled) { background: rgba(255,170,0,0.12); border-color: #ffaa00; }
.picker-card.equipped { border-color: #ffaa00; background: rgba(255,170,0,0.15); }
.picker-card.locked { opacity: 0.45; cursor: default; }
.picker-card.remove { border-color: #662222; }
.picker-card.remove:hover { background: rgba(255,60,60,0.12); border-color: #ff4444; }
.pc-name { font-size: 11px; font-weight: bold; color: #ddd; }
.pc-deltas { display: flex; gap: 10px; flex-wrap: wrap; }
.delta-up { color: #44dd88; font-size: 9px; }
.delta-down { color: #ff6644; font-size: 9px; }
.pc-equipped { position: absolute; right: 12px; top: 10px; font-size: 8px; color: #ffaa00; letter-spacing: 0.1em; }
.pc-lock { position: absolute; right: 12px; top: 10px; font-size: 9px; color: #888; }
.pc-desc { font-size: 9px; color: #666; }

/* ── Right panel ── */
.right-panel {
  width: 220px;
  flex-shrink: 0;
  padding: 10px 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.section-title {
  font: bold 10px 'Courier New', monospace;
  letter-spacing: 0.14em;
  color: #ffaa00;
  border-bottom: 1px solid #333;
  padding-bottom: 4px;
}

/* ── Stats ── */
.stat-block { display: flex; flex-direction: column; gap: 8px; }
.stat-row { display: flex; align-items: center; gap: 6px; }
.stat-lbl { font-size: 9px; color: #666; width: 85px; flex-shrink: 0; letter-spacing: 0.06em; }
.stat-bar-wrap {
  flex: 1;
  height: 6px;
  background: rgba(255,255,255,0.08);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}
.stat-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s, background 0.3s;
  position: relative;
  z-index: 1;
}
.stat-bar-delta {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 3px;
  z-index: 2;
  transition: left 0.15s, width 0.15s;
}
.stat-bar-delta.delta-positive { background: rgba(68,221,136,0.5); }
.stat-bar-delta.delta-negative { background: rgba(255,102,68,0.5); }
.stat-val {
  font-size: 10px;
  color: #ccc;
  min-width: 50px;
  text-align: right;
  flex-shrink: 0;
  white-space: nowrap;
}
.val-up { color: #44dd88; font-size: 9px; margin-left: 3px; }
.val-down { color: #ff6644; font-size: 9px; margin-left: 3px; }

.conceal-warn {
  background: rgba(200,30,30,0.2);
  border: 1px solid #882222;
  border-radius: 3px;
  padding: 5px 7px;
  font-size: 9px;
  color: #ff8888;
  letter-spacing: 0.04em;
}

/* ── Attachment slots ── */
.att-slots { display: flex; flex-direction: column; gap: 4px; }
.att-slot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid #333;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}
.att-slot:hover:not(.disabled) { border-color: #ffaa00; background: rgba(255,170,0,0.08); }
.att-slot.filled { border-color: #555; background: rgba(255,255,255,0.07); }
.att-slot.selecting { border-color: #ffaa00; background: rgba(255,170,0,0.12); }
.att-slot.disabled { opacity: 0.25; cursor: default; }
.att-slot-icon { font-size: 14px; color: #666; width: 18px; text-align: center; flex-shrink: 0; }
.att-slot.filled .att-slot-icon { color: #ffaa00; }
.att-slot-info { flex: 1; min-width: 0; }
.att-slot-label { font-size: 8px; color: #555; letter-spacing: 0.08em; text-transform: uppercase; }
.att-slot-val { font-size: 10px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.att-slot.filled .att-slot-val { color: #ddd; }
.att-remove {
  background: none; border: none; color: #664444; cursor: pointer;
  font-size: 12px; padding: 0 2px; flex-shrink: 0;
}
.att-remove:hover { color: #ff4444; }

/* ── Tools bar ── */
.tools-bar {
  border-top: 1px solid #333;
  padding: 8px 12px;
  flex-shrink: 0;
}
.tools-hint { opacity: 0.35; font-size: 9px; }
.tools-row { display: flex; gap: 6px; }
.tool-slot {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border: 1px solid #444;
  border-radius: 4px;
  cursor: pointer;
  background: rgba(255,255,255,0.04);
  transition: border-color .15s;
}
.tool-slot:hover { border-color: #888; }
.tool-slot.filled { border-color: #ffaa00; background: rgba(255,170,0,0.12); }
.tool-slot.picking { border-color: #44aaff; background: rgba(68,170,255,0.12); }
.tool-num { font-size: 10px; opacity: .5; flex-shrink: 0; color: #ccc; }
.tool-name { font-size: 10px; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #ccc; }
.tool-clear { font-size: 10px; opacity: .6; flex-shrink: 0; padding: 0 2px; color: #ccc; cursor: pointer; background: none; border: none; }
.tool-clear:hover { opacity: 1; color: #ff4444; }

.tool-picker {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 6px;
  max-height: 180px;
  overflow-y: auto;
}
.tool-btn {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 10px;
  text-align: left;
  background: rgba(255,255,255,0.04);
  border: 1px solid #333;
  border-radius: 3px;
  color: #aaa;
  font: 10px 'Courier New', monospace;
  cursor: pointer;
  position: relative;
}
.tool-btn:hover:not(:disabled) { background: rgba(255,255,255,0.08); border-color: #555; }
.tool-btn.active { background: rgba(255,170,0,0.2); border-color: #ffaa00; color: #ffdd88; }
.tool-btn.locked { opacity: 0.4; cursor: default; }
.tool-btn-name { font-weight: bold; color: #ccc; }
.tool-btn-desc { font-size: 9px; color: #555; }
.lock-badge { position: absolute; right: 10px; top: 6px; color: #666; font-size: 9px; }

/* ── Concealment color override per stat ── */
</style>
