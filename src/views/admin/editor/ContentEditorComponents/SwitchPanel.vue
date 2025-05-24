<template>
    <div>
      <v-switch
        :model-value="visible"
        @update:model-value="val => emit('update:visible', val)"
        :label="$t('visible')"
      />
  
      <v-switch
        :model-value="notNews"
        @update:model-value="val => emit('update:notNews', val)"
        :label="$t('not_news')"
      />
  
      <v-switch
        :model-value="showDate"
        @update:model-value="val => emit('update:showDate', val)"
        :label="$t('show_date')"
      />
  
      <v-btn class="m-5" @click="emit('save')">{{ $t('save') }}</v-btn>
      <v-btn class="m-5" @click="emit('delete')">{{ $t('delete') }}</v-btn>
      <v-btn class="m-5" @click="emit('share')">{{ $t('fb_share') }}</v-btn>
    </div>
  </template>
  
  <script setup>
  const props = defineProps({
    visible: Boolean,
    notNews: Boolean,
    showDate: Boolean
  })
  
  const emit = defineEmits([
    'update:visible',
    'update:notNews',
    'update:showDate',
    'save',
    'delete',
    'share'
  ])
  </script>
  