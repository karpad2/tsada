<template>
    <AlbumViewer :caption="true" :id="albumId" :key="albumId" />
</template>
<script setup>
import AlbumViewer from "@/components/AlbumViewer.vue";
import { useRoute } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();
const albumId = computed(() => {
  const id = route.params.id;
  return Array.isArray(id) ? id[0] : (id || '');
});
</script>
