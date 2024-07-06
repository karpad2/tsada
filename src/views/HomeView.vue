<script setup>
import { ref, computed, nextTick } from 'vue'
import SlideModules from '@/components/SlideModules.vue';
import Hero from '@/components/Hero.vue';
import Map from '@/components/Map.vue'
import UsefulLinks from '@/components/UsefulLinks.vue'
import NewsBanner from '@/components/NewsBanner.vue';
import Sponsors from '@/components/Sponsors.vue';
import PromotionImage from '@/components/PromotionImage.vue';
import { useI18n } from 'vue-i18n';

//const { t } = useI18n();

//document.title=t("msc");


</script>

<template>
  <main class=" ">
    <Hero />
    <PromotionImage />

    <SlideModules mode="courses"  />
    <SlideModules mode="news"  />
    <Map />
    <Sponsors v-if="flag" />
    <UsefulLinks v-if="flag"/>
  </main>
</template>
