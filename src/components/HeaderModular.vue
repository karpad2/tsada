<template>
  <header
    :class="{ mobile_force: styleComputedForMobile }"
    style="z-index: 200"
    class="navbar transition-all delay-150 pt-5 text-gray-600 backdrop-filter bg-opacity-50 bg-gray-300 dark:bg-gray-900 backdrop-blur-lg body-font sticky top-0"
    id="home"
  >
    <div
      :class="[{ 'flex-col': isMobileView }, { 'flex-row': !isMobileView }]"
      class="container mx-auto flex flex-wrap items-center"
    >
      <!-- Header Top Section -->
      <div class="flex items-center">
        <!-- Mobile Menu Button -->
        <MobileMenuButton
          :is-open="state.mobileMenuOpen"
          :is-mobile="isMobileView"
          @toggle="toggleMobileMenu"
        />

        <!-- Logo and Brand -->
        <router-link
          to="/home"
          class="flex flex-row items-center title-font font-medium text-gray-900 mb-4 md:mb-0"
        >
          <img
            src="@a/tsada_logo.png"
            alt="logo"
            class="size-20 text-white p-1 bg-sky-400/15 rounded-full"
            loading="lazy"
            width="80"
            height="80"
          />
          <span class="ml-1 max-sm:hidden text-xl dark:text-white">
            {{ $t('school_name') }}
          </span>

          <Certop class="h-28 w-28" />

          <img
            src="@a/Erasmus_Logo.svg"
            alt="erasmus+"
            class="w-36 h-12 text-white p-2"
            loading="lazy"
            width="144"
            height="48"
          />

          <img
            v-if="showEuFunding || true"
            src="@a/eu_co_funded.png"
            alt="Co-funded by the European Union"
            class="w-32 h-12 text-white p-1"
            loading="lazy"
            width="128"
            height="48"
          />
        </router-link>
      </div>

      <!-- Navigation Menu -->
      <nav
        v-if="showMobileMenu"
        :class="[
          { 'flex-col w-full px-4 max-h-[70vh] overflow-y-auto': isMobileView },
          { 'mx-auto': isMobileView || isTabletMode },
          { 'flex-row': !isMobileView }
        ]"
        class="md:ml-auto flex items-center text-base justify-center"
      >
        <!-- Mobile Accordion Menu -->
        <AccordionMenu
          v-if="isMobileView"
          :items="mobileMenuItems"
          @item-clicked="closeMobileMenu"
          class="w-full"
        />

        <!-- Desktop Menu (Dynamic) -->
        <template v-else>
          <template v-for="group in resolvedMenuGroups" :key="group.id">
            <!-- Skip invisible groups -->
            <template v-if="group.visible">

              <!-- Direct link (router-link) -->
              <router-link
                v-if="group.type === 'direct-link' && group.to"
                :to="group.to"
                class="px-4 py-2 rounded-lg font-medium transition-all duration-300 ease-out
                       hover:bg-white/10 dark:hover:bg-gray-800/30 hover:backdrop-blur-md
                       shadow-md shadow-transparent hover:shadow-sky-500/10
                       text-gray-800 dark:text-white
                       relative overflow-hidden"
              >
                {{ group.label }}
              </router-link>

              <!-- Direct link with action (e.g. teacher logout) -->
              <button
                v-else-if="group.type === 'direct-link' && group.items.length > 0 && group.items[0].action"
                @click="group.items[0].action"
                class="px-4 py-2 rounded-lg font-medium transition-all duration-300 ease-out
                       hover:bg-white/10 dark:hover:bg-gray-800/30 hover:backdrop-blur-md
                       shadow-md shadow-transparent hover:shadow-sky-500/10
                       text-gray-800 dark:text-white
                       relative overflow-hidden"
              >
                {{ group.label }}
              </button>

              <!-- Language Selector (special template) -->
              <GlassDropdown v-else-if="group.type === 'language-selector'">
                <template #trigger>
                  <country-flag :country="state.currentFlag" size="small" />
                </template>
                <GlassDropdownItem
                  v-for="lang in state.languages"
                  :key="lang.code"
                  :action="() => changeLanguage(lang.code)"
                >
                  <country-flag :country="lang.country" size="small" />
                  {{ lang.name }}
                </GlassDropdownItem>
              </GlassDropdown>

              <!-- Standard Dropdown -->
              <GlassDropdown v-else-if="group.type === 'dropdown'" :label="group.label">
                <template v-for="item in group.items" :key="item.id">
                  <!-- Item with children (nested dropdown) -->
                  <GlassNestedDropdown v-if="item.children && item.children.length > 0" :label="item.label">
                    <template v-for="child in item.children" :key="child.id">
                      <!-- 3rd level nested dropdown -->
                      <GlassNestedDropdown
                        v-if="child.children && child.children.length > 0"
                        :label="child.label"
                        :z-index="400"
                      >
                        <GlassDropdownItem
                          v-for="grandchild in child.children"
                          :key="grandchild.id"
                          :to="grandchild.to"
                          :href="grandchild.href"
                          :action="grandchild.action"
                          :label="grandchild.label"
                        />
                      </GlassNestedDropdown>
                      <!-- Regular child item -->
                      <GlassDropdownItem
                        v-else
                        :to="child.to"
                        :href="child.href"
                        :action="child.action"
                        :label="child.label"
                      />
                    </template>
                  </GlassNestedDropdown>

                  <!-- Regular item (no children) -->
                  <GlassDropdownItem
                    v-else
                    :to="item.to"
                    :href="item.href"
                    :action="item.action"
                    :label="item.label"
                  />
                </template>
              </GlassDropdown>

            </template>
          </template>
        </template>
      </nav>
    </div>

    <!-- Loading Overlay -->
    <div
      v-if="state.loading"
      class="absolute inset-0 bg-black/20 flex items-center justify-center"
    >
      <div class="loading loading-spinner loading-lg text-primary"></div>
    </div>

    <!-- Error Toast -->
    <div
      v-if="state.error"
      class="toast toast-top toast-end"
    >
      <div class="alert alert-error">
        <span>{{ state.error }}</span>
        <button @click="state.error = null" class="btn btn-sm btn-ghost">
          <i class="pi pi-times"></i>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHeader } from '@/composables/ui/useHeader'
