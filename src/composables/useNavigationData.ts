import { ref, computed } from 'vue';
import { Databases, Query } from 'appwrite';
import { appw, config } from '@/appwrite';
import { convertifserbian } from '@/lang';
import { useLoadingStore } from '@/stores/loading';

interface MenuItem {
  name?: string;
  title?: string;
  id: string;
}

interface ErasmusSettings {
  erasmus_list: boolean;
  erasmus_apply_on: boolean;
}

// Singleton cache for navigation data
const navigationCache = {
  abouts: ref<MenuItem[]>([]),
  erasmus: ref<MenuItem[]>([]),
  students: ref<MenuItem[]>([]),
  erasmusSettings: ref<ErasmusSettings>({ erasmus_list: false, erasmus_apply_on: false }),
  lastFetch: 0,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
};

export function useNavigationData() {
  const loadingStore = useLoadingStore();
  const isLoading = ref(false);

  const getLocalizedTitle = (element: any): string => {
    const lang = loadingStore.language;

    if (lang === 'en') return element.title_en || element.category_name_en || '';
    if (lang === 'hu') return element.title_hu || element.category_name_hu || '';
    if (lang === 'rs' || lang === 'sr') {
      return convertifserbian(element.title_rs || element.category_name_rs || '');
    }
    return '';
  };

  const shouldRefreshCache = computed(() => {
    return Date.now() - navigationCache.lastFetch > navigationCache.cacheTimeout;
  });

  const fetchAbouts = async (): Promise<void> => {
    try {
      const database = new Databases(appw);
      const result = await database.listDocuments(
        config.website_db,
        config.about_us_db,
        [
          Query.equal('show_at_the_header_from_about', true),
          Query.select(['title_hu', 'title_en', 'title_rs', '$id']),
          Query.orderAsc('sorrend'),
        ]
      );

      navigationCache.abouts.value = result.documents
        .map((element) => ({
          title: getLocalizedTitle(element),
          id: element.$id,
        }))
        .filter((item) => item.title);
    } catch (error) {
      console.error('Error fetching abouts:', error);
    }
  };

  const fetchErasmus = async (): Promise<void> => {
    try {
      const database = new Databases(appw);
      const result = await database.listDocuments(
        config.website_db,
        config.about_us_db,
        [
          Query.equal('type', 'erasmus'),
          Query.select(['title_hu', 'title_en', 'title_rs', '$id']),
        ]
      );

      navigationCache.erasmus.value = result.documents
        .map((element) => ({
          name: getLocalizedTitle(element),
          id: element.$id,
        }))
        .filter((item) => item.name);
    } catch (error) {
      console.error('Error fetching Erasmus data:', error);
    }
  };

  const fetchStudents = async (): Promise<void> => {
    try {
      const database = new Databases(appw);
      const result = await database.listDocuments(
        config.website_db,
        config.about_us_db,
        [
          Query.equal('type', 'students'),
          Query.select(['title_hu', 'title_en', 'title_rs', '$id']),
        ]
      );

      navigationCache.students.value = result.documents
        .map((element) => ({
          name: getLocalizedTitle(element),
          id: element.$id,
        }))
        .filter((item) => item.name);
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  const fetchErasmusSettings = async (): Promise<void> => {
    try {
      const database = new Databases(appw);
      const [listSetting, applySetting] = await Promise.all([
        database.getDocument(config.website_db, config.general_settings, 'erasmus_list'),
        database.getDocument(config.website_db, config.general_settings, 'erasmus_apply_on'),
      ]);

      navigationCache.erasmusSettings.value = {
        erasmus_list: listSetting.setting_status,
        erasmus_apply_on: applySetting.setting_status,
      };
    } catch (error) {
      console.error('Error fetching Erasmus settings:', error);
    }
  };

  const loadNavigationData = async (force = false): Promise<void> => {
    if (!force && !shouldRefreshCache.value && navigationCache.lastFetch > 0) {
      return; // Use cached data
    }

    isLoading.value = true;
    try {
      await Promise.all([
        fetchAbouts(),
        fetchErasmus(),
        fetchStudents(),
        fetchErasmusSettings(),
      ]);
      navigationCache.lastFetch = Date.now();
    } catch (error) {
      console.error('Error loading navigation data:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const clearCache = (): void => {
    navigationCache.lastFetch = 0;
    navigationCache.abouts.value = [];
    navigationCache.erasmus.value = [];
    navigationCache.students.value = [];
    navigationCache.erasmusSettings.value = { erasmus_list: false, erasmus_apply_on: false };
  };

  return {
    abouts: computed(() => navigationCache.abouts.value),
    erasmus: computed(() => navigationCache.erasmus.value),
    students: computed(() => navigationCache.students.value),
    erasmusSettings: computed(() => navigationCache.erasmusSettings.value),
    isLoading: computed(() => isLoading.value),
    loadNavigationData,
    clearCache,
  };
}
