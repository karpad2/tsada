<template>
  <div class="hud" aria-hidden="true">

    <!-- ── Flashbang blind overlay ────────────────────────────── -->
    <div v-if="state.flashblind > 0" class="flashblind-overlay"
         :style="{ opacity: Math.min(1, state.flashblind * 0.7) }" />

    <!-- ── Minimap ───────────────────────────────────────────── -->
    <canvas ref="minimapRef" class="minimap" width="130" height="130" />

    <!-- ── Tactical map overlay (Tab) ─────────────────────── -->
    <Transition name="fade">
      <div v-if="state.tacMapOpen" class="tacmap-overlay">
        <canvas ref="tacmapRef" class="tacmap-canvas" width="500" height="500" />
        <div class="tacmap-label">TACTICAL MAP</div>
      </div>
    </Transition>

    <!-- ── Heist stats (above minimap) ──────────────────────── -->
    <div class="heist-stats">
      <span title="Zip-tied civilians">✊ {{ state.tieCivCount }}</span>
      <span title="Enemies eliminated">☠ {{ state.killCount }}</span>
    </div>

    <!-- ── Kill feed ─────────────────────────────────────────── -->
    <TransitionGroup name="killfeed" tag="div" class="kill-feed">
      <div v-for="k in state.killFeed" :key="k.id" class="kf-entry" :style="{ color: k.color }">
        {{ k.text }}
      </div>
    </TransitionGroup>

    <!-- ── Bot voice lines ───────────────────────────────────── -->
    <TransitionGroup name="voice" tag="div" class="bot-voices">
      <div v-for="v in state.botVoices" :key="v.id" class="bv-entry">
        <span class="bv-name" :style="{ color: '#' + v.colorHex.toString(16).padStart(6, '0') }">{{ v.botName }}</span>
        <span class="bv-text">{{ v.text }}</span>
      </div>
    </TransitionGroup>

    <!-- ── Crosshair / Sight reticles ──────────────────────────── -->
    <div v-if="!state.isADS || (!activeSight && state.weaponType !== 'sniper')" class="crosshair" :class="{ ads: state.isADS }">
      <div class="ch-h" />
      <div class="ch-v" />
    </div>

    <!-- Red Dot reticle -->
    <div v-if="state.isADS && activeSight === 'redDot'" class="sight-reticle red-dot">
      <div class="rd-dot" />
    </div>

    <!-- Holographic reticle -->
    <div v-if="state.isADS && activeSight === 'holographic'" class="sight-reticle holo">
      <div class="holo-ring" />
      <div class="holo-dot" />
      <div class="holo-h" />
      <div class="holo-v" />
    </div>

    <!-- Scope reticle (scope attachment OR sniper weapon ADS) -->
    <div v-if="state.isADS && (activeSight === 'scope' || state.weaponType === 'sniper')" class="scope-overlay">
      <div class="scope-vignette" />
      <div class="scope-cross-h" />
      <div class="scope-cross-v" />
      <div class="scope-dot" />
      <div class="scope-mil scope-mil-l" />
      <div class="scope-mil scope-mil-r" />
      <div class="scope-mil scope-mil-t" />
      <div class="scope-mil scope-mil-b" />
    </div>

    <!-- ── Phase panel (top centre) ──────────────────────────── -->
    <div class="phase-panel" :style="{ background: phaseColor }">
      <div class="phase-name">{{ phaseName }}</div>
      <div class="phase-sub">{{ phaseSub }}</div>
      <div v-if="state.phase === 'ASSAULT'" class="quota-track">
        <div class="quota-fill" :style="{ width: quotaPct + '%' }" />
      </div>
    </div>

    <!-- ── Holdout: hostage security bar (top area) ────────────── -->
    <div v-if="state.gameMode === 'holdout' && !state.holdoutHostageFreed" class="hostage-bar-wrap">
      <span class="hostage-lbl">HOSTAGE</span>
      <div class="hostage-track">
        <div class="hostage-fill" :style="{ width: hostagePct + '%', background: hostageColor }" />
      </div>
      <span class="hostage-val">{{ Math.round(state.holdoutHostageSecurity) }}%</span>
    </div>

    <!-- ── Holdout: trade overlay ──────────────────────────────── -->
    <div v-if="state.holdoutTradeOpen" class="trade-overlay">
      <div class="trade-title">TRADE HOSTAGE?</div>
      <div class="trade-reward">${{ state.holdoutReward.toLocaleString() }}</div>
      <div class="trade-wave">Wave {{ state.holdoutWave }} survived</div>
      <div class="trade-actions">
        <div class="trade-key">[T] TRADE &amp; COLLECT</div>
        <div class="trade-hold">HOLD — next wave for more</div>
      </div>
      <div class="trade-timer">{{ fmtTime(state.controlTimeLeft) }}</div>
    </div>

    <!-- ── Zone badge (top-left) ──────────────────────────────── -->
    <Transition name="fade">
      <div v-if="state.currentZone" class="zone-badge" :class="'zone-' + state.currentZone.type">
        <span class="zone-dot">●</span>
        <span class="zone-label">{{ state.currentZone.label ?? state.currentZone.type.toUpperCase() }}</span>
        <span class="zone-type">{{ zoneTypeName }}</span>
      </div>
    </Transition>

    <!-- ── Detection meter (below crosshair) ─────────────────── -->
    <Transition name="fade">
      <div v-if="state.phase === 'STEALTH' && state.detectionRate > 0" class="detect-wrap">
        <div class="detect-track">
          <div class="detect-fill" :style="{ width: state.detectionRate + '%', background: detectionColor }" />
        </div>
        <span class="detect-lbl" :style="{ color: detectionColor }">DETECTED</span>
        <span v-if="state.susRate > 0" class="sus-lbl">SUS x{{ (1 + state.susRate * 0.3).toFixed(1) }}</span>
      </div>
    </Transition>

    <!-- ── Suspicion bar (CONTROL only, top-left) ─────────────── -->
    <Transition name="fade">
      <div v-if="state.phase === 'CONTROL'" class="alarm-panel">
        <span class="bar-lbl">SUSPICION</span>
        <div class="bar-track">
          <div class="bar-fill alarm-fill" :style="{ width: state.alarmLevel + '%' }" />
        </div>
      </div>
    </Transition>

    <!-- ── Objectives (top-right) ─────────────────────────────── -->
    <div class="obj-panel">
      <div class="obj-icons">
        <span
          v-for="(icon, i) in objectiveIcons" :key="i"
          class="obj-icon"
          :class="{ done: icon.done }"
          :title="icon.label"
        >{{ icon.icon }}</span>
      </div>
      <div class="money">${{ state.money.toLocaleString() }}</div>
    </div>

    <!-- ── Concealment warning ────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="state.maskOn && state.concealment < 10" class="conceal-warn">
        ⚠ WEAPON VISIBLE
      </div>
    </Transition>

    <!-- ── Health / shield (bottom-left) ──────────────────────── -->
    <div class="vitals">
      <div class="bar-row">
        <span class="bar-lbl">HEALTH</span>
        <div class="bar-track">
          <div class="bar-fill health-fill"
               :style="{ width: (state.health / state.maxHealth * 100) + '%',
                         background: healthColor }" />
        </div>
      </div>
      <div class="bar-row">
        <span class="bar-lbl shield-lbl" :class="{ recharging: state.shieldActive }">SHIELD</span>
        <div class="bar-track">
          <div class="bar-fill shield-fill"
               :class="{ recharging: state.shieldActive }"
               :style="{ width: (state.shield / state.maxShield * 100) + '%' }" />
        </div>
      </div>
    </div>

    <!-- ── Team panel (below vitals) ─────────────────────────── -->
    <div class="team-panel">
      <div
        v-for="bot in state.bots"
        :key="bot.name"
        class="bot-row"
        :class="{
          'bot-dead':     bot.aiState === 'DEAD',
          'bot-down':     bot.aiState === 'DOWN',
          'bot-reviving': bot.aiState === 'REVIVING',
          'bot-combat':   bot.aiState === 'COMBAT',
        }"
      >
        <span class="bot-icon">{{ botIcon(bot) }}</span>
        <div class="bot-info">
          <span class="bot-name">{{ bot.name }}</span>
          <div class="bot-hp-track">
            <div class="bot-hp-fill" :style="{ width: (bot.hp / bot.maxHp * 100) + '%' }" />
            <!-- Revive progress overlaid in green -->
            <div v-if="bot.aiState === 'REVIVING'" class="bot-revive-fill"
                 :style="{ width: (bot.reviveProgress * 100) + '%' }" />
          </div>
        </div>
        <span v-if="bot.aiState === 'REVIVING'" class="bot-status-lbl">REVIVING</span>
        <span v-else-if="bot.aiState === 'DOWN'"    class="bot-status-lbl down-lbl">DOWN</span>
        <span v-else-if="bot.aiState === 'DEAD'"    class="bot-status-lbl dead-lbl">KIA</span>
      </div>
    </div>

    <!-- ── Tool bar — two slots (bottom-centre-left) ────────────── -->
    <div v-if="state.equippedTools?.some(t => t)" class="tool-bar">
      <div
        v-for="(tid, si) in state.equippedTools"
        v-show="tid"
        :key="si"
        class="tool-slot"
        :class="{
          selected: state.activeToolSlot === si,
          active:   state.activeToolSlot === si && state.toolActive,
          cooldown: state.activeToolSlot === si && state.toolCooldownLeft > 0,
        }"
      >
        <div class="slot-key">{{ si + 1 }}</div>
        <div class="tool-icon">
          {{ TOOL_ICONS[tid] ?? '⚙' }}
          <svg v-if="state.activeToolSlot === si && state.toolCooldownLeft > 0" class="cd-ring" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16"
              fill="none" stroke="#ffaa00" stroke-width="3"
              stroke-dasharray="100.5"
              :stroke-dashoffset="slotCdOffset(si)"
              transform="rotate(-90 18 18)" />
          </svg>
        </div>
        <div class="tool-info">
          <div class="tool-name">{{ TOOLS[tid]?.name }}</div>
          <div v-if="state.activeToolSlot === si && state.toolCooldownLeft > 0" class="tool-cd">{{ Math.ceil(state.toolCooldownLeft) }}s</div>
          <div v-else-if="state.activeToolSlot === si && state.toolActive" class="tool-active-lbl">ACTIVE</div>
          <div v-else-if="state.activeToolSlot === si" class="tool-ready">[Q]</div>
        </div>
      </div>
    </div>

    <!-- ── Bottom-right: ammo + grenades ──────────────────────── -->
    <div class="br-panel">
      <div class="grenade-row">
        <span v-for="i in 3" :key="i" class="gren-pip" :class="{ spent: i > state.grenades }">⬟</span>
        <span class="gren-lbl">[3] GRN</span>
      </div>
      <div class="grenade-row">
        <span v-for="i in 2" :key="i" class="flash-pip" :class="{ spent: i > state.flashbangs }">◈</span>
        <span class="gren-lbl">[4] FLB</span>
      </div>
      <div class="grenade-row">
        <span v-for="i in 2" :key="i" class="smoke-pip" :class="{ spent: i > state.smokeGrenades }">◎</span>
        <span class="gren-lbl">[5] SMK</span>
      </div>
      <Transition name="fade">
        <div v-if="state.isReloading" class="reload-wrap">
          <div class="reload-track">
            <div class="reload-fill" :style="{ width: (state.reloadProgress * 100) + '%' }" />
          </div>
          <span class="reload-lbl">RELOADING</span>
        </div>
      </Transition>
      <div class="ammo-row">
        <span class="ammo-cur">{{ state.ammo }}</span>
        <span class="ammo-sep"> / </span>
        <span class="ammo-res">{{ state.reserveAmmo }}</span>
      </div>
    </div>

    <!-- ── C4 plant progress (full width, centre screen) ─────── -->
    <Transition name="fade">
      <div v-if="state.isPlantingC4" class="c4-bar-wrap">
        <div class="c4-label">▣ PLANTING C4 — HOLD F</div>
        <div class="c4-track">
          <div class="c4-fill" :style="{ width: (state.c4PlantProgress * 100) + '%' }" />
        </div>
      </div>
    </Transition>

    <!-- ── Tie-up progress (full width, centre screen) ──────── -->
    <Transition name="fade">
      <div v-if="state.tyingProgress > 0" class="c4-bar-wrap">
        <div class="c4-label">✊ TYING UP — HOLD F</div>
        <div class="c4-track">
          <div class="c4-fill" :style="{ width: (state.tyingProgress * 100) + '%', background: '#ff7700' }" />
        </div>
      </div>
    </Transition>

    <!-- ── Thermal drill timer ─────────────────────────────── -->
    <Transition name="fade">
      <div v-if="state.drillActive" class="c4-bar-wrap">
        <div class="c4-label">🔥 THERMAL DRILL — {{ drillTimeLeft }}</div>
        <div class="c4-track">
          <div class="c4-fill" :style="{ width: (state.drillProgress * 100) + '%', background: '#ff6600' }" />
        </div>
      </div>
    </Transition>

    <!-- ── Saw bars progress ────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="state.isSawing" class="c4-bar-wrap">
        <div class="c4-label">SAWING BARS — HOLD F</div>
        <div class="c4-track">
          <div class="c4-fill" :style="{ width: (state.sawProgress * 100) + '%', background: '#ccaa00' }" />
        </div>
      </div>
    </Transition>

    <!-- ── Hack security computer progress ───────────────────── -->
    <Transition name="fade">
      <div v-if="state.hackActive" class="c4-bar-wrap">
        <div class="c4-label">HACKING SECURITY — {{ hackTimeLeft }}</div>
        <div class="c4-track">
          <div class="c4-fill" :style="{ width: (state.hackProgress * 100) + '%', background: '#22cc88' }" />
        </div>
      </div>
    </Transition>

    <!-- ── Escape countdown (5-4-3-2-1 at van) ──────────────── -->
    <Transition name="fade">
      <div v-if="state.escapeCountdown > 0" class="escape-countdown">
        <div class="ec-label">ESCAPING IN</div>
        <div class="ec-num">{{ Math.ceil(state.escapeCountdown) }}</div>
        <div class="ec-sub">Stay at the VAN!</div>
      </div>
    </Transition>

    <!-- ── Escape vehicle timer ──────────────────────────────── -->
    <Transition name="fade">
      <div v-if="state.escapeTimerActive" class="escape-timer" :class="{ urgent: state.escapeTimerLeft < 20 }">
        <div class="et-label">VAN LEAVING IN</div>
        <div class="et-time">{{ Math.ceil(state.escapeTimerLeft) }}s</div>
        <div class="et-track">
          <div class="et-fill" :style="{ width: (state.escapeTimerLeft / 90 * 100) + '%' }" />
        </div>
      </div>
    </Transition>

    <!-- ── Escort warning (guard watching player) ───────────── -->
    <Transition name="fade">
      <div v-if="state.beingEscorted && !state.maskOn" class="escort-warn" :class="{ escalated: state.escortEscalated }">
        {{ state.escortEscalated ? '⛔ STOP RIGHT THERE!' : '⚠ LEAVE THIS AREA' }}
      </div>
    </Transition>

    <!-- ── Disguise indicator ─────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="state.wearingDisguise" class="disguise-badge">
        DISGUISED
      </div>
    </Transition>

    <!-- ── Achievement popup ─────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="achievementState.popup" class="achievement-popup">
        <div class="ach-icon">{{ achievementState.popup.icon }}</div>
        <div class="ach-info">
          <div class="ach-title">ACHIEVEMENT UNLOCKED</div>
          <div class="ach-name">{{ achievementState.popup.name }}</div>
          <div class="ach-desc">{{ achievementState.popup.desc }}</div>
        </div>
      </div>
    </Transition>

    <!-- ── Mutator badge ──────────────────────────────────────── -->
    <div v-if="state.activeMutators?.length" class="mutator-badge">
      <span v-for="m in state.activeMutators" :key="m" class="mut-tag">{{ MUTATOR_ICONS[m] ?? '☢' }} {{ m.toUpperCase() }}</span>
    </div>

    <!-- ── Mask hint ──────────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="!state.maskOn && state.phase === 'STEALTH'" class="mask-hint">
        <span class="mask-key">[G]</span> PUT ON MASK
      </div>
    </Transition>

    <!-- ── Bag indicator ──────────────────────────────────────── -->
    <Transition name="bag-slide">
      <div v-if="state.isCarryingBag" class="bag-indicator">
        <span class="bag-icon">▣</span>
        <span class="bag-text">CARRYING BAG</span>
        <span class="bag-key">[G] DROP</span>
      </div>
    </Transition>

    <!-- ── Hint ───────────────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="state.hint && !state.isCarryingBag && state.maskOn" class="hint">{{ state.hint }}</div>
    </Transition>

    <!-- ── Interactable hint + hold progress ─────────────────── -->
    <Transition name="fade">
      <div v-if="state.interactHint && !state.hint" class="interact-hint">
        {{ state.interactHint }}
        <div v-if="state.interactHoldMax > 0 && state.interactProgress > 0" class="interact-bar">
          <div class="interact-fill" :style="{ width: state.interactProgress * 100 + '%' }" />
        </div>
        <div v-if="state.botReviveProgress > 0" class="interact-bar">
          <div class="interact-fill bot-revive-bar" :style="{ width: state.botReviveProgress * 100 + '%' }" />
        </div>
      </div>
    </Transition>

    <!-- ── DOWN overlay ───────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="state.isDown" class="down-overlay">
        <div class="down-title">YOU ARE DOWN</div>
        <div class="down-sub">Custody in {{ Math.ceil(state.custodyTimer) }}s</div>
        <div class="down-track">
          <div class="down-fill" :style="{ width: downTimerPct + '%' }" />
        </div>

        <!-- Waiting for revive -->
        <div class="revive-section">
          <div class="revive-hint">
            {{ state.reviveProgress > 0 ? 'BEING REVIVED…' : 'Wait for a teammate!' }}
          </div>
          <div v-if="state.reviveProgress > 0" class="revive-track">
            <div class="revive-fill" :style="{ width: (state.reviveProgress * 100) + '%' }" />
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Pager overlay ──────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="state.pagerActive" class="pager-overlay">
        <div class="pager-icon">📟</div>
        <div class="pager-title">PAGER RINGING</div>
        <div class="pager-hint">Hold <kbd>F</kbd> — Release = ALERT</div>

        <!-- Countdown bar (11s, shrinks to 0) -->
        <div class="pager-row">
          <span class="pager-label">TIME</span>
          <div class="pager-track">
            <div class="pager-time-fill" :style="{ width: (state.pagerTimeLeft / 11 * 100) + '%' }" />
          </div>
          <span class="pager-val">{{ Math.ceil(state.pagerTimeLeft) }}s</span>
        </div>

        <!-- Answer progress bar (fill 10s hold) -->
        <div class="pager-row">
          <span class="pager-label">HOLD</span>
          <div class="pager-track">
            <div class="pager-hold-fill" :style="{ width: (state.pagerAnswerProgress * 100) + '%' }" />
          </div>
          <span class="pager-val">{{ Math.floor(state.pagerAnswerProgress * 10) }}s</span>
        </div>
      </div>
    </Transition>

    <!-- ── Noise arc indicator (bottom-centre, stealth only) ──── -->
    <Transition name="fade">
      <div v-if="state.noiseRadius > 0 && state.phase === 'STEALTH'" class="noise-arc-wrap">
        <svg class="noise-arc-svg" viewBox="0 0 120 70" xmlns="http://www.w3.org/2000/svg">
          <path
            :d="noiseArcPath"
            fill="none"
            :stroke="noiseArcColor"
            stroke-width="3"
            stroke-linecap="round"
            opacity="0.85"
          />
        </svg>
        <span class="noise-lbl">{{ noiseArcLabel }}</span>
      </div>
    </Transition>

    <!-- ── Co-op revive progress (when reviving a teammate) ──── -->
    <div v-if="state.coopReviveProgress > 0" class="coop-revive-bar">
      <div class="coop-revive-label">REVIVING TEAMMATE…</div>
      <div class="revive-track">
        <div class="revive-fill" :style="{ width: (state.coopReviveProgress * 100) + '%' }" />
      </div>
    </div>

    <!-- ── Flashbang white-out overlay ──────────────────────── -->
    <div v-if="state.flashbangTimer > 0" class="flashbang-overlay" :style="{ opacity: Math.min(1, state.flashbangTimer * 0.7) }"></div>

    <!-- ── FPS counter (F3 toggle) ───────────────────────────── -->
    <div v-if="state.showFPS" class="fps-counter" :class="fpsClass">{{ state.fps }} FPS</div>

    <!-- ── Controls reminder ──────────────────────────────────── -->
    <div class="controls-reminder">RMB aim · SPACE jump · C crouch · R reload · T tool · F interact · G mask/drop · 3 grenade · F3 fps</div>

    <!-- ── Code puzzle overlay ───────────────────────────────── -->
    <HUDCodePuzzle
      v-if="state.activeCodePuzzle"
      :puzzle="state.activeCodePuzzle"
      @solved="onPuzzleSolved"
      @cancel="state.activeCodePuzzle = null"
    />

  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { state }    from '../game/state.ts'
