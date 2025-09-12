<template>
  <section class="text-gray-600 dark:text-gray-300 min-h-screen transition-colors duration-300">
    <div class="container px-5 py-20 mx-auto bg-slate-100/30 dark:bg-slate-800/40">
      <!-- Header section -->
      <div class="flex flex-wrap w-full mb-20">
        <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
          <h1
            id="render_title"
            class="sm:text-4xl text-3xl font-bold title-font mb-4 text-gray-900 dark:text-gray-100"
          >
            {{ $t('workers') }}
          </h1>
          <div class="h-1 w-20 bg-gradient-to-r from-sky-500 to-blue-600 dark:from-sky-400 dark:to-blue-500 rounded-full"></div>
        </div>
      </div>

      <div v-if="loaded">
        <div
          v-for="(role, index) in visibleRoles"
          :key="role.id"
          class="popups mb-12"
        >
          <div class="mb-6">
            <h2 class="sm:text-3xl text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100 flex items-center">
              <span class="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                {{ role.role }}
              </span>
              <div class="ml-3 flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
            </h2>
          </div>
          
          <!-- Desktop táblázatos megjelenítés -->
          <div class="hidden md:block overflow-hidden rounded-xl shadow-xl dark:shadow-2xl dark:shadow-gray-900/40">
            <table class="min-w-full bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-0">
              <thead class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                <tr>
                  <th class="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {{ $t('name') }}
                  </th>
                  <th class="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {{ $t('contact') }}
                  </th>
                  
                  <th v-if="isAdmin" class="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {{ $t('edit') }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700 dark:bg-gray-800/90">
                <tr v-for="worker in role.workers" :key="worker.id" 
                    class="hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 dark:bg-gray-800/90 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg">
                  <td class="px-8 py-6">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-14 w-14 relative group">
                        <img 
                          class="h-14 w-14 rounded-full object-cover ring-3 ring-white dark:ring-gray-600 shadow-lg group-hover:ring-sky-400 transition-all duration-300" 
                          :src="worker.img" 
                          :alt="worker.name"
                          loading="lazy"
                        />
                        <div class="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div class="ml-6">
                        <div class="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-sky-600 dark:hover:text-sky-400 transition-colors duration-200">
                          {{ worker.name }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-8 py-6">
                    <div class="text-base text-gray-700 dark:text-gray-300 font-medium">
                      <span v-if="worker.contact" class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        <i :class="getContactIcon(worker.contact)" class="mr-2 text-sky-500"></i>
                        {{ worker.contact }}
                      </span>
                      <span v-else class="text-gray-400 dark:text-gray-500 italic">{{ $t("no_contact_info") }}</span>
                    </div>
                  </td>
                  <td v-if="isAdmin" class="px-8 py-6">
                    <router-link :to="`/admin/worker/${worker.id}`" class="group">
                      <div class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 group-hover:bg-sky-500 dark:group-hover:bg-sky-600 transition-all duration-300 transform group-hover:scale-110 group-hover:shadow-lg">
                        <i class="pi pi-user-edit text-xl text-sky-600 dark:text-sky-400 group-hover:text-white transition-colors duration-300"></i>
                      </div>
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile kártya megjelenítés -->
          <div class="md:hidden space-y-4">
            <div v-for="worker in role.workers" :key="'card_' + worker.id" 
                 class="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-gray-900/40 p-6 border border-gray-100 dark:border-gray-700/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="relative group">
                    <img 
                      class="h-16 w-16 rounded-full object-cover ring-3 ring-white dark:ring-gray-600 shadow-lg group-hover:ring-sky-400 transition-all duration-300" 
                      :src="worker.img" 
                      :alt="worker.name"
                      loading="lazy"
                    />
                    <div class="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div class="ml-4">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{{ worker.name }}</h3>
                    <div v-if="worker.contact" class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      <i :class="getContactIcon(worker.contact)" class="mr-2 text-sky-500"></i>
                      {{ worker.contact }}
                    </div>
                    <p v-else class="text-sm text-gray-400 dark:text-gray-500 italic">Nincs elérhetőség</p>
                  </div>
                </div>
                <div v-if="isAdmin">
                  <router-link :to="`/admin/worker/${worker.id}`" class="group">
                    <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900/30 group-hover:bg-sky-500 dark:group-hover:bg-sky-600 transition-all duration-300 transform group-hover:scale-110 group-hover:shadow-lg">
                      <i class="pi pi-user-edit text-2xl text-sky-600 dark:text-sky-400 group-hover:text-white transition-colors duration-300"></i>
                    </div>
                  </router-link>
                </div>
              </div>
            </div>
          </div>

          <!-- Admin új munkás hozzáadása gomb -->
          <button
            v-if="isAdmin"
            @click="addNewWorker(role.id)"
            class="mt-8 group relative px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 dark:from-sky-600 dark:to-blue-700 text-white font-semibold rounded-xl hover:from-sky-600 hover:to-blue-700 dark:hover:from-sky-700 dark:hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-1"
          >
            <span class="relative z-10 flex items-center">
              <i class="pi pi-plus mr-2"></i>
              {{ $t('add_new_worker_in_that_category') }}
            </span>
            <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>

        <!-- Infinite scroll trigger -->
        <div ref="loadMoreTrigger" class="h-px"></div>
      </div>

      <!-- Loading component -->
      <Loading v-else />
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUpdated, onUnmounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Client, Databases, ID, Storage, Query } from 'appwrite';
import { appw, config } from '@/appwrite';
import { convertifserbian } from '@/lang';
import { useLoadingStore } from '@/stores/loading';
import gsap from 'gsap';
import Loading from '@/components/Loading.vue';

