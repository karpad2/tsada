<template>
  <div class="dropdown dropdown-hover">
    <div
      tabindex="0"
      role="button"
      class="btn btn-ghost cursor-pointer dark:text-white"
      :class="buttonClass"
      @click="onButtonClick"
    >
      {{ title }}
      <i v-if="showArrow" class="pi pi-angle-down ml-1"></i>
    </div>

    <ul
      v-if="items.length > 0"
      tabindex="0"
      class="dropdown-content z-[1] menu p-2 bg-base-100 rounded-box block"
      :class="dropdownClass"
    >
      <li v-for="item in items" :key="item.id">
        <component
          :is="getItemComponent(item)"
          v-bind="getItemProps(item)"
          @click="onItemClick(item)"
        >
          {{ getItemTitle(item) }}
        </component>
      </li>

      <!-- Slot for custom items -->
      <slot name="custom-items" />
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { trackUserInteraction } from '@/utils/analytics'
import type { MenuItem } from '@/services/navigation/NavigationService'

export default defineComponent({
  name: 'NavigationDropdown',
  props: {
    title: {
      type: String,
      required: true
    },
    items: {
      type: Array as PropType<MenuItem[]>,
      default: () => []
    },
    showArrow: {
      type: Boolean,
      default: true
    },
    buttonClass: {
      type: String,
      default: ''
    },
    dropdownClass: {
      type: String,
      default: 'w-52'
    },
    routePrefix: {
      type: String,
      default: ''
    },
    trackingCategory: {
      type: String,
      default: 'navigation'
    }
  },
  emits: ['item-click', 'button-click'],
  methods: {
    onButtonClick() {
      trackUserInteraction(`${this.trackingCategory}_dropdown_open`, 'navigation', {
        dropdown: this.title
      })
      this.$emit('button-click')
    },

    onItemClick(item: MenuItem) {
      trackUserInteraction(`${this.trackingCategory}_item_click`, 'navigation', {
        item_id: item.id,
        item_title: item.title
      })
      this.$emit('item-click', item)
    },

    getItemComponent(item: MenuItem): string {
      // Return router-link for items with routes, or regular 'a' for external links
      if (item.url?.startsWith('http')) {
        return 'a'
      }
      return 'router-link'
    },

    getItemProps(item: MenuItem): Record<string, any> {
      if (item.url?.startsWith('http')) {
        return {
          href: item.url,
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      }

      // Build router-link props
      const routePath = item.url || `${this.routePrefix}${item.id}`

      return {
        to: routePath
      }
    },

    getItemTitle(item: MenuItem): string {
      return item.title || item.name || ''
    }
  }
})
</script>