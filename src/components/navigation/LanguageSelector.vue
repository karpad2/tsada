<template>
  <div class="language-selector">
    <div class="dropdown dropdown-hover dropdown-end">
      <div
        tabindex="0"
        role="button"
        class="btn btn-ghost btn-circle"
        :title="$t('change_language')"
        @click="onLanguageMenuClick"
      >
        <div class="flag-container">
          <img
            :src="getFlagUrl(currentFlag)"
            :alt="currentLanguageName"
            class="w-6 h-6 rounded-full object-cover"
            @error="onFlagError"
          />
        </div>
      </div>

      <ul
        tabindex="0"
        class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-40"
      >
        <li v-for="language in languages" :key="language.code">
          <a
            @click="changeLanguage(language.code)"
            class="flex items-center gap-3 hover:bg-base-200"
            :class="{ 'bg-base-200': language.code === currentLanguage }"
          >
            <img
              :src="getFlagUrl(language.country)"
              :alt="language.name"
              class="w-5 h-5 rounded-full object-cover"
              @error="onFlagError"
            />
            <span class="text-sm">{{ language.name }}</span>
            <i
              v-if="language.code === currentLanguage"
              class="pi pi-check text-success ml-auto"
            ></i>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, type PropType } from 'vue'
import { trackUserInteraction, trackLanguageChange } from '@/utils/analytics'

export interface Language {
  code: string
  name: string
  country: string
  flag?: string
}

export default defineComponent({
  name: 'LanguageSelector',
  props: {
    languages: {
      type: Array as PropType<Language[]>,
      default: () => [
        { code: 'rs', name: 'Српски', country: 'rs' },
        { code: 'hu', name: 'Magyar', country: 'hu' },
        { code: 'en', name: 'English', country: 'gb' }
      ]
    },
    currentLanguage: {
      type: String,
      default: 'rs'
    },
    currentFlag: {
      type: String,
      default: 'rs'
    }
  },
  emits: ['language-change'],
  setup(props) {
    const currentLanguageName = computed(() => {
      const lang = props.languages.find(l => l.code === props.currentLanguage)
      return lang?.name || 'Language'
    })

    return {
      currentLanguageName
    }
  },
  methods: {
    onLanguageMenuClick() {
      trackUserInteraction('language_menu_open', 'i18n', {
        current_language: this.currentLanguage
      })
    },

    changeLanguage(languageCode: string) {
      if (languageCode !== this.currentLanguage) {
        trackLanguageChange(this.currentLanguage, languageCode)
        this.$emit('language-change', languageCode)
      }
    },

    getFlagUrl(countryCode: string): string {
      // Use a flag icon service or local flag assets
      // For now, using a simple fallback approach
      try {
        return new URL(`/src/assets/flags/${countryCode}.png`, import.meta.url).href
      } catch {
        return `https://flagicons.lipis.dev/flags/4x3/${countryCode}.svg`
      }
    },

    onFlagError(event: Event) {
      const img = event.target as HTMLImageElement
      // Fallback to a default flag or emoji
      img.src = `https://flagicons.lipis.dev/flags/4x3/${img.alt?.toLowerCase() || 'un'}.svg`
    }
  }
})
</script>

<style scoped>
.language-selector .flag-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.language-selector .dropdown-content {
  min-width: 160px;
}

.language-selector .dropdown-content li a {
  padding: 8px 12px;
  transition: background-color 0.2s ease;
}

.language-selector img {
  flex-shrink: 0;
}
</style>