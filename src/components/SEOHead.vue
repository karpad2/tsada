<template>
  <!-- This component doesn't render anything visible -->
</template>

<script lang="ts">
import { defineComponent, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSEO } from '@/composables/useSEO'
import { useLoadingStore } from '@/stores/loading'

export default defineComponent({
  name: 'SEOHead',
  props: {
    title: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    keywords: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'website'
    },
    pageType: {
      type: String,
      default: 'general'
    },
    data: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const route = useRoute()
    const { setSEO, generatePageSEO } = useSEO()
    const loadingStore = useLoadingStore()

    const updateSEO = () => {
      let seoData

      if (props.title || props.description) {
        // Use provided props
        seoData = {
          title: props.title,
          description: props.description,
          keywords: props.keywords,
          image: props.image,
          type: props.type,
          url: `https://tsada.edu.rs${route.path}`
        }
      } else {
        // Generate SEO based on page type
        seoData = generatePageSEO(props.pageType, {
          ...props.data,
          url: `https://tsada.edu.rs${route.path}`
        })
      }

      // Add language-specific adjustments
      const language = loadingStore.language
      if (language === 'hu') {
        seoData.locale = 'hu_HU'
        seoData.title = seoData.title?.replace('Tehnička Škola Ada', 'Ada Műszaki Iskola')
      } else if (language === 'en') {
        seoData.locale = 'en_US'
        seoData.title = seoData.title?.replace('Tehnička Škola Ada', 'Technical School Ada')
      }

      setSEO(seoData)
    }

    // Update SEO when props change
    watch(() => [props.title, props.description, props.pageType, props.data], updateSEO, { deep: true })

    // Update SEO when language changes
    watch(() => loadingStore.language, updateSEO)

    // Update SEO when route changes
    watch(() => route.path, updateSEO)

    // Initial SEO setup
    onMounted(updateSEO)

    return {}
  }
})
</script>