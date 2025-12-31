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

        <!-- Desktop Menu -->
        <template v-else>
          <!-- Home Link -->
          <router-link
            to="/home"
            class="px-4 py-2 rounded-lg font-medium transition-all duration-300 ease-out
                   hover:bg-white/10 dark:hover:bg-gray-800/30 hover:backdrop-blur-md
                   shadow-md shadow-transparent hover:shadow-sky-500/10
                   text-gray-800 dark:text-white
                   relative overflow-hidden"
          >
            {{ $t('home') }}
          </router-link>

          <!-- About Us Dropdown -->
          <GlassDropdown :label="$t('aboutus')">
            <GlassDropdownItem to="/renderer/about/history" :label="$t('history_of_school')" />
            <GlassDropdownItem to="/about/schoolboard" :label="$t('school_board')" />
            <GlassDropdownItem to="/about/parentscouncil" :label="$t('parents_council')" />
            <GlassDropdownItem to="/about/pepsi" :label="$t('services')" />
            <GlassDropdownItem
              v-for="about in getAboutItems()"
              :key="about.id"
              :to="'/renderer/about/' + about.id"
              :label="about.title"
            />
            <GlassDropdownItem to="/about/workers" :label="$t('workers')" />
            <GlassDropdownItem to="/about/classlist" :label="$t('classlist')" />
          </GlassDropdown>

          <!-- Education Dropdown -->
          <GlassDropdown :label="$t('education')">
            <!-- Courses submenu -->
            <GlassNestedDropdown :label="$t('courses')">
              <!-- Machine courses -->
              <GlassNestedDropdown :label="$t('machine')" :z-index="400">
                <GlassDropdownItem to="/renderer/education/mechanical_technician" :label="$t('mechanical_technician')" />
                <GlassDropdownItem to="/renderer/education/cnc_miller" :label="$t('cnc_miller')" />
              </GlassNestedDropdown>

              <!-- Electrotechnics courses -->
              <GlassNestedDropdown :label="$t('electrotechnic')" :z-index="400">
                <GlassDropdownItem to="/renderer/education/mechatronic_technician" :label="$t('mechatronic_technician')" />
                <GlassDropdownItem to="/renderer/education/computer_electrotechnician" :label="$t('computer_electrotechnician')" />
              </GlassNestedDropdown>

              <!-- Civil engineering courses -->
              <GlassNestedDropdown :label="$t('civil_engineering')" :z-index="400">
                <GlassDropdownItem to="/renderer/education/primary_construction_works_operator" :label="$t('primary_construction_works_operator')" />
              </GlassNestedDropdown>
            </GlassNestedDropdown>

            <!-- Other education links -->
            <GlassDropdownItem to="/about/timetable" :label="$t('timetable')" />
            <GlassDropdownItem to="/about/workerstimetable" :label="$t('teachers_receiving_hour')" />
            <GlassDropdownItem to="/about/parentvisiting" :label="$t('parentsvisiting')" />
            <GlassDropdownItem to="/renderer/education/examslist" :label="$t('examslist')" />
            <GlassDropdownItem to="/renderer/education/textbooks" :label="$t('textbooks')" />
          </GlassDropdown>

          <!-- Gallery Link -->
          <router-link
            to="/gallery"
            class="px-4 py-2 rounded-lg font-medium transition-all duration-300 ease-out
                   hover:bg-white/10 dark:hover:bg-gray-800/30 hover:backdrop-blur-md
                   shadow-md shadow-transparent hover:shadow-sky-500/10
                   text-gray-800 dark:text-white
                   relative overflow-hidden"
          >
            {{ $t('gallery') }}
          </router-link>

          <!-- For Students Dropdown -->
          <GlassDropdown :label="$t('for_students')">
            <GlassDropdownItem to="/about/studentcouncil" :label="$t('student_parliament')" />
            <GlassDropdownItem
              v-for="student in getStudentItems()"
              :key="student.id"
              :to="'/renderer/students/' + student.id"
              :label="student.name"
            />
            <GlassDropdownItem to="/studentdocuments" :label="$t('studentdocuments')" />
            <GlassDropdownItem href="https://moodle.tsada.edu.rs" :label="$t('eclassroom')" />
          </GlassDropdown>

          <!-- Documents Dropdown -->
          <GlassDropdown :label="$t('documents')">
            <GlassDropdownItem to="/documents" :label="$t('school_documents')" />
            <GlassDropdownItem to="/docs/public_procurements" :label="$t('public_procurements')" />
            <GlassDropdownItem to="/docs/leases" :label="$t('lease')" />
            <GlassDropdownItem to="/renderer/education/67b4d43f0017f6a974b8" :label="$t('duplicates_of_diplomas')" />
          </GlassDropdown>

          <!-- Adult Education -->
          <router-link
            to="/renderer/education/adult_education"
            class="px-4 py-2 rounded-lg font-medium transition-all duration-300 ease-out
                   hover:bg-white/10 dark:hover:bg-gray-800/30 hover:backdrop-blur-md
                   shadow-md shadow-transparent hover:shadow-sky-500/10
                   text-gray-800 dark:text-white
                   relative overflow-hidden"
          >
            {{ $t('adult_education') }}
          </router-link>

          <!-- Erasmus Dropdown -->
          <GlassDropdown :label="$t('Erasmus')">
            <GlassDropdownItem
              v-for="erasmus in getErasmusItems()"
              :key="erasmus.id"
              :to="'/renderer/erasmus/' + erasmus.id"
              :label="erasmus.name"
            />
            <GlassDropdownItem v-if="showErasmusApply" to="/erasmus/apply" :label="$t('erasmus_apply')" />
            <GlassDropdownItem v-if="state.navigationData?.erasmusSettings.list_enabled" to="/erasmus/results" :label="$t('erasmus_applies_result')" />
            <GlassDropdownItem v-if="isAuthenticated" to="/admin/erasmus/applies" :label="$t('erasmus_applies')" />
          </GlassDropdown>

          <!-- Language Selector Desktop -->
          <GlassDropdown>
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

          <!-- Account Menu (Logged In) -->
          <GlassDropdown v-if="isAuthenticated" :label="$t('account')">
            <GlassDropdownItem to="/admin/messages" :label="$t('messages')" />
            <GlassDropdownItem to="/admin/slide-editor" :label="$t('presentation_editor')" />
            <GlassDropdownItem :action="logout" :label="$t('logout')" />
          </GlassDropdown>

          <!-- Login (Not Logged In) -->
          <router-link
            v-else
            to="/login"
            class="px-4 py-2 rounded-lg font-medium transition-all duration-300 ease-out
                   hover:bg-white/10 dark:hover:bg-gray-800/30 hover:backdrop-blur-md
                   shadow-md shadow-transparent hover:shadow-sky-500/10
                   text-gray-800 dark:text-white
                   relative overflow-hidden"
          >
            {{ $t('login') }}
          </router-link>
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
 import { useLoadingStore } from '@/stores/loading';

