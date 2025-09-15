<template>
  <div class="container mx-auto flex flex-wrap" style="min-height: 1020px;">
    <!-- Első kép container -->
    <div class="m-auto p-5 w-full md:w-1/2">
      <div class="image-container">
        <!-- Placeholder/skeleton mindig látható -->
        <div class="image-placeholder" :class="{ 'fade-out': img1Loaded }">
          <div class="skeleton-content">
            <div class="skeleton-shimmer"></div>
          </div>
        </div>
        
        <!-- Tényleges kép -->
        <img 
          id="promo-img1" 
          :src="img1" 
          alt="promo_image" 
          loading="lazy"
          decoding="async"
          @load="onImg1Load"
          @error="onImgError"
          class="promo-image"
          :class="{ 'fade-in': img1Loaded, 'error': img1Error }"
        />
        
        <!-- Error overlay -->
        <div v-if="img1Error" class="error-overlay">
          <div class="error-content">
            <svg class="w-12 h-12 text-gray-400 mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
            </svg>
            <p class="text-sm text-gray-500">{{ $t("img_loading_error") }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Második kép container -->
    <div v-if="!promoimage2off" class="m-auto p-5 w-full md:w-1/2">
      <div class="image-container">
        <!-- Placeholder/skeleton mindig látható -->
        <div class="image-placeholder" :class="{ 'fade-out': img2Loaded }">
          <div class="skeleton-content">
            <div class="skeleton-shimmer"></div>
          </div>
        </div>
        
        <!-- Tényleges kép -->
        <img 
          id="promo-img2" 
          :src="img2" 
          alt="promo_image" 
          loading="lazy"
          decoding="async"
          @load="onImg2Load"
          @error="onImgError"
          class="promo-image"
          :class="{ 'fade-in': img2Loaded, 'error': img2Error }"
        />
        
        <!-- Error overlay -->
        <div v-if="img2Error" class="error-overlay">
          <div class="error-content">
            <svg class="w-12 h-12 text-gray-400 mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
            </svg>
            <p class="text-sm text-gray-500">Kép betöltése sikertelen</p>
          </div>
        </div>
      </div>
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
      img1Loaded: false,
      img2Loaded: false,
      img1Error: false,
      img2Error: false,
      isDestroyed: false,
      retryCount: 0,
      maxRetries: 2,
    };
  },
  async created() {
    await this.getPromo();
  },
  beforeUnmount() {
    this.isDestroyed = true;
  },
  methods: {
    async getPromo() {
      const database = new Databases(appw);
      const storage = new Storage(appw);

      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 8000)
        );

        const promoOffResult = Promise.race([
          database.getDocument(config.website_db, config.general_settings, "promoimage2_turn_off"),
          timeoutPromise
        ]);

        const img1Result = Promise.race([
          database.getDocument(config.website_db, config.general_settings, "promoimage1"),
          timeoutPromise
        ]);

        const promoOffRes = await promoOffResult;
        this.promoimage2off = promoOffRes.setting_status === "1";

        const requests = [img1Result];
        if (!this.promoimage2off) {
          requests.push(
            Promise.race([
              database.getDocument(config.website_db, config.general_settings, "promoimage2"),
              timeoutPromise
            ])
          );
        }

        const results = await Promise.all(requests);
        const [img1Res, img2Res] = results;

        // Optimalizált képparaméterek
        this.img1 = storage.getFilePreview(
          config.website_images,
          img1Res.setting_data,
          800, 0, "center", 88, 5, "FFFFFF", 15, 1, 0, "FFFFFF", "webp"
        );

        if (!this.promoimage2off && img2Res) {
          this.img2 = storage.getFilePreview(
            config.website_images,
            img2Res.setting_data,
            800, 0, "center", 88, 5, "FFFFFF", 15, 1, 0, "FFFFFF", "webp"
          );
        }

      } catch (err) {
        console.error("Promo image fetch error:", err);
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          setTimeout(() => this.getPromo(), 1500 * this.retryCount);
        }
      }
    },

    onImg1Load() {
      if (this.isDestroyed) return;
      this.img1Loaded = true;
      this.img1Error = false;
      
      // Kis késleltetés a smooth átmenet érdekében
      setTimeout(() => {
        this.animateImage("#promo-img1", false);
      }, 100);
    },

    onImg2Load() {
      if (this.isDestroyed) return;
      this.img2Loaded = true;
      this.img2Error = false;
      
      // Kis késleltetés a smooth átmenet érdekében
      setTimeout(() => {
        this.animateImage("#promo-img2", true);
      }, 100);
    },

    onImgError(event: Event) {
      const target = event.target as HTMLImageElement;
      console.error("Image load error:", event);
      
      if (target.id === "promo-img1") {
        // Timer törlése
        if (this.img1Timer) {
          clearTimeout(this.img1Timer);
          this.img1Timer = null;
        }
        this.img1Error = true;
        this.img1Loaded = true; // A placeholder eltűntetéséhez
      } else if (target.id === "promo-img2") {
        // Timer törlése
        if (this.img2Timer) {
          clearTimeout(this.img2Timer);
          this.img2Timer = null;
        }
        this.img2Error = true;
        this.img2Loaded = true; // A placeholder eltűntetéséhez
      }
    },

    animateImage(selector: string, isSecond: boolean) {
      const element = document.querySelector(selector);
      if (!element || this.isDestroyed) return;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      if (prefersReducedMotion) {
        // Egyszerű fade animáció
        gsap.to(selector, { 
          duration: 0.6, 
          opacity: 1,
          ease: "power2.out"
        });
      } else {
        // Subtilis, elegáns animáció
        gsap.fromTo(
          selector,
          {
            scale: 0.95,
            opacity: 0.8,
          },
          {
            duration: 1.2,
            delay: isSecond ? 0.3 : 0,
            scale: 1,
            opacity: 1,
            ease: "power3.out",
          }
        );
      }
    }
  }
});
</script>