interface Worker {
  id: string;
  name: string;
  contact: string;
  img: string;
}

interface Role {
  id: string;
  role: string;
  workers: Worker[];
}

export default defineComponent({
  name: 'Workers',
  components: { Loading },
  setup() {
    // Composition API variables
    const { t } = useI18n();
    const loadingStore = useLoadingStore();
    const visibleRoles = ref<Role[]>([]);
    const allRoles = ref<Role[]>([]);
    const loadCount = 3;
    const loadIndex = ref(0);
    const loadMoreTrigger = ref<HTMLElement | null>(null);
    const loaded = ref(false);
    let observer: IntersectionObserver | null = null;

    // Computed properties
    const isAdmin = computed(() => loadingStore.userLoggedin);

    // Methods
    const getContactIcon = (contact: string): string => {
      const lowerContact = contact.toLowerCase().trim();
      
      // Telefon felismerés
      if (/^[\+]?[0-9\s\-\(\)\/]+$/.test(contact.trim()) && contact.trim().length >= 7) {
        return 'pi pi-phone';
      }
      
      // Email felismerés
      if (lowerContact.includes('@') && lowerContact.includes('.')) {
        return 'pi pi-envelope';
      }
      
      // Közösségi média és weboldalak
      if (lowerContact.includes('facebook') || lowerContact.includes('fb.com')) {
        return 'pi pi-facebook';
      }
      if (lowerContact.includes('instagram') || lowerContact.includes('insta')) {
        return 'pi pi-instagram';
      }
      if (lowerContact.includes('linkedin')) {
        return 'pi pi-linkedin';
      }
      if (lowerContact.includes('twitter') || lowerContact.includes('x.com')) {
        return 'pi pi-twitter';
      }
      if (lowerContact.includes('youtube') || lowerContact.includes('yt')) {
        return 'pi pi-youtube';
      }
      if (lowerContact.includes('tiktok')) {
        return 'pi pi-video';
      }
      
      // Weboldalak
      if (lowerContact.includes('www.') || lowerContact.includes('http') || lowerContact.includes('.com') || lowerContact.includes('.hu') || lowerContact.includes('.rs')) {
        return 'pi pi-globe';
      }
      
      // Cím felismerés (utca, város, irányítószám)
      if (lowerContact.includes('utca') || lowerContact.includes('út') || lowerContact.includes('tér') || 
          lowerContact.includes('street') || lowerContact.includes('str') || 
          /\d{4,5}/.test(lowerContact) || lowerContact.includes('város') || lowerContact.includes('city')) {
        return 'pi pi-map-marker';
      }
      
      // Skype
      if (lowerContact.includes('skype')) {
        return 'pi pi-comments';
      }
      
      // WhatsApp, Viber, Telegram
      if (lowerContact.includes('whatsapp') || lowerContact.includes('viber') || lowerContact.includes('telegram')) {
        return 'pi pi-comment';
      }
      
      // Általános info minden másra
      return 'pi pi-info-circle';
    };

    const loadMoreRoles = () => {
      if (loadIndex.value >= allRoles.value.length) return;
      const nextChunk = allRoles.value.slice(loadIndex.value, loadIndex.value + loadCount);
      visibleRoles.value.push(...nextChunk);
      loadIndex.value += loadCount;
    };

    const addNewWorker = async (roleId: string) => {
      try {
        const database = new Databases(appw);
        const doc = await database.createDocument(
          config.website_db,
          config.workers,
          ID.unique(),
          { roles: roleId }
        );
        window.location.href = `/admin/worker/${doc.$id}`;
      } catch (error) {
        console.error('Failed to create new worker:', error);
      }
    };

    const loadWorkers = async () => {
      try {
        const database = new Databases(appw);
        const storage = new Storage(appw);
        const local = loadingStore.language;
        const missingPicture = storage.getFileView(config.website_images, config.missing_worker_picture).href;

        const roleDocs = await database.listDocuments(config.website_db, config.roles_db, [
          Query.orderAsc('listasorrend'),
        ]);

        const rolesPromises = roleDocs.documents.map(async (role) => {
          const workersDocs = await database.listDocuments(config.website_db, config.workers, [
            Query.select(['worker_name_hu', 'worker_name_rs', 'contact', 'worker_img', '$id']),
            Query.equal('roles', [role.$id]),
          ]);

          const roleName =
            local === 'en'
              ? role.role_en
              : local === 'hu'
              ? role.role_hu
              : convertifserbian(role.role_rs);

          const workers: Worker[] = workersDocs.documents.map((worker) => ({
            id: worker.$id,
            name: local === 'rs' || local === 'sr' ? convertifserbian(worker.worker_name_rs) : worker.worker_name_hu,
            contact: worker.contact,
            img: worker.worker_img ? storage.getFileView(config.website_images, worker.worker_img).href : missingPicture,
          }));

          return { id: role.$id, role: roleName, workers };
        });

        allRoles.value = await Promise.all(rolesPromises);
        loaded.value = true;
        loadMoreRoles();

        // Animate roles after loading
        setTimeout(() => {
          gsap.fromTo(
            '.popups',
            { opacity: 0, y: 30, scale: 0.95 },
            { duration: 1, opacity: 1, y: 0, scale: 1, stagger: 0.15, ease: 'power3.out' }
          );
        }, 100);
      } catch (error) {
        console.error('Failed to load workers:', error);
        loaded.value = false;
      }
    };

    const setupIntersectionObserver = () => {
      if (loadMoreTrigger.value && !observer) {
        observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              loadMoreRoles();
            }
          },
          { rootMargin: '100px' }
        );
        observer.observe(loadMoreTrigger.value);
      }
    };

    // Lifecycle hooks
    onMounted(() => {
      document.title = t('workers');

      // Title animation
      gsap.fromTo(
        '#render_title',
        { opacity: 0, x: -50, scale: 0.9 },
        { duration: 1.2, opacity: 1, x: 0, scale: 1, ease: 'power3.out' }
      );

      loadWorkers();
    });

    onUpdated(() => {
      setupIntersectionObserver();
    });

    onUnmounted(() => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    });

    return {
      visibleRoles,
      loadMoreTrigger,
      isAdmin,
      loaded,
      addNewWorker,
      getContactIcon,
      t,
    };
  },
});
</script>

<style scoped>
.popups {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.pi-user-edit {
  @apply transition-all duration-300;
}

/* Smooth transitions for dark mode */
* {
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-800 rounded-full;
}

::-webkit-scrollbar-thumb {
  @apply bg-gradient-to-b from-sky-400 to-blue-500 rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply from-sky-500 to-blue-600;
}

/* Ring utilities for better browser support */
.ring-3 {
  box-shadow: 0 0 0 3px var(--tw-ring-color);
}
</style>