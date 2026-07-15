<template>
  <div class="page-shell flex flex-col justify-center items-center text-center px-4 py-20">
    <div class="page-panel !min-h-0 max-w-lg w-full page-state">
      <div class="w-16 h-16 mx-auto mb-6 rounded-full bg-sky-500/15 border border-sky-400/30 flex items-center justify-center">
        <span class="text-2xl font-bold text-sky-600 dark:text-sky-400">404</span>
      </div>
      <h1 class="page-state-title text-3xl mb-3">{{ $t("error") }}</h1>
      <p class="page-state-text mb-8">{{ $t("not_found_message") || "Az oldal nem található." }}</p>
      <button class="glass-btn px-8 py-3 text-white font-semibold rounded-full" @click="$router.go(-1)">
        {{ $t("goback") }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  mounted() {
    document.title = "404 – " + this.$t("error");
  }
};
</script>
