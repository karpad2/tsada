<template>
  <div class="relative h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    <!-- Animated Background Particles -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="particles-container">
        <div v-for="i in 30" :key="i" class="particle" :style="getParticleStyle(i)"></div>
      </div>
    </div>

    <!-- Main Slide Presentation -->
    <div class="absolute inset-0 flex justify-center items-center z-10" ref="slides">
      <transition name="slide-transform" mode="out-in">
        <div
          v-if="slides.length > 0"
          :key="currentSlide"
          class="flex justify-center items-center w-full h-full px-8 md:px-16"
        >
          <!-- Enhanced Slide Content Card -->
          <div class="presentation-card w-full max-w-7xl mx-auto">
            <div class="glass-card p-8 md:p-12 rounded-3xl shadow-2xl backdrop-blur-xl bg-white/10 border border-white/20">
              <div class="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                <!-- Image Section with Enhanced Styling -->
                <div v-if="slides[currentSlide].image" class="w-full lg:w-1/2 image-container">
                  <div class="relative overflow-hidden rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-500">
                    <div class="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 z-10"></div>
                    <img
                      :src="slides[currentSlide].image"
                      alt="Slide Image"
                      class="object-cover w-full h-96 lg:h-[500px]"
                      loading="lazy"
                    />
                  </div>
                </div>

                <!-- Text Content Section -->
                <div :class="[slides[currentSlide].image ? 'w-full lg:w-1/2' : 'w-full']" class="text-content">
                  <div class="space-y-6">
                    <h2 class="text-4xl md:text-6xl lg:text-7xl font-black mb-6 text-gradient slide-title" v-html="slides[currentSlide].title"></h2>
                    <div class="divider-line"></div>
                    <p class="text-xl md:text-3xl leading-relaxed text-white/90 slide-text" v-html="slides[currentSlide].text"></p>
                  </div>
                </div>
              </div>

              <!-- Slide Progress Indicator -->
              <div class="flex justify-center mt-8 gap-2">
                <div
                  v-for="(slide, index) in slides"
                  :key="index"
                  class="progress-dot"
                  :class="{ 'active': index === currentSlide }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- Enhanced News Ticker with Glassmorphism -->
    <div class="absolute bottom-0 w-full z-20 news-ticker-container backdrop-blur-md bg-gradient-to-r from-purple-900/40 via-pink-900/40 to-purple-900/40 border-t border-white/10">
      <div class="flex items-center py-6 px-8">
        <div class="logo-container flex-shrink-0 mr-6">
          <img src="@/assets/tsada_logo.png" alt="School Logo" class="h-16 w-auto drop-shadow-lg" loading="lazy" width="64" height="64" />
        </div>

        <div class="flex-1 overflow-hidden">
          <div class="marquee-wrapper">
            <div class="marquee-content">
              <span v-for="(news, index) in newsItems" :key="index" class="news-item text-2xl md:text-3xl font-semibold text-white mx-8">
                <span class="news-dot"></span>{{ news }}
              </span>
            </div>
          </div>
        </div>

        <div class="temp-display ml-6 flex-shrink-0">
          <div class="glass-pill px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
            <span class="text-2xl md:text-3xl font-bold text-white">
              {{ currentTemperature ? `${currentTemperature}°C` : $t("loading") }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Date and Time Display -->
    <div class="absolute bottom-24 right-8 z-20">
      <div class="glass-pill px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
        <div class="text-3xl md:text-4xl font-bold text-white tracking-wide">
          {{ currentDate }} <span class="text-purple-300">•</span> {{ currentTime }}
        </div>
      </div>
    </div>

    <!-- Enhanced Recent Events Section -->
    <div class="absolute top-8 right-8 w-96 z-20 events-container">
      <div class="glass-card p-6 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
        <h3 class="text-3xl md:text-4xl font-black mb-6 text-gradient-alt">
          {{ $t("events") }}
        </h3>

        <div class="events-list space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar">
          <div v-if="events.length === 0" class="text-lg text-white/70 text-center py-8">
            {{ $t("noevents") }}
          </div>

          <div v-for="(event, index) in events" :key="index" class="event-card">
            <div class="event-inner p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
              <!-- Event Image with Overlay -->
              <div class="relative overflow-hidden rounded-xl mb-3">
                <img
                  v-if="event.image"
                  v-lazy="event.image"
                  alt="Event Image"
                  class="w-full h-32 object-cover"
                />
                <div v-else class="w-full h-32 bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center rounded-xl">
                  <span class="text-white/50 text-sm">{{ $t("noimage") }}</span>
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              </div>

              <h4 class="text-xl font-bold text-white mb-2" v-html="event.title"></h4>
              <p class="text-purple-300 text-sm mb-2 flex items-center">
                <span class="mr-2">📅</span>{{ event.date }}
              </p>
              <p class="text-base text-white/80 line-clamp-3" v-html="event.description"></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted } from 'vue';
