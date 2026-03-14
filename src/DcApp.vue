<template>
  <div class="dc-standalone-app">
    <!-- Toast notifications -->
    <notifications position="top right" />

    <!-- DC Chat fills the entire window -->
    <DcChat />
  </div>
</template>

<script setup lang="ts">
import DcChat from '@/views/DcChat.vue'
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #313338;
  font-family: 'Roboto', sans-serif;
}

#app {
  width: 100%;
  height: 100%;
}

.dc-standalone-app {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* DcChat needs to fill the full height in standalone mode */
.dc-standalone-app .dc-wrapper {
  flex: 1;
  height: 100vh;
}
</style>
