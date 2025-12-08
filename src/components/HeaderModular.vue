<template>
  <header
    v-if="!state.loading"
    :class="{ mobile_force: isMobileView }"
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
          />
          <span class="ml-1 max-sm:hidden text-xl dark:text-white">
            {{ $t('school_name') }}
          </span>

          <Certop class="h-28 w-28" />

          <img

            src="@a/Erasmus_Logo.svg"
            alt="erasmus+"
            class="w-36 h-12 text-white p-2"
          />

          <img
            v-if="showEuFunding || true"
            src="@a/eu_co_funded.png"
            alt="Co-funded by the European Union"
            class="w-32 h-12 text-white p-1"
          />
        </router-link>
      </div>

      <!-- Navigation Menu -->
      <nav
        v-if="isMobileMode"
        :class="[
          { 'flex-col': isMobileView },
          { 'mx-auto': isMobileView || isTabletMode },
          { 'flex-row': !isMobileView }
        ]"
        class="md:ml-auto flex items-center text-base justify-center"
      >
        <!-- Home Link -->
        <router-link
          to="/home"
          class="btn btn-ghost cursor-pointer dark:text-white"
        >
          {{ $t('home') }}
        </router-link>

        <!-- About Us Dropdown -->
        <NavigationDropdown
          :title="$t('aboutus')"
          :items="getAboutItems()"
          route-prefix="/renderer/about/"
          tracking-category="about"
        >
          <template #custom-items>
            <li><router-link to="/renderer/about/history">{{ $t("history_of_school") }}</router-link></li>
            <li><router-link to="/about/schoolboard">{{ $t("school_board") }}</router-link></li>
            <li><router-link to="/about/parentscouncil">{{ $t("parents_council") }}</router-link></li>
            <li><router-link to="/about/pepsi">{{ $t("services") }}</router-link></li>
            <li><router-link to="/about/workers">{{ $t("workers") }}</router-link></li>
            <li><router-link to="/about/classlist">{{ $t("classlist") }}</router-link></li>
          </template>
        </NavigationDropdown>

        <!-- Education Dropdown -->
        <div class="dropdown dropdown-hover">
          <div
            tabindex="0"
            role="button"
            class="btn btn-ghost cursor-pointer dark:text-white"
          >
            {{ $t('education') }} <i class="pi pi-angle-down"></i>
          </div>
          <ul
            tabindex="0"
            class="dropdown-content z-[1] menu p-2 bg-base-100 rounded-box block w-52"
          >
            <!-- Courses submenu -->
            <li>
              <details
                :class="{ 'dropdown-right': !isMobileView }"
                class="dropdown dropdown-hover"
              >
                <summary>{{ $t("courses") }}</summary>
                <ul class="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                  <!-- Machine courses -->
                  <li>
                    <details
                      :class="{ 'dropdown-right': !isMobileView }"
                      class="dropdown dropdown-hover"
                    >
                      <summary>{{ $t("machine") }}</summary>
                      <ul class="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                        <li><router-link to="/renderer/education/mechanical_technician">{{ $t("mechanical_technician") }}</router-link></li>
                        <li><router-link to="/renderer/education/cnc_miller">{{ $t("cnc_miller") }}</router-link></li>
                      </ul>
                    </details>
                  </li>

                  <!-- Electrotechnics courses -->
                  <li>
                    <details
                      :class="{ 'dropdown-right': !isMobileView }"
                      class="dropdown dropdown-hover"
                    >
                      <summary>{{ $t("electrotechnic") }}</summary>
                      <ul class="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                        <li><router-link to="/renderer/education/mechatronic_technician">{{ $t("mechatronic_technician") }}</router-link></li>
                        <li><router-link to="/renderer/education/computer_electrotechnician">{{ $t("computer_electrotechnician") }}</router-link></li>
                      </ul>
                    </details>
                  </li>

                  <!-- Civil engineering courses -->
                  <li>
                    <details
                      :class="{ 'dropdown-right': !isMobileView }"
                      class="dropdown dropdown-hover"
                    >
                      <summary>{{ $t("civil_engineering") }}</summary>
                      <ul class="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                        <li><router-link to="/renderer/education/primary_construction_works_operator">{{ $t("primary_construction_works_operator") }}</router-link></li>
                      </ul>
                    </details>
                  </li>
                </ul>
              </details>
            </li>

            <!-- Other education links -->
            <li><router-link to="/about/timetable">{{ $t("timetable") }}</router-link></li>
            <li><router-link to="/about/workerstimetable">{{ $t("teachers_receiving_hour") }}</router-link></li>
            <li><router-link to="/about/parentvisiting">{{ $t("parentsvisiting") }}</router-link></li>
            <li><router-link to="/renderer/education/examslist">{{ $t("examslist") }}</router-link></li>
            <li><router-link to="/renderer/education/textbooks">{{ $t("textbooks") }}</router-link></li>
          </ul>
        </div>

        <!-- Gallery Link -->
        <router-link
          to="/gallery"
          class="btn btn-ghost cursor-pointer dark:text-white"
        >
          {{ $t('gallery') }}
        </router-link>

        <!-- For Students Dropdown -->
        <NavigationDropdown
          :title="$t('for_students')"
          :items="getStudentItems()"
          route-prefix="/renderer/students/"
          tracking-category="students"
        >
          <template #custom-items>
            <li><router-link to="/about/studentcouncil">{{ $t("student_parliament") }}</router-link></li>
            <li><router-link to="/studentdocuments">{{ $t("studentdocuments") }}</router-link></li>
            <li><a href="https://moodle.tsada.edu.rs">{{ $t("eclassroom") }}</a></li>
          </template>
        </NavigationDropdown>

        <!-- Documents Dropdown -->
        <NavigationDropdown
          :title="$t('documents')"
          :items="getDocumentCategories()"
          route-prefix="/renderer/documents/"
          tracking-category="documents"
        >
          <template #custom-items>
            <li><router-link to="/documents">{{ $t("school_documents") }}</router-link></li>
            <li><router-link to="/docs/public_procurements">{{ $t("public_procurements") }}</router-link></li>
            <li><router-link to="/docs/leases">{{ $t("lease") }}</router-link></li>
          </template>
        </NavigationDropdown>

        <!-- Erasmus Dropdown (conditionally shown) -->
        <NavigationDropdown
          v-if="showErasmusFlag && getErasmusItems().length > 0"
          title="Erasmus+"
          :items="getErasmusItems()"
          route-prefix="/renderer/erasmus/"
          tracking-category="erasmus"
        >
          <template #custom-items>
            <li v-if="showErasmusApply">
              <router-link to="/erasmus/apply">{{ $t("erasmus_apply") }}</router-link>
            </li>
          </template>
        </NavigationDropdown>

        <!-- User Menu and Language Selector -->
        <div class="flex items-center gap-2 ml-4">
          <LanguageSelector
            :languages="state.languages"
            :current-language="state.currentLanguage"
            :current-flag="state.currentFlag"
            @language-change="changeLanguage"
          />

          <UserMenu
            :is-authenticated="isAuthenticated"
            :show-profile="false"
            :show-settings="false"
            @logout="logout"
          />
        </div>
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

