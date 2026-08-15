<template>
  <!-- Contact Us -->
  <section class="relative">
    <div class="container px-5 py-16 mx-auto flex max-sm:flex-col flex-wrap md:flex-row gap-6 justify-center">
      <div
        class="max-sm:min-w-full mx-auto xl:w-1/2 md:w-full lg:w-1/2 glass rounded-2xl overflow-hidden sm:mr-4 p-8 items-end justify-start relative flex flex-wrap"
        style="max-width: 650px;"
      >
        <!-- leaflet-->
        <l-map
          v-if="mapReady"
          class="absolute inset-0"
          ref="map"
          style="filter: grayscale(0.6) contrast(1.2) opacity(0.45); min-height:250px; width: 100%; height: 100%;"
          :use-global-leaflet="false"
          v-model:zoom="zoom"
          :center="[45.790699127440185, 20.12923110967009]"
        >
          <l-tile-layer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            layer-type="base"
            name="OpenStreetMap"
          ></l-tile-layer>
          <l-marker :lat-lng="[45.790699127440185, 20.12923110967009]">
            <l-popup>
              <p>{{ $t('school_name') }}</p>
            </l-popup>
          </l-marker>
        </l-map>
        <div class="glass-strong relative flex flex-wrap py-6 rounded-2xl shadow-lg w-full">
          <div class="lg:w-1/2 px-6">
            <h2 class="title-font font-semibold text-sky-600 dark:text-sky-400 tracking-widest text-xs uppercase">{{ $t('address') }}</h2>
            <p class="mt-1 text-gray-800 dark:text-gray-200"><span>{{ $t("contact_address")}},</span> {{ $t("city") }} {{ $t("country") }}</p>
          </div>
          <div class="lg:w-1/2 px-6 mt-4 lg:mt-0">
            <h2 class="title-font font-semibold text-sky-600 dark:text-sky-400 tracking-widest text-xs uppercase">{{ $t('email') }}</h2>
            <a :href="'mailto:'+contact.email" class="text-sky-500 hover:text-sky-400 leading-relaxed transition-colors">{{contact.email}}</a>
            <h2 class="title-font font-semibold text-sky-600 dark:text-sky-400 tracking-widest text-xs mt-4 uppercase">{{ $t('phone') }}</h2>
            <p class="leading-relaxed text-gray-800 dark:text-gray-200">{{ $t("phone1") }}</p>
          </div>
        </div>
      </div>
      <ContactUsPlugin style="max-width: 650px;" class="max-sm:w-full w-1/2" v-if="showContactUs"/>
    </div>
  </section>
</template>


<script>
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";
import con from "@/content/contact.json";
import ContactUsPlugin from "@/components/ContactUsPlugin.vue";
import ContactUs from "@/components/ContactUs.vue";



export default {
 components: {
   LMap,
   LTileLayer,
   LMarker,
   LPopup,
   ContactUsPlugin,
   ContactUs
},
props: {
   showContactUs: {
       type: Boolean,
       default: true
   }
 },
 mounted()
 {
   this.contact = con;
   this.$nextTick(() => {
     this.mapReady = true;
   });
 },
 data() {
   return {
     zoom: 17,
     contact: {},
     mapReady: false
   };
 },
};
</script>

<style>
#leaflet-attribution-flag {
   display: none;
}
</style>
