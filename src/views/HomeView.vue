<script >
import { ref, computed, nextTick } from 'vue'
import SlideModules from '@/components/SlideModules.vue';
import Hero from '@/components/Hero.vue';
import Map from '@/components/Map.vue'


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
    <v-lazy
      :options="{'threshold':0.5}"
      transition="fade-transition"
    >
    <Hero />
  </v-lazy>
    <v-lazy
      :options="{'threshold':0.5}"
      transition="fade-transition"
    >
    <PromotionImage  />
  </v-lazy>
    <v-lazy
      :options="{'threshold':0.5}"
      transition="fade-transition"
    >
    <SlideModules  mode="courses"  />
  </v-lazy>
  <v-lazy
      :options="{'threshold':0.5}"
      transition="fade-transition"
    >
    <SlideModules mode="news"  />
  </v-lazy>
  <v-lazy
      :options="{'threshold':0.5}"
      transition="fade-transition"
    >
    <Map />
  </v-lazy>
  <v-lazy
      :options="{'threshold':0.5}"
      transition="fade-transition"
    >
    <Sponsors  mode="sponsors" />
  </v-lazy>
  <v-lazy
      :options="{'threshold':0.5}"
      transition="fade-transition"
    >
    <Sponsors  mode="usefullinks" />
  </v-lazy>
  </main>
</template>
