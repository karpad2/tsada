<template>
  <header
    :class="{ mobile_force: styleComputedForMobile }"
    style="z-index: 200"
    class="navbar glass-nav transition-all duration-300 pt-3 pb-2 text-gray-600 body-font sticky top-0"
    id="home"
  >
    <div
      :class="[{ 'flex-col': isMobileView }, { 'flex-row': !isMobileView }]"
      class="container mx-auto flex flex-wrap items-center px-2"
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
          class="flex flex-row items-center title-font font-medium text-gray-900 mb-2 md:mb-0 group"
        >
          <img
            src="@a/tsada_logo.png"
            alt="logo"
            class="size-16 md:size-18 text-white p-1.5 bg-sky-400/20 ring-1 ring-sky-400/30 rounded-full object-contain shadow-lg shadow-sky-500/10 group-hover:ring-sky-400/50 transition-all duration-300"
            loading="lazy"
            width="80"
            height="70"
          />
          <span class="ml-2 max-sm:hidden text-lg md:text-xl font-semibold dark:text-white tracking-tight">
            {{ $t('school_name') }}
          </span>

          <Certop class="h-24 w-24 md:h-28 md:w-28" />

          <img
            src="@a/Erasmus_Logo.svg"
            alt="erasmus+"
            class="w-28 md:w-36 h-10 md:h-12 text-white p-1.5 opacity-90"
            loading="lazy"
            width="144"
            height="48"
          />

          <img
            v-if="showEuFunding || true"
            src="@a/eu_co_funded.png"
            alt="Co-funded by the European Union"
            class="w-28 md:w-32 h-auto text-white p-1 object-contain opacity-90"
            loading="lazy"
            width="128"
            height="30"
          />
        </router-link>
      </div>

      <!-- Navigation Menu -->
      <nav
        v-if="showMobileMenu"
        :class="[
          { 'flex-col w-full px-3 max-h-[70vh] overflow-y-auto mt-2 rounded-2xl glass pb-3': isMobileView },
          { 'mx-auto': isMobileView || isTabletMode },
          { 'flex-row gap-0.5': !isMobileView }
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
                class="nav-link px-3.5 py-2 rounded-xl font-medium transition-all duration-300 ease-out
                       hover:bg-white/40 dark:hover:bg-white/10 hover:backdrop-blur-md
                       hover:shadow-md hover:shadow-sky-500/15
                       text-gray-800 dark:text-white
                       relative overflow-hidden"
              >
                {{ group.label }}
              </router-link>

              <!-- Direct link with action (e.g. teacher logout) -->
              <button
                v-else-if="group.type === 'direct-link' && group.items.length > 0 && group.items[0].action"
                @click="group.items[0].action"
                class="nav-link px-3.5 py-2 rounded-xl font-medium transition-all duration-300 ease-out
                       hover:bg-white/40 dark:hover:bg-white/10 hover:backdrop-blur-md
                       hover:shadow-md hover:shadow-sky-500/15
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

.nav-link.router-link-active {
  background: rgba(14, 165, 233, 0.12);
  box-shadow: 0 0 0 1px rgba(14, 165, 233, 0.2);
}

.dark .nav-link.router-link-active {
  background: rgba(56, 189, 248, 0.12);
  box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.25);
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
</style>
