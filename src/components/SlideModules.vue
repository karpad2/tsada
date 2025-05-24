<template>
    <section class="text-gray-600 body-font mt-5 mb-5" id="courses">
      <div class="container px-5 mx-auto">
        <div class="flex flex-wrap w-full mb-10">
          <div class="lg:w-1/2 w-full mb-6">
            <h1 class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white">{{ $t(mode) }}</h1>
            <div class="h-1 w-20 bg-sky-500 rounded"></div>
          </div>
        </div>
  
        <div class="flex flex-wrap -m-4">
          <div
            v-if="admin"
            @click="new_stuff"
            class="card card-compact cursor-pointer glass m-3 w-full sm:w-1/5 transition bg-slate-100/30 dark:bg-slate-300/30 backdrop-filter hover:bg-sky-400/60 shadow-xl fade-slide"
          >
            <figure class="h-40 flex items-center justify-center">
              <img class="size-16 object-cover transition duration-300" src="@/assets/add-plus-new.svg" alt="add new" />
            </figure>
            <div class="card-body">
              <h2 class="text-lg text-gray-900 font-medium dark:text-white card-title">{{ $t("add_new_content") }}</h2>
            </div>
          </div>
  
          <div
            v-for="course in courses"
            :key="course.id"
            @click="courseopen(course.id)"
            class="card card-compact cursor-pointer glass m-3 w-full sm:w-1/5 transition bg-slate-100/30 dark:bg-slate-300/30 backdrop-filter hover:bg-sky-400/60 shadow-xl fade-slide"
          >
            <figure>
              <img
                class="h-40 w-full object-cover mb-6 transition duration-300"
                v-lazy="course.img"
                alt="course image"
              />
            </figure>
            <div class="card-body">
              <h3 class="tracking-widest text-sm font-medium">
                {{ course.subtitle }}
                <span v-if="isHidden(course.visible)">({{ $t("invisible") }})</span>
              </h3>
              <h2 class="text-lg text-gray-900 font-medium dark:text-white card-title">{{ course.title }}</h2>
              <p class="leading-relaxed text-base" v-html="course.text"></p>
            </div>
          </div>
        </div>
  
        <div v-if="isLoading" class="w-full text-center py-5">
          <span class="loading loading-dots loading-lg text-sky-500"></span>
        </div>
      </div>
    </section>
  </template>
  
  <script lang="ts">
  import { Databases, ID, Storage, Query } from "appwrite";
  import { appw, config } from "@/appwrite";
  import { convertifserbian, getStatus } from "@/lang";
  import { useLoadingStore } from "@/stores/loading";
  import gsap from "gsap";
  
  export default {
    name: "SlideModules",
    props: {
      mode: String
    },
    data() {
      return {
        admin: false,
        courses: [],
        page: 0,
        limit: 10,
        isLoading: false,
        hasMore: true
      };
    },
    mounted() {
      const store = useLoadingStore();
      this.admin = store.userLoggedin;
      this.load_courses_base();
  
      window.addEventListener("scroll", this.handleScroll);
  
      gsap.fromTo(".fade-slide", { opacity: 0, x: "150%" }, { duration: 1.2, opacity: 1, x: 0, stagger: 0.1 });
    },
    beforeUnmount() {
      window.removeEventListener("scroll", this.handleScroll);
    },
    methods: {
      async load_courses_base() {
        if (this.isLoading || !this.hasMore) return;
        this.isLoading = true;
  
        const store = useLoadingStore();
        const db = new Databases(appw);
        const storage = new Storage(appw);
  
        let filters = [
          Query.equal("type", this.mode),
          Query.limit(this.limit),
          Query.offset(this.page * this.limit),
          Query.orderDesc("$createdAt")
        ];
  
        const commonSelect = Query.select([
          "title_hu", "title_en", "title_rs", "short_en", "short_hu", "short_rs",
          "$id", "default_image", "visible", "notNews", "$createdAt"
        ]);
  
        if (this.mode === "news") {
          filters.push(Query.or([Query.isNull("notNews"), Query.equal("notNews", false)]));
        }
  
        if (!store.userLoggedin) {
          filters.push(Query.equal(getStatus(), true), Query.equal("visible", true));
        }
  
        filters.push(commonSelect);
        const res = await db.listDocuments(config.website_db, config.about_us_db, filters);
  
        if (res.documents.length < this.limit) this.hasMore = false;
  
        const newCourses = res.documents.map(doc => {
          const lang = store.language;
          return {
            id: doc.$id,
            visible: doc.visible,
            title: lang === "en" ? doc.title_en : lang === "hu" ? doc.title_hu : convertifserbian(doc.title_rs),
            subtitle: lang === "en" ? doc.short_en : lang === "hu" ? doc.short_hu : convertifserbian(doc.short_rs),
            text: "",
            img: doc.default_image
              ? storage.getFilePreview(config.website_images, doc.default_image, 700, 0, "center", 90, 5, "FFFFFF", 15, 1, 0, "FFFFFF", "webp").href
              : "https://dummyimage.com/720x400"
          };
        });
  
        this.courses.push(...newCourses);
        this.page++;
        this.isLoading = false;
      },
      isHidden(visible) {
        return !visible;
      },
      courseopen(id) {
        const path = id.toLowerCase().replaceAll(" ", "");
        this.$router.push(`/renderer/${this.mode}/${path}`);
      },
      async new_stuff() {
        const db = new Databases(appw);
        const doc = await db.createDocument(config.website_db, config.about_us_db, ID.unique(), {
          type: this.mode,
          aboutCategories: config.news_category_in_text,
          notNews: false
        });
        this.$router.push(`/admin/edit/${this.mode}/${doc.$id}`);
      },
      handleScroll() {
        const bottomOfWindow =
          window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 50;
        if (bottomOfWindow) {
          this.load_courses_base();
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .fade-slide {
    will-change: transform, opacity;
  }
  </style>
  