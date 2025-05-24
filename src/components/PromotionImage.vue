<template>
  <div class="container mx-auto flex flex-wrap" style="min-height: 1020px;">
    <div class="m-auto p-5 w-full md:w-1/2">
      <img id="promo-img1" :src="img1" alt="promo_image" />
    </div>
    <div v-if="!promoimage2off" class="m-auto p-5 w-full md:w-1/2">
      <img id="promo-img2" :src="img2" alt="promo_image" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Databases, Storage } from "appwrite";
import { appw, config } from "@/appwrite";
import gsap from "gsap";

export default defineComponent({
  name: "PromoImage",
  data() {
    return {
      img1: "",
      img2: "",
      promoimage2off: false,
    };
  },
  mounted() {
    this.getPromo();
  },
  methods: {
    async getPromo() {
      const database = new Databases(appw);
      const storage = new Storage(appw);

      try {
        const [res1, res2, res3] = await Promise.all([
          database.getDocument(config.website_db, config.general_settings, "promoimage1"),
          database.getDocument(config.website_db, config.general_settings, "promoimage2"),
          database.getDocument(config.website_db, config.general_settings, "promoimage2_turn_off"),
        ]);

        // Ha "1", akkor letiltjuk a 2. képet
        this.promoimage2off = res3.setting_status === "1";

        this.img1 = storage.getFilePreview(
          config.website_images,
          res1.setting_data,
          550, 0, "center", 90, 5, "FFFFFF", 15, 1, 0, "FFFFFF", "webp"
        ).href;

        // csak akkor töltjük be és animáljuk, ha engedélyezett
        if (!this.promoimage2off) {
          this.img2 = storage.getFilePreview(
            config.website_images,
            res2.setting_data,
            550, 0, "center", 90, 5, "FFFFFF", 15, 1, 0, "FFFFFF", "webp"
          ).href;
        }

        // animációkat következő renderelés után indítjuk
        this.$nextTick(() => {
  gsap.fromTo(
    "#promo-img1",
    {
      opacity: 0,
      y: 100,
      scale: 0.8,
      rotation: -10,
    },
    {
      duration: 1.4,
      opacity: 1,
      y: 0,
      scale: 1,
      rotation: 0,
      ease: "back.out(1.7)",
    }
  );

  if (!this.promoimage2off) {
    gsap.fromTo(
      "#promo-img2",
      {
        opacity: 0,
        y: 100,
        scale: 0.8,
        rotation: 10,
      },
      {
        duration: 1.4,
        delay: 0.5,
        opacity: 1,
        y: 0,
        scale: 1,
        rotation: 0,
        ease: "back.out(1.7)",
      }
    );
  }
});

      } catch (err) {
        console.error("Promo image fetch error:", err);
      }
    }
  }
});
</script>

<style scoped>
/* Opcionálisan adhatsz hozzá CSS-t */
</style>
