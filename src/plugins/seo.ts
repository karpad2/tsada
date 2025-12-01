import type { App } from 'vue'

export interface SEOPlugin {
  setSEO: (data: any) => void
  generatePageSEO: (type: string, data?: any) => any
}

export default {
  install(app: App) {
    // The SEO plugin is installed but composables should be used directly in components
    // This is just a placeholder for future SEO functionality
    app.config.globalProperties.$seo = {
      setSEO: () => {},
      generatePageSEO: () => {}
    }
  }
}