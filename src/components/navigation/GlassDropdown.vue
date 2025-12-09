<template>
  <div class="relative group" @mouseenter="isHover && open()" @mouseleave="isHover && close()">
    <!-- Trigger Button -->
    <button
      @click="!isHover && toggle()"
      class="glass-button px-4 py-2 rounded-lg font-medium transition-all duration-300 ease-out
             hover:bg-white/10 dark:hover:bg-gray-800/30 hover:backdrop-blur-md
             text-gray-800 dark:text-white
             flex items-center gap-2
             relative overflow-hidden
             shadow-md shadow-transparent"
      :class="{
        'bg-white/10 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700/50 !shadow-lg': isOpen,
        'hover:!shadow-sky-500/10': !isOpen
      }"
    >
      <slot name="trigger">
        {{ label }}
      </slot>
      <svg
        v-if="showArrow"
        class="w-4 h-4 transition-transform duration-300"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown Menu -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0 translate-y-[-10px]"
      enter-to-class="transform scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100 translate-y-0"
      leave-to-class="transform scale-95 opacity-0 translate-y-[-10px]"
    >
      <div
        v-show="isOpen"
        :class="[
          'absolute mt-2 w-56 rounded-2xl overflow-visible',
          'bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl',
          'border border-white/30 dark:border-gray-700/50',
          'shadow-2xl shadow-black/20 dark:shadow-black/40',
          'ring-1 ring-white/10 dark:ring-white/5',
          positionClass,
          zIndexClass
        ]"
      >
        <!-- Gradient overlay -->
        <div class="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none rounded-2xl"></div>

        <div class="py-2 relative z-10">
          <slot :close="close"></slot>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  label?: string
  isHover?: boolean
  showArrow?: boolean
  position?: 'left' | 'right' | 'center'
  zIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  isHover: true,
  showArrow: true,
  position: 'left',
  zIndex: 300
})

const isOpen = ref(false)

const positionClass = {
  left: 'left-0',
  right: 'right-0',
  center: 'left-1/2 -translate-x-1/2'
}[props.position]

const zIndexClass = `z-[${props.zIndex}]`

const open = () => {
  isOpen.value = true
}

const close = () => {
  isOpen.value = false
}

const toggle = () => {
  isOpen.value = !isOpen.value
}

defineExpose({ open, close, toggle, isOpen })
</script>

<style scoped>
.glass-button {
  position: relative;
  overflow: hidden;
}

.glass-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.glass-button:hover::before {
  left: 100%;
}
</style>
