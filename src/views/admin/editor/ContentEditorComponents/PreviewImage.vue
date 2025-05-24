<template>
    <div class="xl:w-1/5 md:w-1/2 p-4 cursor-pointer">
      <div class="bg-slate-100/30 hover:bg-sky-600/30 dark:bg-slate-300/30 p-6 rounded-lg shadow">
        <img class="h-40 rounded w-full object-cover object-center mb-6 transition duration-300 ease-in-out" :src="img" alt="content" />
      </div>
    </div>
  </template>
  
  <script setup>
  defineProps({ img: String })
  </script>