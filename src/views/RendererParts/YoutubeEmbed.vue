<template>
    <div v-if="yt_video">
      <iframe class="mx-auto" width="560" height="315" :src="yt_video_link" title="YouTube video player" frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
    </div>
  </template>
  
  <script setup>
  const props = defineProps(['yt_video']);
  const yt_video_link = computed(() => {
    const id = props.yt_video.split('?v=')[1];
    return `https://www.youtube.com/embed/${id}`;
  });
  </script>
  