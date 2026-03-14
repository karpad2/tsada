<template>
  <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="520" persistent>
    <div class="dc-ss-dialog">
      <!-- Header -->
      <div class="dc-ss-header">
        <v-icon size="20" class="mr-2">mdi-monitor-share</v-icon>
        <span class="dc-ss-title">{{ $t('dc_ss_title') }}</span>
        <v-spacer />
        <v-btn icon size="x-small" variant="text" @click="emit('update:modelValue', false)">
          <v-icon size="18" color="#b5bac1">mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- Quality Presets -->
      <div class="dc-ss-section">
        <div class="dc-ss-section-label">{{ $t('dc_ss_stream_quality') }}</div>
        <div class="dc-ss-presets">
          <button
            v-for="preset in presets"
            :key="preset.id"
            class="dc-ss-preset"
            :class="{ 'dc-ss-preset-active': selectedPreset === preset.id }"
            @click="selectedPreset = preset.id"
          >
            <v-icon size="20" class="dc-ss-preset-icon">{{ preset.icon }}</v-icon>
            <span class="dc-ss-preset-name">{{ $t(preset.nameKey) }}</span>
            <span class="dc-ss-preset-desc">{{ $t(preset.descKey) }}</span>
          </button>
        </div>
      </div>

      <!-- Resolution & FPS -->
      <div class="dc-ss-section">
        <div class="dc-ss-row">
          <div class="dc-ss-field">
            <div class="dc-ss-field-label">{{ $t('dc_ss_resolution') }}</div>
            <div class="dc-ss-toggle-group">
              <button
                v-for="res in resolutionOptions"
                :key="res.value"
                class="dc-ss-toggle"
                :class="{ 'dc-ss-toggle-active': selectedResolution === res.value }"
                @click="selectedResolution = res.value"
              >
                {{ res.label }}
              </button>
            </div>
          </div>
          <div class="dc-ss-field">
            <div class="dc-ss-field-label">{{ $t('dc_ss_framerate') }}</div>
            <div class="dc-ss-toggle-group">
              <button
                v-for="fps in fpsOptions"
                :key="fps.value"
                class="dc-ss-toggle"
                :class="{ 'dc-ss-toggle-active': selectedFps === fps.value }"
                @click="selectedFps = fps.value"
              >
                {{ fps.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Audio toggle -->
      <div class="dc-ss-section dc-ss-audio-section">
        <div class="dc-ss-audio-row" @click="includeAudio = !includeAudio">
          <v-icon size="18" class="mr-2" :color="includeAudio ? '#5865f2' : '#949ba4'">
            {{ includeAudio ? 'mdi-volume-high' : 'mdi-volume-off' }}
          </v-icon>
          <span class="dc-ss-audio-label">{{ $t('dc_ss_include_audio') }}</span>
          <v-spacer />
          <div class="dc-ss-switch" :class="{ 'dc-ss-switch-on': includeAudio }">
            <div class="dc-ss-switch-thumb" />
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="dc-ss-summary">
        <v-icon size="14" color="#949ba4" class="mr-1">mdi-information-outline</v-icon>
        <span>{{ summaryText }}</span>
      </div>

      <!-- Actions -->
      <div class="dc-ss-actions">
        <v-btn variant="text" class="dc-ss-cancel" @click="emit('update:modelValue', false)">
          {{ $t('cancel') }}
        </v-btn>
        <v-btn class="dc-ss-go" @click="startSharing">
          <v-icon size="18" class="mr-1">mdi-monitor-share</v-icon>
          {{ $t('dc_ss_go_live') }}
        </v-btn>
      </div>
    </div>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

export interface ScreenShareSettings {
  resolution: number
  fps: number
  audio: boolean
}

const { t } = useI18n()

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'start-share': [settings: ScreenShareSettings]
}>()

interface Preset {
  id: string
  nameKey: string
  descKey: string
  icon: string
  resolution: number
  fps: number
}

const presets: Preset[] = [
  { id: 'smooth', nameKey: 'dc_ss_preset_smooth', descKey: 'dc_ss_preset_smooth_desc', icon: 'mdi-play-circle-outline', resolution: 720, fps: 30 },
  { id: 'quality', nameKey: 'dc_ss_preset_quality', descKey: 'dc_ss_preset_quality_desc', icon: 'mdi-high-definition', resolution: 1080, fps: 30 },
  { id: 'gaming', nameKey: 'dc_ss_preset_gaming', descKey: 'dc_ss_preset_gaming_desc', icon: 'mdi-gamepad-variant', resolution: 720, fps: 60 },
]

const resolutionOptions = [
  { label: '480p', value: 480 },
  { label: '720p', value: 720 },
  { label: '1080p', value: 1080 },
]

const fpsOptions = [
  { label: '15 FPS', value: 15 },
  { label: '30 FPS', value: 30 },
  { label: '60 FPS', value: 60 },
]

const selectedPreset = ref('smooth')
const selectedResolution = ref(720)
const selectedFps = ref(30)
const includeAudio = ref(false)

// When preset changes, update resolution & fps
import { watch } from 'vue'
watch(selectedPreset, (id) => {
  const preset = presets.find(p => p.id === id)
  if (preset) {
    selectedResolution.value = preset.resolution
    selectedFps.value = preset.fps
  }
})

// When user manually changes resolution/fps, deselect preset if it doesn't match
watch([selectedResolution, selectedFps], ([res, fps]) => {
  const matching = presets.find(p => p.resolution === res && p.fps === fps)
  if (matching) {
    selectedPreset.value = matching.id
  } else {
    selectedPreset.value = ''
  }
})

const summaryText = computed(() => {
  return `${selectedResolution.value}p @ ${selectedFps.value} FPS${includeAudio.value ? ' + ' + t('dc_ss_audio') : ''}`
})

function startSharing() {
  emit('start-share', {
    resolution: selectedResolution.value,
    fps: selectedFps.value,
    audio: includeAudio.value,
  })
  emit('update:modelValue', false)
}
</script>

<style scoped>
.dc-ss-dialog {
  background: #2b2d31;
  border-radius: 8px;
  overflow: hidden;
}

.dc-ss-header {
  display: flex;
  align-items: center;
  padding: 16px 16px 12px;
  color: #dbdee1;
}

.dc-ss-title {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

/* Section */
.dc-ss-section {
  padding: 0 16px 12px;
}

.dc-ss-section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: #b5bac1;
  margin-bottom: 8px;
}

/* Presets */
.dc-ss-presets {
  display: flex;
  gap: 8px;
}

.dc-ss-preset {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border-radius: 8px;
  border: 2px solid #404249;
  background: #1e1f22;
  color: #b5bac1;
  cursor: pointer;
  transition: all 0.15s;
}

.dc-ss-preset:hover {
  border-color: #5865f2;
  background: rgba(88, 101, 242, 0.1);
}

.dc-ss-preset-active {
  border-color: #5865f2 !important;
  background: rgba(88, 101, 242, 0.15) !important;
  color: white;
}

.dc-ss-preset-active .dc-ss-preset-icon {
  color: #5865f2;
}

.dc-ss-preset-name {
  font-size: 13px;
  font-weight: 600;
}

.dc-ss-preset-desc {
  font-size: 11px;
  color: #949ba4;
}

.dc-ss-preset-active .dc-ss-preset-desc {
  color: #b5bac1;
}

/* Resolution & FPS row */
.dc-ss-row {
  display: flex;
  gap: 16px;
}

.dc-ss-field {
  flex: 1;
}

.dc-ss-field-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: #b5bac1;
  margin-bottom: 6px;
}

