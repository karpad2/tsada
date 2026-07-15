<template>
  <div
    v-if="!isCook"
    class="cookie-bar glass-strong fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:max-w-2xl z-50 flex flex-col sm:flex-row justify-between items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl"
  >
    <p class="text-sm text-gray-700 dark:text-gray-200 text-center sm:text-left">
      {{ $t("cookie-text") }}
    </p>
    <button
      class="glass-btn shrink-0 text-white font-semibold py-2.5 px-6 rounded-full"
      @click="setCookie"
    >
      {{ $t("accept") }}
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

<style scoped>
.cookie-bar {
  animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (min-width: 768px) {
  .cookie-bar {
    animation: slideUpCenter 0.4s ease-out;
  }

  @keyframes slideUpCenter {
    from {
      opacity: 0;
      transform: translate(-50%, 20px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
}
</style>
