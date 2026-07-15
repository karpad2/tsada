<template>
  <span class="notranslate-name" :data-n="name" :aria-label="name" role="text"></span>
</template>

<script setup lang="ts">
defineProps<{ name: string }>()
</script>

<style scoped>
.notranslate-name::before {
  content: attr(data-n);
}
</style>
