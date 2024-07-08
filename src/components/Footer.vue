<template>
    <!-- Footer -->
    <footer class="text-gray-400 bg-gray-900 body-font">
        <div class="container px-5 py-8 mx-auto flex items-center sm:flex-row flex-col">
            <a class="flex title-font font-medium items-center md:justify-start justify-center text-white">
                <img src="@a/tsada_logo.png" class="size-16 text-white p-2 bg-sky-300/50 rounded-full">
                <span class="ml-3 text-xl">{{ $t('school_name') }}</span>
            </a>
            <p class="text-sm text-gray-400 sm:ml-4 sm:pl-4 sm:border-l-2 sm:border-gray-800 sm:py-2 sm:mt-0 mt-4">©
                {{ year }}
                {{ $t('school_name') }}
                <a href="https://karpad2.github.io" class="text-gray-500 ml-1" target="_blank"
                    rel="noopener noreferrer">Designed by <span class="hover:text-sky-400">Kovács Árpád
                    </span></a>
                <p>App version: {{ _version }}</p>
            </p>
            <span class="inline-flex sm:ml-auto sm:mt-0 mt-4 justify-center sm:justify-start">
                <a  href="https://www.facebook.com/p/Msc-Kultura-100063626860924" class="ml-2 text-gray-400 hover:text-sky-400">
                    <i class="pi pi-facebook"></i>
                </a>
                
                <a href="https://www.instagram.com/_msc_ada_/?utm_medium=copy_link" class="ml-2 text-gray-400 hover:text-sky-400">
                    <i class="pi pi-instagram"></i>
                </a>

                <a href="https://www.youtube.com/@MSCTVada" class="ml-2 text-gray-400 hover:text-sky-400">
                    <i class="pi pi-youtube"></i>
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
import { version } from "vue";
export default {
    name: 'Footer',
    components:{
        Cookie
    },
    computed:{
        year(){
            return moment().format('YYYY');
        },
        _version()
        {
            return vv.version;
        }
    }
}
</script>