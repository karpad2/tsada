<template>
    <section class="text-gray-600 min-h-screen">
      <div class="container px-5 py-20 mx-auto bg-slate-100/30 dark:bg-slate-300/30">
        <div class="flex flex-wrap w-full mb-20">
          <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
            <h1 id="render_title" class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white">{{ t('workers') }}</h1>
            <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
          </div>
        </div>
  
        <div v-if="loaded">
          <div
            v-for="(role, index) in visibleRoles"
            :key="role.role"
            class="m-auto w-full popups"
          >
            <h1 class="sm:text-2xl text-sm font-medium mb-3 text-gray-900 dark:text-white">{{ role.role }}</h1>
            <v-data-table
              height="400"
              :headers="headers"
              :items="role.workers"
              :items-per-page="-1"
            >
              <template v-slot:item.img="{ item }">
                <img v-lazy="item.img" class="object-cover w-20" />
              </template>
              <template v-slot:item.edit="{ item }">
                <router-link :to="'/admin/worker/' + item.id">
                  <i class="pi pi-user-edit worker_editor"></i>
                </router-link>
              </template>
              <template #bottom />
            </v-data-table>
  
            <v-btn v-if="admin" @click="new_stuff(role.id)" class="m-5">
              {{ t('add_new_worker_in_that_category') }}
            </v-btn>
          </div>
  
          <div ref="loadMoreTrigger" style="height: 1px;"></div>
        </div>
  
        <Loading v-else />
      </div>
    </section>
  </template>
  
  <script lang="ts">
  import { onMounted, onUpdated, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { Client, Databases, ID, Storage, Query } from "appwrite";
  import { appw, config } from "@/appwrite";
  import { convertifserbian } from "@/lang";
  import { useLoadingStore } from "@/stores/loading";
  import gsap from "gsap";
  import Loading from "@/components/Loading.vue";
  
  export default {
    name: 'Workers',
    components: {
      Loading
    },
    setup() {
      const { t } = useI18n();
      const visibleRoles = ref([]);
      const allRoles = ref([]);
      const loadCount = 3;
      const loadIndex = ref(0);
      const loadMoreTrigger = ref(null);
      const headers = ref([]);
      const admin = ref(false);
      const loaded = ref(false);
  
      const loadingStore = useLoadingStore();
      let observer: IntersectionObserver;
  
      const loadMoreRoles = () => {
        const nextChunk = allRoles.value.slice(loadIndex.value, loadIndex.value + loadCount);
        visibleRoles.value.push(...nextChunk);
        loadIndex.value += loadCount;
      };
  
      const new_stuff = async (roleId: string) => {
        const database = new Databases(appw);
        const l = await database.createDocument(config.website_db, config.workers, ID.unique(), { roles: roleId });
        window.location.href = "/admin/worker/" + l.$id;
      };
  
      const load_workers_base = async () => {
        const database = new Databases(appw);
        const storage = new Storage(appw);
        const local = loadingStore.language;
        const missing_picture = storage.getFileView(config.website_images, config.missing_worker_picture).href;
  
        const roleDocs = await database.listDocuments(config.website_db, config.roles_db, [Query.orderAsc("listasorrend")]);
        for (const el1 of roleDocs.documents) {
          const l = await database.listDocuments(config.website_db, config.workers, [
            Query.select(["worker_name_hu", "worker_name_rs", "contact", "worker_img", "$id"]),
            Query.equal("roles", [el1.$id])
          ]);
  
          let roleName = "";
          if (local === "en") roleName = el1.role_en;
          else if (local === "hu") roleName = el1.role_hu;
          else if (local === "rs" || local === "sr") roleName = convertifserbian(el1.role_rs);
  
          const workers = [];
          for (const el2 of l.documents) {
            const a = {
              id: el2.$id,
              name: (local === "rs" || local === "sr") ? convertifserbian(el2.worker_name_rs) : el2.worker_name_hu,
              contact: el2.contact,
              img: el2.worker_img ? storage.getFileView(config.website_images, el2.worker_img).href : missing_picture
            };
            workers.push(a);
          }
  
          const roleObj = {
            id: el1.$id,
            role: roleName,
            workers
          };
          allRoles.value.push(roleObj);
        }
  
        loaded.value = true;
        loadMoreRoles();
  
        // Observer létrehozása csak ezután
        observer = new IntersectionObserver(
          entries => {
            if (entries[0].isIntersecting) {
              loadMoreRoles();
            }
          },
          { rootMargin: '100px' }
        );
      };
  
      onMounted(() => {
        admin.value = loadingStore.userLoggedin;
        document.title = t("workers");
  
        headers.value = admin.value
          ? [
              { title: t("name"), align: 'start', sortable: false, key: 'name', width: '200px' },
              { title: t("contact"), align: 'start', key: 'contact', width: '300px' },
              { title: t("photo"), align: 'start', key: 'img', width: '200px' },
              { title: t("Edit"), align: 'start', key: 'edit', width: '300px' }
            ]
          : [
              { title: t("name"), align: 'start', sortable: false, key: 'name', width: '200px' },
              { title: t("contact"), align: 'start', key: 'contact', width: '300px' },
              { title: t("photo"), align: 'start', key: 'img' }
            ];
  
        gsap.fromTo("#render_title", { opacity: 0, x: "50%" }, { duration: 1.5, opacity: 1, x: 0 });
  
        load_workers_base();
      });
  
      onUpdated(() => {
        if (loadMoreTrigger.value && observer) {
          observer.disconnect();
          observer.observe(loadMoreTrigger.value);
        }
      });
  
      return {
        visibleRoles,
        loadMoreTrigger,
        headers,
        admin,
        loaded,
        new_stuff,
        t
      };
    }
  };
  </script>
  
  <style scoped>
  .worker_editor {
    font-size: 4em;
  }
  </style>
  