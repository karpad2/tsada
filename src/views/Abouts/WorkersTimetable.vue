<template>
    <section class="text-gray-600 min-h-screen">
      <div class="container px-5 py-20 mx-auto bg-slate-100/30 dark:bg-slate-300/30">
        <div class="flex flex-wrap w-full mb-20">
          <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
            <h1
              id="render_title"
              class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white"
            >
              {{ $t('teachers_receiving_hour') }}
            </h1>
            <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
          </div>
        </div>
  
        <div v-if="loaded" v-for="role in roles" :key="role.id" class="m-auto w-full popups">
          <h1 class="sm:text-2xl text-sm font-medium mb-3 text-gray-900 dark:text-white">
            {{ role.role }}
          </h1>
          <v-data-table :headers="headers" :items="role.workers" height="400">
            <template #bottom></template>
          </v-data-table>
        </div>
      </div>
    </section>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import { Databases, Storage, ID, Query } from 'appwrite';
  import { appw, config } from '@/appwrite';
  import { convertifserbian } from '@/lang';
  import { useLoadingStore } from '@/stores/loading';
  import gsap from 'gsap';
  
  export default defineComponent({
    name: 'Workers',
    data() {
      return {
        workers: [],
        roles: [] as any[],
        colDefs: [],
        loaded: false,
        headers: [],
        admin: false
      };
    },
    async mounted() {
      const loadingStore = useLoadingStore();
      this.admin = loadingStore.userLoggedin;
      document.title = this.$t("teachers_receiving_hour");
  
      gsap.fromTo(
        "#render_title",
        { opacity: 0, x: "50%" },
        { duration: 1.5, opacity: 1, x: 0 }
      );
  
      this.headers = [
        { title: this.$t("name"), align: 'start', sortable: false, key: 'name', width: '200px' },
        { title: this.$t("p_receiving_hour"), align: 'start', key: 'p_receiving_hour', width: '300px' },
        { title: this.$t("u_receiving_hour"), align: 'start', key: 'u_receiving_hour', width: '300px' }
      ];
  
      await this.load_workers_base();
  
      gsap.fromTo(
        ".popups",
        { opacity: 0, y: "50%" },
        { duration: 1.5, opacity: 1, y: 0 }
      );
    },
    methods: {
      async new_stuff(roleId: string) {
        const database = new Databases(appw);
        const doc = await database.createDocument(config.website_db, config.workers, ID.unique(), {
          roles: roleId
        });
        this.$router.push("/admin/worker/" + doc.$id);
      },
      async load_workers_base() {
        const loadingStore = useLoadingStore();
        this.roles = [];
  
        const database = new Databases(appw);
        const storage = new Storage(appw);
        const local = loadingStore.language;
  
        const missing_picture = storage.getFileView(config.website_images, config.missing_worker_picture).href;
  
        const rolesRes = await database.listDocuments(config.website_db, config.roles_db, [
          Query.orderAsc("listasorrend"),
          Query.equal("has_receiving_hour", true)
        ]);
  
        for (const roleDoc of rolesRes.documents) {
          const roleId = roleDoc.$id;
          let roleName = "";
  
          if (local === "en") roleName = roleDoc.role_en;
          else if (local === "hu") roleName = roleDoc.role_hu;
          else if (local === "rs" || local === "sr") roleName = convertifserbian(roleDoc.role_rs);
  
          const workersRes = await database.listDocuments(config.website_db, config.workers, [
            Query.equal("roles", [roleId])
          ]);
  
          const workerItems = [];
  
          for (const worker of workersRes.documents) {
            const data = {
              id: worker.$id,
              name: "",
              contact: worker.contact || "",
              img: "",
              p_receiving_hour: worker.p_receiving_hour || "---",
              u_receiving_hour: worker.u_receiving_hour || "---"
            };
  
            if (local === "en" || local === "hu") {
              data.name = worker.worker_name_hu;
            } else if (local === "rs" || local === "sr") {
              data.name = convertifserbian(worker.worker_name_rs);
            }
  
            data.img = worker.worker_img
              ? storage.getFileView(config.website_images, worker.worker_img).href
              : missing_picture;
  
            workerItems.push(data);
          }
  
          this.roles.push({
            id: roleId,
            role: roleName,
            workers: workerItems
          });
        }
  
        this.loaded = true;
      }
    }
  });
  </script>
  
  <style scoped>
  .popups {
    transition: all 0.3s ease-in-out;
  }
  </style>
  