import moment from 'moment';
import { Databases, Query, Storage } from 'appwrite';
import { config, appw } from "@/appwrite"; 

export default {
  data() {
    return {
      currentTime: '',
      currentDate: '',
      currentTemperature: null,
      currentSlide: 0,
      slides: [],
      newsItems: [],
      events: [], 
      slideBackgrounds: ['#f87171', '#60a5fa', '#34d399', '#a78bfa', '#fbbf24'],
      storage: null
    }
  },
  created() {
    this.storage = new Storage(appw);  // Initialize the Storage instance here
  },
  methods: {
    getParticleStyle(index) {
      const colors = ['#8b5cf6', '#ec4899', '#6366f1', '#a855f7', '#d946ef'];
      const size = Math.random() * 4 + 2;
      const duration = Math.random() * 20 + 10;
      const delay = Math.random() * 5;

      return {
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: colors[index % colors.length],
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
        opacity: Math.random() * 0.5 + 0.3
      };
    },
    async updateTime() {
      try {
        const response = await fetch('https://share.tsada.edu.rs/__time__');
        if (!response.ok) {
          throw new Error('Failed to fetch time');
        }
        const data = await response.json();
        this.currentTime = moment(data.date).format('HH:mm:ss');
        this.currentDate = moment(data.date).format('YYYY-MM-DD');
      } catch (error) {
        console.warn("Falling back to local time due to error:", error);
        this.currentTime = moment().format('HH:mm:ss');
        this.currentDate = moment().format('YYYY-MM-DD');
      }
    },
    async fetchContent() {
      const database = new Databases(appw);
      try {
        const contentData = await database.listDocuments(config.website_db, config.tv_slides, [
          Query.orderAsc("sorrend")
        ]);
        
        this.slides = [];
        this.events = [];
        
        contentData.documents.forEach(doc => {
          const imageUrl = doc.image ? this.getImageUrl(doc.image) : null;
          if (doc.type === 'slide') {
            this.slides.push({
              title: doc.title,
              text: doc.text,
              image: imageUrl,
              order: doc.sorrend
            });
          } else if (doc.type === 'event') {
            this.events.push({
              title: doc.title,
              date: moment(doc.event_date).format('YYYY-MM-DD'),
              description: doc.description,
              image: imageUrl
            });
          }
        });

      } catch (error) {
        console.error("Error fetching content:", error);
      }
    },
    async fetchNewsItems() {
      const database = new Databases(appw);
      try {
        const newsData = await database.listDocuments(config.website_db, config.tv_slides);
        this.newsItems = newsData.documents.map(doc => doc.news_text);
      } catch (error) {
        console.error("Error fetching news:", error);
      }
    },
    async fetchTemperature() {
      const database = new Databases(appw);
      try {
        let k = await database.getDocument(config.website_db, config.general_settings, "temperature");
        this.currentTemperature = k.setting_data;
      } catch (error) {
        console.error("Error fetching temperature:", error);
        this.currentTemperature = "N/A"; // Fallback value
      }
    },
    getImageUrl(fileId) {
      return this.storage.getFileView(config.website_images, fileId).toString();
    }
  },
  mounted() {
    this.fetchContent();
    this.fetchNewsItems();
    this.fetchTemperature();

    this.updateTime();
    setInterval(this.updateTime, 1000);
    
    setInterval(() => {
      if (this.slides.length > 0) {
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
      }
    }, 15000);

    setInterval(this.fetchContent, 30000);
  }
}
</script>

<style scoped>
/* ============================================
   BACKGROUND PARTICLES ANIMATION
   ============================================ */
