<template>
    <section class="text-gray-600 body-font min-h-screen" id="courses">
      <div v-if="loaded" class="container px-5 mx-auto">
        <div class="flex flex-wrap w-full mb-20">
          <div class="lg:w-1/2 w-full mb-6 lg:mb-0">
            <h1 class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white">
              {{ $t('parentsvisiting') }}
            </h1>
            <div class="h-1 w-20 bg-sky-500 rounded"></div>
          </div>
        </div>
        <v-data-table
          :headers="headers"
          :items="classes"
          :items-per-page="-1"
          height="400"
          class="elevation-1"
        >
          <template #bottom></template>
        </v-data-table>
      </div>
      <Loading v-else />
    </section>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import { Client, Databases, Query } from 'appwrite';
  import { appw, config } from '@/appwrite';
  import { convertifserbian } from '@/lang';
  import { useLoadingStore } from '@/stores/loading';
  import Loading from '@/components/Loading.vue';
  
  export default defineComponent({
    name: 'PClassList',
    components: { Loading },
    props: {
      mode: {
        type: String,
        default: '',
      },
    },
    data: () => ({
      admin: false,
      classes: [] as Array<{
        id: string;
        year: number;
        designation: string;
        chief: string;
        receiving_hour: string;
        _class: string;
      }>,
      headers: [] as Array<{ title: string; align: string; sortable: boolean; key: string; width: string }>,
      loaded: false,
    }),
    mounted() {
      this.initializeHeaders();
      document.title = this.$t('parentsvisiting');
      const loadingStore = useLoadingStore();
      this.admin = loadingStore.userLoggedin;
      this.loadCourses();
    },
    methods: {
      initializeHeaders() {
        this.headers = [
          { title: this.$t('name'), align: 'start', sortable: false, key: 'chief', width: '200px' },
          { title: this.$t('class'), align: 'start', key: '_class', width: '300px' },
          {
            title: this.$t('classroom_chief_receiving_hour'),
            align: 'start',
            key: 'receiving_hour',
            width: '300px',
          },
        ];
      },
      async loadCourses() {
        try {
          const database = new Databases(appw);
          const loadingStore = useLoadingStore();
          const local = loadingStore.language;
  
          const { documents } = await database.listDocuments(
            config.website_db,
            config.classlist,
            [Query.orderAsc('year'), Query.orderAsc('designation')]
          );
  
          this.classes = documents.map((doc) => {
            const worker = doc.workers;
            const chiefName =
              local === 'rs' || local === 'sr'
                ? convertifserbian(worker?.worker_name_rs || '')
                : local === 'hu' || local === 'en'
                ? worker?.worker_name_hu || ''
                : '';
  
            return {
              id: doc.$id,
              year: doc.year,
              designation: doc.designation,
              chief: chiefName,
              receiving_hour: doc.receiving_hour,
              _class: this.classDesignation(doc.year, doc.designation),
            };
          });
  
          this.loaded = true;
        } catch (error) {
          console.error('Error loading courses:', error);
          this.loaded = true; // Ensure loaded is set to avoid infinite loading
        }
      },
      classDesignation(year: number, designation: string): string {
        return `${this.toRomanNumeral(year)}-${designation}`;
      },
      toRomanNumeral(num: number): string {
        const romanMap: { [key: number]: string } = {
          1: 'I',
          2: 'II',
          3: 'III',
          4: 'IV',
        };
        return romanMap[num] || 'Hiba';
      },
      isHidden(value: boolean): boolean {
        return !value;
      },
    },
  });
  </script>
  
  <style scoped>
  .becsuszo_kep {
    /* Add styles if needed */
  }
  </style>