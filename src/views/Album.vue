<template>
    <AlbumViewer :caption="true" :id="albumId" :key="albumId" />
</template>
<script setup>
import AlbumViewer from "@/components/AlbumViewer.vue";
import { useRoute } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();
const albumId = computed(() => route.params.id);
</script>
