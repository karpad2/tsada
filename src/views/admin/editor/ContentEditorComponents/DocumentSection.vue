<template>
    <div>
      <v-switch
        :model-value="documents_flag"
        @update:model-value="val => emit('update:documents_flag', val)"
        :label="$t('documents_flag')"
      />
      <div v-if="documents_flag">
        <DocLister :_id="id" />
        <v-btn @click="new_stuff()" class="m-5">
          {{ $t('add_new_document_in_that_category') }}
        </v-btn>
      </div>
    </div>
  </template>
  
  <script setup>
  import DocLister from '@/components/DocLister.vue'
  
  const props = defineProps({
    id: String,
    documents_flag: Boolean
  })
  
  const emit = defineEmits(['update:documents_flag'])
  </script>
  