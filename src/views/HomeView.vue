<template>
  <main
    class=" text-gray-900 dark:text-white transition-all"
    role="main"
    aria-label="Main school site content"
  >
    <LazyWrapper><Hero /></LazyWrapper>
    <LazyWrapper><PromotionImage /></LazyWrapper>
    <LazyWrapper><SlideModules mode="courses" /></LazyWrapper>
    <LazyWrapper><SlideModules mode="news" /></LazyWrapper>
    <LazyWrapper><Map /></LazyWrapper>
    <LazyWrapper><Sponsors mode="sponsors" /></LazyWrapper>
    <LazyWrapper><Sponsors mode="usefullinks" /></LazyWrapper>
  </main>
</template>

<script setup>
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

// Lazy load wrapper
import LazyWrapper from '@/components/LazyWrapper.vue'

// Fő komponensek
import Hero from '@/components/Hero.vue'
import PromotionImage from '@/components/PromotionImage.vue'
import SlideModules from '@/components/SlideModules.vue'
import Map from '@/components/Map.vue'
import Sponsors from '@/components/Sponsors.vue'

// i18n kezelés
const { t } = useI18n()

// Oldalcím beállítása
onMounted(() => {
  document.title = t('school_name')
})
</script>

<style scoped>
main {
  min-height: 100vh;
  padding: 0;
}
</style>
