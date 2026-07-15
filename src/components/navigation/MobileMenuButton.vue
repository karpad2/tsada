<template>
  <div v-if="isMobile" class="mobile-menu-container">
    <button
      @click="toggleMenu"
      class="mobile-menu-button m-2 dark:text-white glass rounded-xl"
      :aria-expanded="isOpen"
      aria-label="Toggle mobile menu"
    >
      <Transition name="rotate" mode="out-in">
        <i v-if="!isOpen" key="menu" class="pi pi-align-left text-lg"></i>
        <i v-else key="close" class="pi pi-times text-lg"></i>
      </Transition>
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { trackUserInteraction } from '@/utils/analytics'

export default defineComponent({
  name: 'MobileMenuButton',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    isMobile: {
      type: Boolean,
      default: false
    }
  },
  emits: ['toggle'],
  methods: {
    toggleMenu() {
      const newState = !this.isOpen

      trackUserInteraction('mobile_menu_toggle', 'navigation', {
        action: newState ? 'open' : 'close'
      })

      this.$emit('toggle', newState)
    }
  }
})
</script>

<style scoped>
.mobile-menu-container {
  display: flex;
  align-items: center;
}

.mobile-menu-button {
  padding: 0.75rem;
  transition: all 0.25s ease;
  color: inherit;
  cursor: pointer;
}

.mobile-menu-button:hover {
  box-shadow: 0 4px 16px rgba(14, 165, 233, 0.2);
  transform: scale(1.04);
}

.mobile-menu-button:focus {
  outline: 2px solid rgba(14, 165, 233, 0.5);
  outline-offset: 2px;
}

/* Transition for icon rotation */
.rotate-enter-active,
.rotate-leave-active {
  transition: all 0.2s ease;
}

.rotate-enter-from {
  opacity: 0;
  transform: rotate(-90deg);
}

.rotate-leave-to {
  opacity: 0;
  transform: rotate(90deg);
}
</style>