<template>
    <section class="text-gray-600 min-h-screen">
      <div class="container px-5 py-20 mx-auto bg-slate-100/30 dark:bg-slate-300/30">
        <div class="flex flex-wrap w-full mb-20">
          <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
            <h1 class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white">{{ title }}</h1>
            <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
          </div>
        </div>
  
        <div v-if="loaded" class="m-auto w-full">
          <v-data-table height="400" :headers="headers" :items="documents" :items-per-page="-1">
            <template v-slot:item.date="{ item }">
              {{ formatDate(item.date) }}
            </template>
  
            <template v-slot:item.open="{ item }">
              <router-link :to="'/document/' + item.doc_id">
                <i class="pi pi-book icon_size"></i>
              </router-link>
            </template>
  
            <template v-slot:item.edit="{ item }" v-if="admin">
              <router-link :to="'/admin/document/' + item.id">
                <i class="pi pi-cloud-upload icon_size"></i>
              </router-link>
            </template>
  
            <template #bottom />
          </v-data-table>
  
          <v-btn v-if="admin" @click="createNewDocument" class="m-5">
            {{ t("add_new_document_in_that_category") }}
          </v-btn>
        </div>
      </div>
    </section>
  </template>
  
  <script lang="ts">
  import { ref, onMounted } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { useI18n } from "vue-i18n";
  import { useLoadingStore } from "@/stores/loading";
  import { Databases, ID, Query } from "appwrite";
  import { appw, config } from "@/appwrite";
  import { convertifserbian } from "@/lang";
  import moment from "moment/min/moment-with-locales";
  
  export default {
    name: "DocumentCategoryView",
    setup() {
      const route = useRoute();
      const router = useRouter();
      const { t, locale } = useI18n();
      const loadingStore = useLoadingStore();
  
      const title = ref("");
      const documents = ref<any[]>([]);
      const headers = ref<any[]>([]);
      const admin = ref(loadingStore.userLoggedin);
      const loaded = ref(false);
  
      const formatDate = (date: string) => {
        moment.locale(locale.value === "rs" ? "sr" : locale.value);
        return moment(date).format("LLL");
      };
  
      const loadDocuments = async () => {
        const db = new Databases(appw);
        documents.value = [];
  
        const category = await db.getDocument(config.website_db, config.document_categories_db, route.params.id as string);
        title.value =
          locale.value === "rs"
            ? convertifserbian(category.category_name_rs)
            : locale.value === "hu"
            ? category.category_name_hu
            : category.category_name_rs;
  
        const docs = await db.listDocuments(config.website_db, config.documents_db, [
          Query.equal("documentCategories", route.params.id as string),
          Query.orderDesc("$createdAt"),
        ]);
  
        documents.value = docs.documents.map((doc) => ({
          id: doc.$id,
          doc_id: doc.document_id,
          date: doc.$createdAt,
          name:
            locale.value === "rs"
              ? convertifserbian(doc.document_title_rs)
              : locale.value === "hu"
              ? doc.document_title_hu
              : doc.document_title_rs,
        }));
  
        loaded.value = true;
      };
  
      const createNewDocument = async () => {
        const db = new Databases(appw);
        const newDoc = await db.createDocument(config.website_db, config.documents_db, ID.unique(), {
          documentCategories: route.params.id,
        });
        router.push("/admin/document/" + newDoc.$id);
      };
  
      onMounted(() => {
        headers.value = [
          { title: t("name"), align: "start", sortable: false, key: "name", width: "200px" },
          { title: t("date"), align: "start", key: "date", width: "300px" },
          { title: t("open_document"), align: "start", key: "open", width: "100px" },
        ];
  
        if (admin.value) {
          headers.value.push({ title: t("edit_document"), align: "start", key: "edit", width: "100px" });
        }
  
        loadDocuments();
      });
  
      return {
        t,
        title,
        documents,
        headers,
        loaded,
        admin,
        formatDate,
        createNewDocument,
      };
    },
  };
  </script>
  
  <style scoped>
  .icon_size {
    font-size: 1.8rem;
  }
  </style>
  