import { achievementState } from '../game/Achievements.ts'
import { TOOLS }    from '../game/weapons/WeaponData.ts'
import HUDCodePuzzle from './HUDCodePuzzle.vue'

// ── Minimap ────────────────────────────────────────────────────
const minimapRef = ref<HTMLCanvasElement | null>(null)
const tacmapRef = ref<HTMLCanvasElement | null>(null)
let _minimapTimer: ReturnType<typeof setInterval> | null = null
const BOT_HEX = ['#4466ff', '#ff6622', '#22cc66']

function drawMinimap() {
  const canvas = minimapRef.value
  if (!canvas) return
  const ctx2 = canvas.getContext('2d')!
  const W = 130, H = 130, S = 5   // 5 px per metre
  ctx2.clearRect(0, 0, W, H)
  const mm = state.minimap
  const cx = W / 2, cy = H / 2

  // Background + range ring
  ctx2.fillStyle = 'rgba(0,8,18,0.78)'
  ctx2.fillRect(0, 0, W, H)
  ctx2.strokeStyle = 'rgba(255,255,255,0.07)'
  ctx2.beginPath(); ctx2.arc(cx, cy, 56, 0, Math.PI * 2); ctx2.stroke()

  const wx = (x: number) => cx + (x - mm.px) * S
  const wz = (z: number) => cy + (z - mm.pz) * S

  // Civs
  for (const c of mm.civs) {
    ctx2.fillStyle = c.tied ? '#ff7700' : '#ffddaa'
    ctx2.beginPath(); ctx2.arc(wx(c.x), wz(c.z), 3, 0, Math.PI * 2); ctx2.fill()
  }
  // Enemies
  for (const e of mm.enemies) {
    ctx2.fillStyle = e.st === 'COMBAT' ? '#ff3333' : e.st === 'SEARCH' ? '#ff8833' : '#cc6633'
    ctx2.beginPath(); ctx2.arc(wx(e.x), wz(e.z), 4, 0, Math.PI * 2); ctx2.fill()
  }
  // Bots
  for (let i = 0; i < mm.bots.length; i++) {
    const b = mm.bots[i]
    ctx2.fillStyle = (b.st === 'DEAD' || b.st === 'DOWN') ? '#444' : (BOT_HEX[i] ?? '#4466ff')
    ctx2.beginPath(); ctx2.arc(wx(b.x), wz(b.z), 4, 0, Math.PI * 2); ctx2.fill()
  }
  // Player triangle (pointing in yaw direction)
  ctx2.save()
  ctx2.translate(cx, cy)
  ctx2.rotate(-mm.pyaw)
  ctx2.fillStyle = '#00ff88'
  ctx2.beginPath(); ctx2.moveTo(0, -7); ctx2.lineTo(-4, 5); ctx2.lineTo(4, 5); ctx2.closePath()
  ctx2.fill()
  ctx2.restore()

  // Pings
  for (const p of mm.pings) {
    const px = wx(p.x), pz = wz(p.z)
    const pulse = 4 + Math.sin(Date.now() * 0.006) * 2
    ctx2.strokeStyle = p.color
    ctx2.lineWidth = 1.5
    ctx2.beginPath(); ctx2.arc(px, pz, pulse, 0, Math.PI * 2); ctx2.stroke()
    ctx2.fillStyle = p.color
    ctx2.beginPath(); ctx2.arc(px, pz, 2, 0, Math.PI * 2); ctx2.fill()
  }

  // Border
  ctx2.strokeStyle = 'rgba(255,255,255,0.14)'
  ctx2.lineWidth = 1
  ctx2.strokeRect(0.5, 0.5, W - 1, H - 1)
}

