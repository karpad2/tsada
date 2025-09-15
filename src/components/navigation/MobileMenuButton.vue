<template>
  <div v-if="isMobile" class="mobile-menu-container">
    <button
      @click="toggleMenu"
      class="btn btn-ghost mobile-menu-button m-3 dark:text-white"
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
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.mobile-menu-button:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.mobile-menu-button:focus {
  outline: 2px solid rgba(59, 130, 246, 0.5);
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