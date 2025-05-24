<template>
    <section class="text-gray-600 min-h-screen">
      <div class="container px-5 py-20 mx-auto bg-slate-100/30 dark:bg-slate-300/30">
        <div class="flex flex-wrap w-full mb-20">
          <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
            <h1 id="render_title" class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white">
              {{ t("studentdocuments") }}
            </h1>
            <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
          </div>
        </div>
  
        <div v-if="loaded" class="space-y-12">
          <div v-for="role in roles" :key="role.id" class="popups transition-opacity duration-700">
            <h2 class="sm:text-2xl text-lg font-medium mb-3 text-gray-900 dark:text-white">{{ role.name }}</h2>
            <v-data-table height="400" :headers="headers" :items="role.documents">
              <template v-slot:item.date="{ item }">
                {{ formatDate(item.date) }}
              </template>
  
              <template v-slot:item.open="{ item }">
                <router-link :to="'/document/' + item.doc_id">
                  <i class="pi pi-book text-5xl"></i>
                </router-link>
              </template>
  
              <template v-slot:item.edit="{ item }" v-if="admin">
                <router-link :to="'/admin/studentdocument/' + item.id">
                  <i class="pi pi-cloud-upload text-5xl"></i>
                </router-link>
              </template>
  
              <template #bottom />
            </v-data-table>
  
            <v-btn v-if="admin" @click="createNewDocument(role.id)" class="mt-4">{{ t("add_new_document_in_that_category") }}</v-btn>
          </div>
        </div>
      </div>
    </section>
  </template>
  
  <script lang="ts">
  import { ref, onMounted } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { useI18n } from "vue-i18n";
  import { Databases, ID, Query } from "appwrite";
  import { appw, config } from "@/appwrite";
  import { useLoadingStore } from "@/stores/loading";
  import { convertifserbian } from "@/lang";
  import moment from "moment/min/moment-with-locales";
  import gsap from "gsap";
  
  export default {
    name: "StudentDocuments",
    setup() {
      const route = useRoute();
      const router = useRouter();
      const { t, locale } = useI18n();
      const loadingStore = useLoadingStore();
  
      const admin = ref(loadingStore.userLoggedin);
      const loaded = ref(false);
      const roles = ref<{ id: string; name: string; documents: any[] }[]>([]);
      const headers = ref([
        { title: t("name"), align: "start", key: "name", width: "200px" },
        { title: t("date"), align: "start", key: "date", width: "300px" },
        { title: t("open_document"), align: "start", key: "open", width: "100px" }
      ]);
  
      if (admin.value) {
        headers.value.push({ title: t("edit_document"), align: "start", key: "edit", width: "100px" });
      }
  
      const formatDate = (date: string) => {
        const lang = locale.value;
        moment.locale(lang === "rs" ? "sr" : lang);
        return moment(date).format("LLL");
      };
  
      const createNewDocument = async (categoryId: string) => {
        const db = new Databases(appw);
        const newDoc = await db.createDocument(config.website_db, config.st_documents, ID.unique(), {
          stDocumentCategories: categoryId
        });
        router.push(`/admin/studentdocument/${newDoc.$id}`);
      };
  
      const loadRolesAndDocuments = async () => {
        const db = new Databases(appw);
        const lang = locale.value;
        roles.value = [];
  
        const categories = await db.listDocuments(config.website_db, config.st_document_categories, [
          Query.orderAsc("listasorrend")
        ]);
  
        for (const cat of categories.documents) {
          const localizedName =
            lang === "hu"
              ? cat.category_name_hu
              : lang === "en"
              ? cat.category_name_en
              : convertifserbian(cat.category_name_rs);
  
          const docs = await db.listDocuments(config.website_db, config.st_documents, [
            Query.equal("stDocumentCategories", [cat.$id]),
            Query.orderDesc("$createdAt")
          ]);
  
          const processedDocs = docs.documents.map((doc) => ({
            id: doc.$id,
            doc_id: doc.document_id,
            name:
              lang === "hu"
                ? doc.document_title_hu
                : lang === "en"
                ? doc.document_title_en
                : convertifserbian(doc.document_title_rs),
            date: doc.$createdAt
          }));
  
          roles.value.push({
            id: cat.$id,
            name: localizedName,
            documents: processedDocs
          });
        }
  
        loaded.value = true;
  
        gsap.fromTo(
          ".popups",
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 1.2, stagger: 0.1 }
        );
      };
  
      onMounted(() => {
        document.title = t("studentdocuments");
  
        gsap.fromTo(
          "#render_title",
          { opacity: 0, x: "50%" },
          { duration: 1.5, opacity: 1, x: 0 }
        );
  
        loadRolesAndDocuments();
      });
  
      return {
        t,
        admin,
        roles,
        headers,
        loaded,
        formatDate,
        createNewDocument
      };
    }
  };
  </script>
  
  <style scoped>
  .popups {
    transition: all 0.4s ease;
  }
  </style>
  