<style scoped>
/* Image container - fix méret a layout shift elkerülésére */
.image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 300 / 856; /* Fix arány */
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.image-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

/* Promo image - absolute pozíció a stabil layoutért */
.promo-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transform: scale(0.95);
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
}

.promo-image.fade-in {
  opacity: 1;
  transform: scale(1);
}

/* Image placeholder - fix pozíció és méret */
.image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  opacity: 1;
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

.image-placeholder.fade-out {
  opacity: 0;
  pointer-events: none;
}

/* Skeleton content */
.skeleton-content {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    #f0f2f5 0%,
    #e4e9f0 50%,
    #f0f2f5 100%
  );
  background-size: 200% 100%;
  overflow: hidden;
}

.skeleton-shimmer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.8) 50%,
    transparent 100%
  );
  animation: shimmer 2s ease-in-out infinite;
  transform: translateX(-100%);
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Error overlay */
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(249, 250, 251, 0.95);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  border-radius: 16px;
}

.error-content {
  text-align: center;
  padding: 20px;
}

/* Responsive improvements */
@media (max-width: 768px) {
  .image-container {
    aspect-ratio: 16 / 12;
    border-radius: 12px;
  }
  
  .image-container:hover {
    transform: none;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .image-placeholder {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d3748 100%);
  }
  
  .skeleton-content {
    background: linear-gradient(
      90deg,
      #2a2a2a 0%,
      #3a3a3a 50%,
      #2a2a2a 100%
    );
  }
  
  .error-overlay {
    background: rgba(26, 32, 44, 0.95);
  }
  
  .loading-dots span {
    background: #9ca3af;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .image-container,
  .promo-image,
  .image-placeholder {
    transition: none;
  }
  
  .skeleton-shimmer {
    animation: none;
  }
  
  .image-container:hover {
    transform: none;
  }
}

/* Focus states */
.image-container:focus-within {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
</style>