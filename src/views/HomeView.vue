<script >
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
export default{
  components:{
    Hero,
    PromotionImage,
    SlideModules,
    Map,
    Sponsors,
    UsefulLinks
  },
  mounted()
  {
    document.title=this.$t("school_name");
  }
}
//document.title=t("msc");


</script>

<template>
  <main class=" ">
    <Hero />
    <PromotionImage />

    <SlideModules mode="courses"  />
    <SlideModules mode="news"  />
    <Map />
    <Sponsors  />
    <UsefulLinks />
  </main>
</template>
