<template>
    <v-lazy :options="{ threshold: 0.5 }" transition="fade-transition">
      <slot />
    </v-lazy>
  </template>
  
  <script setup>
  // Semmi extra logika nem szükséges
  </script>
  
  <style scoped>
  /* Itt adhatsz hozzá fallback vagy skeleton animációt, ha kell */
  </style>
  