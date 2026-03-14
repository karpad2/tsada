<template>
  <div class="skill-root">
    <div class="points-bar">
      <span class="pts-label">SKILL POINTS AVAILABLE</span>
      <span class="pts-value">{{ availablePoints }}</span>
      <span class="pts-xp">( {{ prog.xp.toLocaleString() }} XP total )</span>
    </div>

    <div class="trees">
      <div v-for="(tree, treeId) in SKILL_TREES" :key="treeId" class="tree-col">
        <div class="tree-title" :style="{ color: tree.color, borderColor: tree.color + '55' }">
          {{ tree.name }}
        </div>

        <div
          v-for="(tier, i) in tree.tiers"
          :key="i"
          class="tier-card"
          :class="tierState(treeId, i)"
          @click="buyTier(treeId, i)"
        >
          <div class="tier-num">T{{ i + 1 }}</div>
          <div class="tier-info">
            <div class="tier-name">{{ tier.name }}</div>
            <div class="tier-effect">{{ tier.effect }}</div>
          </div>
          <div class="tier-cost" :class="tierState(treeId, i)">
            <span v-if="tierState(treeId, i) === 'owned'">✓</span>
            <span v-else-if="tierState(treeId, i) === 'locked'">🔒</span>
            <span v-else>{{ tier.cost }} pt{{ tier.cost > 1 ? 's' : '' }}</span>
          </div>
        </div>

        <!-- Refund button -->
        <button
          v-if="(prog.spentSkills[treeId] ?? 0) > 0"
          class="refund-btn"
          @click="refundTree(treeId)"
        >↺ Refund Tree</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SKILL_TREES } from '../../game/weapons/WeaponData.ts'
import { getSkillPoints, spendSkillPoint, refundSkillTree } from '../../game/PlayerProgress.ts'

const props = defineProps({
  prog: { type: Object, required: true },
})
const emit = defineEmits(['update'])

const availablePoints = computed(() => getSkillPoints(props.prog))

function tierState(treeId, tierIndex) {
  const owned = props.prog.spentSkills[treeId] ?? 0
  if (tierIndex < owned) return 'owned'
  if (tierIndex === owned) {
    return availablePoints.value >= SKILL_TREES[treeId].tiers[tierIndex].cost ? 'available' : 'insufficient'
  }
  return 'locked'
}

function buyTier(treeId, tierIndex) {
  const state_ = tierState(treeId, tierIndex)
  if (state_ !== 'available') return
  const { success, prog: updated } = spendSkillPoint(treeId, tierIndex + 1, props.prog)
  if (success) emit('update', updated)
}

function refundTree(treeId) {
  const updated = refundSkillTree(treeId, props.prog)
  emit('update', updated)
}
</script>

<style scoped>
.skill-root {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow: hidden;
}

.points-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #333;
}
.pts-label { font-size: 10px; color: #888; letter-spacing: 0.1em; }
.pts-value  { font-size: 22px; font-weight: bold; color: #ffdd88; }
.pts-xp     { font-size: 10px; color: #555; }

.trees {
  display: flex;
  gap: 12px;
  flex: 1;
  overflow-y: auto;
}

.tree-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.tree-title {
  font-size: 11px; font-weight: bold; letter-spacing: 0.14em;
  border-bottom: 2px solid; padding-bottom: 5px; margin-bottom: 2px;
}

.tier-card {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 8px 10px;
  border: 1px solid #333; border-radius: 4px;
  background: rgba(255,255,255,0.04);
  cursor: pointer; transition: all 0.15s;
}
.tier-card.owned       { background: rgba(255,170,0,0.12); border-color: #ffaa00; }
.tier-card.available   { border-color: #55aa55; cursor: pointer; }
.tier-card.available:hover { background: rgba(50,180,50,0.15); }
.tier-card.locked      { opacity: 0.35; cursor: default; }
.tier-card.insufficient{ opacity: 0.55; cursor: default; border-color: #553333; }

.tier-num {
  font-size: 10px; color: #666; flex-shrink: 0; width: 18px; padding-top: 2px;
}
.tier-info { flex: 1; min-width: 0; }
.tier-name   { font-size: 11px; color: #ddd; font-weight: bold; }
.tier-effect { font-size: 9px; color: #888; margin-top: 2px; }

.tier-cost { font-size: 10px; color: #888; flex-shrink: 0; }
.tier-cost.owned { color: #ffaa00; font-size: 14px; }

.refund-btn {
  margin-top: 4px; padding: 5px 8px;
  background: rgba(100,30,30,0.2); border: 1px solid #552222; border-radius: 3px;
  color: #ff8888; font: 9px 'Courier New', monospace; letter-spacing: 0.06em;
  cursor: pointer;
}
.refund-btn:hover { background: rgba(100,30,30,0.4); }
</style>
