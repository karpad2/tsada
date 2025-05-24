<template>
  <section
    ref="scrollContainer"
    class="text-gray-600 body-font p-5 overflow-x-hidden"
    id="courses"
  >
    <div class="container px-5 mx-auto">
      <div class="flex flex-wrap w-full mb-10" v-if="caption">
        <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
          <h1
            class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white"
          >
            {{ title }}
          </h1>
          <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
        </div>
      </div>

      <div class="mb-5 mt-5" v-if="admin">
        <VBtn class="m-2" @click="editmode">{{ $t("edit_gallery") }}</VBtn>
        <VBtn class="m-2" @click="deletebrokenimages">{{ $t("delete_broken_images") }}</VBtn>
      </div>

      <viewer
        :images="images"
        @inited="inited"
        ref="viewer"
        :options="options_for_image_viewer"
        class="flex flex-wrap gap-4 justify-center"
      >
        <template #default="scope">
          <div
            v-for="src in scope.images"
            :key="src"
            class="card card-compact cursor-pointer glass w-full sm:w-1/5 transition delay-150 bg-slate-100/30 backdrop-filter hover:bg-sky-400/60 dark:bg-slate-300/30 shadow-xl"
          >
            <figure>
              <img
                style="height: 272px;"
                class="object-contain"
                v-lazy="src"
                @load="loaded(src)"
              />
            </figure>
          </div>
        </template>
      </viewer>

      <div v-if="isLoading" class="text-center py-4 text-gray-500">
        {{ $t("loading") }}...
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { Databases, Storage, Query, ImageGravity, ImageFormat } from "appwrite";
import { appw, config } from "@/appwrite";
import { convertifserbian } from "@/lang";
import { useLoadingStore } from "@/stores/loading";

export default {
  name: "SlideModules",
  props: {
    mode: String,
    caption: Boolean,
    id: String,
  },
  data: () => ({
    admin: false,
    images: [],
    showed: [],
    title: "",
    page: 0,
    limit: 10,
    isLoading: false,
    noMoreImages: false,
    options_for_image_viewer: { title: false },
    courses: [],
  }),
  mounted() {
    this.admin = useLoadingStore().userLoggedin;
    this.load_courses_base();
    window.addEventListener("scroll", this.handleScroll);
  },
  beforeUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
  },
  methods: {
    async load_courses_base() {
      if (this.isLoading || this.noMoreImages) return;

      this.isLoading = true;
      const database = new Databases(appw);
      const storage = new Storage(appw);
      const cc = useLoadingStore();

      if (this.page === 0) {
        const doc = await database.getDocument(
          config.website_db,
          config.gallery,
          this.id,
          [Query.select(["title_hu", "title_en", "title_rs"])]
        );
        const local = cc.language;
        this.title =
          local === "en"
            ? doc.title_en
            : local === "hu"
            ? doc.title_hu
            : convertifserbian(doc.title_rs);
        document.title = this.title;
      }

      const result = await database.listDocuments(config.website_db, config.album_images, [
        Query.equal("gallery", this.id),
        Query.offset(this.page * this.limit),
        Query.limit(this.limit),
      ]);

      if (result.documents.length === 0) {
        this.noMoreImages = true;
        this.isLoading = false;
        return;
      }

      for (const element of result.documents) {
        const preview = await storage.getFilePreview(
          config.gallery_pictures_storage,
          element.image_id,
          700,
          0,
          ImageGravity.Center,
          90,
          5,
          "FFFFFF",
          15,
          1,
          0,
          "FFFFFF",
          ImageFormat.Webp
        ).href;

        this.courses.push({
          img: preview,
          id: element.$id,
          img_id: element.image_id,
        });

        this.images.push(preview);
      }

      this.page++;
      this.isLoading = false;
    },

    handleScroll() {
      if (this.isLoading || this.noMoreImages) return;

      const nearBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;

      if (nearBottom) {
        this.load_courses_base();
      }
    },

    loaded(src: string) {
      if (!this.showed.includes(src)) {
        this.showed.push(src);
      }
    },

    async deletebrokenimages() {
      const brokenImages = this.images.filter((img) => !this.showed.includes(img));
      const storage = new Storage(appw);
      const database = new Databases(appw);

      for (const brokenImage of brokenImages) {
        const course = this.courses.find((course) => course.img === brokenImage);

        if (course && course.id && course.img_id) {
          try {
            await database.deleteDocument(config.website_db, config.album_images, course.id);
            await storage.deleteFile(config.gallery_pictures_storage, course.img_id);

            this.images = this.images.filter((img) => img !== brokenImage);
            this.courses = this.courses.filter((c) => c.id !== course.id);
          } catch (error) {
            console.error("Failed to delete broken image: ", error);
          }
        }
      }
    },

    editmode() {
      this.$router.push("/admin/gallery-edit/" + this.id);
    },

    inited() {
      // Optional: called when viewer is ready
    },
  },
};
</script>

<style>
/* Optional animation class if needed */
.becsuszo_kep {}
</style>
