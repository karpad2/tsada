<template>
  <header
    v-if="showHeader"
    :class="{ mobile_force: styleComputedForMobile }"
    style="z-index: 200"
    class="navbar transition-all delay-150 pt-5 text-gray-600 backdrop-filter bg-opacity-50 bg-gray-300 dark:bg-gray-900 backdrop-blur-lg body-font sticky top-0"
    id="home"
  >
    <div
      :class="[{ 'flex-col': mobileView }, { 'flex-row': !mobileView }]"
      class="container mx-auto flex flex-wrap items-center"
    >
      <div class="flex items-center">
        <!-- Mobile Menu Button -->
        <div v-if="mobileView" class="flex items-start">
          <button @click="toggleMenu" class="btn btn-ghost mobile-menu-button m-3 dark:text-white">
            <i :class="menuOpened ? 'pi pi-times' : 'pi pi-align-left'"></i>
          </button>
        </div>

        <!-- Logo -->
        <router-link to="/home" class="flex flex-row items-center title-font font-medium text-gray-900 mb-4 md:mb-0">
          <img src="@a/tsada_logo.png" alt="logo" class="size-20 text-white p-1 bg-sky-400/15 rounded-full" />
          <span class="ml-1 max-sm:hidden text-xl dark:text-white">{{ $t('school_name') }}</span>
          <Certop class="h-28 w-28" />
          <img src="@a/Erasmus_Logo.svg" alt="erasmus+" class="w-36 h-12 text-white p-2" />
        </router-link>
      </div>

      <!-- Navigation -->
      <nav
        v-if="showMobileMenu"
        :class="[
          { 'flex-col': mobileView },
          { 'mx-auto': mobileView || tabletView },
          { 'flex-row': !mobileView },
        ]"
        class="md:ml-auto flex items-center text-base justify-acenter"
      >
        <!-- Home -->
        <router-link to="/home" class="btn btn-ghost cursor-pointer dark:text-white">
          {{ $t('home') }}
        </router-link>

        <!-- About Us Dropdown -->
        <div class="dropdown dropdown-hover">
          <div tabindex="0" role="button" class="btn btn-ghost cursor-pointer dark:text-white">
            {{ $t('aboutus') }}<i class="pi pi-angle-down"></i>
          </div>
          <ul tabindex="0" class="dropdown-content z-[1] menu p-2 bg-base-100 rounded-box block w-52">
            <li><router-link to="/renderer/about/history">{{ $t('history_of_school') }}</router-link></li>
            <li><router-link to="/about/schoolboard">{{ $t('school_board') }}</router-link></li>
            <li><router-link to="/about/parentscouncil">{{ $t('parents_council') }}</router-link></li>
            <li><router-link to="/about/pepsi">{{ $t('services') }}</router-link></li>
            <li v-for="about in navigationData.abouts.value" :key="about.id">
              <router-link :to="'/renderer/about/' + about.id">{{ about.title }}</router-link>
            </li>
            <li><router-link to="/about/workers">{{ $t('workers') }}</router-link></li>
            <li><router-link to="/about/classlist">{{ $t('classlist') }}</router-link></li>
          </ul>
        </div>

        <!-- Education Dropdown -->
        <div class="dropdown dropdown-hover">
          <div tabindex="0" role="button" class="btn btn-ghost cursor-pointer dark:text-white">
            {{ $t('education') }} <i class="pi pi-angle-down"></i>
          </div>
          <ul tabindex="0" class="dropdown-content z-[1] menu p-2 bg-base-100 rounded-box block w-52">
            <li>
              <details :class="{ 'dropdown-right': !mobileView }" class="dropdown dropdown-hover">
                <summary>{{ $t('courses') }}</summary>
                <ul class="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                  <!-- Mechanical -->
                  <li>
                    <details :class="{ 'dropdown-right': !mobileView }" class="dropdown dropdown-hover">
                      <summary>{{ $t('machine') }}</summary>
                      <ul class="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                        <li>
                          <router-link to="/renderer/education/mechanical_technician">
                            {{ $t('mechanical_technician') }}
                          </router-link>
                        </li>
                        <li>
                          <router-link to="/renderer/education/cnc_miller">{{ $t('cnc_miller') }}</router-link>
                        </li>
                      </ul>
                    </details>
                  </li>

                  <!-- Electrotechnic -->
                  <li>
                    <details :class="{ 'dropdown-right': !mobileView }" class="dropdown dropdown-hover">
                      <summary>{{ $t('electrotechnic') }}</summary>
                      <ul class="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                        <li>
                          <router-link to="/renderer/education/mechatronic_technician">
                            {{ $t('mechatronic_technician') }}
                          </router-link>
                        </li>
                        <li>
                          <router-link to="/renderer/education/computer_electrotechnician">
                            {{ $t('computer_electrotechnician') }}
                          </router-link>
                        </li>
                      </ul>
                    </details>
                  </li>

                  <!-- Civil Engineering -->
                  <li>
                    <details :class="{ 'dropdown-right': !mobileView }" class="dropdown dropdown-hover">
                      <summary>{{ $t('civil_engineering') }}</summary>
                      <ul class="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                        <li>
                          <router-link to="/renderer/education/primary_construction_works_operator">
                            {{ $t('primary_construction_works_operator') }}
                          </router-link>
                        </li>
                      </ul>
                    </details>
                  </li>
                </ul>
              </details>
            </li>

            <li><router-link to="/about/timetable">{{ $t('timetable') }}</router-link></li>
            <li><router-link to="/about/workerstimetable">{{ $t('teachers_receiving_hour') }}</router-link></li>
            <li><router-link to="/about/parentvisiting">{{ $t('parentsvisiting') }}</router-link></li>
            <li><router-link to="/renderer/education/examslist">{{ $t('examslist') }}</router-link></li>
            <li><router-link to="/renderer/education/textbooks">{{ $t('textbooks') }}</router-link></li>
          </ul>
        </div>

        <!-- Gallery -->
        <router-link to="/gallery" class="btn btn-ghost cursor-pointer dark:text-white">
          {{ $t('gallery') }}
        </router-link>

        <!-- For Students Dropdown -->
        <div class="dropdown dropdown-hover">
          <div tabindex="0" role="button" class="btn btn-ghost cursor-pointer dark:text-white">
            {{ $t('for_students') }} <i class="pi pi-angle-down"></i>
          </div>
          <ul tabindex="0" class="dropdown-content z-[1] menu p-2 bg-base-100 rounded-box w-52">
            <li><router-link to="/about/studentcouncil">{{ $t('student_parliament') }}</router-link></li>
            <li v-for="student in navigationData.students.value" :key="student.id">
              <router-link :to="'/renderer/students/' + student.id">{{ student.name }}</router-link>
            </li>
            <li><router-link to="/studentdocuments">{{ $t('studentdocuments') }}</router-link></li>
            <li><a href="https://moodle.tsada.edu.rs">{{ $t('eclassroom') }}</a></li>
          </ul>
        </div>

        <!-- Documents Dropdown -->
        <div class="dropdown dropdown-hover">
          <div tabindex="0" role="button" class="btn btn-ghost cursor-pointer dark:text-white">
            {{ $t('documents') }} <i class="pi pi-angle-down"></i>
          </div>
          <ul tabindex="0" class="dropdown-content z-[1] menu p-2 bg-base-100 rounded-box w-52">
            <li><router-link to="/documents">{{ $t('school_documents') }}</router-link></li>
            <li><router-link to="/docs/public_procurements">{{ $t('public_procurements') }}</router-link></li>
            <li><router-link to="/docs/leases">{{ $t('lease') }}</router-link></li>
            <li>
              <router-link to="/renderer/education/67b4d43f0017f6a974b8">
                {{ $t('duplicates_of_diplomas') }}
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Adult Education -->
        <router-link to="/renderer/education/adult_education" class="btn btn-ghost cursor-pointer dark:text-white">
          {{ $t('adult_education') }}
        </router-link>

        <!-- Language Selector Desktop -->
        <div v-if="!mobileView" class="dropdown dropdown-hover">
          <div tabindex="0" role="button" class="btn btn-ghost cursor-pointer dark:text-white">
            <country-flag :country="languageComposable.currentLanguage.value.country" size="small" />
            <i class="pi pi-angle-down"></i>
          </div>
          <ul tabindex="0" class="dropdown-content z-[1] menu p-2 bg-base-100 rounded-box w-52">
            <li v-for="lang in languageComposable.languages" :key="lang.code">
              <a @click="handleLanguageChange(lang.code)">
                <country-flag :country="lang.country" size="small" /> {{ lang.name }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Language Selector Mobile -->
        <div v-if="mobileView" role="button" class="btn btn-ghost cursor-pointer">
          <button v-for="lang in languageComposable.languages" :key="lang.code" class="m-5 w-10">
            <a @click="handleLanguageChange(lang.code)">
              <country-flag :country="lang.country" size="small" />
            </a>
          </button>
        </div>

        <!-- Erasmus Dropdown -->
        <div class="dropdown dropdown-hover">
          <div tabindex="0" role="button" class="btn btn-ghost mr-5 cursor-pointer dark:text-white">
            {{ $t('Erasmus') }} <i class="pi pi-angle-down"></i>
          </div>
          <ul tabindex="0" class="dropdown-content z-[1] menu p-2 bg-base-100 rounded-box w-52">
            <li v-for="erasmus in navigationData.erasmus.value" :key="erasmus.id">
              <router-link :to="'/renderer/erasmus/' + erasmus.id">{{ erasmus.name }}</router-link>
            </li>
            <li v-if="navigationData.erasmusSettings.value.erasmus_apply_on">
              <router-link to="/erasmus/apply">{{ $t('erasmus_apply') }}</router-link>
            </li>
            <li v-if="navigationData.erasmusSettings.value.erasmus_list">
              <router-link to="/erasmus/results">{{ $t('erasmus_applies_result') }}</router-link>
            </li>
            <li v-if="isLoggedIn">
              <router-link to="/admin/erasmus/applies">{{ $t('erasmus_applies') }}</router-link>
            </li>
          </ul>
        </div>

        <!-- Account Menu (Logged In) -->
        <div v-if="isLoggedIn" class="dropdown dropdown-hover">
          <div tabindex="0" role="button" class="btn btn-ghost m-3 mr-5 cursor-pointer dark:text-white">
            {{ $t('account') }} <i class="pi pi-angle-down"></i>
          </div>
          <ul tabindex="0" class="dropdown-content z-[1] menu p-2 bg-base-100 rounded-box w-52">
            <li><router-link to="/admin/messages">{{ $t('messages') }}</router-link></li>
            <li><router-link to="/admin/slide-editor">{{ $t('presentation_editor') }}</router-link></li>
            <li><router-link to="/" @click="handleLogout">{{ $t('logout') }}</router-link></li>
          </ul>
        </div>

        <!-- Login (Not Logged In) -->
        <router-link v-else to="/login" class="btn btn-ghost mr-5 cursor-pointer dark:text-white">
          {{ $t('login') }}
        </router-link>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { Account } from 'appwrite';
import { appw, appwriteService } from '@/appwrite';
import { useLoadingStore } from '@/stores/loading';
import { useNavigationData } from '@/composables/useNavigationData';
import { useLanguage } from '@/composables/useLanguage';
import Certop from './Certop.vue';

// Composables
const { t, locale } = useI18n();
const router = useRouter();
const loadingStore = useLoadingStore();
const navigationData = useNavigationData();
const languageComposable = useLanguage();

// Initialize locale from store immediately
locale.value = loadingStore.language;

// State
const showHeader = ref(true);
const menuOpened = ref(false);
const mobileView = ref(false);
const tabletView = ref(false);

// Computed
const isLoggedIn = computed(() => loadingStore.userLoggedin);
const showMobileMenu = computed(() => (menuOpened.value && mobileView.value) || !mobileView.value);
const styleComputedForMobile = computed(() => mobileView.value && !showMobileMenu.value);

// Methods
const onResize = () => {
  mobileView.value = window.innerWidth <= 1276;
  tabletView.value = window.innerWidth >= 1276 && window.innerWidth <= 1550;
};

const toggleMenu = () => {
  menuOpened.value = !menuOpened.value;
};

const handleLanguageChange = async (code: string) => {
  try {
    // Update locale immediately
    locale.value = code;
    loadingStore.setLanguage(code);

    // Clear PWA cache
    await languageComposable.changeLanguage(code);

    // Reload navigation data with new language
    await navigationData.loadNavigationData(true);

    // Force re-render
    showHeader.value = false;
    await nextTick();
    showHeader.value = true;
  } catch (error) {
    console.error('Error during language change:', error);
    window.location.reload();
  }
};

const handleLogout = async () => {
  try {
    const account = new Account(appw);
    await account.deleteSessions();
    loadingStore.setUserLoggedin(false);

    // PWA cache törlés kijelentkezéskor
    if ('serviceWorker' in navigator && 'caches' in window) {
      const cacheNames = await caches.keys();
      const userCaches = cacheNames.filter(
        (name) =>
          name.includes('api-cache') ||
          name.includes('dynamic-cache') ||
          name.includes('user-data')
      );

      await Promise.all(userCaches.map((cacheName) => caches.delete(cacheName)));
    }

    console.log('logout successful');
    router.push('/home');

    // Force refresh
    showHeader.value = false;
    await nextTick();
    showHeader.value = true;
  } catch (error) {
    console.error('Logout error:', error);
    window.location.href = '/home';
  }
};

const initializeHeader = async () => {
  try {
    // Set locale from store (handled by useI18n)
    document.title = t('school_name');

    // Check authentication
    appwriteService.checkAuth();

    // Load navigation data
    await navigationData.loadNavigationData();
  } catch (error) {
    console.error('Error initializing header:', error);
  }
};

// Lifecycle
onMounted(() => {
  onResize();
  window.addEventListener('resize', onResize);
  initializeHeader();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
});
</script>

<style scoped>
.mobile_force {
  max-height: 80px;
}
</style>