function drawTacmap() {
  const canvas = tacmapRef.value
  if (!canvas || !state.tacMapOpen) return
  const ctx2 = canvas.getContext('2d')!
  const W = 500, H = 500, S = 3   // 3 px per metre — wider view
  ctx2.clearRect(0, 0, W, H)
  const mm = state.minimap
  const cx = W / 2, cy = H / 2

  // Background
  ctx2.fillStyle = 'rgba(0,8,18,0.92)'
  ctx2.fillRect(0, 0, W, H)

  // Grid lines
  ctx2.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx2.lineWidth = 0.5
  const gridStep = 10 * S   // 10m grid
  const offsetX = (mm.px * S) % gridStep
  const offsetZ = (mm.pz * S) % gridStep
  for (let gx = -offsetX; gx < W; gx += gridStep) {
    ctx2.beginPath(); ctx2.moveTo(gx, 0); ctx2.lineTo(gx, H); ctx2.stroke()
  }
  for (let gz = -offsetZ; gz < H; gz += gridStep) {
    ctx2.beginPath(); ctx2.moveTo(0, gz); ctx2.lineTo(W, gz); ctx2.stroke()
  }

  // Range rings
  ctx2.strokeStyle = 'rgba(255,255,255,0.08)'
  for (const r of [20, 40, 60, 80]) {
    ctx2.beginPath(); ctx2.arc(cx, cy, r * S, 0, Math.PI * 2); ctx2.stroke()
  }

  const wx = (x: number) => cx + (x - mm.px) * S
  const wz = (z: number) => cy + (z - mm.pz) * S

  // Civs
  ctx2.font = '9px monospace'
  for (const c of mm.civs) {
    ctx2.fillStyle = c.tied ? '#ff7700' : '#ffddaa'
    ctx2.beginPath(); ctx2.arc(wx(c.x), wz(c.z), 4, 0, Math.PI * 2); ctx2.fill()
  }
  // Enemies with labels
  for (const e of mm.enemies) {
    const color = e.st === 'COMBAT' ? '#ff3333' : e.st === 'SEARCH' ? '#ff8833' : '#cc6633'
    ctx2.fillStyle = color
    ctx2.beginPath(); ctx2.arc(wx(e.x), wz(e.z), 5, 0, Math.PI * 2); ctx2.fill()
    // Enemy direction indicator
    ctx2.strokeStyle = color
    ctx2.lineWidth = 1
    ctx2.beginPath(); ctx2.arc(wx(e.x), wz(e.z), 7, 0, Math.PI * 2); ctx2.stroke()
  }
  // Bots
  for (let i = 0; i < mm.bots.length; i++) {
    const b = mm.bots[i]
    const col = (b.st === 'DEAD' || b.st === 'DOWN') ? '#444' : (BOT_HEX[i] ?? '#4466ff')
    ctx2.fillStyle = col
    ctx2.beginPath(); ctx2.arc(wx(b.x), wz(b.z), 5, 0, Math.PI * 2); ctx2.fill()
    ctx2.fillStyle = '#fff'
    ctx2.fillText(b.st === 'DEAD' ? 'X' : (i + 1).toString(), wx(b.x) - 3, wz(b.z) + 3)
  }
  // Pings
  for (const p of mm.pings) {
    const px = wx(p.x), pz = wz(p.z)
    const pulse = 6 + Math.sin(Date.now() * 0.006) * 3
    ctx2.strokeStyle = p.color
    ctx2.lineWidth = 2
    ctx2.beginPath(); ctx2.arc(px, pz, pulse, 0, Math.PI * 2); ctx2.stroke()
    ctx2.fillStyle = p.color
    ctx2.beginPath(); ctx2.arc(px, pz, 3, 0, Math.PI * 2); ctx2.fill()
  }
  // Player
  ctx2.save()
  ctx2.translate(cx, cy)
  ctx2.rotate(-mm.pyaw)
  ctx2.fillStyle = '#00ff88'
  ctx2.beginPath(); ctx2.moveTo(0, -10); ctx2.lineTo(-6, 8); ctx2.lineTo(6, 8); ctx2.closePath()
  ctx2.fill()
  ctx2.restore()

  // Border
  ctx2.strokeStyle = 'rgba(68, 170, 255, 0.3)'
  ctx2.lineWidth = 2
  ctx2.strokeRect(1, 1, W - 2, H - 2)

  // Distance markers
  ctx2.fillStyle = 'rgba(255,255,255,0.3)'
  ctx2.font = '10px monospace'
  for (const r of [20, 40, 60]) {
    ctx2.fillText(`${r}m`, cx + r * S + 3, cy + 4)
  }
}

