<template>
  <footer class="glass-footer text-gray-400 body-font">
    <div class="container px-5 py-10 mx-auto flex items-center sm:flex-row flex-col gap-4">
      <a class="flex title-font font-medium items-center md:justify-start justify-center text-white group">
        <img
          src="@/assets/tsada_logo.png"
          class="size-14 text-white p-1.5 bg-sky-400/20 ring-1 ring-sky-400/30 rounded-full object-contain shadow-lg shadow-sky-500/20 group-hover:ring-sky-400/50 transition-all duration-300"
          alt="Logo"
          loading="lazy"
          width="64"
          height="56"
        />
        <span class="ml-3 text-lg font-semibold tracking-tight">{{ $t('school_name') }}</span>
      </a>

      <div class="text-sm text-slate-400 sm:ml-4 sm:pl-4 sm:border-l sm:border-sky-500/20 sm:py-2 sm:mt-0 mt-2 text-center sm:text-left">
        © {{ year }} {{ $t('school_name') }}
        <a
          href="https://karpad2.github.io"
          class="text-slate-500 ml-1 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          Designed by <span class="hover:text-sky-400">Kovács Árpád</span>
        </a>
        <div class="text-xs text-slate-500 mt-0.5">App version: {{ _version }}</div>
      </div>

      <span class="inline-flex sm:ml-auto sm:mt-0 mt-2 justify-center sm:justify-start items-center gap-2">
        <a
          href="https://www.facebook.com/p/Msc-Kultura-100063626860924"
          aria-label="Facebook"
          class="social-glass"
        >
          <i class="pi pi-facebook"></i>
        </a>
        <a
          href="https://www.instagram.com/_msc_ada_/?utm_medium=copy_link"
          aria-label="Instagram"
          class="social-glass"
        >
          <i class="pi pi-instagram"></i>
        </a>
        <a
          href="https://www.youtube.com/@MSCTVada"
          aria-label="YouTube"
          class="social-glass"
        >
          <i class="pi pi-youtube"></i>
        </a>
        <a
          href="https://www.tiktok.com/@muszaki_iskola_ada"
          aria-label="TikTok"
          class="social-glass"
        >
          <i class="pi pi-tiktok"></i>
        </a>

        <!-- Dark/Light Mode Toggle -->
        <button
          @click="toggleDarkMode"
          class="social-glass cursor-pointer"
          :aria-label="isDarkMode ? 'Light mode' : 'Dark mode'"
        >
          <i v-if="isDarkMode" class="pi pi-moon"></i>
          <i v-else class="pi pi-sun"></i>
        </button>
      </span>
    </div>
    <Cookie />
  </footer>
</template>

<script>
import Cookie from "@/components/Cookie.vue";
import Certop from "@/components/Certop.vue";
import dayjs from '@/utils/dayjs';
import vv from "../../package.json";
import { useTheme } from "vuetify";
import themes from "@/themes/store.json";
import { useLoadingStore } from "@/stores/loading";

export default {
  name: "Footer",
  components: {
    Cookie,
    Certop,
  },
  data() {
    return {
      isDarkMode: false,
    };
  },
  setup() {
    const themeprovider = useTheme();
    return { themeprovider };
  },
  computed: {
    year() {
      return dayjs().format("YYYY");
    },
    _version() {
      return vv.version;
    },
    showEuFunding() {
      const loadingStore = useLoadingStore();
      return loadingStore.currentPageEuFunding;
    },
  },
  mounted() {
    const savedTheme = localStorage.getItem("theme");
    this.isDarkMode = savedTheme === "dark";

    const html = document.documentElement;
    html.classList.toggle("dark", this.isDarkMode);
    this.themeprovider.global.name.value = this.isDarkMode ? "dark" : "light";
  },
  methods: {
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
      const html = document.documentElement;
      html.classList.toggle("dark", this.isDarkMode);

      const theme = this.isDarkMode ? "dark" : "light";
      localStorage.setItem("theme", theme);
      this.themeprovider.global.name.value = theme;

      useLoadingStore().setThemeSetting(theme);
    },
    random_theme() {
      const t = themes.themes;
      const k = t.length;

      if (k === 0) {
        console.error("Themes array is empty");
        return;
      }

      const randomIndex = Math.floor(Math.random() * k);
      const theme = t[randomIndex];

      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    },
  },
};
</script>