.particles-container {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.particle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(2px);
  animation: float-particle linear infinite;
}

@keyframes float-particle {
  0% {
    transform: translateY(0) translateX(0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) translateX(50px) scale(0.5);
    opacity: 0;
  }
}

/* ============================================
   GLASSMORPHISM EFFECTS
   ============================================ */
.glass-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow:
    0 8px 32px 0 rgba(31, 38, 135, 0.37),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.glass-card:hover {
  background: rgba(255, 255, 255, 0.12);
  box-shadow: 0 12px 48px 0 rgba(31, 38, 135, 0.5);
}

.glass-pill {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

/* ============================================
   SLIDE TRANSITIONS
   ============================================ */
.slide-transform-enter-active,
.slide-transform-leave-active {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-transform-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(30px);
}

.slide-transform-leave-to {
  opacity: 0;
  transform: scale(1.1) translateY(-30px);
}

/* ============================================
   TEXT ANIMATIONS
   ============================================ */
.slide-title {
  animation: slide-title-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-text {
  animation: slide-text-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s backwards;
}

@keyframes slide-title-in {
  from {
    opacity: 0;
    transform: translateY(-40px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes slide-text-in {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ============================================
   GRADIENT TEXT EFFECTS
   ============================================ */
.text-gradient {
  background: linear-gradient(135deg, #fff 0%, #e0e7ff 50%, #c7d2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
}

.text-gradient-alt {
  background: linear-gradient(135deg, #fbbf24 0%, #f472b6 50%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 4px 20px rgba(251, 191, 36, 0.3);
}

/* ============================================
   DIVIDER LINE
   ============================================ */
.divider-line {
  height: 4px;
  width: 100px;
  background: linear-gradient(90deg, #8b5cf6, #ec4899);
  border-radius: 2px;
  animation: divider-grow 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.4s backwards;
}

@keyframes divider-grow {
  from {
    width: 0;
    opacity: 0;
  }
  to {
    width: 100px;
    opacity: 1;
  }
}

/* ============================================
   PROGRESS DOTS
   ============================================ */
.progress-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.progress-dot.active {
  width: 40px;
  border-radius: 6px;
  background: linear-gradient(90deg, #8b5cf6, #ec4899);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.6);
}

/* ============================================
   NEWS TICKER MARQUEE
   ============================================ */
.marquee-wrapper {
  width: 100%;
  overflow: hidden;
}

.marquee-content {
  display: flex;
  animation: marquee-scroll 40s linear infinite;
  white-space: nowrap;
}

@keyframes marquee-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.news-item {
  display: inline-flex;
  align-items: center;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.news-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, #fbbf24, #f472b6);
  border-radius: 50%;
  margin-right: 12px;
  box-shadow: 0 0 10px rgba(251, 191, 36, 0.6);
}

/* Double the content for seamless loop */
.marquee-content::after {
  content: attr(data-content);
}

/* ============================================
   EVENTS SECTION
   ============================================ */
.event-card {
  animation: event-fade-in 0.5s ease-out backwards;
}

.event-card:nth-child(1) { animation-delay: 0.1s; }
.event-card:nth-child(2) { animation-delay: 0.2s; }
.event-card:nth-child(3) { animation-delay: 0.3s; }
.event-card:nth-child(4) { animation-delay: 0.4s; }

@keyframes event-fade-in {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ============================================
   CUSTOM SCROLLBAR
   ============================================ */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #8b5cf6, #ec4899);
  border-radius: 10px;
  transition: background 0.3s;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #7c3aed, #db2777);
}

/* ============================================
   IMAGE CONTAINER EFFECTS
   ============================================ */
.image-container {
  animation: image-reveal 1s cubic-bezier(0.4, 0, 0.2, 1) 0.3s backwards;
}

@keyframes image-reveal {
  from {
    opacity: 0;
    transform: scale(0.8) rotate(-2deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

/* ============================================
   RESPONSIVE ADJUSTMENTS
   ============================================ */
@media (max-width: 1024px) {
  .events-container {
    width: 300px;
  }

  .glass-card {
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .events-container {
    position: relative;
    width: 100%;
    top: auto;
    right: auto;
    margin: 1rem;
  }

  .presentation-card {
    padding: 1rem;
  }
}
</style>
