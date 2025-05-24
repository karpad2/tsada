<template>
    <div class="w-3/4 m-auto pb-8" style="height: 100vh;">
      <div v-if="loading" class="flex justify-center items-center h-full text-xl text-gray-500 dark:text-gray-200">
        {{ $t('loading') }}...
      </div>
      <iframe v-else class="h-full w-full" :src="pdfFile" frameborder="0"></iframe>
    </div>
  </template>
  
  <script setup>
  import { onMounted, ref } from 'vue'
  import { Storage } from 'appwrite'
  import { appw, config as appwriteConfig } from '@/appwrite'
  import { useRoute } from 'vue-router'
  
  const pdfFile = ref('')
  const loading = ref(true)
  const route = useRoute()
  
  onMounted(async () => {
    console.log('Loading document:', route.params.id)
  
    try {
      const storage = new Storage(appw)
      const file = await storage.getFileView(appwriteConfig.documents_storage, route.params.id)
      pdfFile.value = file.href
      console.log('Loaded PDF URL:', file.href)
    } catch (error) {
      console.error('Failed to load PDF:', error)
    } finally {
      loading.value = false
    }
  })
  </script>
  
  <style scoped>
  #openFile,
  #secondaryToolbarToggle,
  #viewBookmark,
  #viewFind {
    display: none;
  }
  
  #toolbarViewer {
    z-index: 1;
  }
  </style>
  