<template>
    <section class="text-gray-600 body-font min-h-screen" id="courses">
      <div class="container px-5 mx-auto">
        <div class="flex flex-wrap w-full mb-10">
          <div class="lg:w-1/2 w-full mb-6 lg:mb-0">
            <h1 class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white">{{ $t("classlist") }}</h1>
            <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
          </div>
        </div>
  
        <div class="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <!-- Új hozzáadása -->
          <div v-if="admin" @click="new_stuff" class="cursor-pointer p-4 transition hover:scale-105">
            <div class="min-w-[273px] min-h-[276px] bg-slate-100/80 hover:bg-sky-600/60 dark:bg-slate-300/30 p-6 rounded-lg shadow-lg">
              <img class="size-16 m-auto rounded object-cover object-center mb-6 transition duration-300 ease-in-out"
                src="@/assets/add-plus-new.svg" alt="add" />
              <h2 class="text-lg text-center text-gray-900 font-medium dark:text-white">{{ $t("add_new_class") }}</h2>
            </div>
          </div>
  
          <!-- Osztálykártyák -->
          <div
            v-for="_class in classes"
            :key="_class.id"
            class="card glass text-gray-900 dark:text-white w-full"
            :class="getCardColor(_class.role)"
          >
            <div class="card-body">
              <h2 class="card-title">{{ roman_number(_class.year) }} - {{ _class.designation }} {{ $t("class") }}</h2>
              <p>{{ _class.role }}</p>
              <p>{{ $t("masterchief") }}: {{ _class.chief }}</p>
              <p>{{ $t("teaching_language") }}:
                <span v-if="_class.language === 'class_hun'">{{ $t("hun_teaching") }}</span>
                <span v-else-if="_class.language === 'class_srb'">{{ $t("srb_teaching") }}</span>
              </p>
              <p v-if="_class.receiving_hour">{{ $t("classroom_chief_receiving_hour") }}: {{ _class.receiving_hour }}</p>
              <div v-if="admin" class="card-actions justify-end">
                <button class="btn btn-sm btn-outline">{{ $t("edit") }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </template>
  
  <script lang="ts">
  import { Databases, ID, Query } from "appwrite";
  import { appw, config } from "@/appwrite";
  import { convertifserbian } from "@/lang";
  import { useLoadingStore } from "@/stores/loading";
  
  export default {
    name: 'ClassList',
    data: () => ({
      admin: false,
      classes: []
    }),
    mounted() {
      document.title = this.$t("classlist");
      const cc = useLoadingStore();
      this.admin = cc.userLoggedin;
      this.fetchClasses();
    },
    methods: {
      async fetchClasses() {
        const db = new Databases(appw);
        const store = useLoadingStore();
        const locale = store.language;
  
        try {
          const response = await db.listDocuments(
            config.website_db,
            config.classlist,
            [Query.orderAsc("year"), Query.orderAsc("designation")]
          );
  
          this.classes = response.documents.map(doc => {
            const role = (locale === "hu" && doc.courses?.title_hu) ||
                         (["rs", "sr"].includes(locale) && doc.courses?.title_rs) ||
                         doc.courses?.title_en || "";
  
            const chief = (locale === "hu" && doc.workers?.worker_name_hu) ||
                          (["rs", "sr"].includes(locale) && convertifserbian(doc.workers?.worker_name_rs)) ||
                          doc.workers?.worker_name_hu || "";
  
            return {
              id: doc.$id,
              year: doc.year,
              designation: doc.designation,
              role,
              chief,
              language: doc.language,
              receiving_hour: doc.receiving_hour || ""
            };
          });
  
        } catch (err) {
          console.error("Failed to fetch classes:", err);
        }
      },
  
      async new_stuff() {
        const db = new Databases(appw);
        const newDoc = await db.createDocument(config.website_db, config.classlist, ID.unique(), { year: 1 });
        this.$router.push(`/admin/class-edit/${newDoc.$id}`);
      },
  
      classopen(id: string) {
        if (this.admin) {
          this.$router.push(`/admin/class-edit/${id}`);
        }
      },
  
      roman_number(n: number): string {
        const numerals = ["", "I", "II", "III", "IV"];
        return numerals[n] || "Hiba";
      },
  
      getCardColor(role: string): string {
        if (!role) return "bg-slate-200 dark:bg-slate-700/60";
  
        const colorPalette = [
          "bg-blue-200 dark:bg-blue-700/60",
          "bg-green-200 dark:bg-green-700/60",
          "bg-pink-200 dark:bg-pink-700/60",
          "bg-yellow-200 dark:bg-yellow-700/60",
          "bg-purple-200 dark:bg-purple-700/60",
          "bg-red-200 dark:bg-red-700/60",
          "bg-orange-200 dark:bg-orange-700/60",
          "bg-lime-200 dark:bg-lime-700/60",
          "bg-cyan-200 dark:bg-cyan-700/60",
          "bg-teal-200 dark:bg-teal-700/60"
        ];
  
        const hash = this.hashString(role.toLowerCase());
        const index = hash % colorPalette.length;
        return colorPalette[index];
      },
  
      hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = (hash << 5) - hash + str.charCodeAt(i);
          hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash);
      }
    }
  }
  </script>
  
  <style scoped>
  .card {
    transition: all 0.3s ease;
  }
  .card:hover {
    transform: translateY(-3px);
  }
  </style>
  