<template>
    <div>
      <v-switch :label="$t(labelSwitch)" v-model="enabled" @change="$emit('save')" class="mb-4" />
  
      <div v-if="enabled">
        <v-text-field
          v-model="modelTitle"
          :counter="100"
          :label="$t(labelTitle)"
          @change="$emit('save')"
          hide-details
        ></v-text-field>
  
        <ckeditor v-model="modelContent" @input="$emit('save')" />
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  
  const props = defineProps({
    lang: { type: String, required: true },
    title: String,
    content: String,
  });
  const emit = defineEmits(['update:title', 'update:content', 'save']);
  
  const { t } = useI18n();
  
  const enabled = ref(true);
  
  const modelTitle = computed({
    get: () => props.title,
    set: (val: string) => emit('update:title', val),
  });
  
  const modelContent = computed({
    get: () => props.content,
    set: (val: string) => emit('update:content', val),
  });
  
  const labelSwitch = computed(() => {
    if (props.lang === 'rs') return 'srb';
    if (props.lang === 'hu') return 'hu';
    return 'en';
  });
  
  const labelTitle = computed(() => {
    if (props.lang === 'rs') return 'srb_title';
    if (props.lang === 'hu') return 'hu_title';
    return 'en_title';
  });
  </script>
  
  <style scoped>
  </style>