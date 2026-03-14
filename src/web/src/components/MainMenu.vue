<template>
  <div class="menu-root">

    <!-- Animated grid background -->
    <div class="grid-bg" />

    <div class="center">
      <div class="logo">HEIST</div>
      <div class="tagline">Rob the vault · Carry the bags · Escape</div>

      <!-- ── Level selector ─────────────────────────────────── -->
      <div class="level-sel">
        <button class="arrow" @click="prev">&#8249;</button>

        <Transition :name="slideDir" mode="out-in">
          <div class="level-card" :key="state.selectedLevel">
            <div class="lc-num">{{ String(state.selectedLevel + 1).padStart(2, '0') }} / {{ LEVELS.length }}</div>
            <div class="lc-name">{{ current.name }}</div>
            <div class="lc-desc">{{ current.desc }}</div>
            <div class="lc-row">
              <span class="lc-diff">
                <span v-for="n in 4" :key="n" :class="['star', { lit: n <= current.difficulty }]">★</span>
              </span>
              <span class="lc-obj">{{ current.objectives?.length ?? '?' }} objectives</span>
            </div>
          </div>
        </Transition>

        <button class="arrow" @click="next">&#8250;</button>
      </div>

      <button class="btn-play" @click="$emit('openLobby')">▶ PLAY</button>
      <button class="btn-coop" @click="$emit('openCoop')">👥 CO-OP</button>
      <button class="btn-builder" @click="$emit('openBuilder')">⚒ LEVEL BUILDER</button>

      <div class="controls-grid">
        <div class="ctrl-col">
          <div class="ctrl-head">MOVEMENT</div>
          <div>WASD — Move</div>
          <div>SHIFT — Sprint</div>
          <div>SPACE — Jump</div>
          <div>C — Crouch</div>
        </div>
        <div class="ctrl-col">
          <div class="ctrl-head">COMBAT</div>
          <div>LMB — Shoot (auto)</div>
          <div>R — Reload</div>
          <div>3 — Throw grenade</div>
        </div>
        <div class="ctrl-col">
          <div class="ctrl-head">HEIST</div>
          <div>G — Mask up / Drop bag</div>
          <div>F — Pick up bag</div>
          <div>ESC — Pause</div>
        </div>
      </div>
    </div>

    <div class="footer">Rob the bank. Don't get wasted.</div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { state }         from '../game/state.ts'
import { LEVELS }        from '../game/levels/index.ts'

defineEmits(['openLobby', 'openCoop', 'openBuilder'])

const current  = computed(() => LEVELS[state.selectedLevel])
const slideDir = ref('slide-right')

function prev() {
  slideDir.value = 'slide-left'
  state.selectedLevel = (state.selectedLevel - 1 + LEVELS.length) % LEVELS.length
}
function next() {
  slideDir.value = 'slide-right'
  state.selectedLevel = (state.selectedLevel + 1) % LEVELS.length
}
</script>

<style scoped>
* { box-sizing: border-box; }

/* ── Root ── */
.menu-root {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0e;
  font-family: 'Courier New', monospace;
  color: #eee;
  overflow: hidden;
  z-index: 100;
}

/* ── Animated grid ── */
.grid-bg {
  position: absolute;
  inset: -100px;
  background-image:
    linear-gradient(rgba(255, 160, 0, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 160, 0, 0.08) 1px, transparent 1px);
  background-size: 60px 60px;
  animation: grid-scroll 8s linear infinite;
}
@keyframes grid-scroll {
  from { transform: translateY(0); }
  to   { transform: translateY(60px); }
}

/* ── Center card ── */
.center {
  position: relative;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
}

