<template>
    <section class="text-gray-600 body-font relative">
      <div class="container px-5 py-24 mx-auto flex sm:flex-nowrap flex-wrap">
        <!-- Map -->
        <div class="w-full bg-gray-300 rounded-lg overflow-hidden sm:mr-10 p-10 flex items-end justify-start relative m-5">
          <l-map
            class="sm:hidden md:block absolute inset-0 h-250"
            ref="map"
            style="filter: grayscale(1) contrast(1.5) opacity(0.4); min-height:250px; min-width: 300px;"
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
          <div class="bg-white relative flex flex-wrap py-6 rounded shadow-md">
            <div class="lg:w-1/2 px-6">
              <h2 class="title-font font-semibold text-gray-900 tracking-widest text-xs">{{ $t("address") }}</h2>
              <p class="mt-1">{{ $t("contact_address") }}, {{ $t("city") }} {{ $t("country") }}</p>
            </div>
            <div class="lg:w-1/2 px-6 mt-4 lg:mt-0">
              <h2 class="title-font font-semibold text-gray-900 tracking-widest text-xs">{{ $t("email") }}</h2>
              <a :href="'mailto:' + $t('contact_email')" class="text-sky-500 leading-relaxed">
                {{ $t("contact_email") }}
              </a>
              <h2 class="title-font font-semibold text-gray-900 tracking-widest text-xs mt-4">{{ $t("phone") }}</h2>
              <p class="leading-relaxed">{{ $t("phone1") }}</p>
            </div>
          </div>
        </div>
  
        <!-- Optional Contact Form -->
        <ContactUsPlugin class="m-5" v-if="showContactUs" />
      </div>
    </section>
  </template>
  
  <script setup>
  import "leaflet/dist/leaflet.css";
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
  