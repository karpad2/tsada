<template>
  <n-space vertical size="large">
  <NavBar />
  <n-layout>
    <router-view />
  </n-layout>
  <FooterTemplate />
</n-space>
</template>

<script>
import { NLayout,NSpace } from 'naive-ui'
import CookieLaw from 'vue-cookie-law';

export default {
  name: 'App',
  components: {
    CookieLaw,
    NLayout,
    NSpace
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