/* ── Logo ── */
.logo {
  font-size: clamp(4rem, 12vw, 8rem);
  font-weight: 900;
  letter-spacing: 0.35em;
  color: #ffaa00;
  text-shadow:
    0 0 40px rgba(255, 160, 0, 0.8),
    0 0 80px rgba(255, 100, 0, 0.4),
    0 4px 12px #0008;
  animation: logo-pulse 2.8s ease-in-out infinite;
}
@keyframes logo-pulse {
  0%, 100% { text-shadow: 0 0 40px rgba(255,160,0,0.8), 0 0 80px rgba(255,100,0,0.4), 0 4px 12px #0008; }
  50%       { text-shadow: 0 0 60px rgba(255,180,0,1.0), 0 0 120px rgba(255,120,0,0.6), 0 4px 12px #0008; }
}

/* ── Tagline ── */
.tagline {
  font-size: 0.95rem;
  letter-spacing: 0.18em;
  color: #ffcc66;
  opacity: 0.75;
  text-transform: uppercase;
}

/* ── Level selector ── */
.level-sel {
  display: flex;
  align-items: center;
  gap: 10px;
}

.arrow {
  font-family: 'Courier New', monospace;
  font-size: 2.4rem;
  line-height: 1;
  color: #ffaa00;
  background: none;
  border: 1px solid rgba(255,170,0,0.25);
  border-radius: 4px;
  width: 40px;
  height: 70px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.arrow:hover { background: rgba(255,170,0,0.1); border-color: rgba(255,170,0,0.5); }

.level-card {
  width: 340px;
  padding: 14px 18px;
  border: 1px solid rgba(255,170,0,0.22);
  border-radius: 6px;
  background: rgba(255,160,0,0.06);
  text-align: left;
  min-height: 100px;
}

.lc-num  { font-size: 0.62rem; letter-spacing: 0.14em; opacity: 0.4; margin-bottom: 4px; }
.lc-name { font-size: 0.95rem; font-weight: 900; letter-spacing: 0.08em; color: #ffcc66; margin-bottom: 6px; }
.lc-desc { font-size: 0.72rem; opacity: 0.6; line-height: 1.5; margin-bottom: 8px; }
.lc-row  { display: flex; align-items: center; justify-content: space-between; }

.lc-diff { display: flex; gap: 2px; }
.star     { font-size: 0.75rem; color: #444; transition: color 0.2s; }
.star.lit { color: #ffaa00; }

.lc-obj  { font-size: 0.68rem; opacity: 0.5; letter-spacing: 0.06em; }

/* ── Slide transitions ── */
.slide-right-enter-active,
.slide-right-leave-active,
.slide-left-enter-active,
.slide-left-leave-active {
  transition: opacity 0.18s, transform 0.18s;
}
.slide-right-enter-from { opacity: 0; transform: translateX(28px); }
.slide-right-leave-to   { opacity: 0; transform: translateX(-28px); }
.slide-left-enter-from  { opacity: 0; transform: translateX(-28px); }
.slide-left-leave-to    { opacity: 0; transform: translateX(28px); }

/* ── Play button ── */
.btn-play {
  font-family: 'Courier New', monospace;
  font-size: 1.4rem;
  font-weight: 900;
  letter-spacing: 0.25em;
  color: #0a0a0e;
  background: #ffaa00;
  border: none;
  padding: 14px 52px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
  box-shadow: 0 4px 24px rgba(255, 160, 0, 0.5);
  text-transform: uppercase;
}
.btn-play:hover  { background: #ffcc22; transform: translateY(-2px); box-shadow: 0 6px 32px rgba(255,180,0,0.7); }
.btn-play:active { transform: translateY(0); }

.btn-holdout {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: #ff6644;
  background: transparent;
  border: 1px solid #ff664466;
  padding: 10px 36px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
  text-transform: uppercase;
}
.btn-holdout:hover  { background: rgba(255,102,68,0.12); border-color: #ff6644; transform: translateY(-1px); }
.btn-holdout:active { transform: translateY(0); }

.btn-coop {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: #44bbff;
  background: transparent;
  border: 1px solid #44bbff66;
  padding: 10px 36px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
  text-transform: uppercase;
}
.btn-coop:hover  { background: rgba(68,187,255,0.12); border-color: #44bbff; transform: translateY(-1px); }
.btn-coop:active { transform: translateY(0); }

.btn-builder {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: #ffaa00;
  background: transparent;
  border: 1px solid #ffaa0066;
  padding: 8px 28px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
  text-transform: uppercase;
}
.btn-builder:hover  { background: rgba(255,170,0,0.12); border-color: #ffaa00; transform: translateY(-1px); }
.btn-builder:active { transform: translateY(0); }

/* ── Controls grid ── */
.controls-grid {
  display: flex;
  gap: 40px;
  margin-top: 4px;
}
.ctrl-col {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.78rem;
  opacity: 0.55;
  text-align: left;
  line-height: 1.6;
  min-width: 160px;
}
.ctrl-head {
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  color: #ffaa00;
  opacity: 1;
  margin-bottom: 4px;
  border-bottom: 1px solid rgba(255,170,0,0.2);
  padding-bottom: 3px;
}

/* ── Footer ── */
.footer {
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  opacity: 0.22;
  letter-spacing: 0.12em;
  white-space: nowrap;
}
</style>
