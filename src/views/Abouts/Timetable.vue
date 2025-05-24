<template>
    <section class="text-gray-600 min-h-screen">
      <div class="container px-5 mx-auto backdrop-filter bg-opacity-50 dark:bg-slate-500/50 bg-gray-100 backdrop-blur-lg" style="min-height: 70vh;">
        <video-background
          :src="video_link"
          style="min-height: 200px;"
          class="flex flex-wrap w-full mb-20 p-2 rounded"
          overlay="linear-gradient(45deg,#2a4ae430,#0EA5E950)">
          <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
            <h1 id="render_title" class="sm:text-3xl p-3 text-2xl font-medium title-font mb-2 text-gray-100">{{ $t("timetable") }}</h1>
            <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
          </div>
        </video-background>
  
        <!-- Fixed timetable table -->
        <div class="pb-2 w-full">
          <table class="table table-zebra mx-auto">
            <thead>
              <tr>
                <th class="text-left text-xl dark:text-white">{{ $t("morning") }}</th>
                <th class="text-left text-xl dark:text-white">{{ $t("afternoon") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(pair, index) in timetable" :key="index">
                <td>{{ index + 1 }}. {{ pair.morning }}</td>
                <td>{{ index + 1 }}. {{ pair.afternoon }}</td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <!-- Document viewer -->
        <v-data-table :headers="headers" :items="documents" height="400">
          <template v-slot:item.open="{ item }">
            <router-link :to="'/document/' + item.doc_id"><i class="pi pi-book text-2xl"></i></router-link>
          </template>
  
          <template v-slot:item.date="{ item }">
            {{ rt_time(item.date) }}
          </template>
  
          <template v-slot:item.edit="{ item }" v-if="admin">
            <router-link :to="'/admin/text-document-editor/' + item.id"><i class="pi pi-cloud-upload text-2xl"></i></router-link>
          </template>
  
          <template #bottom />
        </v-data-table>
      </div>
    </section>
  </template>
  
  <script lang="ts">
  import { Databases, Query, Storage } from "appwrite";
  import { appw, config } from "@/appwrite";
  import { useLoadingStore } from "@/stores/loading";
  import { convertifserbian } from "@/lang";
  import moment from "moment/min/moment-with-locales";
  import gsap from "gsap";
  
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
    async mounted() {
      const cc = useLoadingStore();
      this.admin = cc.userLoggedin;
  
      this.headers = [
        { title: this.$t("name"), key: "name", align: "start", sortable: false, width: "200px" },
        { title: this.$t("date"), key: "date", align: "start", width: "200px" },
        { title: this.$t("open_document"), key: "open", align: "start", width: "100px" }
      ];
  
      if (this.admin) {
        this.headers.push({ title: this.$t("edit_document"), key: "edit", align: "start", width: "100px" });
      }
  
      const storage = new Storage(appw);
      const fallbackVideoId = "659d5e6949ae7294f9f1";
      this.video_link = storage.getFileView(config.website_images, fallbackVideoId).href;
  
      gsap.fromTo("#render_title", { opacity: 0, x: "150%" }, { duration: 1.5, opacity: 1, x: 0 });
  
      await this.synchronize_documents();
    },
    methods: {
      rt_time(date: string) {
        const local = useLoadingStore().language;
        moment.locale(local === "rs" ? "sr" : local);
        return moment(date).format("LL");
      },
  
      async synchronize_documents() {
        const database = new Databases(appw);
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
  