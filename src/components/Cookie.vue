<template>
    <div v-if="!isCook" class="flex justify-between items-center gap-2 backdrop-filter bg-opacity-50 bg-gray-300 backdrop-blur-lg px-4 py-2 fixed bottom-0 left-0 w-full">
    <p class="text-sm text-gray-700">
    {{ $t("cookie-text") }}
    </p>
    <button class="bg-sky-400 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded" @click="setCookie">
        {{$t("accept")}}
    </button>
</div>
</template>
<script lang="ts">
import {useCookieStore} from "@/stores/cookie";
export default {
methods:
{
    setCookie()
    {
        const cc=useCookieStore();
        cc.setCookie(true);
    }
},
computed:{
    isCook()
    {
        const cc=useCookieStore();
        return cc.isCookie;
    }
}
    
}
</script>