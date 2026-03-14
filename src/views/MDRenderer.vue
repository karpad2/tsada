<template>
    <section class="text-gray-600 min-h-screen">
      <div 
        v-if="state.loaded" 
        class="container px-5 mx-auto backdrop-filter bg-opacity-50 dark:bg-slate-500/50 bg-gray-100 backdrop-blur-lg" 
        style="min-height: 70vh;"
      >
        <!-- Header Section -->
        <div v-if="!state.videoId" class="flex flex-wrap w-full mb-20 p-2 rounded">
          <div class="w-full mb-6 lg:mb-0">
            <div class="flex items-center gap-3 flex-wrap">
              <h1
                id="render_title"
                class="sm:text-3xl p-3 text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white"
              >
                {{ localizedTitle }}
              </h1>
              <span v-if="state.pinned" class="inline-flex items-center gap-1 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium mb-2">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" /></svg>
                {{ $t('pinned_news') }}
              </span>
            </div>
            <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
          </div>
          <p v-if="shouldShowDate" class="align-bottom ml-3 leading-relaxed text-gray-600 dark:text-white">
            <strong>{{ $t("date") }}</strong>: {{ formatDate(state.date) }} | 
            <strong>{{ $t("last_modified") }}</strong>: {{ formatDate(state.lastModified) }}
          </p>
        </div>
  
        <!-- Video Background Header -->
        <video-background 
          v-else 
          :src="videoLink" 
          style="min-height: 200px;" 
          class="flex flex-wrap w-full mb-20 p-2 rounded"
          overlay="linear-gradient(45deg,#2a4ae430,#0EA5E950)"
        >
          <div class="mt-3 w-full mb-6 lg:mb-0">
            <h1 class="sm:text-3xl p-3 text-2xl font-medium title-font mb-2 text-gray-100">
              {{ localizedTitle }}
            </h1>
            <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
          </div>
          <p v-if="shouldShowDate" class="align-bottom ml-3 leading-relaxed text-white">
            <strong>{{ $t("date") }}</strong>: {{ formatDate(state.date) }} | 
            <strong>{{ $t("last_modified") }}</strong>: {{ formatDate(state.lastModified) }}
          </p>
        </video-background>
  
        <!-- Admin Controls -->
        <div v-if="state.admin" class="no_print mb-4">
          <VBtn @click="editContent" class="mr-2">{{ $t("edit") }}</VBtn>
          <VBtn v-if="false" @click="downloadPDF">PDF</VBtn>
        </div>
  
        <!-- Main Content -->
        <div ref="pdfContent" class="w-full p-5 dark:text-white print_content content-section" v-html="localizedContent" />
  
        <!-- Additional Content Blocks -->
        <template v-for="contentBlock in state.chtmls" :key="contentBlock.$id">
          <!-- If block has a type, use ContentBlockRenderer -->
          <ContentBlockRenderer
            v-if="contentBlock.type && contentBlock.visible !== false"
            :block="contentBlock"
            :language="currentLanguage"
            class="w-full p-5"
          />
          <!-- Legacy text-only blocks (no type or type='text') -->
          <div
            v-else-if="contentBlock.visible !== false"
            class="w-full p-5 dark:text-white print_content content-section"
            v-html="getLocalizedComponentContent(contentBlock)"
          />
        </template>
  
        <!-- YouTube Videos -->
        <div v-for="ytVideo in state.ytVideos" :key="ytVideo" class="p-5 video-container">
          <iframe 
            class="mx-auto" 
            width="560" 
            height="315" 
            :src="getYouTubeEmbedUrl(ytVideo)" 
            title="YouTube video player" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            referrerpolicy="strict-origin-when-cross-origin" 
            allowfullscreen
          />
        </div>
  
        <!-- Gallery -->
        <div v-if="state.galleryFlag" class="gallery-section">
          <AlbumViewer :caption="false" :id="state.galleryId" />
        </div>
  
        <!-- Documents -->
        <div v-if="state.hasDocuments" class="documents-section">
          <div class="m-auto w-full">
            <DocLister :_id="contentId" />
          </div>
        </div>
      </div>
  
      <Loading v-else />
    </section>
  </template>
  
  <script lang="ts">
  import { defineComponent, reactive, computed, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { Databases, Storage, Query } from 'appwrite';
  import { useLoadingStore } from '@/stores/loading';
  import { appw, config } from '@/appwrite';
  import { convertifserbian } from '@/lang';
  import gsap from 'gsap';
  import dayjs from '@/utils/dayjs';
  import { jsPDF } from 'jspdf';
  import html2canvas from 'html2canvas';
  import AlbumViewer from '@/components/AlbumViewer.vue';
  import Loading from '@/components/Loading.vue';
  import DocLister from '@/components/DocLister.vue';
  import ContentBlockRenderer from '@/components/shared/ContentBlockRenderer.vue';
  
  interface ContentState {
    loaded: boolean;
    admin: boolean;
    title: string;
    titleRs: string;
    titleHu: string;
    titleEn: string;
    content: string;
    contentRs: string;
    contentHu: string;
    contentEn: string;
    chtmls: any[];
    date: string;
    lastModified: string;
    videoId: string;
    ytVideos: string[] | null;
    galleryFlag: boolean;
    galleryId: string;
    hasDocuments: boolean;
    showDate: boolean;
    pinned: boolean;
    euFundingEnabled: boolean;
  }
  
  export default defineComponent({
    name: 'ContentViewer',
    components: {
      AlbumViewer,
      Loading,
      DocLister,
      ContentBlockRenderer
    },
    setup() {
      const route = useRoute();
      const router = useRouter();
      const loadingStore = useLoadingStore();
      const pdfContent = ref(null);
  
      const state = reactive<ContentState>({
        loaded: false,
        admin: false,
        title: '',
        titleRs: '',
        titleHu: '',
        titleEn: '',
        content: '',
        contentRs: '',
        contentHu: '',
        contentEn: '',
        chtmls: [],
        date: '',
        lastModified: '',
        videoId: '',
        ytVideos: null,
        galleryFlag: false,
        galleryId: '',
        hasDocuments: false,
        showDate: false,
        pinned: false,
        euFundingEnabled: false
      });
  
      const database = new Databases(appw);

      // Computed Properties
      const contentId = computed(() => route.params.id as string);
      
      const currentLanguage = computed(() => loadingStore.language);
      
      const pickByLang = <T>(rs: T, hu: T, en: T, fallback: T): T => {
        const lang = currentLanguage.value;
        if (lang === 'sr' || lang === 'rs') return rs;
        if (lang === 'hu') return hu;
        if (lang === 'en') return en;
        return fallback;
      };

      const localizedTitle = computed(() =>
        pickByLang(convertifserbian(state.titleRs), state.titleHu, state.titleEn, state.title)
      );

      const localizedContent = computed(() =>
        pickByLang(state.contentRs, state.contentHu, state.contentEn, state.content)
      );
  
      const videoLink = computed(() => {
        return state.videoId && state.videoId !== '' 
          ? state.videoId 
          : config.default_video;
      });
  
      const shouldShowDate = computed(() => {
        return state.showDate || state.admin;
      });
  
      // Methods
      const initializeAdmin = () => {
        const role = loadingStore.userRole;
        state.admin = loadingStore.userLoggedin && (role === 'admin' || role === 'editor');
      };
  
      const loadContent = async () => {
        try {
          // Load additional content sections
          const additionalContent = await database.listDocuments(
            config.website_db,
            config.text_components,
            [
              Query.equal("doc_id", contentId.value),
              Query.equal("lang", currentLanguage.value),
              Query.orderAsc("order")
            ]
          );
          state.chtmls = additionalContent.documents;
  
          // Load main content
          const mainContent = await database.getDocument(
            config.website_db,
            config.about_us_db,
            contentId.value
          );
  
          // Map content properties
          state.hasDocuments = mainContent.has_documents;
          state.lastModified = mainContent.$updatedAt;
          state.ytVideos = mainContent.yt_video || null;
          state.galleryFlag = mainContent.has_gallery;
          state.showDate = mainContent.show_date;
          state.pinned = mainContent.pinned || false;
          state.videoId = mainContent.video || '';
          state.date = mainContent.$createdAt;
          state.euFundingEnabled = mainContent.eu_funding_enabled || false;

          // Update global store for header
          console.log('🔵 MDRenderer: eu_funding_enabled from DB:', mainContent.eu_funding_enabled);
          console.log('🔵 MDRenderer: Setting store to:', state.euFundingEnabled);
          loadingStore.setCurrentPageEuFunding(state.euFundingEnabled);

          // Set localized content
          state.titleRs = mainContent.title_rs || '';
          state.titleHu = mainContent.title_hu || '';
          state.titleEn = mainContent.title_en || '';
          state.contentRs = mainContent.text_rs || '';
          state.contentHu = mainContent.text_hu || '';
          state.contentEn = mainContent.text_en || '';
  
          // Set document title
          document.title = localizedTitle.value;
  
          // Handle gallery - kezeli mind a string ID-t (új Appwrite), mind az objektumot (régi)
          if (state.galleryFlag && mainContent.gallery) {
            try {
              // Ha string, akkor ez az ID, ha objektum, akkor a $id mezőt használjuk
              state.galleryId = typeof mainContent.gallery === 'string'
                ? mainContent.gallery
                : mainContent.gallery.$id;
            } catch (error) {
              console.error('Gallery ID error:', error);
            }
          }
  
          state.loaded = true;
        } catch (error) {
          console.error('Error loading content:', error);
        }
      };
  
      const formatDate = (dateString: string): string => {
        const locale = pickByLang('sr', 'hu', 'en', 'sr');
        dayjs.locale(locale);
        return dayjs(dateString).format('LL');
      };

      const getLocalizedComponentContent = (component: any): string => {
        return pickByLang(component.content_rs, component.content_hu, component.content_en, null)
          || component.text || '';
      };
  
      const getYouTubeEmbedUrl = (url: string): string => {
        const videoId = url.split('?v=')[1];
        return `https://www.youtube.com/embed/${videoId}`;
      };
  
      const editContent = () => {
        router.push(`/admin/edit/${route.params.mode}/${contentId.value}`);
      };
  
      const downloadPDF = async () => {
        if (!pdfContent.value) return;
  
        try {
          const canvas = await html2canvas(pdfContent.value as HTMLElement, {
            scale: 2
          });
  
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 210;
          const pageHeight = 297;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
          let position = 0;
          let heightLeft = imgHeight;
          let pageNumber = 1;
  
          const addHeaderFooter = (pdf: jsPDF, pageNum: number) => {
            pdf.setFontSize(12);
            pdf.text('Custom Header', 105, 10, { align: 'center' });
            pdf.text(`Page ${pageNum}`, 105, pageHeight - 10, { align: 'center' });
          };
  
          addHeaderFooter(pdf, pageNumber);
          pdf.addImage(imgData, 'PNG', 0, 20, imgWidth, imgHeight);
          heightLeft -= pageHeight - 30;
  
          while (heightLeft > 0) {
            pageNumber++;
            position = heightLeft - imgHeight;
            pdf.addPage();
            addHeaderFooter(pdf, pageNumber);
            pdf.addImage(imgData, 'PNG', 0, position + 20, imgWidth, imgHeight);
            heightLeft -= pageHeight - 30;
          }
  
          pdf.save('content.pdf');
        } catch (error) {
          console.error('PDF generation error:', error);
        }
      };
  
      const animateTitle = () => {
        gsap.fromTo(
          '#render_title',
          { opacity: 0, x: '150%' },
          { duration: 1.5, opacity: 1, x: 0 }
        );
      };
  
      // Watch for language changes
      watch(currentLanguage, async (newLang, oldLang) => {
        if (newLang !== oldLang && state.loaded) {
          await loadContent();
        }
      });

      // Watch for EU funding enabled changes
      watch(() => state.euFundingEnabled, (newValue) => {
        loadingStore.setCurrentPageEuFunding(newValue);
      });
      onMounted(async () => {
        initializeAdmin();
        await loadContent();
        animateTitle();
      });

// 🔥 Route param figyelés — EZ A MEGOLDÁS
watch(
  () => [route.params.mode, route.params.id],
  async () => {
    state.loaded = false;
    await loadContent();
    animateTitle();
  }
);

  
      return {
        state,
        pdfContent,
        contentId,
        currentLanguage,
        localizedTitle,
        localizedContent,
        videoLink,
        shouldShowDate,
        formatDate,
        getYouTubeEmbedUrl,
        getLocalizedComponentContent,
        editContent,
        downloadPDF
      };
    }
  });
  </script>
  
  <style scoped>
  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .content-section {
    line-height: 1.7;
  }
  
  .content-section :deep(h1),
  .content-section :deep(h2),
  .content-section :deep(h3) {
    @apply font-semibold text-gray-800 dark:text-white mb-4;
  }
  
  .content-section :deep(h1) {
    @apply text-2xl;
  }
  
  .content-section :deep(h2) {
    @apply text-xl;
  }
  
  .content-section :deep(h3) {
    @apply text-lg;
  }
  
  .content-section :deep(p) {
    @apply mb-4 text-gray-700 dark:text-gray-200;
  }
  
  .content-section :deep(ul),
  .content-section :deep(ol) {
    @apply mb-4 pl-6;
  }
  
  .content-section :deep(li) {
    @apply mb-2 text-gray-700 dark:text-gray-200;
  }
  
  .content-section :deep(a) {
    @apply text-blue-600 hover:text-blue-800 underline;
  }
  
  .content-section :deep(img) {
    @apply rounded-lg shadow-md max-w-full h-auto mx-auto my-6;
  }

  /* Small inline images: emojis, icons, flags etc. */
  .content-section :deep(img[width]:not([width=""])) {
    all: revert;
    display: inline;
    vertical-align: middle;
  }

  .content-section :deep(img[class*="emoji"]),
  .content-section :deep(img[data-emoji]),
  .content-section :deep(img[src*="emoji"]) {
    all: revert;
    display: inline;
    vertical-align: middle;
  }
  
  .video-container {
    @apply mb-8;
  }
  
  .gallery-section,
  .documents-section {
    @apply border-t border-gray-200 dark:border-gray-700 pt-8 mt-8;
  }
  
  /* Print styles */
  @media print {
    .no_print {
      display: none !important;
    }
    
    .print_content {
      @apply text-black;
    }
  }
  
  /* Responsive video */
  @media (max-width: 768px) {
    .video-container iframe {
      width: 100%;
      height: 200px;
    }
  }
  </style>