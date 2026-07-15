<template>
  <section class="page-shell">
    <div class="page-panel container">
      <div class="page-header">
        <div class="inline-flex items-center gap-3 mb-2">
          <div class="w-11 h-11 bg-gradient-to-br from-sky-500 to-sky-400 rounded-full flex items-center justify-center shadow-lg shadow-sky-500/25">
            <i class="pi pi-clock text-white text-lg"></i>
          </div>
          <h1 id="render_title" class="section-title !mb-0">
            {{ $t("timetable") }}
          </h1>
        </div>
        <div class="section-accent"></div>
      </div>

      <!-- Enhanced timetable with modern design -->
      <div class="pb-4 w-full">
        <div class="page-table-wrap overflow-hidden">
          <div class="page-table-bar">
            <h2 class="text-white font-semibold text-lg flex items-center">
              <i class="pi pi-calendar mr-3"></i>
              {{ $t("timetable") }}
            </h2>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr>
                  <th>
                    <div class="flex items-center text-base normal-case tracking-normal">
                      <i class="pi pi-sun mr-2 text-amber-400"></i>
                      {{ $t("morning") }}
                    </div>
                  </th>
                  <th>
                    <div class="flex items-center text-base normal-case tracking-normal">
                      <i class="pi pi-moon mr-2 text-sky-400"></i>
                      {{ $t("afternoon") }}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(pair, index) in timetable" :key="index" 
                    :class="index % 2 === 0 ? 'bg-white/60 dark:bg-slate-800/60' : 'bg-gray-50/40 dark:bg-slate-700/40'"
                    class="hover:bg-blue-50/50 dark:hover:bg-slate-600/50 transition-colors duration-200">
                  <td class="px-6 py-4 font-medium text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-slate-600">
                    <div class="flex items-center">
                      <span class="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-bold mr-3 shadow-sm">
                        {{ index + 1 }}
                      </span>
                      <span class="font-mono text-lg">{{ pair.morning }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 font-medium text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-slate-600">
                    <div class="flex items-center">
                      <span class="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-full text-sm font-bold mr-3 shadow-sm">
                        {{ index + 1 }}
                      </span>
                      <span class="font-mono text-lg">{{ pair.afternoon }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Enhanced document viewer -->
      <div class="pb-8">
        <div class="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-slate-700/50 overflow-hidden">
          <div class="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
            <h2 class="text-white font-bold text-xl flex items-center">
              <i class="pi pi-file-text mr-3"></i>
              {{ $t("documents") }}
            </h2>
          </div>
          
          <v-data-table 
            :headers="headers" 
            :items="documents" 
            height="400"
            class="elevation-0"
            :class="{ 'dark-theme': $vuetify.theme.dark }"
            item-class="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-200">
            
            <template v-slot:item.open="{ item }">
              <div class="flex justify-center">
                <router-link 
                  :to="'/document/' + item.doc_id"
                  class="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full hover:from-green-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-105 shadow-lg">
                  <i class="pi pi-book text-lg"></i>
                </router-link>
              </div>
            </template>

            <template v-slot:item.date="{ item }">
              <div class="flex items-center text-gray-600 dark:text-gray-400">
                <i class="pi pi-calendar-times mr-2 text-blue-500"></i>
                <span class="font-medium">{{ rt_time(item.date) }}</span>
              </div>
            </template>

            <template v-slot:item.edit="{ item }" v-if="admin">
              <div class="flex justify-center">
                <router-link 
                  :to="'/admin/text-document-editor/' + item.id"
                  class="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105 shadow-lg">
                  <i class="pi pi-cloud-upload text-lg"></i>
                </router-link>
              </div>
            </template>

            <template v-slot:item.name="{ item }">
              <div class="flex items-center">
                <div class="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-3"></div>
                <span class="font-medium text-gray-800 dark:text-gray-200">{{ item.name }}</span>
              </div>
            </template>

            <template #bottom />
          </v-data-table>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { Databases, Query, Storage } from "appwrite";
import { appw, config } from "@/appwrite";
import { useLoadingStore } from "@/stores/loading";

const database = new Databases(appw);
const storage = new Storage(appw);
import { convertifserbian } from "@/lang";
import dayjs from '@/utils/dayjs';
export default {
  data() {
    return {
      video_link: "",
      documents: [],
      headers: [],
      admin: false,
      timetable: [
        { morning: "6:40-7:25", afternoon: "13:15-14:00" },
        { morning: "7:30-8:15", afternoon: "14:05-14:50" },
        { morning: "8:20-9:05", afternoon: "14:55-15:40" },
        { morning: "9:20-10:05", afternoon: "15:55-16:35" },
        { morning: "10:10-10:55", afternoon: "16:40-17:20" },
        { morning: "11:00-11:40", afternoon: "17:25-18:05" },
        { morning: "11:45-12:25", afternoon: "18:10-18:50" },
        { morning: "12:30-13:10", afternoon: "18:55-19:35" }
      ]
    };
  },
  computed: {
    currentLanguage() {
      return useLoadingStore().language;
    }
  },
  watch: {
    currentLanguage(newLang, oldLang) {
      if (newLang !== oldLang) {
        this.synchronize_documents();
      }
    }
  },
  async mounted() {
    const cc = useLoadingStore();
    this.admin = cc.userLoggedin && (cc.userRole === 'admin' || cc.userRole === 'editor');

    this.headers = [
      { title: this.$t("name"), key: "name", align: "start", sortable: false, width: "300px" },
      { title: this.$t("date"), key: "date", align: "start", width: "200px" },
      { title: this.$t("open_document"), key: "open", align: "center", width: "120px" }
    ];

    if (this.admin) {
      this.headers.push({ title: this.$t("edit_document"), key: "edit", align: "center", width: "120px" });
    }

    const fallbackVideoId = "659d5e6949ae7294f9f1";
    this.video_link = storage.getFileView(config.website_images, fallbackVideoId);

    // Enhanced animation
    import('gsap').then(({ default: gsap }) => {
      const tl = gsap.timeline();
      tl.fromTo("#render_title",
          { opacity: 0, x: "100%", scale: 0.8 },
          { duration: 1.2, opacity: 1, x: 0, scale: 1, ease: "back.out(1.7)" }
        )
        .fromTo(".timetable-card",
          { opacity: 0, y: 50 },
          { duration: 0.8, opacity: 1, y: 0, stagger: 0.1 },
          "-=0.5"
        );
    });

    await this.synchronize_documents();
  },
  methods: {
    rt_time(date: string) {
      const local = useLoadingStore().language;
      dayjs.locale(local === "rs" ? "sr" : local);
      return dayjs(date).format("LL");
    },

    async synchronize_documents() {
      const cc = useLoadingStore();
      const local = cc.language;
      this.documents = [];

      try {
        const result = await database.listDocuments(config.website_db, config.text_documents, [
          Query.equal("texts", "timetable")
        ]);

        this.documents = result.documents.map(doc => ({
          id: doc.$id,
          doc_id: doc.document_id,
          date: doc.$createdAt,
          name:
            local === "rs" || local === "sr"
              ? convertifserbian(doc.document_title_rs)
              : doc.document_title_hu
        }));
      } catch (err) {
        console.error("Failed to load documents:", err);
      }
    }
  }
};
</script>

<style scoped>
.table-zebra tbody tr:hover {
  background-color: rgba(59, 130, 246, 0.05);
}

.dark .table-zebra tbody tr:hover {
  background-color: rgba(148, 163, 184, 0.1);
}

/* Custom scrollbar */
.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: linear-gradient(90deg, #3b82f6, #10b981);
  border-radius: 10px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(90deg, #2563eb, #059669);
}

/* Animation classes */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.timetable-card {
  animation: fadeInUp 0.6s ease-out;
}
</style>