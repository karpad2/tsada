<template>
    <AlbumViewer :caption="true" :id="l" />
</template>
<script setup>
import AlbumViewer from "@/components/AlbumViewer.vue";
import { useRoute } from 'vue-router';
const route = useRoute()
                                      
let l=route.params.id;


//console.log(l);
</script>