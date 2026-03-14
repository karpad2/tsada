<template>
  <div class="heist-wrapper">
    <button class="back-btn" @click="goBack" title="Vissza">✕</button>
    <HeistApp />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import HeistApp from '@/web/src/App.vue'

const router = useRouter()

function goBack() {
  router.push('/')
}

// Prevent the main app's scroll/navigation while playing
onMounted(() => {
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.heist-wrapper {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #000;
  width: 100vw;
  height: 100vh;
}

.back-btn {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 10001;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  transition: background 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
