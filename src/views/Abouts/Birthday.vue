<template>
  <div class="page-shell flex justify-center items-center px-4 py-12">
    <div class="page-panel !min-h-0 w-full max-w-xl">
      <main>
        <h1 class="section-title text-center !text-2xl sm:!text-3xl">
          🏫 {{ $t("school_birthday") }} 🏫
        </h1>
        <div class="section-accent !w-20 mx-auto"></div>

        <ul v-if="filteredList.length && !loading" class="mt-8 space-y-3">
          <li
            v-for="person in filteredList"
            :key="(person.$id || person.name) + person.birthday"
            class="glass-card birthday-card p-4 rounded-2xl flex items-center justify-between fade-in-up"
            :style="{ animationDelay: (0.2 * (filteredList.indexOf(person) + 1)) + 's' }"
          >
            <div>
              <span class="text-lg font-semibold text-gray-800 dark:text-white">{{ person.name }}</span>
              <small class="text-gray-500 dark:text-gray-400 block">{{ person.class }}</small>
              <small class="text-gray-600 dark:text-gray-300 block mt-1">{{ $t("born") }} {{ person.birthday }}</small>
            </div>
            <span class="glass-badge px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap">
              {{ calculateAge(person.birthday) }} {{ $t("yrs") }} 🎂
            </span>
          </li>
        </ul>

        <div v-if="filteredList.length === 0 && !loading" class="page-state !py-10">
          <span class="page-state-text">😞 {{ $t("no_one_has_birthday_today") }}</span>
        </div>
        <div v-if="loading" class="page-state !py-10">
          <div class="page-spinner mb-3"></div>
          <span class="page-state-text">{{ $t("loading") }}...</span>
        </div>
      </main>
    </div>
  </div>
</template>

<script lang="ts">
import { Databases, Query } from "appwrite";
import { appw, config } from "@/appwrite";

export default {
  data() {
    return {
      people: [] as any[],
      today: new Date().toISOString().slice(5, 10),
      loading: true,
    };
  },
  computed: {
    filteredList() {
      return this.people.filter((person) => {
        const personMonthDay = person.birthday.slice(5, 10);
        return personMonthDay === this.today;
      });
    },
  },
  mounted() {
    this.selfloading();
    setInterval(this.selfloading, 360000);
  },
  methods: {
    async selfloading() {
      const databases = new Databases(appw);
      try {
        const promise = await databases.listDocuments(
          config.birthday_db,
          config.birthday_coll,
          [Query.endsWith("birthday", this.today)]
        );
        this.people = promise.documents;
        this.loading = false;
      } catch (e) {
        console.log(e);
        setTimeout(() => this.selfloading(), 10000);
      }
    },
    calculateAge(birthday: string) {
      const birthYear = parseInt(birthday.slice(0, 4));
      const currentYear = new Date().getFullYear();
      return currentYear - birthYear;
    },
  },
};
</script>

<style scoped>
.fade-in-up {
  animation: fadeInUp 0.5s ease both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
