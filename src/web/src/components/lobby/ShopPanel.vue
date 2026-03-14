<template>
  <div class="shop-root">
    <div class="money-bar">
      <span class="money-icon">💰</span>
      <span class="money-val">${{ prog.money.toLocaleString() }}</span>
      <span class="money-label">available</span>
    </div>

    <!-- ── Weapons ─────────────────────────────────────────── -->
    <div class="section-title">WEAPONS</div>
    <div class="items-grid">
      <div
        v-for="(w, id) in WEAPONS"
        :key="id"
        class="shop-card"
        :class="{ owned: prog.ownedWeapons.includes(id) }"
      >
        <div class="card-icon">{{ WEAPON_ICONS[id] }}</div>
        <div class="card-info">
          <div class="card-name">{{ w.name }}</div>
          <div class="card-stats">
            DMG {{ w.dmg }} · CON {{ w.concealment }} · MAG {{ w.magSize }}
          </div>
        </div>
        <div class="card-action">
          <span v-if="prog.ownedWeapons.includes(id)" class="owned-badge">OWNED</span>
          <template v-else>
            <div class="card-price">${{ w.price.toLocaleString() }}</div>
            <button
              class="buy-btn"
              :class="{ cant: prog.money < w.price }"
              :disabled="prog.money < w.price"
              @click="buy('weapon', id, w.price)"
            >BUY</button>
          </template>
        </div>
      </div>
    </div>

    <!-- ── Attachments ─────────────────────────────────────── -->
    <div class="section-title">ATTACHMENTS</div>
    <div class="items-grid">
      <div
        v-for="(a, id) in ATTACHMENTS"
        :key="id"
        class="shop-card"
        :class="{ owned: prog.ownedAttachments.includes(id) }"
      >
        <div class="card-icon">{{ SLOT_ICONS[a.slot] }}</div>
        <div class="card-info">
          <div class="card-name">{{ a.name }}</div>
          <div class="card-stats">{{ formatDelta(a.delta) }}</div>
        </div>
        <div class="card-action">
          <span v-if="prog.ownedAttachments.includes(id)" class="owned-badge">OWNED</span>
          <template v-else>
            <div class="card-price">${{ a.price.toLocaleString() }}</div>
            <button
              class="buy-btn"
              :class="{ cant: prog.money < a.price }"
              :disabled="prog.money < a.price"
              @click="buy('attachment', id, a.price)"
            >BUY</button>
          </template>
        </div>
      </div>
    </div>

    <!-- ── Tools ──────────────────────────────────────────── -->
    <div class="section-title">TOOLS</div>
    <div class="items-grid">
      <div
        v-for="(t, id) in TOOLS"
        :key="id"
        class="shop-card"
        :class="{ owned: prog.ownedTools.includes(id) }"
      >
        <div class="card-icon">🔧</div>
        <div class="card-info">
          <div class="card-name">{{ t.name }}</div>
          <div class="card-stats">{{ t.desc }}</div>
        </div>
        <div class="card-action">
          <span v-if="prog.ownedTools.includes(id)" class="owned-badge">OWNED</span>
          <template v-else>
            <div class="card-price">${{ t.price.toLocaleString() }}</div>
            <button
              class="buy-btn"
              :class="{ cant: prog.money < t.price }"
              :disabled="prog.money < t.price"
              @click="buy('tool', id, t.price)"
            >BUY</button>
          </template>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <Transition name="toast-f">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { WEAPONS, ATTACHMENTS, TOOLS } from '../../game/weapons/WeaponData.ts'
import { purchaseItem } from '../../game/PlayerProgress.ts'

const props = defineProps({
  prog: { type: Object, required: true },
})
const emit = defineEmits(['update'])

const WEAPON_ICONS = { pistol: '🔫', smg: '⚙', shotgun: '💥', rifle: '🎯', sniper: '🔭' }
const SLOT_ICONS   = { sight: '🔍', magazine: '📦', suppressor: '🌀', grip: '✊' }

const toast = ref('')
let toastTimer = null

function buy(type, id, price) {
  const { success, prog: updated } = purchaseItem(type, id, price, props.prog)
  if (success) {
    emit('update', updated)
    const name = (WEAPONS[id] ?? ATTACHMENTS[id] ?? TOOLS[id])?.name ?? id
    showToast(`✓ Purchased: ${name}`)
  } else {
    showToast('✗ Insufficient funds')
  }
}

function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 2000)
}

function formatDelta(delta) {
  if (!delta) return ''
  return Object.entries(delta).map(([k, v]) => {
    const sign = v > 0 ? '+' : ''
    const label = { spread: 'Spread', magSize: 'Mag', reserve: 'Reserve', concealment: 'CON', reloadTime: 'Reload', fireRate: 'FR', dmg: 'DMG' }[k] ?? k
    return `${label} ${sign}${v}`
  }).join(' · ')
}
</script>

<style scoped>
.shop-root {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}

.money-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255,170,0,0.1);
  border: 1px solid #ffaa0033;
  border-radius: 4px;
  flex-shrink: 0;
}
.money-icon { font-size: 18px; }
.money-val  { font-size: 20px; font-weight: bold; color: #ffdd88; }
.money-label{ font-size: 10px; color: #888; }

.section-title {
  font-size: 10px; letter-spacing: 0.14em; color: #ffaa00;
  border-bottom: 1px solid #333; padding-bottom: 4px; flex-shrink: 0;
}

.items-grid { display: flex; flex-direction: column; gap: 5px; }

.shop-card {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px;
  background: rgba(255,255,255,0.04); border: 1px solid #333; border-radius: 4px;
  transition: border-color 0.15s;
}
.shop-card.owned { border-color: #ffaa0033; }

.card-icon { font-size: 20px; flex-shrink: 0; width: 28px; text-align: center; }
.card-info { flex: 1; min-width: 0; }
.card-name  { font-size: 11px; color: #ddd; font-weight: bold; }
.card-stats { font-size: 9px; color: #666; margin-top: 2px; }

.card-action { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; flex-shrink: 0; }
.card-price  { font-size: 10px; color: #aaa; }

.owned-badge { font-size: 10px; color: #ffaa00; letter-spacing: 0.06em; }

.buy-btn {
  padding: 4px 12px;
  background: rgba(50,180,50,0.2); border: 1px solid #44aa44; border-radius: 3px;
  color: #88dd88; font: 10px 'Courier New', monospace; letter-spacing: 0.06em; cursor: pointer;
}
.buy-btn:hover:not(:disabled) { background: rgba(50,180,50,0.35); }
.buy-btn.cant, .buy-btn:disabled { opacity: 0.4; cursor: default; }

.toast {
  position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
  background: #222; border: 1px solid #555; border-radius: 4px;
  padding: 8px 20px; font-size: 12px; color: #ddd;
  pointer-events: none;
}
.toast-f-enter-active, .toast-f-leave-active { transition: opacity 0.3s; }
.toast-f-enter-from,  .toast-f-leave-to      { opacity: 0; }
</style>
