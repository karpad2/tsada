<template>
  <section class="text-gray-600 body-font min-h-screen" id="courses">
    <div class="container px-5 mx-auto">
      <div class="flex flex-wrap w-full mb-10 items-center">
        <div class="lg:w-1/2 w-full mb-6 lg:mb-0">
          <h1 class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white">{{ $t("classlist") }}</h1>
          <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
        </div>
        <div v-if="admin" class="lg:w-1/2 w-full text-right">
          <button
            class="btn btn-sm btn-primary"
            :disabled="loading"
            @click="levelUpClasses"
          >
            {{ $t("level_up_classes") }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="text-center">Loading...</div>
      <div v-else-if="error" class="text-center text-red-500">{{ error }}</div>
      <div v-else class="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <!-- Add New Class -->
        <div v-if="admin" @click="new_stuff" class="cursor-pointer p-4 transition hover:scale-105">
          <div class="min-w-[273px] min-h-[276px] bg-slate-100/80 hover:bg-sky-600/60 dark:bg-slate-300/30 p-6 rounded-lg shadow-lg">
            <img
              class="size-16 m-auto rounded object-cover object-center mb-6 transition duration-300 ease-in-out"
              src="@/assets/add-plus-new.svg"
              alt="Add new class icon"
            />
            <h2 class="text-lg text-center text-gray-900 font-medium dark:text-white">{{ $t("add_new_class") }}</h2>
          </div>
        </div>

        <!-- Class Cards -->
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
              <span v-else>{{ $t("unknown_language") }}</span>
            </p>
            <p v-if="_class.receiving_hour">{{ $t("classroom_chief_receiving_hour") }}: {{ _class.receiving_hour }}</p>
            <div v-if="admin" class="card-actions justify-end">
              <button
                @click.stop="classopen(_class.id)"
                class="btn btn-sm btn-outline"
                :disabled="loading"
              >
                {{ $t("edit") }}
              </button>
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

interface Class {
  id: string;
  year: number;
  designation: string;
  role: string;
  chief: string;
  language: string;
  receiving_hour: string;
}

export default {
  name: 'ClassList',
  data: () => ({
    admin: false,
    classes: [] as Class[],
    loading: false,
    error: null as string | null,
  }),
  mounted() {
    document.title = this.$t("classlist");
    const cc = useLoadingStore();
    this.admin = cc.userLoggedin;
    this.fetchClasses();
  },
  methods: {
    async fetchClasses() {
      this.loading = true;
      this.error = null;
      const db = new Databases(appw);
      const store = useLoadingStore();
      const locale = store.language;

      try {
        const response = await db.listDocuments(
          config.website_db,
          config.classlist,
          [Query.orderAsc("year"), Query.orderAsc("designation")]
        );

        this.classes = response.documents.map(doc => ({
          id: doc.$id,
          year: doc.year,
          designation: doc.designation,
          role:
            (locale === "hu" && doc.courses?.title_hu) ||
            (["rs", "sr"].includes(locale) && doc.courses?.title_rs) ||
            doc.courses?.title_en ||
            "",
          chief:
            (locale === "hu" && doc.workers?.worker_name_hu) ||
            (["rs", "sr"].includes(locale) && convertifserbian(doc.workers?.worker_name_rs)) ||
            doc.workers?.worker_name_hu ||
            "",
          language: doc.language,
          receiving_hour: doc.receiving_hour || "",
        }));
      } catch (err) {
        this.error = this.$t("fetch_error");
        console.error("Failed to fetch classes:", err);
      } finally {
        this.loading = false;
      }
    },

    async new_stuff() {
      this.loading = true;
      this.error = null;
      const db = new Databases(appw);
      try {
        const newDoc = await db.createDocument(config.website_db, config.classlist, ID.unique(), { year: 1 });
        await this.$router.push(`/admin/class-edit/${newDoc.$id}`);
      } catch (err) {
        this.error = this.$t("create_error");
        console.error("Failed to create class:", err);
      } finally {
        this.loading = false;
      }
    },

    async levelUpClasses() {
      this.loading = true;
      this.error = null;
      const db = new Databases(appw);
      try {
        // Fetch all classes
        const response = await db.listDocuments(config.website_db, config.classlist);
        const classesToUpdate: Class[] = [];
        const classesToDelete: string[] = [];

        // Process each class
        for (const doc of response.documents) {
          const currentYear = doc.year;
          if (currentYear >= 4) {
            classesToDelete.push(doc.$id);
          } else {
            classesToUpdate.push({
              id: doc.$id,
              year: currentYear + 1,
              designation: doc.designation,
              role: doc.courses?.title_hu || doc.courses?.title_rs || doc.courses?.title_en || "",
              chief: doc.workers?.worker_name_hu || convertifserbian(doc.workers?.worker_name_rs) || "",
              language: doc.language,
              receiving_hour: doc.receiving_hour || "",
            });
          }
        }

        // Update classes with year < 4
        for (const classItem of classesToUpdate) {
          await db.updateDocument(config.website_db, config.classlist, classItem.id, { year: classItem.year });
        }

        // Delete classes with year >= 4
        for (const classId of classesToDelete) {
          await db.deleteDocument(config.website_db, config.classlist, classId);
        }

        // Refresh the class list
        await this.fetchClasses();
      } catch (err) {
        this.error = this.$t("level_up_error");
        console.error("Failed to level up classes:", err);
      } finally {
        this.loading = false;
      }
    },

    async classopen(id: string) {
      if (this.admin && !this.loading) {
        try {
          await this.$router.push(`/admin/class-edit/${id}`);
        } catch (err) {
          this.error = this.$t("navigation_error");
          console.error("Navigation failed:", err);
        }
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
        "bg-teal-200 dark:bg-teal-700/60",
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
    },
  },
};
</script>

<style scoped>
.card {
  transition: all 0.3s ease;
}
.card:hover {
  transform: translateY(-3px);
}
</style>