import MobileMenuButton from '@/components/navigation/MobileMenuButton.vue'
import AccordionMenu from '@/components/navigation/AccordionMenu.vue'
import GlassDropdown from '@/components/navigation/GlassDropdown.vue'
import GlassDropdownItem from '@/components/navigation/GlassDropdownItem.vue'
import GlassNestedDropdown from '@/components/navigation/GlassNestedDropdown.vue'
import Certop from '@/components/Certop.vue'
import { useLoadingStore } from '@/stores/loading'
import type { ResolvedMenuItem } from '@/types/MenuTypes'

const { t } = useI18n()

const {
  // State
  state,

  // Computed
  isMobileView,
  isTabletMode,

  // Methods
  toggleMobileMenu,
  closeMobileMenu,
  changeLanguage,

  // Dynamic menu
  resolvedMenuGroups
} = useHeader()

const loading = useLoadingStore()

// Additional computed
const showMobileMenu = computed(() => (state.mobileMenuOpen && isMobileView.value) || !isMobileView.value)
const styleComputedForMobile = computed(() => isMobileView.value && !showMobileMenu.value)
const showEuFunding = computed(() => loading.currentPageEuFunding)

/**
 * Convert ResolvedMenuItem tree to AccordionMenu format
 */
function toMobileItem(item: ResolvedMenuItem): any {
  const result: any = { label: item.label }
  if (item.to) result.to = item.to
  if (item.href) result.href = item.href
  if (item.action) result.action = item.action
  if (item.flag) result.flag = item.flag
  if (item.children && item.children.length > 0) {
    result.children = item.children.map(toMobileItem)
  }
  return result
}

// Mobile menu items - generated from resolved menu groups
const mobileMenuItems = computed(() => {
  const items: any[] = []

  for (const group of resolvedMenuGroups.value) {
    if (!group.visible) continue

    if (group.type === 'language-selector') {
      // Language selector: render as dropdown with flag items
      items.push({
        label: t('language'),
        children: state.languages.map(lang => ({
          label: lang.name,
          flag: lang.country,
          action: () => changeLanguage(lang.code)
        }))
      })
    } else if (group.type === 'direct-link') {
      if (group.to) {
        items.push({ label: group.label, to: group.to })
      } else if (group.items.length > 0 && group.items[0].action) {
        items.push({ label: group.label, action: group.items[0].action })
      }
    } else if (group.type === 'dropdown') {
      if (group.items.length > 0) {
        items.push({
          label: group.label,
          children: group.items.map(toMobileItem)
        })
      }
    }
  }

  return items
})
</script>

<style scoped>
.navbar {
  backdrop-filter: blur(10px);
  background-color: rgba(243, 244, 246, 0.8);
}

.dark .navbar {
  background-color: rgba(17, 24, 39, 0.8);
}

.mobile_force {
  position: relative !important;
}

.dropdown:hover .dropdown-content {
  display: block;
}

.loading {
  border-radius: 50%;
}

.toast {
  z-index: 300;
}

/* Responsive improvements */
@media (max-width: 768px) {
  .navbar {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }

  .container {
    padding-left: 0;
    padding-right: 0;
  }
}

/* Smooth transitions */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.delay-150 {
  transition-delay: 150ms;
}
</style>
