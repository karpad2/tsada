<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-16">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        Tehnička Škola Ada
      </h1>
      <p class="text-xl text-gray-600 dark:text-gray-300">
        Nuxt 3 SSR működik! 🎉
      </p>

      <div class="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 class="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          Technológia Stack:
        </h2>
        <ul class="space-y-2 text-gray-700 dark:text-gray-300">
          <li>✅ Nuxt 4.2.0 (SSR)</li>
          <li>✅ Vue 3.5.22</li>
          <li>✅ Vite 5.4.11</li>
          <li>✅ Tailwind CSS</li>
          <li>✅ Pinia State Management</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Kezdőlap'
})
</script>
