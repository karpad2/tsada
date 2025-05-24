<template>
    <div class="flex flex-col justify-center items-center text-center h-screen px-4">
      <h1 class="text-5xl font-bold text-red-600 mb-6">404 – {{ $t("error") }}</h1>
      <p class="text-gray-600 dark:text-gray-300 mb-8">{{ $t("not_found_message") || "Az oldal nem található." }}</p>
      <VBtn color="primary" @click="$router.go(-1)">
        {{ $t("goback") }}
      </VBtn>
    </div>
  </template>
  
  <script>
  export default {
    mounted() {
      document.title = "404 – " + this.$t("error");
    }
  };
  </script>
  