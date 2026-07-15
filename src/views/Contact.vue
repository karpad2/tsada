<template>
  <section class="text-gray-600 body-font relative">
    <div class="container px-5 py-16 mx-auto flex sm:flex-nowrap flex-wrap gap-6 justify-center">
      <!-- Map -->
      <div class="w-full glass rounded-2xl overflow-hidden sm:mr-4 p-8 flex items-end justify-start relative m-2" style="max-width: 650px;">
        <l-map
          class="sm:hidden md:block absolute inset-0 h-250"
          ref="map"
          style="filter: grayscale(0.6) contrast(1.2) opacity(0.45); min-height:250px; min-width: 300px;"
          :use-global-leaflet="false"
          v-model:zoom="zoom"
          :center="[45.790699127440185, 20.12923110967009]"
        >
          <l-tile-layer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            layer-type="base"
            name="OpenStreetMap"
          />
          <l-marker :lat-lng="[45.790699127440185, 20.12923110967009]">
            <l-popup>
              <p>{{ $t("school_name") }}</p>
            </l-popup>
          </l-marker>
        </l-map>

        <!-- Contact Info -->
        <div class="glass-strong relative flex flex-wrap py-6 rounded-2xl shadow-lg w-full">
          <div class="lg:w-1/2 px-6">
            <h2 class="title-font font-semibold text-sky-600 dark:text-sky-400 tracking-widest text-xs uppercase">{{ $t("address") }}</h2>
            <p class="mt-1 text-gray-800 dark:text-gray-200">{{ $t("contact_address") }}, {{ $t("city") }} {{ $t("country") }}</p>
          </div>
          <div class="lg:w-1/2 px-6 mt-4 lg:mt-0">
            <h2 class="title-font font-semibold text-sky-600 dark:text-sky-400 tracking-widest text-xs uppercase">{{ $t("email") }}</h2>
            <a :href="'mailto:' + $t('contact_email')" class="text-sky-500 hover:text-sky-400 leading-relaxed transition-colors">
              {{ $t("contact_email") }}
            </a>
            <h2 class="title-font font-semibold text-sky-600 dark:text-sky-400 tracking-widest text-xs mt-4 uppercase">{{ $t("phone") }}</h2>
            <p class="leading-relaxed text-gray-800 dark:text-gray-200">{{ $t("phone1") }}</p>
          </div>
        </div>
      </div>

      <!-- Optional Contact Form -->
      <ContactUsPlugin class="m-2" v-if="showContactUs" />
    </div>
  </section>
</template>

<script setup>
import "leaflet/dist/leaflet.css";
import { ref } from "vue";
import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";
import ContactUsPlugin from "@/components/ContactUsPlugin.vue";

defineProps({
  showContactUs: {
    type: Boolean,
    default: true,
  },
});

const zoom = ref(17);
</script>

<style scoped>
@media (min-width: 1024px) {
  .contact {
    min-height: 100vh;
    min-width: 60vh;
    margin: auto;
    align-items: center;
  }
}
</style>
