import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLoadingStore } from '@/stores/loading';

interface LanguageItem {
  name: string;
  code: string;
  country: string;
}

export function useLanguage() {
  const loadingStore = useLoadingStore();

  const languages: LanguageItem[] = [
    { name: 'Српски', code: 'sr', country: 'srb' },
    { name: 'Magyar', code: 'hu', country: 'hun' },
    { name: 'English', code: 'en', country: 'gbr' },
  ];

  const currentLanguage = computed(() => {
    return languages.find((l) => l.code === loadingStore.language) || languages[0];
  });

  const changeLanguage = async (code: string): Promise<void> => {
    // Store-ban már be van állítva a komponensben
    // Ez a függvény csak a cache-t törli

    // PWA cache törlés és frissítés
    try {
      if ('serviceWorker' in navigator && 'caches' in window) {
        const cacheNames = await caches.keys();
        const apiCaches = cacheNames.filter(
          (name) => name.includes('api-cache') || name.includes('dynamic-cache')
        );

        await Promise.all(apiCaches.map((cacheName) => caches.delete(cacheName)));
      }
    } catch (error) {
      console.error('Error clearing cache during language change:', error);
    }
  };

  return {
    languages,
    currentLanguage,
    changeLanguage,
  };
}
