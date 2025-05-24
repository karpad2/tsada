<template>
    <div>
      <v-switch
        :model-value="album_flag"
        @update:model-value="val => emit('update:album_flag', val)"
        @change="save"
        :label="$t('album_flag')"
      />
  
      <div v-if="album_flag">
        <v-btn class="m-5" @click="gallery_change">
          {{ $t('create_a_new_album') }}
        </v-btn>
  
        <v-select
          :items="galleries"
          :model-value="gallery_id"
          @update:model-value="val => emit('update:gallery_id', val)"
          :label="$t('gallery')"
          item-value="id"
          item-text="title"
          @update:modelValue="g_save"
        />
  
        <AlbumViewer v-if="_update" :caption="false" :id="gallery_id" />
      </div>
    </div>
  </template>
  
  <script setup>
  import AlbumViewer from '@/components/AlbumViewer.vue'
  
  const props = defineProps({
    album_flag: Boolean,
    gallery_id: String,
    galleries: Array,
    save: Function,
    gallery_change: Function,
    g_save: Function,
    _update: Boolean
  })
  
  const emit = defineEmits([
    'update:album_flag',
    'update:gallery_id'
  ])
  </script>
  