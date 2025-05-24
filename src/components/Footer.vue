<template>
    <!-- Footer -->
    <footer class="text-gray-400 bg-gray-900 body-font">
        <div class="container px-5 py-8 mx-auto flex items-center sm:flex-row flex-col">
            <a class="flex title-font font-medium items-center md:justify-start justify-center text-white">
                <img src="@/assets/tsada_logo.png" class="size-16 text-white p-2 bg-sky-300/50 rounded-full" alt="Logo">
                <span class="ml-3 text-xl">{{ $t('school_name') }}</span>
            </a>
            <div class="text-sm text-gray-400 sm:ml-4 sm:pl-4 sm:border-l-2 sm:border-gray-800 sm:py-2 sm:mt-0 mt-4">©
                {{ year }}
                {{ $t('school_name') }}
                <a href="https://karpad2.github.io" class="text-gray-500 ml-1" target="_blank"
                    rel="noopener noreferrer">Designed by <span class="hover:text-sky-400">Kovács Árpád</span></a>
                    <div> App version: {{ _version }}</div>
            </div>
            
            <span class="inline-flex sm:ml-auto sm:mt-0 mt-4 justify-center sm:justify-start">
                <a href="https://www.facebook.com/p/Msc-Kultura-100063626860924" class="ml-2 text-gray-400 hover:text-sky-400">
                    <i class="pi pi-facebook"></i>
                </a>
                <a href="https://www.instagram.com/_msc_ada_/?utm_medium=copy_link" class="ml-2 text-gray-400 hover:text-sky-400">
                    <i class="pi pi-instagram"></i>
                </a>
                <a href="https://www.youtube.com/@MSCTVada" class="ml-2 text-gray-400 hover:text-sky-400">
                    <i class="pi pi-youtube"></i>
                </a>
                <a href="https://www.tiktok.com/@muszaki_iskola_ada" class="ml-2 text-gray-400 hover:text-sky-400">
                    <i class="pi pi-tiktok"></i>
                </a>
                <!-- Dark/Light Mode Toggle -->
                <label class="swap swap-rotate ml-2 text-gray-400 hover:text-sky-400">
                    <!-- hidden checkbox controls the state -->
                    <input type="checkbox" @change="toggleDarkMode" :checked="isDarkMode" />
                    <!-- sun icon -->
                    <i class="swap-off pi pi-sun"></i>
                    <!-- moon icon -->
                    <i class="swap-on pi pi-moon"></i>
                </label>

                <a v-if="false" @click="random_theme" class="ml-2 text-gray-400 hover:text-sky-400">
                    <i class="pi pi-palette"></i>
                </a>
            </span>
        </div>
        <Cookie />
    </footer>
</template>

<script>
import Cookie from "@/components/Cookie.vue";
import moment from 'moment';
import vv from "../../package.json";
import { useTheme } from 'vuetify'
import themes from "@/themes/store.json";
import {useLoadingStore} from "@/stores/loading";

export default {
    name: 'Footer',
    components: {
        Cookie
    },
    data() {
        return {
            isDarkMode: false,
            themeprovider:useTheme() // Track the theme state
        };
    },
    setup()
    {
        //this.themeprovider=  ;
    },
    methods: {
        toggleDarkMode() {
            const loading = useLoadingStore();
            const htmlElement = document.documentElement;
            if (htmlElement.classList.contains("dark")) {
                htmlElement.classList.remove("dark");
                localStorage.setItem("theme", "light");
                this.isDarkMode = false;
                loading.setThemeSetting("light");
            } else {
                htmlElement.classList.add("dark");
                localStorage.setItem("theme", "dark");
                this.isDarkMode = true;
                loading.setThemeSetting("dark");
            }
           // this.$vuetify.theme.dark=this.isDarkMode;
           
           this.themeprovider.global.name.value= this.isDarkMode?"dark":"light";
        },
        random_theme() {
    let theme = "";
    let t=themes.themes; // Variable to hold the selected theme
    let k = t.length; // Get the length of the themes array
    
    console.log(k);
    if (k > 0) {
        // Randomly select a theme from the array
        let randomIndex = Math.floor(Math.random() * k);
        theme = t[randomIndex];
    } else {
        console.error("Themes array is empty");
        return;
    }

    // Apply the theme
    document.documentElement.setAttribute('data-theme', theme);
    
    // Persist the theme in localStorage
    localStorage.setItem('theme', theme);
}
    },
    mounted() {
        // Load the saved theme from localStorage on page load
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark") {
            this.isDarkMode = true;
           // console.log(document.documentElement.classList);
            document.documentElement.classList.add("dark");
        } else {
            this.isDarkMode = false;
           // console.log(document.documentElement.classList);
            document.documentElement.classList.remove("dark");
        }
    },
    computed: {
        year() {
            return moment().format('YYYY'); // Current year
        },
        _version() {
            return vv.version; // App version from package.json
        },
        
    }
}
</script>

<style scoped>
/* Add specific footer styles if needed */
</style>
