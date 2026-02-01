<template>
    <v-lazy :options="{ threshold: 0.1, rootMargin: '200px' }" transition="fade-transition" min-height="50">
      <slot />
    </v-lazy>
  </template>

  <script setup>
  // v-lazy wrapper - alacsony threshold + rootMargin a megbízható betöltéshez
  </script>

  <style scoped>
  /* Itt adhatsz hozzá fallback vagy skeleton animációt, ha kell */
  </style>
  