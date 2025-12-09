<template>
  <component
    :is="componentType"
    :to="to"
    :href="href"
    :target="href ? '_blank' : undefined"
    @click="handleClick"
    class="glass-item group/item w-full px-4 py-2.5 text-left flex items-center gap-3
           text-gray-700 dark:text-gray-200
           hover:bg-gradient-to-r hover:from-sky-500/20 hover:to-blue-500/20
           dark:hover:from-sky-600/30 dark:hover:to-blue-600/30
           hover:text-gray-900 dark:hover:text-white
           transition-all duration-200 ease-out
           border-l-2 border-transparent hover:border-sky-500 dark:hover:border-sky-400
           hover:pl-5
           relative overflow-hidden
           rounded-lg mx-1"
  >
    <!-- Background glow effect -->
    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-sky-400/20 to-transparent
                opacity-0 group-hover/item:opacity-100
                translate-x-[-100%] group-hover/item:translate-x-[100%]
                transition-all duration-700"></div>

    <!-- Shimmer effect -->
    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent
                opacity-0 group-hover/item:opacity-100
                blur-sm
                transition-opacity duration-300"></div>

    <!-- Content -->
    <span class="relative z-10 flex items-center gap-3 w-full">
      <slot>
        {{ label }}
      </slot>

      <!-- External link icon -->
      <svg
        v-if="href"
        class="w-3 h-3 ml-auto opacity-50 group-hover/item:opacity-100 transition-opacity"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  label?: string
  to?: string
  href?: string
  action?: () => void | Promise<void>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'click'): void
}>()

const componentType = computed(() => {
  if (props.to) return 'router-link'
  if (props.href) return 'a'
  return 'button'
})

const handleClick = async (e: Event) => {
  if (props.action) {
    await props.action()
  }
  emit('click')
}
</script>

<style scoped>
.glass-item {
  position: relative;
  z-index: 1;
}
</style>