.dc-ss-toggle-group {
  display: flex;
  gap: 4px;
  background: #1e1f22;
  border-radius: 6px;
  padding: 3px;
}

.dc-ss-toggle {
  flex: 1;
  padding: 6px 8px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: #b5bac1;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.dc-ss-toggle:hover {
  color: #dbdee1;
  background: rgba(255, 255, 255, 0.06);
}

.dc-ss-toggle-active {
  background: #5865f2 !important;
  color: white !important;
}

/* Audio section */
.dc-ss-audio-section {
  padding-top: 4px;
}

.dc-ss-audio-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #1e1f22;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
}

.dc-ss-audio-row:hover {
  background: #232428;
}

.dc-ss-audio-label {
  font-size: 13px;
  color: #dbdee1;
}

.dc-ss-switch {
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: #72767d;
  position: relative;
  transition: background 0.2s;
}

.dc-ss-switch-on {
  background: #5865f2;
}

.dc-ss-switch-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.2s;
}

.dc-ss-switch-on .dc-ss-switch-thumb {
  transform: translateX(16px);
}

/* Summary */
.dc-ss-summary {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  font-size: 12px;
  color: #949ba4;
}

/* Actions */
.dc-ss-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  background: #232428;
}

.dc-ss-cancel {
  color: #b5bac1 !important;
}

.dc-ss-go {
  background: #5865f2 !important;
  color: white !important;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
}

.dc-ss-go:hover {
  background: #4752c4 !important;
}

@media (max-width: 500px) {
  .dc-ss-presets {
    flex-direction: column;
  }
  .dc-ss-row {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