onMounted(()   => { _minimapTimer = setInterval(() => { drawMinimap(); drawTacmap() }, 50) })
onUnmounted(() => { if (_minimapTimer) clearInterval(_minimapTimer) })

const fmtTime = secs => {
  const s = Math.ceil(secs)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// ── Phase display ──────────────────────────────────────────────
const phaseColor = computed(() => ({
  STEALTH:      'rgba(8,  50,  8,  0.88)',
  CONTROL:      'rgba(10, 50,  50, 0.90)',
  ANTICIPATION: 'rgba(90, 35,  0,  0.92)',
  ASSAULT:      'rgba(100, 0,  0,  0.92)',
  ESCAPED:      'rgba(0,  0,   0,  0.85)',
  FAILED:       'rgba(0,  0,   0,  0.85)',
}[state.phase] ?? 'rgba(0,0,0,0.8)'))

const phaseName = computed(() => {
  const isHoldout = state.gameMode === 'holdout'
  return ({
    STEALTH:      '● STEALTH',
    CONTROL:      isHoldout ? `💰 TRADE WINDOW  –  WAVE ${state.holdoutWave}` : '↩  POLICE REGROUPING',
    ANTICIPATION: isHoldout ? '⚠  HRT INCOMING' : '⚠  ANTICIPATION',
    ASSAULT:      isHoldout ? `⚡ HRT ASSAULT  –  WAVE ${state.holdoutWave + 1}` : `⚡ ASSAULT  –  WAVE ${state.waveNumber}`,
    ESCAPED:      isHoldout ? '✓ HOSTAGE TRADED' : '✓ ESCAPED',
    FAILED:       isHoldout && state.holdoutHostageFreed ? '✗ HOSTAGE RESCUED' : '✗ WASTED',
  }[state.phase] ?? state.phase)
})

const phaseSub = computed(() => {
  const isHoldout = state.gameMode === 'holdout'
  switch (state.phase) {
    case 'STEALTH':      return state.maskOn ? "No one knows you're here" : 'Blend in — press G to mask up'
    case 'CONTROL':      return isHoldout
      ? `Press [T] to trade  |  ${fmtTime(state.controlTimeLeft)}`
      : `NEXT WAVE IN  ${fmtTime(state.controlTimeLeft)}`
    case 'ANTICIPATION': return `ASSAULT IN  ${fmtTime(state.anticipationTimeLeft)}`
    case 'ASSAULT':      return isHoldout
      ? `Protect the hostage!  Kill ${state.killsThisAssault} / ${state.killQuota}  |  ${fmtTime(state.assaultTimeLeft)}`
      : `Kill ${state.killsThisAssault} / ${state.killQuota} cops to push back  |  ${fmtTime(state.assaultTimeLeft)}`
    default:             return ''
  }
})

const quotaPct = computed(() =>
  state.killQuota > 0 ? Math.min(100, state.killsThisAssault / state.killQuota * 100) : 0
)

const activeSight = computed(() => state.equippedAttachments?.sight ?? null)

const healthColor = computed(() => {
  const pct = state.health / state.maxHealth
  if (pct > 0.5) return '#22cc44'
  if (pct > 0.25) return '#ffaa00'
  return '#ee2222'
})

// ── Holdout hostage bar ──────────────────────────────────────
const hostagePct = computed(() =>
  state.holdoutHostageMaxSecurity > 0
    ? Math.max(0, state.holdoutHostageSecurity / state.holdoutHostageMaxSecurity * 100)
    : 0
)
const hostageColor = computed(() => {
  const pct = hostagePct.value
  if (pct > 50) return '#44ff44'
  if (pct > 25) return '#ffaa00'
  return '#ff2222'
})

// ── Objectives icons ──────────────────────────────────────────
const OBJ_META = { bag: { icon: '💼', label: 'Bag' }, keycard: { icon: '🔑', label: 'Keycard' }, code: { icon: '💻', label: 'Code terminal' }, c4: { icon: '💥', label: 'C4' } }
const objectiveIcons = computed(() => {
  if (state.gameMode === 'holdout') {
    // Holdout: show wave count
    return Array.from({ length: Math.max(1, state.holdoutWave + 1) }, (_, i) => ({
      icon: '🎯', label: `Wave ${i + 1}`, done: i < state.holdoutWave,
    }))
  }
  // Simple: show one icon per completed/remaining objective
  const total = state.objectivesTotal
  const done  = state.objectives
  return Array.from({ length: total }, (_, i) => ({
    icon: '💼', label: `Objective ${i + 1}`, done: i < done,
  }))
})

// ── Bot helpers ───────────────────────────────────────────────
function botIcon(bot) {
  if (bot.aiState === 'DEAD')     return '✗'
  if (bot.aiState === 'DOWN')     return '↓'
  if (bot.aiState === 'REVIVING') return '⟳'
  if (bot.aiState === 'COMBAT')   return '⚡'
  return '●'
}

// ── Mutator icons ─────────────────────────────────────────────
const MUTATOR_ICONS: Record<string, string> = {
  hydra: '🐍', glassCannon: '💥', darkness: '🌑', berserker: '⚡', oneDown: '☠', cursed: '🔴',
}

// ── Tool bar ──────────────────────────────────────────────────
const TOOL_ICONS = {
  ammoBag: '🎒', doctorBag: '🏥', ecm: '📡', gasMine: '☁',
  explosiveMine: '💣', breachCharge: '💥', apTurret: '🤖', gooGun: '🔫', sonar: '📶', zipline: '🪝',
}
function slotCdOffset(si) {
  if (si !== state.activeToolSlot || !state.toolCooldownMax) return 100.5
  return 100.5 * (1 - state.toolCooldownLeft / state.toolCooldownMax)
}

// ── Down timer ────────────────────────────────────────────────
const DOWN_TIMES = [30, 20, 10, 10]
const downTimerPct = computed(() => {
  const max = DOWN_TIMES[Math.max(0, state.downCount - 1)] ?? 30
  return Math.max(0, state.custodyTimer / max * 100)
})

// ── Detection color ───────────────────────────────────────────
const detectionColor = computed(() => {
  if (state.detectionRate > 75) return '#ff3333'
  if (state.detectionRate > 40) return '#ffaa00'
  return '#ffdd44'
})

// ── Zone ──────────────────────────────────────────────────────
const zoneTypeName = computed(() => ({
  public:  'PUBLIC AREA',
  private: 'RESTRICTED',
  secure:  'SECURE ZONE',
}[state.currentZone?.type] ?? ''))

const drillTimeLeft = computed(() => {
  const left = Math.max(0, Math.ceil(state.drillTimeMax * (1 - state.drillProgress)))
  const m = Math.floor(left / 60), s = left % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})
const hackTimeLeft = computed(() => {
  const left = Math.max(0, Math.ceil(180 * (1 - state.hackProgress)))
  const m = Math.floor(left / 60), s = left % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

// ── Noise arc ─────────────────────────────────────────────────
// Semicircle arc scaled by noiseRadius (max=12m → full arc)
const noiseArcPath = computed(() => {
  const pct   = Math.min(1, state.noiseRadius / 12)
  const cx    = 60, cy = 68, r = 52
  const angle = Math.PI * pct  // 0 → π
  const startA = Math.PI + (Math.PI - angle) / 2
  const endA   = startA + angle
  const sx = cx + r * Math.cos(startA), sy = cy + r * Math.sin(startA)
  const ex = cx + r * Math.cos(endA),   ey = cy + r * Math.sin(endA)
  const large = angle > Math.PI ? 1 : 0
  return `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`
})
const noiseArcColor = computed(() => {
  const r = state.noiseRadius
  if (r >= 10) return '#ff4444'
  if (r >= 5)  return '#ffaa00'
  return '#ffee44'
})
const noiseArcLabel = computed(() => {
  const r = state.noiseRadius
  if (r >= 10) return 'LOUD'
  if (r >= 5)  return 'NOISY'
  return 'QUIET'
})

// ── FPS color ─────────────────────────────────────────────────
const fpsClass = computed(() => {
  if (state.fps >= 55) return 'fps-good'
  if (state.fps >= 30) return 'fps-ok'
  return 'fps-bad'
})

// ── Code puzzle callback ──────────────────────────────────────
function onPuzzleSolved() {
  state.activeCodePuzzle = null
  // Engine.js handles completeObjective() via watching state.activeCodePuzzle
  // We dispatch a custom event that Engine listens for
  window.dispatchEvent(new CustomEvent('codePuzzleSolved'))
}
</script>

<style scoped>
* { box-sizing: border-box; user-select: none; }

.hud {
  position: fixed; inset: 0;
  pointer-events: none;
  font-family: 'Courier New', monospace;
  color: #fff;
}

/* ── Crosshair ── */
.crosshair { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); transition: transform 0.1s; }
.crosshair.ads { transform: translate(-50%, -50%) scale(0.5); }
.ch-h { position: absolute; width: 16px; height: 2px; background: rgba(255,255,255,0.85); top: 50%; left: 50%; transform: translate(-50%, -50%); }
.ch-v { position: absolute; width: 2px; height: 16px; background: rgba(255,255,255,0.85); top: 50%; left: 50%; transform: translate(-50%, -50%); }

/* ── Sight reticles ── */
.sight-reticle { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; }

/* Red Dot */
.red-dot .rd-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #ff2200; box-shadow: 0 0 8px 3px rgba(255,34,0,0.7);
}

/* Holographic */
.holo { width: 60px; height: 60px; }
.holo-ring {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 40px; height: 40px; border-radius: 50%;
  border: 1.5px solid rgba(0,255,68,0.6);
  box-shadow: 0 0 6px 1px rgba(0,255,68,0.25);
}
.holo-dot {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 4px; height: 4px; border-radius: 50%;
  background: #00ff44; box-shadow: 0 0 6px 2px rgba(0,255,68,0.6);
}
.holo-h {
  position: absolute; width: 60px; height: 1px;
  background: rgba(0,255,68,0.35);
  top: 50%; left: 50%; transform: translate(-50%, -50%);
}
.holo-v {
  position: absolute; width: 1px; height: 60px;
  background: rgba(0,255,68,0.35);
  top: 50%; left: 50%; transform: translate(-50%, -50%);
}

/* Scope */
.scope-overlay {
  position: absolute; inset: 0; pointer-events: none;
}
.scope-vignette {
  position: absolute; inset: 0;
  background: radial-gradient(circle at center, transparent 18%, rgba(0,0,0,0.85) 28%, #000 35%);
}
.scope-cross-h {
  position: absolute; top: 50%; left: 0; right: 0; height: 1px;
  background: rgba(0,0,0,0.9); transform: translateY(-0.5px);
}
.scope-cross-v {
  position: absolute; left: 50%; top: 0; bottom: 0; width: 1px;
  background: rgba(0,0,0,0.9); transform: translateX(-0.5px);
}
.scope-dot {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 3px; height: 3px; border-radius: 50%;
  background: #ff1100; box-shadow: 0 0 4px 1px rgba(255,17,0,0.6);
}
.scope-mil {
  position: absolute; background: rgba(0,0,0,0.8);
}
.scope-mil-l { top: 50%; left: calc(50% - 80px); width: 12px; height: 1px; transform: translateY(-0.5px); }
.scope-mil-r { top: 50%; left: calc(50% + 68px); width: 12px; height: 1px; transform: translateY(-0.5px); }
.scope-mil-t { left: 50%; top: calc(50% - 80px); width: 1px; height: 12px; transform: translateX(-0.5px); }
.scope-mil-b { left: 50%; top: calc(50% + 68px); width: 1px; height: 12px; transform: translateX(-0.5px); }

/* ── Phase panel ── */
.phase-panel {
  position: absolute; top: 0; left: 50%; transform: translateX(-50%);
  width: 420px; padding: 8px 14px 10px;
  border-radius: 0 0 6px 6px; text-align: center; transition: background 0.4s;
}
.phase-name { font-size: 20px; font-weight: bold; letter-spacing: 0.05em; text-shadow: 0 1px 4px #000a; }
.phase-sub  { font-size: 13px; margin-top: 3px; color: #ffe8b0; text-shadow: 0 1px 3px #000a; }
.quota-track { margin-top: 6px; height: 8px; background: rgba(50,0,0,0.7); border-radius: 4px; overflow: hidden; }
.quota-fill  { height: 100%; background: #dd2222; border-radius: 4px; transition: width 0.2s; }

/* ── Alarm bar ── */
.alarm-panel { position: absolute; top: 12px; left: 12px; display: flex; align-items: center; gap: 8px; }
.bar-lbl  { font-size: 11px; letter-spacing: 0.05em; opacity: 0.8; white-space: nowrap; }
.bar-track { width: 180px; height: 14px; background: rgba(0,0,0,0.6); border-radius: 3px; overflow: hidden; }
.bar-fill  { height: 100%; border-radius: 3px; transition: width 0.15s; }
.alarm-fill { background: #ff8800; }

/* ── Objectives ── */
.obj-panel  { position: absolute; top: 12px; right: 14px; text-align: right; }
.obj-icons  { display: flex; justify-content: flex-end; gap: 6px; margin-bottom: 4px; }
.obj-icon   { font-size: 18px; opacity: 0.35; transition: opacity 0.3s; }
.obj-icon.done { opacity: 1; filter: drop-shadow(0 0 4px #ffe060); }
.money      { font-size: 16px; color: #ffe060; text-shadow: 0 1px 3px #000c; }

/* ── Concealment warning ── */
.conceal-warn {
  position: absolute; top: 90px; left: 50%; transform: translateX(-50%);
  font-size: 12px; letter-spacing: 0.14em; color: #ff4444;
  background: rgba(80,0,0,0.75); padding: 4px 14px; border-radius: 4px;
  border: 1px solid #ff444466;
  animation: blink 1.2s ease-in-out infinite;
  white-space: nowrap;
}
@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

/* ── Vitals ── */
.vitals { position: absolute; bottom: 36px; left: 14px; display: flex; flex-direction: column; gap: 6px; }
.bar-row { display: flex; align-items: center; gap: 8px; }
.vitals .bar-track { width: 180px; height: 16px; }
.health-fill { transition: width 0.2s, background 0.5s; }
.shield-fill { background: #00ccff; transition: width 0.1s; }
.shield-fill.recharging { background: #44eeff; box-shadow: 0 0 8px #00ccffaa; animation: shield-pulse 0.55s ease-in-out infinite alternate; }
@keyframes shield-pulse { from { opacity: 0.7; } to { opacity: 1.0; } }
.shield-lbl { transition: color 0.3s; }
.shield-lbl.recharging { color: #88eeff; }

/* ── Team panel ── */
.team-panel {
  position: absolute; bottom: 130px; left: 14px;
  display: flex; flex-direction: column; gap: 5px;
}
.bot-row {
  display: flex; align-items: center; gap: 7px;
  background: rgba(0,0,0,0.55); border: 1px solid rgba(255,255,255,0.10);
  border-radius: 4px; padding: 4px 9px 4px 6px;
  transition: border-color 0.2s;
}
.bot-row.bot-combat   { border-color: rgba(255,120,0,0.5); }
.bot-row.bot-reviving { border-color: rgba(100,255,100,0.55); animation: blink 0.7s ease-in-out infinite; }
.bot-row.bot-dead     { opacity: 0.45; border-color: rgba(180,0,0,0.4); }
.bot-row.bot-down     { opacity: 0.65; border-color: rgba(255,80,0,0.5); animation: blink 1.2s ease-in-out infinite; }
.bot-icon { font-size: 12px; width: 14px; text-align: center; }
.bot-row.bot-combat   .bot-icon { color: #ff8800; }
.bot-row.bot-reviving .bot-icon { color: #88ff88; }
.bot-row.bot-down     .bot-icon { color: #ff6622; }
.bot-row.bot-dead     .bot-icon { color: #cc2222; }
.bot-info  { display: flex; flex-direction: column; gap: 2px; }
.bot-name  { font-size: 10px; letter-spacing: 0.08em; color: #ccc; line-height: 1; }
.bot-hp-track {
  position: relative; width: 100px; height: 5px;
  background: rgba(255,255,255,0.12); border-radius: 3px; overflow: hidden;
}
.bot-hp-fill {
  height: 100%; background: #66aaff; border-radius: 3px; transition: width 0.15s;
}
.bot-row:nth-child(2) .bot-hp-fill { background: #ff7744; }
.bot-row:nth-child(3) .bot-hp-fill { background: #44dd88; }
.bot-revive-fill {
  position: absolute; top: 0; left: 0; height: 100%;
  background: #88ff88; border-radius: 3px; transition: width 0.1s linear; opacity: 0.9;
}
.bot-status-lbl { font-size: 9px; letter-spacing: 0.1em; color: #88ff88; white-space: nowrap; }
.down-lbl       { color: #ff6622; }
.dead-lbl       { color: #cc4444; }
.bot-revive-bar { background: #44ff88 !important; }

/* ── Tool bar ── */
.tool-bar {
  position: absolute; bottom: 95px; left: 160px;
  display: flex; align-items: stretch; gap: 6px;
}
.tool-slot {
  display: flex; align-items: center; gap: 8px;
  background: rgba(0,0,0,0.62); border: 1px solid #444;
  border-radius: 6px; padding: 6px 12px 6px 8px;
  transition: border-color .15s;
}
.tool-slot.selected { border-color: #ffaa00; }
.tool-slot.active   { border-color: #44ff88; }
.slot-key { font-size: 10px; color: #666; align-self: flex-start; margin-top: 2px; }
.tool-icon {
  position: relative; width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
}
.tool-slot.active .tool-icon { filter: drop-shadow(0 0 6px #44ff88); animation: tool-pulse 0.8s ease-in-out infinite alternate; }
@keyframes tool-pulse { from { filter: drop-shadow(0 0 4px #ffaa00); } to { filter: drop-shadow(0 0 12px #ffdd44); } }
.cd-ring { position: absolute; inset: 0; width: 100%; height: 100%; }
.tool-info { display: flex; flex-direction: column; gap: 2px; }
.tool-name { font-size: 11px; letter-spacing: 0.08em; color: #ccc; }
.tool-cd   { font-size: 13px; color: #ffaa00; font-weight: bold; }
.tool-active-lbl { font-size: 11px; color: #44ff88; letter-spacing: 0.1em; }
.tool-ready { font-size: 11px; color: #88ee88; opacity: 0.7; }

/* ── Bottom-right panel ── */
.br-panel { position: absolute; bottom: 16px; right: 14px; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.grenade-row { display: flex; align-items: center; gap: 5px; }
.gren-pip  { font-size: 18px; color: #88ee44; transition: color 0.2s, opacity 0.2s; }
.gren-pip.spent { color: #444; opacity: 0.4; }
.flash-pip { font-size: 16px; color: #eeeebb; transition: color 0.2s, opacity 0.2s; }
.flash-pip.spent { color: #444; opacity: 0.4; }
.smoke-pip { font-size: 16px; color: #99ccaa; transition: color 0.2s, opacity 0.2s; }
.smoke-pip.spent { color: #444; opacity: 0.4; }
.gren-lbl  { font-size: 11px; opacity: 0.55; margin-left: 4px; }

/* ── Flashbang blind overlay ── */
.flashblind-overlay {
  position: fixed; inset: 0;
  background: white;
  pointer-events: none;
  z-index: 900;
  transition: opacity 0.1s;
}
.reload-wrap  { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
.reload-track { width: 160px; height: 6px; background: rgba(0,0,0,0.6); border-radius: 3px; overflow: hidden; }
.reload-fill  { height: 100%; background: #ffcc00; border-radius: 3px; transition: width 0.05s linear; }
.reload-lbl   { font-size: 11px; opacity: 0.75; letter-spacing: 0.1em; }
.ammo-row { text-align: right; text-shadow: 0 1px 4px #000c; }
.ammo-cur { font-size: 36px; font-weight: bold; }
.ammo-sep { font-size: 22px; opacity: 0.5; }
.ammo-res { font-size: 22px; opacity: 0.7; }

/* ── C4 plant bar ── */
.c4-bar-wrap {
  position: absolute; bottom: 130px; left: 50%; transform: translateX(-50%);
  width: 380px; display: flex; flex-direction: column; align-items: center; gap: 6px;
}
.c4-label { font-size: 13px; letter-spacing: 0.12em; color: #ff8844; font-weight: bold; }
.c4-track { width: 100%; height: 10px; background: rgba(0,0,0,0.6); border-radius: 5px; overflow: hidden; }
.c4-fill  { height: 100%; background: linear-gradient(90deg, #ff4400, #ff8844); border-radius: 5px; transition: width 0.05s linear; }

/* ── Escort warning ── */
.escort-warn {
  position: absolute; bottom: 160px; left: 50%; transform: translateX(-50%);
  font-size: 14px; letter-spacing: 0.16em; white-space: nowrap;
  color: #ffcc00; background: rgba(60, 40, 0, 0.82);
  padding: 6px 18px; border-radius: 4px;
  border: 1px solid rgba(255, 200, 0, 0.45);
  animation: blink 0.9s ease-in-out infinite;
  transition: color 0.3s, background 0.3s, border-color 0.3s;
}
.escort-warn.escalated {
  color: #ff4444; background: rgba(80, 0, 0, 0.88);
  border-color: rgba(255, 60, 60, 0.55);
  animation: blink 0.45s ease-in-out infinite;
}

/* ── Disguise badge ── */
.disguise-badge {
  position: absolute; top: 58px; left: 50%; transform: translateX(-50%);
  background: rgba(60, 180, 80, 0.25); border: 1px solid rgba(80, 220, 100, 0.5);
  color: #66ee88; font-size: 13px; letter-spacing: 0.14em; padding: 3px 12px;
  border-radius: 4px; text-shadow: 0 0 8px #44ff6688;
  animation: disguise-pulse 2s ease-in-out infinite;
}
@keyframes disguise-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.65; } }

/* ── Achievement popup ── */
.achievement-popup {
  position: absolute; top: 80px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 12px;
  background: rgba(20, 20, 30, 0.85); border: 1px solid rgba(255, 215, 0, 0.6);
  padding: 10px 18px; border-radius: 6px; pointer-events: none;
  animation: ach-slide 0.4s ease-out;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
}
.ach-icon { font-size: 32px; }
.ach-info { display: flex; flex-direction: column; }
.ach-title { font-size: 10px; color: #ffd700; letter-spacing: 0.15em; }
.ach-name { font-size: 16px; color: #ffffff; font-weight: bold; }
.ach-desc { font-size: 11px; color: #aaaaaa; margin-top: 2px; }
@keyframes ach-slide { from { transform: translateX(-50%) translateY(-20px); opacity: 0; } to { transform: translateX(-50%); opacity: 1; } }

/* ── Tactical map overlay ── */
.tacmap-overlay {
  position: fixed; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: rgba(0, 0, 0, 0.55); backdrop-filter: blur(3px);
  pointer-events: none; z-index: 30;
}
.tacmap-canvas {
  border: 2px solid rgba(68, 170, 255, 0.35);
  border-radius: 4px;
  box-shadow: 0 0 30px rgba(0, 100, 200, 0.15);
}
.tacmap-label {
  margin-top: 8px;
  font-size: 12px; letter-spacing: 0.2em; color: rgba(68, 170, 255, 0.6);
}

/* ── Mutator badge ── */
.mutator-badge {
  position: absolute; top: 58px; right: 14px;
  display: flex; flex-direction: column; align-items: flex-end; gap: 4px;
  pointer-events: none;
}
.mut-tag {
  background: rgba(180, 20, 0, 0.28); border: 1px solid rgba(220, 50, 0, 0.4);
  color: #ff8855; font-size: 11px; letter-spacing: 0.12em; padding: 2px 9px;
  border-radius: 3px; font-family: 'Courier New', monospace;
}

/* ── Mask hint ── */
.mask-hint {
  position: absolute; bottom: 130px; left: 50%; transform: translateX(-50%);
  font-size: 15px; letter-spacing: 0.12em; white-space: nowrap;
  color: #ffe830; text-shadow: 0 2px 8px #000c;
  animation: mask-blink 1.4s ease-in-out infinite;
}
@keyframes mask-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.mask-key { font-weight: bold; background: rgba(255,232,48,0.18); padding: 1px 5px; border-radius: 3px; border: 1px solid rgba(255,232,0,0.35); }

/* ── Bag indicator ── */
.bag-indicator {
  position: absolute; bottom: 100px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 12px;
  background: rgba(180, 120, 0, 0.85); padding: 8px 22px; border-radius: 6px;
  border: 1px solid rgba(255, 200, 50, 0.5); white-space: nowrap;
}
.bag-icon { font-size: 22px; color: #ffe060; }
.bag-text { font-size: 16px; font-weight: bold; letter-spacing: 0.08em; }
.bag-key  { font-size: 13px; opacity: 0.7; }

/* ── Hint ── */
.hint {
  position: absolute; bottom: 70px; left: 50%; transform: translateX(-50%);
  font-size: 20px; color: #ffe830; white-space: nowrap;
  text-shadow: 0 2px 6px #000e, 0 0 12px #0008; letter-spacing: 0.05em;
}

/* ── Interactable hint ── */
.interact-hint {
  position: absolute; bottom: 70px; left: 50%; transform: translateX(-50%);
  font-size: 18px; color: #88ddff; white-space: nowrap; text-align: center;
  text-shadow: 0 2px 6px #000e, 0 0 12px #0008; letter-spacing: 0.05em;
}
.interact-bar {
  margin-top: 6px; width: 200px; height: 6px;
  background: rgba(255,255,255,0.15); border-radius: 3px; overflow: hidden;
}
.interact-fill {
  height: 100%; background: linear-gradient(90deg, #44aaff, #88ddff);
  border-radius: 3px; transition: width 0.06s linear;
}

/* ── DOWN overlay ── */
.down-overlay {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  background: rgba(80, 0, 0, 0.88); border: 2px solid #aa2222;
  border-radius: 8px; padding: 24px 44px;
  box-shadow: 0 0 40px rgba(200, 0, 0, 0.4);
}
.down-title { font-size: 28px; font-weight: 900; color: #ff4444; letter-spacing: 0.15em; text-shadow: 0 0 12px #ff0000; }
.down-sub   { font-size: 16px; color: #ffaaaa; letter-spacing: 0.1em; }
.down-track { width: 260px; height: 8px; background: rgba(0,0,0,0.5); border-radius: 4px; overflow: hidden; }
.down-fill  { height: 100%; background: #ff4444; border-radius: 4px; transition: width 0.1s linear; }
.revive-section { display: flex; flex-direction: column; align-items: center; gap: 6px; margin-top: 4px; width: 100%; }
.revive-hint  { font-size: 13px; letter-spacing: 0.1em; color: #88ff88; }
.revive-track { width: 260px; height: 10px; background: rgba(0,0,0,0.5); border-radius: 5px; overflow: hidden; border: 1px solid rgba(100,255,100,0.25); }
.revive-fill  { height: 100%; background: linear-gradient(90deg, #22aa44, #88ff88); border-radius: 5px; transition: width 0.08s linear; }

.coop-revive-bar {
  position: absolute; bottom: 180px; left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  background: rgba(0,0,0,0.6); padding: 10px 24px; border-radius: 6px;
  border: 1px solid rgba(100,255,100,0.3);
}
.coop-revive-label { font-size: 13px; letter-spacing: 0.12em; color: #88ff88; }

/* ── Detection bar (below crosshair) ── */
.detect-wrap {
  position: absolute; top: calc(50% + 22px); left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.detect-track {
  width: 180px; height: 8px;
  background: rgba(0,0,0,0.55); border-radius: 4px; overflow: hidden;
  border: 1px solid rgba(255,255,255,0.08);
}
.detect-fill { height: 100%; border-radius: 4px; transition: width 0.15s; }
.detect-lbl  { font-size: 10px; letter-spacing: 0.14em; opacity: 0.85; }
.sus-lbl     { font-size: 9px; color: #ff6644; margin-left: 8px; letter-spacing: 0.08em; }

/* ── Controls reminder ── */
.controls-reminder {
  position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%);
  font-size: 10px; opacity: 0.28; white-space: nowrap; letter-spacing: 0.04em;
}

/* ── Zone badge ── */
.zone-badge {
  position: absolute; top: 12px; left: 14px;
  display: flex; align-items: center; gap: 6px;
  padding: 5px 10px; border-radius: 4px; font-size: 11px; letter-spacing: 0.08em;
  background: rgba(0,0,0,0.65); border: 1px solid rgba(255,255,255,0.12); white-space: nowrap;
}
.zone-dot   { font-size: 9px; }
.zone-label { font-weight: bold; font-size: 12px; }
.zone-type  { opacity: 0.6; font-size: 10px; }
.zone-public  { border-color: rgba(80,200,80,0.35); }
.zone-public  .zone-dot   { color: #55dd55; }
.zone-public  .zone-label { color: #88ff88; }
.zone-private { border-color: rgba(220,180,0,0.4); }
.zone-private .zone-dot   { color: #ffcc22; }
.zone-private .zone-label { color: #ffe055; }
.zone-secure  { border-color: rgba(220,40,40,0.5); }
.zone-secure  .zone-dot   { color: #ff3333; animation: zone-blink 1s ease-in-out infinite; }
.zone-secure  .zone-label { color: #ff7777; }
@keyframes zone-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }

/* ── Transitions ── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from,  .fade-leave-to      { opacity: 0; }
.bag-slide-enter-active { transition: opacity 0.2s, transform 0.2s; }
.bag-slide-leave-active { transition: opacity 0.15s, transform 0.15s; }
.bag-slide-enter-from   { opacity: 0; transform: translateX(-50%) translateY(12px); }
.bag-slide-leave-to     { opacity: 0; transform: translateX(-50%) translateY(12px); }

/* ── Minimap ── */
.minimap {
  position: absolute; bottom: 170px; right: 14px;
  width: 130px; height: 130px;
  border-radius: 3px; pointer-events: none;
  image-rendering: pixelated;
}

/* ── Heist stats ── */
.heist-stats {
  position: absolute; bottom: 162px; right: 14px;
  display: flex; gap: 12px;
  font-size: 11px; color: #aaa;
  pointer-events: none;
  background: rgba(0,0,0,0.5); padding: 2px 8px; border-radius: 3px;
  width: 130px; justify-content: space-around;
}
.heist-stats span { text-shadow: 0 1px 2px #000; cursor: default; }

/* ── Kill feed ── */
.kill-feed {
  position: absolute; top: 65px; right: 14px;
  display: flex; flex-direction: column; align-items: flex-end; gap: 3px;
  pointer-events: none; max-width: 260px;
}
.kf-entry {
  font: 600 11px/1.4 monospace;
  background: rgba(0,0,0,0.55); padding: 2px 8px; border-radius: 3px;
  text-shadow: 0 1px 3px #000; white-space: nowrap;
}
.killfeed-enter-active { transition: opacity .18s, transform .18s; }
.killfeed-leave-active { transition: opacity .4s; }
.killfeed-enter-from   { opacity: 0; transform: translateX(10px); }
.killfeed-leave-to     { opacity: 0; }

/* ── Bot voice lines ── */
.bot-voices {
  position: absolute; bottom: 260px; left: 14px;
  display: flex; flex-direction: column-reverse; gap: 3px;
  pointer-events: none;
}
.bv-entry {
  font: 11px/1.4 monospace;
  background: rgba(0,0,0,0.55); padding: 3px 8px; border-radius: 3px;
  white-space: nowrap;
}
.bv-name { font-weight: 700; margin-right: 5px; }
.bv-text { color: #ddd; }
.voice-enter-active { transition: opacity .15s, transform .15s; }
.voice-leave-active { transition: opacity .45s; }
.voice-enter-from   { opacity: 0; transform: translateX(-8px); }
.voice-leave-to     { opacity: 0; }

/* ── Escape vehicle timer ── */
.escape-timer {
  position: absolute; bottom: 200px; left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  pointer-events: none;
}
.et-label { font: 600 11px/1 monospace; color: #ffcc00; letter-spacing: 0.14em; }
.et-time  { font: 700 46px/1 monospace; color: #ff8800; text-shadow: 0 0 24px #ff550088; }
.escape-timer.urgent .et-time { color: #ff2222; animation: blink 0.5s ease-in-out infinite; }
.et-track { width: 220px; height: 7px; background: rgba(255,255,255,0.12); border-radius: 4px; }
.et-fill  { height: 100%; background: #ff8800; border-radius: 4px; transition: width .5s linear; }
.escape-timer.urgent .et-fill { background: #ff2222; }

/* ── Holdout: hostage security bar ── */
.hostage-bar-wrap {
  position: absolute; top: 60px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 8px;
  background: rgba(0,0,0,0.7); padding: 6px 14px; border-radius: 5px;
  border: 1px solid rgba(255,100,0,0.35);
}
.hostage-lbl { font-size: 11px; letter-spacing: 0.12em; color: #ff8844; font-weight: bold; white-space: nowrap; }
.hostage-track { width: 200px; height: 12px; background: rgba(0,0,0,0.6); border-radius: 4px; overflow: hidden; }
.hostage-fill { height: 100%; border-radius: 4px; transition: width 0.15s; }
.hostage-val { font-size: 12px; color: #ffcc66; min-width: 32px; text-align: right; }

/* ── Holdout: trade overlay ── */
.trade-overlay {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  background: rgba(0, 40, 0, 0.92); border: 2px solid #44ff44;
  border-radius: 10px; padding: 28px 44px;
  box-shadow: 0 0 40px rgba(0, 255, 0, 0.15);
  pointer-events: none;
}
.trade-title { font-size: 24px; font-weight: 900; color: #44ff88; letter-spacing: 0.15em; text-shadow: 0 0 12px #00ff44; }
.trade-reward { font-size: 38px; font-weight: 900; color: #ffe060; text-shadow: 0 0 20px #ffcc00; }
.trade-wave { font-size: 14px; color: #88ffaa; letter-spacing: 0.1em; }
.trade-actions { display: flex; flex-direction: column; align-items: center; gap: 6px; margin-top: 4px; }
.trade-key {
  font-size: 16px; font-weight: 900; color: #44ff88;
  background: rgba(0,100,0,0.4); padding: 6px 18px; border-radius: 4px;
  border: 1px solid rgba(68,255,136,0.5); letter-spacing: 0.1em;
}
.trade-hold { font-size: 12px; color: #88cc88; opacity: 0.8; letter-spacing: 0.08em; }
.trade-timer { font-size: 20px; color: #ffaa00; font-weight: bold; }

/* ── Pager overlay ── */
.pager-overlay {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  background: rgba(60, 20, 0, 0.92);
  border: 2px solid rgba(255, 100, 0, 0.7);
  border-radius: 8px; padding: 22px 40px;
  box-shadow: 0 0 40px rgba(255, 80, 0, 0.35), inset 0 0 20px rgba(255, 60, 0, 0.05);
  font-family: 'Courier New', monospace;
  animation: pager-pulse 0.6s ease-in-out infinite alternate;
}
@keyframes pager-pulse {
  from { border-color: rgba(255, 100, 0, 0.5); box-shadow: 0 0 30px rgba(255, 80, 0, 0.25); }
  to   { border-color: rgba(255, 160, 0, 0.9); box-shadow: 0 0 55px rgba(255, 100, 0, 0.55); }
}
.pager-icon  { font-size: 32px; line-height: 1; }
.pager-title { font-size: 22px; font-weight: 900; color: #ff6600; letter-spacing: 0.2em; text-shadow: 0 0 10px #ff4400; }
.pager-hint  { font-size: 13px; color: #ffbbaa; letter-spacing: 0.08em; }
.pager-hint kbd {
  background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3);
  border-radius: 3px; padding: 1px 6px; font-family: inherit;
}
.pager-row { display: flex; align-items: center; gap: 8px; width: 100%; }
.pager-label { font-size: 10px; letter-spacing: 0.14em; color: #ff9955; width: 32px; flex-shrink: 0; }
.pager-track { flex: 1; height: 8px; background: rgba(0,0,0,0.5); border-radius: 4px; overflow: hidden; border: 1px solid rgba(255,100,0,0.2); }
.pager-time-fill {
  height: 100%; background: linear-gradient(90deg, #ff2200, #ff8800);
  border-radius: 4px; transition: width 0.1s linear;
}
.pager-hold-fill {
  height: 100%; background: linear-gradient(90deg, #ff6600, #ffcc00);
  border-radius: 4px; transition: width 0.1s linear;
}
.pager-val { font-size: 11px; color: #ffcc88; width: 22px; text-align: right; flex-shrink: 0; }

/* ── Escape countdown ── */
.escape-countdown {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  pointer-events: none;
}
.ec-label { font-size: 13px; letter-spacing: 0.25em; color: #ffe060; text-shadow: 0 0 10px #ffcc00; }
.ec-num {
  font-size: 96px; font-weight: 900; line-height: 1;
  color: #fff; text-shadow: 0 0 40px #ffcc00, 0 2px 8px #000;
  animation: ec-pulse 1s ease-in-out infinite;
}
@keyframes ec-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
.ec-sub { font-size: 12px; letter-spacing: 0.2em; color: rgba(255,230,100,0.7); }

/* ── Flashbang overlay ── */
.flashbang-overlay {
  position: absolute; inset: 0;
  background: white;
  pointer-events: none; z-index: 50;
  transition: opacity 0.1s;
}

/* ── FPS counter ── */
.fps-counter {
  position: absolute; top: 6px; left: 50%; transform: translateX(-50%);
  font-size: 11px; font-family: 'Courier New', monospace;
  padding: 1px 8px; border-radius: 3px;
  background: rgba(0,0,0,0.55); letter-spacing: 0.08em;
  pointer-events: none;
}
.fps-good { color: #44ff88; }
.fps-ok   { color: #ffcc00; }
.fps-bad  { color: #ff4444; animation: blink 0.6s ease-in-out infinite; }

/* ── Noise arc indicator ── */
.noise-arc-wrap {
  position: absolute; bottom: 100px; left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  pointer-events: none;
}
.noise-arc-svg { width: 120px; height: 70px; }
.noise-lbl {
  font-size: 9px; letter-spacing: 0.2em; color: rgba(255,255,255,0.7);
  text-shadow: 0 0 4px #000;
}
</style>
