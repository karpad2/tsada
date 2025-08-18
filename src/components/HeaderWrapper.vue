<!-- HeaderWrapper.vue -->
<template>
    <header
      v-if="reload"
      :class="{ mobile_force: style_computed_for_mobile }"
      style="z-index: 200"
      class="navbar transition-all delay-150 pt-5 text-gray-600 backdrop-filter bg-opacity-50 bg-gray-300 dark:bg-gray-900 backdrop-blur-lg body-font sticky top-0"
      id="home"
    >
      <div
        :class="[{ 'flex-col': mobile_view }, { 'flex-row': !mobile_view }]"
        class="container mx-auto flex flex-wrap items-center"
      >
        <HeaderBrand :mobile_view="mobile_view" :menu_opened="menu_opened" @toggleMenu="menuopener" :erasmusflag="erasmusflag" />
        <NavigationMenu
          v-if="mobile_mode"
          :mobile_view="mobile_view"
          :tablet_mode="tablet_view"
          :abouts="abouts"
          :_students="_students"
          :_erasmus="_erasmus"
          :languages="languages"
          :lang="lang"
          :isLoggedin="isLoggedin"
          :erasmus_apply_on="erasmus_apply_on"
          :erasmus_list="erasmus_list"
          :reload="reload"
          @changeLanguage="changeLanguage"
          @logout="logout"
        />
      </div>
    </header>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import HeaderBrand from './HeaderBrand.vue'
  import NavigationMenu from './NavigationMenu.vue'
  </script>
  
  <style>
  .mobile_force {
    max-height: 80px;
  }
  </style>
  