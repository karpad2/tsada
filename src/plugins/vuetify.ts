/**
 * Vuetify setup with tree-shaking via vite-plugin-vuetify.
 * Components are auto-imported on demand — do not import * as components.
 */
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.min.css'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export function createAppVuetify() {
  return createVuetify({
    theme: {
      defaultTheme: 'light',
      themes: {
        light: {
          colors: {
            primary: '#0EA5E9',
            secondary: '#0284c7'
          }
        },
        dark: {
          colors: {
            primary: '#38bdf8',
            secondary: '#0ea5e9'
          }
        }
      }
    },
    icons: {
      defaultSet: 'mdi',
      aliases,
      sets: { mdi }
    },
    defaults: {
      VBtn: { rounded: 'lg' },
      VCard: { rounded: 'lg' }
    }
  })
}