const { t } = useI18n()

const {
  // State
  state,

  // Computed
  isAuthenticated,
  isMobileView,
  isTabletMode,
  showErasmusApply,
  //showEuFunding,

  // Methods
  toggleMobileMenu,
  closeMobileMenu,
  changeLanguage,
  logout,

  // Menu getters
  getAboutItems,
  getErasmusItems,
  getStudentItems
} = useHeader()

const loading=  useLoadingStore();
// Additional computed
const showMobileMenu = computed(() => (state.mobileMenuOpen && isMobileView.value) || !isMobileView.value)
const styleComputedForMobile = computed(() => isMobileView.value && !showMobileMenu.value)
const showEuFunding = computed(() => loading.currentPageEuFunding)


// Mobile menu items structure
const mobileMenuItems = computed(() => {
  const items = [
    {
      label: t('home'),
      to: '/home'
    },
    {
      label: t('aboutus'),
      children: [
        { label: t('history_of_school'), to: '/renderer/about/history' },
        { label: t('school_board'), to: '/about/schoolboard' },
        { label: t('parents_council'), to: '/about/parentscouncil' },
        { label: t('services'), to: '/about/pepsi' },
        ...getAboutItems().map(item => ({
          label: item.title,
          to: `/renderer/about/${item.id}`
        })),
        { label: t('workers'), to: '/about/workers' },
        { label: t('classlist'), to: '/about/classlist' }
      ]
    },
    {
      label: t('education'),
      children: [
        {
          label: t('courses'),
          children: [
            {
              label: t('machine'),
              children: [
                { label: t('mechanical_technician'), to: '/renderer/education/mechanical_technician' },
                { label: t('cnc_miller'), to: '/renderer/education/cnc_miller' }
              ]
            },
            {
              label: t('electrotechnic'),
              children: [
                { label: t('mechatronic_technician'), to: '/renderer/education/mechatronic_technician' },
                { label: t('computer_electrotechnician'), to: '/renderer/education/computer_electrotechnician' }
              ]
            },
            {
              label: t('civil_engineering'),
              children: [
                { label: t('primary_construction_works_operator'), to: '/renderer/education/primary_construction_works_operator' }
              ]
            }
          ]
        },
        { label: t('timetable'), to: '/about/timetable' },
        { label: t('teachers_receiving_hour'), to: '/about/workerstimetable' },
        { label: t('parentsvisiting'), to: '/about/parentvisiting' },
        { label: t('examslist'), to: '/renderer/education/examslist' },
        { label: t('textbooks'), to: '/renderer/education/textbooks' }
      ]
    },
    {
      label: t('gallery'),
      to: '/gallery'
    },
    {
      label: t('for_students'),
      children: [
        { label: t('student_parliament'), to: '/about/studentcouncil' },
        ...getStudentItems().map(item => ({
          label: item.name || item.title,
          to: `/renderer/students/${item.id}`
        })),
        { label: t('studentdocuments'), to: '/studentdocuments' },
        { label: t('eclassroom'), href: 'https://moodle.tsada.edu.rs' }
      ]
    },
    {
      label: t('documents'),
      children: [
        { label: t('school_documents'), to: '/documents' },
        { label: t('public_procurements'), to: '/docs/public_procurements' },
        { label: t('lease'), to: '/docs/leases' },
        { label: t('duplicates_of_diplomas'), to: '/renderer/education/67b4d43f0017f6a974b8' }
      ]
    },
    {
      label: t('adult_education'),
      to: '/renderer/education/adult_education'
    },
    {
      label: t('Erasmus'),
      children: [
        ...getErasmusItems().map(item => ({
          label: item.name || item.title,
          to: `/renderer/erasmus/${item.id}`
        })),
        ...(showErasmusApply.value ? [{ label: t('erasmus_apply'), to: '/erasmus/apply' }] : []),
        ...(state.navigationData?.erasmusSettings.list_enabled ? [{ label: t('erasmus_applies_result'), to: '/erasmus/results' }] : []),
        ...(isAuthenticated.value ? [{ label: t('erasmus_applies'), to: '/admin/erasmus/applies' }] : [])
      ]
    },
    {
      label: t('language'),
      children: state.languages.map(lang => ({
        label: lang.name,
        flag: lang.country,
        action: () => changeLanguage(lang.code)
      }))
    }
  ]

  // Add account menu if authenticated
  if (isAuthenticated.value) {
    items.push({
      label: t('account'),
      children: [
        { label: t('messages'), to: '/admin/messages' },
        { label: t('presentation_editor'), to: '/admin/slide-editor' },
        { label: t('logout'), action: logout }
      ]
    })
  } else {
    items.push({
      label: t('login'),
      to: '/login'
    })
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
