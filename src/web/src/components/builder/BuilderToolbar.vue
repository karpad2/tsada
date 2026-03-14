<template>
  <aside class="toolbar">

    <!-- ── 2D Tools ─────────────────────────────────────────── -->
    <template v-if="mode === '2d'">
      <div class="tool-section-label">TOOLS</div>
      <button
        v-for="t in TOOLS_2D"
        :key="t.id"
        class="tool-btn"
        :class="{ active: activeTool === t.id }"
        :title="t.label"
        @click="$emit('setTool', t.id)"
      >{{ t.icon }}</button>

      <!-- Zone type sub-selector -->
      <template v-if="activeTool === 'ZONE'">
        <div class="tool-section-label" style="margin-top:10px">ZONE TYPE</div>
        <button v-for="zt in ZONE_TYPES" :key="zt.id"
          class="tool-btn sub" :class="{ active: zoneType === zt.id, [zt.id]: true }"
          @click="$emit('setZoneType', zt.id)">{{ zt.label }}</button>
      </template>

      <!-- Door type sub-selector -->
      <template v-if="activeTool === 'DOOR'">
        <div class="tool-section-label" style="margin-top:10px">DOOR TYPE</div>
        <button class="tool-btn sub" :class="{ active: doorType === 'normal' }" @click="$emit('setDoorType','normal')">NORMAL</button>
        <button class="tool-btn sub secure" :class="{ active: doorType === 'secure' }" @click="$emit('setDoorType','secure')">SECURE</button>
        <button class="tool-btn sub" :class="{ active: doorType === 'keycard' }" @click="$emit('setDoorType','keycard')">KEYCARD</button>
        <button class="tool-btn sub" :class="{ active: doorType === 'drill' }" @click="$emit('setDoorType','drill')">DRILL</button>
      </template>

      <!-- Prop sub-palette -->
      <template v-if="activeTool === 'PROP'">
        <div class="tool-section-label" style="margin-top:10px">PROP</div>
        <button v-for="pt in PROP_TYPES" :key="pt.id"
          class="tool-btn prop" :class="{ active: subTool === pt.id }"
          :title="pt.label"
          @click="$emit('setSubTool', pt.id)">{{ pt.icon }}</button>
        <template v-if="customAssets.length">
          <div class="tool-section-label" style="margin-top:6px">CUSTOM</div>
          <button v-for="ca in customAssets" :key="ca.id"
            class="tool-btn prop" :class="{ active: subTool === `custom:${ca.id}` }"
            :title="ca.name"
            @click="$emit('setSubTool', `custom:${ca.id}`)">{{ ca.icon || '?' }}</button>
        </template>
      </template>
    </template>

    <!-- ── 3D Tools ─────────────────────────────────────────── -->
    <template v-if="mode === '3d'">
      <div class="tool-section-label">PLACE</div>
      <button v-for="pt in PROP_TYPES" :key="pt.id"
        class="tool-btn prop" :class="{ active: subTool === pt.id }"
        :title="pt.label"
        @click="$emit('setSubTool', subTool === pt.id ? null : pt.id)"
      >{{ pt.icon }}<span class="prop-lbl">{{ pt.label }}</span></button>

      <div class="tool-section-label" style="margin-top:12px">VEHICLES</div>
      <button v-for="vt in VEHICLE_TYPES" :key="vt.id"
        class="tool-btn prop" :class="{ active: subTool === vt.id }"
        :title="vt.label"
        @click="$emit('setSubTool', subTool === vt.id ? null : vt.id)"
      >{{ vt.icon }}<span class="prop-lbl">{{ vt.label }}</span></button>

      <template v-if="customAssets.length">
        <div class="tool-section-label" style="margin-top:12px">CUSTOM</div>
        <button v-for="ca in customAssets" :key="ca.id"
          class="tool-btn prop" :class="{ active: subTool === `custom:${ca.id}` }"
          :title="ca.name"
          @click="$emit('setSubTool', subTool === `custom:${ca.id}` ? null : `custom:${ca.id}`)"
        >{{ ca.icon || '?' }}<span class="prop-lbl">{{ ca.name }}</span></button>
      </template>
    </template>

  </aside>
</template>

<script setup lang="ts">
defineProps({
  mode:         { type: String, required: true },
  activeTool:   { type: String, default: 'SELECT' },
  subTool:      { type: String, default: null },
  zoneType:     { type: String, default: 'public' },
  doorType:     { type: String, default: 'normal' },
  customAssets: { type: Array, default: () => [] },
})
defineEmits(['setTool', 'setSubTool', 'setZoneType', 'setDoorType'])

