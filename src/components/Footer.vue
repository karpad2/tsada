<template>
    <footer class="text-gray-400 bg-gray-900 body-font">
      <div class="container px-5 py-8 mx-auto flex items-center sm:flex-row flex-col">
        <a class="flex title-font font-medium items-center md:justify-start justify-center text-white">
          <img src="@/assets/tsada_logo.png" class="size-16 text-white p-2 bg-sky-300/50 rounded-full" alt="Logo" />
          <span class="ml-3 text-xl">{{ $t('school_name') }}</span>
        </a>
  
        <div class="text-sm text-gray-400 sm:ml-4 sm:pl-4 sm:border-l-2 sm:border-gray-800 sm:py-2 sm:mt-0 mt-4">
          © {{ year }} {{ $t('school_name') }}
          <a href="https://karpad2.github.io" class="text-gray-500 ml-1" target="_blank" rel="noopener noreferrer">
            Designed by <span class="hover:text-sky-400">Kovács Árpád</span>
          </a>
          <div>App version: {{ _version }}</div>
        </div>
  
        <span class="inline-flex sm:ml-auto sm:mt-0 mt-4 justify-center sm:justify-start items-center gap-4">
          
         

          <a href="https://www.facebook.com/p/Msc-Kultura-100063626860924" aria-label="Facebook" class="ml-2 text-gray-400 hover:text-sky-400">
            <i class="pi pi-facebook"></i>
          </a>
          <a href="https://www.instagram.com/_msc_ada_/?utm_medium=copy_link" aria-label="Instagram" class="ml-2 text-gray-400 hover:text-sky-400">
            <i class="pi pi-instagram"></i>
          </a>
          <a href="https://www.youtube.com/@MSCTVada" aria-label="YouTube" class="ml-2 text-gray-400 hover:text-sky-400">
            <i class="pi pi-youtube"></i>
          </a>
          <a href="https://www.tiktok.com/@muszaki_iskola_ada" aria-label="TikTok" class="ml-2 text-gray-400 hover:text-sky-400">
            <i class="pi pi-tiktok"></i>
          </a>
  
          <!-- Dark/Light Mode Toggle -->
          <button @click="toggleDarkMode" class="ml-2 text-gray-400 hover:text-sky-400 cursor-pointer transition-colors">
            <i v-if="isDarkMode" class="pi pi-moon"></i>
            <i v-else class="pi pi-sun"></i>
          </button>
  
    <!-- Optional random theme trigger -->
          <div v-if="false"  class="ml-2 text-gray-400 hover:text-sky-400 dropdown dropdown-top dropdown-hover">
            <div tabindex="0" role="button" ><i class="pi pi-palette"></i></div>
            <ul   tabindex="0" class="dropdown-content z-[1] menu p-2  bg-base-100 rounded-box w-52  ">
                      
      <li>
      <input
        type="radio"
        name="theme-dropdown"
        class="theme-controller w-full btn btn-sm btn-block btn-ghost justify-start"
        aria-label="Default"
        value="default" />
    </li>
    <li>
      <input
        type="radio"
        name="theme-dropdown"
        class="theme-controller w-full btn btn-sm btn-block btn-ghost justify-start"
        aria-label="Retro"
        value="retro" />
    </li>
    <li>
      <input
        type="radio"
        name="theme-dropdown"
        class="theme-controller w-full btn btn-sm btn-block btn-ghost justify-start"
        aria-label="Cyberpunk"
        value="cyberpunk" />
    </li>
    <li>
      <input
        type="radio"
        name="theme-dropdown"
        class="theme-controller w-full btn btn-sm btn-block btn-ghost justify-start"
        aria-label="Valentine"
        value="valentine" />
    </li>
    <li>
      <input
        type="radio"
        name="theme-dropdown"
        class="theme-controller w-full btn btn-sm btn-block btn-ghost justify-start"
        aria-label="Aqua"
        value="aqua" />
    </li>
                  </ul>
          </div>

        
        </span>
      </div>
      <Cookie />
    </footer>
  </template>
  
  <script>
  import Cookie from "@/components/Cookie.vue";
  import Certop from "@/components/Certop.vue";
  import moment from "moment";
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
        return moment().format("YYYY");
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
  
  <style scoped>
  /* Optional footer-specific styles */
  </style>
  