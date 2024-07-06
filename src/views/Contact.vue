<template>
  <!-- Contact Us -->
  <section class="text-gray-600 body-font relative">
     <div class="container px-5 py-24 mx-auto flex sm:flex-nowrap flex-wrap">
         <div
             class="w-full bg-gray-300 rounded-lg overflow-hidden sm:mr-10 p-10 flex items-end justify-start relative m-5">
             <!-- leaflet-->
             <l-map class="sm:hidden md:block absolute inset-0 h-250"  ref="map" style="filter: grayscale(1) contrast(1.5) opacity(0.4); min-height:250px; min-width: 300px;"  :use-global-leaflet="false" v-model:zoom="zoom" :center="[45.790699127440185, 20.12923110967009]">
                 <l-tile-layer
                     url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                     layer-type="base"
                     name="OpenStreetMap"
                 ></l-tile-layer>
                 <l-marker :lat-lng="[45.790699127440185, 20.12923110967009]">
                     <l-popup>
                         <p>{{ $t('school_name') }}</p>
                     </l-popup>
                 </l-marker> <!-- Add this line -->
             </l-map>
             <div class="bg-white relative flex flex-wrap py-6 rounded shadow-md">
                 <div class="lg:w-1/2 px-6">
                     <h2 class="title-font font-semibold text-gray-900 tracking-widest text-xs">{{ $t('address') }}</h2>
                     <p class="mt-1">{{ contact.address }}, {{ contact.city }} {{ contact.country }}</p>
                 </div>
                 <div class="lg:w-1/2 px-6 mt-4 lg:mt-0">
                     <h2 class="title-font font-semibold text-gray-900 tracking-widest text-xs">{{ $t('email') }}</h2>
                     <a :href="'mailto:'+contact.email" class="text-sky-500 leading-relaxed">{{ contact.email }}</a>
                     <h2 class="title-font font-semibold text-gray-900 tracking-widest text-xs mt-4">{{ $t('phone') }}</h2>
                     <p class="leading-relaxed">{{ contact.phone1 }}</p>
                 </div>
             </div>
         </div>
         <ContactUsPlugin class="m-5" v-if="showContactUs"/>
         <ContactUs v-if="false" />
     </div>
 </section>
</template>


<script>
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet"; // Add LPopup import
import con from "@/content/contact.json";
import ContactUsPlugin from "@/components/ContactUsPlugin.vue";
import ContactUs from "@/components/ContactUs.vue";



export default {
components: {
 LMap,
 LTileLayer,
 LMarker, // Add LMarker component
 LPopup, // Add LPopup component
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
},
data() {
 return {
   zoom: 17,
   contact:{}
 };
},
};
</script>

<style>
@media (min-width: 1024px) {
.contact {
 min-height: 100vh;
 min-width: 60vh;
 margin: auto;
 align-items: center;
}
}
</style>