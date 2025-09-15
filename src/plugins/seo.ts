import type { App } from 'vue'
import { useSEO } from '@/composables/useSEO'

export interface SEOPlugin {
  setSEO: (data: any) => void
  generatePageSEO: (type: string, data?: any) => any
}

export default {
  install(app: App) {
    const { setSEO, generatePageSEO } = useSEO()

    // Global SEO methods
    app.config.globalProperties.$seo = {
      setSEO,
      generatePageSEO
    }

    // Provide SEO methods for composition API
    app.provide('seo', {
      setSEO,
      generatePageSEO
    })
  }
}