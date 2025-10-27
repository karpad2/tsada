<template>
  <main class="text-gray-900 dark:text-white transition-all" role="main" aria-label="Main school site content">
    <!-- Hero Section -->
    <LazyWrapper>
      <Hero />
    </LazyWrapper>

    <!-- Promotion Images -->
    <LazyWrapper>
      <PromotionImage />
    </LazyWrapper>

    <!-- Courses -->
    <LazyWrapper>
      <SlideModules mode="courses" />
    </LazyWrapper>

    <!-- News/Announcements -->
    <LazyWrapper>
      <SlideModules mode="news" />
    </LazyWrapper>

    <!-- Map -->
    <LazyWrapper>
      <Map />
    </LazyWrapper>

    <!-- Sponsors -->
    <LazyWrapper>
      <Sponsors mode="sponsors" />
    </LazyWrapper>

    <!-- Useful Links -->
    <LazyWrapper>
      <Sponsors mode="usefullinks" />
    </LazyWrapper>
  </main>
</template>

<script setup lang="ts">
// i18n
const { t } = useI18n()

// SEO metadata
useHead({
  title: t('school_name'),
  meta: [
    {
      name: 'description',
      content: 'Tehnička škola Ada - moderna stručna škola u Adi. Mašinstvo, elektrotehnika, građevinarstvo.'
    },
    {
      name: 'keywords',
      content: 'tehnička škola ada, stručno obrazovanje, mašinstvo, elektrotehnika'
    },
    {
      property: 'og:title',
      content: 'Tehnička Škola Ada'
    },
    {
      property: 'og:description',
      content: 'Moderna stručna škola u Adi'
    },
    {
      property: 'og:type',
      content: 'website'
    }
  ],
  link: [
    {
      rel: 'canonical',
      href: 'https://tsada.edu.rs/'
    }
  ]
})

// Analytics tracking
onMounted(() => {
  if (process.client && window.gtag) {
    window.gtag('config', 'G-FZYC1503VB', {
      page_path: '/'
    })
  }
})
</script>

<style scoped>
main {
  min-height: 100vh;
  padding: 0;
}
</style>