const TOOLS_2D = [
  { id: 'SELECT', icon: '↖',  label: 'Select / Move' },
  { id: 'FLOOR',  icon: '▭',  label: 'Draw Floor' },
  { id: 'WALL',   icon: '▬',  label: 'Draw Wall' },
  { id: 'WINDOW', icon: '⊡',  label: 'Toggle Window (click wall)' },
  { id: 'ZONE',   icon: '⬜',  label: 'Draw Zone' },
  { id: 'DOOR',   icon: '🚪', label: 'Place Door (on wall)' },
  { id: 'PROP',   icon: '📦', label: 'Place Prop' },
  { id: 'LIGHT',  icon: '☀',  label: 'Place Light' },
  { id: 'BAG',    icon: '◇',  label: 'Place Bag (Objective)' },
  { id: 'SPAWN',  icon: '▲',  label: 'Place Spawn (click twice = patrol)' },
  { id: 'CAMERA', icon: '📷', label: 'Place Camera (on wall)' },
  { id: 'PILLAR', icon: '⊞',  label: 'Place Pillar' },
  { id: 'PLAYER', icon: '◉',  label: 'Set Player Start' },
  { id: 'ESCAPE', icon: '○',  label: 'Set Escape Zone' },
]

const ZONE_TYPES = [
  { id: 'public',  label: '● PUBLIC'  },
  { id: 'private', label: '● PRIVATE' },
  { id: 'secure',  label: '● SECURE'  },
]

const PROP_TYPES = [
  { id: 'desk',        icon: '🖥',  label: 'Desk'        },
  { id: 'crate',       icon: '📦',  label: 'Crate'       },
  { id: 'barrel',      icon: '🛢',  label: 'Barrel'      },
  { id: 'shelf',       icon: '📚',  label: 'Shelf'       },
  { id: 'counter',     icon: '▬',  label: 'Counter'     },
  { id: 'safe',        icon: '🔒',  label: 'Safe'        },
  { id: 'server',      icon: '🖨',  label: 'Server Rack' },
  { id: 'locker',      icon: '🗄',  label: 'Locker'      },
  { id: 'sofa',        icon: '🛋',  label: 'Sofa'        },
  { id: 'table',       icon: '⬜',  label: 'Table'       },
  { id: 'workbench',   icon: '🔧',  label: 'Workbench'   },
  { id: 'container',   icon: '📫',  label: 'Container'   },
  { id: 'displayCase', icon: '🔳',  label: 'Display Case'},
  { id: 'tank',        icon: '💧',  label: 'Tank'        },
  { id: 'console',     icon: '🖲',  label: 'Console'     },
  { id: 'cargobox',    icon: '📥',  label: 'Cargo Box'   },
  { id: 'consolepod',  icon: '🕹',  label: 'Console Pod' },
  { id: 'gasTank',       icon: '☢',  label: 'Gas Tank'     },
  { id: 'fuelBarrel',    icon: '🔥', label: 'Fuel Barrel'  },
  { id: 'electricPanel', icon: '⚡', label: 'Elec. Panel'  },
]

const VEHICLE_TYPES = [
  { id: 'van',     icon: '🚐', label: 'Van'     },
  { id: 'truck',   icon: '🚛', label: 'Truck'   },
  { id: 'car',     icon: '🚗', label: 'Car'     },
]
</script>

<style scoped>
.toolbar {
  width: 62px;
  background: rgba(10,10,14,0.96);
  border-right: 1px solid #333;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  gap: 4px;
  overflow-y: auto;
  overflow-x: hidden;
  font-family: 'Courier New', monospace;
  flex-shrink: 0;
}

.toolbar.wide { width: 130px; align-items: flex-start; }

.tool-section-label {
  font-size: 9px;
  letter-spacing: 0.1em;
  color: #555;
  width: 100%;
  text-align: center;
  padding: 2px 0;
}

.tool-btn {
  width: 46px;
  height: 38px;
  background: rgba(255,255,255,0.05);
  border: 1px solid #333;
  border-radius: 4px;
  color: #aaa;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.1s, border-color 0.1s;
  flex-shrink: 0;
}
.tool-btn:hover  { background: rgba(255,255,255,0.1); border-color: #555; color: #eee; }
.tool-btn.active { background: rgba(255,170,0,0.2); border-color: #ffaa00; color: #ffdd88; }

.tool-btn.sub {
  width: 52px;
  height: 28px;
  font-size: 11px;
  letter-spacing: 0.06em;
}
.tool-btn.sub.public  { color: #55dd55; }
.tool-btn.sub.private { color: #ffcc22; }
.tool-btn.sub.secure  { color: #ff4444; }
.tool-btn.sub.secure.active { background: rgba(200,30,30,0.25); border-color: #ff4444; }

.tool-btn.prop {
  width: 52px;
  height: 30px;
  font-size: 13px;
  gap: 4px;
  justify-content: flex-start;
  padding: 0 4px;
}
.prop-lbl { font-size: 9px; color: #888; letter-spacing: 0.04em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
