<template>
    <div v-if="video_id === ''" class="flex flex-wrap w-full mb-20 p-2 rounded">
      <div class="w-full mb-6 lg:mb-0">
        <h1 id="render_title" class="sm:text-3xl p-3 text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white">{{ title }}</h1>
        <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
      </div>
      <p v-if="show_date || admin" class="align-bottom ml-3 leading-relaxed text-white">
        <strong>{{ $t("date") }}</strong>: {{ rt_time(date) }} | <strong>{{ $t("last_modified") }}</strong>: {{ rt_time(last_modified) }}
      </p>
    </div>
  
    <video-background
      v-else
      :src="video_link"
      style="min-height: 200px;"
      class="flex flex-wrap w-full mb-20 p-2 rounded"
      overlay="linear-gradient(45deg,#2a4ae430,#0EA5E950)"
    >
      <div class="mt-3 w-full mb-6 lg:mb-0">
        <h1 class="sm:text-3xl p-3 text-2xl font-medium title-font mb-2 text-gray-100">{{ title }}</h1>
        <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
      </div>
      <p v-if="show_date || admin" class="align-bottom ml-3 leading-relaxed text-white">
        <strong>{{ $t("date") }}</strong>: {{ rt_time(date) }} | <strong>{{ $t("last_modified") }}</strong>: {{ rt_time(last_modified) }}
      </p>
    </video-background>
  </template>
  
  <script setup>
  defineProps(['video_id', 'video_link', 'title', 'date', 'last_modified', 'admin', 'show_date'])
  defineEmits()
  import { useLoadingStore } from '@/stores/loading';
  import moment from 'moment/min/moment-with-locales';
  
  const rt_time = (a) => {
    const local = useLoadingStore().language;
    moment.locale(local);
    return moment(a).format('LL');
  };
  </script>
  