<script lang="ts">
import { defineComponent } from 'vue'
import { useHeader } from '@/composables/ui/useHeader'
import NavigationDropdown from '@/components/navigation/NavigationDropdown.vue'
import LanguageSelector from '@/components/navigation/LanguageSelector.vue'
import MobileMenuButton from '@/components/navigation/MobileMenuButton.vue'
import UserMenu from '@/components/navigation/UserMenu.vue'
import Certop from '@/components/shared/Certop.vue'

export default defineComponent({
  name: 'HeaderModular',
  components: {
    NavigationDropdown,
    LanguageSelector,
    MobileMenuButton,
    UserMenu,
    Certop
  },
  setup() {
    const {
      // State
      state,

      // Computed
      isAuthenticated,
      isMobileView,
      isTabletMode,
      isMobileMode,
      showErasmusFlag,
      showErasmusApply,
      showEuFunding,

      // Methods
      toggleMobileMenu,
      changeLanguage,
      logout,

      // Menu getters
      getDocumentCategories,
      getAboutItems,
      getErasmusItems,
      getStudentItems
    } = useHeader()

    return {
      // State
      state,

      // Computed
      isAuthenticated,
      isMobileView,
      isTabletMode,
      isMobileMode,
      showErasmusFlag,
      showErasmusApply,
      showEuFunding,

      // Methods
      toggleMobileMenu,
      changeLanguage,
      logout,

      // Menu getters
      getDocumentCategories,
      getAboutItems,
      getErasmusItems,
      getStudentItems
    }
  }
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