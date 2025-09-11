<template>
  <section
    ref="scrollContainer"
    class="text-gray-600 body-font p-5 overflow-x-hidden"
    id="courses"
  >
    <div class="container px-5 mx-auto">
      <div v-if="caption" class="flex flex-wrap w-full mb-10">
        <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
          <h1
            class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white"
          >
            {{ title }}
          </h1>
          <div class="h-1 w-20 bg-sky-500 rounded"></div>
        </div>
      </div>

      <div v-if="isAdmin" class="mb-5 mt-5 flex gap-2">
        <VBtn @click="editMode">{{ $t('edit_gallery') }}</VBtn>
        <VBtn @click="deleteBrokenImages">{{ $t('delete_broken_images') }}</VBtn>
      </div>

      <viewer
        :images="images"
        @inited="inited"
        ref="viewer"
        :options="viewerOptions"
        class="grid grid-cols-1 sm:grid-cols-5 gap-4"
      >
        <template #default="{ images }">
          <div
            v-for="(src, index) in images"
            :key="src"
            class="card card-compact cursor-pointer glass bg-slate-100/30 hover:bg-sky-400/60 dark:bg-slate-300/30 shadow-xl transition-colors duration-150"
          >
            <figure>
              <img
                :src="src"
                :data-fullsize="courses[index]?.fullsize"
                style="height: 272px"
                class="object-contain"
                loading="lazy"
                :alt="`Image: ${title}`"
                @load="onImageLoad(src)"
                @error="onImageError(src)"
              />
            </figure>
          </div>
        </template>
      </viewer>

      <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-5 gap-4 mt-4">
        <div
          v-for="n in limit"
          :key="`skeleton-${n}`"
          class="card card-compact bg-gray-200 dark:bg-gray-700 animate-pulse h-[272px]"
        ></div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Databases, Storage, Query, ImageGravity, ImageFormat } from 'appwrite';
import { appw, config } from '@/appwrite';
import { useLoadingStore } from '@/stores/loading';

export default defineComponent({
  name: 'SlideModules',
  props: {
    mode: { type: String, default: '' },
    caption: { type: Boolean, default: false },
    id: { type: String, required: true },
  },
  data: () => ({
    isAdmin: false,
    images: [] as string[],
    showed: [] as string[],
    title: '',
    page: 0,
    limit: 10,
    isLoading: false,
    noMoreImages: false,
    viewerOptions: {
      title: false,
      url: 'data-fullsize', // Use the data-fullsize attribute for the full-size image in viewer
    },
    courses: [] as Array<{ img: string; fullsize: string; id: string; img_id: string }>,
  }),
  mounted() {
    this.isAdmin = useLoadingStore().userLoggedin;
    this.loadCourses();
    window.addEventListener('scroll', this.handleScroll, { passive: true });
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  },
  methods: {
    async loadCourses() {
      if (this.isLoading || this.noMoreImages) return;
      this.isLoading = true;

      try {
        const database = new Databases(appw);
        const storage = new Storage(appw);

        if (this.page === 0) {
          const { title_hu, title_en, title_rs } = await database.getDocument(
            config.website_db,
            config.gallery,
            this.id,
            [Query.select(['title_hu', 'title_en', 'title_rs'])]
          );

          const { language } = useLoadingStore();
          this.title =
            language === 'en'
              ? title_en
              : language === 'hu'
              ? title_hu
              : title_rs;
          document.title = this.title;
        }

        const { documents } = await database.listDocuments(
          config.website_db,
          config.album_images,
          [
            Query.equal('gallery', this.id),
            Query.offset(this.page * this.limit),
            Query.limit(this.limit),
          ]
        );

        if (!documents.length) {
          this.noMoreImages = true;
          return;
        }

        const newImages = await Promise.all(
          documents.map(async ({ $id, image_id }) => {
            // Low-resolution thumbnail for gallery (700px)
            const thumbnail = await storage.getFilePreview(
              config.gallery_pictures_storage,
              image_id,
              700, // Smaller width for thumbnails
              0,
              ImageGravity.Center,
              90,
              5,
              'FFFFFF',
              15,
              1,
              0,
              'FFFFFF',
              ImageFormat.Webp
            ).href;

            // Higher-resolution image for viewer (1200px)
            const fullsize = await storage.getFilePreview(
              config.gallery_pictures_storage,
              image_id,
              1200, // Larger width for full-size view
              0,
              ImageGravity.Center,
              90,
              5,
              'FFFFFF',
              15,
              1,
              0,
              'FFFFFF',
              ImageFormat.Webp
            ).href;

            return { img: thumbnail, fullsize, id: $id, img_id: image_id };
          })
        );

        this.courses.push(...newImages);
        this.images.push(...newImages.map(({ img }) => img));
        this.page++;
      } catch (error) {
        console.error('Failed to load courses:', error);
      } finally {
        this.isLoading = false;
      }
    },

    handleScroll() {
      if (this.isLoading || this.noMoreImages) return;

      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 200;

      if (nearBottom) {
        this.loadCourses();
      }
    },

    onImageLoad(src: string) {
      if (!this.showed.includes(src)) {
        this.showed.push(src);
      }
    },

    onImageError(src: string) {
      console.warn(`Image load error: ${src}`);
    },

    async deleteBrokenImages() {
      const brokenImages = this.images.filter((img) => !this.showed.includes(img));
      const storage = new Storage(appw);
      const database = new Databases(appw);

      try {
        await Promise.all(
          brokenImages.map(async (brokenImage) => {
            const course = this.courses.find(({ img }) => img === brokenImage);
            if (!course?.id || !course.img_id) return;

            await Promise.all([
              database.deleteDocument(config.website_db, config.album_images, course.id),
              storage.deleteFile(config.gallery_pictures_storage, course.img_id),
            ]);

            this.images = this.images.filter((img) => img !== brokenImage);
            this.courses = this.courses.filter(({ id }) => id !== course.id);
          })
        );
      } catch (error) {
        console.error('Failed to delete broken images:', error);
      }
    },

    editMode() {
      this.$router.push(`/admin/gallery-edit/${this.id}`);
    },

    inited() {
      // Viewer initialized
    },
  },
});
</script>

<style scoped>
.card {
  transition: background-color 0.15s ease-in-out;
}
</style>