import { config } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'

// Mock i18n
const i18n = createI18n({
  locale: 'hu',
  fallbackLocale: 'en',
  messages: {
    hu: {
      test: 'teszt',
      school_name: 'TSADA',
      role_not_specified: 'Szerep nincs megadva'
    },
    en: {
      test: 'test',
      school_name: 'TSADA',
      role_not_specified: 'Role not specified'
    },
    rs: {
      test: 'тест',
      school_name: 'TSADA',
      role_not_specified: 'Улога није наведена'
    }
  }
})

// Global test configuration
config.global = {
  plugins: [i18n, createPinia()],
  mocks: {
    $t: (key: string) => key,
    $i18n: i18n.global
  }
}

// Mock window.gtag for analytics
global.window = global.window || {}
global.window.gtag = vi.fn()

// Mock Appwrite
vi.mock('@/appwrite', () => ({
  appw: {},
  config: {
    website_db: 'test_db',
    school_board: 'test_board'
  },
  appwriteService: {
    checkAuth: vi.fn().mockResolvedValue(true)
  }
}))