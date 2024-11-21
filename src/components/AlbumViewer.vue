<template>
    <section class="text-gray-600 body-font p-5" id="courses" style="min-height: 70vh;">
        <div class="container px-5 mx-auto ">
            <div class="flex flex-wrap w-full mb-20" v-if="caption">
                <div class="lg:w-1/3 w-full mb-6 lg:mb-0" >
                    <h1  class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white" >{{ title }}</h1>
                    <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                </div>
                
            </div>
            <div class=" mb-5 mt-5" v-if="admin">
                    <VBtn class="m-5"  @click="editmode">{{ $t("edit_gallery") }}</VBtn>
                    <VBtn class="m-5"  @click="deletebrokenimages">{{ $t("delete_broken_images") }}</VBtn>
            </div>
            <div class="flex flex-wrap -m-4">
                
                    
                
                </div>
            <viewer :images="images"
            @inited="inited"
            class="flex flex-wrap flex-row"
            ref="viewer"
            :options="options_for_image_viewer"
            >
            <template #default="scope">
            
                <div v-for="src in scope.images"  :key="src"  class="card card-compact cursor-pointer glass m-3  w-full  sm:w-1/5 md:w-1/5 lg:w-1/5  transition delay-150 bg-slate-100/30 backdrop-filter hover:bg-sky-400/60  dark:bg-slate-300/30 shadow-xl">
                <figure>
                    <img @load="loaded(src)" style="height: 272px;" class="object-contain " :src="src" />
                </figure>
                </div>
                
            </template>
            </viewer>
            </div>
            
       
    </section>
</template>
<script lang="ts">
import { Client, Databases, ID, Storage, Query } from "appwrite";
import { appw, config } from "@/appwrite";
import { convertifserbian, getStatus } from "@/lang";
import { useLoadingStore } from "@/stores/loading";
import gsap from "gsap";

export default {
  name: "SlideModules",
  components: {},
  mounted() {
    const cc = useLoadingStore();
    this.admin = cc.userLoggedin;
    this.load_courses_base();

    gsap.fromTo(
      ".becsuszo_kep",
      {
        opacity: 0,
        x: "150%",
      },
      {
        duration: 1.5,
        opacity: 1,
        x: 0,
      }
    );
  },
  data: () => ({
    admin: false,
    images: [],
    showed: [], // Track which images have successfully loaded
    title: "",
    options_for_image_viewer: { title: false },
    courses: [
      {
        img: "https://dummyimage.com/720x400",
        imga: "",
        subtitle: "SUBTITLE",
        title: "First",
        text: "Lorem ipsum dolor sit",
      },
    ],
  }),

  props: {
    mode: String,
    caption: Boolean,
    id: String,
  },

  methods: {
    async load_courses_base() {
      this.courses = [];
      this.images = [];

      const database = new Databases(appw);
      const storage = new Storage(appw);
      const cc = useLoadingStore();

      let k;
      k = await database.getDocument(
        config.website_db,
        config.gallery,
        this.id,
        [Query.select(["title_hu", "title_en", "title_rs"])]
      );
      let local = cc.language;

      if (local == "en") {
        this.title = k.title_en;
      } else if (local == "hu") {
        this.title = k.title_hu;
      } else if (local == "rs" || local == "sr") {
        this.title = convertifserbian(k.title_rs);
      }

      document.title = this.title;

      let l = await database.listDocuments(config.website_db, config.album_images, [
        Query.equal("gallery", this.id),
      ]);

      for (const element of l.documents) {
        let a = { img: "", id: "" };
        let b = { src: "", id: "" };

        a.img = await storage
          .getFilePreview(
            config.gallery_pictures_storage,
            element.image_id,
            968,
            0,
            "center",
            90,
            5,
            "FFFFFF",
            15,
            1,
            0,
            "FFFFFF",
            "webp"
          )
          .href;

        a.id = element.image_id; // Image ID from the storage

        b.src = await storage
          .getFilePreview(
            config.gallery_pictures_storage,
            element.image_id,
            700,
            0,
            "center",
            90,
            5,
            "FFFFFF",
            15,
            1,
            0,
            "FFFFFF",
            "webp"
          )
          .href;

        this.courses.push({ img: a.img, id: element.$id }); // Storing both image and document id
        this.images.push(a.img);
      }
    },

    isHidden(a) {
      return !a;
    },

    editmode() {
      this.$router.push("/admin/gallery-edit/" + this.id);
    },

    loaded(e) {
      this.showed.push(e); // Track images that successfully load
    },

    async deletebrokenimages() {
      // Filter the images that failed to load by comparing them to the `showed` array
      const brokenImages = this.images.filter((img) => !this.showed.includes(img));

      // Process broken images
      for (const brokenImage of brokenImages) {
        const storage = new Storage(appw);
        const database = new Databases(appw);
        const course = this.courses.find((course) => course.img === brokenImage);

        if (course && course.id) {
          try {
            // First delete the image record from the database (using the document id from the collection)
            await database.deleteDocument(config.website_db, config.album_images, course.id);

            // Then delete the image file from storage (using the image_id)
            await storage.deleteFile(config.gallery_pictures_storage, course.id);

            // Remove from local arrays
            this.images = this.images.filter((img) => img !== brokenImage);
            this.courses = this.courses.filter((c) => c.id !== course.id);
          } catch (error) {
            console.error("Failed to delete broken image: ", error);
          }
        }
      }
    },
  },
};
</script>



<style>
.becsuszo_kep
{

}
</style>