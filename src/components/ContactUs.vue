<template>
    <div class="container px-5 py-24 mx-auto flex flex-wrap">
        <div class="lg:w-1/3 md:w-1/2 bg-slate-100 flex flex-col md:ml-auto w-full md:py-8 mt-8 md:mt-0">
       
       <h2 class="text-gray-900 text-lg mb-1 font-medium title-font">{{ $t('contactus') }}</h2>
       <p class="leading-relaxed mb-5 text-gray-600">{{ $t('contactustext')  }}</p>
       <p class="leading-relaxed mb-5 text-gray-600">{{ $t('address')  }}:{{ convertifserbian(contact.address) }}</p>
       <p class="leading-relaxed mb-5 text-gray-600">{{ convertifserbian(contact.city) }},{{ convertifserbian(contact.country) }} </p>
       <p class="leading-relaxed mb-5 text-gray-600">{{ $t('phone')  }}:{{ contact.phone1 }}, {{ contact.phone2 }}</p>
       <p class="leading-relaxed mb-5 text-gray-600">{{ $t('email')  }}:{{ contact.email }}</p>
       <p class="leading-relaxed mb-5 text-gray-600">{{ $t('website')  }}:{{ contact.website }}</p>
       
   </div>
</div>
</template>
<script setup>
import contact from "@/content/contact.json";
import { convertifserbian}  from '@/lang';
</script>