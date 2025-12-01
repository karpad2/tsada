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
            <h1 
              id="render_title" 
              class="sm:text-3xl p-3 text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white"
            >
              {{ localizedTitle }}
            </h1>
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
  
        <!-- Additional Content Sections -->
        <div 
          v-for="contentSection in state.chtmls" 
          :key="contentSection.$id" 
          class="w-full p-5 dark:text-white print_content content-section" 
          v-html="contentSection.text"
        />
  
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
  import { Client, Databases, Storage, Query, Account } from 'appwrite';
  import { useLoadingStore } from '@/stores/loading';
  import { appw, config } from '@/appwrite';
  import { convertifserbian } from '@/lang';
  import gsap from 'gsap';
  import moment from 'moment/min/moment-with-locales';
  import { jsPDF } from 'jspdf';
  import html2canvas from 'html2canvas';
  import AlbumViewer from '@/components/AlbumViewer.vue';
  import Loading from '@/components/Loading.vue';
  import DocLister from '@/components/DocLister.vue';
  
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
  }
  
  export default defineComponent({
    name: 'ContentViewer',
    components: {
      AlbumViewer,
      Loading,
      DocLister
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
        showDate: false
      });
  
      // Computed Properties
      const contentId = computed(() => route.params.id as string);
      
      const currentLanguage = computed(() => loadingStore.language);
      
      const localizedTitle = computed(() => {
        switch (currentLanguage.value) {
          case 'sr':
          case 'rs':
            return convertifserbian(state.titleRs);
          case 'hu':
            return state.titleHu;
          case 'en':
            return state.titleEn;
          default:
            return state.title;
        }
      });
  
      const localizedContent = computed(() => {
        switch (currentLanguage.value) {
          case 'sr':
          case 'rs':
            return state.contentRs;
          case 'hu':
            return state.contentHu;
          case 'en':
            return state.contentEn;
          default:
            return state.content;
        }
      });
  
      const videoLink = computed(() => {
        return state.videoId && state.videoId !== '' 
          ? state.videoId 
          : config.default_video;
      });
  
      const shouldShowDate = computed(() => {
        return state.showDate || state.admin;
      });
  
      // Methods
      const initializeAdmin = async () => {
        state.admin = loadingStore.userLoggedin;
        if (state.admin) {
          const account = new Account(appw);
          console.log(account.client);
        }
      };
  
      const loadContent = async () => {
        try {
          const database = new Databases(appw);
          
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
          state.videoId = mainContent.video || '';
          state.date = mainContent.$createdAt;
  
          // Set localized content
          state.titleRs = mainContent.title_rs || '';
          state.titleHu = mainContent.title_hu || '';
          state.titleEn = mainContent.title_en || '';
          state.contentRs = mainContent.text_rs || '';
          state.contentHu = mainContent.text_hu || '';
          state.contentEn = mainContent.text_en || '';
  
          // Set document title
          document.title = localizedTitle.value;
  
          // Handle gallery
          if (state.galleryFlag && mainContent.gallery) {
            try {
              state.galleryId = mainContent.gallery.$id;
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
        const language = currentLanguage.value;
        
        switch (language) {
          case 'rs':
          case 'sr':
            moment.locale('sr');
            break;
          case 'hu':
            moment.locale('hu');
            break;
          case 'en':
            moment.locale('en');
            break;
        }
        
        return moment(dateString).format('LL');
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

      // Lifecycle
      onMounted(async () => {
        await initializeAdmin();
        await loadContent();
        animateTitle();
      });
  
      return {
        state,
        pdfContent,
        contentId,
        localizedTitle,
        localizedContent,
        videoLink,
        shouldShowDate,
        formatDate,
        getYouTubeEmbedUrl,
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