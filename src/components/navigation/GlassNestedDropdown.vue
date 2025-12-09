<template>
  <div class="relative group/nested">
    <!-- Trigger -->
    <button
      @mouseenter="open"
      @mouseleave="startCloseTimer"
      class="glass-nested-item w-full px-4 py-2.5 text-left flex items-center justify-between gap-3
             text-gray-700 dark:text-gray-200
             hover:bg-gradient-to-r hover:from-sky-500/20 hover:to-blue-500/20
             dark:hover:from-sky-600/30 dark:hover:to-blue-600/30
             transition-all duration-200 ease-out
             border-l-2 border-transparent hover:border-sky-500 dark:hover:border-sky-400
             rounded-lg mx-1"
    >
      <span>{{ label }}</span>
      <svg
        class="w-4 h-4 transition-transform duration-300"
        :class="{ 'rotate-90': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>

    <!-- Nested Dropdown -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0 translate-x-[-10px]"
      enter-to-class="transform scale-100 opacity-100 translate-x-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100 translate-x-0"
      leave-to-class="transform scale-95 opacity-0 translate-x-[-10px]"
    >
      <div
        v-show="isOpen"
        @mouseenter="cancelCloseTimer"
        @mouseleave="close"
        class="absolute left-full top-0 ml-2 w-56 rounded-2xl overflow-visible
               bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl
               border border-white/30 dark:border-gray-700/50
               shadow-2xl shadow-black/20 dark:shadow-black/40
               ring-1 ring-white/10 dark:ring-white/5"
        :class="zIndexClass"
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
  label: string
  zIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  zIndex: 350
})

const isOpen = ref(false)
const closeTimer = ref<NodeJS.Timeout | null>(null)
const zIndexClass = `z-[${props.zIndex}]`

const open = () => {
  // Cancel any pending close
  if (closeTimer.value) {
    clearTimeout(closeTimer.value)
    closeTimer.value = null
  }
  isOpen.value = true
}

const close = () => {
  isOpen.value = false
}

const startCloseTimer = () => {
  // Wait a bit before closing to allow moving to nested menu
  closeTimer.value = setTimeout(() => {
    close()
  }, 100)
}

const cancelCloseTimer = () => {
  if (closeTimer.value) {
    clearTimeout(closeTimer.value)
    closeTimer.value = null
  }
}

defineExpose({ open, close, isOpen })
</script>
